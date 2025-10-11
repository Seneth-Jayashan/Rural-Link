const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['customer', 'deliver', 'merchant'],
    default: 'customer'
  },
  // Delivery-specific fields
  vehicleNumber: {
    type: String,
    trim: true,
    minlength: [3, 'Vehicle number is too short'],
    maxlength: [20, 'Vehicle number is too long']
  },
  vehicleType: {
    type: String,
    enum: ['motor_bike', 'car', 'three_wheel'],
    default: undefined
  },
  phone: { type: String, trim: true },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  profileImage: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },

  // ✅ Updated verification token fields (new)
  verificationTokenHash: { type: String, select: false }, // hashed token
  verificationTokenHint: { type: String, index: true }, // short lookup string

  resetPasswordToken: String,
  resetPasswordExpire: Date,

  // Merchant specific fields
  businessName: {
    type: String,
    required: function() {
      return this.role === 'merchant';
    }
  },
  shopLocation: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    },
    fullAddress: { type: String }
  },
  isApproved: { type: Boolean, default: true },


  paymentHistory: [
    {
      amount: Number,
      method: {
        type: String,
        enum: ['bank', 'paypal', 'stripe', 'manual'],
        default: 'manual'
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
      },
      transactionId: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  fcmToken: [{type: String}],
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name virtual
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });

// delete products when a merchant user is deleted
userSchema.pre('findOneAndDelete', async function(next) {
  try {
    const doc = await this.model.findOne(this.getFilter());
    if (doc && doc.role === 'merchant') {
      await mongoose.model('Product').deleteMany({ merchant: doc._id });
    }
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.post('remove', async function(doc, next) {
  try {
    if (doc && doc.role === 'merchant') {
      await mongoose.model('Product').deleteMany({ merchant: doc._id });
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);
