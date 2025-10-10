const Order = require('../models/Order');
const { validationResult } = require('express-validator');

// Update delivery person location
exports.updateDeliveryLocation = async (req, res) => {
  try {
    const { latitude, longitude, orderId } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        success: false, 
        message: 'Latitude and longitude are required' 
      });
    }

    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order ID is required' 
      });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Check if user is authorized to update this order
    if (order.deliveryPerson.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this delivery location' 
      });
    }

    // Update tracking history with location
    await order.updateStatus(order.status, { latitude, longitude }, 'Location updated');

    // Emit real-time update
    try {
      const { emitToOrder } = require('../services/realtime');
      emitToOrder(orderId, 'orderMessage', {
        type: 'delivery_location',
        latitude,
        longitude,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Real-time update error:', error);
    }

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        latitude,
        longitude,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Update delivery location error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get delivery route between two points
exports.getDeliveryRoute = async (req, res) => {
  try {
    const { startLat, startLng, endLat, endLng } = req.query;
    
    if (!startLat || !startLng || !endLat || !endLng) {
      return res.status(400).json({ 
        success: false, 
        message: 'Start and end coordinates are required' 
      });
    }

    // Use OSRM routing service
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`
    );
    
    if (!response.ok) {
      throw new Error('Route calculation failed');
    }
    
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      res.json({
        success: true,
        data: {
          coordinates: route.geometry.coordinates.map(coord => [coord[1], coord[0]]), // Convert [lng, lat] to [lat, lng]
          distance: route.distance,
          duration: route.duration,
          waypoints: data.waypoints
        }
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'No route found' 
      });
    }
  } catch (error) {
    console.error('Get delivery route error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Geocode address using Nominatim
exports.geocodeAddress = async (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ 
        success: false, 
        message: 'Address is required' 
      });
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5&countrycodes=lk`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }
    
    const data = await response.json();
    
    res.json({
      success: true,
      data: data.map(result => ({
        display_name: result.display_name,
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        place_id: result.place_id
      }))
    });
  } catch (error) {
    console.error('Geocode address error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Reverse geocode coordinates
exports.reverseGeocode = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        success: false, 
        message: 'Latitude and longitude are required' 
      });
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    
    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }
    
    const data = await response.json();
    
    res.json({
      success: true,
      data: {
        display_name: data.display_name,
        address: data.address
      }
    });
  } catch (error) {
    console.error('Reverse geocode error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
