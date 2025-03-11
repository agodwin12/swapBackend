const db = require("../models");
const { HistoriqueAgence, BatteryValide, Distributeurs, Agences } = db; // ✅ Added Agences model

exports.getDistributeurHistory = async (req, res) => {
    try {
        const { distributeurId } = req.params;

        console.log("🔍 [DEBUG] Received Request: GET /api/historique/distributeur/", distributeurId);

        if (!distributeurId) {
            console.warn("⚠️ [ERROR] No distributeurId provided in request.");
            return res.status(400).json({
                success: false,
                message: "Distributeur ID is required."
            });
        }

        // ✅ Step 1: Find the actual distributeur ID from unique ID
        console.log("🔍 [INFO] Looking up distributeur in database...");
        const distributeur = await Distributeurs.findOne({
            where: { distributeur_unique_id: distributeurId },
            attributes: ["id"]
        });

        if (!distributeur) {
            console.warn("⚠️ [WARNING] No distributeur found with unique ID:", distributeurId);
            return res.status(404).json({
                success: false,
                message: "Distributeur not found."
            });
        }

        const actualDistributeurId = distributeur.id;
        console.log("✅ [DEBUG] Found distributeur ID:", actualDistributeurId);

        // ✅ Step 2: Fetch history records from `historique_agences`
        console.log(`📜 [INFO] Fetching history for distributeur ID: ${actualDistributeurId}`);
        const historyRecords = await HistoriqueAgence.findAll({
            where: { id_distributeur: actualDistributeurId },
            attributes: [
                "id", "id_agence", "bat_sortante", "bat_entrante",
                "type_swap", "date_time", "created_at", "updated_at"
            ],
            order: [["date_time", "DESC"]]
        });

        if (!historyRecords || historyRecords.length === 0) {
            console.warn("⚠️ [WARNING] No history records found for distributeur ID:", actualDistributeurId);
            return res.status(404).json({
                success: false,
                message: "No history found for this distributeur."
            });
        }

        console.log(`✅ [SUCCESS] Found ${historyRecords.length} history records.`);

        // ✅ Step 3: Extract all agence IDs from history
        const agenceIds = [...new Set(historyRecords.map(record => record.id_agence))];
        console.log("🏢 [INFO] Extracted Agence IDs:", agenceIds);

        // ✅ Step 4: Fetch Agence details
        console.log("🔍 [INFO] Fetching agence details...");
        const agences = await Agences.findAll({
            where: { id: agenceIds },
            attributes: ["id", "nom_agence", "nom_proprietaire", "ville"]
        });

        const agenceMap = {};
        agences.forEach(agence => {
            agenceMap[agence.id] = {
                nom_agence: agence.nom_agence,
                nom_proprietaire: agence.nom_proprietaire,
                ville: agence.ville
            };
        });

        console.log("✅ [DEBUG] Agence ID to Details Mapping:", agenceMap);

        // ✅ Step 5: Extract all battery IDs from history
        let allBatteryIds = [];
        historyRecords.forEach(record => {
            const outgoingIds = record.bat_sortante ? JSON.parse(record.bat_sortante) : [];
            const incomingIds = record.bat_entrante ? JSON.parse(record.bat_entrante) : [];
            allBatteryIds = [...allBatteryIds, ...outgoingIds, ...incomingIds];
        });

        // ✅ Remove duplicates
        allBatteryIds = [...new Set(allBatteryIds)];
        console.log("🔍 [INFO] Extracted Battery IDs for lookup:", allBatteryIds);

        let batteryIdToMac = {};
        if (allBatteryIds.length > 0) {
            // ✅ Step 6: Fetch MAC IDs for these batteries
            console.log("🔍 [INFO] Fetching MAC IDs for extracted battery IDs...");
            const batteries = await BatteryValide.findAll({
                where: { id: allBatteryIds },
                attributes: ["id", "mac_id"]
            });

            batteries.forEach(battery => {
                batteryIdToMac[battery.id] = battery.mac_id;
            });

            console.log("✅ [DEBUG] Battery ID to MAC ID mapping:", batteryIdToMac);
        }

        // ✅ Step 7: Format the response with Agence Details and MAC IDs
        const formattedHistory = historyRecords.map(record => ({
            id: record.id,
            id_agence: record.id_agence,
            nom_agence: agenceMap[record.id_agence]?.nom_agence || "Unknown Agence",
            nom_proprietaire: agenceMap[record.id_agence]?.nom_proprietaire || "Unknown Proprietaire",
            ville: agenceMap[record.id_agence]?.ville || "Unknown Ville",
            type_swap: record.type_swap,
            date_time: record.date_time,
            created_at: record.created_at,
            updated_at: record.updated_at,
            bat_sortante: record.bat_sortante ? JSON.parse(record.bat_sortante).map(id => ({
                id,
                mac_id: batteryIdToMac[id] || "Unknown MAC"
            })) : [],
            bat_entrante: record.bat_entrante ? JSON.parse(record.bat_entrante).map(id => ({
                id,
                mac_id: batteryIdToMac[id] || "Unknown MAC"
            })) : []
        }));

        console.log("✅ [SUCCESS] Returning formatted history data.");
        return res.status(200).json({
            success: true,
            history: formattedHistory
        });

    } catch (error) {
        console.error("❌ [ERROR] Failed to fetch distributeur history:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};
