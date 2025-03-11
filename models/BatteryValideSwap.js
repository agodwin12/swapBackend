module.exports = (sequelize, DataTypes) => {
    const BatteryValide = sequelize.define("BatteryValide", {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        batterie_unique_id: {
            type: DataTypes.STRING,
            allowNull: true
        },
        mac_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        date_production: {
            type: DataTypes.STRING,
            allowNull: true
        },
        gps: {
            type: DataTypes.STRING,
            allowNull: false
        },
        fabriquant: {
            type: DataTypes.STRING,
            allowNull: false
        },
        statut: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "en attente"
        }
    }, {
        tableName: "batteries_valides",
        timestamps: true,
        paranoid: true  // Enables soft delete
    });

    BatteryValide.associate = (models) => {
        BatteryValide.hasMany(models.BatteryAgence, {
            foreignKey: "id_battery_valide",
            as: "agences"
        });
    };

    return BatteryValide;
};
