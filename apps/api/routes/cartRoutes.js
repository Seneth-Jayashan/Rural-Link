const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const cart = require('../controllers/cartController');

router.use(auth);

router.get('/', cart.getCart);
router.put('/', cart.replaceCart);
router.post('/merge', cart.merge);
router.post('/items', cart.addItem);
router.put('/items/:productId', cart.updateItem);
router.delete('/items/:productId', cart.removeItem);
router.delete('/', cart.clear);

module.exports = router;


