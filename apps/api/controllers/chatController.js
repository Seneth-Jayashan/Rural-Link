const ChatMessage = require('../models/ChatMessage');
const Order = require('../models/Order');

// Get chat messages for an order
exports.getMessages = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    // Verify user has access to this order
    const order = await Order.findById(orderId).select('customer deliveryPerson');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check authorization
    const isAuthorized = order.customer.toString() === req.user._id.toString() ||
                       (order.deliveryPerson && order.deliveryPerson.toString() === req.user._id.toString());
    
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to view chat for this order' });
    }

    // Get messages for this order
    const messages = await ChatMessage.find({ orderId })
      .populate('from', 'firstName lastName')
      .populate('to', 'firstName lastName')
      .sort({ timestamp: 1 })
      .limit(100); // Limit to last 100 messages

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Save a new message
exports.saveMessage = async (req, res) => {
  try {
    const { orderId, text, tempId } = req.body;
    
    if (!orderId || !text) {
      return res.status(400).json({ success: false, message: 'Order ID and text are required' });
    }

    // Verify user has access to this order
    const order = await Order.findById(orderId).select('customer deliveryPerson');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check authorization
    const isAuthorized = order.customer.toString() === req.user._id.toString() ||
                       (order.deliveryPerson && order.deliveryPerson.toString() === req.user._id.toString());
    
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to send messages for this order' });
    }

    // Determine the recipient
    const recipient = order.customer.toString() === req.user._id.toString() 
      ? order.deliveryPerson 
      : order.customer;

    if (!recipient) {
      return res.status(400).json({ success: false, message: 'No recipient found for this order' });
    }

    // Create message
    const message = await ChatMessage.create({
      orderId,
      from: req.user._id,
      to: recipient,
      text: text.trim(),
      tempId
    });

    // Populate the message with user details
    await message.populate('from', 'firstName lastName');
    await message.populate('to', 'firstName lastName');

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Save message error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
