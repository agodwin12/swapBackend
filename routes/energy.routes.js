const express = require("express");
const router = express.Router();
const EnergyController = require("../controllers/EnergyController");

router.post("/agence", EnergyController.updateAgenceEnergyStatus);

router.get("/agence/status", EnergyController.getAgenceEnergyStatus);

router.put("/agence/toggle", EnergyController.toggleAgenceEnergyStatus);

module.exports = router;