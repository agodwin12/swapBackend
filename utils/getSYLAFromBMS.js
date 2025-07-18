const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

const getSYLAFromBMS = async (macId) => {
    try {
        const [bmsData] = await sequelize.query(
            `SELECT state
             FROM bms_data
             WHERE mac_id = ?
             ORDER BY timestamp DESC
             LIMIT 1`,
            { replacements: [macId], type: QueryTypes.SELECT }
        );

        if (!bmsData || !bmsData.state) {
            console.warn(`⚠️ [BMS DATA] No BMS data found for MAC: ${macId}`);
            return null;
        }

        const parsedState = JSON.parse(bmsData.state);
        return parsedState.SYLA ?? null;
    } catch (error) {
        console.error(`❌ [ERROR] Could not read SYLA for MAC ${macId}:`, error);
        return null;
    }
};

module.exports = getSYLAFromBMS;
