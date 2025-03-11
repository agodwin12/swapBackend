const db = require("../config/database");

const getUserByUniqueId = async (req, res) => {
    console.log("🔍 [DEBUG] Fetching user details for:", req.params.uniqueId);

    const { uniqueId } = req.params;

    if (!uniqueId) {
        console.log("❌ [ERROR] Unique ID is required.");
        return res.status(400).json({ message: "Unique ID is required." });
    }

    try {
        // ✅ Fetch user details from `users_entrepots`
        const user = await db.query(
            `SELECT id, users_entrepot_unique_id, nom, prenom, email, phone, ville, quartier, id_entrepot, photo 
             FROM users_entrepots 
             WHERE users_entrepot_unique_id = ? 
             LIMIT 1`,
            { replacements: [uniqueId], type: db.QueryTypes.SELECT }
        );

        if (user.length === 0) {
            console.log("❌ [ERROR] User not found.");
            return res.status(404).json({ message: "User not found." });
        }

        console.log("✅ [SUCCESS] Retrieved user details:", user[0]);
        return res.json({
            message: "User details retrieved successfully",
            user: user[0]
        });

    } catch (error) {
        console.error("❌ [ERROR] Failed to fetch user details:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { getUserByUniqueId };
