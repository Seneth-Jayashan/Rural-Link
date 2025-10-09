const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const { getMessages, saveMessage } = require('../controllers/chatController');

// All chat routes require authentication
router.use(authenticate);

// Get messages for an order
router.get('/orders/:orderId/messages', getMessages);

// Save a new message
router.post('/messages', saveMessage);

module.exports = router;
