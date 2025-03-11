const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    class BatteryMotoUserAssociation extends Model {
        static associate(models) {
            // ✅ Association with `ValidatedUser`
            BatteryMotoUserAssociation.belongsTo(models.ValidatedUser, {
                foreignKey: "association_user_moto_id",
                as: "user",
                onDelete: "CASCADE",
            });

            // ✅ Association with `BatteryValide`
            BatteryMotoUserAssociation.belongsTo(models.BatteryValide, {
                foreignKey: "battery_id",
                as: "battery",
                onDelete: "CASCADE",
            });
        }
    }

    BatteryMotoUserAssociation.init(
        {
            id: {
                type: DataTypes.BIGINT.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            association_user_moto_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            battery_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: "BatteryMotoUserAssociation", // ✅ Keep PascalCase for model names
            tableName: "battery_moto_user_association", // ✅ Explicit table name
            timestamps: true, // ✅ Sequelize auto-generates `createdAt` & `updatedAt`
            underscored: true, // ✅ Uses snake_case column names
        }
    );

    return BatteryMotoUserAssociation;
};
