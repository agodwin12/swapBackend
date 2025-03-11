const { BatteryAgence, BatteryValide, BmsData } = require("../models");

exports.getBatteriesForAgence = async (req, res) => {
    try {
        const { agenceId } = req.params;
        console.log(`🌍 [API CALL] Fetching batteries for Agence ID: ${agenceId}`);

        if (!agenceId || agenceId === "Unknown") {
            console.log("❌ [ERROR] Invalid Agence ID received!");
            return res.status(400).json({ success: false, message: "Invalid Agence ID." });
        }

        // ✅ Fetch batteries for the Agence and include MAC ID
        const batteries = await BatteryAgence.findAll({
            where: { id_agence: agenceId },
            attributes: ["id"],
            include: [
                {
                    model: BatteryValide,
                    as: "battery",
                    attributes: ["mac_id"],
                }
            ],
        });

        console.log(`🔎 [QUERY RESULT] Found ${batteries.length} batteries for Agence ID: ${agenceId}`);

        if (!batteries || batteries.length === 0) {
            console.log("⚠️ [INFO] No batteries found for this Agence.");
            return res.status(200).json({ success: true, batteries: [] });
        }

        // ✅ Extract mac_ids for SOC & seting query
        const macIds = batteries.map(b => b.battery?.mac_id).filter(Boolean);
        console.log(`🔍 [QUERY] Fetching latest SOC and seting for mac_ids: ${macIds}`);

        // ✅ Fetch only the LATEST record for each mac_id
        const socResults = await BmsData.findAll({
            where: { mac_id: macIds },
            attributes: ["mac_id", "state"],
            order: [["mac_id", "ASC"], ["id", "DESC"]],
        });

        console.log("📊 [LATEST SOC & seting RESULT]:", JSON.stringify(socResults, null, 2));

        // ✅ Convert SOC & seting results into a dictionary
        const dataMap = {};
        socResults.forEach(entry => {
            let parsedState = {};

            try {
                parsedState = entry.state ? JSON.parse(entry.state) : {};
            } catch (error) {
                console.error(`❌ [ERROR] Failed to parse state JSON for mac_id ${entry.mac_id}:`, error);
            }

            dataMap[entry.mac_id] = {
                SOC: parsedState.SOC ? `${parsedState.SOC}%` : "N/A"
            };
        });

        // ✅ Attach SOC & seting to each battery
        const formattedBatteries = batteries.map(battery => {
            const macId = battery.battery ? battery.battery.mac_id : "Unknown";
            const { SOC } = dataMap[macId] || { SOC: "Cannot fetch SOC" };

            return {
                id: battery.id,
                mac_id: macId,
                SOC
            };
        });

        console.log("📦 [FINAL RESPONSE]:", JSON.stringify(formattedBatteries, null, 2));

        return res.status(200).json({ success: true, batteries: formattedBatteries });

    } catch (error) {
        console.error("🔥 [ERROR] Fetching batteries failed:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};
