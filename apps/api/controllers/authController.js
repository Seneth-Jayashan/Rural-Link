const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { verifyEmailTemplate } = require('../emails/emailTemplates');
require("dotenv").config();
// Profile image upload logic removed

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// -------------------- REGISTER --------------------
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { 
      firstName, lastName, email, password, role = 'customer', phone, 
      businessName, shopLocation
    } = req.body;

    // Handle address fields - they come as address.street, address.city, etc.
    const address = {};
    Object.keys(req.body).forEach(key => {
      if (key.startsWith('address.')) {
        const addressField = key.split('.')[1];
        address[addressField] = req.body[key];
      }
    });

    // Handle shop location fields for merchants
    const shopLocationData = {};
    // Merge object payload if sent as JSON
    if (shopLocation && typeof shopLocation === 'object') {
      shopLocationData.street = shopLocation.street || '';
      shopLocationData.city = shopLocation.city || '';
      shopLocationData.state = shopLocation.state || '';
      shopLocationData.zipCode = shopLocation.zipCode || '';
      shopLocationData.country = shopLocation.country || 'Sri Lanka';
      shopLocationData.fullAddress = shopLocation.fullAddress || '';
      if (shopLocation.coordinates) {
        shopLocationData.coordinates = {
          latitude: shopLocation.coordinates.latitude ?? null,
          longitude: shopLocation.coordinates.longitude ?? null
        };
      }
    }
    // Also support dot-notated fields from FormData (e.g., 'shopLocation.coordinates.latitude')
    Object.keys(req.body).forEach(key => {
      if (key.startsWith('shopLocation.')) {
        const path = key.split('.').slice(1); // remove 'shopLocation'
        if (path[0] === 'coordinates') {
          shopLocationData.coordinates = shopLocationData.coordinates || {};
          if (path[1] === 'latitude') shopLocationData.coordinates.latitude = parseFloat(req.body[key]);
          if (path[1] === 'longitude') shopLocationData.coordinates.longitude = parseFloat(req.body[key]);
        } else {
          shopLocationData[path[0]] = req.body[key];
        }
      }
    });

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const userData = { firstName, lastName, email, password, role, phone };
    
    // Add address if provided and has content
    if (address && Object.keys(address).length > 0 && Object.values(address).some(val => val && val.trim())) {
      userData.address = address;
    }
    
    // If a profile image was uploaded, save its relative path
    if (req.file && req.file.filename) {
      userData.profileImage = `/uplod/${req.file.filename}`;
    }
    if (role === 'merchant') {
      Object.assign(userData, { businessName });
      if (Object.keys(shopLocationData).length > 0) {
        userData.shopLocation = shopLocationData;
      }
    } 

    userData.isApproved = true;

    // -------------------- SECURE TOKEN CREATION --------------------
    const tokenHint = Math.random().toString(36).substring(2, 10); // short lookup ID
    const rawToken = `${email}-${Date.now()}-${tokenHint}`;

    const salt = await bcrypt.genSalt(10);
    const verificationTokenHash = await bcrypt.hash(rawToken + process.env.JWT_SECRET, salt);

    userData.verificationTokenHash = verificationTokenHash;
    userData.verificationTokenHint = tokenHint; // used for quick lookup

    const user = await User.create(userData);

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${encodeURIComponent(rawToken)}/${tokenHint}`;

    await sendEmail({
      to: user.email,
      subject: 'Verify your email',
      html: verifyEmailTemplate(verifyUrl, user.firstName)
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// -------------------- VERIFY EMAIL --------------------
exports.verifyEmail = async (req, res) => {
  try {
    const { token, hint } = req.params;
    console.log('token: ', token , 'Hint : ', hint);
    if (!token || !hint) {
      return res.status(400).json({ success: false, message: 'Invalid verification link' });
    }

    // 👇 Explicitly include the hidden field
    const user = await User.findOne({ verificationTokenHint: hint }).select('+verificationTokenHash');
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }

    if (!user.verificationTokenHash) {
      console.log('Verification token hash missing for user:', user.email);
      return res.status(400).json({ success: false, message: 'Verification token not set for this user' });
    }

    const isMatch = await bcrypt.compare(token + process.env.JWT_SECRET, user.verificationTokenHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    user.verificationTokenHash = null;
    user.verificationTokenHint = null;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully. You can now log in.' });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ success: false, message: 'Server error during email verification' });
  }
};




exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account is deactivated. Please contact support.' });
    if (!user.isVerified) return res.status(401).json({ success: false, message: 'Please verify your email before logging in' });

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = generateToken(user._id);
    const userResponse = user.toObject();
    delete userResponse.password;

    const options = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none'
    };

    res.cookie('token', token, options);
    res.json({ success: true, message: 'Login successful', token, user: userResponse });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

exports.logout = (req, res) => {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    expires: new Date(0)
  };
  res.cookie('token', '', options);
  res.json({ success: true, message: 'Logged out successfully' });
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const allowedUpdates = ['firstName', 'lastName', 'phone', 'address'];
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
    res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateProfilePhoto = async (req, res) => {
  try {
    if (!req.file || !req.file.filename) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }
    const imagePath = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: imagePath },
      { new: true }
    ).select('-password');
    return res.json({ success: true, message: 'Profile photo updated', user });
  } catch (error) {
    console.error('Update profile photo error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) 
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) 
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'Your password has been changed',
      html: passwordChangedTemplate(user.firstName)
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: forgotPasswordTemplate(resetUrl, user.firstName)
    });

    res.json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'Your password has been reset',
      html: passwordChangedTemplate(user.firstName)
    });

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateFCMToken = async(req,res) => {
  const token = req.body.token;
  const {_id} = req.user;
  try{
    const user = await User.findByIdAndUpdate(_id, {fcmToken:token},{new:true});
    if(!user){
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({success:true, message:'User updated successfully'});
  }catch(error){
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

exports.testEmail = async (req, res) => {
  try {
    const { email, type = 'test', data = {} } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    let subject, html;
    
    switch (type) {
      case 'verification':
        subject = 'Email Verification - Sportify';
        html = verifyEmailTemplate(data.name || 'User', data.verificationLink || '#');
        break;
      case 'password-reset':
        subject = 'Password Reset - Sportify';
        html = forgotPasswordTemplate(data.name || 'User', data.resetLink || '#');
        break;
      case 'order-confirmation':
        subject = 'Order Confirmation - Sportify';
        html = `
          <h2>Order Confirmation</h2>
          <p>Hello ${data.name || 'User'},</p>
          <p>Your order #${data.orderNumber || 'N/A'} has been confirmed.</p>
          <p>Total: $${data.total || '0.00'}</p>
        `;
        break;
      case 'low-stock':
        subject = 'Low Stock Alert - Sportify';
        html = `
          <h2>Low Stock Alert</h2>
          <p>The following products are running low on stock:</p>
          <ul>
            ${data.products ? data.products.map(p => `<li>${p.name} - Current: ${p.currentStock}, Min: ${p.minStock}</li>`).join('') : ''}
          </ul>
        `;
        break;
      case 'welcome':
        subject = 'Welcome to Sportify!';
        html = `
          <h2>Welcome to Sportify!</h2>
          <p>Hello ${data.name || 'User'},</p>
          <p>Thank you for joining Sportify. We're excited to have you on board!</p>
        `;
        break;
      default:
        subject = 'Test Email - Sportify';
        html = `
          <h2>Test Email</h2>
          <p>This is a test email from Sportify system.</p>
          <p>If you received this email, the email system is working correctly.</p>
        `;
    }

    await sendEmail({
      to: email,
      subject,
      html
    });

    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ success: false, message: 'Failed to send test email', error: error.message });
  }
};

