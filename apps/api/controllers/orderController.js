const Order = require('../models/Order');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { sendNotification } = require('../notifications')

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    
    const { items, deliveryAddress, paymentMethod, specialInstructions } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
    }
    
    // Validate products and calculate totals
    let subtotal = 0;
    const orderItems = [];
    
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product ${item.product} not found` });
      }
      
      if (!product.isActive) {
        return res.status(400).json({ success: false, message: `Product ${product.name} is not available` });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
      }
      
      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;
      
      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal
      });
    }
    
    // Calculate delivery fee (this would be more complex in real implementation)
    const deliveryFee = subtotal > 50 ? 0 : 5; // Free delivery over $50
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + deliveryFee + tax;
    
    // Create order
    // Find merchant from first product
    const firstProduct = await Product.findById(items[0].product).select('merchant');
    const order = await Order.create({
      customer: req.user._id,
      merchant: firstProduct.merchant,
      items: orderItems,
      deliveryAddress,
      paymentMethod,
      specialInstructions,
      subtotal,
      deliveryFee,
      tax,
      total,
      status: 'pending'
    });
    
    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, salesCount: item.quantity }
      });
    }
    
    // Create notifications
    const merchant = await User.findById(order.merchant)
    if (merchant.fcmToken) {
      await sendNotification(
        merchant.fcmToken,
        'New Order Received',
        `Order #${order.orderNumber} has been placed. Total LKR${order.total}`,
        { orderId: order._id.toString() }
      )
    }


    try {
      const { emitToOrder } = require('../services/realtime');
      emitToOrder(order._id, 'orderStatus', { status: order.status });
    } catch {}


    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get orders for customer
exports.getCustomerOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    let query = { customer: req.user._id };
    if (status) {
      query.status = status;
    }
    
    const orders = await Order.find(query)
      .populate('merchant', 'businessName firstName lastName phone')
      .populate('deliveryPerson', 'firstName lastName phone')
      .populate('items.product', 'name price images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Order.countDocuments(query);
    
    res.json({
      success: true,
      data: orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get orders for merchant
exports.getMerchantOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    let query = { merchant: req.user._id };
    if (status) {
      query.status = status;
    }
    
    const orders = await Order.find(query)
      .populate('customer', 'firstName lastName phone')
      .populate('deliveryPerson', 'firstName lastName phone')
      .populate('items.product', 'name price images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Order.countDocuments(query);
    
    res.json({
      success: true,
      data: orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get merchant orders error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get orders for delivery person
exports.getDeliveryOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    let query = { deliveryPerson: req.user._id };
    if (status) {
      query.status = status;
    }
    
    const orders = await Order.find(query)
      .populate('customer', 'firstName lastName phone')
      .populate('merchant', 'businessName firstName lastName phone')
      .populate('items.product', 'name price images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Order.countDocuments(query);
    
    res.json({
      success: true,
      data: orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get delivery orders error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get single order
exports.getOrder = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }
    const order = await Order.findById(req.params.id)
      .populate('customer', 'firstName lastName phone email')
      .populate('merchant', 'businessName firstName lastName phone')
      .populate('deliveryPerson', 'firstName lastName phone')
      .populate('items.product', 'name price images description');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    // Check authorization
    const isAuthorized = order.customer._id.toString() === req.user._id.toString() ||
                       order.merchant._id.toString() === req.user._id.toString() ||
                       (order.deliveryPerson && order.deliveryPerson._id.toString() === req.user._id.toString());
    
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }
    
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get latest order for current customer
exports.getLastOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ customer: req.user._id })
      .populate('customer', 'firstName lastName phone email')
      .populate('merchant', 'businessName firstName lastName phone')
      .populate('deliveryPerson', 'firstName lastName phone')
      .populate('items.product', 'name price images description')
      .sort({ createdAt: -1 });

    if (!order) {
      return res.status(404).json({ success: false, message: 'No orders found' });
    }

    // Authorization: ensure requester is the customer
    if (order.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Get last order error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update order status (merchant)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const allowedStatuses = ['confirmed', 'preparing', 'ready', 'cancelled'];
    
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status update' });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    if (order.merchant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
    }
    
    // If merchant is cancelling, store a reason
    if (status === 'cancelled' && reason) {
      order.cancellationReason = reason;
    }
    await order.updateStatus(status);
    try {
      const { emitToOrder } = require('../services/realtime');
      emitToOrder(order._id, 'orderStatus', { status });
    } catch {}

    const customer = await User.findById(order.customer)
    if (customer.fcmToken) {
      await sendNotification(
        customer.fcmToken,
        'Order Status Update',
        status === 'cancelled'
        ? `Your order #${order.orderNumber} was cancelled by the merchant${reason ? `: ${reason}` : ''}`
        : `Your order #${order.orderNumber} status has been updated to ${status}`,
        { orderId: order._id.toString() }
      )
    }
    if (status === 'ready') {
      const drivers = await User.find({ role: 'deliver', isActive: true }).select('fcmToken');

      const notifications = drivers
        .filter(driver => driver.fcmToken)
        .map(driver =>
          sendNotification(
            driver.fcmToken,
            'New Delivery Available', // title
            `Order #${order.orderNumber} is ready for pickup`, // message
            { orderId: order._id.toString() } // optional data
          )
        );

      await Promise.all(notifications); // send all in parallel
    }

    
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delivery person declines an available order
exports.declineDelivery = async (req, res) => {
  try {
    const { reason } = req.body || {};
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    // Only declinable if not yet assigned
    if (order.deliveryPerson) {
      return res.status(400).json({ success: false, message: 'Order already assigned to a delivery person' });
    }
    await order.updateStatus('delivery_declined', null, reason || 'Declined');
    res.json({ success: true, message: 'Declined the delivery', data: order });
  } catch (error) {
    console.error('Decline delivery error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Accept delivery (delivery person)
exports.acceptDelivery = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    if (order.status !== 'ready') {
      return res.status(400).json({ success: false, message: 'Order is not ready for delivery' });
    }
    
    if (order.deliveryPerson) {
      return res.status(400).json({ success: false, message: 'Order already assigned to a delivery person' });
    }
    
    order.deliveryPerson = req.user._id;
    await order.updateStatus('picked_up');

    const customer = await User.findById(order.customer)
    if (customer.fcmToken) {
      await sendNotification(
        customer.fcmToken,
        'Delivery Accepted',
        `Your order #${order.orderNumber} has been picked up and is on its way`,
        { orderId: order._id.toString() }
      )
    }

    const merchant = await User.findById(order.merchant)
    if (merchant.fcmToken) {
      await sendNotification(
        merchant.fcmToken,
        'Delivery Accepted',
        `Order #${order.orderNumber} has been picked up by delivery person`,
        { orderId: order._id.toString() }
      )
    }
    
    res.json({
      success: true,
      message: 'Delivery accepted successfully',
      data: order
    });
  } catch (error) {
    console.error('Accept delivery error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update delivery status
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { status, location, note } = req.body;
    const allowedStatuses = ['in_transit', 'delivered'];
    
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid delivery status' });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    if (order.deliveryPerson.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this delivery' });
    }
    
    await order.updateStatus(status, location, note);
    try {
      const { emitToOrder } = require('../services/realtime');
      emitToOrder(order._id, 'orderStatus', { status, location });
    } catch {}

    const customer = await User.findById(order.customer)
    if (customer.fcmToken) {
      await sendNotification(
        customer.fcmToken,
        `Order ${status.replace('_', ' ')} `,
        `Order #${order.orderNumber} is now ${status.replace('_', ' ')}`,
        { orderId: order._id.toString() }
      )
    }
    
    res.json({
      success: true,
      message: 'Delivery status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this order' });
    }
    
    if (['delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled' });
    }
    
    order.status = 'cancelled';
    order.cancellationReason = reason;
    await order.save();
    
    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, salesCount: -item.quantity }
      });
    }

    const merchant = await User.findById(order.merchant)
    if (merchant.fcmToken) {
      await sendNotification(
        merchant.fcmToken,
        'Order Cancelled',
        `Order #${order.orderNumber} has been placed`,
        { orderId: order._id.toString() }
      )
    }
    
    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get available orders for delivery
exports.getAvailableOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const orders = await Order.find({
      status: 'ready',
      deliveryPerson: null
    })
    .populate('customer', 'firstName lastName phone')
    .populate('merchant', 'businessName firstName lastName phone')
    .populate('items.product', 'name price images')
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(parseInt(limit));
    
    const total = await Order.countDocuments({
      status: 'ready',
      deliveryPerson: null
    });
    
    res.json({
      success: true,
      data: orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get available orders error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get merchant analytics
exports.getMerchantAnalytics = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const merchantId = req.user._id;
    
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'daily':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case 'weekly':
        startDate.setDate(endDate.getDate() - 12 * 7);
        break;
      case 'monthly':
        startDate.setMonth(endDate.getMonth() - 12);
        break;
      case 'yearly':
        startDate.setFullYear(endDate.getFullYear() - 5);
        break;
    }
    
    // Get order metrics
    const orderMetrics = await Order.aggregate([
      { $match: { 
        merchant: merchantId,
        createdAt: { $gte: startDate, $lte: endDate }
      }},
      { $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        completedOrders: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
        cancelledOrders: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        pendingOrders: { $sum: { $cond: [{ $in: ['$status', ['pending', 'confirmed', 'preparing', 'ready']] }, 1, 0] } },
        totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, '$total', 0] } },
        averageOrderValue: { $avg: { $cond: [{ $eq: ['$status', 'delivered'] }, '$total', null] } }
      }}
    ]);
    
    // Get delivery metrics
    const deliveryMetrics = await Order.aggregate([
      { $match: { 
        merchant: merchantId,
        status: 'delivered',
        createdAt: { $gte: startDate, $lte: endDate }
      }},
      { $group: {
        _id: null,
        totalDeliveries: { $sum: 1 },
        averageDeliveryTime: { $avg: '$deliveryTime' },
        totalDistance: { $sum: '$deliveryDistance' }
      }}
    ]);
    
    // Get recent orders for dashboard
    const recentOrders = await Order.find({ merchant: merchantId })
      .populate('customer', 'firstName lastName')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get top products
    const topProducts = await Order.aggregate([
      { $match: { 
        merchant: merchantId,
        status: 'delivered',
        createdAt: { $gte: startDate, $lte: endDate }
      }},
      { $unwind: '$items' },
      { $group: {
        _id: '$items.product',
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
      }},
      { $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }},
      { $unwind: '$product' },
      { $project: {
        productName: '$product.name',
        totalSold: 1,
        totalRevenue: 1
      }},
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);
    
    // Get daily revenue for chart
    const dailyRevenue = await Order.aggregate([
      { $match: { 
        merchant: merchantId,
        status: 'delivered',
        createdAt: { $gte: startDate, $lte: endDate }
      }},
      { $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        overview: orderMetrics[0] || {
          totalOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          pendingOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0
        },
        deliveries: deliveryMetrics[0] || {
          totalDeliveries: 0,
          averageDeliveryTime: 0,
          totalDistance: 0
        },
        recentOrders,
        topProducts,
        dailyRevenue,
        period
      }
    });
  } catch (error) {
    console.error('Get merchant analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};