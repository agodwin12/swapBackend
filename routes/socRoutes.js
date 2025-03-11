const express = require("express");
const router = express.Router();
const SocController = require("../controllers/socController");

// ✅ Route to fetch latest SOC for a given battery (mac_id)
router.get("/batteries/soc/:mac_id", SocController.getLatestSOC);

module.exports = router;
