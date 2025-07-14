const { BmsData } = require("../models");
const cache = require("../utils/cache");

const SocController = {
    getLatestSOC: async (req, res) => {
        const { mac_id } = req.params;

        console.log(`🔍 [SOC REQUEST] Fetching SOC for mac_id: ${mac_id}`);

        const cachedSOC = cache.get(mac_id);
        if (cachedSOC) {
            console.log(`📦 [CACHE HIT] Returning cached SOC for ${mac_id}: ${cachedSOC}`);
            return res.status(200).json({ success: true, SOC: cachedSOC });
        }

        try {
            const latestBmsData = await BmsData.findOne({
                where: { mac_id },
                order: [["timestamp", "DESC"]],
            });

            console.log("📦 [LATEST BMS DATA]:", latestBmsData ? latestBmsData.toJSON() : "No Data Found");

            if (!latestBmsData) {
                return res.status(404).json({ success: false, message: "No SOC data found for this battery." });
            }

            let SOC = null;
            try {
                const stateData = JSON.parse(latestBmsData.state);
                console.log("📜 [PARSED STATE DATA]:", stateData);

                SOC = stateData.SOC || null;
            } catch (error) {
                console.error("❌ [ERROR] Error parsing state JSON:", error);
            }

            if (SOC === null) {
                return res.status(404).json({ success: false, message: "SOC data not found in state." });
            }

            const adjustedSOC = Math.max(0, Math.min(100, ((SOC - 10) * 100) / (100 - 10)));
            const formattedSOC = adjustedSOC.toFixed(2);

            // ✅ Cache only if the data is from the last 10 minutes
            const now = new Date();
            const dataTimestamp = new Date(latestBmsData.timestamp);
            const diffMinutes = (now - dataTimestamp) / (1000 * 60);
            if (diffMinutes <= 10) {
                cache.set(mac_id, formattedSOC, 1800); // Cache for 30 minutes
                console.log(`✅ [CACHED] SOC for ${mac_id}: ${formattedSOC}`);
            } else {
                console.log(`⚠️ [SKIPPED CACHE] Data is older than 10 minutes (${diffMinutes.toFixed(2)} mins)`);
            }

            return res.status(200).json({ success: true, SOC: formattedSOC });
        } catch (error) {
            console.error("❌ [ERROR] Error fetching SOC:", error);
            return res.status(500).json({ success: false, message: "Internal Server Error", error });
        }
    }
};

module.exports = SocController;
