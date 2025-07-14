const { Agences, UsersAgences } = require("../models");
const { sendWhatsAppMessage } = require("../utils/whatsapp");

// 📲 WhatsApp recipient number for Admin
const WHATSAPP_ADMIN_PHONE = "237673927172"; // Correct format without '+'

// ✅ Update energy status
exports.updateAgenceEnergyStatus = async (req, res) => {
    try {
        const { energy } = req.body;
        const uniqueId = req.headers["x-user-unique-id"];

        if (energy !== 0 && energy !== 1) {
            return res.status(400).json({ message: "Invalid energy value (must be 0 or 1)" });
        }

        if (!uniqueId) {
            return res.status(400).json({ message: "Missing x-user-unique-id header" });
        }

        const userAgence = await UsersAgences.findOne({
            where: { user_agence_unique_id: uniqueId },
            include: [{ model: Agences, as: "agence" }],
        });

        if (!userAgence || !userAgence.agence) {
            return res.status(404).json({ message: "Agence not found for this user" });
        }

        userAgence.agence.energy = energy;
        await userAgence.agence.save();

        const agenceName = userAgence.agence.nom_agence || "Unknown Agence";
        const location = `${userAgence.agence.ville || "Unknown City"}${userAgence.agence.quartier ? ", " + userAgence.agence.quartier : ""}`;

        // Enhanced message with emojis and bold text
        const message = energy === 1
            ? `✨💡 **Electricity is back** at *"${agenceName}"*, located at *${location}* 🏙️.\n\n🌟 The lights are ON, the power is flowing! 🔋🔌🌈`
            : `⚠️❌ **Power outage** at *"${agenceName}"*, located at *${location}* 🏙️.\n\n🔴 No electricity, please stay safe! ⚡😓`;

        await sendWhatsAppMessage(WHATSAPP_ADMIN_PHONE, message);

        return res.status(200).json({
            message: `Agence energy status updated to ${energy === 1 ? "ON" : "OFF"}`,
            agence_id: userAgence.agence.id,
            energy: userAgence.agence.energy,
        });
    } catch (error) {
        console.error("❌ Error in updateAgenceEnergyStatus:", error);
        return res.status(500).json({ message: "Internal server error", error });
    }
};

// ✅ Get current energy status
exports.getAgenceEnergyStatus = async (req, res) => {
    try {
        const uniqueId = req.headers["x-user-unique-id"];

        if (!uniqueId) {
            return res.status(400).json({ message: "Missing x-user-unique-id header" });
        }

        const userAgence = await UsersAgences.findOne({
            where: { user_agence_unique_id: uniqueId },
            include: [{ model: Agences, as: "agence" }],
        });

        if (!userAgence || !userAgence.agence) {
            return res.status(404).json({ message: "Agence not found for this user" });
        }

        const agence = userAgence.agence;
        const statusMessage = agence.energy === 1
            ? `💡 The power is ON at "${agence.nom_agence}"! 🌞`
            : `❌ ⚡ No electricity at "${agence.nom_agence}". Please be safe. 🚨`;

        return res.status(200).json({
            message: statusMessage,
            agence_id: agence.id,
            energy: agence.energy,
            status: agence.energy === 1 ? "ON" : "OFF",
            agence_name: agence.nom_agence || "Unknown",
            location: `${agence.ville || "Unknown"}${agence.quartier ? ", " + agence.quartier : ""}`,
        });
    } catch (error) {
        console.error("❌ Error in getAgenceEnergyStatus:", error);
        return res.status(500).json({ message: "Internal server error", error });
    }
};

// ✅ Toggle energy status
exports.toggleAgenceEnergyStatus = async (req, res) => {
    try {
        const uniqueId = req.headers["x-user-unique-id"];

        if (!uniqueId) {
            return res.status(400).json({ message: "Missing x-user-unique-id header" });
        }

        const userAgence = await UsersAgences.findOne({
            where: { user_agence_unique_id: uniqueId },
            include: [{ model: Agences, as: "agence" }],
        });

        if (!userAgence || !userAgence.agence) {
            return res.status(404).json({ message: "Agence not found for this user" });
        }

        const currentEnergy = userAgence.agence.energy;
        const newEnergy = currentEnergy === 1 ? 0 : 1;

        userAgence.agence.energy = newEnergy;
        await userAgence.agence.save();

        const agenceName = userAgence.agence.nom_agence || "Unknown Agence";
        const location = `${userAgence.agence.ville || "Unknown City"}${userAgence.agence.quartier ? ", " + userAgence.agence.quartier : ""}`;

        // Enhanced message with emojis and bold text
        const message = newEnergy === 1
            ? `✨💡 **Electricity is back** at *"${agenceName}"*, located at *${location}* 🏙️.\n\n🌟 The lights are ON, the power is flowing! 🔋🔌🌈`
            : `⚠️❌ **Power outage** at *"${agenceName}"*, located at *${location}* 🏙️.\n\n🔴 No electricity, please stay safe! ⚡😓`;

        await sendWhatsAppMessage(WHATSAPP_ADMIN_PHONE, message);

        return res.status(200).json({
            message: `Agence energy status toggled to ${newEnergy === 1 ? "ON" : "OFF"}`,
            agence_id: userAgence.agence.id,
            previous_energy: currentEnergy,
            energy: newEnergy,
            status: newEnergy === 1 ? "ON" : "OFF",
        });
    } catch (error) {
        console.error("❌ Error in toggleAgenceEnergyStatus:", error);
        return res.status(500).json({ message: "Internal server error", error });
    }
};
