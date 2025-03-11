const express = require('express');
const router = express.Router();
const sequelize = require('../config/database'); // ✅ Ensure Sequelize connection
const { QueryTypes } = require('sequelize');

/**

 * @desc Get all batteries associated with a specific entrepôt
 */
router.get('/entrepot/:entrepotId', async (req, res) => {
    try {
        const { entrepotId } = req.params;

        // ✅ Validate that entrepotId is provided and is a number
        if (!entrepotId || isNaN(entrepotId)) {
            return res.status(400).json({ success: false, message: "Invalid or missing entrepot ID." });
        }

        console.log(`🌍 [API CALL] Fetching batteries for entrepôt: ${entrepotId}`);

        // ✅ Query to fetch batteries linked to the specific entrepôt
        const query = `
            SELECT
                bve.id AS battery_id,
                bve.mac_id AS mac_id,
                be.id_entrepot AS entrepot_id
            FROM battery_entrepots AS be
                     INNER JOIN batteries_valides AS bve ON be.id_battery_valide = bve.id
            WHERE be.id_entrepot = :entrepotId;
        `;

        // ✅ Execute the SQL query using Sequelize
        const results = await sequelize.query(query, {
            replacements: { entrepotId },
            type: QueryTypes.SELECT,
        });

        // ✅ If no batteries found, return a clear message
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "No batteries found for this entrepôt." });
        }

        console.log("✅ [SUCCESS] Batteries retrieved:", results);

        return res.status(200).json({
            success: true,
            entrepotId: entrepotId,
            batteries: results
        });

    } catch (error) {
        console.error("❌ [ERROR] Internal Server Error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});

module.exports = router;
