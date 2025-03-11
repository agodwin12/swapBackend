const { BatteryValide, BatteryMotoUserAssociation, AssociationUserMoto, ValidatedUser, BmsData } = require("../models");

class BatteryController {
    static async getBatteryDetailsAndPrice(req, res) {
        try {
            console.log("🔍 [DEBUG] Received Request Body:", req.body);

            const { mac_id, outgoingSOC } = req.body;

            if (!mac_id || outgoingSOC == null) {
                console.error("❌ [ERROR] Missing required parameters");
                return res.status(400).json({ error: "mac_id and outgoingSOC are required" });
            }

            console.log(`📡 [INFO] Fetching battery with MAC ID: ${mac_id}`);

            // 1️⃣ Fetch Battery
            const battery = await BatteryValide.findOne({ where: { mac_id } });
            if (!battery) {
                console.error("❌ [ERROR] Battery not found.");
                return res.status(404).json({ error: "Battery not found" });
            }

            console.log("✅ [SUCCESS] Battery found:", battery.id);

            // 2️⃣ Get Latest SOC from `bms_data`
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

            // 3️⃣ Fetch Associated User (Fixed Query)
            console.log("👤 [INFO] Fetching associated user for battery ID:", battery.id);
            const association = await BatteryMotoUserAssociation.findOne({
                where: { battery_id: battery.id },
                order: [["id", "DESC"]], // Get latest association
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

            // 4️⃣ Calculate Swap Price
            let price = ((outgoingSOC - incomingSOC) * 2000) / 93;
            price = Math.min(price, 2000);
            const swapPrice = Math.ceil(price / 50) * 50; // Round to nearest 50

            console.log(`💰 [INFO] Calculated Swap Price: ${swapPrice}`);

            // 5️⃣ Return Response
            return res.json({
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
            });

        } catch (error) {
            console.error("❌ [ERROR] Internal server error:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
}

module.exports = BatteryController;
