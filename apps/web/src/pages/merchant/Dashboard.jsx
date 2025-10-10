import { useEffect, useState } from 'react'
import { get } from '../../shared/api.js'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiDollarSign, 
  FiShoppingBag, 
  FiTruck, 
  FiTrendingUp, 
  FiPackage,
  FiUsers,
  FiClock,
  FiDownload,
  FiRefreshCw,
  FiBarChart2,
  FiStar
} from 'react-icons/fi'
import { useToast } from '../../shared/ui/Toast.jsx'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'
import { formatLKR } from '../../shared/currency.js'
import { generateMerchantReportPDF } from '../../shared/pdfGenerator.js'

export default function MerchantDashboard(){
  const { t } = useI18n()
  const { notify } = useToast()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('monthly')
  const [refreshing, setRefreshing] = useState(false)

  async function loadAnalytics() {
    try {
      setRefreshing(true)
      const data = await get(`/api/orders/merchant/analytics?period=${period}`)
      setAnalytics(data.data)
    } catch (err) {
      notify({ type: 'error', title: 'Failed to load analytics', message: err.message })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [period])

  function exportReport() {
    if (!analytics) return
    
    const reportData = {
      period,
      generatedAt: new Date().toISOString(),
      overview: analytics.overview,
      deliveries: analytics.deliveries,
      topProducts: analytics.topProducts,
      recentOrders: analytics.recentOrders
    }
    
    try {
      const pdf = generateMerchantReportPDF(reportData, 'overview')
      pdf.save(`merchant-dashboard-report-${period}-${new Date().toISOString().split('T')[0]}.pdf`)
      notify({ type: 'success', title: 'PDF report exported successfully' })
    } catch (error) {
      console.error('PDF generation error:', error)
      notify({ type: 'error', title: 'Failed to generate PDF', message: error.message })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('Loading...')}</p>
        </div>
      </div>
    )
  }

  const { overview, deliveries, recentOrders, topProducts } = analytics || {}

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 p-4 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white rounded-2xl shadow-lg border border-orange-100">
            <FiBarChart2 className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('Dashboard')}</h1>
            <p className="text-gray-600 text-sm">{t('Business overview')}</p>
          </div>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-4 mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <FiClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500 w-4 h-4" />
              <select 
                value={period} 
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full border border-orange-200 rounded-2xl pl-10 pr-4 py-3 bg-white text-gray-700 focus:border-orange-300 focus:ring-2 focus:ring-orange-200 outline-none appearance-none"
              >
                <option value="daily">{t('Last 30 Days')}</option>
                <option value="weekly">{t('Last 12 Weeks')}</option>
                <option value="monthly">{t('Last 12 Months')}</option>
                <option value="yearly">{t('Last 5 Years')}</option>
              </select>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadAnalytics}
              disabled={refreshing}
              className="p-3 bg-orange-100 rounded-2xl border border-orange-200 disabled:opacity-50"
            >
              <FiRefreshCw className={`w-4 h-4 text-orange-600 ${refreshing ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={exportReport}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl px-4 py-3 font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg hover:shadow-xl w-full sm:w-auto"
          >
            <FiDownload className="w-4 h-4" />
            {t('Export PDF')}
          </motion.button>
        </div>
      </motion.div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        {/* Revenue Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-6 text-white shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium mb-1">{t('Total Revenue')}</p>
              <p className="text-3xl font-bold">{formatLKR(overview?.totalRevenue || 0)}</p>
              <p className="text-orange-200 text-xs mt-2">{t('All time earnings')}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <FiDollarSign className="text-2xl text-white" />
            </div>
          </div>
        </motion.div>

        {/* Secondary Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-orange-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">{t('Total Orders')}</p>
                <p className="text-2xl font-bold text-gray-900">{overview?.totalOrders || 0}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-xl">
                <FiShoppingBag className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-orange-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">{t('Deliveries')}</p>
                <p className="text-2xl font-bold text-gray-900">{deliveries?.totalDeliveries || 0}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-xl">
                <FiTruck className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-orange-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">{t('Avg Order Value')}</p>
              <p className="text-2xl font-bold text-gray-900">{formatLKR(overview?.averageOrderValue || 0)}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-xl">
              <FiTrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Order Status Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex overflow-x-auto gap-3 mb-6 pb-2 scrollbar-hide"
      >
        <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center shadow-lg border border-orange-100 min-w-[120px]">
          <div className="p-2 bg-green-100 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
            <FiPackage className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-xs text-gray-600 mb-1">{t('Completed')}</p>
          <p className="text-xl font-bold text-gray-900">{overview?.completedOrders || 0}</p>
        </div>

        <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center shadow-lg border border-orange-100 min-w-[120px]">
          <div className="p-2 bg-yellow-100 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
            <FiClock className="w-6 h-6 text-yellow-600" />
          </div>
          <p className="text-xs text-gray-600 mb-1">{t('Pending')}</p>
          <p className="text-xl font-bold text-gray-900">{overview?.pendingOrders || 0}</p>
        </div>

        <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center shadow-lg border border-orange-100 min-w-[120px]">
          <div className="p-2 bg-red-100 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
            <FiUsers className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-xs text-gray-600 mb-1">{t('Cancelled')}</p>
          <p className="text-xl font-bold text-gray-900">{overview?.cancelledOrders || 0}</p>
        </div>
      </motion.div>

      {/* Recent Orders & Top Products */}
      <div className="space-y-6">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 overflow-hidden"
        >
          <div className="p-4 border-b border-orange-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FiShoppingBag className="w-5 h-5 text-orange-600" />
              {t('Recent Orders')}
            </h3>
          </div>
          
          <div className="divide-y divide-orange-100">
            <AnimatePresence>
              {recentOrders?.length > 0 ? (
                recentOrders.slice(0, 5).map((order, index) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 hover:bg-orange-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 truncate">
                            #{order.orderNumber}
                          </p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {order.customer?.firstName} {order.customer?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-gray-900">{formatLKR(order.total)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <FiShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">{t('No recent orders')}</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 overflow-hidden"
        >
          <div className="p-4 border-b border-orange-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FiStar className="w-5 h-5 text-orange-600" />
              {t('Top Products')}
            </h3>
          </div>
          
          <div className="divide-y divide-orange-100">
            <AnimatePresence>
              {topProducts?.length > 0 ? (
                topProducts.slice(0, 5).map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 hover:bg-orange-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate mb-1">
                          {product.productName}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{product.totalSold} {t('sold')}</span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-gray-900">{formatLKR(product.totalRevenue)}</p>
                        <p className="text-xs text-gray-500">{t('revenue')}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <FiPackage className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">{t('No product data')}</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}