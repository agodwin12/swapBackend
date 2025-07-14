const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const db = {};

// ✅ Load all models
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
db.ContratChauffeur = require("./contratChauffeur")(sequelize, DataTypes);
db.Paiement = require("./paiement")(sequelize, DataTypes);

// ✅ Auto-associate models if associate() method is defined
Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

//
// ✅ Define additional associations manually if needed
//


db.UsersAgences.belongsTo(db.Agences, {
    foreignKey: "id_agence",
    as: "agence",
});

db.Agences.hasMany(db.UsersAgences, {
    foreignKey: "id_agence",
    as: "users",
});



// AssociationUserMoto -> MotosValide
db.AssociationUserMoto.belongsTo(db.MotosValide, {
    foreignKey: "moto_valide_id",
    as: "motoInfo",
    onDelete: "CASCADE",
});

// ContratChauffeur -> AssociationUserMoto
db.ContratChauffeur.belongsTo(db.AssociationUserMoto, {
    foreignKey: "association_id",
    as: "associatedLease",
    onDelete: "CASCADE",
});

// ContratChauffeur -> AssociationUserMoto
db.AssociationUserMoto.hasOne(db.ContratChauffeur, {
    foreignKey: "association_id",
    as: "contract",
});


// BatteryMotoUserAssociation -> AssociationUserMoto
db.BatteryMotoUserAssociation.belongsTo(db.AssociationUserMoto, {
    foreignKey: "association_user_moto_id",
    as: "batteryUserLink",
    onDelete: "CASCADE",
});

// BatteryMotoUserAssociation -> BatteryValide
db.BatteryMotoUserAssociation.belongsTo(db.BatteryValide, {
    foreignKey: "battery_id",
    as: "linkedBattery",
    onDelete: "CASCADE",
});

// BatteryAgence -> BatteryValide
db.BatteryAgence.belongsTo(db.BatteryValide, {
    foreignKey: "id_battery_valide",
    as: "batteryDetailsAgence",
    onDelete: "CASCADE",
});

// BatteryAgence -> Agences
db.BatteryAgence.belongsTo(db.Agences, {
    foreignKey: "id_agence",
    as: "linkedAgency",
    onDelete: "CASCADE",
});

// BatteryEntrepot -> BatteryValide
db.BatteryEntrepot.belongsTo(db.BatteryValide, {
    foreignKey: "id_battery_valide",
    as: "batteryDetailsEntrepot",
    onDelete: "CASCADE",
});

// BatteryEntrepot -> Entrepot
db.BatteryEntrepot.belongsTo(db.Entrepot, {
    foreignKey: "id_entrepot",
    as: "linkedWarehouse",
    onDelete: "CASCADE",
});


// BmsData -> BatteryValide
db.BmsData.belongsTo(db.BatteryValide, {
    foreignKey: "mac_id",
    targetKey: "mac_id",
    as: "batteryBms",
});

// Swap -> BatteryMotoUserAssociation
db.Swap.belongsTo(db.BatteryMotoUserAssociation, {
    foreignKey: "association_user_moto_id",
    as: "swapAssociation",
    onDelete: "CASCADE",
});

// Swap -> BatteryValide IN
db.Swap.belongsTo(db.BatteryValide, {
    foreignKey: "battery_in_id",
    as: "batteryIn",
    onDelete: "CASCADE",
});

// Swap -> BatteryValide OUT
db.Swap.belongsTo(db.BatteryValide, {
    foreignKey: "battery_out_id",
    as: "batteryOut",
    onDelete: "CASCADE",
});

// HistoriqueEntrepot -> Entrepot
db.HistoriqueEntrepot.belongsTo(db.Entrepot, {
    foreignKey: "id_entrepot",
    as: "entrepotHistory",
    onDelete: "CASCADE",
});

// HistoriqueEntrepot -> Distributeurs
db.HistoriqueEntrepot.belongsTo(db.Distributeurs, {
    foreignKey: "id_distributeur",
    as: "distributeurInfo",
    onDelete: "CASCADE",
});

// HistoriqueAgence -> Agences
db.HistoriqueAgence.belongsTo(db.Agences, {
    foreignKey: "id_agence",
    as: "agencyHistory",
    onDelete: "CASCADE",
});

// HistoriqueAgence -> Entrepot
db.HistoriqueAgence.belongsTo(db.Entrepot, {
    foreignKey: "id_entrepot",
    as: "entrepotHistoryForAgency",
    onDelete: "CASCADE",
});

//
// ✅ Finalize Sequelize
//

sequelize
    .sync({ alter: false })
    .then(() => {
        console.log("✅ Database & tables synced!");
    })
    .catch((err) => {
        console.error("❌ Error syncing database:", err);
    });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
