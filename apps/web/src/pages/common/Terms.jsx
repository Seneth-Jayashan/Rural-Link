import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'
import { 
  ArrowLeft, 
  FileText, 
  Shield, 
  Users, 
  CreditCard, 
  Truck, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Scale,
  Lock,
  Eye,
  Phone,
  Mail,
  MapPin,
  Clock
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { IoLogoWhatsapp } from "react-icons/io";

export default function Terms() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSection, setExpandedSection] = useState(null)

  const termsSections = [
    {
      id: 1,
      title: t('Acceptance of Terms'),
      icon: Scale,
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-200',
      content: t('By accessing and using Rural Link, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.')
    },
    {
      id: 2,
      title: t('User Responsibilities'),
      icon: Users,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-200',
      content: t('Users are responsible for providing accurate information, maintaining account security, and using the service in compliance with applicable laws. Users must not engage in fraudulent activities, abuse the platform, or violate any terms of service.')
    },
    {
      id: 3,
      title: t('Payment Terms'),
      icon: CreditCard,
      color: 'from-purple-500 to-violet-500',
      bgColor: 'from-purple-50 to-violet-50',
      borderColor: 'border-purple-200',
      content: t('All payments are processed securely. We accept cash on delivery. Prices are subject to change without notice. Refunds are processed according to our refund policy. Users are responsible for all applicable taxes.')
    },
    {
      id: 4,
      title: t('Delivery Terms'),
      icon: Truck,
      color: 'from-orange-500 to-amber-500',
      bgColor: 'from-orange-50 to-amber-50',
      borderColor: 'border-orange-200',
      content: t('Delivery times may vary based on location and availability. We are not responsible for delays due to weather, traffic, or other circumstances beyond our control. Delivery fees may apply based on distance and order value.')
    },
    {
      id: 5,
      title: t('Privacy and Data Protection'),
      icon: Lock,
      color: 'from-red-500 to-pink-500',
      bgColor: 'from-red-50 to-pink-50',
      borderColor: 'border-red-200',
      content: t('We collect and process personal data in accordance with our Privacy Policy. We implement appropriate security measures to protect your information. We do not sell personal data to third parties without consent.')
    },
    {
      id: 6,
      title: t('Limitation of Liability'),
      icon: AlertCircle,
      color: 'from-gray-500 to-slate-500',
      bgColor: 'from-gray-50 to-slate-50',
      borderColor: 'border-gray-200',
      content: t('Rural Link shall not be liable for any indirect, incidental, special, consequential, or punitive damages. Our total liability shall not exceed the amount paid by you for the services in the 12 months preceding the claim.')
    },
    {
      id: 7,
      title: t('Intellectual Property'),
      icon: Eye,
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'from-indigo-50 to-blue-50',
      borderColor: 'border-indigo-200',
      content: t('All content, trademarks, and intellectual property on Rural Link are owned by us or our licensors. Users may not reproduce, distribute, or create derivative works without permission.')
    },
    {
      id: 8,
      title: t('Termination'),
      icon: Shield,
      color: 'from-teal-500 to-cyan-500',
      bgColor: 'from-teal-50 to-cyan-50',
      borderColor: 'border-teal-200',
      content: t('We reserve the right to terminate or suspend your account at any time for violation of these terms. Users may terminate their account at any time by contacting customer support.')
    }
  ]

  const filteredSections = termsSections.filter(section => 
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 mb-4">
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
              <h1 className="text-2xl font-bold text-gray-900">{t('Terms and Conditions')}</h1>
              <p className="text-gray-600 text-sm mt-1">{t('Please read these terms carefully before using Rural Link')}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto p-4 pb-24 space-y-6">
        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-xl">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{t('Introduction')}</h2>
          </div>
          
          <p className="text-gray-700 leading-relaxed">
            {t('Welcome to Rural Link. These Terms and Conditions govern your use of our mobile application and services. By using our app, you agree to be bound by these terms. Please read them carefully.')}
          </p>
          
          <div className="mt-4 p-4 bg-orange-50 rounded-2xl border border-orange-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-orange-800 text-sm">{t('Important Notice')}</p>
                <p className="text-orange-700 text-sm mt-1">
                  {t('These terms may be updated from time to time. Continued use of the service after changes constitutes acceptance of the new terms.')}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Search className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{t('Search Terms')}</h2>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('Search for specific terms...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
            />
          </div>
        </motion.div>

        {/* Terms Sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-xl">
              <Scale className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{t('Terms Sections')}</h2>
          </div>
          
          <div className="space-y-3">
            <AnimatePresence>
              {filteredSections.map((section) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border border-gray-200 rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                    className={`w-full p-4 text-left bg-gradient-to-r ${section.bgColor} hover:shadow-lg transition-all flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-gradient-to-r ${section.color} rounded-xl`}>
                        <section.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold text-gray-900">{section.title}</span>
                    </div>
                    {expandedSection === section.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {expandedSection === section.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-white border-t border-gray-200">
                          <p className="text-gray-700 leading-relaxed">{section.content}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 rounded-xl">
              <MapPin className="w-5 h-5 text-gray-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{t('Contact Information')}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t('Phone')}</p>
                  <p className="text-gray-600 text-sm">+94 11 234 5678</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 rounded-xl">
                                <IoLogoWhatsapp className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{t('Whatsapp')}</p>
                                <p className="text-gray-600 text-sm">+94 70 234 5678</p>
                              </div>
                            </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-xl">
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t('Email')}</p>
                  <p className="text-gray-600 text-sm">legal@rurallink.com</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t('Business Hours')}</p>
                  <p className="text-gray-600 text-sm">{t('Mon-Fri: 8AM-8PM')}</p>
                  <p className="text-gray-600 text-sm">{t('Sat-Sun: 9AM-6PM')}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <MapPin className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t('Address')}</p>
                  <p className="text-gray-600 text-sm">123 Main Street</p>
                  <p className="text-gray-600 text-sm">Colombo, Sri Lanka</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <p className="text-gray-700 text-sm text-center">
              {t('For questions about these terms, please contact our legal team at legal@rurallink.com or call +94 11 234 5678.')}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}


