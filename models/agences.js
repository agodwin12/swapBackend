const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    class Agences extends Model {}

    Agences.init({
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },
        agence_unique_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        nom_agence: {
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
        }
    }, {
        sequelize,
        modelName: "Agences",
        tableName: "agences",
        timestamps: false
    });

    return Agences;
};
