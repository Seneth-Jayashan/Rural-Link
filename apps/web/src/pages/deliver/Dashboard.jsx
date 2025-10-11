import { useEffect, useState } from 'react'
import { get, post, getImageUrl } from '../../shared/api.js'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMapPin, FiTruck, FiUser, FiPhone, FiCheckCircle, FiMap, FiX, FiPackage, FiClock, FiNavigation } from 'react-icons/fi'
import { useToast } from '../../shared/ui/Toast.jsx'
import OrderChat from '../common/OrderChat.jsx'
import LocationTracker from './LocationTracker.jsx'
import DeliveryMap from '../../shared/ui/DeliveryMap.jsx'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'
import { formatLKR } from '../../shared/currency.js'
import { joinDeliveryRoom, onOrderAccepted } from '../../shared/socket.js'

export default function DeliveryDashboard(){
  const { t } = useI18n()
  const [available, setAvailable] = useState([])
  const [assigned, setAssigned] = useState([])
  const [showMap, setShowMap] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [activeTab, setActiveTab] = useState('available')
  const { notify } = useToast()
  const [dismissedIds, setDismissedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('driver_dismissed_orders') || '[]') } catch { return [] }
  })

  async function load(){
    try{
      const [a, mine] = await Promise.all([
        get('/api/orders/available'),
        get('/api/orders/deliver')
      ])
      const sortDesc = (arr=[]) => [...arr].sort((x,y)=> new Date(y.createdAt||0) - new Date(x.createdAt||0))
      const dismissedSet = new Set(dismissedIds)
      setAvailable((sortDesc(a.data||[])).filter(o => !dismissedSet.has(o._id)))
      setAssigned(sortDesc(mine.data||[]))
    }catch{}
  }
  useEffect(()=>{ 
    load()
    // Join delivery room for real-time updates
    joinDeliveryRoom()
    
    // Listen for order acceptance events
    const unsubscribe = onOrderAccepted((data) => {
      // Remove the accepted order from available list
      setAvailable(prev => prev.filter(order => order._id !== data.orderId))
      // Show notification to other drivers
      notify({ 
        type: 'info', 
        title: 'Order Accepted', 
        message: `Order ${data.orderNumber} was accepted by another driver` 
      })
    })
    
    return () => {
      unsubscribe()
    }
  },[])

  async function accept(order){
    try {
      await post(`/api/orders/${order._id}/accept`)
      notify({ type:'success', title:'Accepted', message:`Order ${order.orderNumber}` })
      // Remove from available list immediately
      setAvailable(prev => prev.filter(o => o._id !== order._id))
      // Add to assigned list
      const accepted = { ...order, deliveryPerson: 'current_user', status: 'picked_up' }
      setAssigned(prev => [accepted, ...prev])
      // Directly open My Deliveries for this order and show map
      setActiveTab('assigned')
      setSelectedOrder(accepted)
      setShowMap(true)
    } catch (error) {
      notify({ type:'error', title:'Error', message:'Failed to accept order' })
    }
  }
  async function decline(order){
    // Client-side only: hide for this driver by persisting in localStorage
    setAvailable(prev => prev.filter(o => o._id !== order._id))
    setDismissedIds(prev => {
      const next = Array.from(new Set([...(prev||[]), order._id]))
      try { localStorage.setItem('driver_dismissed_orders', JSON.stringify(next)) } catch {}
      return next
    })
    notify({ type:'success', title:'Hidden', message:`Order ${order.orderNumber} removed from your list` })
  }
  async function startDelivery(order){
    await post(`/api/orders/${order._id}/delivery-status`, { status:'in_transit' })
    notify({ type:'success', title:'In transit', message:`Order ${order.orderNumber}` })
    load()
  }
  async function completeDelivery(order){
    await post(`/api/orders/${order._id}/delivery-status`, { status:'delivered' })
    notify({ type:'success', title:'Delivered', message:`Order ${order.orderNumber}` })
    load()
  }

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      picked_up: 'bg-blue-100 text-blue-800 border-blue-200',
      in_transit: 'bg-orange-100 text-orange-800 border-orange-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    }
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusIcon = (status) => {
    const statusIcons = {
      pending: <FiClock className="w-4 h-4" />,
      picked_up: <FiPackage className="w-4 h-4" />,
      in_transit: <FiTruck className="w-4 h-4" />,
      delivered: <FiCheckCircle className="w-4 h-4" />,
    }
    return statusIcons[status] || <FiPackage className="w-4 h-4" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 p-4 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white rounded-2xl shadow-lg border border-orange-100">
            <FiTruck className="w-6 h-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Delivery Dashboard</h1>
            <p className="text-gray-600 text-sm">Manage your delivery orders</p>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-1 mb-6 max-w-2xl mx-auto"
      >
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-all ${
              activeTab === 'available'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-orange-50/50'
            }`}
          >
            Available ({available.length})
          </button>
          <button
            onClick={() => setActiveTab('assigned')}
            className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-all ${
              activeTab === 'assigned'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-orange-50/50'
            }`}
          >
            My Deliveries ({assigned.length})
          </button>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-2xl mx-auto">
        {/* Available Orders */}
        <AnimatePresence mode="wait">
          {activeTab === 'available' && (
            <motion.div
              key="available"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {available.map((o, index) => (
                <motion.div
                  key={o._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-4"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <h3 className="font-semibold text-gray-900">Order #{o.orderNumber}</h3>
                      </div>
                      <p className="text-sm text-gray-600">{o.items?.length || 0} items • {formatLKR(o.total || 0)}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {o.deliveryAddress?.city || 'Location'}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <FiMapPin className="w-4 h-4" />
                      <span>{o.deliveryAddress?.distance || '2.5'} km</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiClock className="w-4 h-4" />
                      <span>{o.estimatedDeliveryTime || '15-20'} min</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => accept(o)}
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl py-3 font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg hover:shadow-xl"
                    >
                      <FiTruck className="w-4 h-4" />
                      Accept Order
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => decline(o)}
                      className="px-4 py-3 bg-gradient-to-r from-orange-50/50 to-amber-50/50 text-gray-700 rounded-2xl font-medium border border-orange-200 hover:bg-orange-100 transition-all"
                    >
                      Decline
                    </motion.button>
                  </div>
                </motion.div>
              ))}
              
              {available.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-8 text-center"
                >
                  <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FiPackage className="w-8 h-8 text-orange-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Available Orders</h3>
                  <p className="text-gray-500 text-sm">New delivery requests will appear here</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Assigned Orders */}
          {activeTab === 'assigned' && (
            <motion.div
              key="assigned"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {assigned.map((o, index) => (
                <motion.div
                  key={o._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-4"
                >
                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`p-2 rounded-xl ${getStatusColor(o.status)}`}>
                          {getStatusIcon(o.status)}
                        </div>
                        <h3 className="font-semibold text-gray-900">Order #{o.orderNumber}</h3>
                      </div>
                      <p className="text-sm text-gray-600 capitalize">{o.status.replace('_', ' ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatLKR(o.total || 0)}</p>
                      <p className="text-xs text-gray-500">{o.items?.length || 0} items</p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <div className="p-1.5 bg-orange-100 rounded-lg">
                        <FiUser className="w-3.5 h-3.5 text-orange-600" />
                      </div>
                      <span>{o.customer?.firstName} {o.customer?.lastName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <div className="p-1.5 bg-orange-100 rounded-lg">
                        <FiPhone className="w-3.5 h-3.5 text-orange-600" />
                      </div>
                      <span>{o.customer?.phone || t('N/A')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <div className="p-1.5 bg-orange-100 rounded-lg">
                        <FiMapPin className="w-3.5 h-3.5 text-orange-600" />
                      </div>
                      <span className="flex-1">{o.deliveryAddress?.street}, {o.deliveryAddress?.city}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-green-100 rounded-lg">
                        <FiPackage className="w-3.5 h-3.5 text-green-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">Items</p>
                    </div>
                    <div className="space-y-2">
                      {o.items?.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-gradient-to-r from-orange-50/50 to-amber-50/50 rounded-2xl p-3 border border-orange-200">
                          {it.product?.images?.[0]?.url ? (
                            <img
                              src={getImageUrl(it.product.images[0].url)}
                              alt={it.product.name}
                              className="w-10 h-10 object-cover rounded-xl border border-orange-200"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <div 
                            className="w-10 h-10 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl border border-orange-200"
                            style={{ display: it.product?.images?.[0]?.url ? 'none' : 'block' }}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{it.product?.name || 'Item'}</p>
                            <p className="text-xs text-gray-600">Qty: {it.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">{formatLKR(it.total ?? (it.price * it.quantity))}</p>
                            <p className="text-xs text-gray-500">{formatLKR(it.price)} each</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {/* Map Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedOrder(o)
                        setShowMap(true)
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl py-3 font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      <FiNavigation className="w-4 h-4" />
                      View Delivery Route
                    </motion.button>

                    {/* Status Actions */}
                    <div className="flex gap-2">
                      {o.status === 'picked_up' && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => startDelivery(o)}
                          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl py-3 font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg hover:shadow-xl"
                        >
                          <FiTruck className="w-4 h-4" />
                          Start Delivery
                        </motion.button>
                      )}
                      {o.status === 'in_transit' && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => completeDelivery(o)}
                          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl py-3 font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
                        >
                          <FiCheckCircle className="w-4 h-4" />
                          Mark Delivered
                        </motion.button>
                      )}
                    </div>

                    {/* Location Tracker & Chat */}
                    {['picked_up','in_transit'].includes(o.status) && o.status !== 'delivered' && (
                      <div className="space-y-4 pt-4 border-t border-orange-200">
                        <LocationTracker 
                          orderId={o._id} 
                          onLocationUpdate={(location) => {
                            console.log('Location updated:', location)
                          }}
                        />
                        
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-purple-100 rounded-lg">
                              <FiUser className="w-3.5 h-3.5 text-purple-600" />
                            </div>
                            <p className="font-medium text-gray-900">Chat with Customer</p>
                          </div>
                          <OrderChat orderId={o._id} meId={o.deliveryPerson} />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {assigned.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-8 text-center"
                >
                  <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FiTruck className="w-8 h-8 text-orange-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Deliveries</h3>
                  <p className="text-gray-500 text-sm">Accept delivery requests to get started</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delivery Map Modal */}
      <AnimatePresence>
        {showMap && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden border border-orange-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-orange-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <FiMap className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Delivery Route</h2>
                    <p className="text-sm text-gray-600">Order #{selectedOrder.orderNumber}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMap(false)}
                  className="p-2 bg-orange-100 rounded-xl hover:bg-orange-200 transition-colors"
                >
                  <FiX className="w-5 h-5 text-orange-600" />
                </motion.button>
              </div>

              {/* Map Content */}
              <div className="flex-1 p-4">
                <DeliveryMap
                  orderId={selectedOrder._id}
                  customerLocation={{
                    latitude: selectedOrder.deliveryAddress?.coordinates?.latitude || 6.9271,
                    longitude: selectedOrder.deliveryAddress?.coordinates?.longitude || 79.8612,
                    address: selectedOrder.deliveryAddress?.fullAddress || `${selectedOrder.deliveryAddress?.street}, ${selectedOrder.deliveryAddress?.city}`
                  }}
                  shopLocation={(() => {
                    const sl = selectedOrder.shopLocation
                    let lat = sl?.coordinates?.latitude ?? sl?.latitude
                    let lng = sl?.coordinates?.longitude ?? sl?.longitude
                    let businessName = sl?.businessName
                    let fullAddress = sl?.fullAddress

                    if (lat == null || lng == null) {
                      const msl = selectedOrder.merchant?.shopLocation
                      lat = msl?.coordinates?.latitude ?? msl?.latitude
                      lng = msl?.coordinates?.longitude ?? msl?.longitude
                      businessName = businessName || selectedOrder.merchant?.businessName
                      fullAddress = fullAddress || msl?.fullAddress || ''
                    }

                    if (lat == null || lng == null) return null
                    return {
                      latitude: lat,
                      longitude: lng,
                      businessName,
                      fullAddress
                    }
                  })()}
                  restaurantLocation={(() => {
                    const msl = selectedOrder.merchant?.shopLocation
                    const lat = msl?.coordinates?.latitude ?? msl?.latitude ?? 6.9147
                    const lng = msl?.coordinates?.longitude ?? msl?.longitude ?? 79.8730
                    return {
                      latitude: lat,
                      longitude: lng,
                      name: selectedOrder.merchant?.businessName || 'Restaurant'
                    }
                  })()}
                  routeTo={selectedOrder.status === 'in_transit' ? 'customer' : 'shop'}
                  onLocationUpdate={(location) => {
                    console.log('Location updated:', location)
                  }}
                  isTracking={['picked_up', 'in_transit'].includes(selectedOrder.status)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}