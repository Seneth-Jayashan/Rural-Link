const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const roles = require('../middlewares/roles');
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const { uploadSingle, uploadMultiple } = require('../middlewares/upload');

// Authenticated search (customers must be logged in)
router.get('/search', auth, productController.searchProducts);

// Public product details (no auth required)
router.get('/public/:id', productController.getPublicProduct);

// Merchant protected routes
router.get('/', auth, roles('merchant'), productController.getProducts);
router.get('/:id', auth, roles('merchant'), productController.getProduct);
router.post('/', auth, roles('merchant'), uploadSingle, [
  body('name').notEmpty(),
  body('description').notEmpty(),
  body('category').notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('stock').isInt({ min: 0 })
], productController.createProduct);
router.put('/:id', auth, roles('merchant'), uploadSingle, productController.updateProduct);
router.delete('/:id', auth, roles('merchant'), productController.deleteProduct);
router.patch('/:id/stock', auth, roles('merchant'), productController.updateStock);
router.get('/analytics/overview', auth, roles('merchant'), productController.getProductAnalytics);

module.exports = router;


