const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    return sequelize.define(
        "BmsData",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            mac_id: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            state: {
                type: DataTypes.TEXT, // ✅ Store as TEXT
            },
            seting: {
                type: DataTypes.TEXT, // ✅ Store as TEXT (Ensure "seting" is correct)
            },
            longitude: {
                type: DataTypes.DECIMAL(10, 6), // ✅ More precise GPS coordinates
                allowNull: true,
            },
            latitude: {
                type: DataTypes.DECIMAL(10, 6), // ✅ More precise GPS coordinates
                allowNull: true,
            },
            timestamp: {
                type: DataTypes.DATE,
                allowNull: true,
                defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
            },
        },
        {
            tableName: "bms_data",
            timestamps: false, // ✅ No need for createdAt & updatedAt
        }
    );
};
