const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    class AssociationUserMoto extends Model {
        static associate(models) {
            // ✅ Validated User (Only one alias)
            AssociationUserMoto.belongsTo(models.ValidatedUser, {
                foreignKey: "validated_user_id",
                as: "validatedUser", // ✅ Use this consistently
                onDelete: "CASCADE",
            });

            // ✅ Associated Contract
            AssociationUserMoto.hasOne(models.ContratChauffeur, {
                foreignKey: "association_id",
                as: "leaseContract",
                onDelete: "CASCADE",
            });

            // ✅ Moto
            AssociationUserMoto.belongsTo(models.MotosValide, {
                foreignKey: "moto_valide_id",
                as: "userMoto",
                onDelete: "CASCADE",
            });

            // ✅ Battery associations
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
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            deleted_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            statut: {
                type: DataTypes.STRING(50),
                allowNull: false,
                defaultValue: 'lease',
            },
        },
        {
            sequelize,
            modelName: "AssociationUserMoto",
            tableName: "association_user_motos",
            timestamps: true,
            paranoid: true,
            underscored: true,
        }
    );

    return AssociationUserMoto;
};
