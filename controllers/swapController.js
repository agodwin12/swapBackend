const axios = require('axios');
const { sequelize, Sequelize } = require("../models");
const { QueryTypes } = Sequelize;
const getSOCFromBMS = require("../utils/getSOCFromBMS");


const CLICK_SEND_USERNAME = "YOUR_CLICK_SEND_USERNAME";
const CLICK_SEND_API_KEY = "YOUR_CLICK_SEND_API_KEY";


async function sendSms(phone, message) {
    // ClickSend API endpoint for sending SMS
    const url = 'https://rest.clicksend.com/v3/sms/send';

    // Build the payload according to ClickSend's API requirements
    const payload = {
        messages: [
            {
                source: "PROXYM", // Optional: customize as needed
                to: phone,
                body: message,
                // Optionally, you can set a 'from' field if needed:
                // from: "YourSenderID"
            }
        ]
    };

    try {
        // Make a POST request to ClickSend with Basic Authentication
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


async function getToken() {
    const url = 'http://api.mtbms.com/api.php/ibms/loginSystem';

    try {
        const response = await axios.get(url, {
            params: {
                LoginName: 'D13',
                LoginPassword: 'QC123456',
                LoginType: 'ENTERPRISE',
                language: 'cn',
                ISMD5: 0,
                timeZone: '+08',
                apply: 'APP',
            }
        });
        return response.data?.mds || null;
    } catch (error) {
        console.error('❌ [ERROR] Error fetching token:', error);
        return null;
    }
}


async function sendCommand(mac_id, param) {
    console.log(`🔄 [DEBUG] Sending command to battery: ${mac_id}, Action: ${param}`);

    const mds = await getToken();
    if (!mds) {
        console.error('❌ [ERROR] Token not received');
        return false;
    }

    // Determine the command parameter based on the desired action
    let commandParam;
    if (param === 'charge_on') {
        commandParam = 'E20000000B000400160101'; // Charge switch ON
    } else if (param === 'charge_off') {
        commandParam = 'E20000000B000400160100'; // Charge switch OFF
    } else if (param === 'discharge_on') {
        commandParam = 'E20000000B000400170101'; // Discharge switch ON
    } else if (param === 'discharge_off') {
        commandParam = 'E20000000B000400170100'; // Discharge switch OFF
    } else {
        console.error('❌ [ERROR] Invalid command parameter');
        return false;
    }

    // URL for sending the command (using GET with query parameters)
    const url = 'http://api.mtbms.com/api.php/ibms/getDateFunc';
    try {
        const response = await axios.get(url, {
            params: {
                method: 'SendCommands',
                macid: mac_id,
                cmd: 'MTS_BMS_SETTING',
                param: commandParam,
                mds: mds
            }
        });
        if (response.data && response.data.success) {
            console.log(`✅ [SUCCESS] Command '${param}' sent successfully for battery: ${mac_id}`);
            return true;
        } else {
            console.error(`❌ [ERROR] Command failed for battery: ${mac_id}`, response.data);
            return false;
        }
    } catch (error) {
        console.error(`❌ [ERROR] Error sending command to battery: ${mac_id}`, error);
        return false;
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
        // Step 1: Fetch the agent's user ID and agency ID
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

        // Step 2: Fetch battery IDs
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

        // Step 3: Get the latest battery-user association
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

        // Step 4: Get the validated user ID
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

        // Step 5: Get user details
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

        // Step 6: Swap Operation
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

        // Step 7: Fetch SOC values
        const incomingSOC = await getSOCFromBMS(battery_in_mac_id);
        const outgoingSOC = await getSOCFromBMS(battery_out_mac_id);

        // Step 8: Record Swap
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

        // Step 9: Send SMS and commands
        await sendSms(phone, `Swap Successful for ${prenom}\nOutgoing Battery: ${battery_out_mac_id}\nIncoming Battery: ${battery_in_mac_id}\nPrice: ${swap_price}`);

        await sendCommand(battery_in_mac_id, 'charge_on');
        await sendCommand(battery_in_mac_id, 'discharge_off');
        await sendCommand(battery_out_mac_id, 'charge_off');
        await sendCommand(battery_out_mac_id, 'discharge_on');

        return res.json({ message: "Battery swap successful", user: { nom, prenom, phone } });

    } catch (error) {
        await transaction.rollback();
        console.error("❌ [ERROR] Swap Processing Failed:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = { swapBattery };