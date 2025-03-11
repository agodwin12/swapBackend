const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UsersEntrepots = sequelize.define(
    "users_entrepots",
    {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        users_entrepot_unique_id: {
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
        ville: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        quartier: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        photo: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        id_role_entite: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        id_entrepot: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        timestamps: true,
        underscored: true,
        tableName: "users_entrepots",
    }
);

module.exports = UsersEntrepots;
