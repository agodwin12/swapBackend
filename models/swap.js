module.exports = (sequelize, DataTypes) => {
    const Swap = sequelize.define('Swap', {
        // Primary Key
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        battery_moto_user_association_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            references: {
                model: 'battery_moto_user_associations',  // Table name
                key: 'id',  // Foreign key column
            },
        },
        battery_in_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            references: {
                model: 'batteries_valides',  // Table name
                key: 'id',  // Foreign key column
            },
        },
        battery_out_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            references: {
                model: 'batteries_valides',  // Table name
                key: 'id',  // Foreign key column
            },
        },
        swap_price: {
            type: DataTypes.DECIMAL(8, 2),
            allowNull: true,
        },
        swap_date: {
            type: DataTypes.DATE,  // Updated from TIMESTAMP to DATE
            defaultValue: DataTypes.NOW,
        },
        battery_out_soc: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        battery_in_soc: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        agent_user_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            references: {
                model: 'users_agences',  // Table name
                key: 'id',  // Foreign key column
            },
        },
        id_agence: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            references: {
                model: 'users_agences',  // Table name
                key: 'id',  // Foreign key column
            },
        },
    }, {
        sequelize,
        modelName: 'Swap',
        tableName: 'swaps',
        timestamps: true, // This will enable created_at and updated_at automatically
        underscored: true, // Use snake_case for column names
    });

    // Setting up associations (optional, depending on your relationships)
    Swap.associate = models => {
        Swap.belongsTo(models.BatteryValide, {
            foreignKey: 'battery_in_id',
            as: 'battery_in',
        });
        Swap.belongsTo(models.BatteryValide, {
            foreignKey: 'battery_out_id',
            as: 'battery_out',
        });
        Swap.belongsTo(models.UsersAgences, {
            foreignKey: 'agent_user_id',
            as: 'agent_user',
        });
        Swap.belongsTo(models.UsersAgences, {
            foreignKey: 'id_agence',
            as: 'agence',
        });
        Swap.belongsTo(models.BatteryMotoUserAssociation, {
            foreignKey: 'battery_moto_user_association_id',
            as: 'battery_moto_user_association',
        });
    };

    return Swap;
};
