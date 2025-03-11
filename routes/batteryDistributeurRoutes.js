const express = require("express");
const router = express.Router();
const batteryDistributeurController = require("../controllers/batteryDistributeurController");

// Route to fetch batteries for a specific distributeur
router.get("/:distributeurUniqueId", batteryDistributeurController.getBatteriesForDistributeur);

module.exports = router;
