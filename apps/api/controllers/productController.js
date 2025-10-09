const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// Get all products for a merchant
exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (page - 1) * limit;
    
    let query = { merchant: req.user._id };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('merchant', 'businessName');
    
    const total = await Product.countDocuments(query);
    
    res.json({
      success: true,
      data: products,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get single product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('merchant', 'businessName firstName lastName');
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create new product
exports.createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    
    const productData = {
      ...req.body,
      merchant: req.user._id
    };
    
    const product = await Product.create(productData);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    if (product.merchant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this product' });
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    if (product.merchant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this product' });
    }
    
    await Product.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update product stock
exports.updateStock = async (req, res) => {
  try {
    const { stock } = req.body;
    
    if (stock < 0) {
      return res.status(400).json({ success: false, message: 'Stock cannot be negative' });
    }
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    if (product.merchant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this product' });
    }
    
    product.stock = stock;
    await product.save();
    
    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get low stock products
exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      merchant: req.user._id,
      $expr: { $lte: ['$stock', '$minStock'] }
    }).sort({ stock: 1 });
    
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get product analytics
exports.getProductAnalytics = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    
    const analytics = await Product.aggregate([
      { $match: { merchant: req.user._id } },
      { $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        activeProducts: { $sum: { $cond: ['$isActive', 1, 0] } },
        lowStockProducts: { $sum: { $cond: [{ $lte: ['$stock', '$minStock'] }, 1, 0] } },
        outOfStockProducts: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
        averageRating: { $avg: '$rating.average' },
        totalSales: { $sum: '$salesCount' }
      }}
    ]);
    
    const categoryBreakdown = await Product.aggregate([
      { $match: { merchant: req.user._id } },
      { $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalSales: { $sum: '$salesCount' },
        averageRating: { $avg: '$rating.average' }
      }},
      { $sort: { count: -1 } }
    ]);
    
    const topProducts = await Product.find({ merchant: req.user._id })
      .sort({ salesCount: -1 })
      .limit(10)
      .select('name salesCount rating price');
    
    res.json({
      success: true,
      data: {
        overview: analytics[0] || {},
        categoryBreakdown,
        topProducts
      }
    });
  } catch (error) {
    console.error('Get product analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Search products (public)
exports.searchProducts = async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, sortBy = 'rating.average', sortOrder = 'desc', page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    let query = { isActive: true };
    
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
        { category: { $regex: q, $options: 'i' } }
      ];
    }
    
    if (category) {
      query.category = category;
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('merchant', 'businessName firstName lastName')
      .select('-stock -minStock');
    
    const total = await Product.countDocuments(query);
    
    res.json({
      success: true,
      data: products,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
