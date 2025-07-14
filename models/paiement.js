const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    class Paiement extends Model {
       static associate(models) {


      //    Paiement.belongsTo(models.MotosValide, {
         //       foreignKey: "id_moto",
         //       as: "motoDetails",
      //   });

            Paiement.belongsTo(models.UsersAgences, {
                foreignKey: "user_agence_id",
                as: "agenceDetails",
            });

            Paiement.belongsTo(models.ContratChauffeur, {
                foreignKey: "contrat_chauffeur_id",
                as: "contractDetails",
            });
        }
    }

    Paiement.init(
        {
            id: {
                type: DataTypes.BIGINT.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            reference: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            montant_moto: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
            montant_batterie: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
            montant_total: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
            date_paiement: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
            date_enregistrement: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            methode_paiement: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            reference_transaction: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            type_contrat: {
                type: DataTypes.STRING(20),
                allowNull: false,
            },
            statut_paiement: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            statut_paiement_batterie: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            statut_paiement_moto: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            est_penalite: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            inclut_penalites: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            montant_penalites_inclus: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0.0,
            },
            heure_paiement: {
                type: DataTypes.TIME,
                allowNull: true,
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            contrat_batterie_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            contrat_chauffeur_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            contrat_partenaire_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            enregistre_par_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            user_agence_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: "Paiement",
            tableName: "payments_paiement",
            timestamps: false,
            underscored: true,
        }
    );

    return Paiement;
};
