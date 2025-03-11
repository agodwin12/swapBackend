const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    class MotosValide extends Model {
        static associate(models) {
            MotosValide.hasMany(models.AssociationUserMoto, {
                foreignKey: "moto_valide_id",
                as: "userAssociations",
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
            marque: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            modele: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            statut: {
                type: DataTypes.ENUM("active", "inactive"),
                allowNull: false,
                defaultValue: "active",
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            deletedAt: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: "MotosValide",
            tableName: "motos_valides",
            timestamps: true,
            paranoid: true, // Enable soft deletes
        }
    );

    return MotosValide;
};
