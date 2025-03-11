module.exports = (sequelize, DataTypes) => {
    const HistoriqueEntrepot = sequelize.define("HistoriqueEntrepot", {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        id_entrepot: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        id_distributeur: {
            type: DataTypes.BIGINT,
            allowNull: true, // ✅ Can be null if swap is directly with an Agence
        },
        id_agence: {
            type: DataTypes.BIGINT,
            allowNull: true, // ✅ Can be null if swap is with a Distributeur
        },
        bat_sortante: {
            type: DataTypes.TEXT, // Stores JSON string of outgoing batteries
            allowNull: true,
        },
        bat_entrante: {
            type: DataTypes.TEXT, // Stores JSON string of incoming batteries
            allowNull: true,
        },
        type_swap: {
            type: DataTypes.ENUM("livraison", "retour"),
            allowNull: false,
        },
        id_user_entrepot: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: true,
        }
    }, {
        tableName: "historique_entrepots",
        timestamps: true,
        createdAt: "created_at", // ✅ Explicitly map `createdAt` -> `created_at`
        updatedAt: "updated_at",
    });

    // ✅ Associations
    HistoriqueEntrepot.associate = (models) => {
        // 🔹 Associate with Entrepôt
        HistoriqueEntrepot.belongsTo(models.Entrepot, {
            foreignKey: "id_entrepot",
            as: "entrepot",
            onDelete: "CASCADE",
        });

        // 🔹 Associate with Distributeur
        HistoriqueEntrepot.belongsTo(models.Distributeurs, {
            foreignKey: "id_distributeur",
            as: "distributeur",
            onDelete: "SET NULL",
        });

        // 🔹 Associate with Agence (Station de Swap)
        HistoriqueEntrepot.belongsTo(models.Agences, {
            foreignKey: "id_agence",
            as: "agence",
            onDelete: "SET NULL",
        });
    };

    return HistoriqueEntrepot;
};
