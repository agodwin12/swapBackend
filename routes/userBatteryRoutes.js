const express = require("express");
const userBatteryController = require("../controllers/userBatteryController"); // ✅ Correct

const router = express.Router();

// Route to fetch battery SOC and associated user details
router.get("/battery/:mac_id", BatteryController.getBatteryDetails);

module.exports = router;
