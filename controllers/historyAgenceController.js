const { sequelize, Sequelize } = require("../models");
const { QueryTypes } = Sequelize;

const getSwapHistory = async (req, res) => {
    const { user_agence_unique_id } = req.params;

    console.log("🔍 [DEBUG] Fetching swap history for user_agence_unique_id:", user_agence_unique_id);

    if (!user_agence_unique_id) {
        console.log("❌ [ERROR] Missing user_agence_unique_id parameter");
        return res.status(400).json({
            message: "user_agence_unique_id is required"
        });
    }

    try {
        // First, verify the user exists and get their ID
        console.log("🔍 [DEBUG] Verifying user and fetching agent_user_id...");
        const agentUser = await sequelize.query(
            "SELECT id FROM users_agences WHERE user_agence_unique_id = ? LIMIT 1",
            {
                replacements: [user_agence_unique_id],
                type: QueryTypes.SELECT
            }
        );

        if (agentUser.length === 0) {
            console.log("❌ [ERROR] No matching user found");
            return res.status(404).json({
                message: "Agent user not found"
            });
        }

        const agent_user_id = agentUser[0].id;

        // Fetch all swaps for this agent
        console.log("🔍 [DEBUG] Fetching swaps for agent_user_id:", agent_user_id);
        const swaps = await sequelize.query(
            `SELECT
                 s.swap_date,
                 s.swap_price,
                 s.nom,
                 s.prenom,
                 s.phone,
                 s.battery_out_soc,
                 s.battery_in_soc,
                 bin.mac_id as battery_in_mac,
                 bout.mac_id as battery_out_mac
             FROM swaps s
                      JOIN batteries_valides bin ON s.battery_in_id = bin.id
                      JOIN batteries_valides bout ON s.battery_out_id = bout.id
             WHERE s.agent_user_id = ?
             ORDER BY s.swap_date DESC`,
            {
                replacements: [agent_user_id],
                type: QueryTypes.SELECT
            }
        );

        console.log(`✅ [DEBUG] Found ${swaps.length} swaps for the agent`);

        // Format the response to match Flutter app expectations
        return res.json({
            message: "Swap history retrieved successfully",
            swaps: swaps.map(swap => ({
                ...swap,
                swap_date: new Date(swap.swap_date).toISOString(),
                battery_in_soc: parseFloat(swap.battery_in_soc),
                battery_out_soc: parseFloat(swap.battery_out_soc)
            }))
        });

    } catch (error) {
        console.error("❌ [ERROR] Failed to fetch swap history:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

module.exports = { getSwapHistory };