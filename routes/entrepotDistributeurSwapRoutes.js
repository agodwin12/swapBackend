const express = require("express");
const router = express.Router();
const swapController = require("../controllers/entrepotDistributeurSwapController");

// ✅ Route to process Entrepôt <-> Distributeur swaps
router.post("/swap/battery-entrepot", swapController.processBatteryEntrepotSwap);

module.exports = router;
