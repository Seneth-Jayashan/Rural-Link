const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['merchant', 'delivery', 'customer', 'system'],
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  metrics: {
    // Revenue metrics
    totalRevenue: {
      type: Number,
      default: 0,
      min: [0, 'Revenue cannot be negative']
    },
    grossProfit: {
      type: Number,
      default: 0,
      min: [0, 'Gross profit cannot be negative']
    },
    netProfit: {
      type: Number,
      default: 0
    },
    
    // Order metrics
    totalOrders: {
      type: Number,
      default: 0,
      min: [0, 'Total orders cannot be negative']
    },
    completedOrders: {
      type: Number,
      default: 0,
      min: [0, 'Completed orders cannot be negative']
    },
    cancelledOrders: {
      type: Number,
      default: 0,
      min: [0, 'Cancelled orders cannot be negative']
    },
    averageOrderValue: {
      type: Number,
      default: 0,
      min: [0, 'Average order value cannot be negative']
    },
    
    // Delivery metrics
    totalDeliveries: {
      type: Number,
      default: 0,
      min: [0, 'Total deliveries cannot be negative']
    },
    completedDeliveries: {
      type: Number,
      default: 0,
      min: [0, 'Completed deliveries cannot be negative']
    },
    averageDeliveryTime: {
      type: Number,
      default: 0,
      min: [0, 'Average delivery time cannot be negative']
    },
    totalDistance: {
      type: Number,
      default: 0,
      min: [0, 'Total distance cannot be negative']
    },
    
    // Customer metrics
    newCustomers: {
      type: Number,
      default: 0,
      min: [0, 'New customers cannot be negative']
    },
    returningCustomers: {
      type: Number,
      default: 0,
      min: [0, 'Returning customers cannot be negative']
    },
    customerRetentionRate: {
      type: Number,
      default: 0,
      min: [0, 'Retention rate cannot be negative'],
      max: [100, 'Retention rate cannot exceed 100']
    },
    
    // Product metrics
    totalProducts: {
      type: Number,
      default: 0,
      min: [0, 'Total products cannot be negative']
    },
    lowStockProducts: {
      type: Number,
      default: 0,
      min: [0, 'Low stock products cannot be negative']
    },
    outOfStockProducts: {
      type: Number,
      default: 0,
      min: [0, 'Out of stock products cannot be negative']
    },
    
    // Rating metrics
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Average rating cannot be negative'],
      max: [5, 'Average rating cannot exceed 5']
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: [0, 'Total reviews cannot be negative']
    },
    positiveReviews: {
      type: Number,
      default: 0,
      min: [0, 'Positive reviews cannot be negative']
    },
    negativeReviews: {
      type: Number,
      default: 0,
      min: [0, 'Negative reviews cannot be negative']
    },
    
    // Performance metrics
    orderFulfillmentRate: {
      type: Number,
      default: 0,
      min: [0, 'Fulfillment rate cannot be negative'],
      max: [100, 'Fulfillment rate cannot exceed 100']
    },
    onTimeDeliveryRate: {
      type: Number,
      default: 0,
      min: [0, 'On-time delivery rate cannot be negative'],
      max: [100, 'On-time delivery rate cannot exceed 100']
    },
    customerSatisfactionScore: {
      type: Number,
      default: 0,
      min: [0, 'Satisfaction score cannot be negative'],
      max: [100, 'Satisfaction score cannot exceed 100']
    },
    
    // Geographic metrics
    topDeliveryAreas: [{
      area: String,
      count: Number,
      revenue: Number
    }],
    deliveryZones: [{
      zone: String,
      orders: Number,
      averageTime: Number,
      distance: Number
    }],
    
    // Time-based metrics
    peakHours: [{
      hour: Number,
      orders: Number,
      revenue: Number
    }],
    peakDays: [{
      day: String,
      orders: Number,
      revenue: Number
    }],
    
    // Cost metrics
    totalCosts: {
      type: Number,
      default: 0,
      min: [0, 'Total costs cannot be negative']
    },
    deliveryCosts: {
      type: Number,
      default: 0,
      min: [0, 'Delivery costs cannot be negative']
    },
    operationalCosts: {
      type: Number,
      default: 0,
      min: [0, 'Operational costs cannot be negative']
    },
    
    // Growth metrics
    revenueGrowth: {
      type: Number,
      default: 0
    },
    orderGrowth: {
      type: Number,
      default: 0
    },
    customerGrowth: {
      type: Number,
      default: 0
    }
  },
  
  // Breakdown by categories
  categoryBreakdown: [{
    category: String,
    orders: Number,
    revenue: Number,
    profit: Number
  }],
  
  // Top performing items
  topProducts: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    name: String,
    orders: Number,
    revenue: Number,
    profit: Number
  }],
  
  // Comparison with previous period
  comparison: {
    revenueChange: Number,
    orderChange: Number,
    customerChange: Number,
    ratingChange: Number
  },
  
  isProcessed: {
    type: Boolean,
    default: false
  },
  processedAt: Date
}, {
  timestamps: true
});

// Index for better query performance
analyticsSchema.index({ user: 1, type: 1, period: 1, date: -1 });
analyticsSchema.index({ type: 1, period: 1, date: -1 });
analyticsSchema.index({ isProcessed: 1, date: -1 });

// Method to calculate growth metrics
analyticsSchema.methods.calculateGrowth = async function() {
  const previousPeriod = await mongoose.model('Analytics').findOne({
    user: this.user,
    type: this.type,
    period: this.period,
    date: { $lt: this.date }
  }).sort({ date: -1 });
  
  if (previousPeriod) {
    this.comparison = {
      revenueChange: this.metrics.totalRevenue - previousPeriod.metrics.totalRevenue,
      orderChange: this.metrics.totalOrders - previousPeriod.metrics.totalOrders,
      customerChange: this.metrics.newCustomers - previousPeriod.metrics.newCustomers,
      ratingChange: this.metrics.averageRating - previousPeriod.metrics.averageRating
    };
  }
  
  return this.save();
};

// Static method to generate analytics for a period
analyticsSchema.statics.generateAnalytics = async function(userId, type, period, startDate, endDate) {
  const Order = mongoose.model('Order');
  const Product = mongoose.model('Product');
  const Review = mongoose.model('Review');
  const User = mongoose.model('User');
  
  let matchQuery = { createdAt: { $gte: startDate, $lte: endDate } };
  
  if (type === 'merchant') {
    matchQuery.merchant = userId;
  } else if (type === 'delivery') {
    matchQuery.deliveryPerson = userId;
  } else if (type === 'customer') {
    matchQuery.customer = userId;
  }
  
  // Get order metrics
  const orderMetrics = await Order.aggregate([
    { $match: matchQuery },
    { $group: {
      _id: null,
      totalOrders: { $sum: 1 },
      completedOrders: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
      cancelledOrders: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
      totalRevenue: { $sum: '$total' },
      averageOrderValue: { $avg: '$total' }
    }}
  ]);
  
  // Get delivery metrics
  const deliveryMetrics = await Order.aggregate([
    { $match: { ...matchQuery, deliveryPerson: userId } },
    { $group: {
      _id: null,
      totalDeliveries: { $sum: 1 },
      completedDeliveries: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
      averageDeliveryTime: { $avg: '$deliveryTime' },
      totalDistance: { $sum: '$deliveryDistance' }
    }}
  ]);
  
  // Get customer metrics
  const customerMetrics = await User.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate }, role: 'customer' } },
    { $group: {
      _id: null,
      newCustomers: { $sum: 1 }
    }}
  ]);
  
  // Get product metrics
  const productMetrics = await Product.aggregate([
    { $match: { merchant: userId } },
    { $group: {
      _id: null,
      totalProducts: { $sum: 1 },
      lowStockProducts: { $sum: { $cond: [{ $lte: ['$stock', '$minStock'] }, 1, 0] } },
      outOfStockProducts: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } }
    }}
  ]);
  
  // Get rating metrics
  const ratingMetrics = await Review.aggregate([
    { $match: { merchant: userId, createdAt: { $gte: startDate, $lte: endDate } } },
    { $group: {
      _id: null,
      totalReviews: { $sum: 1 },
      averageRating: { $avg: '$rating' },
      positiveReviews: { $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] } },
      negativeReviews: { $sum: { $cond: [{ $lte: ['$rating', 2] }, 1, 0] } }
    }}
  ]);
  
  // Create analytics record
  const analytics = new this({
    user: userId,
    type,
    period,
    date: endDate,
    metrics: {
      ...(orderMetrics[0] || {}),
      ...(deliveryMetrics[0] || {}),
      ...(customerMetrics[0] || {}),
      ...(productMetrics[0] || {}),
      ...(ratingMetrics[0] || {})
    },
    isProcessed: true,
    processedAt: new Date()
  });
  
  await analytics.save();
  return analytics;
};

// Static method to get analytics dashboard data
analyticsSchema.statics.getDashboardData = async function(userId, type, period = 'monthly', limit = 12) {
  const endDate = new Date();
  const startDate = new Date();
  
  switch (period) {
    case 'daily':
      startDate.setDate(endDate.getDate() - limit);
      break;
    case 'weekly':
      startDate.setDate(endDate.getDate() - (limit * 7));
      break;
    case 'monthly':
      startDate.setMonth(endDate.getMonth() - limit);
      break;
    case 'yearly':
      startDate.setFullYear(endDate.getFullYear() - limit);
      break;
  }
  
  return this.find({
    user: userId,
    type,
    period,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
};

module.exports = mongoose.model('Analytics', analyticsSchema);
