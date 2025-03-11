const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    class ValidatedUser extends Model {
        static associate(models) {
            // ✅ Each user can be associated with many battery-moto-user associations
            ValidatedUser.hasMany(models.BatteryMotoUserAssociation, {
                foreignKey: "association_user_moto_id",
                as: "batteryAssociations",
                onDelete: "CASCADE",
            });
        }
    }

    ValidatedUser.init(
        {
            id: {
                type: DataTypes.BIGINT.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            user_unique_id: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            nom: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            prenom: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            phone: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            photo: {
                type: DataTypes.STRING,
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
            modelName: "ValidatedUser",
            tableName: "validated_users",
            timestamps: true,
            underscored: true,
        }
    );

    return ValidatedUser;
};
