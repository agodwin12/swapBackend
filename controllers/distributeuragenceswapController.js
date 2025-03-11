const db = require("../models");
const {
    BatteryDistributeur,
    BatteryAgence,
    HistoriqueAgence,
    BatteryValide,
    Distributeurs,
    Agences
} = db;
const sequelize = db.sequelize;

exports.processSwap = async (req, res) => {
    let { distributeurId, agenceId, outgoingMacIds, incomingMacIds, id_user_entrepot } = req.body;

    console.log("🔄 [INFO] Processing battery swap...");
    console.log("📦 Outgoing Battery MAC IDs:", outgoingMacIds);
    console.log("📥 Incoming Battery MAC IDs:", incomingMacIds);
    console.log("🚛 Distributeur Unique ID:", distributeurId);
    console.log("🏢 Agence Unique ID:", agenceId);

    // Start transaction to ensure atomic operations
    const transaction = await sequelize.transaction();

    try {
        // 🔍 Get the actual distributeur ID
        console.log("🔍 [DEBUG] Looking up distributeur with unique ID:", distributeurId);
        const distributeur = await Distributeurs.findOne({
            where: { distributeur_unique_id: distributeurId },
            attributes: ['id'],  // Retrieve only the ID
            transaction
        });

        if (!distributeur) {
            console.warn("⚠️ [WARNING] Distributeur not found with unique ID:", distributeurId);
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: "Distributeur not found"
            });
        }

        // ✅ Store actual database ID for distributeur
        const actualDistributeurId = distributeur.id;
        console.log("✅ [DEBUG] Found actual distributeur ID:", actualDistributeurId);

        // 🔍 Get the actual agence ID
        console.log("🔍 [DEBUG] Looking up agence with unique ID:", agenceId);
        const agence = await Agences.findOne({
            where: { agence_unique_id: agenceId },
            attributes: ['id'],  // Retrieve only the ID
            transaction
        });

        if (!agence) {
            console.warn("⚠️ [WARNING] Agence not found with unique ID:", agenceId);
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: "Agence not found"
            });
        }

        // ✅ Store actual database ID for agence
        const actualAgenceId = agence.id;
        console.log("✅ [DEBUG] Found actual agence ID:", actualAgenceId);

        // ✅ Ensure IDs are valid
        if (!actualDistributeurId || !actualAgenceId) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: "Distributeur ID and Agence ID are required"
            });
        }

        // ✅ Ensure arrays are properly initialized
        outgoingMacIds = Array.isArray(outgoingMacIds) ? outgoingMacIds : [];
        incomingMacIds = Array.isArray(incomingMacIds) ? incomingMacIds : [];

        console.log("🔍 [DEBUG] Looking up batteries with MAC IDs:", [...outgoingMacIds, ...incomingMacIds]);

        // ✅ Fetch battery IDs based on MAC IDs
        const batteries = await BatteryValide.findAll({
            where: { mac_id: [...outgoingMacIds, ...incomingMacIds] },
            attributes: ["mac_id", "id"],
            transaction
        });

        // ✅ Map MAC IDs to battery IDs
        const macIdToBatteryId = {};
        batteries.forEach(battery => {
            macIdToBatteryId[battery.mac_id] = battery.id;
        });

        // ✅ Convert MAC IDs to Battery IDs
        const validOutgoing = outgoingMacIds
            .map(macId => macIdToBatteryId[macId])
            .filter(Boolean);
        const validIncoming = incomingMacIds
            .map(macId => macIdToBatteryId[macId])
            .filter(Boolean);

        console.log("✅ [DEBUG] Valid battery IDs:", {
            outgoing: validOutgoing,
            incoming: validIncoming
        });

        // ✅ Validate batteries exist before proceeding
        if (validOutgoing.length === 0 && validIncoming.length === 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: "No valid batteries found for swap."
            });
        }

        /** 🔥 Step 1: Process outgoing batteries (from distributeur to agence) **/
        if (validOutgoing.length > 0) {
            console.log(`🔄 [DEBUG] Moving ${validOutgoing.length} batteries from distributeur to agence`);

            // ✅ Remove from `battery_distributeur`
            console.log("🗑️ [DELETE] Removing from battery_distributeur:", validOutgoing);
            await BatteryDistributeur.destroy({
                where: {
                    id_battery_valide: validOutgoing,
                    id_distributeur: actualDistributeurId
                },
                transaction
            });

            // ✅ Add to `battery_agence` using the actual agence ID
            const outgoingInsertData = validOutgoing.map(batteryId => ({
                id_agence: actualAgenceId,
                id_battery_valide: batteryId
            }));
            console.log("📝 [INSERT] Adding to battery_agence:", outgoingInsertData);

            await BatteryAgence.bulkCreate(outgoingInsertData, { transaction });
        }

        /** 🔥 Step 2: Process incoming batteries (from agence to distributeur) **/
        if (validIncoming.length > 0) {
            console.log(`🔄 [DEBUG] Moving ${validIncoming.length} batteries from agence to distributeur`);

            // ✅ Remove from `battery_agences`
            console.log("🗑️ [DELETE] Removing from battery_agences:", validIncoming);
            await BatteryAgence.destroy({
                where: {
                    id_battery_valide: validIncoming,
                    id_agence: actualAgenceId
                },
                transaction
            });

            // ✅ Add to `battery_distributeur`
            const incomingInsertData = validIncoming.map(batteryId => ({
                id_distributeur: actualDistributeurId,
                id_battery_valide: batteryId
            }));
            console.log("📝 [INSERT] Adding to battery_distributeur:", incomingInsertData);

            await BatteryDistributeur.bulkCreate(incomingInsertData, { transaction });
        }

        /** 🔥 Step 3: Record swap history in `historique_agences` **/
        const currentDate = new Date();
        const historyRecord = {
            id_agence: actualAgenceId, // Use actual agence ID
            id_entrepot: null, // ✅ NULL because swap is between distributeur and agence
            id_distributeur: actualDistributeurId, // ✅ Store actual database ID
            id_user_entrepot: id_user_entrepot || null, // ✅ Allow NULL
            bat_sortante: validOutgoing.length > 0 ? JSON.stringify(validOutgoing) : null, // ✅ Allow NULL
            bat_entrante: validIncoming.length > 0 ? JSON.stringify(validIncoming) : null, // ✅ Allow NULL
            type_swap: "livraison", // ✅ Type of swap
            date_time: currentDate,
            created_at: currentDate,
            updated_at: currentDate
        };

        console.log("📝 [DEBUG] Creating history record:", historyRecord);

        // ✅ Log SQL query before execution
        console.log("🔍 [SQL] INSERT INTO historique_agences:", JSON.stringify(historyRecord, null, 2));

        await HistoriqueAgence.create(historyRecord, { transaction });

        // ✅ Commit the transaction
        await transaction.commit();

        console.log("✅ [SUCCESS] Swap recorded successfully!");

        return res.status(200).json({
            success: true,
            message: "Swap processed successfully",
            details: {
                outgoingCount: validOutgoing.length,
                incomingCount: validIncoming.length,
                distributeurId: actualDistributeurId,
                agenceId: actualAgenceId, // Include actual agence ID
                timestamp: currentDate
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error("❌ [ERROR] Swap transaction failed:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};