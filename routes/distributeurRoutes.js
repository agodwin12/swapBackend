const express = require("express");
const router = express.Router();
const { getDistributeurProfile } = require("../controllers/distributeurProfileController");

// ✅ Route for fetching Distributeur Profile
router.get("/profile/:distributeur_unique_id", getDistributeurProfile);

module.exports = router;
