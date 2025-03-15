module.exports = (sequelize, DataTypes) => {
    const LeasePayment = sequelize.define('LeasePayment', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },
        id_moto: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        montant_lease: {
            type: DataTypes.DECIMAL(8,2),
            allowNull: false
        },
        montant_battery: {
            type: DataTypes.DECIMAL(8,2),
            allowNull: false
        },
        total_lease: {
            type: DataTypes.DECIMAL(8,2),
            allowNull: false
        },
        statut: {
            type: DataTypes.STRING,
            allowNull: true
        },
        id_user_agence: {
            type: DataTypes.BIGINT,
            allowNull: false
        },

    }, {
        timestamps: true,
        tableName: 'paiement_leases', // Ensure this matches your actual table name in MySQL
        createdAt: "created_at",  // ✅ Match database column name
        updatedAt: "updated_at",
        underscored: true, // ✅ Forces Sequelize to use snake_case for timestamps
    });

    return LeasePayment;
};
