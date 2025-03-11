const express = require("express");
const router = express.Router();
const distributorswapbatteriesController = require("../controllers/distributorswapbatteriesController");

// Define route for fetching batteries of a distributeur
router.get("/distributorswapbatteries/:distributeurUniqueId", distributorswapbatteriesController.getDistributeurSwapBatteries);

module.exports = router;
