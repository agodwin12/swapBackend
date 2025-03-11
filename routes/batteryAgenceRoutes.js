const express = require("express");
const router = express.Router();
const batteryAgenceController = require("../controllers/batteryAgenceController");
const batteriesAgenceDistributeurController = require("../controllers/batteriesAgenceDistributeurController");


// ✅ GET batteries for a specific Agence
router.get("/batteries/agence/:agenceId", batteryAgenceController.getBatteriesForAgence);

router.get("/agenceswapbatteries/:agenceId", batteryAgenceController.getBatteriesForAgence);

router.get("/batteries/agencedist/:agenceId", (req, res, next) => {
    console.log("🚀 [API CALL] Received request for /batteries/agencedist/:agenceId");
    console.log(`🔍 [REQUEST PARAMS] Agence ID: ${req.params.agenceId}`);
    next(); // Pass request to controller
}, batteriesAgenceDistributeurController.getBatteriesForAgence);


module.exports = router;
