const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    maxlength: 2000
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  tempId: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
chatMessageSchema.index({ orderId: 1, timestamp: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
