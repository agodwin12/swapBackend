const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    class MotosValide extends Model {
        static associate(models) {
            // ✅ Association with AssociationUserMoto
            MotosValide.hasMany(models.AssociationUserMoto, {
                foreignKey: "moto_valide_id",
                as: "userAssociations",
                onDelete: "CASCADE",
            });

            // ✅ Association with LeasePayment
            MotosValide.hasMany(models.Paiement, {
                foreignKey: "id_moto",
                as: "leasePayments",
                onDelete: "CASCADE",
            });
        }
    }

    MotosValide.init(
        {
            id: {
                type: DataTypes.BIGINT.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            moto_unique_id: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            vin: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            model: {
                type: DataTypes.STRING,
                allowNull: false,
            },

            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },

        },
        {
            sequelize,
            modelName: "MotosValide",
            tableName: "motos_valides",
            timestamps: true,
            underscored: true,
            paranoid: false, // Enable soft deletes
        }
    );

    return MotosValide;
};
