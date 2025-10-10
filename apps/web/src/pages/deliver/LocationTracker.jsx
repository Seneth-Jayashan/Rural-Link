import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMapPin, FiNavigation, FiSquare, FiPlay, FiRefreshCw, FiCheck } from 'react-icons/fi'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'
import { post } from '../../shared/api.js'
import { useToast } from '../../shared/ui/Toast.jsx'

export default function LocationTracker({ orderId, onLocationUpdate }) {
  const { t } = useI18n()
  const { notify } = useToast()
  const [isTracking, setIsTracking] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [watchId, setWatchId] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const intervalRef = useRef(null)

  // Start location tracking
  const startTracking = () => {
    if (!navigator.geolocation) {
      notify({ type: 'error', title: t('Geolocation not supported') })
      return
    }

    setIsTracking(true)
    
    // Get initial location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        }
        setCurrentLocation(location)
        updateLocation(location)
      },
      (error) => {
        console.error('Geolocation error:', error)
        notify({ type: 'error', title: t('Unable to get location') })
        setIsTracking(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )

    // Start watching position
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        }
        setCurrentLocation(location)
      },
      (error) => {
        console.error('Watch position error:', error)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )
    
    setWatchId(id)

    // Update location every 30 seconds
    intervalRef.current = setInterval(() => {
      if (currentLocation) {
        updateLocation(currentLocation)
      }
    }, 30000)
  }

  // Stop location tracking
  const stopTracking = () => {
    setIsTracking(false)
    
    if (watchId) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // Update location on server
  const updateLocation = async (location) => {
    if (!orderId || isUpdating) return

    setIsUpdating(true)
    try {
      await post('/api/location/delivery/location', {
        orderId,
        latitude: location.latitude,
        longitude: location.longitude
      })
      
      setLastUpdate(new Date())
      onLocationUpdate?.(location)
      
      notify({ 
        type: 'success', 
        title: t('Location updated'), 
        message: t('Your location has been shared with the customer') 
      })
    } catch (error) {
      console.error('Location update error:', error)
      notify({ type: 'error', title: t('Failed to update location') })
    } finally {
      setIsUpdating(false)
    }
  }

  // Manual location update
  const manualUpdate = () => {
    if (!navigator.geolocation) {
      notify({ type: 'error', title: t('Geolocation not supported') })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        }
        setCurrentLocation(location)
        updateLocation(location)
      },
      (error) => {
        console.error('Geolocation error:', error)
        notify({ type: 'error', title: t('Unable to get location') })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId)
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [watchId])

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-100 rounded-xl">
            <FiMapPin className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{t('Location Tracking')}</h3>
            <p className="text-sm text-gray-600">{t('Share your location with the customer')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <div className="text-xs text-gray-500">
              {t('Last update')}: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Current Location Display */}
      {currentLocation && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-green-50 border border-green-200 rounded-2xl"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-medium text-green-800">{t('Current Location')}</span>
          </div>
          <div className="text-sm text-green-700">
            {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
          </div>
          <div className="text-xs text-green-600 mt-1">
            {t('Accuracy')}: ±{Math.round(currentLocation.accuracy)}m
          </div>
        </motion.div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-3">
        {!isTracking ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startTracking}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-colors"
          >
            <FiPlay className="w-4 h-4" />
            {t('Start Tracking')}
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={stopTracking}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-colors"
          >
            <FiSquare className="w-4 h-4" />
            {t('Stop Tracking')}
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={manualUpdate}
          disabled={isUpdating}
          className="px-4 py-3 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {isUpdating ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <FiRefreshCw className="w-4 h-4" />
          )}
          {t('Update Now')}
        </motion.button>
      </div>

      {/* Status Indicator */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className={isTracking ? 'text-green-700' : 'text-gray-600'}>
            {isTracking ? t('Tracking Active') : t('Tracking Inactive')}
          </span>
        </div>
        
        {isTracking && (
          <div className="flex items-center gap-1 text-orange-600">
            <FiNavigation className="w-3 h-3" />
            <span className="text-xs">{t('Auto-updating every 30s')}</span>
          </div>
        )}
      </div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-2xl"
      >
        <div className="flex items-start gap-2">
          <FiCheck className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <div className="font-medium mb-1">{t('How it works:')}</div>
            <ul className="text-xs space-y-1 text-blue-600">
              <li>• {t('Start tracking to automatically share your location')}</li>
              <li>• {t('Your location updates every 30 seconds')}</li>
              <li>• {t('Customer can see your real-time position on the map')}</li>
              <li>• {t('Stop tracking when delivery is complete')}</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
