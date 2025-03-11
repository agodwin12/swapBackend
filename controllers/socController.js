const { BmsData } = require("../models"); // Import the BmsData model

const SocController = {
    getLatestSOC: async (req, res) => {
        const { mac_id } = req.params;

        console.log(`🔍 [SOC REQUEST] Fetching SOC for mac_id: ${mac_id}`);

        try {
            // ✅ Fetch latest entry for the given mac_id
            const latestBmsData = await BmsData.findOne({
                where: { mac_id },
                order: [["timestamp", "DESC"]], // Get the most recent entry
            });

            console.log("📦 [LATEST BMS DATA]:", latestBmsData ? latestBmsData.toJSON() : "No Data Found");

            if (!latestBmsData) {
                console.log(`⚠️ [WARNING] No SOC data found for mac_id: ${mac_id}`);
                return res.status(404).json({ success: false, message: "No SOC data found for this battery." });
            }

            // ✅ Extract SOC from `state` column (assuming JSON format)
            let SOC = null;
            try {
                const stateData = JSON.parse(latestBmsData.state);
                console.log("📜 [PARSED STATE DATA]:", stateData);

                SOC = stateData.SOC || null;
            } catch (error) {
                console.error("❌ [ERROR] Error parsing state JSON:", error);
            }

            if (!SOC) {
                console.log(`⚠️ [WARNING] SOC data not found in state for mac_id: ${mac_id}`);
                return res.status(404).json({ success: false, message: "SOC data not found in state." });
            }

            console.log(`✅ [SUCCESS] Found SOC: ${SOC}% for mac_id: ${mac_id}`);

            return res.status(200).json({ success: true, SOC });
        } catch (error) {
            console.error("❌ [ERROR] Error fetching SOC:", error);
            return res.status(500).json({ success: false, message: "Internal Server Error", error });
        }
    }
};

module.exports = SocController;
