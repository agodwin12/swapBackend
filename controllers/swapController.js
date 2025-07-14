const axios = require('axios');
const { sequelize, Sequelize } = require("../models");
const { QueryTypes } = Sequelize;
const getSOCFromBMS = require("../utils/getSOCFromBMS");

const CLICK_SEND_USERNAME = "YOUR_CLICK_SEND_USERNAME";
const CLICK_SEND_API_KEY = "YOUR_CLICK_SEND_API_KEY";

async function sendSms(phone, message) {
    const url = 'https://rest.clicksend.com/v3/sms/send';
    const payload = {
        messages: [
            {
                source: "PROXYM",
                to: phone,
                body: message,
            }
        ]
    };

    try {
        const response = await axios.post(url, payload, {
            auth: {
                username: CLICK_SEND_USERNAME,
                password: CLICK_SEND_API_KEY
            }
        });
        console.log(`✅ [SMS SENT] To: ${phone} | Response:`, response.data);
    } catch (error) {
        console.error(`❌ [SMS FAILED] To: ${phone} | Error:`, error.response ? error.response.data : error);
    }
}

async function swapBattery(req, res) {
    const { battery_in_mac_id, battery_out_mac_id, user_agence_unique_id, swap_price } = req.body;

    console.log("🔋 [SWAP INITIATED] Request payload:", req.body);

    if (!battery_in_mac_id || !battery_out_mac_id || !user_agence_unique_id || swap_price === undefined) {
        console.warn("⚠️ [VALIDATION ERROR] Missing required fields.");
        return res.status(400).json({
            message: "All fields are required: Incoming & Outgoing battery MAC IDs, Agence User ID, and Swap Price"
        });
    }

    const parsedSwapPrice = parseInt(swap_price, 10);
    if (isNaN(parsedSwapPrice)) {
        console.warn("⚠️ [VALIDATION ERROR] Invalid swap price:", swap_price);
        return res.status(400).json({ message: "Invalid swap price. Must be an integer." });
    }

    try {
        console.log("🔍 [LOOKUP] Fetching agence user...");
        const agenceUser = await sequelize.query(
            "SELECT id, id_agence FROM users_agences WHERE user_agence_unique_id = ? LIMIT 1",
            { replacements: [user_agence_unique_id], type: QueryTypes.SELECT }
        );
        if (agenceUser.length === 0) {
            console.warn("❌ [ERROR] Agence user not found.");
            return res.status(400).json({ message: "Invalid agence user identifier" });
        }

        const agent_user_id = agenceUser[0].id;
        const id_agence = agenceUser[0].id_agence;
        console.log(`✅ [AGENCE USER FOUND] Agent ID: ${agent_user_id}, Agence ID: ${id_agence}`);

        const fetchBatteryId = async (mac_id) => {
            const result = await sequelize.query(
                "SELECT id FROM batteries_valides WHERE mac_id = ? LIMIT 1",
                { replacements: [mac_id], type: QueryTypes.SELECT }
            );
            return result.length > 0 ? result[0].id : null;
        };

        const incomingBatteryId = await fetchBatteryId(battery_in_mac_id);
        const outgoingBatteryId = await fetchBatteryId(battery_out_mac_id);

        if (!incomingBatteryId) {
            console.warn(`❌ [ERROR] Incoming battery not found: ${battery_in_mac_id}`);
            return res.status(400).json({ message: "Incoming battery not found" });
        }

        if (!outgoingBatteryId) {
            console.warn(`❌ [ERROR] Outgoing battery not found: ${battery_out_mac_id}`);
            return res.status(400).json({ message: "Outgoing battery not found" });
        }

        // ✅ Check if incoming battery is associated with a user
        const [incomingAssociation] = await sequelize.query(
            `SELECT id, association_user_moto_id
             FROM battery_moto_user_association
             WHERE battery_id = ?
             ORDER BY updated_at DESC
                 LIMIT 1`,
            { replacements: [incomingBatteryId], type: QueryTypes.SELECT }
        );

        if (!incomingAssociation) {
            console.warn("❌ [BLOCKED] Incoming battery is not associated with any user:", battery_in_mac_id);
            return res.status(400).json({
                message: "Incoming battery not found"
            });
        }

        const battery_moto_user_association_id = incomingAssociation.id;
        const association_user_moto_id = incomingAssociation.association_user_moto_id;

        console.log("✅ [ASSOCIATION FOUND] Incoming battery is assigned:", incomingAssociation);

        // ✅ Log outgoing battery user association (but don’t block)
        const [userAssoc] = await sequelize.query(
            `SELECT id FROM battery_moto_user_association
             WHERE battery_id = ?
             ORDER BY updated_at DESC
                 LIMIT 1`,
            { replacements: [outgoingBatteryId], type: QueryTypes.SELECT }
        );
        console.log("ℹ️ [INFO] Outgoing battery user association (ignored):", userAssoc);

        // ❌ Block if outgoing battery is in another agence
        const [batteryAgence] = await sequelize.query(
            `SELECT id_agence FROM battery_agences
             WHERE id_battery_valide = ?
                 LIMIT 1`,
            { replacements: [outgoingBatteryId], type: QueryTypes.SELECT }
        );
        console.log("🔍 [VALIDATION] Outgoing battery agence association:", batteryAgence);

        if (batteryAgence && batteryAgence.id_agence !== id_agence) {
            console.warn("❌ [BLOCKED] Outgoing battery belongs to another agence.");
            return res.status(400).json({
                message: "The outgoing battery is currently assigned to another agence. Cannot proceed with swap."
            });
        }

        console.log("🔄 [TRANSACTION START]");
        const transaction = await sequelize.transaction();

        try {
            const userMotoAssociation = await sequelize.query(
                `SELECT validated_user_id
                 FROM association_user_motos
                 WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
                { replacements: [association_user_moto_id], type: QueryTypes.SELECT, transaction }
            );

            if (userMotoAssociation.length === 0) {
                console.warn("❌ [ERROR] Invalid user-moto association:", association_user_moto_id);
                await transaction.rollback();
                return res.status(400).json({ message: "Invalid user-moto association" });
            }

            const validated_user_id = userMotoAssociation[0].validated_user_id;

            const userDetails = await sequelize.query(
                `SELECT nom, prenom, phone
                 FROM validated_users
                 WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
                { replacements: [validated_user_id], type: QueryTypes.SELECT, transaction }
            );

            if (userDetails.length === 0) {
                console.warn("❌ [ERROR] User not found:", validated_user_id);
                await transaction.rollback();
                return res.status(400).json({ message: "User not found" });
            }

            const { nom, prenom, phone } = userDetails[0];
            console.log(`👤 [USER FOUND] ${nom} ${prenom} | Phone: ${phone}`);

            await sequelize.query(
                "DELETE FROM battery_agences WHERE id_battery_valide = ? AND id_agence = ?",
                { replacements: [outgoingBatteryId, id_agence], type: QueryTypes.DELETE, transaction }
            );
            console.log("🗑️ [REMOVED] Outgoing battery from agence");

            // ✅ Delete incoming battery from battery_agences if found there
            const [incomingBatteryAgence] = await sequelize.query(
                `SELECT id, id_agence
                 FROM battery_agences
                 WHERE id_battery_valide = ?
                     LIMIT 1`,
                { replacements: [incomingBatteryId], type: QueryTypes.SELECT, transaction }
            );

            if (incomingBatteryAgence) {
                console.log(`⚠️ [ACTION] Incoming battery found in battery_agences (id_agence = ${incomingBatteryAgence.id_agence}). Deleting it to ensure clean swap.`);
                await sequelize.query(
                    `DELETE FROM battery_agences
                     WHERE id = ?`,
                    { replacements: [incomingBatteryAgence.id], type: QueryTypes.DELETE, transaction }
                );
            } else {
                console.log("ℹ️ [INFO] Incoming battery not in battery_agences. No action required.");
            }

            // ✅ Insert incoming battery to current agence after swap
            await sequelize.query(
                "INSERT INTO battery_agences (id_battery_valide, id_agence) VALUES (?, ?)",
                { replacements: [incomingBatteryId, id_agence], type: QueryTypes.INSERT, transaction }
            );
            console.log("➕ [ADDED] Incoming battery to agence");

            await sequelize.query(
                `UPDATE battery_moto_user_association
                 SET battery_id = ?
                 WHERE id = ?`,
                { replacements: [outgoingBatteryId, battery_moto_user_association_id], type: QueryTypes.UPDATE, transaction }
            );
            console.log("🔄 [UPDATED] Association with outgoing battery");

            const incomingSOC = await getSOCFromBMS(battery_in_mac_id);
            const outgoingSOC = await getSOCFromBMS(battery_out_mac_id);
            console.log(`📊 [SOC] Incoming: ${incomingSOC}, Outgoing: ${outgoingSOC}`);

            await sequelize.query(
                `INSERT INTO swaps (battery_moto_user_association_id, agent_user_id, battery_out_id, battery_in_id,
                                    swap_price, swap_date, nom, prenom, phone, id_agence, battery_in_soc, battery_out_soc)
                 VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?)`,
                {
                    replacements: [
                        battery_moto_user_association_id,
                        agent_user_id,
                        outgoingBatteryId,
                        incomingBatteryId,
                        parsedSwapPrice,
                        nom, prenom, phone, id_agence,
                        incomingSOC, outgoingSOC
                    ],
                    type: QueryTypes.INSERT, transaction
                }
            );
            console.log("✅ [SWAP LOGGED] Swap entry created");

            await transaction.commit();
            console.log("✅ [TRANSACTION COMMIT]");

            await sendSms(phone, `Swap Successful for ${prenom}\nOutgoing Battery: ${battery_out_mac_id}\nIncoming Battery: ${battery_in_mac_id}\nPrice: ${swap_price}`);

            return res.json({
                message: "Battery swap successful",
                user: { nom, prenom, phone }
            });

        } catch (error) {
            await transaction.rollback();
            console.error("❌ [TRANSACTION ERROR] Failed during swap:", error);
            return res.status(500).json({ message: "Internal server error" });
        }

    } catch (error) {
        console.error("❌ [FATAL ERROR] Pre-transaction logic failed:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = { swapBattery };
