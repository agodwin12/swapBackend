const db = require('../config/database');

exports.submitPowerData = async (req, res) => {
    try {
        const {
            userId,
            agenceId,
            kw1,
            kw2,
            kw3,
            kw4,
            chargedBatteries,
            lowBatteries,
        } = req.body;

        if (!userId || !agenceId) {
            return res.status(400).json({ message: 'User ID and Agence ID are required.' });
        }

        await db.query(
            `INSERT INTO power_readings (
                user_id,
                agence_id,
                kw1,
                kw2,
                kw3,
                kw4,
                charged_batteries,
                low_batteries,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            {
                replacements: [
                    userId,
                    agenceId,
                    kw1 || null,
                    kw2 || null,
                    kw3 || null,
                    kw4 || null,
                    chargedBatteries || null,
                    lowBatteries || null,
                ],
                type: db.QueryTypes.INSERT,
            }
        );

        return res.status(201).json({ message: 'Power data submitted successfully.' });
    } catch (err) {
        console.error('❌ Error submitting power data:', err);
        return res.status(500).json({ message: 'Server error while submitting power data.' });
    }
};
