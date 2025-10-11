import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMapPin, FiSearch, FiX, FiCheck, FiNavigation } from 'react-icons/fi'
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
const createCustomIcon = (color = '#ef4444') => L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    background-color: ${color};
    width: 20px;
    height: 20px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 20]
})

const deliveryIcon = createCustomIcon('#10b981')
const customerIcon = createCustomIcon('#ef4444')

// Map click handler component
function MapClickHandler({ onLocationSelect, selectedLocation }) {
  const map = useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng
      onLocationSelect({ latitude: lat, longitude: lng })
    }
  })

  return null
}

// Geocoding service using Nominatim
const geocodeAddress = async (address) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5&countrycodes=lk`
    )
    const data = await response.json()
    return data.map(result => ({
      display_name: result.display_name,
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      place_id: result.place_id
    }))
  } catch (error) {
    console.error('Geocoding error:', error)
    return []
  }
}

const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    )
    const data = await response.json()
    return data.display_name || 'Unknown location'
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return 'Unknown location'
  }
}

export default function MapLocationSelector({ 
  onLocationSelect, 
  initialLocation = null, 
  showRoute = false, 
  deliveryLocation = null,
  onClose = null 
}) {
  const { t } = useI18n()
  const { notify } = useToast()
  const [selectedLocation, setSelectedLocation] = useState(initialLocation)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [address, setAddress] = useState('')
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)
  const mapRef = useRef(null)

  // Default center (Colombo, Sri Lanka)
  const defaultCenter = [6.9271, 79.8612]
  const center = selectedLocation 
    ? [selectedLocation.latitude, selectedLocation.longitude] 
    : defaultCenter

  // Handle location selection
  const handleLocationSelect = async (location) => {
    setSelectedLocation(location)
    setIsLoadingAddress(true)
    
    try {
      const address = await reverseGeocode(location.latitude, location.longitude)
      setAddress(address)
    } catch (error) {
      console.error('Error getting address:', error)
      setAddress('Location selected')
    } finally {
      setIsLoadingAddress(false)
    }
  }

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    try {
      const results = await geocodeAddress(searchQuery)
      setSearchResults(results)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Handle search result selection
  const handleSearchResultSelect = (result) => {
    const location = { latitude: result.lat, longitude: result.lon }
    handleLocationSelect(location)
    setSearchQuery(result.display_name)
    setSearchResults([])
  }

  // Confirm location selection
  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation, address)
    }
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

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
        handleLocationSelect(location)
      },
      (error) => {
        console.error('Geolocation error:', error)
        notify({
          type: 'error',
          title: t('Location Access Failed'),
          message: t('Unable to get your location. Please select manually.')
        })
      }
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-xl">
              <FiMapPin className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t('Select Location')}</h2>
              <p className="text-sm text-gray-600">{t('Click on the map or search for an address')}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <FiX className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={t('Search for an address...')}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:border-orange-300 focus:ring-2 focus:ring-orange-200 outline-none"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-4 py-3 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiSearch className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={getCurrentLocation}
              className="px-4 py-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-colors"
              title={t('Use current location')}
            >
              <FiNavigation className="w-4 h-4" />
            </button>
          </div>

          {/* Search Results */}
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg max-h-40 overflow-y-auto"
              >
                {searchResults.map((result, index) => (
                  <button
                    key={result.place_id}
                    onClick={() => handleSearchResultSelect(result)}
                    className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {result.display_name}
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={center}
            zoom={13}
            className="w-full h-full"
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapClickHandler 
              onLocationSelect={handleLocationSelect}
              selectedLocation={selectedLocation}
            />
            
            {/* Selected location marker */}
            {selectedLocation && (
              <Marker
                position={[selectedLocation.latitude, selectedLocation.longitude]}
                icon={customerIcon}
              >
                <Popup>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{t('Selected Location')}</div>
                    <div className="text-sm text-gray-600 mt-1">{address || t('Loading address...')}</div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Delivery location marker */}
            {showRoute && deliveryLocation && (
              <Marker
                position={[deliveryLocation.latitude, deliveryLocation.longitude]}
                icon={deliveryIcon}
              >
                <Popup>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{t('Delivery Location')}</div>
                    <div className="text-sm text-gray-600 mt-1">{deliveryLocation.address || 'Delivery point'}</div>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Loading overlay */}
          {isLoadingAddress && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <div className="flex items-center gap-2 text-gray-600">
                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                {t('Getting address...')}
              </div>
            </div>
          )}
        </div>

        {/* Selected location info */}
        {selectedLocation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border-t border-gray-200 bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{t('Selected Location')}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {isLoadingAddress ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      {t('Loading address...')}
                    </div>
                  ) : (
                    address || `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`
                  )}
                </div>
              </div>
              <button
                onClick={handleConfirm}
                className="ml-4 px-6 py-3 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                <FiCheck className="w-4 h-4" />
                {t('Confirm Location')}
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
