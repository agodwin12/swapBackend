const { BatteryValide, BatteryMotoUserAssociation, AssociationUserMoto, ValidatedUser, BmsData } = require("../models");
const cache = require("../utils/cache");

class BatteryController {
    static async getBatteryDetailsAndPrice(req, res) {
        try {
            console.log("🔍 [DEBUG] Received Request Body:", req.body);

            const { mac_id, outgoingSOC } = req.body;

            if (!mac_id || outgoingSOC == null) {
                console.error("❌ [ERROR] Missing required parameters");
                return res.status(400).json({ error: "mac_id and outgoingSOC are required" });
            }

            // 🔁 Check Cache First
            const cacheKey = `battery_info_${mac_id}`;
            const cachedData = cache.get(cacheKey);
            if (cachedData) {
                console.log(`📦 [CACHE HIT] Returning cached battery data for MAC ID: ${mac_id}`);
                return res.json(cachedData);
            }

            console.log(`📡 [INFO] Fetching battery with MAC ID: ${mac_id}`);

            const battery = await BatteryValide.findOne({ where: { mac_id } });
            if (!battery) {
                console.error("❌ [ERROR] Battery not found.");
                return res.status(404).json({ error: "Battery not found" });
            }

            console.log("✅ [SUCCESS] Battery found:", battery.id);

            const bmsData = await BmsData.findOne({
                where: { mac_id },
                order: [["timestamp", "DESC"]]
            });

            let incomingSOC = null;
            if (bmsData && bmsData.state) {
                try {
                    const stateJson = JSON.parse(bmsData.state);
                    incomingSOC = stateJson.SOC || null;
                    console.log("🔋 [INFO] Extracted incoming SOC:", incomingSOC);
                } catch (error) {
                    console.error("❌ [ERROR] Error parsing BMS state data:", error);
                    return res.status(500).json({ error: "Error parsing BMS data" });
                }
            }

            if (incomingSOC == null) {
                console.error("❌ [ERROR] SOC data not available.");
                return res.status(400).json({ error: "SOC data not available for this battery" });
            }

            console.log("👤 [INFO] Fetching associated user for battery ID:", battery.id);
            const association = await BatteryMotoUserAssociation.findOne({
                where: { battery_id: battery.id },
                order: [["id", "DESC"]],
                include: [
                    {
                        model: AssociationUserMoto,
                        as: "associationUserMoto",
                        include: [
                            {
                                model: ValidatedUser,
                                as: "user",
                                attributes: ["id", "nom", "prenom", "phone", "photo"]
                            }
                        ]
                    }
                ]
            });

            if (!association || !association.associationUserMoto || !association.associationUserMoto.user) {
                console.error("❌ [ERROR] No user found for this battery.");
                return res.status(404).json({ error: "No user found for this battery" });
            }

            const user = association.associationUserMoto.user;
            console.log("✅ [SUCCESS] User found:", user);

            // 💰 Calculate Swap Price
            let price = ((outgoingSOC - incomingSOC) * 1500) / 90;
            price = Math.min(price, 1500);
            const swapPrice = Math.ceil(price / 100) * 100;

            console.log(`💰 [INFO] Calculated Swap Price: ${swapPrice}`);

            const response = {
                mac_id,
                incomingSOC,
                outgoingSOC,
                swapPrice,
                user: {
                    id: user.id,
                    nom: user.nom,
                    prenom: user.prenom,
                    phone: user.phone,
                    photo: user.photo
                }
            };

            // 💾 Store in cache
            cache.set(cacheKey, response);
            console.log(`📦 [CACHE SET] Cached battery data for MAC ID: ${mac_id}`);

            return res.json(response);

        } catch (error) {
            console.error("❌ [ERROR] Internal server error:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
}

module.exports = BatteryController;
