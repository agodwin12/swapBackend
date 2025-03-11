const { Distributeurs } = require("../models");

exports.getDistributeurProfile = async (req, res) => {
    try {
        const { distributeur_unique_id } = req.params;
        console.log(`🔍 [DEBUG] Fetching profile for Distributeur Unique ID: ${distributeur_unique_id}`);

        // ✅ Fetch Distributeur details using `distributeur_unique_id`
        const distributeur = await Distributeurs.findOne({
            where: { distributeur_unique_id },
            attributes: [
                "distributeur_unique_id",
                "nom",
                "prenom",
                "ville",
                "quartier",
                "phone",  // ✅ Corrected field from "telephone" to "phone"
                "email",
            ],
        });

        if (!distributeur) {
            console.log(`❌ [ERROR] No Distributeur found with Unique ID: ${distributeur_unique_id}`);
            return res.status(404).json({ success: false, message: "Distributeur not found." });
        }

        console.log(`✅ [SUCCESS] Profile fetched:`, distributeur);
        return res.status(200).json({
            success: true,
            distributeur,
        });

    } catch (error) {
        console.error("🔥 [ERROR] Failed to fetch Distributeur profile:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error.", error: error.message });
    }
};
