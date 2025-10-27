import { useEffect, useState, useRef } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { get, post, getImageUrl } from '../../shared/api.js'
import { Spinner } from '../../shared/ui/Spinner.jsx'
import OrderChat from './OrderChat.jsx'
import DeliveryTrackingMap from '../../shared/ui/DeliveryTrackingMap.jsx'
import { generateGhostText, generateSimpleGhostText, generateNextWord } from '../../shared/huggingFaceApi.js'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPackage, FiTruck, FiCheck, FiStar, FiMessageSquare, FiClock, FiArrowLeft, FiMap } from 'react-icons/fi'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'
import { formatLKR } from '../../shared/currency.js'

export default function OrderTracking(){
  const { orderId } = useParams()
  const location = useLocation()
  const { t } = useI18n()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewed, setReviewed] = useState({}) // { product:<bool>, delivery:<bool> }
  const [productReviews, setProductReviews] = useState({}) // productId -> { rating, comment }
  const [driverReview, setDriverReview] = useState({ rating: 0, comment: '' })
  const [ghostText, setGhostText] = useState({}) // productId -> ghost text
  const [generatingGhost, setGeneratingGhost] = useState({}) // productId -> loading state
  const [typingTimeout, setTypingTimeout] = useState({}) // productId -> timeout ID
  const [showTrackingMap, setShowTrackingMap] = useState(false)

  useEffect(()=>{
    const path = orderId === 'last' ? '/api/orders/last' : `/api/orders/${orderId}`
    get(path)
      .then(d=> setOrder(d.data))
      .catch(e=> setError(e.message))
  },[orderId])

  // Scroll to reviews if hash provided
  const reviewsRef = useRef(null)
  useEffect(()=>{
    if (order && location?.hash === '#reviews' && reviewsRef.current) {
      reviewsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [order, location?.hash])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(typingTimeout).forEach(timeoutId => {
        if (timeoutId) clearTimeout(timeoutId)
      })
    }
  }, [typingTimeout])

  const generateProductGhostText = async (productId, productName) => {
    setGeneratingGhost(prev => ({ ...prev, [productId]: true }))
    try {
      const aiText = await generateGhostText(productName, 'product')
      const fallbackText = generateSimpleGhostText('product')
      setGhostText(prev => ({ ...prev, [productId]: aiText || fallbackText }))
    } catch (error) {
      console.error('Error generating ghost text:', error)
      setGhostText(prev => ({ ...prev, [productId]: generateSimpleGhostText('product') }))
    } finally {
      setGeneratingGhost(prev => ({ ...prev, [productId]: false }))
    }
  }

  const generateDeliveryGhostText = async () => {
    setGeneratingGhost(prev => ({ ...prev, 'delivery': true }))
    try {
      const aiText = await generateGhostText('delivery service', 'delivery')
      const fallbackText = generateSimpleGhostText('delivery')
      setGhostText(prev => ({ ...prev, 'delivery': aiText || fallbackText }))
    } catch (error) {
      console.error('Error generating ghost text:', error)
      setGhostText(prev => ({ ...prev, 'delivery': generateSimpleGhostText('delivery') }))
    } finally {
      setGeneratingGhost(prev => ({ ...prev, 'delivery': false }))
    }
  }

  // Generate word suggestions based on current input
  const generateWordSuggestion = async (key, currentText, type) => {
    setGeneratingGhost(prev => ({ ...prev, [key]: true }))
    try {
      const suggestion = await generateNextWord(currentText, type)
      if (suggestion) {
        setGhostText(prev => ({ ...prev, [key]: suggestion }))
      }
    } catch (error) {
      console.error('Error generating word suggestion:', error)
    } finally {
      setGeneratingGhost(prev => ({ ...prev, [key]: false }))
    }
  }

  // Accept word suggestion
  const acceptWordSuggestion = (key, isProduct = true) => {
    if (ghostText[key]) {
      if (isProduct) {
        setProductReviews(prev => ({
          ...prev, 
          [key]: { 
            ...(prev[key]||{}), 
            comment: (prev[key]?.comment || '') + ghostText[key] + ' '
          }
        }))
      } else {
        setDriverReview(prev => ({
          ...prev, 
          comment: prev.comment + ghostText[key] + ' '
        }))
      }
      setGhostText(prev => ({ ...prev, [key]: null }))
    }
  }

  // Handle key press for accepting suggestions
  const handleKeyPress = (e, key, isProduct = true) => {
    if (e.key === 'Tab' && ghostText[key]) {
      e.preventDefault()
      acceptWordSuggestion(key, isProduct)
    }
  }

  // Handle touch events for mobile swipe gestures
  const handleTouchStart = (e, key, isProduct = true) => {
    const touch = e.touches[0]
    e.target.startX = touch.clientX
    e.target.startY = touch.clientY
  }

  const handleTouchEnd = (e, key, isProduct = true) => {
    if (!e.target.startX || !ghostText[key]) return
    
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - e.target.startX
    const deltaY = touch.clientY - e.target.startY
    
    // Swipe right gesture (deltaX > 50 and horizontal movement > vertical)
    if (deltaX > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault()
      acceptWordSuggestion(key, isProduct)
    }
  }

  // Auto-generate word suggestions as user types
  const handleProductTextChange = (productId, productName, value) => {
    // Update the text immediately
    setProductReviews(prev => ({...prev, [productId]: { ...(prev[productId]||{}), comment: value }}))
    
    // Clear existing timeout
    if (typingTimeout[productId]) {
      clearTimeout(typingTimeout[productId])
    }
    
    // Generate word suggestions for the current input
    if (value.length >= 2) {
      const timeoutId = setTimeout(() => {
        generateWordSuggestion(productId, value, 'product')
      }, 500) // Faster response for word suggestions
      
      setTypingTimeout(prev => ({ ...prev, [productId]: timeoutId }))
    } else {
      // Clear ghost text if user hasn't typed enough
      setGhostText(prev => ({ ...prev, [productId]: null }))
    }
  }

  const handleDeliveryTextChange = (value) => {
    // Update the text immediately
    setDriverReview(prev => ({...prev, comment: value}))
    
    // Clear existing timeout
    if (typingTimeout['delivery']) {
      clearTimeout(typingTimeout['delivery'])
    }
    
    // Generate word suggestions for the current input
    if (value.length >= 2) {
      const timeoutId = setTimeout(() => {
        generateWordSuggestion('delivery', value, 'delivery')
      }, 500) // Faster response for word suggestions
      
      setTypingTimeout(prev => ({ ...prev, 'delivery': timeoutId }))
    } else {
      // Clear ghost text if user hasn't typed enough
      setGhostText(prev => ({ ...prev, 'delivery': null }))
    }
  }

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      preparing: 'bg-orange-100 text-orange-800 border-orange-200',
      ready: 'bg-purple-100 text-purple-800 border-purple-200',
      picked_up: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      in_transit: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      delivered: 'bg-green-100 text-green-800 border-green-200'
    }
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 p-4 pb-24 mb-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <button 
            onClick={() => window.history.back()}
            className="p-2 bg-white rounded-2xl shadow-lg border border-orange-100 hover:shadow-xl transition-all"
          >
            <FiArrowLeft className="w-5 h-5 text-orange-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('Order Tracking')}</h1>
            <p className="text-gray-600 text-sm mt-1">{t('Track your order in real-time')}</p>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto mb-6 bg-red-50 border border-red-200 rounded-2xl p-6 text-center"
        >
          <div className="text-red-500 text-lg mb-2">⚠️</div>
          <div className="text-red-600 font-medium">{error}</div>
        </motion.div>
      )}

      {!order && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-2xl mx-auto text-center py-12"
        >
          <Spinner size={48} className="text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your order details...</p>
        </motion.div>
      )}

      <AnimatePresence>
        {order && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Order Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{t('Order')} #{order.orderNumber}</h2>
                  <p className="text-gray-600 text-sm">{t('Placed on')} {new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status.replace('_', ' ').toUpperCase()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600 mb-1">{t('Total Amount')}</div>
                  <div className="text-lg font-bold text-orange-600">{formatLKR(order.total)}</div>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">{t('Items')}</div>
                  <div className="font-medium text-gray-900">{order.items?.length || 0} items</div>
                </div>
              </div>
            </motion.div>

            {/* Items Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <FiPackage className="w-4 h-4 text-orange-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{t('Order Items')}</h2>
              </div>

              <div className="space-y-3">
                {order.items?.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-2xl border border-gray-200">
                    <div className="flex items-center gap-3">
                      {it.product?.images?.[0]?.url ? (
                        <img
                          src={getImageUrl(it.product.images[0].url)}
                          alt={it.product.name}
                          className="w-12 h-12 object-cover rounded-xl border"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl border border-orange-200"
                        style={{ display: it.product?.images?.[0]?.url ? 'none' : 'block' }}
                      />
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{it.product?.name || 'Item'}</div>
                        <div className="text-xs text-gray-500">Qty: {it.quantity}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatLKR(it.total ?? (it.price * it.quantity))}</div>
                      <div className="text-xs text-gray-500">{formatLKR(it.price)} each</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Progress Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <FiClock className="w-4 h-4 text-orange-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{t('Order Progress')}</h2>
              </div>

              {/* Progress Steps */}
              {(()=>{
                const steps = [
                  { key: 'pending', label: 'Order Placed', icon: '📝' },
                  { key: 'confirmed', label: 'Confirmed', icon: '✅' },
                  { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
                  { key: 'ready', label: 'Ready', icon: '📦' },
                  { key: 'picked_up', label: 'Picked Up', icon: '🚗' },
                  { key: 'in_transit', label: 'In Transit', icon: '🏍️' },
                  { key: 'delivered', label: 'Delivered', icon: '🎉' }
                ]
                const currentIdx = Math.max(0, steps.findIndex(s => s.key === order.status))
                
                return (
                  <div className="relative">
                    {/* Progress Line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200">
                      <div 
                        className="bg-orange-500 transition-all duration-500"
                        style={{ height: `${(currentIdx / (steps.length - 1)) * 100}%` }}
                      />
                    </div>

                    {/* Steps */}
                    <div className="space-y-6">
                      {steps.map((step, idx) => {
                        const isCompleted = idx <= currentIdx
                        const isCurrent = idx === currentIdx
                        
                        return (
                          <div key={step.key} className="flex items-start gap-4 relative">
                            {/* Step Icon */}
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold z-10 ${
                              isCompleted 
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' 
                                : 'bg-white text-gray-400 border border-gray-300'
                            }`}>
                              {isCompleted ? <FiCheck className="w-4 h-4" /> : step.icon}
                            </div>
                            
                            {/* Step Content */}
                            <div className="flex-1 pt-1">
                              <div className={`font-medium ${
                                isCompleted ? 'text-gray-900' : 'text-gray-500'
                              }`}>
                                {step.label}
                              </div>
                              {isCurrent && order.trackingHistory?.find(h => h.status === step.key) && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {new Date(order.trackingHistory.find(h => h.status === step.key).timestamp).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </motion.div>

            {/* Courier Details */}
            {order.deliveryPerson?._id && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-orange-100 rounded-xl">
                    <FiTruck className="w-4 h-4 text-orange-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">{t('Courier Details')}</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-200">
                    <div className="text-gray-600 mb-1">{t('Driver')}</div>
                    <div className="font-medium text-gray-900">{order.deliveryPerson.firstName} {order.deliveryPerson.lastName}</div>
                  </div>
                  {order.deliveryPerson.vehicleNumber && (
                    <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-200">
                      <div className="text-gray-600 mb-1">{t('Vehicle Number')}</div>
                      <div className="font-medium text-gray-900">{order.deliveryPerson.vehicleNumber}</div>
                    </div>
                  )}
                  {order.deliveryPerson.vehicleType && (
                    <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-200">
                      <div className="text-gray-600 mb-1">{t('Vehicle Type')}</div>
                      <div className="font-medium text-gray-900 capitalize">{
                        (
                          order.deliveryPerson.vehicleType === 'motor_bike' ? t('Motor Bike') :
                          order.deliveryPerson.vehicleType === 'three_wheel' ? t('Three Wheel') :
                          t('Car')
                        )
                      }</div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Delivery Tracking Map */}
            {order.deliveryAddress?.coordinates && ['picked_up','in_transit'].includes(order.status) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-orange-100 rounded-xl">
                      <FiMap className="w-4 h-4 text-orange-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">{t('Live Delivery Tracking')}</h2>
                  </div>
                  <button
                    onClick={() => setShowTrackingMap(!showTrackingMap)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors flex items-center gap-2"
                  >
                    <FiMap className="w-4 h-4" />
                    {showTrackingMap ? t('Hide Map') : t('Show Map')}
                  </button>
                </div>
                
                {showTrackingMap && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4"
                  >
                    <DeliveryTrackingMap
                      orderId={order._id}
                      customerLocation={{
                        latitude: order.deliveryAddress.coordinates.latitude,
                        longitude: order.deliveryAddress.coordinates.longitude,
                        address: order.deliveryAddress.fullAddress || `${order.deliveryAddress.street}, ${order.deliveryAddress.city}`
                      }}
                      shopLocation={order.shopLocation ? {
                        latitude: order.shopLocation.coordinates.latitude,
                        longitude: order.shopLocation.coordinates.longitude,
                        businessName: order.shopLocation.businessName,
                        fullAddress: order.shopLocation.fullAddress
                      } : null}
                      restaurantLocation={{
                        latitude: order.merchant?.location?.latitude || 6.9271,
                        longitude: order.merchant?.location?.longitude || 79.8612,
                        name: order.merchant?.businessName || 'Restaurant'
                      }}
                      deliveryPerson={order.deliveryPerson}
                      status={order.status}
                    />
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Chat Section */}
            {order.deliveryPerson?._id && ['picked_up','in_transit'].includes(order.status) && order.status !== 'delivered' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-orange-100 rounded-xl">
                    <FiMessageSquare className="w-4 h-4 text-orange-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">{t('Chat with Courier')}</h2>
                </div>
                <OrderChat orderId={order._id} meId={order.customer?._id} />
              </motion.div>
            )}

            {/* Reviews Section */}
            {order.status === 'delivered' && (
              <motion.div
                ref={reviewsRef}
                id="reviews"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-6"
              >
                {/* Product Reviews */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-orange-100 rounded-xl">
                      <FiStar className="w-4 h-4 text-orange-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">{t('Rate Your Products')}</h2>
                  </div>

                  <div className="space-y-4">
                    {order.items?.map((it, idx)=>{
                      const pid = it.product?._id
                      return (
                        <div key={idx} className="border border-orange-200 rounded-2xl p-4 bg-white/50">
                          <div className="flex items-center gap-3 mb-3">
                            {it.product?.images?.[0]?.url ? (
                              <img
                                src={getImageUrl(it.product.images[0].url)}
                                alt={it.product.name}
                                className="w-12 h-12 object-cover rounded-xl border"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                }}
                              />
                            ) : null}
                            <div 
                              className="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl border border-orange-200"
                              style={{ display: it.product?.images?.[0]?.url ? 'none' : 'block' }}
                            />
                            <div className="font-medium text-gray-900">{it.product?.name || 'Item'}</div>
                          </div>

                          {!reviewed[`product:${pid}`] ? (
                            <div className="space-y-3">
                              {/* Rating Stars */}
                              <div className="flex items-center gap-1">
                              <span className="text-sm text-gray-600 mr-2">{t('Rating:')}</span>
                                {[1,2,3,4,5].map(st=> (
                                  <motion.button
                                    key={st}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    type="button"
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                                      (productReviews[pid]?.rating||0) >= st 
                                        ? 'bg-orange-500 text-white shadow-md' 
                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                    }`}
                                    onClick={()=> setProductReviews(prev=> ({...prev, [pid]: { ...(prev[pid]||{}), rating: st }}))}
                                  >
                                    {st}
                                  </motion.button>
                                ))}
                              </div>

                              {/* Comment with AI Assistant */}
                              <div className="relative">
                                <div className="relative">
                                  <textarea 
                                    className="w-full border border-gray-200 rounded-2xl p-3 text-sm bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none resize-none"
                                    rows={3}
                                    placeholder={ghostText[pid] && !(productReviews[pid]?.comment || '').length ? '' : t('Share your experience with this product... (optional)')}
                                    value={productReviews[pid]?.comment||''}
                                    onChange={(e)=> handleProductTextChange(pid, it.product?.name || 'product', e.target.value)}
                                    onKeyDown={(e)=> handleKeyPress(e, pid, true)}
                                    onTouchStart={(e)=> handleTouchStart(e, pid, true)}
                                    onTouchEnd={(e)=> handleTouchEnd(e, pid, true)}
                                  />
                                  
                                  {/* Ghost Text Overlay (show even when textarea is empty so "Get AI Suggestion" displays) */}
                                  {ghostText[pid] && (
                                    <div className="absolute inset-0 p-3 text-sm pointer-events-none">
                                      <span className="text-transparent">{productReviews[pid]?.comment || ''}</span>
                                      <span 
                                        className="text-gray-400 italic cursor-pointer hover:text-orange-500 hover:bg-orange-50 px-1 rounded transition-colors"
                                        onClick={() => acceptWordSuggestion(pid, true)}
                                        style={{ pointerEvents: 'auto' }}
                                      >
                                        {ghostText[pid]}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Ghost actions removed — we keep only Get AI Suggestion and Use Full Suggestion buttons below for simpler UX */}

                                {/* AI Loading State */}
                                {generatingGhost[pid] && (
                                  <div className="mt-2 p-2 text-sm text-gray-500 italic bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                      🤖 Generating word suggestion...
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* AI Actions */}
                              <div className="flex gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  type="button"
                                  className="px-4 py-2 text-sm bg-white border border-blue-300 text-blue-700 rounded-xl hover:bg-blue-50 disabled:opacity-50 transition-colors flex items-center gap-2"
                                  onClick={() => generateProductGhostText(pid, it.product?.name || 'product')}
                                  disabled={generatingGhost[pid]}
                                  title="Generate an AI suggestion for this comment"
                                  aria-label="Get AI suggestion"
                                >
                                  {generatingGhost[pid] ? (
                                    <>
                                      <div className="w-3 h-3 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
                                      Generating...
                                    </>
                                  ) : (
                                    <>
                                      <span>🤖</span>
                                      <span className="font-medium">{t('Get AI Suggestion')}</span>
                                    </>
                                  )}
                                </motion.button>

                                {ghostText[pid] && (
                                  <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    type="button"
                                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-xl border border-green-700 hover:bg-green-700 transition-colors flex items-center gap-2"
                                    title={ghostText[pid]}
                                    aria-label={`Use full AI suggestion: ${ghostText[pid]}`}
                                    onClick={() => {
                                      setProductReviews(prev=> ({...prev, [pid]: { ...(prev[pid]||{}), comment: ghostText[pid] }}))
                                      setGhostText(prev => ({ ...prev, [pid]: null }))
                                    }}
                                  >
                                    <FiCheck className="w-4 h-4" />
                                    {t('Use Full Suggestion')}
                                  </motion.button>
                                )}
                              </div>

                              {/* Submit Button */}
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                                  productReviews[pid]?.rating > 0
                                    ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg hover:shadow-xl'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                                disabled={submitting || !(productReviews[pid]?.rating>0)}
                                onClick={async ()=>{
                                  try{
                                    setSubmitting(true)
                                    await post('/api/reviews', {
                                      orderId: order._id,
                                      type: 'product',
                                      rating: productReviews[pid]?.rating,
                                      comment: productReviews[pid]?.comment||'',
                                      productId: pid
                                    })
                                    setReviewed(prev=> ({...prev, [`product:${pid}`]: true}))
                                  }catch(e){ setError(e.message||'Failed to submit review') }
                                  finally{ setSubmitting(false) }
                                }}
                              >
                                {submitting ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Submitting...
                                  </div>
                                ) : (
                                  t('Submit Review')
                                )}
                              </motion.button>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                <FiCheck className="w-6 h-6" />
                              </div>
                              <div className="text-green-700 font-medium">{t('Thank you for your review!')}</div>
                              <div className="text-green-600 text-sm">{t('Your feedback helps us improve')}</div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Driver Review */}
                {order.deliveryPerson?._id && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-orange-100 rounded-xl">
                        <FiTruck className="w-4 h-4 text-orange-600" />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">{t('Rate Your Delivery')}</h2>
                    </div>

                    {!reviewed['delivery'] ? (
                      <div className="space-y-4">
                        {/* Driver Rating */}
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-gray-600 mr-2">{t('Driver Rating:')}</span>
                          {[1,2,3,4,5].map(st=> (
                            <motion.button
                              key={st}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              type="button"
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                                (driverReview.rating||0) >= st 
                                  ? 'bg-orange-500 text-white shadow-md' 
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              }`}
                              onClick={()=> setDriverReview(prev=> ({...prev, rating: st}))}
                            >
                              {st}
                            </motion.button>
                          ))}
                        </div>

                        {/* Driver Comment */}
                        <div className="relative">
                          <div className="relative">
                          <textarea 
                              className="w-full border border-gray-200 rounded-2xl p-3 text-sm bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none resize-none"
                              rows={3}
                              placeholder={ghostText['delivery'] && !driverReview.comment ? '' : t('How was your delivery experience? (optional)')}
                                value={driverReview.comment}
                                onChange={(e)=> handleDeliveryTextChange(e.target.value)}
                              onKeyDown={(e)=> handleKeyPress(e, 'delivery', false)}
                              onTouchStart={(e)=> handleTouchStart(e, 'delivery', false)}
                              onTouchEnd={(e)=> handleTouchEnd(e, 'delivery', false)}
                            />
                            
                            {/* Ghost Text Overlay (show even when textarea is empty so "Get AI Suggestion" displays) */}
                            {ghostText['delivery'] && (
                              <div className="absolute inset-0 p-3 text-sm pointer-events-none">
                                <span className="text-transparent">{driverReview.comment || ''}</span>
                                <span 
                                  className="text-gray-400 italic cursor-pointer hover:text-orange-500 hover:bg-orange-50 px-1 rounded transition-colors"
                                  onClick={() => acceptWordSuggestion('delivery', false)}
                                  style={{ pointerEvents: 'auto' }}
                                >
                                  {ghostText['delivery']}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Ghost Text Actions (show when suggestion exists) */}
                          {/* Ghost actions removed — keep only Get AI Suggestion and Use Full Suggestion buttons for delivery section */}

                          {/* AI Loading State */}
                          {generatingGhost['delivery'] && (
                            <div className="mt-2 p-2 text-sm text-gray-500 italic bg-gray-50 rounded-xl border border-gray-200">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                🤖 Generating word suggestion...
                              </div>
                            </div>
                          )}
                        </div>

                        {/* AI Actions */}
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            type="button"
                            className="px-4 py-2 text-sm bg-white border border-blue-300 text-blue-700 rounded-xl hover:bg-blue-50 disabled:opacity-50 transition-colors flex items-center gap-2"
                            onClick={generateDeliveryGhostText}
                            disabled={generatingGhost['delivery']}
                            title="Generate an AI suggestion for this comment"
                            aria-label="Get AI suggestion"
                          >
                            {generatingGhost['delivery'] ? (
                              <>
                                <div className="w-3 h-3 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <span>🤖</span>
                                <span className="font-medium">{t('Get AI Suggestion')}</span>
                              </>
                            )}
                          </motion.button>

                          {ghostText['delivery'] && (
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              type="button" 
                              className="px-4 py-2 text-sm bg-green-600 text-white rounded-xl border border-green-700 hover:bg-green-700 transition-colors flex items-center gap-2"
                              title={ghostText['delivery']}
                              aria-label={`Use full AI suggestion: ${ghostText['delivery']}`}
                              onClick={() => {
                                setDriverReview(prev=> ({...prev, comment: ghostText['delivery']}))
                                setGhostText(prev => ({ ...prev, 'delivery': null }))
                              }}
                            >
                              <FiCheck className="w-4 h-4" />
                              {t('Use Full Suggestion')}
                            </motion.button>
                          )}
                        </div>

                        {/* Submit Button */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full py-3 rounded-xl font-semibold transition-all ${
                            driverReview.rating > 0
                              ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                          disabled={submitting || !(driverReview.rating>0)}
                          onClick={async ()=>{
                            try{
                              setSubmitting(true)
                              await post('/api/reviews', {
                                orderId: order._id,
                                type: 'delivery',
                                rating: driverReview.rating,
                                comment: driverReview.comment||'',
                                deliveryPersonId: order.deliveryPerson._id
                              })
                              setReviewed(prev=> ({...prev, ['delivery']: true}))
                            }catch(e){ setError(e.message||'Failed to submit review') }
                            finally{ setSubmitting(false) }
                          }}
                        >
                          {submitting ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Submitting...
                            </div>
                          ) : (
                              t('Submit Driver Review')
                          )}
                        </motion.button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                          <FiCheck className="w-6 h-6" />
                        </div>
                        <div className="text-green-700 font-medium">{t('Thank you for your driver review!')}</div>
                        <div className="text-green-600 text-sm">{t('Your feedback helps improve our service')}</div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}