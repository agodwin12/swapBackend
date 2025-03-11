const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    class Entrepot extends Model {}

    Entrepot.init({
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },
        entrepot_unique_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        nom_entrepot: {
            type: DataTypes.STRING,
            allowNull: false
        },
        nom_proprietaire: {
            type: DataTypes.STRING,
            allowNull: false
        },
        ville: {
            type: DataTypes.STRING,
            allowNull: false
        },
        quartier: {
            type: DataTypes.STRING,
            allowNull: true
        },
        telephone: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        logo: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: "Entrepot",  // ✅ Matches what you reference in `models/index.js`
        tableName: "entrepots", // ✅ Matches actual table name
        timestamps: false
    });

    return Entrepot;
};
