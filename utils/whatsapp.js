const axios = require("axios");
require("dotenv").config();

const ULTRAMSG_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID;
const ULTRAMSG_TOKEN = process.env.ULTRAMSG_TOKEN;

const sendWhatsAppMessage = async (to, message) => {
    try {
        const url = `https://api.ultramsg.com/${ULTRAMSG_INSTANCE_ID}/messages/chat`;

        // Ensure the number is formatted correctly without the '+'
        const formattedPhoneNumber = to.replace("+", "");

        const response = await axios.post(url, null, {
            params: {
                token: ULTRAMSG_TOKEN,
                to: formattedPhoneNumber,
                body: message,
            },
        });

        console.log("✅ WhatsApp message sent via UltraMsg:", response.data);
    } catch (error) {
        console.error("❌ UltraMsg WhatsApp error:", error.response?.data || error.message);
    }
};

module.exports = { sendWhatsAppMessage };
