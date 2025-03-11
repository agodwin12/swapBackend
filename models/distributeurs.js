const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    class Distributeurs extends Model {}

    Distributeurs.init({
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },
        distributeur_unique_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        nom: {
            type: DataTypes.STRING,
            allowNull: false
        },
        prenom: {
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
        phone: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: "Distributeurs",
        tableName: "distributeurs",
        timestamps: false
    });

    return Distributeurs;
};
