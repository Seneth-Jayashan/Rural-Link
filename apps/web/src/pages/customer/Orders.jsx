import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../../shared/api.js'
import { Spinner } from '../../shared/ui/Spinner.jsx'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'
import { formatLKR } from '../../shared/currency.js'
import { motion, AnimatePresence } from 'framer-motion'
import { FiShoppingBag, FiTruck, FiCalendar, FiPackage, FiArrowRight, FiClock } from 'react-icons/fi'

export default function CustomerOrders(){
  const { t } = useI18n()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(()=>{
    let mounted = true
    get('/api/orders/me')
      .then((d)=>{ if(mounted){ setOrders(d.data||[]); setLoading(false) } })
      .catch((e)=>{ if(mounted){ setError(e.message||'Failed to load orders'); setLoading(false) } })
    return ()=>{ mounted = false }
  },[])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('Loading your orders...')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md mx-auto"
        >
          <div className="text-red-500 text-lg mb-2">⚠️</div>
          <div className="text-red-600 font-medium mb-1">{t('Something went wrong')}</div>
          <div className="text-red-500 text-sm">{error}</div>
        </motion.div>
      </div>
    )
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
            <FiShoppingBag className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('My Orders')}</h1>
            <p className="text-gray-600 text-sm mt-1">{t('Track and manage your orders')}</p>
          </div>
        </div>
      </motion.div>

      <div className="max-w-2xl mx-auto">
        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center mt-20 text-center"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-amber-100 rounded-3xl flex items-center justify-center shadow-lg border border-orange-200 mb-6">
              <FiPackage className="w-10 h-10 text-orange-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('No orders yet')}</h3>
            <p className="text-gray-500 text-sm mb-6">{t('Start shopping to see your orders here')}</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium shadow-lg hover:bg-orange-600 hover:shadow-xl transition-all"
              onClick={() => window.location.href = '/'}
            >
              {t('Start Shopping')}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {orders.map((order, index) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6 hover:shadow-xl transition-all duration-300"
              >
                {/* Order Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-xl">
                      <FiPackage className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {t('Order')} #{order.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {(order.status || '').replace('_', ' ').toUpperCase()}
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50/50 to-amber-50/50 rounded-2xl border border-orange-200">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <FiShoppingBag className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t('Total Amount')}</p>
                      <p className="text-lg font-bold text-orange-600">{formatLKR(order.total)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50/50 to-amber-50/50 rounded-2xl border border-orange-200">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <FiPackage className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t('Items')}</p>
                      <p className="text-lg font-semibold text-gray-900">{order.items?.length || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Delivery Person */}
                {order.deliveryPerson && (
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-2xl border border-green-200 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FiTruck className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t('Delivery Person')}</p>
                      <p className="text-sm font-medium text-gray-900">
                        {order.deliveryPerson?.firstName} {order.deliveryPerson?.lastName}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="flex justify-end">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to={`/track/${order._id}`}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg hover:shadow-xl"
                    >
                      <FiArrowRight className="w-4 h-4" />
                      {t('Track Order')}
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
