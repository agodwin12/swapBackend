const { Agences, BatteryAgence, BatteryValide } = require("../models");

// Fetch batteries for an agency using its unique_id
exports.getBatteriesForAgence = async (req, res) => {
    try {
        const { agenceId } = req.params;
        console.log("🔍 [DEBUG] Received API request for batteries in agency.");
        console.log("📩 [REQUEST PARAMS]:", { agenceId });

        // Step 1: Find the internal ID of the agency using agence_unique_id
        console.log(`🔎 [QUERY] Searching for agency with unique_id: ${agenceId}`);
        const agency = await Agences.findOne({
            where: { agence_unique_id: agenceId },
            attributes: ['id']
        });

        if (!agency) {
            console.log(`❌ [ERROR] No agency found for unique_id: ${agenceId}`);
            return res.status(404).json({ success: false, message: "Agency not found" });
        }

        const agenceInternalId = agency.id;
        console.log(`✅ [SUCCESS] Found internal Agency ID: ${agenceInternalId}`);

        // Step 2: Fetch all battery IDs associated with this agency from battery_agences
        console.log(`🔎 [QUERY] Fetching battery IDs linked to Agency ID: ${agenceInternalId}`);
        const batteryIds = await BatteryAgence.findAll({
            where: { id_agence: agenceInternalId },
            attributes: ['id_battery_valide'] // Only retrieve battery IDs
        });

        if (batteryIds.length === 0) {
            console.log(`⚠️ [INFO] No battery records found in battery_agences for Agency ID: ${agenceInternalId}`);
            return res.status(200).json({ success: true, batteries: [] });
        }

        // Extract battery ID values
        const batteryIdValues = batteryIds.map(battery => battery.id_battery_valide);
        console.log(`✅ [SUCCESS] Found ${batteryIdValues.length} battery IDs:`, batteryIdValues);

        // Step 3: Fetch the MAC IDs from batteries_valides using the extracted battery IDs
        console.log(`🔎 [QUERY] Fetching mac_id from batteries_valides using battery IDs`);
        const batteries = await BatteryValide.findAll({
            where: { id: batteryIdValues },
            attributes: ['id', 'mac_id'] // Retrieve both battery ID and mac_id
        });

        if (batteries.length === 0) {
            console.log(`⚠️ [INFO] No batteries found in batteries_valides matching these IDs.`);
            return res.status(200).json({ success: true, batteries: [] });
        }

        console.log(`✅ [SUCCESS] Retrieved ${batteries.length} batteries from batteries_valides.`);
        console.log("📦 [BATTERY DATA]:", batteries);

        // Step 4: Format response
        const formattedBatteries = batteries.map(battery => ({
            id: battery.id,
            mac_id: battery.mac_id
        }));

        return res.status(200).json({ success: true, batteries: formattedBatteries });

    } catch (error) {
        console.error("❌ [ERROR] Fetching agency batteries failed:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
