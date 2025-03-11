const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    class BatteryAgence extends Model {
        static associate(models) {
            BatteryAgence.belongsTo(models.BatteryValide, {
                foreignKey: "id_battery_valide",
                as: "battery",
                onDelete: "CASCADE",
            });

            BatteryAgence.belongsTo(models.Agences, {
                foreignKey: "id_agence",
                as: "agence",
                onDelete: "CASCADE",
            });
        }
    }

    BatteryAgence.init(
        {
            id: {
                type: DataTypes.BIGINT.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            id_battery_valide: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            id_agence: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
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
            modelName: "BatteryAgence",
            tableName: "battery_agences",
            timestamps: true,
            underscored: true,
        }
    );

    return BatteryAgence;
};
