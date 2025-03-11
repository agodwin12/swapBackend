const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const db = {};

// ✅ Load models correctly in the right order
db.ValidatedUser = require("./validatedUser")(sequelize, DataTypes);
db.MotosValide = require("./motos_valide")(sequelize, DataTypes);
db.AssociationUserMoto = require("./association_user_motos")(sequelize, DataTypes);
db.UserAgences = require("./userAgence")(sequelize, DataTypes);
db.UsersAgences = require("./users_agences")(sequelize, DataTypes);
db.UsersEntrepots = require("./users_entrepots")(sequelize, DataTypes);
db.Distributeurs = require("./distributeurs")(sequelize, DataTypes);
db.Agences = require("./agences")(sequelize, DataTypes);
db.Entrepot = require("./entrepot")(sequelize, DataTypes);
db.BatteryValide = require("./battery_valide")(sequelize, DataTypes);
db.BatteryEntrepot = require("./battery_entrepot")(sequelize, DataTypes);
db.BatteryAgence = require("./battery_agence")(sequelize, DataTypes);
db.BmsData = require("./bms_data")(sequelize, DataTypes);
db.BatteryMotoUserAssociation = require("./BatteryMotoUserAssociation")(sequelize, DataTypes);
db.Swap = require("./swap")(sequelize, DataTypes);
db.HistoriqueEntrepot = require("./historique_entrepots")(sequelize, DataTypes);
db.HistoriqueAgence = require("./historique_agences")(sequelize, DataTypes);
db.BatteryDistributeur = require("./BatteryDistributeur")(sequelize, DataTypes);
db.HistoriqueEntrepot = require("./historique_entrepot")(sequelize, DataTypes);

// ✅ Initialize Model Associations (After Models Are Loaded)
Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

// ✅ Define Model Associations

// 🔹 AssociationUserMoto -> ValidatedUser
db.AssociationUserMoto.belongsTo(db.ValidatedUser, {
    foreignKey: "validated_user_id",
    as: "validatedUser",
    onDelete: "CASCADE",
});

// 🔹 AssociationUserMoto -> MotosValide
db.AssociationUserMoto.belongsTo(db.MotosValide, {
    foreignKey: "moto_valide_id",
    as: "associatedMoto", // 🔥 Changed alias from "moto" to "associatedMoto"
    onDelete: "CASCADE",
});

// 🔹 BatteryMotoUserAssociation -> AssociationUserMoto
db.BatteryMotoUserAssociation.belongsTo(db.AssociationUserMoto, {
    foreignKey: "association_user_moto_id",
    as: "associationUserMoto",
    onDelete: "CASCADE",
});

// 🔹 BatteryMotoUserAssociation -> BatteryValide
db.BatteryMotoUserAssociation.belongsTo(db.BatteryValide, {
    foreignKey: "battery_id",
    as: "associatedBatteryMotoUser",
    onDelete: "CASCADE",
});

// 🔹 BatteryMotoUserAssociation -> ValidatedUser
db.BatteryMotoUserAssociation.belongsTo(db.ValidatedUser, {
    foreignKey: "association_user_moto_id",
    as: "associatedUser",
    onDelete: "CASCADE",
});

// 🔹 BatteryAgence -> BatteryValide
db.BatteryAgence.belongsTo(db.BatteryValide, {
    foreignKey: "id_battery_valide",
    as: "associatedBatteryAgence",
    onDelete: "CASCADE",
});

// 🔹 BatteryAgence -> Agences
db.BatteryAgence.belongsTo(db.Agences, {
    foreignKey: "id_agence",
    as: "linkedAgence",
    onDelete: "CASCADE",
});

// 🔹 BatteryEntrepot -> BatteryValide
db.BatteryEntrepot.belongsTo(db.BatteryValide, {
    foreignKey: "id_battery_valide",
    as: "associatedBatteryEntrepot",
    onDelete: "CASCADE",
});

// 🔹 BatteryEntrepot -> Entrepot
db.BatteryEntrepot.belongsTo(db.Entrepot, {
    foreignKey: "id_entrepot",
    as: "linkedEntrepot",
    onDelete: "CASCADE",
});

// 🔹 Agences -> Entrepot
db.Agences.belongsTo(db.Entrepot, {
    foreignKey: "id_entrepot",
    as: "linkedEntrepot",
});

// 🔹 BmsData -> BatteryValide
db.BmsData.belongsTo(db.BatteryValide, {
    foreignKey: "mac_id",
    targetKey: "mac_id",
    as: "associatedBatteryBms",
});

// 🔹 Swap -> BatteryMotoUserAssociation
db.Swap.belongsTo(db.BatteryMotoUserAssociation, {
    foreignKey: "association_user_moto_id",
    as: "swap_user_association",
    onDelete: "CASCADE",
});

// 🔹 Swap -> BatteryValide (Incoming Battery)
db.Swap.belongsTo(db.BatteryValide, {
    foreignKey: "battery_in_id",
    as: "swap_battery_in",
    onDelete: "CASCADE",
});

// 🔹 Swap -> BatteryValide (Outgoing Battery)
db.Swap.belongsTo(db.BatteryValide, {
    foreignKey: "battery_out_id",
    as: "swap_battery_out",
    onDelete: "CASCADE",
});

// 🔹 HistoriqueEntrepot -> Entrepot
db.HistoriqueEntrepot.belongsTo(db.Entrepot, {
    foreignKey: "id_entrepot",
    as: "linkedEntrepot",
    onDelete: "CASCADE",
});

// 🔹 HistoriqueEntrepot -> Distributeurs
db.HistoriqueEntrepot.belongsTo(db.Distributeurs, {
    foreignKey: "id_distributeur",
    as: "linkedDistributeur",
    onDelete: "CASCADE",
});

// 🔹 HistoriqueAgence -> Agences
db.HistoriqueAgence.belongsTo(db.Agences, {
    foreignKey: "id_agence",
    as: "linkedAgence",
    onDelete: "CASCADE",
});

// 🔹 HistoriqueAgence -> Entrepot
db.HistoriqueAgence.belongsTo(db.Entrepot, {
    foreignKey: "id_entrepot",
    as: "linkedEntrepot",
    onDelete: "CASCADE",
});

// ✅ Sync all models with the database
sequelize
    .sync({ alter: false })
    .then(() => {
        console.log("✅ Database & tables synced!");
    })
    .catch((err) => {
        console.error("❌ Error syncing database:", err);
    });

// ✅ Attach Sequelize instance
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
