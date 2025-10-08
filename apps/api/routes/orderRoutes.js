const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const roles = require('../middlewares/roles');
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');

// Customer
router.post('/', auth, roles('customer'), [
  body('items').isArray({ min: 1 }),
  body('deliveryAddress').notEmpty()
], orderController.createOrder);
router.get('/me', auth, roles('customer'), orderController.getCustomerOrders);
router.post('/:id/cancel', auth, roles('customer'), orderController.cancelOrder);

// Merchant
router.get('/merchant', auth, roles('merchant'), orderController.getMerchantOrders);
router.post('/:id/status', auth, roles('merchant'), orderController.updateOrderStatus);

// Delivery
router.get('/available', auth, roles('deliver'), orderController.getAvailableOrders);
router.get('/deliver', auth, roles('deliver'), orderController.getDeliveryOrders);
router.post('/:id/accept', auth, roles('deliver'), orderController.acceptDelivery);
router.post('/:id/delivery-status', auth, roles('deliver'), orderController.updateDeliveryStatus);

// Common
router.get('/:id', auth, orderController.getOrder);

module.exports = router;


