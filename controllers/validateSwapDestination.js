const db = require("../models"); // ✅ Import Sequelize models
const Agences = db.Agences;
const Distributeurs = db.Distributeurs;

exports.validateSwapDestination = async (req, res) => {
    try {
        const { uniqueId } = req.body;

        console.log(`\n🔍 [API] Received request to validate Unique ID: ${uniqueId}`);

        if (!uniqueId) {
            console.log("⚠️ [ERROR] No Unique ID provided in request.");
            return res.status(400).json({ success: false, message: "Unique ID is required." });
        }

        console.log(`📡 [DB] Checking Agences for Unique ID: ${uniqueId}`);
        const agence = await Agences.findOne({
            where: { agence_unique_id: uniqueId },
            attributes: ["id", "agence_unique_id", "nom_agence", "ville", "quartier", "telephone", "email"]
        });

        if (agence) {
            console.log(`✅ [FOUND] Agence Matched!`);
            console.log(`   - ID: ${agence.id}`);
            console.log(`   - Unique ID: ${agence.agence_unique_id}`);
            console.log(`   - Name: ${agence.nom_agence}`);
            console.log(`   - Location: ${agence.ville}, ${agence.quartier || "Unknown"}`);
            console.log(`   - Phone: ${agence.telephone}`);
            console.log(`   - Email: ${agence.email}`);

            return res.status(200).json({
                success: true,
                message: "Validation successful",
                details: {
                    id: agence.id,
                    unique_id: agence.agence_unique_id,
                    name: agence.nom_agence,
                    location: `${agence.ville}, ${agence.quartier || "Unknown"}`,
                    phone: agence.telephone,
                    email: agence.email
                }
            });
        }

        console.log(`❌ [NOT FOUND] No match in Agences. Checking Distributeurs...`);

        const distributeur = await Distributeurs.findOne({
            where: { distributeur_unique_id: uniqueId },
            attributes: ["id", "distributeur_unique_id", "nom", "prenom", "ville", "quartier", "phone", "email"]
        });

        if (distributeur) {
            console.log(`✅ [FOUND] Distributeur Matched!`);
            console.log(`   - ID: ${distributeur.id}`);
            console.log(`   - Unique ID: ${distributeur.distributeur_unique_id}`);
            console.log(`   - Name: ${distributeur.nom} ${distributeur.prenom}`);
            console.log(`   - Location: ${distributeur.ville}, ${distributeur.quartier || "Unknown"}`);
            console.log(`   - Phone: ${distributeur.phone}`);
            console.log(`   - Email: ${distributeur.email}`);

            return res.status(200).json({
                success: true,
                message: "Validation successful",
                details: {
                    id: distributeur.id,
                    unique_id: distributeur.distributeur_unique_id,
                    name: `${distributeur.nom} ${distributeur.prenom}`,
                    location: `${distributeur.ville}, ${distributeur.quartier || "Unknown"}`,
                    phone: distributeur.phone,
                    email: distributeur.email
                }
            });
        }

        console.log(`❌ [ERROR] No entity found for Unique ID: ${uniqueId}`);
        return res.status(404).json({ success: false, message: "Invalid Unique ID." });

    } catch (error) {
        console.error("🔥 [ERROR] Exception occurred during validation:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};
