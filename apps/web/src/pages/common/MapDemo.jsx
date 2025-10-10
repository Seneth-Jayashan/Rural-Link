import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiMapPin, FiTruck, FiNavigation, FiCheck } from 'react-icons/fi'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'
import MapLocationSelector from '../../shared/ui/MapLocationSelector.jsx'
import DeliveryTrackingMap from '../../shared/ui/DeliveryTrackingMap.jsx'

export default function MapDemo() {
  const { t } = useI18n()
  const [showLocationSelector, setShowLocationSelector] = useState(false)
  const [showTrackingMap, setShowTrackingMap] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [demoOrder, setDemoOrder] = useState({
    _id: 'demo-order-123',
    orderNumber: 'ORD-DEMO-001',
    status: 'in_transit',
    deliveryAddress: {
      coordinates: {
        latitude: 6.9271,
        longitude: 79.8612
      },
      fullAddress: 'Colombo, Sri Lanka'
    },
    merchant: {
      businessName: 'Demo Restaurant',
      location: {
        latitude: 6.9147,
        longitude: 79.8730
      }
    },
    deliveryPerson: {
      _id: 'demo-delivery',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+94 77 123 4567'
    }
  })

  const handleLocationSelect = (location, address) => {
    setSelectedLocation({ location, address })
    setShowLocationSelector(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 p-4 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto mb-6"
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('Map & Delivery Demo')}</h1>
          <p className="text-gray-600">{t('Experience the location selection and delivery tracking features')}</p>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Location Selection Demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-orange-100 rounded-xl">
              <FiMapPin className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{t('Location Selection')}</h2>
          </div>
          
          <p className="text-gray-600 mb-4">
            {t('Click the button below to open the map and select a delivery location. You can search for addresses or click directly on the map.')}</p>
          
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowLocationSelector(true)}
              className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 transition-colors"
            >
              <FiMapPin className="w-5 h-5" />
              {t('Select Location on Map')}
            </motion.button>
            
            {selectedLocation && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 p-3 bg-green-50 border border-green-200 rounded-2xl"
              >
                <div className="flex items-center gap-2 mb-1">
                  <FiCheck className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">{t('Location Selected')}</span>
                </div>
                <div className="text-sm text-green-700">{selectedLocation.address}</div>
                <div className="text-xs text-green-600 mt-1">
                  {selectedLocation.location.latitude.toFixed(6)}, {selectedLocation.location.longitude.toFixed(6)}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Delivery Tracking Demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-orange-100 rounded-xl">
              <FiTruck className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{t('Live Delivery Tracking')}</h2>
          </div>
          
          <p className="text-gray-600 mb-4">
            {t('See how customers can track their delivery in real-time with live location updates and route optimization.')}</p>
          
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowTrackingMap(!showTrackingMap)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-colors"
            >
              <FiNavigation className="w-5 h-5" />
              {showTrackingMap ? t('Hide Tracking Map') : t('Show Tracking Map')}
            </motion.button>
          </div>

          {showTrackingMap && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <DeliveryTrackingMap
                orderId={demoOrder._id}
                customerLocation={{
                  latitude: demoOrder.deliveryAddress.coordinates.latitude,
                  longitude: demoOrder.deliveryAddress.coordinates.longitude,
                  address: demoOrder.deliveryAddress.fullAddress
                }}
                restaurantLocation={{
                  latitude: demoOrder.merchant.location.latitude,
                  longitude: demoOrder.merchant.location.longitude,
                  name: demoOrder.merchant.businessName
                }}
                deliveryPerson={demoOrder.deliveryPerson}
                status={demoOrder.status}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Features Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('Features Implemented')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">{t('Location Selection')}</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <FiCheck className="w-4 h-4 text-green-500" />
                  {t('Interactive map with OpenStreetMap tiles')}
                </li>
                <li className="flex items-center gap-2">
                  <FiCheck className="w-4 h-4 text-green-500" />
                  {t('Address search using Nominatim geocoding')}
                </li>
                <li className="flex items-center gap-2">
                  <FiCheck className="w-4 h-4 text-green-500" />
                  {t('Click to select location on map')}
                </li>
                <li className="flex items-center gap-2">
                  <FiCheck className="w-4 h-4 text-green-500" />
                  {t('Current location detection')}
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">{t('Delivery Tracking')}</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <FiCheck className="w-4 h-4 text-green-500" />
                  {t('Real-time location updates via Socket.IO')}
                </li>
                <li className="flex items-center gap-2">
                  <FiCheck className="w-4 h-4 text-green-500" />
                  {t('OSRM route optimization and calculation')}
                </li>
                <li className="flex items-center gap-2">
                  <FiCheck className="w-4 h-4 text-green-500" />
                  {t('Live delivery person tracking')}
                </li>
                <li className="flex items-center gap-2">
                  <FiCheck className="w-4 h-4 text-green-500" />
                  {t('Estimated delivery time and distance')}
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Map Location Selector Modal */}
      <AnimatePresence>
        {showLocationSelector && (
          <MapLocationSelector
            onLocationSelect={handleLocationSelect}
            onClose={() => setShowLocationSelector(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
