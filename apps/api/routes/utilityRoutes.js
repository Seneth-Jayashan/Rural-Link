const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const roles = require('../middlewares/roles');
const { optimizeRoute } = require('../services/routeOptimization');

// Route optimization endpoint for delivery users
router.post('/optimize-route', auth, roles('deliver'), (req, res) => {
  const { start, stops } = req.body;
  if (!start || !stops || !Array.isArray(stops) || stops.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid input' });
  }
  const result = optimizeRoute(start, stops);
  res.json({ success: true, data: result });
});

// Translation endpoints removed per request

module.exports = router;


