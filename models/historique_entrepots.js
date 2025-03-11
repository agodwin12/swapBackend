const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
    class HistoriqueEntrepot extends Model {}

    HistoriqueEntrepot.init(
        {
            id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
            id_entrepot: { type: DataTypes.BIGINT, allowNull: false },
            id_agence: { type: DataTypes.BIGINT, allowNull: false },
            id_user_entrepot: {
                type: DataTypes.STRING,  // 🔥 Matches the user_entrepots table format
                allowNull: false
            },
            bat_sortante: { type: DataTypes.STRING, allowNull: true }, // Comma-separated battery IDs
            bat_entrante: { type: DataTypes.STRING, allowNull: true }, // Comma-separated battery IDs
            type_swap: {
                type: DataTypes.ENUM("livraison", "retour"),
                allowNull: false,
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: true,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            sequelize,
            modelName: "HistoriqueEntrepot",
            tableName: "historique_entrepots",
            timestamps: true,
            underscored: true, // Uses created_at instead of createdAt
        }
    );

    // ✅ Define Association with `Agences`
    HistoriqueEntrepot.associate = (models) => {
        HistoriqueEntrepot.belongsTo(models.Agences, {
            foreignKey: "id_agence",
            as: "agence"
        });
    };

    return HistoriqueEntrepot;
};
