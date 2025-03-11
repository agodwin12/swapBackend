// Import required libraries
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

// Initialize app
const app = express();
app.use(bodyParser.json());

// Create a connection pool instead of a single connection
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Proxym2024',
    database: process.env.DB_NAME || 'tracking',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the database connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1);
    }
    console.log('Connected to the database.');
    connection.release();
});

// Export pool for use in other files
module.exports = pool;

// Login route
app.post('/login', async (req, res) => {
    const { phone, password } = req.body;

    if (!phone || !password) {
        return res.status(400).json({ error: 'Phone and password are required.' });
    }

    try {
        const query = 'SELECT * FROM users WHERE phone = ?';
        pool.query(query, [phone], async (err, results) => { // ✅ Fixed
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).json({ error: 'Internal server error.' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'User not found.' });
            }

            const user = results[0];
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return res.status(401).json({ error: 'Invalid credentials.' });
            }

            const payload = { id: user.id, phone: user.phone };
            let token = 'proxym2024';

            if (process.env.JWT_SECRET) {
                try {
                    token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
                } catch (jwtError) {
                    console.error('Error signing JWT token:', jwtError);
                    token = 'proxym2024';
                }
            }

            res.status(200).json({
                message: 'Login successful.',
                user: {
                    id: user.id,
                    user_unique_id: user.user_unique_id,
                    nom: user.nom,
                    prenom: user.prenom,
                    phone: user.phone,
                    email: user.email,
                    ville: user.ville,
                    quartier: user.quartier,
                    photo: user.photo,
                },
                token,
            });
        });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Get vehicles for a user
app.get('/user/:userId/vehicles', (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    const query = `
    SELECT v.voiture_unique_id, v.immatriculation, v.mac_id_gps, v.marque, v.model, v.couleur
    FROM association_user_voitures auv
    JOIN voitures v ON auv.voiture_id = v.id
    WHERE auv.user_id = ?;
  `;

    pool.query(query, [userId], (err, results) => { // ✅ Fixed
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ error: 'Internal server error.' });
        }

        res.status(200).json(results);
    });
});

// API to get latest location
app.post('/get-latest-location', (req, res) => {
    const { mac_id_gps } = req.body;

    if (!mac_id_gps) {
        return res.status(400).json({ error: 'mac_id_gps is required.' });
    }

    const query = `
        SELECT latitude, longitude, speed, status
        FROM locations
        WHERE mac_id_gps = ?
        ORDER BY created_at DESC
            LIMIT 1;
    `;

    pool.query(query, [mac_id_gps], (err, results) => { // ✅ Fixed
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ error: 'Internal server error.' });
        }

        if (results.length > 0) {
            const latestData = results[0];
            let gpsStatus = latestData.status.includes('1') ? 'CONNECTED' : 'DISCONNECTED';

            res.status(200).json({
                latitude: latestData.latitude,
                longitude: latestData.longitude,
                speed: latestData.speed,
                gps_status: gpsStatus,
            });
        } else {
            res.status(404).json({ error: 'No location data found for this mac_id_gps.' });
        }
    });
});


// **2️⃣ API to Get Route History**
app.post('/get-route-history', (req, res) => {
    console.log(`Request received for route history at ${new Date().toISOString()}`);
    console.log('Request body:', req.body);

    const { mac_id_gps } = req.body;

    if (!mac_id_gps) {
        return res.status(400).json({ error: 'mac_id_gps is required.' });
    }

    console.log(`Fetching route history for mac_id_gps: ${mac_id_gps}`);

    const query = `
        SELECT latitude, longitude, created_at
        FROM locations
        WHERE mac_id_gps = ?
        ORDER BY created_at ASC
            LIMIT 50;  -- Fetch last 50 points for smooth route
    `;

    db.query(query, [mac_id_gps], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ error: 'Internal server error.' });
        }

        console.log('Route history retrieved:', results.length, 'records');

        if (results.length > 0) {
            res.status(200).json({ route: results });
        } else {
            res.status(404).json({ error: 'No route history found for this mac_id_gps.' });
        }
    });
});





const login = async (loginName, loginPassword) => {
    const loginUrl = 'http://appzzl.18gps.net/';
    const loginType = 'ENTERPRISE';
    const language = 'en';
    const timeZone = 8;
    const ISMD5 = 0;
    const apply = 'APP';

    try {
        const response = await axios.get('http://apitest.18gps.net/GetDateServices.asmx/loginSystem', {
            params: {
                LoginName: loginName,
                LoginPassword: loginPassword,
                LoginType: loginType,
                language: language,
                timeZone: timeZone,
                apply: apply,
                ISMD5: ISMD5,
                loginUrl: loginUrl,
            },
        });

        const data = response.data;

        if (data.success === 'true') {
            return data.mds;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Login Error:', error);
        return null;
    }
};

const issueCommand = async (token, deviceNumber, command, params, password, sendTime) => {
    const method = 'SendCommands';
    const url = 'http://apitest.18gps.net/GetDateServices.asmx/GetDate';

    try {
        const response = await axios.get(url, {
            params: {
                method: method,
                macid: deviceNumber,
                cmd: command,
                param: params,
                pwd: password,
                sendTime: sendTime,
                mds: token,
            },
        });

        return response.data;
    } catch (error) {
        console.error('Error issuing command:', error);
        return null;
    }
};

app.post('/issue-command', async (req, res) => {
    console.log('Received request:', req.body); // Log the full request body

    const { loginName, loginPassword, deviceNumber, command, params, password, sendTime } = req.body;

    console.log(`Attempting login with:
        Login Name: ${loginName}
        Password: [HIDDEN]`);

    const token = await login(loginName, loginPassword);

    if (!token) {
        console.error('Login failed');
        return res.status(401).json({ success: false, errorDescribe: 'Login failed' });
    }

    console.log('Login successful, token received:', token);

    console.log(`Issuing command:
        Device Number: ${deviceNumber}
        Command: ${command}
        Params: ${params}
        Password: [HIDDEN]
        Send Time: ${sendTime}`);

    const commandResponse = await issueCommand(token, deviceNumber, command, params, password, sendTime);

    if (commandResponse) {
        console.log('Command issued successfully:', commandResponse);
        res.json(commandResponse);
    } else {
        console.error('Failed to issue command');
        res.status(500).json({ success: false, errorDescribe: 'Failed to issue command' });
    }
});


// Start server
const PORT = process.env.PORT || 3009;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
