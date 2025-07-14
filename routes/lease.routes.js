const express = require("express");
const router = express.Router();
const LeasePaymentController = require("../controllers/LeasePaymentController");

router.post("/pay", LeasePaymentController.saveLeasePayment);

// ✅ Add this line:
router.get("/associations", LeasePaymentController.getLeaseAssociations);

router.get("/history", LeasePaymentController.getLeasePaymentHistory);


module.exports = router;
