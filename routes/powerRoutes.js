const express = require('express');
const router = express.Router();
const { submitPowerData } = require('../controllers/powerController'); // ✅ this must match



router.post('/submit', submitPowerData);


module.exports = router;
