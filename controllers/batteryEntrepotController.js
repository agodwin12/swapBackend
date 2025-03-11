const db = require("../models");
const { QueryTypes } = require("sequelize");
const sequelize = db.sequelize;

exports.getBatteriesForEntrepot = async (req, res) => {
    try {
        const { id_entrepot } = req.params;

        // ✅ Check if `id_entrepot` is valid
        if (!id_entrepot || isNaN(id_entrepot)) {
            console.log("❌ [ERROR] Missing or invalid id_entrepot in request.");
            return res.status(400).json({ success: false, message: "Valid Entrepôt ID is required." });
        }

        console.log(`🌍 [API CALL] Fetching batteries for Entrepôt ID: ${id_entrepot}`);

        // ✅ Use replacements correctly
        const batteries = await sequelize.query(
            `SELECT
                 bve.id AS battery_id,
                 bve.mac_id AS mac_id,
                 be.id_entrepot AS entrepot_id
             FROM battery_entrepots AS be
                      INNER JOIN batteries_valides AS bve ON be.id_battery_valide = bve.id
             WHERE be.id_entrepot = :id_entrepot;`,
            {
                replacements: { id_entrepot: parseInt(id_entrepot) },
                type: QueryTypes.SELECT
            }
        );

        if (batteries.length === 0) {
            return res.status(404).json({ success: false, message: "No batteries found for this Entrepôt." });
        }

        return res.status(200).json({ success: true, batteries });

    } catch (error) {
        console.error("🔥 [ERROR] Fetching batteries for Entrepôt:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};
