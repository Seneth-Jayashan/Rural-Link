import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { motion, AnimatePresence } from 'framer-motion'
import { FiTruck, FiMapPin, FiNavigation, FiRefreshCw, FiTarget } from 'react-icons/fi'
import { useI18n } from '../i18n/LanguageContext.jsx'
import { useToast } from './Toast.jsx'

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom marker icons
const createCustomIcon = (color = '#ef4444', icon = '📍') => L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    background-color: ${color};
    width: 24px;
    height: 24px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: white;
  ">${icon}</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24]
})

const deliveryIcon = createCustomIcon('#10b981', '🚚')
const customerIcon = createCustomIcon('#ef4444', '🏠')
const restaurantIcon = createCustomIcon('#f59e0b', '🍽️')
const currentLocationIcon = createCustomIcon('#3b82f6', '📍')

// Map component that handles location updates
function MapUpdater({ currentLocation, customerLocation, restaurantLocation, route }) {
  const map = useMap()
  
  useEffect(() => {
    if (currentLocation && customerLocation) {
      const bounds = L.latLngBounds([
        [currentLocation.latitude, currentLocation.longitude],
        [customerLocation.latitude, customerLocation.longitude]
      ])
      if (restaurantLocation) {
        bounds.extend([restaurantLocation.latitude, restaurantLocation.longitude])
      }
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [currentLocation, customerLocation, restaurantLocation, map])

  return null
}

// OSRM Route Service
const getRoute = async (start, end) => {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`
    )
    const data = await response.json()
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0]
      return {
        coordinates: route.geometry.coordinates.map(coord => [coord[1], coord[0]]), // Convert [lng, lat] to [lat, lng]
        distance: route.distance,
        duration: route.duration
      }
    }
    return null
  } catch (error) {
    console.error('Route calculation error:', error)
    return null
  }
}

export default function DeliveryMap({ 
  orderId, 
  customerLocation, 
  restaurantLocation,
  onLocationUpdate,
  isTracking = false
}) {
  const { t } = useI18n()
  const { notify } = useToast()
  const [currentLocation, setCurrentLocation] = useState(null)
  const [route, setRoute] = useState(null)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const mapRef = useRef(null)

  // Calculate center point for map
  const getMapCenter = () => {
    if (currentLocation && customerLocation) {
      return [
        (currentLocation.latitude + customerLocation.latitude) / 2,
        (currentLocation.longitude + customerLocation.longitude) / 2
      ]
    }
    if (customerLocation) {
      return [customerLocation.latitude, customerLocation.longitude]
    }
    return [6.9271, 79.8612] // Default to Colombo
  }

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      notify({
        type: 'error',
        title: t('Geolocation Not Supported'),
        message: t('Geolocation is not supported by this browser')
      })
      return
    }

    setIsGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        }
        setCurrentLocation(location)
        onLocationUpdate?.(location)
        setIsGettingLocation(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        notify({
          type: 'error',
          title: t('Location Access Failed'),
          message: t('Unable to get your location. Please try again.')
        })
        setIsGettingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  // Calculate route when locations change
  useEffect(() => {
    const calculateRoute = async () => {
      if (!currentLocation || !customerLocation) return

      setIsLoadingRoute(true)
      try {
        const routeData = await getRoute(currentLocation, customerLocation)
        if (routeData) {
          setRoute(routeData)
        }
      } catch (error) {
        console.error('Route calculation failed:', error)
      } finally {
        setIsLoadingRoute(false)
      }
    }

    calculateRoute()
  }, [currentLocation, customerLocation])

  // Auto-get location when component mounts if tracking is enabled
  useEffect(() => {
    if (isTracking && !currentLocation) {
      getCurrentLocation()
    }
  }, [isTracking])

  // Get estimated delivery time
  const getEstimatedTime = () => {
    if (!route) return null
    
    const minutes = Math.ceil(route.duration / 60)
    if (minutes < 60) {
      return `${minutes} ${t('minutes')}`
    } else {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return `${hours}h ${remainingMinutes}m`
    }
  }

  // Get distance in km
  const getDistance = () => {
    if (!route) return null
    return `${(route.distance / 1000).toFixed(1)} km`
  }

  return (
    <div className="w-full h-full bg-white rounded-2xl overflow-hidden shadow-lg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <FiTruck className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{t('Delivery Map')}</h3>
            <div className="text-xs text-gray-600">
              {isTracking ? t('Live tracking active') : t('Manual location updates')}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
            title={t('Get current location')}
          >
            {isGettingLocation ? (
              <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FiNavigation className="w-3 h-3 text-blue-600" />
            )}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
            title={t('Refresh')}
          >
            <FiRefreshCw className="w-3 h-3 text-blue-600" />
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="relative flex-1 min-h-0">
        <MapContainer
          center={getMapCenter()}
          zoom={13}
          className="w-full h-full"
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapUpdater 
            currentLocation={currentLocation}
            customerLocation={customerLocation}
            restaurantLocation={restaurantLocation}
            route={route}
          />
          
          {/* Customer location marker */}
          {customerLocation && (
            <Marker
              position={[customerLocation.latitude, customerLocation.longitude]}
              icon={customerIcon}
            >
              <Popup>
                <div className="text-center">
                  <div className="font-medium text-gray-900">{t('Delivery Address')}</div>
                  <div className="text-sm text-gray-600 mt-1">{customerLocation.address || t('Customer location')}</div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Restaurant location marker */}
          {restaurantLocation && (
            <Marker
              position={[restaurantLocation.latitude, restaurantLocation.longitude]}
              icon={restaurantIcon}
            >
              <Popup>
                <div className="text-center">
                  <div className="font-medium text-gray-900">{t('Restaurant')}</div>
                  <div className="text-sm text-gray-600 mt-1">{restaurantLocation.name || t('Pickup location')}</div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Current location marker */}
          {currentLocation && (
            <Marker
              position={[currentLocation.latitude, currentLocation.longitude]}
              icon={currentLocationIcon}
            >
              <Popup>
                <div className="text-center">
                  <div className="font-medium text-gray-900">{t('Your Location')}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                  </div>
                  {currentLocation.accuracy && (
                    <div className="text-xs text-gray-500 mt-1">
                      {t('Accuracy')}: ±{Math.round(currentLocation.accuracy)}m
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Route polyline */}
          {route && route.coordinates && (
            <Polyline
              positions={route.coordinates}
              color="#10b981"
              weight={6}
              opacity={0.9}
              dashArray="10, 10"
            />
          )}
        </MapContainer>

        {/* Loading overlay */}
        {isLoadingRoute && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-600 bg-white px-4 py-2 rounded-xl shadow-lg">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              {t('Calculating route...')}
            </div>
          </div>
        )}
      </div>

      {/* Status and Info */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-2 gap-3">
          {/* Current Location Status */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <FiTarget className="w-3 h-3 text-blue-600" />
            </div>
            <div>
              <div className="text-xs font-medium text-gray-900">{t('Your Location')}</div>
              <div className="text-xs text-gray-600">
                {currentLocation ? t('Location found') : t('Location not set')}
              </div>
            </div>
          </div>

          {/* Distance/Time */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-100 rounded-lg">
              <FiNavigation className="w-3 h-3 text-green-600" />
            </div>
            <div>
              <div className="text-xs font-medium text-gray-900">
                {route ? getDistance() : '-- km'}
              </div>
              <div className="text-xs text-gray-600">
                {route ? getEstimatedTime() : '-- min'}
              </div>
            </div>
          </div>
        </div>

        {/* Route Information */}
        {route && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <FiNavigation className="w-3 h-3 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">{t('Route to Customer')}</div>
                <div className="text-xs text-gray-600">{t('Optimal path calculated')}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{getDistance()}</div>
                <div className="text-xs text-gray-600">{t('Distance')}</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{getEstimatedTime()}</div>
                <div className="text-xs text-gray-600">{t('Estimated Time')}</div>
              </div>
            </div>
            
            {/* Navigation Button */}
            <button
              onClick={() => {
                if (customerLocation) {
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${customerLocation.latitude},${customerLocation.longitude}`
                  window.open(url, '_blank')
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <FiNavigation className="w-3 h-3" />
              {t('Open in Navigation')}
            </button>
          </motion.div>
        )}

        {/* Location Info */}
        {currentLocation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-2 bg-white rounded-lg border border-gray-200"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <FiMapPin className="w-3 h-3 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 text-sm">{t('Current Position')}</div>
                <div className="text-xs text-gray-600">
                  {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                </div>
                {currentLocation.accuracy && (
                  <div className="text-xs text-gray-500 mt-1">
                    {t('Accuracy')}: ±{Math.round(currentLocation.accuracy)}m
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}