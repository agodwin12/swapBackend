const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    return sequelize.define("users_agences", {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        user_agence_unique_id: { type: DataTypes.STRING, allowNull: false, unique: true },
        nom: { type: DataTypes.STRING, allowNull: false },
        prenom: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false },
        phone: { type: DataTypes.STRING, allowNull: false },
        ville: { type: DataTypes.STRING, allowNull: false },
        quartier: { type: DataTypes.STRING, allowNull: false },
        id_role_entite: { type: DataTypes.BIGINT, allowNull: false },
        id_agence: { type: DataTypes.BIGINT, allowNull: false },
        photo: { type: DataTypes.STRING, allowNull: true },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, {
        timestamps: true,
        underscored: true
    });
};
