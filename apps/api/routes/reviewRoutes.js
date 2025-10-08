const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const roles = require('../middlewares/roles');
const { body } = require('express-validator');
const reviewController = require('../controllers/reviewController');

// Public list
router.get('/', reviewController.listReviews);

// Customer create
router.post('/', auth, roles('customer'), [
  body('orderId').notEmpty(),
  body('type').isIn(['product', 'merchant', 'delivery']),
  body('rating').isInt({ min: 1, max: 5 })
], reviewController.createReview);

// AI generation by author
router.post('/:id/generate-ai', auth, roles('customer'), reviewController.generateAIForReview);

// Merchant respond
router.post('/:id/respond', auth, roles('merchant'), reviewController.respondToReview);

// Helpful
router.post('/:id/helpful', auth, reviewController.markHelpful);

module.exports = router;


