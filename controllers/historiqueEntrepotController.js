const db = require("../models");

const getHistoriqueEntrepot = async (req, res) => {
    const { uniqueId } = req.params;
    console.log(`🔍 [DEBUG] Fetching historique_entrepot for user: ${uniqueId}`);

    try {
        // ✅ 1️⃣ Find the user in `users_entrepots`
        const user = await db.UsersEntrepots.findOne({
            where: { users_entrepot_unique_id: uniqueId },
            attributes: ["id"]
        });

        if (!user) {
            console.log(`❌ [ERROR] User not found for Unique ID: ${uniqueId}`);
            return res.status(404).json({ message: "User not found" });
        }

        console.log(`✅ [DEBUG] Found User ID: ${user.id}`);

        // ✅ 2️⃣ Fetch Swap History with Agence Info
        const historique = await db.HistoriqueEntrepot.findAll({
            where: { id_user_entrepot: user.id },
            attributes: ["id_entrepot", "id_agence", "bat_sortante", "bat_entrante", "type_swap", "created_at"],
            order: [["created_at", "DESC"]],
            include: [
                {
                    model: db.Agences, // 🔥 JOIN `agences` table
                    as: "agence",
                    attributes: ["nom_agence", "ville"], // ✅ Fetch `nom_agence` & `ville`
                },
            ],
        });

        if (historique.length === 0) {
            console.log(`⚠️ [WARNING] No swap history found for user ID: ${user.id}`);
            return res.status(200).json({ message: "No swap history found", historique: [] });
        }

        console.log(`✅ [SUCCESS] Found ${historique.length} swap records`);
        return res.status(200).json({ historique });

    } catch (error) {
        console.error("❌ [ERROR] Failed to fetch historique_entrepot:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = { getHistoriqueEntrepot };
