const express = require("express");
const router = express.Router();
const batteryEntrepotController = require("../controllers/batteryEntrepotController");
const validateSwapDestination = require("../controllers/validateSwapDestination"); // ✅ Import Correct File
const swapController = require("../controllers/swapController");
const { Agences } = require("../models"); // ✅ Import Sequelize model
const { Distributeurs } = require("../models"); // ✅ Ensure this is correctly imported


// ✅ Validate Swap Destination
router.post("/validate-destination", validateSwapDestination.validateSwapDestination);

// ✅ Get Batteries for a specific Entrepôt
router.get("/batteries/entrepot/:id_entrepot", batteryEntrepotController.getBatteriesForEntrepot);

router.post('/swap', swapController.swapBattery);  // Correct route handler



// ✅ Define the correct route for fetching agencies
router.get("/agencies", async (req, res) => {
    try {
        console.log("🌍 [API] Fetching all agencies...");

        const agencies = await Agences.findAll({
            attributes: ["id", "agence_unique_id", "nom_agence", "ville", "quartier", "telephone", "email"]
        });

        if (!agencies.length) {
            console.log("⚠️ [WARNING] No agencies found in database.");
            return res.status(404).json({ success: false, message: "No agencies found." });
        }

        console.log(`✅ [SUCCESS] Found ${agencies.length} agencies`);
        return res.status(200).json(agencies);
    } catch (error) {
        console.error("🔥 [ERROR] Error fetching agencies:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

router.get("/distributors", async (req, res) => {
    try {
        console.log("🌍 [API] Fetching all distributors...");

        const distributors = await Distributeurs.findAll({
            attributes: ["id", "distributeur_unique_id", "nom", "prenom", "ville", "quartier", "phone", "email"]
        });

        if (!distributors.length) {
            console.log("⚠️ [WARNING] No distributors found in database.");
            return res.status(404).json({ success: false, message: "No distributors found." });
        }

        console.log(`✅ [SUCCESS] Found ${distributors.length} distributors`);
        return res.status(200).json(distributors);
    } catch (error) {
        console.error("🔥 [ERROR] Error fetching distributors:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});



module.exports = router;
