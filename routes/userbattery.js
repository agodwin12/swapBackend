const express = require("express");
const BatteryController = require("../controllers/userBatteryController"); // ✅ Correct Import

const router = express.Router();

// ✅ Route to fetch battery SOC and user details
router.get("/battery/:mac_id", BatteryController.getBatteryDetailsAndPrice);

// ✅ Route to calculate swap price
router.post("/calculateSwapPrice", BatteryController.getBatteryDetailsAndPrice);

// ✅ Route to fetch battery details and price
router.post("/battery/details", BatteryController.getBatteryDetailsAndPrice);

module.exports = router;
