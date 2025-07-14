const db = require("../models");
const axios = require("axios");

/**
 * ✅ Perform Swap Between Entrepôt and Agence
 */
const performSwap = async (req, res) => {
    console.log("🔍 [DEBUG] Full Request Body:", req.body);

    const { id_entrepot, id_agence, uniqueId, batteries_sortantes, batteries_entrantes, type_swap } = req.body;

    // ✅ Validate required fields
    if (!id_entrepot || !id_agence || !uniqueId) {
        console.log("❌ [ERROR] Missing Entrepôt, Agence, or User ID.");
        return res.status(400).json({ message: "Entrepôt ID, Agence ID, and User ID (uniqueId) are required." });
    }

    if (!batteries_sortantes.length && !batteries_entrantes.length) {
        console.log("❌ [ERROR] No batteries selected for swap.");
        return res.status(400).json({ message: "At least one battery must be selected for swap." });
    }

    console.log("✅ [DEBUG] All required fields are present.");

    const transaction = await db.sequelize.transaction();
    try {
        console.log("🔍 [DEBUG] Searching for User in users_entrepots...");

        // ✅ Retrieve user ID from `users_entrepots`
        const user = await db.UsersEntrepots.findOne({
            where: { users_entrepot_unique_id: uniqueId },
            attributes: ["id"]
        });

        if (!user) {
            console.log(`❌ [ERROR] User with Unique ID ${uniqueId} does not exist.`);
            return res.status(400).json({ message: `User ID ${uniqueId} not found in UsersEntrepots.` });
        }

        console.log(`✅ [DEBUG] Found User ID: ${user.id}`);
        console.log("🔍 [DEBUG] Validating batteries for swap...");

        // ✅ Validate that all batteries exist in `batteries_valides`
        const allBatteries = [...batteries_sortantes, ...batteries_entrantes];

        const existingBatteries = await db.BatteryValide.findAll({
            where: { mac_id: allBatteries },
            attributes: ["id", "mac_id"]
        });

        if (existingBatteries.length !== allBatteries.length) {
            console.log("❌ [ERROR] Some batteries do not exist in the system.");
            return res.status(400).json({ message: "Some batteries are not recognized in the system." });
        }

        const batteryMacToIdMap = new Map(existingBatteries.map(b => [b.mac_id, b.id]));
        const batteryIdToMacMap = new Map(existingBatteries.map(b => [b.id, b.mac_id]));

        const batteriesSortantesIds = batteries_sortantes.map(mac => batteryMacToIdMap.get(mac)).filter(id => id !== null);
        const batteriesEntrantesIds = batteries_entrantes.map(mac => batteryMacToIdMap.get(mac)).filter(id => id !== null);

        const batteriesSortantesMacs = batteriesSortantesIds.map(id => batteryIdToMacMap.get(id));
        const batteriesEntrantesMacs = batteriesEntrantesIds.map(id => batteryIdToMacMap.get(id));

        console.log("🔍 [DEBUG] Converted MAC IDs to Battery IDs:");
        console.log("  - Batteries Sortantes (MACs):", batteriesSortantesMacs);
        console.log("  - Batteries Entrantes (MACs):", batteriesEntrantesMacs);

        // ✅ Remove Outgoing Batteries from Entrepôt
        if (batteriesSortantesIds.length > 0) {
            await db.BatteryEntrepot.destroy({
                where: { id_battery_valide: batteriesSortantesIds },
                transaction
            });
            console.log("✅ [DEBUG] Removed outgoing batteries from Entrepôt.");
        }

        // ✅ Before adding to battery_agences, remove from battery_entrepots if exists
        if (batteriesSortantesIds.length > 0) {
            await db.BatteryEntrepot.destroy({
                where: { id_battery_valide: batteriesSortantesIds },
                transaction
            });

            await db.BatteryAgence.bulkCreate(
                batteriesSortantesIds.map(batteryId => ({
                    id_battery_valide: batteryId,
                    id_agence
                })),
                { transaction }
            );
            console.log("✅ [DEBUG] Cleaned from warehouse and inserted into agency.");
        }

        // ✅ Remove Incoming Batteries from Agence
        if (batteriesEntrantesIds.length > 0) {
            await db.BatteryAgence.destroy({
                where: { id_battery_valide: batteriesEntrantesIds, id_agence },
                transaction
            });
            console.log("✅ [DEBUG] Removed incoming batteries from Agence.");
        }

        // ✅ Before adding to battery_entrepots, remove from battery_agences if exists
        if (batteriesEntrantesIds.length > 0) {
            await db.BatteryAgence.destroy({
                where: { id_battery_valide: batteriesEntrantesIds },
                transaction
            });

            await db.BatteryEntrepot.bulkCreate(
                batteriesEntrantesIds.map(batteryId => ({
                    id_battery_valide: batteryId,
                    id_entrepot
                })),
                { transaction }
            );
            console.log("✅ [DEBUG] Cleaned from agency and inserted into warehouse.");
        }

        // ✅ Log swap in historique_entrepots
        await db.HistoriqueEntrepot.create({
            id_entrepot,
            id_agence,
            id_user_entrepot: user.id,
            bat_sortante: JSON.stringify(batteriesSortantesMacs),
            bat_entrante: JSON.stringify(batteriesEntrantesMacs),
            type_swap,
            created_at: new Date(),
            updated_at: new Date()
        }, { transaction });
        console.log("✅ [SUCCESS] Swap recorded in historique_entrepots.");

        // ✅ Log swap in historique_agences
        await db.HistoriqueAgence.create({
            id_agence,
            id_entrepot,
            bat_sortante: JSON.stringify(batteriesSortantesMacs),
            bat_entrante: JSON.stringify(batteriesEntrantesMacs),
            type_swap,
            date_time: new Date(),
            created_at: new Date(),
            updated_at: new Date()
        }, { transaction });
        console.log("✅ [SUCCESS] Swap recorded in historique_agences.");

        // ✅ Commit transaction
        await transaction.commit();

        // ✅ Optional: Send notification
        await sendSwapNotification(id_agence, batteriesSortantesMacs, batteriesEntrantesMacs);

        console.log("✅ [SUCCESS] Swap completed successfully.");
        return res.status(200).json({ message: "Swap completed successfully." });

    } catch (error) {
        await transaction.rollback();
        console.error("❌ [ERROR] Swap failed:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


/**
 * ✅ Function to Send SMS Notification to Agence
 */
const sendSwapNotification = async (id_agence, batteries_out, batteries_in) => {
    try {
        const agence = await db.Agences.findOne({
            where: { id: id_agence },
            attributes: ["id", "agence_unique_id", "nom_agence", "telephone"]
        });

        if (!agence) return;

        const message = `Swap completed! Batteries sent: ${batteries_out.length}, Batteries received: ${batteries_in.length}.`;

        console.log(`📩 [DEBUG] Sending SMS to Agence: ${agence.telephone}`);
        await axios.post("https://sms.api.com/send", {
            to: agence.telephone,
            message
        });
    } catch (error) {
        console.error("❌ [ERROR] SMS sending failed:", error);
    }
};

module.exports = { performSwap };
