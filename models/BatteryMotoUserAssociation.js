const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    class BatteryMotoUserAssociation extends Model {
        static associate(models) {
            // ✅ BatteryValide
            BatteryMotoUserAssociation.belongsTo(models.BatteryValide, {
                foreignKey: "battery_id",
                as: "battery",
                onDelete: "CASCADE",
            });

            // ✅ Correct association to AssociationUserMoto
            BatteryMotoUserAssociation.belongsTo(models.AssociationUserMoto, {
                foreignKey: "association_user_moto_id",
                as: "association",
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
            modelName: "BatteryMotoUserAssociation",
            tableName: "battery_moto_user_association",
            timestamps: true,
            underscored: true,
        }
    );

    return BatteryMotoUserAssociation;
};
