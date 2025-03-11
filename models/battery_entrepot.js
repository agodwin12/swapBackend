const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    class BatteryEntrepot extends Model {
        static associate(models) {
            BatteryEntrepot.belongsTo(models.BatteryValide, {
                foreignKey: "id_battery_valide",
                as: "batteryValide", // ✅ Ensure this alias matches the one used in `include`
            });
        }
    }

    BatteryEntrepot.init(
        {
            id: {
                type: DataTypes.BIGINT,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            id_battery_valide: {
                type: DataTypes.BIGINT,
                allowNull: false,
            },
            id_entrepot: {
                type: DataTypes.BIGINT,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: "BatteryEntrepot",
            tableName: "battery_entrepots",
            timestamps: false,
        }
    );

    return BatteryEntrepot;
};
