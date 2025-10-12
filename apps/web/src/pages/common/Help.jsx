import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'
import { 
  ArrowLeft, 
  HelpCircle, 
  MessageCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  ChevronDown,
  ChevronUp,
  Search,
  FileText,
  Smartphone,
  CreditCard,
  Truck,
  User,
  Settings
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { IoLogoWhatsapp } from "react-icons/io";

export default function Help() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFAQ, setExpandedFAQ] = useState(null)

  const faqs = [
    {
      id: 1,
      question: t('How do I place an order?'),
      answer: t('To place an order, browse our products, add items to your cart, select your delivery address, choose payment method, and confirm your order. You\'ll receive real-time updates on your order status.')
    },
    {
      id: 2,
      question: t('What payment methods do you accept?'),
      answer: t('We accept cash on delivery.')
    },
    {
      id: 3,
      question: t('How long does delivery take?'),
      answer: t('Delivery times vary by location. Urban areas typically receive orders within 30-60 minutes, while rural areas may take 1-3 hours. You can track your order in real-time through the app.')
    },
    {
      id: 4,
      question: t('Can I cancel my order?'),
      answer: t('No, You cannot cancel an order once it has been placed. However, you can refuse the delivery when the delivery person arrives. Please note that refusing a delivery may incur a fee.')
    },
    {
      id: 5,
      question: t('How do I track my order?'),
      answer: t('You can track your order in real-time through the "Track Orders" section in the app. You\'ll see the delivery person\'s location and estimated arrival time.')
    },
    {
      id: 6,
      question: t('What if I have a complaint?'),
      answer: t('We take complaints seriously. You can contact us through the app\'s chat feature, email us at support@rurallink.com, or call our customer service hotline.')
    },
    {
      id: 7,
      question: t('How do I update my delivery address?'),
      answer: t('Go to your profile, select "Edit Profile", and update your address information. You can also add multiple addresses for different delivery locations.')
    },
    {
      id: 8,
      question: t('Is my personal information safe?'),
      answer: t('Yes, we use industry-standard encryption to protect your personal information. We never share your data with third parties without your consent. Read our Privacy Policy for more details.')
    }
  ]

  const contactMethods = [
    {
      icon: MessageCircle,
      title: t('Live Chat'),
      description: t('Chat with our support team via Whatsapp'),
      availability: t('24/7 Available'),
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-200'
    },
    {
      icon: Phone,
      title: t('Phone Support'),
      description: t('Call our support hotline'),
      availability: t('Mon-Fri 8AM-8PM'),
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-200'
    },
    {
      icon: Mail,
      title: t('Email Support'),
      description: t('Send us an email'),
      availability: t('Response within 24h'),
      color: 'from-purple-500 to-violet-500',
      bgColor: 'from-purple-50 to-violet-50',
      borderColor: 'border-purple-200'
    }
  ]

  const quickActions = [
    {
      icon: FileText,
      title: t('Order History'),
      description: t('View past orders'),
      action: () => navigate('/orders')
    },
    {
      icon: User,
      title: t('Account Settings'),
      description: t('Manage your profile'),
      action: () => navigate('/account')
    },
    {
      icon: Truck,
      title: t('Track Orders'),
      description: t('Track current orders'),
      action: () => navigate('/track')
    },
    {
      icon: Settings,
      title: t('App Settings'),
      description: t('Customize app preferences'),
      action: () => navigate('/account')
    }
  ]

  const filteredFAQs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
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
              <h1 className="text-2xl font-bold text-gray-900">{t('Help & Support')}</h1>
              <p className="text-gray-600 text-sm mt-1">{t('Get help with your account and orders')}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto p-4 pb-24 space-y-6">
        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-xl">
              <Search className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{t('Search Help')}</h2>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('Search for help topics...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
            />
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Smartphone className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{t('Quick Actions')}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={action.action}
                className="p-4 bg-gradient-to-r from-gray-50/50 to-slate-50/50 rounded-2xl border border-gray-200 hover:border-orange-200 hover:bg-orange-50/50 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-xl">
                    <action.icon className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{action.title}</h3>
                    <p className="text-gray-600 text-sm">{action.description}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Contact Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-xl">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{t('Contact Support')}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contactMethods.map((method, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                className={`p-4 bg-gradient-to-r ${method.bgColor} rounded-2xl border ${method.borderColor} hover:shadow-lg transition-all`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 bg-gradient-to-r ${method.color} rounded-xl`}>
                    <method.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{method.title}</h3>
                    <p className="text-gray-600 text-sm">{method.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{method.availability}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-xl">
              <HelpCircle className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{t('Frequently Asked Questions')}</h2>
          </div>
          
          <div className="space-y-3">
            <AnimatePresence>
              {filteredFAQs.map((faq) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border border-gray-200 rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                    className="w-full p-4 text-left bg-gradient-to-r from-gray-50/50 to-slate-50/50 hover:from-orange-50/50 hover:to-amber-50/50 transition-all flex items-center justify-between"
                  >
                    <span className="font-semibold text-gray-900">{faq.question}</span>
                    {expandedFAQ === faq.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {expandedFAQ === faq.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-white border-t border-gray-200">
                          <p className="text-gray-700">{faq.answer}</p>
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
          transition={{ delay: 0.4 }}
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
                  <p className="text-gray-600 text-sm">support@rurallink.com</p>
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
        </motion.div>
      </div>
    </div>
  )
}
