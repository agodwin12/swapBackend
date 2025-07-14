const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    class ContratChauffeur extends Model {
        static associate(models) {

            // Belongs to one lease association
            ContratChauffeur.belongsTo(models.AssociationUserMoto, {
                foreignKey: "association_id",
                as: "associatedUserMoto",
                onDelete: "CASCADE",
            });

            // Has many payments
            ContratChauffeur.hasMany(models.Paiement, {
                foreignKey: "contrat_chauffeur_id",
                as: "payments",
                onDelete: "CASCADE",
            });
        }
    }

    ContratChauffeur.init(
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
            montant_total: DataTypes.DECIMAL(10, 2),
            montant_paye: DataTypes.DECIMAL(10, 2),
            montant_restant: DataTypes.DECIMAL(10, 2),
            frequence_paiement: DataTypes.STRING(20),
            montant_par_paiement: DataTypes.DECIMAL(10, 2),
            date_signature: DataTypes.DATEONLY,
            date_enregistrement: DataTypes.DATEONLY,
            date_debut: DataTypes.DATEONLY,
            duree_semaines: DataTypes.INTEGER,
            duree_jours: DataTypes.INTEGER,
            date_fin: DataTypes.DATEONLY,
            statut: DataTypes.STRING(20),
            montant_engage: DataTypes.DECIMAL(10, 2),
            contrat_physique: DataTypes.STRING(100),
            montant_caution_batterie: DataTypes.DECIMAL(10, 2),
            duree_caution_batterie: DataTypes.INTEGER,
            montant_engage_batterie: DataTypes.DECIMAL(10, 2),
            jours_conges_total: DataTypes.INTEGER,
            jours_conges_utilises: DataTypes.INTEGER,
            jours_conges_restants: DataTypes.INTEGER,
            association_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            garant_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: "ContratChauffeur",
            tableName: "contrats_contratchauffeur",
            timestamps: false,

            underscored: true,
        }
    );

    return ContratChauffeur;
};
