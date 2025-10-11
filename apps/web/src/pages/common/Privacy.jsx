import { motion } from 'framer-motion'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'
import { ArrowLeft, Shield, Eye, Lock, Database, Users, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Privacy() {
  const { t } = useI18n()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm border-b border-orange-100 px-4 py-4 shadow-lg"
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <motion.button 
              whileHover={{ scale:1.05 }} 
              whileTap={{ scale:0.95 }} 
              onClick={()=> navigate(-1)}
              className="p-2 bg-white rounded-2xl shadow-lg border border-orange-100 hover:shadow-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-orange-600" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('Privacy Policy')}</h1>
              <p className="text-gray-600 text-sm mt-1">{t('How we protect and handle your data')}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto p-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-8 space-y-8"
        >
          {/* Introduction */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('Privacy Policy')}</h2>
            <p className="text-gray-600">{t('Last updated: January 2025')}</p>
          </div>

          {/* Information We Collect */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{t('Information We Collect')}</h3>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-2xl border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">{t('Personal Information')}</h4>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• {t('Name, email address, and phone number')}</li>
                  <li>• {t('Profile picture and account preferences')}</li>
                  <li>• {t('Delivery addresses and location data')}</li>
                  <li>• {t('Payment information (processed securely)')}</li>
                </ul>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-2xl border border-green-200">
                <h4 className="font-semibold text-gray-900 mb-2">{t('Usage Information')}</h4>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• {t('App usage patterns and preferences')}</li>
                  <li>• {t('Order history and delivery preferences')}</li>
                  <li>• {t('Device information and app performance data')}</li>
                  <li>• {t('Location data for delivery services')}</li>
                </ul>
              </div>
            </div>
          </motion.section>

          {/* How We Use Information */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{t('How We Use Your Information')}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-r from-purple-50/50 to-violet-50/50 rounded-2xl border border-purple-200">
                <h4 className="font-semibold text-gray-900 mb-2">{t('Service Delivery')}</h4>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• {t('Process orders and deliveries')}</li>
                  <li>• {t('Provide customer support')}</li>
                  <li>• {t('Send order updates and notifications')}</li>
                </ul>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-orange-50/50 to-amber-50/50 rounded-2xl border border-orange-200">
                <h4 className="font-semibold text-gray-900 mb-2">{t('Service Improvement')}</h4>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• {t('Analyze usage patterns')}</li>
                  <li>• {t('Improve app functionality')}</li>
                  <li>• {t('Develop new features')}</li>
                </ul>
              </div>
            </div>
          </motion.section>

          {/* Data Protection */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-xl">
                <Lock className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{t('Data Protection')}</h3>
            </div>
            
            <div className="p-6 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-2xl border border-green-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">{t('Security Measures')}</h4>
                  <ul className="text-gray-700 space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      {t('End-to-end encryption for sensitive data')}
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      {t('Secure payment processing')}
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      {t('Regular security audits')}
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">{t('Data Retention')}</h4>
                  <ul className="text-gray-700 space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      {t('Account data: Until account deletion')}
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      {t('Order history: 7 years for tax purposes')}
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      {t('Analytics data: 2 years maximum')}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Your Rights */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-100 rounded-xl">
                <Eye className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{t('Your Rights')}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-r from-yellow-50/50 to-amber-50/50 rounded-2xl border border-yellow-200 text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Eye className="w-6 h-6 text-yellow-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('Access')}</h4>
                <p className="text-gray-700 text-sm">{t('View your personal data')}</p>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-2xl border border-blue-200 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('Correction')}</h4>
                <p className="text-gray-700 text-sm">{t('Update incorrect information')}</p>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-red-50/50 to-pink-50/50 rounded-2xl border border-red-200 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6 text-red-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('Deletion')}</h4>
                <p className="text-gray-700 text-sm">{t('Request data deletion')}</p>
              </div>
            </div>
          </motion.section>

          {/* Contact Information */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 rounded-xl">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{t('Contact Us')}</h3>
            </div>
            
            <div className="p-6 bg-gradient-to-r from-gray-50/50 to-slate-50/50 rounded-2xl border border-gray-200">
              <p className="text-gray-700 mb-4">{t('If you have any questions about this Privacy Policy or our data practices, please contact us:')}</p>
              <div className="space-y-2 text-sm">
                <p><span className="font-semibold">{t('Email:')}</span> privacy@rurallink.com</p>
                <p><span className="font-semibold">{t('Phone:')}</span> +94 11 234 5678</p>
                <p><span className="font-semibold">{t('Address:')}</span> 123 Main Street, Colombo, Sri Lanka</p>
              </div>
            </div>
          </motion.section>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center pt-6 border-t border-gray-200"
          >
            <p className="text-gray-500 text-sm">
              {t('This Privacy Policy is effective as of January 2025 and may be updated from time to time.')}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {t('We will notify you of any material changes via email or app notification.')}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
