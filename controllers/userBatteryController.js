const {
    BatteryValide,
    BatteryMotoUserAssociation,
    AssociationUserMoto,
    ValidatedUser,
    BmsData
} = require("../models");

const cache = require("../utils/cache");

class BatteryController {
    static async getBatteryDetailsAndPrice(req, res) {
        try {
            console.log("🔍 [DEBUG] Received Request Body:", req.body);

            const { mac_id, outgoingSOC, outgoing_mac_id } = req.body;

            if (!mac_id || outgoingSOC == null || !outgoing_mac_id) {
                console.error("❌ [ERROR] Missing required parameters");
                return res.status(400).json({ error: "mac_id, outgoingSOC, and outgoing_mac_id are required" });
            }

            // 🔁 Cache check
            const cacheKey = `battery_info_${mac_id}`;
            const cachedData = cache.get(cacheKey);
            if (cachedData) {
                console.log(`📦 [CACHE HIT] Returning cached battery data for MAC ID: ${mac_id}`);
                return res.json(cachedData);
            }

            // 🔋 Incoming battery
            console.log(`📡 [INFO] Fetching INCOMING battery with MAC ID: ${mac_id}`);
            const battery = await BatteryValide.findOne({ where: { mac_id } });
            if (!battery) {
                console.error("❌ [ERROR] Incoming battery not found.");
                return res.status(404).json({ error: "Incoming battery not found" });
            }

            const bmsDataIncoming = await BmsData.findOne({
                where: { mac_id },
                order: [["timestamp", "DESC"]]
            });

            let incomingSOC = null;
            let incomingSYLA = null;

            if (bmsDataIncoming?.state) {
                try {
                    const stateJson = JSON.parse(bmsDataIncoming.state);
                    incomingSOC = stateJson.SOC ?? null;
                    incomingSYLA = parseFloat(stateJson.SYLA ?? 0);

                    console.log("🔋 [INFO] Incoming SOC:", incomingSOC);
                    console.log("⚙️ [INFO] Incoming SYLA:", incomingSYLA);
                } catch (error) {
                    console.error("❌ [ERROR] Failed to parse incoming BMS data:", error);
                    return res.status(500).json({ error: "Error parsing incoming BMS data" });
                }
            }

            if (incomingSOC == null) {
                return res.status(400).json({ error: "SOC not found for incoming battery" });
            }

            // ⚡ Outgoing battery SYLA
            let outgoingSYLA = null;
            try {
                const bmsDataOutgoing = await BmsData.findOne({
                    where: { mac_id: outgoing_mac_id },
                    order: [["timestamp", "DESC"]]
                });

                if (bmsDataOutgoing?.state) {
                    const stateJson = JSON.parse(bmsDataOutgoing.state);
                    outgoingSYLA = parseFloat(stateJson.SYLA ?? 100);
                    console.log("⚡ [INFO] Outgoing SYLA:", outgoingSYLA);
                } else {
                    outgoingSYLA = 100;
                    console.warn("⚠️ [WARN] No BMS state for outgoing battery — using default SYLA = 100");
                }
            } catch (err) {
                console.error("❌ [ERROR] Failed to fetch outgoing SYLA:", err);
                outgoingSYLA = 100;
            }

            // 👤 User
            console.log("👤 [INFO] Fetching user for battery ID:", battery.id);
            const association = await BatteryMotoUserAssociation.findOne({
                where: { battery_id: battery.id },
                order: [["id", "DESC"]],
                include: [
                    {
                        model: AssociationUserMoto,
                        as: "association",
                        include: [
                            {
                                model: ValidatedUser,
                                as: "validatedUser",
                                attributes: ["id", "nom", "prenom", "phone", "photo"]
                            }
                        ]
                    }
                ]
            });

            if (!association?.association?.validatedUser) {
                console.error("❌ [ERROR] No user found for this battery.");
                return res.status(404).json({ error: "No user associated with this battery" });
            }

            const user = association.association.validatedUser;
            console.log("✅ [SUCCESS] User found:", user);

            // 💰 Price calculation
            let basePrice = ((outgoingSOC - incomingSOC) * 1500) / 90;
            basePrice = Math.min(basePrice, 1500);

            const adjustedPrice = basePrice * (outgoingSYLA / Math.max(outgoingSYLA, 50));
            const swapPrice = Math.ceil(adjustedPrice / 100) * 100;

            console.log(`💰 [INFO] Base price: ${basePrice}`);
            console.log(`💡 [INFO] Adjusted by SYLA (${outgoingSYLA}): ${adjustedPrice}`);
            console.log(`✅ [INFO] Final Swap Price: ${swapPrice}`);

            const response = {
                mac_id,
                outgoing_mac_id,
                incomingSOC,
                incomingSYLA,
                outgoingSOC,
                outgoingSYLA,
                swapPrice,
                user: {
                    id: user.id,
                    nom: user.nom,
                    prenom: user.prenom,
                    phone: user.phone,
                    photo: user.photo
                }
            };

            cache.set(cacheKey, response);
            console.log(`📦 [CACHE SET] Cached response for MAC ID: ${mac_id}`);

            return res.json(response);

        } catch (error) {
            console.error("❌ [ERROR] Internal server error:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
}

module.exports = BatteryController;
