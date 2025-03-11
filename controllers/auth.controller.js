const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { UsersAgences, UsersEntrepots, Distributeurs } = require("../models");

exports.login = async (req, res) => {
    const { unique_id, password } = req.body;

    console.log("🔍 [LOGIN ATTEMPT] Received request with:");
    console.log(`📌 Unique ID: ${unique_id}`);

    try {
        let uniqueId = null;
        let user = null;
        let userType = null;
        let idAgence = null;
        let idEntrepot = null;
        let name = null;

        // Identify user type based on unique_id prefix
        if (unique_id.startsWith("AG")) {
            console.log("🛠️ [CHECK] Searching in UsersAgences...");
            user = await UsersAgences.findOne({
                where: { user_agence_unique_id: unique_id },
                attributes: ["id", "nom", "email", "phone", "ville", "quartier", "password", "id_agence", "user_agence_unique_id"],
            });
            userType = "Agence";
            uniqueId = user ? user.user_agence_unique_id : null;
            name = user ? user.nom : null;
            idAgence = user ? user.id_agence : null;
        } else if (unique_id.startsWith("EN")) {
            console.log("🛠️ [CHECK] Searching in UsersEntrepots...");
            user = await UsersEntrepots.findOne({
                where: { users_entrepot_unique_id: unique_id },
                attributes: ["id", "nom", "prenom", "email", "phone", "ville", "quartier", "password", "id_entrepot", "users_entrepot_unique_id"],
            });
            userType = "Entrepot";
            uniqueId = user ? user.users_entrepot_unique_id : null;
            name = user ? `${user.nom} ${user.prenom}` : null;
            idEntrepot = user ? user.id_entrepot : null;
        } else if (unique_id.startsWith("Dt")) {
            console.log("🛠️ [CHECK] Searching in Distributeurs...");
            user = await Distributeurs.findOne({
                where: { distributeur_unique_id: unique_id },
                attributes: ["id", "nom", "prenom", "email", "phone", "ville", "quartier", "password", "distributeur_unique_id"],
            });
            userType = "Distributeur";
            uniqueId = user ? user.distributeur_unique_id : null;
            name = user ? `${user.nom} ${user.prenom}` : null;
        } else {
            console.log("❌ [ERROR] Invalid Unique ID format.");
            return res.status(400).json({ message: "Invalid Unique ID format" });
        }

        // If user not found
        if (!user) {
            console.log(`❌ [ERROR] No user found in ${userType}`);
            return res.status(404).json({ message: "User not found" });
        }

        console.log(`✅ [SUCCESS] User found in ${userType} table!`);
        console.log("🔑 [SECURITY] Checking password...");

        // Ensure password exists before comparison
        if (!user.password) {
            console.log("❌ [ERROR] Password field is missing in the database!");
            return res.status(500).json({ message: "Server error: User password missing in the database" });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("❌ [ERROR] Invalid password attempt.");
            return res.status(401).json({ message: "Invalid credentials" });
        }

        console.log("✅ [SUCCESS] Password matched!");

        // Generate JWT Token
        console.log("🔐 [TOKEN] Generating JWT token...");
        const token = jwt.sign(
            { id: user.id, unique_id: uniqueId, userType, idAgence, idEntrepot },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        // Fetch all user details
        const userDetails = {
            id: user.id,
            unique_id: uniqueId,  // ✅ Now correctly assigned
            name: name,
            phone: user.phone,
            email: user.email,
            location: user.ville + (user.quartier ? `, ${user.quartier}` : ""),
            userType,
            id_agence: idAgence,
            id_entrepot: idEntrepot
        };

        console.log("🚀 [RESPONSE] Login successful! Sending user details...");
        console.log("📝 [USER DETAILS]", userDetails);

        return res.json({ token, user: userDetails });

    } catch (error) {
        console.error("🔥 [SERVER ERROR] Login error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
