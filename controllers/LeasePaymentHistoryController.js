const db = require("../models");
const LeasePayment = db.LeasePayment;
const MotosValide = db.MotosValide;
const UsersAgences = db.UsersAgences;
const MotoUserAssociation = db.AssociationUserMoto;
const ValidatedUser = db.ValidatedUser;

/**
 * ✅ Fetch Lease Payment History by `uniqueId`
 */
exports.getUserLeasePaymentHistory = async (req, res) => {
    try {
        console.log("🔍 [DEBUG] Received Request: GET /api/payments/lease/history", req.query);

        const { uniqueId } = req.query;

        if (!uniqueId) {
            console.log("❌ [ERROR] Missing uniqueId in request");
            return res.status(400).json({ message: "Error: uniqueId is required." });
        }

        console.log(`🔍 [DEBUG] Fetching Lease History for uniqueId: ${uniqueId}`);

        // 🔹 Step 1: Fetch `id` from `users_agences` using `uniqueId`
        const userAgence = await UsersAgences.findOne({
            where: { user_agence_unique_id: uniqueId },
            attributes: ["id", "user_agence_unique_id", "nom"],
        });

        if (!userAgence) {
            console.log("❌ [ERROR] Agence User not found.");
            return res.status(404).json({ message: "Agence User not found." });
        }

        console.log(`✅ [SUCCESS] Found UserAgence ID: ${userAgence.id}`);

        // 🔹 Step 2: Fetch Lease Payments using the `id_user_agence`
        const leaseHistory = await LeasePayment.findAll({
            where: { id_user_agence: userAgence.id },
            include: [
                {
                    model: MotosValide,
                    as: "motoDetails",
                    attributes: ["moto_unique_id", "vin"],
                    include: [
                        {
                            model: MotoUserAssociation,
                            as: "userAssociations",
                            attributes: ["validated_user_id"],
                            include: [
                                {
                                    model: ValidatedUser,
                                    as: "validatedUser",
                                    attributes: ["id", "nom", "prenom", "phone"]
                                }
                            ]
                        }
                    ]
                },
                {
                    model: UsersAgences,
                    as: "agenceDetails",
                    attributes: ["user_agence_unique_id", "nom"]
                }
            ],
            order: [["created_at", "DESC"]]
        });

        if (!leaseHistory.length) {
            console.log("⚠️ [INFO] No lease history found for this user.");
            return res.status(404).json({ message: "No lease history found for this user." });
        }

        console.log(`✅ [SUCCESS] Found ${leaseHistory.length} lease payments`);

        // 🔹 Debug Log: Print all retrieved lease records
        leaseHistory.forEach((lease, index) => {
            console.log(`🔹 [Lease ${index + 1}]`, {
                id: lease.id,
                montant_lease: lease.montant_lease,
                montant_battery: lease.montant_battery,
                total_lease: lease.total_lease,
                statut: lease.statut,
                created_at: lease.created_at,
                moto: lease.motoDetails ? {
                    moto_unique_id: lease.motoDetails.moto_unique_id,
                    vin: lease.motoDetails.vin
                } : null,
                user: lease.motoDetails?.userAssociations?.length
                    ? {
                        id: lease.motoDetails.userAssociations[0].validatedUser.id,
                        nom: lease.motoDetails.userAssociations[0].validatedUser.nom,
                        prenom: lease.motoDetails.userAssociations[0].validatedUser.prenom,
                        phone: lease.motoDetails.userAssociations[0].validatedUser.phone
                    }
                    : "❌ No user data",
                agence: {
                    user_agence_unique_id: lease.agenceDetails?.user_agence_unique_id || "Unknown",
                    nom: lease.agenceDetails?.nom || "Unknown"
                }
            });
        });

        return res.status(200).json({
            message: "Lease payment history fetched successfully.",
            total_records: leaseHistory.length,
            lease_payments: leaseHistory.map(lease => ({
                id: lease.id,
                montant_lease: lease.montant_lease,
                montant_battery: lease.montant_battery,
                total_lease: lease.total_lease,
                statut: lease.statut,
                created_at: lease.created_at || "Unknown Date",
                moto: lease.motoDetails ? {
                    moto_unique_id: lease.motoDetails.moto_unique_id,
                    vin: lease.motoDetails.vin
                } : null,
                user: lease.motoDetails?.userAssociations?.length
                    ? {
                        id: lease.motoDetails.userAssociations[0].validatedUser.id,
                        nom: lease.motoDetails.userAssociations[0].validatedUser.nom,
                        prenom: lease.motoDetails.userAssociations[0].validatedUser.prenom,
                        phone: lease.motoDetails.userAssociations[0].validatedUser.phone
                    }
                    : null,
                agence: {
                    user_agence_unique_id: lease.agenceDetails?.user_agence_unique_id || "Unknown",
                    nom: lease.agenceDetails?.nom || "Unknown"
                }
            }))
        });

    } catch (error) {
        console.error("🚨 [ERROR] Fetching lease payment history:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.toString() });
    }
};
