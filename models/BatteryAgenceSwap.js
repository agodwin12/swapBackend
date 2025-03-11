module.exports = (sequelize, DataTypes) => {
    const BatteryAgence = sequelize.define("BatteryAgence", {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        id_battery_valide: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false
        },
        id_agence: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false
        }
    }, {
        tableName: "battery_agences",
        timestamps: true
    });

    BatteryAgence.associate = (models) => {
        BatteryAgence.belongsTo(models.BatteryValide, {
            foreignKey: "id_battery_valide",
            as: "battery"
        });
    };

    return BatteryAgence;
};
