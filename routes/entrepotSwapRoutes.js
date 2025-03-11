const express = require("express");
const router = express.Router();

// ✅ Import the controller correctly
const { performSwap } = require("../controllers/entrepotSwapController");

// ✅ Define the route properly
router.post("/perform-swap", performSwap);

module.exports = router;
