const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    class BatteryValide extends Model {
        static associate(models) {
            // ✅ Ensure `BatteryAgence` is available
            if (models.BatteryAgence) {
                BatteryValide.hasMany(models.BatteryAgence, {
                    foreignKey: "id_battery_valide",
                    as: "batteriesAgences",
                    onDelete: "CASCADE",
                });
            }
        }
    }

    BatteryValide.init(
        {
            id: {
                type: DataTypes.BIGINT.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            batterie_unique_id: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            mac_id: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            date_production: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            gps: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            fabriquant: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            statut: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "en attente",
            },
            deleted_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: true,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: true,
                defaultValue: DataTypes.NOW,
            },
        },



        {
            sequelize,
            modelName: "BatteryValide",
            tableName: "batteries_valides",
            timestamps: true,
            underscored: true,
            paranoid: true,
        }
    );


    return BatteryValide;
};
