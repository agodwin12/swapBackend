const express = require("express");
const router = express.Router();
const { getUserByUniqueId } = require("../controllers/usersEntrepotController");

// ✅ Route to get user details by unique ID
router.get("/users-entrepot/:uniqueId", getUserByUniqueId);

module.exports = router;
