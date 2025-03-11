const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const UsersAgences = sequelize.define("UsersAgences", {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
        },
        user_agence_unique_id: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        nom: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        prenom: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        phone: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        ville: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        quartier: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        photo: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        id_agence: {
            type: DataTypes.BIGINT,
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
    }, {
        tableName: "users_agences",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    });

    return UsersAgences;
};
