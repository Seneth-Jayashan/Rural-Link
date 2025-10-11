import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { motion, AnimatePresence } from 'framer-motion'
import { FiTruck, FiMapPin, FiClock, FiNavigation, FiRefreshCw, FiTarget } from 'react-icons/fi'
import { useI18n } from '../i18n/LanguageContext.jsx'
import { getSocket } from '../socket.js'

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
    width: 30px;
    height: 30px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: white;
  ">${icon}</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30]
})

const deliveryIcon = createCustomIcon('#10b981', '🚚')
const customerIcon = createCustomIcon('#ef4444', '🏠')
const restaurantIcon = createCustomIcon('#f59e0b', '🍽️')

// Map component that handles route updates
function MapUpdater({ deliveryLocation, customerLocation, restaurantLocation, route, shouldFitBounds }) {
  const map = useMap()
  
  useEffect(() => {
    if (shouldFitBounds && deliveryLocation && customerLocation) {
      const bounds = L.latLngBounds([
        [deliveryLocation.latitude, deliveryLocation.longitude],
        [customerLocation.latitude, customerLocation.longitude]
      ])
      if (restaurantLocation) {
        bounds.extend([restaurantLocation.latitude, restaurantLocation.longitude])
      }
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [shouldFitBounds, deliveryLocation, customerLocation, restaurantLocation, map])

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

export default function DeliveryTrackingMap({ 
  orderId, 
  customerLocation, 
  restaurantLocation,
  deliveryPerson = null,
  status = 'pending'
}) {
  const { t } = useI18n()
  const [deliveryLocation, setDeliveryLocation] = useState(null)
  const [route, setRoute] = useState(null)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isRequestingLocation, setIsRequestingLocation] = useState(false)
  const [shouldFitBounds, setShouldFitBounds] = useState(true) // Only fit bounds on initial load
  const mapRef = useRef(null)
  const socket = getSocket()

  // Calculate center point for map
  const getMapCenter = () => {
    if (deliveryLocation && customerLocation) {
      return [
        (deliveryLocation.latitude + customerLocation.latitude) / 2,
        (deliveryLocation.longitude + customerLocation.longitude) / 2
      ]
    }
    if (customerLocation) {
      return [customerLocation.latitude, customerLocation.longitude]
    }
    return [6.9271, 79.8612] // Default to Colombo
  }

  // Calculate route when delivery location changes
  useEffect(() => {
    const calculateRoute = async () => {
      if (!deliveryLocation || !customerLocation) return

      setIsLoadingRoute(true)
      try {
        const routeData = await getRoute(deliveryLocation, customerLocation)
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
  }, [deliveryLocation, customerLocation])

  // Socket connection for real-time updates
  useEffect(() => {
    if (!socket || !orderId) return

    // Join order room
    socket.emit('joinOrderRoom', orderId)

    // Listen for delivery location updates
    const handleLocationUpdate = (data) => {
      if (data.type === 'delivery_location') {
        setDeliveryLocation({
          latitude: data.latitude,
          longitude: data.longitude,
          timestamp: data.timestamp
        })
        setLastUpdate(new Date(data.timestamp))
        // Disable auto-fit after first location update
        setShouldFitBounds(false)
      }
    }

    // Listen for order status updates
    const handleStatusUpdate = (data) => {
      if (data.status === 'delivered') {
        setDeliveryLocation(null)
      }
    }

    socket.on('orderMessage', handleLocationUpdate)
    socket.on('orderStatus', handleStatusUpdate)

    // Connection status
    socket.on('connect', () => setIsConnected(true))
    socket.on('disconnect', () => setIsConnected(false))

    return () => {
      socket.off('orderMessage', handleLocationUpdate)
      socket.off('orderStatus', handleStatusUpdate)
      socket.off('connect')
      socket.off('disconnect')
    }
  }, [socket, orderId])

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

  // Request location update from delivery person
  const requestLocationUpdate = () => {
    if (!socket || !orderId || isRequestingLocation) return

    setIsRequestingLocation(true)
    
    // Emit request for location update
    socket.emit('requestLocationUpdate', { orderId })
    
    // Reset loading state after 3 seconds
    setTimeout(() => {
      setIsRequestingLocation(false)
    }, 3000)
  }

  // Manual fit to view function
  const fitToView = () => {
    setShouldFitBounds(true)
    // Reset after a short delay to prevent auto-fitting on future updates
    setTimeout(() => setShouldFitBounds(false), 100)
  }

  return (
    <div className="w-full h-full bg-white rounded-2xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-xl">
            <FiTruck className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{t('Delivery Tracking')}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {isConnected ? t('Connected') : t('Disconnected')}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <div className="text-xs text-gray-500">
              {t('Last update')}: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
          <button
            onClick={fitToView}
            className="p-2 hover:bg-orange-100 rounded-xl transition-colors"
            title={t('Fit to view')}
          >
            <FiMapPin className="w-4 h-4 text-orange-600" />
          </button>
          <button
            onClick={requestLocationUpdate}
            disabled={isRequestingLocation || !isConnected}
            className="p-2 hover:bg-orange-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('Request location update')}
          >
            {isRequestingLocation ? (
              <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FiTarget className="w-4 h-4 text-orange-600" />
            )}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="p-2 hover:bg-orange-100 rounded-xl transition-colors"
            title={t('Refresh page')}
          >
            <FiRefreshCw className="w-4 h-4 text-orange-600" />
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="relative h-96">
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
            deliveryLocation={deliveryLocation}
            customerLocation={customerLocation}
            restaurantLocation={restaurantLocation}
            route={route}
            shouldFitBounds={shouldFitBounds}
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
                  <div className="text-sm text-gray-600 mt-1">{customerLocation.address || t('Your location')}</div>
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

          {/* Delivery person location marker */}
          {deliveryLocation && (
            <Marker
              position={[deliveryLocation.latitude, deliveryLocation.longitude]}
              icon={deliveryIcon}
            >
              <Popup>
                <div className="text-center">
                  <div className="font-medium text-gray-900">{t('Delivery Person')}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {deliveryPerson?.firstName ? `${deliveryPerson.firstName} ${deliveryPerson.lastName}` : t('On the way')}
                  </div>
                  {deliveryLocation.timestamp && (
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(deliveryLocation.timestamp).toLocaleTimeString()}
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
              weight={4}
              opacity={0.8}
            />
          )}
        </MapContainer>

        {/* Loading overlay */}
        {isLoadingRoute && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-600 bg-white px-4 py-2 rounded-xl shadow-lg">
              <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              {t('Calculating route...')}
            </div>
          </div>
        )}
      </div>

      {/* Status and Info */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-2 gap-4">
          {/* Delivery Status */}
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-xl">
              <FiClock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">{t('Status')}</div>
              <div className="text-sm text-gray-600">
                {deliveryLocation ? t('In Transit') : t('Waiting for pickup')}
              </div>
            </div>
          </div>

          {/* Distance/Time */}
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-xl">
              <FiNavigation className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {route ? getDistance() : '-- km'}
              </div>
              <div className="text-sm text-gray-600">
                {route ? getEstimatedTime() : '-- min'}
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Person Info */}
        {deliveryPerson && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-white rounded-xl border border-gray-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <FiTruck className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {deliveryPerson.firstName} {deliveryPerson.lastName}
                </div>
                <div className="text-sm text-gray-600">
                  {deliveryPerson.phone || t('Delivery person')}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Location Request Status */}
        {isRequestingLocation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-blue-900 text-sm">{t('Requesting location update...')}</div>
                <div className="text-xs text-blue-600">{t('Asking delivery person to share their current location')}</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
