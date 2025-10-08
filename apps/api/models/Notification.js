const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['order', 'delivery', 'payment', 'system', 'promotion', 'reminder'],
    required: true
  },
  category: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  },
  data: {
    orderId: mongoose.Schema.Types.ObjectId,
    deliveryId: mongoose.Schema.Types.ObjectId,
    paymentId: String,
    url: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isPushed: {
    type: Boolean,
    default: false
  },
  pushTokens: [String],
  scheduledFor: Date,
  expiresAt: Date,
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  language: {
    type: String,
    enum: ['en', 'si', 'ta'],
    default: 'en'
  },
  deliveryMethod: {
    type: [String],
    enum: ['push', 'email', 'sms', 'in_app'],
    default: ['in_app']
  },
  template: {
    type: String,
    enum: ['order_confirmation', 'order_ready', 'order_delivered', 'payment_success', 'low_stock', 'rating_reminder', 'promotion', 'system_update']
  },
  templateData: mongoose.Schema.Types.Mixed,
  isOffline: {
    type: Boolean,
    default: false
  },
  offlineSyncTime: Date
}, {
  timestamps: true
});

// Index for better query performance
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, category: 1 });
notificationSchema.index({ scheduledFor: 1, isPushed: 1 });
notificationSchema.index({ expiresAt: 1 });

// Pre-save middleware to set expiration if not provided
notificationSchema.pre('save', function(next) {
  if (!this.expiresAt && this.type === 'promotion') {
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  }
  next();
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

// Method to mark as pushed
notificationSchema.methods.markAsPushed = function() {
  this.isPushed = true;
  return this.save();
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ user: userId, isRead: false });
};

// Static method to get notifications by type
notificationSchema.statics.getByType = function(userId, type, limit = 20) {
  return this.find({ user: userId, type })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  
  // If it's a push notification, trigger push service
  if (data.deliveryMethod.includes('push')) {
    // This would integrate with push notification service
    // await pushNotificationService.send(notification);
  }
  
  return notification;
};

// Static method to send bulk notifications
notificationSchema.statics.sendBulk = async function(notifications) {
  try {
    const created = await this.insertMany(notifications);
    
    // Send push notifications for bulk
    const pushNotifications = created.filter(n => n.deliveryMethod.includes('push'));
    if (pushNotifications.length > 0) {
      // await pushNotificationService.sendBulk(pushNotifications);
    }
    
    return created;
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    throw error;
  }
};

// Static method to clean expired notifications
notificationSchema.statics.cleanExpired = function() {
  return this.deleteMany({ 
    expiresAt: { $lt: new Date() } 
  });
};

// Static method to get notification analytics
notificationSchema.statics.getAnalytics = async function(userId, startDate, endDate) {
  const match = {
    user: userId,
    createdAt: { $gte: startDate, $lte: endDate }
  };
  
  const analytics = await this.aggregate([
    { $match: match },
    { $group: {
      _id: '$type',
      count: { $sum: 1 },
      readCount: { $sum: { $cond: ['$isRead', 1, 0] } },
      pushCount: { $sum: { $cond: ['$isPushed', 1, 0] } }
    }},
    { $project: {
      type: '$_id',
      total: '$count',
      read: '$readCount',
      pushed: '$pushCount',
      readRate: { $multiply: [{ $divide: ['$readCount', '$count'] }, 100] }
    }}
  ]);
  
  return analytics;
};

module.exports = mongoose.model('Notification', notificationSchema);
