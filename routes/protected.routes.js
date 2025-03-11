const express = require('express');
const { authenticateJWT } = require('../middleware/auth.middleware');

const router = express.Router();

// Protected route for all users
router.get('/dashboard', authenticateJWT, (req, res) => {
    let dashboard;

    switch (req.user.type) {
        case 'Agence':
            dashboard = 'DashboardAgence';
            break;
        case 'Entrepot':
            dashboard = 'DashboardEntrepot';
            break;
        case 'Distributeur':
            dashboard = 'DashboardDistributeur';
            break;
        default:
            return res.status(403).json({ message: 'Unauthorized user type' });
    }

    res.json({
        message: `Welcome to your ${dashboard}!`,
        user: req.user
    });
});

module.exports = router;
