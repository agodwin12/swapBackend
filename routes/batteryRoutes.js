const express = require("express");
const router = express.Router();
const batteryAgenceController = require("../controllers/batteryAgenceController");

// ✅ Route to fetch batteries of an agency including SOC
router.get("/agenceswapbatteries/:agenceId", batteryAgenceController.getBatteriesForAgence);

module.exports = router;
