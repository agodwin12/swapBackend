const express = require("express");
const router = express.Router();
const motoController = require("../controllers/motoController");

router.get("/users", motoController.getAllUsers);  // ✅ List all users
router.get("/moto/:phone", motoController.getMotoByPhone);  // ✅ Search by phone

module.exports = router;
