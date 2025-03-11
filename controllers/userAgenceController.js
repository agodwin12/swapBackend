const db = require("../models");

const getUserAgenceByUniqueId = async (req, res) => {
    const { user_unique_id } = req.params;

    console.log(`🔍 [DEBUG] Fetching user with unique ID: ${user_unique_id}`);

    try {
        // ✅ Ensure the model is properly referenced
        const user = await db.UserAgences.findOne({
            where: { user_agence_unique_id: user_unique_id }
        });

        if (!user) {
            console.log("❌ [ERROR] User not found.");
            return res.status(404).json({ message: "User not found" });
        }

        console.log("✅ [SUCCESS] User found:", user);
        return res.status(200).json({ user });

    } catch (error) {
        console.error("❌ [ERROR] Database error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { getUserAgenceByUniqueId };
