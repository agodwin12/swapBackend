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
        console.log(`✅ [SUCCESS] SMS sent to ${phone}:`, response.data);
    } catch (error) {
        console.error(`❌ [ERROR] Failed to send SMS to ${phone}:`, error.response ? error.response.data : error);
    }
}

async function swapBattery(req, res) {
    const { battery_in_mac_id, battery_out_mac_id, user_agence_unique_id, swap_price } = req.body;

    console.log("🔍 [DEBUG] Received request:", req.body);

    if (!battery_in_mac_id || !battery_out_mac_id || !user_agence_unique_id || swap_price === undefined) {
        return res.status(400).json({ message: "All fields are required: Incoming & Outgoing battery MAC IDs, Agence User ID, and Swap Price" });
    }

    const parsedSwapPrice = parseInt(swap_price, 10);
    if (isNaN(parsedSwapPrice)) {
        return res.status(400).json({ message: "Invalid swap price. Must be an integer." });
    }

    const transaction = await sequelize.transaction();
    try {
        console.log("🔍 [DEBUG] Fetching `agent_user_id` and `id_agence`...");
        const agenceUser = await sequelize.query(
            "SELECT id, id_agence FROM users_agences WHERE user_agence_unique_id = ? LIMIT 1",
            { replacements: [user_agence_unique_id], type: QueryTypes.SELECT, transaction }
        );
        if (agenceUser.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ message: "Invalid agence user identifier" });
        }
        const agent_user_id = agenceUser[0].id;
        const id_agence = agenceUser[0].id_agence;

        const fetchBatteryId = async (mac_id) => {
            const result = await sequelize.query(
                "SELECT id FROM batteries_valides WHERE mac_id = ? LIMIT 1",
                { replacements: [mac_id], type: QueryTypes.SELECT, transaction }
            );
            return result.length > 0 ? result[0].id : null;
        };

        const incomingBatteryId = await fetchBatteryId(battery_in_mac_id);
        const outgoingBatteryId = await fetchBatteryId(battery_out_mac_id);

        if (!incomingBatteryId || !outgoingBatteryId) {
            await transaction.rollback();
            return res.status(400).json({ message: "Battery not found" });
        }

        console.log("🔍 [DEBUG] Fetching latest association for battery ID:", incomingBatteryId);
        const batteryAssociation = await sequelize.query(
            `SELECT id, association_user_moto_id
             FROM battery_moto_user_association
             WHERE battery_id = ?
             ORDER BY updated_at DESC LIMIT 1`,
            { replacements: [incomingBatteryId], type: QueryTypes.SELECT, transaction }
        );

        if (batteryAssociation.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ message: "No user association found for incoming battery" });
        }

        const battery_moto_user_association_id = batteryAssociation[0].id;
        const association_user_moto_id = batteryAssociation[0].association_user_moto_id;

        const userMotoAssociation = await sequelize.query(
            `SELECT validated_user_id
             FROM association_user_motos
             WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
            { replacements: [association_user_moto_id], type: QueryTypes.SELECT, transaction }
        );

        if (userMotoAssociation.length === 0) {
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
            await transaction.rollback();
            return res.status(400).json({ message: "User not found" });
        }

        const { nom, prenom, phone } = userDetails[0];

        await sequelize.query(
            "DELETE FROM battery_agences WHERE id_battery_valide = ? AND id_agence = ?",
            { replacements: [outgoingBatteryId, id_agence], type: QueryTypes.DELETE, transaction }
        );

        await sequelize.query(
            "INSERT INTO battery_agences (id_battery_valide, id_agence) VALUES (?, ?)",
            { replacements: [incomingBatteryId, id_agence], type: QueryTypes.INSERT, transaction }
        );

        await sequelize.query(
            `UPDATE battery_moto_user_association
             SET battery_id = ?
             WHERE id = ?`,
            { replacements: [outgoingBatteryId, battery_moto_user_association_id], type: QueryTypes.UPDATE, transaction }
        );

        const incomingSOC = await getSOCFromBMS(battery_in_mac_id);
        const outgoingSOC = await getSOCFromBMS(battery_out_mac_id);

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

        await transaction.commit();

        await sendSms(phone, `Swap Successful for ${prenom}\nOutgoing Battery: ${battery_out_mac_id}\nIncoming Battery: ${battery_in_mac_id}\nPrice: ${swap_price}`);

        return res.json({ message: "Battery swap successful", user: { nom, prenom, phone } });

    } catch (error) {
        await transaction.rollback();
        console.error("❌ [ERROR] Swap Processing Failed:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = { swapBattery };
