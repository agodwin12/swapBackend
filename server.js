require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth.routes');
const swapRoutes = require("./routes/swapRoutes");
const batteriesRoutes = require('./routes/batteries');
const batteryAgenceController = require("./controllers/batteryAgenceController");
const { sequelize } = require('./models');
const entrepotswapagenceRoutes = require("./routes/entrepotSwapRoutes"); // ✅ Import swap route
const batteryRoutes = require("./routes/batteryRoutes");
const batterySwapDataRoutes = require("./routes/batterySwapDataRoutes"); // ✅ New route
const socRoutes = require("./routes/socRoutes");
const userBatteryRoutes = require("./routes/userbattery");
const router = require('./routes/swapRoutes');  // Adjust this path to your actual routes file
const swapHistoryRoutes = require('./routes/historyAgenceRoutes'); // Adjust path if necessary
const usersEntrepotRoutes = require("./routes/usersEntrepotRoutes");
const userAgenceRoutes = require("./routes/userAgenceRoutes");
const historiqueEntrepotRoutes = require("./routes/historiqueEntrepotRoutes"); // ✅ Import the route
const historyAgenceRoutes = require('./routes/historyAgenceRoutes');
const batteryEntrepotSwapRoutes = require("./routes/entrepotDistributeurSwapRoutes");
const batteryDistributeurRoutes  = require("./routes/distributeurRoutes");
const distributorswapbatteriesRoutes = require("./routes/distributorswapbatteriesRoutes");
const distributeuragenceswapRoutes = require("./routes/distributeuragenceswapRoutes");
const distributeurHistoriqueRoutes = require("./routes/distributeuragencehistory");
const batteryAgenceRoute = require('./routes/batteryAgenceRoutes'); // Ensure this path is correct
const motoRoutes = require('./routes/motoRoutes');
const leasePaymentRoutes = require("./routes/leasePaymentRoutes");




const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use((req, res, next) => {
    console.log(`🔍 [DEBUG] Received Request: ${req.method} ${req.originalUrl}`);
    next();
});


// Routes
app.use("/api", require("./routes/entrepotSwapRoutes"));
app.use('/api/auth', authRoutes);
app.use('/api/batteries', batteriesRoutes);
app.get("/api/batteries/agence/:agenceId", batteryAgenceController.getBatteriesForAgence);
app.use("/api/swaps", swapRoutes);
app.use("/api/entrepotswapagence", entrepotswapagenceRoutes); // ✅ Register new swap route
app.use("/api", batteryRoutes);
app.use("/api", userBatteryRoutes); // ✅ Register user battery route
app.use("/api", batterySwapDataRoutes);
app.use("/api", socRoutes);
app.use("/api", userBatteryRoutes);
app.use('/api', router);
app.use("/api", swapHistoryRoutes);
app.use('/api/swap-history', swapHistoryRoutes);
app.use("/api", usersEntrepotRoutes);
app.use("/api", userAgenceRoutes);
app.use("/api", historiqueEntrepotRoutes);
app.use("/api", historyAgenceRoutes); // ✅ Register history route
app.use("/api/batteries", batteryDistributeurRoutes);
app.use("/api", batteryEntrepotSwapRoutes);
app.use("/api", distributorswapbatteriesRoutes);
app.use("/api", distributeuragenceswapRoutes);
app.use("/api/historique/distributeur", distributeurHistoriqueRoutes);
app.use("/api/swaps", swapRoutes); // This ensures "/api/swaps/agencies" is accessible
app.use('/api', batteryAgenceRoute); // Ensure the prefix matches
app.use('/api', motoRoutes);
app.use("/api/payments", leasePaymentRoutes);

// Test Database Connection
sequelize.authenticate()
    .then(() => console.log('✅ Connected to MySQL Database successfully!'))
    .catch(err => console.error('❌ Database connection error:', err));

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
