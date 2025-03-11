const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    class UsersEntrepots extends Model {}

    UsersEntrepots.init({
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },
        users_entrepot_unique_id: {
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
        id_entrepot: {
            type: DataTypes.BIGINT,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: "UsersEntrepots",
        tableName: "users_entrepots",
        timestamps: false
    });

    // ✅ Define Association inside a function
    UsersEntrepots.associate = (models) => {
        console.log("Checking models in UsersEntrepots:", models);

        if (!models.Entrepot) {
            throw new Error("Entrepot model is missing in models object!");
        }

        UsersEntrepots.belongsTo(models.Entrepot, {
            foreignKey: "id_entrepot",
            targetKey: "id",
            as: "entrepot"
        });
    };

    return UsersEntrepots;
};
