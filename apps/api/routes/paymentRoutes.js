const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const roles = require('../middlewares/roles');
const { createPaymentIntent, confirmPayment } = require('../controllers/paymentController');

router.post('/intent', auth, roles('customer'), createPaymentIntent);
router.post('/confirm', auth, roles('customer'), confirmPayment);

module.exports = router;


