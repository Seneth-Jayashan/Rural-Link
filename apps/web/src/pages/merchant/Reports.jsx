import { useEffect, useState } from 'react'
import { get } from '../../shared/api.js'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiDownload, 
  FiFileText, 
  FiCalendar,
  FiRefreshCw,
  FiBarChart,
  FiTrendingUp,
  FiDollarSign,
  FiPieChart,
  FiDatabase,
  FiShoppingBag,
  FiTruck
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
  const [refreshing, setRefreshing] = useState(false)

  async function loadAnalytics() {
    try {
      setRefreshing(true)
      const data = await get(`/api/orders/merchant/analytics?period=${period}`)
      setAnalytics(data.data)
    } catch (err) {
      notify({ type: 'error', title: 'Failed to load data', message: err.message })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [period])

    async function pdfToNativeDownload(pdf, filename) {
    try {
      // 1. Get the PDF output as a Data URI (which contains the Base64 data)
      const dataUri = pdf.output('datauristring'); // Assuming jsPDF or similar library
      
      // 2. Split the Data URI to get just the Base64 string
      // Format is: data:application/pdf;base64,BASE64_STRING
      const [header, base64Data] = dataUri.split(',');
      const mimeType = header.split(':')[1].split(';')[0]; // Extract the mime type

      // 3. Check if the native Android interface is available
      if (window.Android && window.Android.downloadBase64File) {
        // Call the native method to save the file
        window.Android.downloadBase64File(base64Data, filename, mimeType);
        return true; // Successfully handed off to native
      } else {
        // Fallback for standard browsers or if interface isn't ready
        console.warn('Android interface not found, falling back to browser download.');
        pdf.save(filename); // Use original save method
        return false;
      }
    } catch (error) {
      console.error("Error converting PDF to Base64:", error);
      return false;
    }
  }


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

      pdfToNativeDownload(pdf, filename).then(isNative => {
          if (isNative) {
              notify({ type: 'success', title: `${type.charAt(0).toUpperCase() + type.slice(1)} PDF report exported successfully` });
          }
      });
      
    } catch (error) {
      console.error('PDF generation error:', error)
      notify({ type: 'error', title: 'Failed to generate PDF', message: error.message })
    }
  }

  async function exportCSV() {
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
    const filename = `merchant-report-${period}-${new Date().toISOString().split('T')[0]}.csv`
    const mimeType = 'text/csv'

    try {
        if (window.Android && window.Android.downloadBase64File) {
            // New logic: Convert blob to Base64 and call native Android method

            const reader = new FileReader();

            // Return a promise to wait for the FileReader to complete
            await new Promise((resolve, reject) => {
                reader.onloadend = function() {
                    const base64Data = reader.result.split(',')[1];
                    window.Android.downloadBase64File(base64Data, filename, mimeType);
                    resolve();
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
            
            notify({ type: 'success', title: 'CSV report exported successfully (Native)' })
            
        } else {
            // Original logic: Fallback for web browser download (uses blob: URI)
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            
            notify({ type: 'success', title: 'CSV report exported successfully' })
        }
        
    } catch (error) {
        console.error('CSV generation error:', error);
        notify({ type: 'error', title: 'Failed to generate CSV', message: error.message })
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

  const { overview, deliveries } = analytics || {}

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
            <FiBarChart className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('Reports')}</h1>
            <p className="text-gray-600 text-sm">{t('Export business insights and analytics')}</p>
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
              <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500 w-4 h-4" />
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
        </div>
      </motion.div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Overview Report */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-5 hover:shadow-xl transition-all duration-300 group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <FiFileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('Overview Report')}</h3>
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
            {t('Key performance indicators and basic business metrics')}
          </p>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => generateReport('overview')}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl px-4 py-3 font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            <FiDownload className="w-4 h-4" />
            {t('Export PDF')}
          </motion.button>
        </motion.div>

        {/* Detailed Report */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-5 hover:shadow-xl transition-all duration-300 group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <FiPieChart className="w-6 h-6 text-green-600" />
            </div>
            <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('Detailed Report')}</h3>
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
            {t('Comprehensive analysis with orders, products, and trends')}
          </p>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => generateReport('detailed')}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl px-4 py-3 font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
          >
            <FiDownload className="w-4 h-4" />
            {t('Export PDF')}
          </motion.button>
        </motion.div>

        {/* Financial Report */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-5 hover:shadow-xl transition-all duration-300 group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <FiDollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('Financial Report')}</h3>
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
            {t('Revenue analysis and financial performance metrics')}
          </p>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => generateReport('financial')}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl px-4 py-3 font-semibold hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            <FiDownload className="w-4 h-4" />
            {t('Export PDF')}
          </motion.button>
        </motion.div>
      </div>

      {/* CSV Export Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-5 mb-6 hover:shadow-xl transition-all duration-300 group"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-orange-100 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <FiDatabase className="w-6 h-6 text-orange-600" />
          </div>
          <div className="w-2 h-2 bg-orange-400 rounded-full mt-2"></div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('CSV Export')}</h3>
        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
          {t('Raw data in CSV format for advanced analysis in spreadsheets')}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={exportCSV}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl px-4 py-3 font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg hover:shadow-xl"
          >
            <FiDownload className="w-4 h-4" />
            {t('Export CSV')}
          </motion.button>
        </div>
      </motion.div>

      {/* Quick Stats - PROPER MOBILE FIX */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-5"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-100 rounded-xl">
            <FiTrendingUp className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{t('Quick Statistics')}</h3>
        </div>

        {/* Proper 2x2 grid for mobile */}
        <div className="grid grid-cols-2 gap-3">
          {/* Total Revenue - Top Left */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-200 p-4 text-center">
            <p className="text-lg font-bold text-green-600">{formatLKR(overview?.totalRevenue || 0)}</p>
            <p className="text-xs text-gray-600 mt-1">{t('Total Revenue')}</p>
          </div>
          
          {/* Total Orders - Top Right */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-200 p-4 text-center">
            <p className="text-lg font-bold text-blue-600">{overview?.totalOrders || 0}</p>
            <p className="text-xs text-gray-600 mt-1">{t('Total Orders')}</p>
          </div>
          
          {/* Deliveries - Bottom Left */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-200 p-4 text-center">
            <p className="text-lg font-bold text-purple-600">{deliveries?.totalDeliveries || 0}</p>
            <p className="text-xs text-gray-600 mt-1">{t('Deliveries')}</p>
          </div>
          
          {/* Avg Order Value - Bottom Right */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-200 p-4 text-center">
            <p className="text-lg font-bold text-orange-600">{formatLKR(overview?.averageOrderValue || 0)}</p>
            <p className="text-xs text-gray-600 mt-1">{t('Avg Order Value')}</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}