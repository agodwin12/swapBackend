const express = require("express");
const router = express.Router();
const { getDistributeurHistory } = require("../controllers/distributeuragencehistory");

// ✅ Correct API route (no extra prefix)
router.get("/:distributeurId", getDistributeurHistory);

module.exports = router;
