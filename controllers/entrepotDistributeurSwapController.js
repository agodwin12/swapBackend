const {
    BatteryEntrepot,
    BatteryDistributeur,
    HistoriqueEntrepot,
    BatteryValide,
    UsersEntrepots,
    UsersAgences,
    sequelize
} = require("../models");

exports.processBatteryEntrepotSwap = async (req, res) => {
    const transaction = await sequelize.transaction(); // ✅ Start a transaction

    try {
        console.log("🔍 [DEBUG] Received Swap Request:", req.body);

        const { id_entrepot, id_distributeur, bat_sortante, bat_entrante, type_swap, id_user_entrepot } = req.body;

        console.log(`📡 [SWAP INIT] Entrepôt ID: ${id_entrepot}, Distributeur ID: ${id_distributeur}, User: ${id_user_entrepot}`);
        console.log(`🔄 [BATTERY SWAP] Outgoing: ${bat_sortante}, Incoming: ${bat_entrante}, Type: ${type_swap}`);

        if (!id_entrepot || !type_swap || !id_user_entrepot) {
            console.log("❌ [ERROR] Missing required parameters!");
            return res.status(400).json({ success: false, message: "Missing required parameters." });
        }

        // ✅ Step 1: Get `users_agences.id` from `users_entrepots`
        const userEntrepot = await UsersEntrepots.findOne({
            where: { users_entrepot_unique_id: id_user_entrepot },
            attributes: ["id"], // Get the `id` to map with `users_agences`
        });

        if (!userEntrepot) {
            console.log(`❌ [ERROR] User not found in users_entrepots with unique ID: ${id_user_entrepot}`);
            return res.status(404).json({ success: false, message: "User not found in users_entrepots" });
        }

        // ✅ Find the matching `users_agences.id`
        const userAgence = await UsersEntrepots.findOne({
            where: { id: userEntrepot.id },
            attributes: ["id"],
        });

        if (!userAgence) {
            console.log(`❌ [ERROR] User not found in users_agences with ID: ${userEntrepot.id}`);
            return res.status(404).json({ success: false, message: "User not found in users_agences" });
        }

        // ✅ Parse the battery lists (ensure they're arrays)
        const outgoingMacIds = bat_sortante ? JSON.parse(bat_sortante) : [];
        const incomingMacIds = bat_entrante ? JSON.parse(bat_entrante) : [];

        if (!Array.isArray(outgoingMacIds) || !Array.isArray(incomingMacIds)) {
            console.log("❌ [ERROR] Invalid format for bat_sortante or bat_entrante!");
            return res.status(400).json({ success: false, message: "Invalid format for battery lists." });
        }

        // ✅ Step 2: Convert `mac_id` to `id_battery_valide`
        const getBatteryIdFromMac = async (macId) => {
            const battery = await BatteryValide.findOne({ where: { mac_id: macId } });
            return battery ? battery.id : null;
        };

        const outgoingBatteries = await Promise.all(outgoingMacIds.map(getBatteryIdFromMac));
        const incomingBatteries = await Promise.all(incomingMacIds.map(getBatteryIdFromMac));

        // ✅ Step 3: Process Outgoing Batteries (Entrepôt → Distributeur)
        if (outgoingBatteries.length > 0) {
            console.log(`🚚 [PROCESSING] Removing ${outgoingBatteries.length} batteries from Entrepôt ${id_entrepot}`);
            for (const batteryId of outgoingBatteries) {
                if (!batteryId) {
                    console.log(`⚠️ [WARNING] Battery with mac_id not found in batteries_valides!`);
                    throw new Error("Battery with mac_id not found in batteries_valides");
                }

                console.log(`🔍 [CHECK] Looking for battery ID ${batteryId} in Entrepôt ${id_entrepot}`);

                const battery = await BatteryEntrepot.findOne({
                    where: { id_battery_valide: batteryId, id_entrepot }
                });

                if (!battery) {
                    console.log(`⚠️ [WARNING] Battery ${batteryId} not found in Entrepôt!`);
                    throw new Error(`Battery ${batteryId} not found in Entrepôt`);
                }

                await BatteryEntrepot.destroy({ where: { id_battery_valide: batteryId, id_entrepot }, transaction });

                console.log(`✅ [REMOVED] Battery ${batteryId} removed from Entrepôt ${id_entrepot}`);

                // ✅ Add to Distributeur
                await BatteryDistributeur.create({ id_battery_valide: batteryId, id_distributeur }, { transaction });
                console.log(`✅ [ADDED] Battery ${batteryId} added to Distributeur ${id_distributeur}`);
            }
        }

        // ✅ Step 4: Process Incoming Batteries (Distributeur → Entrepôt)
        if (incomingBatteries.length > 0) {
            console.log(`🔄 [PROCESSING] Receiving ${incomingBatteries.length} batteries from Distributeur ${id_distributeur}`);
            for (const batteryId of incomingBatteries) {
                if (!batteryId) {
                    console.log(`⚠️ [WARNING] Battery with mac_id not found in batteries_valides!`);
                    throw new Error("Battery with mac_id not found in batteries_valides");
                }

                console.log(`🔍 [CHECK] Looking for battery ID ${batteryId} in Distributeur ${id_distributeur}`);

                const battery = await BatteryDistributeur.findOne({
                    where: { id_battery_valide: batteryId, id_distributeur }
                });

                if (!battery) {
                    console.log(`⚠️ [WARNING] Battery ${batteryId} not found in Distributeur!`);
                    throw new Error(`Battery ${batteryId} not found in Distributeur`);
                }

                await BatteryDistributeur.destroy({ where: { id_battery_valide: batteryId, id_distributeur }, transaction });

                console.log(`✅ [REMOVED] Battery ${batteryId} removed from Distributeur ${id_distributeur}`);

                // ✅ Add to Entrepôt
                await BatteryEntrepot.create({ id_battery_valide: batteryId, id_entrepot }, { transaction });
                console.log(`✅ [ADDED] Battery ${batteryId} added back to Entrepôt ${id_entrepot}`);
            }
        }

        // ✅ Step 5: Save transaction in `historique_entrepots`
        await HistoriqueEntrepot.create({
            id_entrepot,
            id_distributeur: id_distributeur || null,
            id_user_entrepot: userAgence.id, // ✅ Save `users_agences.id` instead of `users_entrepots`
            bat_sortante: JSON.stringify(outgoingMacIds),
            bat_entrante: JSON.stringify(incomingMacIds),
            type_swap,
            created_at: new Date(),
            updated_at: new Date(),
        }, { transaction });

        // ✅ Commit transaction
        await transaction.commit();

        console.log(`✅ [SUCCESS] Swap completed successfully.`);
        return res.status(200).json({ success: true, message: "Swap successful!" });

    } catch (error) {
        console.error("🔥 [ERROR] Swap process failed:", error);

        // ✅ Rollback if any step fails
        await transaction.rollback();

        return res.status(500).json({ success: false, message: "Internal Server Error.", error: error.message });
    }
};
