const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    class ValidatedUser extends Model {
        static associate(models) {
            ValidatedUser.hasMany(models.AssociationUserMoto, {
                foreignKey: "validated_user_id",
                as: "associations",
                onDelete: "CASCADE",
            });
        }
    }

    ValidatedUser.init(
        {
            id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },
            user_unique_id: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            nom: DataTypes.STRING,
            prenom: DataTypes.STRING,
            email: DataTypes.STRING,
            phone: DataTypes.STRING,
            status: DataTypes.STRING,
            photo: DataTypes.STRING,
            domicile: DataTypes.STRING,
        },
        {
            sequelize,
            modelName: "ValidatedUser",
            tableName: "validated_users",
            timestamps: true,
            paranoid: true,
            underscored: true,
        }
    );

    return ValidatedUser;
};
