import { useEffect, useState } from 'react'
import { get } from '../../shared/api.js'
import { motion } from 'framer-motion'
import { 
  FiDownload, 
  FiFileText, 
  FiCalendar,
  FiRefreshCw,
  FiBarChart,
  FiTrendingUp,
  FiDollarSign
} from 'react-icons/fi'
import { useToast } from '../../shared/ui/Toast.jsx'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'
import { formatLKR } from '../../shared/currency.js'
import { generateMerchantReportPDF, generateFinancialReportPDF } from '../../shared/pdfGenerator.js'

export default function Reports(){
  const { t } = useI18n()
  const { notify } = useToast()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('monthly')
  const [reportType, setReportType] = useState('overview')

  async function loadAnalytics() {
    try {
      setLoading(true)
      const data = await get(`/api/orders/merchant/analytics?period=${period}`)
      setAnalytics(data.data)
    } catch (err) {
      notify({ type: 'error', title: 'Failed to load data', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [period])

  function generateReport(type) {
    if (!analytics) return
    
    try {
      let pdf
      let filename = ''
      
      switch (type) {
        case 'overview':
          const overviewData = {
            period,
            generatedAt: new Date().toISOString(),
            overview: analytics.overview,
            deliveries: analytics.deliveries,
            recentOrders: analytics.recentOrders,
            topProducts: analytics.topProducts
          }
          pdf = generateMerchantReportPDF(overviewData, 'overview')
          filename = `overview-report-${period}-${new Date().toISOString().split('T')[0]}.pdf`
          break
          
        case 'detailed':
          const detailedData = {
            period,
            generatedAt: new Date().toISOString(),
            overview: analytics.overview,
            deliveries: analytics.deliveries,
            recentOrders: analytics.recentOrders,
            topProducts: analytics.topProducts,
            dailyRevenue: analytics.dailyRevenue
          }
          pdf = generateMerchantReportPDF(detailedData, 'detailed')
          filename = `detailed-report-${period}-${new Date().toISOString().split('T')[0]}.pdf`
          break
          
        case 'financial':
          const financialData = {
            period,
            generatedAt: new Date().toISOString(),
            financial: {
              totalRevenue: analytics.overview?.totalRevenue || 0,
              averageOrderValue: analytics.overview?.averageOrderValue || 0,
              totalOrders: analytics.overview?.totalOrders || 0,
              completedOrders: analytics.overview?.completedOrders || 0,
              revenuePerOrder: analytics.overview?.totalRevenue / (analytics.overview?.completedOrders || 1),
              dailyRevenue: analytics.dailyRevenue
            }
          }
          pdf = generateFinancialReportPDF(financialData)
          filename = `financial-report-${period}-${new Date().toISOString().split('T')[0]}.pdf`
          break
      }
      
      pdf.save(filename)
      notify({ type: 'success', title: `${type.charAt(0).toUpperCase() + type.slice(1)} PDF report exported successfully` })
    } catch (error) {
      console.error('PDF generation error:', error)
      notify({ type: 'error', title: 'Failed to generate PDF', message: error.message })
    }
  }

  function exportCSV() {
    if (!analytics) return
    
    const csvData = [
      ['Metric', 'Value'],
      ['Total Revenue', analytics.overview?.totalRevenue || 0],
      ['Total Orders', analytics.overview?.totalOrders || 0],
      ['Completed Orders', analytics.overview?.completedOrders || 0],
      ['Cancelled Orders', analytics.overview?.cancelledOrders || 0],
      ['Average Order Value', analytics.overview?.averageOrderValue || 0],
      ['Total Deliveries', analytics.deliveries?.totalDeliveries || 0],
      ['Average Delivery Time', analytics.deliveries?.averageDeliveryTime || 0],
      ['Total Distance', analytics.deliveries?.totalDistance || 0]
    ]
    
    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `merchant-report-${period}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    notify({ type: 'success', title: 'CSV report exported successfully' })
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

  const { overview, deliveries } = analytics || {}

  return (
    <div className="p-3 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('Reports')}</h1>
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
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg p-6 border shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiFileText className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold">{t('Overview Report')}</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            {t('Basic metrics and key performance indicators')}
          </p>
          <button
            onClick={() => generateReport('overview')}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <FiDownload /> {t('Export PDF')}
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg p-6 border shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiBarChart className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">{t('Detailed Report')}</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            {t('Comprehensive data including orders, products, and trends')}
          </p>
          <button
            onClick={() => generateReport('detailed')}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <FiDownload /> {t('Export PDF')}
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg p-6 border shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiDollarSign className="text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold">{t('Financial Report')}</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            {t('Revenue analysis and financial performance metrics')}
          </p>
          <button
            onClick={() => generateReport('financial')}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            <FiDownload /> {t('Export PDF')}
          </button>
        </motion.div>
      </div>

      {/* CSV Export */}
      <div className="bg-white rounded-lg p-6 border shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-100 rounded-lg">
            <FiTrendingUp className="text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold">{t('CSV Export')}</h3>
        </div>
        <p className="text-gray-600 text-sm mb-4">
          {t('Export data in CSV format for spreadsheet analysis')}
        </p>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
        >
          <FiDownload /> {t('Export CSV')}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg p-6 border shadow-sm">
        <h3 className="text-lg font-semibold mb-4">{t('Quick Statistics')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{formatLKR(overview?.totalRevenue || 0)}</p>
            <p className="text-sm text-gray-600">{t('Total Revenue')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{overview?.totalOrders || 0}</p>
            <p className="text-sm text-gray-600">{t('Total Orders')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{deliveries?.totalDeliveries || 0}</p>
            <p className="text-sm text-gray-600">{t('Deliveries')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{formatLKR(overview?.averageOrderValue || 0)}</p>
            <p className="text-sm text-gray-600">{t('Avg Order Value')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
