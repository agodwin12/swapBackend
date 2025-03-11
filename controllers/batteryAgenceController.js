const { BatteryAgence, BatteryValide } = require("../models");

exports.getBatteriesForAgence = async (req, res) => {
    console.log("🚀 [DEBUG] Received API request for /api/batteries/agence/:agenceId");
    console.log("🔍 [DEBUG] Request Params:", req.params);

    try {
        const { agenceId } = req.params;

        console.log(`🌍 [API CALL] Fetching batteries for Agence ID: ${agenceId}`);

        if (!agenceId || agenceId === "Unknown") {
            console.log("❌ [ERROR] Invalid Agence ID received!");
            return res.status(400).json({ success: false, message: "Invalid Agence ID." });
        }

        console.log("🔎 [QUERY] Searching for batteries linked to Agence...");

        // ✅ Fetch batteries for the Agence and include details from `BatteryValide`
        const batteries = await BatteryAgence.findAll({
            where: { id_agence: agenceId },
            attributes: ["id"], // Fetch only necessary fields
            include: [
                {
                    model: BatteryValide,
                    as: "battery",
                    attributes: ["mac_id"], // ✅ Fetch MAC ID from BatteryValide
                }
            ],
        });

        console.log("📝 [RAW SQL QUERY] Fetching batteries for Agence ID:", agenceId);
        console.log(`🔎 [QUERY RESULT] Found ${batteries.length} batteries for Agence ID: ${agenceId}`);
        console.log("📝 [RAW DATA]:", JSON.stringify(batteries, null, 2));

        if (!batteries || batteries.length === 0) {
            console.log("⚠️ [INFO] No batteries found for this Agence.");
            return res.status(200).json({ success: true, batteries: [] });
        }

        console.log("🔄 [PROCESSING] Formatting battery data...");

        // ✅ Format response properly
        const formattedBatteries = batteries.map((battery) => ({
            id: battery.id,
            mac_id: battery.battery ? battery.battery.mac_id : "Unknown",
        }));

        console.log(`✅ [SUCCESS] Retrieved ${formattedBatteries.length} batteries for Agence.`);
        console.log("📦 [FORMATTED RESPONSE]:", JSON.stringify(formattedBatteries, null, 2));

        console.log("🚀 [RESPONSE SENT] Status 200 OK - Returning formatted battery data.");
        return res.status(200).json({ success: true, batteries: formattedBatteries });

    } catch (error) {
        console.error("🔥 [ERROR] Fetching batteries failed:", error);
        console.log("🚨 [ERROR RESPONSE SENT] Status 500 - Internal Server Error");

        return res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};
