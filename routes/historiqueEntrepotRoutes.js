const express = require("express");
const router = express.Router();
const { getHistoriqueEntrepot } = require("../controllers/historiqueEntrepotController");

router.get("/historique-entrepot/:uniqueId", getHistoriqueEntrepot); // ✅ Correct route

module.exports = router;
