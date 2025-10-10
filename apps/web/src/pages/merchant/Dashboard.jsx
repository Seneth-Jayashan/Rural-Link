import { useEffect, useState } from 'react'
import { get } from '../../shared/api.js'
import { motion } from 'framer-motion'
import { 
  FiDollarSign, 
  FiShoppingBag, 
  FiTruck, 
  FiTrendingUp, 
  FiPackage,
  FiUsers,
  FiClock,
  FiDownload,
  FiRefreshCw
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

  async function loadAnalytics() {
    try {
      setLoading(true)
      const data = await get(`/api/orders/merchant/analytics?period=${period}`)
      setAnalytics(data.data)
    } catch (err) {
      notify({ type: 'error', title: 'Failed to load analytics', message: err.message })
    } finally {
      setLoading(false)
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
      <div className="p-3 pb-16">
        <div className="flex items-center justify-center h-64">
          <FiRefreshCw className="animate-spin text-2xl text-blue-600" />
        </div>
      </div>
    )
  }

  const { overview, deliveries, recentOrders, topProducts } = analytics || {}

  return (
    <div className="p-3 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('Dashboard')}</h1>
        <div className="flex items-center gap-3">
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="daily">{t('Last 30 Days')}</option>
            <option value="weekly">{t('Last 12 Weeks')}</option>
            <option value="monthly">{t('Last 12 Months')}</option>
            <option value="yearly">{t('Last 5 Years')}</option>
          </select>
          <button
            onClick={exportReport}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
          >
            <FiDownload /> {t('Export PDF')}
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">{t('Total Revenue')}</p>
              <p className="text-2xl font-bold">{formatLKR(overview?.totalRevenue || 0)}</p>
            </div>
            <FiDollarSign className="text-3xl text-green-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">{t('Total Orders')}</p>
              <p className="text-2xl font-bold">{overview?.totalOrders || 0}</p>
            </div>
            <FiShoppingBag className="text-3xl text-blue-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">{t('Deliveries')}</p>
              <p className="text-2xl font-bold">{deliveries?.totalDeliveries || 0}</p>
            </div>
            <FiTruck className="text-3xl text-purple-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">{t('Avg Order Value')}</p>
              <p className="text-2xl font-bold">{formatLKR(overview?.averageOrderValue || 0)}</p>
            </div>
            <FiTrendingUp className="text-3xl text-orange-200" />
          </div>
        </motion.div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiPackage className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('Completed Orders')}</p>
              <p className="text-xl font-semibold">{overview?.completedOrders || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <FiUsers className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('Cancelled Orders')}</p>
              <p className="text-xl font-semibold">{overview?.cancelledOrders || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FiClock className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('Pending Orders')}</p>
              <p className="text-xl font-semibold">{overview?.pendingOrders || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg p-4 border">
          <h3 className="text-lg font-semibold mb-4">{t('Recent Orders')}</h3>
          <div className="space-y-3">
            {recentOrders?.length > 0 ? (
              recentOrders.map((order, index) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">
                      {order.customer?.firstName} {order.customer?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatLKR(order.total)}</p>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">{t('No recent orders')}</p>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg p-4 border">
          <h3 className="text-lg font-semibold mb-4">{t('Top Products')}</h3>
          <div className="space-y-3">
            {topProducts?.length > 0 ? (
              topProducts.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{product.productName}</p>
                    <p className="text-sm text-gray-600">
                      {product.totalSold} {t('sold')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatLKR(product.totalRevenue)}</p>
                    <p className="text-xs text-gray-500">{t('revenue')}</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">{t('No product data')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


