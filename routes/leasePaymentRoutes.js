const express = require("express");
const router = express.Router();
const leasePaymentController = require("../controllers/leasePaymentController");
const LeasePaymentHistoryController = require("../controllers/LeasePaymentHistoryController");
// Route to save lease payment
router.post("/lease", leasePaymentController.saveLeasePayment);

router.get("/lease/history", LeasePaymentHistoryController.getUserLeasePaymentHistory);

module.exports = router;
