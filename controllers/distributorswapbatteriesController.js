const { BatteryDistributeur, BatteryValide, Distributeurs } = require("../models");

exports.getDistributeurSwapBatteries = async (req, res) => {
    const { distributeurUniqueId } = req.params;
    console.log(`🔍 [DEBUG] Searching for distributeur with ID: ${distributeurUniqueId}`);

    try {
        // Step 1: Find the distributeur ID using distributeur_unique_id
        const distributeur = await Distributeurs.findOne({
            where: { distributeur_unique_id: distributeurUniqueId },
            attributes: ["id"], // Retrieve only the ID
        });

        if (!distributeur) {
            console.log("⚠️ [ERROR] Distributeur not found in database.");
            return res.status(404).json({ success: false, message: "Distributeur not found" });
        }

        console.log(`✅ [DEBUG] Found Distributeur ID: ${distributeur.id}`);

        // Step 2: Use the retrieved distributeur.id to find batteries in BatteryDistributeur table
        const batteries = await BatteryDistributeur.findAll({
            where: { id_distributeur: distributeur.id },
            attributes: ["id"], // Fetch only necessary fields
            include: [{
                model: BatteryValide,
                as: "batteryForDistributeur",
                attributes: ["mac_id"], // Fetch mac_id from BatteryValide
            }],
        });

        console.log(`🔎 [QUERY RESULT] Found ${batteries.length} batteries for Distributeur ID: ${distributeur.id}`);

        // Step 3: Format the response
        const formattedBatteries = batteries.map((battery) => ({
            id: battery.id,
            mac_id: battery.batteryForDistributeur?.mac_id || "Unknown",
        }));

        console.log("📦 [FORMATTED RESPONSE]:", JSON.stringify(formattedBatteries, null, 2));

        return res.status(200).json({ success: true, batteries: formattedBatteries });

    } catch (error) {
        console.error("🔥 [ERROR] Fetching Distributeur batteries failed:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
