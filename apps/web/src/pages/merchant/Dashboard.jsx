import { useEffect, useState, Fragment } from 'react' // Import Fragment
import { get } from '../../shared/api.js'
import { motion, AnimatePresence } from 'framer-motion'
import { Listbox, Transition } from '@headlessui/react' // Import Listbox
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
  FiStar,
  FiChevronRight,
  FiEye,
  FiChevronDown, // New Icon
  FiCheck       // New Icon
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
  const [activeTab, setActiveTab] = useState('overview')

  // Create an array for cleaner mapping
  const periodOptions = [
    { value: 'daily', label: t('30 Days') },
    { value: 'weekly', label: t('12 Weeks') },
    { value: 'monthly', label: t('12 Months') },
    { value: 'yearly', label: t('5 Years') }
  ]

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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 flex items-center justify-center p-4 safe-area-bottom">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">{t('Loading your dashboard...')}</p>
        </div>
      </div>
    )
  }

  const { overview, deliveries, recentOrders, topProducts } = analytics || {}

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 p-4 safe-area-bottom">
      {/* Header with improved spacing */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 pt-2"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-2xl shadow-lg border border-orange-100">
              <FiBarChart2 className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('Dashboard')}</h1>
              <p className="text-gray-600 text-sm">{t('Business overview')}</p>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadAnalytics}
              disabled={refreshing}
              className="p-3 bg-white rounded-2xl shadow-lg border border-orange-200 disabled:opacity-50"
            >
              <FiRefreshCw className={`w-5 h-5 text-orange-600 ${refreshing ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>

        {/* --- REPLACEMENT CODE STARTS HERE --- */}
        <div className="relative">
          <Listbox value={period} onChange={setPeriod}>
            <div className="relative">
              <Listbox.Button className="relative w-full cursor-pointer bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-orange-100 p-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-opacity-75">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiClock className="text-orange-500 w-4 h-4" />
                    <span className="text-sm font-medium text-gray-700">{t('Period')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="block truncate text-sm font-medium text-orange-600">
                      {periodOptions.find(p => p.value === period)?.label}
                    </span>
                    <FiChevronDown className="h-4 w-4 text-orange-400" aria-hidden="true" />
                  </div>
                </div>
              </Listbox.Button>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-2xl bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
                  {periodOptions.map((option, optionIdx) => (
                    <Listbox.Option
                      key={optionIdx}
                      className={({ active }) =>
                        `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                          active ? 'bg-orange-100 text-orange-900' : 'text-gray-900'
                        }`
                      }
                      value={option.value}
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {option.label}
                          </span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-orange-600">
                              <FiCheck className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
        </div>
        {/* --- REPLACEMENT CODE ENDS HERE --- */}
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-orange-100 p-1 mb-6"
      >
        {['overview', 'orders', 'products'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-gray-600 hover:text-orange-600'
            }`}
          >
            {t(tab.charAt(0).toUpperCase() + tab.slice(1))}
          </button>
        ))}
      </motion.div>

      {/* Main Stats Cards - Improved mobile layout */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Revenue Card - More prominent */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-5 text-white shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <FiDollarSign className="text-xl text-white" />
                </div>
                <span className="text-orange-200 text-sm bg-white/10 px-2 py-1 rounded-full capitalize">
                  {period}
                </span>
              </div>
              <p className="text-orange-100 text-sm font-medium mb-1">{t('Total Revenue')}</p>
              <p className="text-3xl font-bold mb-2">{formatLKR(overview?.totalRevenue || 0)}</p>
              <div className="flex justify-between text-xs text-orange-200">
                <span>{overview?.totalOrders || 0} {t('orders')}</span>
                <span>{formatLKR(overview?.averageOrderValue || 0)} {t('avg order')}</span>
              </div>
            </motion.div>

            {/* Stats Grid - Improved spacing */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { 
                  label: t('Total Orders'), 
                  value: overview?.totalOrders || 0, 
                  icon: FiShoppingBag, 
                  bg: 'bg-blue-50',
                  text: 'text-blue-600'
                },
                { 
                  label: t('Deliveries'), 
                  value: deliveries?.totalDeliveries || 0, 
                  icon: FiTruck, 
                  bg: 'bg-green-50',
                  text: 'text-green-600'
                },
                { 
                  label: t('Completed'), 
                  value: overview?.completedOrders || 0, 
                  icon: FiPackage, 
                  bg: 'bg-green-50',
                  text: 'text-green-600'
                },
                { 
                  label: t('Pending'), 
                  value: overview?.pendingOrders || 0, 
                  icon: FiClock, 
                  bg: 'bg-yellow-50',
                  text: 'text-yellow-600'
                }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-4 shadow-lg border border-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-xs font-medium mb-1">{stat.label}</p>
                      <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${stat.bg}`}>
                      <stat.icon className={`w-4 h-4 ${stat.text}`} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Export Button - Fixed at bottom */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={exportReport}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl px-6 py-4 font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg hover:shadow-xl mt-4"
            >
              <FiDownload className="w-5 h-5" />
              <span>{t('Export PDF Report')}</span>
            </motion.button>
          </motion.div>
        )}

        {activeTab === 'orders' && (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Order Status Summary */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FiShoppingBag className="w-5 h-5 text-orange-600" />
                {t('Order Summary')}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { status: 'completed', count: overview?.completedOrders || 0, color: 'bg-green-500' },
                  { status: 'pending', count: overview?.pendingOrders || 0, color: 'bg-yellow-500' },
                  { status: 'cancelled', count: overview?.cancelledOrders || 0, color: 'bg-red-500' }
                ].map((item) => (
                  <div key={item.status} className="text-center">
                    <div className={`h-2 ${item.color} rounded-full mb-2`}></div>
                    <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                    <p className="text-xs text-gray-600 capitalize">{item.status}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Orders List */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">{t('Recent Orders')}</h3>
                <button className="text-orange-600 text-sm font-medium flex items-center gap-1">
                  {t('View All')}
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="divide-y divide-gray-100">
                <AnimatePresence>
                  {recentOrders?.length > 0 ? (
                    recentOrders.slice(0, 5).map((order, index) => (
                      <motion.div
                        key={order._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 hover:bg-orange-50/30 active:bg-orange-100 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">
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
                          <p className="font-bold text-gray-900 text-lg">{formatLKR(order.total)}</p>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>{order.customer?.firstName} {order.customer?.lastName}</span>
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
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
            </div>
          </motion.div>
        )}

        {activeTab === 'products' && (
          <motion.div
            key="products"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Top Products */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FiStar className="w-5 h-5 text-orange-600" />
                  {t('Top Products')}
                </h3>
                <button className="text-orange-600 text-sm font-medium flex items-center gap-1">
                  {t('View All')}
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="divide-y divide-gray-100">
                <AnimatePresence>
                  {topProducts?.length > 0 ? (
                    topProducts.slice(0, 5).map((product, index) => (
                      <motion.div
                        key={product._id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 hover:bg-orange-50/30 active:bg-orange-100 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate text-lg mb-1">
                              {product.productName}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                                {product.totalSold} {t('sold')}
                              </span>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-bold text-gray-900 text-lg">{formatLKR(product.totalRevenue)}</p>
                            <p className="text-xs text-gray-500">{t('revenue')}</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${Math.min((product.totalSold / (topProducts[0]?.totalSold || 1)) * 100, 100)}%` 
                            }}
                          ></div>
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Safe Area Spacer */}
      <div className="h-20"></div>
    </div>
  )
}