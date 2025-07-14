const mysql = require("mysql2/promise");
const axios = require("axios");

const MTBMS_API_BASE_URL = "http://api.mtbms.com/api.php/ibms";
const MAC_ID = "613881628549";

/**
 * Get token from MTBMS API
 */
async function getToken() {
    const url = `${MTBMS_API_BASE_URL}/loginSystem`;

    try {
        const response = await axios.get(url, {
            params: {
                LoginName: "D13",
                LoginPassword: "QC123456",
                LoginType: "ENTERPRISE",
                language: "cn",
                ISMD5: 0,
                timeZone: "+08",
                apply: "APP",
            },
        });

        if (response.data && response.data.mds) {
            return response.data.mds;
        } else {
            console.error("❌ Token not received from API");
            return null;
        }
    } catch (error) {
        console.error("🚨 Error fetching token:", error.message);
        return null;
    }
}

/**
 * Send battery command
 */
async function sendBatteryCommand(macId, param) {
    const mds = await getToken();
    if (!mds) {
        throw new Error("Failed to retrieve authentication token.");
    }

    let cmd = "MTS_BMS_SETTING";
    let pwd = "";

    const commandParams = {
        charge_on: "E20000000B000400160101",
        charge_off: "E20000000B000400160100",
        discharge_on: "E20000000B000400170101",
        discharge_off: "E20000000B000400170100",
    };

    if (!commandParams[param]) {
        throw new Error("Invalid parameter received.");
    }

    const url = `${MTBMS_API_BASE_URL}/getDateFunc`;

    try {
        const response = await axios.post(url, {
            method: "SendCommands",
            mds,
            macid: macId,
            cmd,
            param: commandParams[param],
            pwd,
        });

        if (response.data && response.data.success) {
            console.log("✅ Command sent successfully:", response.data);
            return { success: true, cmdNo: response.data.data[0].CmdNo };
        } else {
            throw new Error(response.data.errorDescribe || "Unknown API error");
        }
    } catch (error) {
        console.error("🚨 Error sending command:", error.message);
        throw new Error(error.message);
    }
}

/**
 * Get SOC from bms_data table
 */
async function getSocFromDB(macId) {
    const connection = await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",          // replace with your DB password
        database: "authbd",    // replace with your DB name
    });

    const [rows] = await connection.execute(
        `
            SELECT state
            FROM bms_data
            WHERE JSON_EXTRACT(state, '$.mac_id') = ?
            ORDER BY timestamp DESC
                LIMIT 1
        `,
        [macId]
    );

    await connection.end();

    if (rows.length === 0) {
        console.log(`❌ No state record found for mac_id ${macId}`);
        return null;
    }

    const stateJsonStr = rows[0].state;

    try {
        const stateObj = JSON.parse(stateJsonStr);

        const socStr = stateObj.SOC;
        const socValue = parseFloat(socStr);

        if (isNaN(socValue)) {
            console.error("⚠️ SOC field is not numeric or missing in state JSON.");
            return null;
        }

        return socValue;
    } catch (e) {
        console.error("❌ Failed to parse state JSON:", e.message);
        return null;
    }
}

/**
 * Main logic
 */
async function main() {
    try {
        const soc = await getSocFromDB(MAC_ID);
        console.log(`✅ Current SOC for ${MAC_ID}:`, soc);

        if (soc !== null && soc >= 90) {
            console.log(`⚡ SOC is ${soc}. Sending charge_off command...`);

            const result = await sendBatteryCommand(MAC_ID, "charge_off");
            console.log(`🚀 Command result:`, result);
        } else {
            console.log(`🔋 SOC is below threshold. No action taken.`);
        }
    } catch (error) {
        console.error("🚨 Error in script:", error.message);
    }
}

main();

setInterval(() => {
    main();
}, 1 * 60 * 1000);
