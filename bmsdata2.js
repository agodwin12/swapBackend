const axios = require('axios');
const mysql = require('mysql2');

// Fonction utilitaire pour le timestamp
function now() {
    return new Date().toLocaleTimeString('fr-FR', { hour12: false });
}

// Configuration de la base de données MySQL
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'authbd',
};

const pool = mysql.createPool(dbConfig);

// Identifiants API par fabriquant
const apiCredentials = {
    vercom: {
        LoginName: 'D13',
        LoginPassword: 'QC123456',
    },
    huiming: {
        LoginName: '深圳慧鸣',
        LoginPassword: 'hm20240724',
    }
};

async function getToken(fabriquant) {
    const creds = apiCredentials[fabriquant.toLowerCase()];
    if (!creds) {
        console.error(`[${now()}] 🚫 Aucun identifiant trouvé pour le fabriquant : ${fabriquant}`);
        return null;
    }

    console.log(`[${now()}] 🔐 Tentative d'authentification pour ${fabriquant}`);

    try {
        const response = await axios.get('http://api.mtbms.com/api.php/ibms/loginSystem', {
            params: {
                LoginName: creds.LoginName,
                LoginPassword: creds.LoginPassword,
                LoginType: 'ENTERPRISE',
                language: 'cn',
                ISMD5: 0,
                timeZone: '+08',
                apply: 'APP',
            },
        });

        console.log(`[${now()}] ✅ Authentification réussie pour ${fabriquant}`);
        return response.data?.mds || null;

    } catch (error) {
        console.error(`[${now()}] ❌ Erreur d'authentification pour ${fabriquant} : ${error.message}`);
        return null;
    }
}

async function getGroupedDeviceNumbers() {
    console.log(`[${now()}] 📦 Lecture des batteries depuis la base MySQL`);
    return new Promise((resolve, reject) => {
        pool.query('SELECT mac_id, fabriquant FROM batteries_valides', (err, results) => {
            if (err) {
                console.error(`[${now()}] ❌ Erreur SQL lors de la récupération des batteries : ${err.message}`);
                return reject(err);
            }

            const grouped = {};
            results.forEach(row => {
                const fab = row.fabriquant.toLowerCase();
                if (!grouped[fab]) grouped[fab] = [];
                grouped[fab].push(row.mac_id.trim());
            });
            console.log(`[${now()}] 🔍 Batteries regroupées par fabriquant :`, grouped);
            resolve(grouped);
        });
    });
}

async function fetchLocationData(mds, mac_id) {
    try {
        console.log(`[${now()}] 📍 Récupération GPS pour ${mac_id}`);
        const response = await axios.get('http://api.mtbms.com/api.php/ibms/getDateFunc', {
            params: {
                method: 'getUserAndGpsInfoByIDsUtc',
                user_id: mac_id,
                mapType: 'BAIDU',
                mds,
            },
        });
        const record = response.data.records?.[0];
        return record ? { latitude: record[2], longitude: record[3] } : { latitude: null, longitude: null };
    } catch (error) {
        console.error(`[${now()}] ❌ Erreur GPS pour ${mac_id}: ${error.message}`);
        return { latitude: null, longitude: null };
    }
}

async function saveDataToDatabase(records) {
    console.log(`[${now()}] 💾 Début de l'enregistrement des données...`);

    return new Promise((resolve, reject) => {
        if (!records.length) {
            console.log(`[${now()}] Aucun enregistrement à traiter.`);
            return resolve();
        }

        // Création des valeurs pour l'insertion historique
        const historiqueValues = records.map(record => [
            record.mac_id,
            JSON.stringify(record.state),
            record.latitude,
            record.longitude,
            record.seting ? JSON.stringify(record.seting) : null,
        ]);

        const historiqueQuery = `
            INSERT INTO historique_bms_data_actuel (mac_id, state, latitude, longitude, seting)
            VALUES ?
        `;

        pool.query(historiqueQuery, [historiqueValues], (err) => {
            if (err) {
                console.error(`[${now()}] ❌ Erreur lors de l'insertion dans historique_bms_data_actuel : ${err.message}`);
                return reject(err);
            }
            console.log(`[${now()}] ✅ ${records.length} enregistrements insérés dans historique_bms_data_actuel`);

            // Ensuite, traiter l'update ou insert dans bms_data
            const updatePromises = records.map(record => {
                return new Promise((resolveInner, rejectInner) => {
                    const updateQuery = `
                        UPDATE bms_data
                        SET
                            state = ?,
                            latitude = ?,
                            longitude = ?,
                            seting = ?,
                            timestamp = NOW()
                        WHERE mac_id = ?
                    `;
                    pool.query(updateQuery, [
                        JSON.stringify(record.state),
                        record.latitude,
                        record.longitude,
                        record.seting ? JSON.stringify(record.seting) : null,
                        record.mac_id
                    ], (err, result) => {
                        if (err) {
                            console.error(`[${now()}] ❌ Erreur UPDATE bms_data pour ${record.mac_id} : ${err.message}`);
                            return rejectInner(err);
                        }

                        if (result.affectedRows === 0) {
                            // Si aucune ligne mise à jour, faire un INSERT
                            const insertQuery = `
                                INSERT INTO bms_data
                                    (mac_id, state, latitude, longitude, seting, timestamp)
                                VALUES (?, ?, ?, ?, ?, NOW())
                            `;
                            pool.query(insertQuery, [
                                record.mac_id,
                                JSON.stringify(record.state),
                                record.latitude,
                                record.longitude,
                                record.seting ? JSON.stringify(record.seting) : null
                            ], (err) => {
                                if (err) {
                                    console.error(`[${now()}] ❌ Erreur INSERT bms_data pour ${record.mac_id} : ${err.message}`);
                                    return rejectInner(err);
                                }
                                console.log(`[${now()}] ➕ Insert effectué pour ${record.mac_id} dans bms_data`);
                                resolveInner();
                            });
                        } else {
                            console.log(`[${now()}] 🔄 Update effectué pour ${record.mac_id} dans bms_data`);
                            resolveInner();
                        }
                    });
                });
            });

            Promise.all(updatePromises)
                .then(() => {
                    console.log(`[${now()}] ✅ Synchronisation bms_data terminée.`);
                    resolve();
                })
                .catch(err => {
                    reject(err);
                });
        });
    });
}



let intervalId;
async function getCustomSettingsData() {
    try {
        clearTimeout(intervalId);
        console.log(`[${now()}] 🔄 Démarrage du cycle de synchronisation...`);

        const grouped = await getGroupedDeviceNumbers();

        for (const fabriquant of Object.keys(grouped)) {
            const macIds = grouped[fabriquant];
            const token = await getToken(fabriquant);
            if (!token) {
                console.warn(`[${now()}] ⚠️ Token non obtenu pour ${fabriquant}, données ignorées.`);
                continue;
            }

            const deviceNumbers = macIds.join(';');
            console.log(`[${now()}] 🌐 Récupération des données BMS pour ${fabriquant} (${macIds.length} batteries)`);

            const params = 'BMSAlarmList;BetteryType;WorkStatus;BetteryC;BetteryV_Arr;CeilingVoltage;MinimumVoltage;' +
                'CVoltageSub;SingleOverpressure;SingleUndervoltage;BetteryV_All;WholeOverpressure;WholeUndervoltage;' +
                'CPowerA;OutChargingHighCount;DPowerA;OutUnChargingHighCount;CPStatus;CPCount;DPStatus;DPCount;SCProtect;' +
                'SCPCount;BalanceType;EM;EM_Arr;BXHC;TC_T;TC_B_1;TC_B_2;TC_EXT_1;TC_EXT_2;CPSuperheat;CPSubcooled;' +
                'DPSuperheat;DPSubcooled;FCC;SYLA;SOC;CCXX;BMSCode;CHON;DHON;heart_time;jingdu;weidu;su;gps_time;miles;' +
                'gps_count;defence_status';

            const response = await axios.post('http://api.mtbms.com/api.php/ibms/getDateFunc', null, {
                params: {
                    method: 'BMSRealTimeStateByParam',
                    mds: token,
                    numbers: deviceNumbers,
                    params,
                },
            });

            if (response.data?.success === 'true') {
                const records = response.data.data.records;
                console.log(`[${now()}] ✅ ${records.length} enregistrements BMS reçus pour ${fabriquant}`);
                const recordMap = {};

                records.forEach(record => {
                    const number = (record[52] || record[42] || '').trim();
                    if (number) recordMap[number] = record;
                });

                const data = await Promise.all(macIds.map(async (mac_id) => {
                    const cleanMacId = mac_id.trim();
                    const record = recordMap[cleanMacId];

                    if (!record || record.length < 40) {
                        console.warn(`[${now()}] ⚠️ Données incomplètes ou absentes pour ${cleanMacId}, ignoré.`);
                        return null;
                    }

                    const location = await fetchLocationData(token, cleanMacId);
                    const safeParse = (val) => (typeof val === 'string' ? JSON.parse(val || '[]') : []);

                    return {
                        mac_id: cleanMacId,
                        latitude: location.latitude,
                        longitude: location.longitude,
                        state: {
                            mac_id: mac_id,
                            BMSAlarmList: JSON.parse(record[0] || '[]'),
                            BetteryType: record[1],
                            WorkStatus: record[2],
                            BetteryC: record[3],
                            BetteryV_Arr: record[4],
                            CeilingVoltage: record[5],
                            MinimumVoltage: record[6],
                            CVoltageSub: record[7],
                            SingleOverpressure: record[8],
                            SingleUndervoltage: record[9],
                            BetteryV_All: record[10],
                            WholeOverpressure: record[11],
                            WholeUndervoltage: record[12],
                            CPowerA: record[13],
                            OutChargingHighCount: record[14],
                            DPowerA: record[15],
                            OutUnChargingHighCount: record[16],
                            CPStatus: record[17],
                            CPCount: record[18],
                            DPStatus: record[19],
                            DPCount: record[20],
                            SCProtect: record[21],
                            SCPCount: record[22],
                            BalanceType: record[23],
                            EM: record[24],
                            EM_Arr: record[25],
                            BXHC: record[26],
                            TC_T: record[27],
                            TC_B_1: record[28],
                            TC_B_2: record[29],
                            TC_EXT_1: record[30],
                            TC_EXT_2: record[31],
                            CPSuperheat: record[32],
                            CPSubcooled: record[33],
                            DPSuperheat: record[34],
                            DPSubcooled: record[35],
                            FCC: record[36],
                            SYLA: record[37],
                            SOC: record[38],
                            CCXX: record[39],
                            BMSCode: record[40],
                            BMS_DateTime: record[41],
                            Number: record[42],
                        },
                        seting: {
                            mac_id: mac_id,
                            BMSAlarmList: JSON.parse(record[0] || '[]'),
                            BetteryType: record[1],
                            WorkStatus: record[2],
                            BetteryC: record[3],
                            BetteryV_Arr: record[4],
                            CeilingVoltage: record[5],
                            MinimumVoltage: record[6],
                            CVoltageSub: record[7],
                            SingleOverpressure: record[8],
                            SingleUndervoltage: record[9],
                            BetteryV_All: record[10],
                            WholeOverpressure: record[11],
                            WholeUndervoltage: record[12],
                            CPowerA: record[13],
                            OutChargingHighCount: record[14],
                            DPowerA: record[15],
                            OutUnChargingHighCount: record[16],
                            CPStatus: record[17],
                            CPCount: record[18],
                            DPStatus: record[19],
                            DPCount: record[20],
                            SCProtect: record[21],
                            SCPCount: record[22],
                            BalanceType: record[23],
                            EM: record[24],
                            EM_Arr: record[25],
                            BXHC: record[26],
                            TC_T: record[27],
                            TC_B_1: record[28],
                            TC_B_2: record[29],
                            TC_EXT_1: record[30],
                            TC_EXT_2: record[31],
                            CPSuperheat: record[32],
                            CPSubcooled: record[33],
                            DPSuperheat: record[34],
                            DPSubcooled: record[35],
                            FCC: record[36],
                            SYLA: record[37],
                            SOC: record[38],
                            CCXX: record[39],
                            BMSCode: record[40],
                            CHON: record[41],
                            DHON: record[42],
                            heart_time: record[43],
                            jingdu: record[44],
                            weidu: record[45],
                            su: record[46],
                            gps_time: record[47],
                            miles: record[48],
                            gps_count: record[49],
                            defence_status: record[50],
                            BMS_DateTime: record[51],
                            Number: record[52]
                        }
                    };
                }));

                await saveDataToDatabase(data.filter(Boolean));
            } else {
                console.error(`[${now()}] ❌ Réponse API invalide pour ${fabriquant} :`, response.data);
            }
        }
    } catch (e) {
        console.error(`[${now()}] ❌ Erreur globale pendant la synchronisation :`, e);
    } finally {
        intervalId = setTimeout(getCustomSettingsData, 20000);
    }
}

getCustomSettingsData();