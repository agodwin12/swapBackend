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

    if (!battery_in_mac_id || !battery_out_mac_id || !user_agence_unique_id || swap_price === undefined) {
        return res.status(400).json({ message: "All fields are required: Incoming & Outgoing battery MAC IDs, Agence User ID, and Swap Price" });
    }

    const parsedSwapPrice = parseInt(swap_price, 10);
    if (isNaN(parsedSwapPrice)) {
        return res.status(400).json({ message: "Invalid swap price. Must be an integer." });
    }

    const transaction = await sequelize.transaction();
    try {
        // Step 1: Fetch battery IDs
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

        // Step 2: Fetch the correct user (latest association)
        const userQuery = await sequelize.query(
            `SELECT vu.id AS validated_user_id, vu.nom, vu.prenom, vu.phone
             FROM battery_moto_user_association bma
             JOIN association_user_motos aum ON bma.association_user_moto_id = aum.id
             JOIN validated_users vu ON aum.validated_user_id = vu.id
             WHERE bma.battery_id = ?
             ORDER BY bma.created_at DESC, bma.id DESC LIMIT 1`,
            { replacements: [incomingBatteryId], type: QueryTypes.SELECT, raw: true, transaction }
        );

        if (userQuery.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ message: "No user found for incoming battery" });
        }

        const { validated_user_id, nom, prenom, phone } = userQuery[0];

        // Step 3: Perform Battery Swap
        await sequelize.query(
            "DELETE FROM battery_agences WHERE id_battery_valide = ? AND id_agence = ?",
            { replacements: [outgoingBatteryId, user_agence_unique_id], type: QueryTypes.DELETE, transaction }
        );

        await sequelize.query(
            "INSERT INTO battery_agences (id_battery_valide, id_agence) VALUES (?, ?)",
            { replacements: [incomingBatteryId, user_agence_unique_id], type: QueryTypes.INSERT, transaction }
        );

        // Step 4: Fetch SOC Values
        const fetchSOC = async (mac_id) => {
            const result = await sequelize.query(
                `SELECT JSON_UNQUOTE(JSON_EXTRACT(state, '$.SOC')) AS SOC
                 FROM bms_data WHERE mac_id = ?
                 ORDER BY id DESC LIMIT 1`,
                { replacements: [mac_id], type: QueryTypes.SELECT, transaction }
            );
            return result.length > 0 ? parseFloat(result[0].SOC) : null;
        };

        const incomingSOC = await fetchSOC(battery_in_mac_id);
        const outgoingSOC = await fetchSOC(battery_out_mac_id);

        if (incomingSOC === null || outgoingSOC === null) {
            await transaction.rollback();
            return res.status(400).json({ message: "SOC data not found for batteries" });
        }

        // Step 5: Correct Swap Price Calculation
        let finalSwapPrice = (outgoingSOC - incomingSOC > 0)
            ? ((outgoingSOC - incomingSOC) * 2000) / 93
            : 0;

        // Step 6: Record Swap
        await sequelize.query(
            `INSERT INTO swaps (battery_moto_user_association_id, agent_user_id, battery_out_id, battery_in_id,
                                swap_price, swap_date, nom, prenom, phone, id_agence, battery_in_soc, battery_out_soc)
             VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?)`,
            {
                replacements: [
                    incomingBatteryId,
                    user_agence_unique_id,
                    outgoingBatteryId,
                    incomingBatteryId,
                    finalSwapPrice,
                    nom, prenom, phone, user_agence_unique_id,
                    incomingSOC, outgoingSOC
                ],
                type: QueryTypes.INSERT, transaction
            }
        );

        // Commit transaction after everything is validated
        await transaction.commit();

        return res.json({
            message: "Battery swap successful",
            user: { id: validated_user_id, nom, prenom, phone },
            swap_price: finalSwapPrice
        });

    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = { swapBattery };