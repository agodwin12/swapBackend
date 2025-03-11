const express = require("express");
const router = express.Router();
const distributeuragenceswapController = require("../controllers/distributeuragenceswapController");

// POST: Process battery swap
router.post("/distributeuragenceswap", distributeuragenceswapController.processSwap);

module.exports = router;
