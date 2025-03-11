const express = require('express');
const router = express.Router();
const { getSwapHistory } = require('../controllers/historyAgenceController');

// Use router.get instead of app.get
router.get('/history-agence/:user_agence_unique_id', getSwapHistory);

module.exports = router;