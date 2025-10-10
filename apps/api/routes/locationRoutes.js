const express = require('express');
const router = express.Router();
const { updateDeliveryLocation, getDeliveryRoute, geocodeAddress, reverseGeocode } = require('../controllers/locationController');
const authenticate = require('../middlewares/auth');

// Update delivery person location
router.post('/delivery/location', authenticate, updateDeliveryLocation);

// Get route between two points
router.get('/route', getDeliveryRoute);

// Geocode address
router.get('/geocode', geocodeAddress);

// Reverse geocode coordinates
router.get('/reverse-geocode', reverseGeocode);

module.exports = router;
