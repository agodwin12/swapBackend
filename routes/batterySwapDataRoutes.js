const express = require("express");
const router = express.Router();
const batterySwapController = require("../controllers/batterySwapController");

// ✅ Route to fetch batteries and SOC for an agency
router.get("/batteries/:agenceId", batterySwapController.getBatteriesForAgence);

module.exports = router;
