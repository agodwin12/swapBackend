const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

const getSOCFromBMS = async (macId) => {
    try {
        // ✅ Use `sequelize.query()` instead of `db.query()`
        const response = await sequelize.query(
            "SELECT state FROM bms_data WHERE mac_id = ? ORDER BY timestamp DESC LIMIT 1",
            { replacements: [macId], type: QueryTypes.SELECT }
        );

        if (response.length === 0) {
            console.log("❌ [ERROR] No BMS data found for the battery with mac_id:", macId);
            return null;
        }

        // ✅ Parse JSON to extract SOC
        const state = JSON.parse(response[0].state);
        return state.SOC || null;
    } catch (error) {
        console.error("❌ [ERROR] Error fetching SOC from bms_data:", error);
        return null;
    }
};

// ✅ Export function
module.exports = getSOCFromBMS;
