const Order = require('../models/Order');

exports.createPaymentIntent = async (req, res) => {
  try {
    const { orderId, method = 'mobile_payment' } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Mock payment intent
    const clientSecret = `mock_${order._id}_${Date.now()}`;
    res.json({ success: true, data: { clientSecret, amount: order.total, currency: 'LKR', method } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const { orderId, paymentId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    order.paymentStatus = 'paid';
    order.paymentMethod = 'mobile_payment';
    order.paymentId = paymentId || `mock_${Date.now()}`;
    await order.save();
    res.json({ success: true, message: 'Payment confirmed', data: order });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


