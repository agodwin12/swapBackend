const express = require("express");
const router = express.Router();
const { getUserAgenceByUniqueId } = require("../controllers/userAgenceController");

// ✅ Define Route for Fetching User Agence by Unique ID
router.get("/user-agence/:user_unique_id", getUserAgenceByUniqueId);

module.exports = router;
