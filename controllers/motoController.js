const db = require('../models');  // Ensure you import the entire models object
const ValidatedUser = db.ValidatedUser;
const AssociationUserMoto = db.AssociationUserMoto;
const MotoValide = db.MotosValide;


exports.getAllUsers = async (req, res) => {
    try {
        console.log("🔍 Fetching all users...");

        const users = await ValidatedUser.findAll({
            attributes: ["id", "nom", "prenom", "phone", "email", "photo"], // Fetch only necessary fields
        });

        console.log(`✅ Found ${users.length} users`);
        return res.status(200).json(users);
    } catch (error) {
        console.error("🚨 Error fetching users:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * ✅ Get moto details by phone number
 */
exports.getMotoByPhone = async (req, res) => {
    try {
        const { phone } = req.params;
        console.log(`🔍 Searching for user with phone: ${phone}`);

        // Step 1: Find the user by phone number
        const user = await ValidatedUser.findOne({
            where: { phone },
            attributes: ["id", "nom", "prenom", "phone"]
        });

        if (!user) {
            console.log(`❌ No user found with phone: ${phone}`);
            return res.status(404).json({ message: "User not found" });
        }

        console.log(`✅ User found: ${JSON.stringify(user)}`);

        // Step 2: Find all moto associations for this user
        console.log(`🔍 Searching for all moto associations for user ID: ${user.id}`);
        const associations = await AssociationUserMoto.findAll({
            where: { validated_user_id: user.id }
        });

        if (!associations || associations.length === 0) {
            console.log(`❌ No moto associations found for user ID: ${user.id}`);
            return res.status(404).json({ message: "No associated motos found for this user" });
        }

        console.log(`✅ Moto associations found: ${JSON.stringify(associations)}`);

        // Step 3: Get all moto details linked to the user
        const motoIds = associations.map(a => a.moto_valide_id);
        const motos = await MotoValide.findAll({
            where: { id: motoIds },
            attributes: ["moto_unique_id", "vin", "model"]
        });

        if (!motos || motos.length === 0) {
            console.log(`❌ No motos found for user ID: ${user.id}`);
            return res.status(404).json({ message: "Motos not found" });
        }

        console.log(`✅ Motos found: ${JSON.stringify(motos)}`);

        // Step 4: Return user & associated motos details
        console.log(`🚀 Returning user & moto details`);

        return res.status(200).json({
            user: {
                nom: user.nom,
                prenom: user.prenom,
                phone: user.phone,
            },
            motos: motos.map(moto => ({
                moto_unique_id: moto.moto_unique_id,
                vin: moto.vin,
                model: moto.model
            }))
        });

    } catch (error) {
        console.error("🚨 Error fetching moto details:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};