const mongoose = require('mongoose');

// Sub-schema for order items
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total cannot be negative']
  }
});

// Main Order schema
const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deliveryPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: [
      'pending', 'confirmed', 'preparing', 'ready', 'picked_up',
      'in_transit', 'delivered', 'cancelled', 'refunded'
    ],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'mobile_payment', 'bank_transfer'],
    default: 'cash'
  },
  paymentId: String,
  subtotal: { type: Number, required: true, min: 0 },
  deliveryFee: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  deliveryAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    fullAddress: String,
    instructions: String
  },
  shopLocation: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    fullAddress: String,
    businessName: String
  },
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  preparationTime: { type: Number, default: 0, min: 0 },
  deliveryTime: { type: Number, default: 0, min: 0 },
  specialInstructions: String,
  isOffline: { type: Boolean, default: false },
  offlineSyncTime: Date,
  customerRating: { type: Number, min: 1, max: 5 },
  customerReview: String,
  deliveryRating: { type: Number, min: 1, max: 5 },
  deliveryReview: String,
  cancellationReason: String,
  refundAmount: { type: Number, min: 0 },
  trackingHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    location: {
      latitude: Number,
      longitude: Number
    },
    note: String
  }]
}, { timestamps: true });

// --- Indexes for faster queries ---
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ merchant: 1, status: 1 });
orderSchema.index({ deliveryPerson: 1, status: 1 });
// orderNumber already has unique index via schema, no need to add index()

// --- Auto-generate order number ---
orderSchema.pre('validate', function(next) {
  if (!this.orderNumber) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${rand}`;
  }
  next();
});

// --- Instance methods ---
orderSchema.methods.updateStatus = async function(newStatus, location = null, note = '') {
  this.status = newStatus;
  this.trackingHistory.push({ status: newStatus, timestamp: new Date(), location, note });

  if (newStatus === 'delivered') this.actualDeliveryTime = new Date();
  return this.save();
};

orderSchema.methods.calculateDeliveryTime = function() {
  if (this.actualDeliveryTime && this.createdAt) {
    this.deliveryTime = Math.round((this.actualDeliveryTime - this.createdAt) / (1000 * 60));
  }
  return this.deliveryTime;
};

// --- Virtuals ---
orderSchema.virtual('orderAge').get(function() {
  return Math.round((Date.now() - this.createdAt) / (1000 * 60)); // in minutes
});

// --- Static methods ---
orderSchema.statics.getOrdersByStatus = function(status, limit = 50) {
  return this.find({ status })
    .populate('customer', 'firstName lastName phone')
    .populate('merchant', 'firstName lastName businessName phone')
    .populate('deliveryPerson', 'firstName lastName phone')
    .populate('items.product', 'name price images')
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Order', orderSchema);
