const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    class historique_agences extends Model {}

    historique_agences.init(
        {
            id: {
                type: DataTypes.BIGINT.UNSIGNED,
                autoIncrement: true,
                primaryKey: true
            },
            id_agence: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false
            },
            id_entrepot: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true
            },
            id_distributeur: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true
            },
            bat_sortante: {
                type: DataTypes.STRING,
                allowNull: true
            },
            bat_entrante: {
                type: DataTypes.STRING,
                allowNull: true
            },
            type_swap: {
                type: DataTypes.ENUM("livraison", "retour"),
                allowNull: false
            },
            date_time: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            }
        },
        {
            sequelize,
            modelName: "historique_agences",
            tableName: "historique_agences",
            timestamps: true,
            underscored: true
        }
    );

    return historique_agences;
};
