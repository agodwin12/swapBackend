const express = require("express");
const router = express.Router();
const { getAgenceSwapHistory } = require("../controllers/agenceSwapHistoryController");

// Route: Fetch swap history using `uniqueId`
router.get("/agence-swap-history/:uniqueId", getAgenceSwapHistory);

module.exports = router;
