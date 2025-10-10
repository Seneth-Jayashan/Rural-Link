import { useEffect, useState } from 'react'
import { get } from '../../shared/api.js'
import { Spinner } from '../../shared/ui/Spinner.jsx'
import { getSocket, authenticate, onOrderMessage } from '../../shared/socket.js'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPackage, FiTruck, FiCheck, FiMessageSquare, FiClock, FiShoppingBag, FiUser } from 'react-icons/fi'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'
import { formatLKR } from '../../shared/currency.js'

function Timeline({ status, history }){
  const steps = [
    { key: 'pending', label: 'Order Placed', icon: '📝' },
    { key: 'confirmed', label: 'Confirmed', icon: '✅' },
    { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
    { key: 'ready', label: 'Ready', icon: '📦' },
    { key: 'picked_up', label: 'Picked Up', icon: '🚗' },
    { key: 'in_transit', label: 'In Transit', icon: '🏍️' },
    { key: 'delivered', label: 'Delivered', icon: '🎉' }
  ]
  
  const currentIdx = Math.max(0, steps.findIndex(s => s.key === status))
  
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
      <div className="space-y-4">
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
                <div className={`font-medium text-sm ${
                  isCompleted ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.label}
                </div>
                {isCurrent && history?.find(h => h.status === step.key) && (
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(history.find(h => h.status === step.key).timestamp).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function TrackAll(){
  const { t } = useI18n()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newMessages, setNewMessages] = useState({}) // orderId -> count of new messages

  useEffect(()=>{
    let mounted = true
    get('/api/orders/me')
      .then((d)=>{ 
        if(mounted){ 
          setOrders(d.data||[]); 
          setLoading(false) 
        } 
      })
      .catch((e)=>{ 
        if(mounted){ 
          setError(e.message||'Failed to load orders'); 
          setLoading(false) 
        } 
      })
    return ()=>{ mounted = false }
  },[])

  // Initialize socket and listen for new messages
  useEffect(()=>{
    getSocket()
    authenticate()
    
    const offMessage = onOrderMessage((message) => {
      // Check if this message is for one of our orders
      const orderExists = orders.some(order => order._id === message.orderId)
      if (orderExists) {
        setNewMessages(prev => ({
          ...prev,
          [message.orderId]: (prev[message.orderId] || 0) + 1
        }))
      }
    })

    
    return () => {
      if (offMessage) offMessage()
    }
  }, [orders])

  // Clear notification when user clicks on chat
  const clearNotification = (orderId) => {
    setNewMessages(prev => {
      const updated = { ...prev }
      delete updated[orderId]
      return updated
    })
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

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 p-4">
      <div className="max-w-4xl mx-auto text-center py-12">
        <Spinner size={48} className="text-orange-500 mx-auto mb-4" />
        <p className="text-gray-600">{t('Loading your orders...')}</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 p-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center"
        >
          <div className="text-red-500 text-lg mb-2">⚠️</div>
          <div className="text-red-600 font-medium">{error}</div>
        </motion.div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 p-4 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white rounded-2xl shadow-lg border border-orange-100">
            <FiShoppingBag className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('Your Orders')}</h1>
            <p className="text-gray-600 text-sm mt-1">{t('Track all your orders in one place')}</p>
          </div>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto">
        {orders.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-8 text-center"
          >
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiPackage className="w-8 h-8 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('No orders yet')}</h3>
            <p className="text-gray-500 text-sm mb-4">{t('Your order history will appear here')}</p>
            <a 
              href="/"
              className="inline-block px-6 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
            >
              {t('Start Shopping')}
            </a>
          </motion.div>
        )}

        <div className="space-y-6">
          <AnimatePresence>
            {orders.map((o, index)=> (
              <motion.div
                key={o._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6 hover:shadow-xl transition-all duration-300"
              >
                {/* Order Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Order #{o.orderNumber}</h2>
                    <p className="text-gray-600 text-sm">
                      Placed on {new Date(o.createdAt).toLocaleDateString()} at {new Date(o.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(o.status)}`}>
                    {o.status.replace('_', ' ').toUpperCase()}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50/50 rounded-2xl border border-gray-200">
                    <div className="text-gray-600 text-sm mb-1">{t('Total Amount')}</div>
                    <div className="text-lg font-bold text-orange-600">{formatLKR(o.total)}</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50/50 rounded-2xl border border-gray-200">
                    <div className="text-gray-600 text-sm mb-1">{t('Items')}</div>
                    <div className="text-lg font-bold text-gray-900">{o.items?.length || 0}</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50/50 rounded-2xl border border-gray-200">
                    <div className="text-gray-600 text-sm mb-1">{t('Order Status')}</div>
                    <div className="text-lg font-bold text-gray-900 capitalize">{o.status.replace('_', ' ')}</div>
                  </div>
                </div>

                {/* Courier Info */}
                {o.deliveryPerson && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-2xl border border-blue-200 mb-4">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <FiUser className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">
                        {t('Courier')}: {o.deliveryPerson?.firstName} {o.deliveryPerson?.lastName}
                      </div>
                      {o.deliveryPerson?.phone && (
                        <div className="text-xs text-gray-600">{o.deliveryPerson.phone}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Progress Timeline */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-orange-100 rounded-xl">
                      <FiClock className="w-4 h-4 text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{t('Order Progress')}</h3>
                  </div>
                  <Timeline status={o.status} history={o.trackingHistory} />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                  {/* Review button for delivered orders */}
                  {(((o?.status||'')+'').toLowerCase().replace(/\s+/g,'_').trim() === 'delivered') && (
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={`/track/${o._id}#reviews`}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors shadow-md hover:shadow-lg"
                    >
                      <FiCheck className="w-4 h-4" />
                      {t('Leave Review')}
                    </motion.a>
                  )}

                  {/* Chat button for active orders with delivery person */}
                  {o.deliveryPerson && ['picked_up', 'in_transit'].includes(o.status) && o.status !== 'delivered' && (
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={`/track/${o._id}`}
                      onClick={() => clearNotification(o._id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors shadow-md hover:shadow-lg relative ${
                        newMessages[o._id] 
                          ? 'bg-orange-500 text-white hover:bg-orange-600 animate-pulse' 
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      <FiMessageSquare className="w-4 h-4" />
                      {t('View Chat')}
                      {newMessages[o._id] && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg">
                          {newMessages[o._id]}
                        </span>
                      )}
                    </motion.a>
                  )}

                  {/* Always show details button */}
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href={`/track/${o._id}`}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    <FiPackage className="w-4 h-4" />
                    {t('View Details')}
                  </motion.a>
                </div>

                {/* Order Items Preview */}
                {o.items && o.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 text-sm mb-2">{t('Items in this order:')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {o.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-xl border border-gray-200">
                          {item.product?.images?.[0]?.url ? (
                            <img
                              src={item.product.images[0].url}
                              alt={item.product.name}
                              className="w-6 h-6 object-cover rounded-lg border"
                            />
                          ) : (
                            <div className="w-6 h-6 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg border border-orange-200" />
                          )}
                          <span className="text-xs text-gray-700 font-medium">
                            {item.product?.name || 'Item'} ×{item.quantity}
                          </span>
                        </div>
                      ))}
                      {o.items.length > 3 && (
                        <div className="px-3 py-1 bg-gray-100 rounded-xl border border-gray-300">
                          <span className="text-xs text-gray-600 font-medium">
                            +{o.items.length - 3} {t('more')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}