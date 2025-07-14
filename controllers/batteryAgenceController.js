const { BatteryAgence, BatteryValide, BmsData } = require("../models");
const cache = require("../utils/cache");

exports.getBatteriesForAgence = async (req, res) => {
    console.log("🚀 [DEBUG] Received API request for /api/batteries/agence/:agenceId");
    console.log("🔍 [DEBUG] Request Params:", req.params);

    try {
        const { agenceId } = req.params;

        if (!agenceId || agenceId === "Unknown") {
            console.log("❌ [ERROR] Invalid Agence ID received!");
            return res.status(400).json({ success: false, message: "Invalid Agence ID." });
        }

        console.log("🔎 [DB QUERY] Fetching batteries from database...");
        const batteries = await BatteryAgence.findAll({
            where: { id_agence: agenceId },
            attributes: ["id"],
            include: [{
                model: BatteryValide,
                as: "battery",
                attributes: ["mac_id"]
            }]
        });

        if (!batteries || batteries.length === 0) {
            console.log("⚠️ [INFO] No batteries found in this agence.");
            return res.status(200).json({ success: true, batteries: [], stats: { charged: 0, low: 0, total: 0 } });
        }

        let charged = 0;
        let low = 0;

        const formattedBatteries = await Promise.all(
            batteries.map(async (battery) => {
                const mac_id = battery?.battery?.mac_id || "Unknown";
                let formattedSOC = null;

                if (mac_id !== "Unknown") {
                    const cachedSOC = cache.get(mac_id);
                    if (cachedSOC) {
                        formattedSOC = cachedSOC;
                        console.log(`📦 [SOC CACHE HIT] ${mac_id}: ${formattedSOC}`);
                    } else {
                        try {
                            const latestBmsData = await BmsData.findOne({
                                where: { mac_id },
                                order: [["timestamp", "DESC"]],
                            });

                            if (latestBmsData) {
                                const now = new Date();
                                const diffMinutes = (now - new Date(latestBmsData.timestamp)) / 60000;

                                if (diffMinutes <= 10) {
                                    const stateData = JSON.parse(latestBmsData.state);
                                    const SOC = stateData?.SOC;

                                    if (SOC !== undefined && SOC !== null) {
                                        const adjustedSOC = Math.max(0, Math.min(100, ((SOC - 10) * 100) / 90));
                                        formattedSOC = adjustedSOC.toFixed(2);
                                        cache.set(mac_id, formattedSOC, 120); // cache for 2 minutes
                                        console.log(`✅ [SOC CACHED] ${mac_id}: ${formattedSOC}`);
                                    }
                                } else {
                                    console.log(`⚠️ [STALE DATA] ${mac_id} is ${diffMinutes.toFixed(1)} mins old`);
                                }
                            } else {
                                console.log(`❌ [NO BMS DATA] for ${mac_id}`);
                            }
                        } catch (err) {
                            console.log(`❌ [ERROR] Fetching SOC for ${mac_id}: ${err.message}`);
                        }
                    }
                }

                // Count stats if SOC is valid
                if (formattedSOC !== null && !isNaN(parseFloat(formattedSOC))) {
                    const socValue = parseFloat(formattedSOC);
                    if (socValue >= 94) charged++;
                    else low++;
                }

                return {
                    id: battery.id,
                    mac_id,
                    SOC: formattedSOC !== null ? formattedSOC : "Unavailable"
                };
            })
        );

        const stats = {
            charged,
            low,
            total: formattedBatteries.length
        };

        console.log("📊 [FINAL STATS]", stats);

        console.log("✅ [RESPONSE SENT] Returning batteries and stats");
        return res.status(200).json({
            success: true,
            batteries: formattedBatteries,
            stats
        });

    } catch (error) {
        console.error("🔥 [FATAL ERROR] While fetching batteries:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
