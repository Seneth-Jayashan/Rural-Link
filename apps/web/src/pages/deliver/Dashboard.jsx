import { useEffect, useState } from 'react'
import { get, post } from '../../shared/api.js'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMapPin, FiTruck, FiUser, FiPhone, FiCheckCircle, FiMap, FiX } from 'react-icons/fi'
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

  async function load(){
    try{
      const [a, mine] = await Promise.all([
        get('/api/orders/available'),
        get('/api/orders/deliver')
      ])
      setAvailable(a.data||[])
      setAssigned(mine.data||[])
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


  const { notify } = useToast()
  async function accept(order){
    try {
      await post(`/api/orders/${order._id}/accept`)
      notify({ type:'success', title:'Accepted', message:`Order ${order.orderNumber}` })
      // Remove from available list immediately
      setAvailable(prev => prev.filter(o => o._id !== order._id))
      // Add to assigned list
      setAssigned(prev => [...prev, { ...order, deliveryPerson: 'current_user', status: 'picked_up' }])
    } catch (error) {
      notify({ type:'error', title:'Error', message:'Failed to accept order' })
    }
  }
  async function decline(order){
    await post(`/api/orders/${order._id}/decline`, { reason:'Not available' })
    notify({ type:'success', title:'Declined', message:`Order ${order.orderNumber}` })
    load()
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


  return (
    <div className="p-3 pb-16">
      <h1 className="text-lg font-semibold mb-3">{t('Deliveries')}</h1>
      <div className="space-y-2">
        {available.map(o=> (
          <motion.div key={o._id} className="border rounded p-2" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
            <div className="font-medium">Order {o.orderNumber}</div>
            <div className="text-xs text-gray-500 flex items-center gap-2"><FiMapPin /> {t('Items')}: {o.items?.length||0}</div>
            <div className="text-xs text-gray-700 mt-1">Order Total: <span className="font-medium">{formatLKR(o.total || 0)}</span></div>
            <div className="mt-2 flex items-center gap-2">
              <motion.button whileTap={{ scale:0.98 }} className="flex items-center gap-2 bg-green-600 text-white rounded px-3 py-1" onClick={()=>accept(o)}><FiTruck /> {t('Accept')}</motion.button>
              <motion.button whileTap={{ scale:0.98 }} className="flex items-center gap-2 bg-red-600 text-white rounded px-3 py-1" onClick={()=>decline(o)}>
                {t('Decline')}
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mt-6 mb-2">{t('My Deliveries')}</h2>
      <div className="space-y-2">
        {assigned.map(o=> (
          <motion.div key={o._id} className="border rounded p-3" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
            <div className="flex items-center justify-between">
              <div className="font-medium">Order {o.orderNumber}</div>
              <div className="text-xs text-gray-600">{o.status.replace('_',' ')}</div>
            </div>
            <div className="mt-1 text-sm text-gray-700">
              <div className="flex items-center gap-2"><FiUser /> {o.customer?.firstName} {o.customer?.lastName}</div>
              <div className="flex items-center gap-2"><FiPhone /> {o.customer?.phone || t('N/A')}</div>
              <div className="flex items-center gap-2"><FiMapPin /> {o.deliveryAddress?.street}, {o.deliveryAddress?.city}</div>
            </div>
            <div className="mt-1 text-xs text-gray-700">Order Total: <span className="font-medium">{formatLKR(o.total || 0)}</span></div>
            <div className="mt-2 text-xs text-gray-600">Items: {o.items?.map((it,idx)=> `${it.product?.name || 'Item'} x${it.quantity}`).join(', ')}</div>
            
            {/* Map Button */}
            <div className="mt-2">
              <button
                onClick={() => {
                  setSelectedOrder(o)
                  setShowMap(true)
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                <FiMap className="w-4 h-4" />
                {t('View Map')}
              </button>
            </div>
            
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {o.status === 'picked_up' && (
                <motion.button whileTap={{ scale:0.98 }} className="flex items-center gap-2 bg-blue-600 text-white rounded px-3 py-1" onClick={()=>startDelivery(o)}>
                  <FiTruck /> {t('Start Delivery')}
                </motion.button>
              )}
              {o.status === 'in_transit' && (
                <motion.button whileTap={{ scale:0.98 }} className="flex items-center gap-2 bg-green-600 text-white rounded px-3 py-1" onClick={()=>completeDelivery(o)}>
                  <FiCheckCircle /> {t('Mark Delivered')}
                </motion.button>
              )}
            </div>
            {['picked_up','in_transit'].includes(o.status) && o.status !== 'delivered' && (
              <div className="mt-3 space-y-3">
                {/* Location Tracker */}
                <LocationTracker 
                  orderId={o._id} 
                  onLocationUpdate={(location) => {
                    console.log('Location updated:', location)
                  }}
                />
                
                {/* Chat with Customer */}
                <div>
                  <div className="font-medium mb-1">{t('Chat with customer')}</div>
                  <OrderChat orderId={o._id} meId={o.deliveryPerson} />
                </div>
              </div>
            )}
          </motion.div>
        ))}
        {assigned.length === 0 && (
          <div className="text-gray-600 text-sm">{t('No assigned deliveries')}</div>
        )}
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
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <FiMap className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{t('Delivery Map')}</h2>
                    <p className="text-sm text-gray-600">Order #{selectedOrder.orderNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMap(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
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
                  restaurantLocation={{
                    latitude: selectedOrder.merchant?.location?.latitude || 6.9147,
                    longitude: selectedOrder.merchant?.location?.longitude || 79.8730,
                    name: selectedOrder.merchant?.businessName || 'Restaurant'
                  }}
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


