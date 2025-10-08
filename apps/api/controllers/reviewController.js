const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');

exports.createReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { orderId, type, rating, title, comment, productId, deliveryPersonId, language = 'en', generateAI = false } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this order' });
    }

    const reviewData = {
      order: order._id,
      customer: req.user._id,
      merchant: order.merchant,
      type,
      rating,
      title,
      comment,
      language
    };

    if (type === 'product' && productId) reviewData.product = productId;
    if (type === 'delivery' && deliveryPersonId) reviewData.deliveryPerson = deliveryPersonId;

    const review = await Review.create(reviewData);

    if (generateAI) {
      await review.generateAIComment();
      await review.save();
    }

    if (review.product) {
      const product = await Product.findById(review.product);
      if (product) await product.updateRating();
    }

    res.status(201).json({ success: true, message: 'Review submitted', data: review });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.listReviews = async (req, res) => {
  try {
    const { type, targetId, rating, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const match = { isPublic: true };
    if (type === 'product') match.product = targetId;
    else if (type === 'merchant') match.merchant = targetId;
    else if (type === 'delivery') match.deliveryPerson = targetId;

    if (rating) match.rating = parseInt(rating);

    const reviews = await Review.find(match)
      .populate('customer', 'firstName lastName profileImage')
      .populate('product', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(match);

    res.json({ success: true, data: reviews, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total } });
  } catch (error) {
    console.error('List reviews error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.respondToReview = async (req, res) => {
  try {
    const { response } = req.body;
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (review.merchant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to respond to this review' });
    }
    review.merchantResponse = { comment: response, respondedAt: new Date() };
    await review.save();
    res.json({ success: true, message: 'Response added', data: review });
  } catch (error) {
    console.error('Respond to review error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.markHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    const success = await review.markHelpful(req.user._id);
    res.json({ success: true, message: success ? 'Marked helpful' : 'Already marked helpful', data: review });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.generateAIForReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (review.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the author can generate AI comment' });
    }
    const generated = await review.generateAIComment();
    await review.save();
    res.json({ success: true, message: 'AI comment generated', data: { aiGeneratedComment: generated } });
  } catch (error) {
    console.error('Generate AI comment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


