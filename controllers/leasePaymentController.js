const db = require("../models");
const LeasePayment = db.LeasePayment;
const MotosValide = db.MotosValide; // ✅ Import motos_valides model
const UserAgence = db.UserAgences;   // ✅ Import users_agences model

/**
 * ✅ Save Lease Payment with Foreign Key Lookups
 */
exports.saveLeasePayment = async (req, res) => {
    try {
        console.log("🔍 [DEBUG] Received Request: POST /api/payments/lease");
        console.log("📥 [REQUEST BODY]:", req.body);

        // ✅ Extract request body
        const { id_moto, montant_lease, montant_battery, id_user_agence } = req.body;

        console.log("🛠 [VALIDATING DATA]...");
        console.log(`   ➡️ id_moto: ${id_moto}`);
        console.log(`   ➡️ montant_lease: ${montant_lease}`);
        console.log(`   ➡️ montant_battery: ${montant_battery}`);
        console.log(`   ➡️ id_user_agence: ${id_user_agence}`);

        // ✅ Validate required fields (EXCEPT `montant_battery`)
        if (!id_moto || !montant_lease || !id_user_agence) {
            console.log("❌ [ERROR] Missing required fields.");
            return res.status(400).json({ message: "id_moto, montant_lease, and id_user_agence are required." });
        }

        // ✅ Convert `montant_battery` properly (allow null)
        const parsedMontantBattery = montant_battery !== null && montant_battery !== undefined
            ? parseFloat(montant_battery)
            : 0;

        // 🔹 Step 1: Get `id_moto` from `motos_valides` table
        console.log("🔎 Searching for moto in motos_valides...");
        const moto = await MotosValide.findOne({
            where: { moto_unique_id: id_moto }, // ✅ Match the actual request field
            attributes: ["id"]
        });

        if (!moto) {
            console.log("❌ [ERROR] Moto not found!");
            return res.status(404).json({ message: "Moto not found." });
        }

        console.log(`✅ [FOUND] Moto ID: ${moto.id}`);

        // 🔹 Step 2: Get `id_user_agence` from `users_agences` table
        console.log("🔎 Searching for agence in users_agences...");
        const agence = await UserAgence.findOne({
            where: { user_agence_unique_id: id_user_agence },
            attributes: ["id"]
        });

        if (!agence) {
            console.log("❌ [ERROR] Agence not found!");
            return res.status(404).json({ message: "Agence not found." });
        }

        console.log(`✅ [FOUND] Agence ID: ${agence.id}`);

        // 🔹 Step 3: Calculate total lease amount safely
        const total_lease = parseFloat(montant_lease) + parsedMontantBattery;
        console.log(`✅ [CALCULATED TOTAL LEASE]: ${total_lease}`);

        // 🔹 Step 4: Save to database
        console.log("💾 [SAVING TO DATABASE]...");
        const newLeasePayment = await LeasePayment.create({
            id_moto: moto.id,
            montant_lease: parseFloat(montant_lease),
            montant_battery: parsedMontantBattery, // ✅ Allow null or 0
            total_lease,
            statut: "paid",
            id_user_agence: agence.id
        });

        console.log("✅ [SUCCESS] Lease Payment Recorded:");
        console.log(JSON.stringify(newLeasePayment, null, 2));

        return res.status(201).json({
            message: "Lease payment recorded successfully.",
            lease_payment: newLeasePayment
        });

    } catch (error) {
        console.error("🚨 [ERROR] Saving lease payment:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.toString() });
    }
};
