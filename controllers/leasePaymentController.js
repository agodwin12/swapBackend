const db = require("../models");

const {
    Paiement,
    ContratChauffeur,
    AssociationUserMoto,
    UsersAgences,
    MotosValide,
    ValidatedUser,// ✅ Add this import
} = db;


exports.saveLeasePayment = async (req, res) => {
    try {
        console.log("🔍 [DEBUG] Received Request: POST /api/lease/pay");
        console.log("📥 [REQUEST BODY]:", req.body);

        const {
            association_id,
            montant_moto,
            montant_batterie,
            notes,
        } = req.body;

        if (!association_id) {
            return res.status(400).json({
                message: "association_id is required",
            });
        }

        if (montant_moto === undefined && montant_batterie === undefined) {
            return res.status(400).json({
                message: "At least one of montant_moto or montant_batterie must be provided.",
            });
        }

        const uniqueId = req.headers["x-user-unique-id"];
        if (!uniqueId) {
            return res.status(400).json({ message: "Missing x-user-unique-id header" });
        }

        console.log("🔐 Unique ID from header:", uniqueId);

        const userAgence = await UsersAgences.findOne({
            where: { user_agence_unique_id: uniqueId },
        });

        if (!userAgence) {
            return res.status(404).json({
                message: "User not found in UsersAgences",
            });
        }

        const id_user_agence = userAgence.id;
        console.log("✅ Found UsersAgences ID:", id_user_agence);

        const association = await AssociationUserMoto.findOne({
            where: { id: association_id, statut: "lease" },
        });

        if (!association) {
            return res.status(404).json({
                message: "Lease association not found",
            });
        }

        const contract = await ContratChauffeur.findOne({
            where: { association_id },
        });

        if (!contract) {
            return res.status(404).json({
                message: "Contract not found for association",
            });
        }

        const minMoto = parseFloat(contract.montant_par_paiement);
        const minBattery = parseFloat(contract.montant_engage_batterie);

        let motoAmount = null;
        let batteryAmount = null;

        if (montant_moto !== undefined && montant_moto !== null) {
            motoAmount = parseFloat(montant_moto);
            if (isNaN(motoAmount)) {
                return res.status(400).json({
                    message: "montant_moto must be numeric",
                });
            }
            if (motoAmount < minMoto) {
                return res.status(400).json({
                    message: `Minimum required amount for Moto is ${minMoto}`,
                });
            }
        }

        if (montant_batterie !== undefined && montant_batterie !== null) {
            batteryAmount = parseFloat(montant_batterie);
            if (isNaN(batteryAmount)) {
                return res.status(400).json({
                    message: "montant_batterie must be numeric",
                });
            }
            if (batteryAmount < minBattery) {
                return res.status(400).json({
                    message: `Minimum required amount for Battery is ${minBattery}`,
                });
            }
        }

        const totalAmount =
            (motoAmount !== null ? motoAmount : 0) +
            (batteryAmount !== null ? batteryAmount : 0);

        const today = new Date();
        const paiement = await Paiement.create({
            reference: `LEASE-${Date.now()}`,
            montant_moto: motoAmount !== null ? motoAmount : null,
            montant_batterie: batteryAmount !== null ? batteryAmount : null,
            montant_total: totalAmount,
            date_paiement: today.toISOString().split("T")[0],
            date_enregistrement: today,
            methode_paiement: "CASH",
            type_contrat: "Chauffeur",
            contrat_chauffeur_id: contract.id,
            user_agence_id: id_user_agence,
            notes: notes || null,
        });

        console.log("✅ Lease payment saved:", paiement.toJSON());

        // ✅ Update contract only for paid fields
        let oldMontantPaye = parseFloat(contract.montant_paye) || 0;
        let oldMontantTotal = parseFloat(contract.montant_total) || 0;

        let newMontantPaye = oldMontantPaye;
        let newMontantRestant = oldMontantTotal;

        if (motoAmount !== null) {
            newMontantPaye += motoAmount;
            newMontantRestant -= motoAmount;
        }

        if (batteryAmount !== null) {
            newMontantPaye += batteryAmount;
            newMontantRestant -= batteryAmount;
        }

        await contract.update({
            montant_paye: newMontantPaye,
            montant_restant: newMontantRestant,
        });

        console.log(`✅ Updated contract ${contract.id}: montant_paye=${newMontantPaye}, montant_restant=${newMontantRestant}`);

        return res.status(201).json({
            message: "Lease payment recorded successfully",
            paiement,
        });

    } catch (error) {
        console.error("❌ Error in saveLeasePayment:", error);
        return res.status(500).json({ message: "Internal server error", error });
    }
};




exports.getLeaseAssociations = async (req, res) => {
    try {
        console.log("📥 [GET] Fetching all active lease associations...");

        const associations = await db.AssociationUserMoto.findAll({
            where: { statut: "lease" },
            include: [
                {
                    model: db.ValidatedUser,
                    as: "validatedUser",
                    attributes: ["id", "nom", "prenom", "email", "phone", "photo"],
                    required: false
                },
                {
                    model: db.MotosValide,
                    as: "motoInfo",
                    attributes: ["id", "vin", "moto_unique_id", "model"],
                    required: false
                },
                {
                    model: db.ContratChauffeur,
                    as: "leaseContract", // ✅ must match association alias
                    attributes: ["id", "montant_par_paiement", "montant_engage_batterie"],
                    required: false
                }
            ]
        });

        console.log(`📦 Found ${associations.length} lease associations`);

        // Detailed debug log
        associations.forEach((a, i) => {
            console.log(`🔹 Association #${i + 1}:`);
            console.log("   - Association ID:", a.id);
            console.log("   - Driver:", a.validatedUser ? `${a.validatedUser.nom} ${a.validatedUser.prenom}` : "None");
            console.log("   - Moto:", a.motoInfo ? a.motoInfo.moto_unique_id : "None");
            console.log("   - Contract:", a.leaseContract ? a.leaseContract.id : "None");
        });

        // Format for response
        const formatted = associations.map((assoc) => ({
            association_id: assoc.id,
            driver: assoc.validatedUser,
            moto: assoc.motoInfo,
            contract: assoc.leaseContract
        }));

        return res.status(200).json(formatted);

    } catch (error) {
        console.error("❌ Error fetching lease associations:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};


exports.getLeasePaymentHistory = async (req, res) => {
    try {
        console.log("🔍 [DEBUG] Received Request: GET /api/lease/history");

        const { search, startDate, endDate } = req.query;

        // ✅ Fetch all lease-type payments, excluding id_moto explicitly
        const payments = await Paiement.findAll({
            where: { type_contrat: "chauffeur" },
            attributes: [
                "id",
                "reference",
                "montant_moto",
                "montant_batterie",
                "montant_total",
                "date_paiement",
                "date_enregistrement",
                "methode_paiement",
                "reference_transaction",
                "type_contrat",
                "statut_paiement",
                "statut_paiement_batterie",
                "statut_paiement_moto",
                "est_penalite",
                "inclut_penalites",
                "montant_penalites_inclus",
                "heure_paiement",
                "notes",
                "contrat_batterie_id",
                "contrat_chauffeur_id",
                "contrat_partenaire_id",
                "enregistre_par_id",
                "user_agence_id"
            ],
            include: [
                {
                    model: ContratChauffeur,
                    as: "contractDetails",
                    include: [
                        {
                            model: AssociationUserMoto,
                            as: "associatedUserMoto",
                            include: [
                                { model: MotosValide, as: "userMoto" },
                                { model: ValidatedUser, as: "validatedUser" }
                            ]
                        }
                    ]
                }
            ],
            order: [["date_enregistrement", "DESC"]],
        });

        // ✅ Format each record
        const formatted = payments.map((p) => {
            const assoc = p.contractDetails?.associatedUserMoto;
            return {
                reference: p.reference,
                date: p.date_paiement,
                montant_moto: p.montant_moto,
                montant_batterie: p.montant_batterie,
                montant_total: p.montant_total,
                driver_name:
                    assoc?.validatedUser?.nom || assoc?.validatedUser?.prenom
                        ? `${assoc?.validatedUser?.nom || ""} ${assoc?.validatedUser?.prenom || ""}`.trim()
                        : "N/A",
                moto_id: assoc?.userMoto?.numero_serie || assoc?.userMoto?.moto_unique_id || "N/A",
                type_contrat: p.type_contrat,
            };
        });

        // ✅ Optional filters (search and date)
        const filtered = formatted.filter((p) => {
            const matchSearch =
                !search ||
                p.driver_name.toLowerCase().includes(search.toLowerCase()) ||
                p.moto_id.toLowerCase().includes(search.toLowerCase()) ||
                p.reference.toLowerCase().includes(search.toLowerCase());

            const matchDate =
                (!startDate || new Date(p.date) >= new Date(startDate)) &&
                (!endDate || new Date(p.date) <= new Date(endDate));

            return matchSearch && matchDate;
        });

        return res.status(200).json({
            count: filtered.length,
            results: filtered,
        });
    } catch (error) {
        console.error("❌ Error in getLeasePaymentHistory:", error);
        return res.status(500).json({ message: "Internal server error", error });
    }
};


