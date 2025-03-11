module.exports = (sequelize, DataTypes) => {
    const BatteryDistributeur = sequelize.define("BatteryDistributeur", {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        id_battery_valide: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        id_distributeur: {
            type: DataTypes.BIGINT,
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
        tableName: "battery_distributeurs",
        timestamps: true,
        createdAt: "created_at", // ✅ Explicitly map `createdAt` -> `created_at`
        updatedAt: "updated_at",
    });

    // ✅ Define Associations with UNIQUE ALIASES
    BatteryDistributeur.associate = (models) => {
        BatteryDistributeur.belongsTo(models.BatteryValide, {
            foreignKey: "id_battery_valide",
            as: "batteryForDistributeur", // ✅ Unique alias
            onDelete: "CASCADE",
        });

        BatteryDistributeur.belongsTo(models.Distributeurs, {
            foreignKey: "id_distributeur",
            as: "distributeurForBattery", // ✅ Unique alias
            onDelete: "CASCADE",
        });
    };

    return BatteryDistributeur;
};
