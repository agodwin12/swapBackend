const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    class AssociationUserMoto extends Model {
        static associate(models) {
            // ✅ Association with `ValidatedUser`
            AssociationUserMoto.belongsTo(models.ValidatedUser, {
                foreignKey: "validated_user_id",
                as: "user",
                onDelete: "CASCADE",
            });

            // ✅ Association with `MotosValide`
            AssociationUserMoto.belongsTo(models.MotosValide, {
                foreignKey: "moto_valide_id",
                as: "userMoto",
                onDelete: "CASCADE",
            });

            // ✅ Association with `BatteryMotoUserAssociation`
            AssociationUserMoto.hasMany(models.BatteryMotoUserAssociation, {
                foreignKey: "association_user_moto_id",
                as: "batteryAssociations",
                onDelete: "CASCADE",
            });
        }
    }

    AssociationUserMoto.init(
        {
            id: {
                type: DataTypes.BIGINT.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            validated_user_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            moto_valide_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            created_at: { // ✅ Matches your database column name
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            updated_at: { // ✅ Matches your database column name
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            deleted_at: { // ✅ Matches your database column name
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: "AssociationUserMoto",
            tableName: "association_user_motos",
            timestamps: true, // ✅ Enables created_at and updated_at
            paranoid: true, // ✅ Enables soft deletes (deleted_at)
            underscored: true, // ✅ Forces Sequelize to use `created_at`, `updated_at`, `deleted_at`
        }
    );

    return AssociationUserMoto;
};
