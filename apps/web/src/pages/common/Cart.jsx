import { useMemo } from 'react'
import { useCart } from '../../shared/CartContext.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import { FiTrash2, FiMinus, FiPlus, FiArrowRight, FiShoppingBag } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'
import { formatLKR } from '../../shared/currency.js'

export default function Cart() {
  const { items, updateQty, removeItem, clear, subtotal } = useCart()
  const navigate = useNavigate()
  const { t } = useI18n()

  const deliveryFee = useMemo(() => subtotal > 5000 ? 0 : 500, [subtotal])
  const tax = useMemo(() => subtotal * 0.1, [subtotal])
  const total = useMemo(() => subtotal + deliveryFee + tax, [subtotal, deliveryFee, tax])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 p-4 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white rounded-2xl shadow-lg border border-orange-100">
            <FiShoppingBag className="w-6 h-6 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t('Your Cart')}</h1>
        </div>
        <p className="text-gray-600 text-sm">{items.length} {items.length !== 1 ? t('items') : t('item')} {t('in your cart')}</p>
      </motion.div>

      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center mt-20 text-center"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-amber-100 rounded-3xl flex items-center justify-center shadow-lg border border-orange-200 mb-6">
            <FiShoppingBag className="w-10 h-10 text-orange-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('Your cart feels lonely')}</h3>
          <p className="text-gray-500 text-sm mb-6">{t('Add some amazing products to get started')}</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium shadow-lg hover:bg-orange-600 hover:shadow-xl transition-all"
            onClick={() => navigate('/')}
          >
            {t('Start Shopping')}
          </motion.button>
        </motion.div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Cart Items */}
          <AnimatePresence>
            {items.map(({ product, quantity }) => (
              <motion.div
                key={product._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100, scale: 0.9 }}
                className="group bg-white rounded-2xl shadow-md hover:shadow-lg border border-orange-100 p-4 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  {/* Product Image */}
                  <div className="relative flex-shrink-0">
                    {Array.isArray(product.images) && product.images.length ? (
                      <img
                        src={product.images[0].url}
                        alt={product.images[0].alt || product.name}
                        className="w-20 h-20 object-cover rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-300 border border-gray-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 shadow-sm border border-orange-200" />
                    )}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                      {quantity}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                    <p className="text-orange-600 font-semibold text-lg">{formatLKR(product.price)}</p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors border border-gray-300"
                      onClick={() => updateQty(product._id, quantity - 1)}
                    >
                      <FiMinus className="w-3 h-3" />
                    </motion.button>
                    
                    <div className="w-8 text-center font-semibold text-gray-900">{quantity}</div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors border border-gray-300"
                      onClick={() => updateQty(product._id, quantity + 1)}
                    >
                      <FiPlus className="w-3 h-3" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-8 h-8 flex items-center justify-center bg-red-50 hover:bg-red-100 rounded-lg text-red-500 transition-colors ml-2 border border-red-200"
                      onClick={() => removeItem(product._id)}
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-md border border-orange-100 p-6 space-y-3"
          >
            <h3 className="font-semibold text-gray-900 mb-2 text-lg border-b border-gray-200 pb-2">{t('Order Summary')}</h3>
            
            <div className="flex justify-between">
              <span className="text-gray-600">{t('Subtotal')}</span>
              <span className="font-medium text-gray-900">{formatLKR(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('Delivery')}</span>
              <span className={`font-medium ${deliveryFee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                {deliveryFee === 0 ? t('FREE') : formatLKR(deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('Tax')}</span>
              <span className="font-medium text-gray-900">{formatLKR(tax)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="font-semibold text-gray-900">{t('Total')}</span>
              <span className="font-bold text-orange-600">{formatLKR(total)}</span>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row gap-3 mt-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-6 py-3 border-2 border-orange-300 text-orange-700 font-semibold rounded-xl hover:border-orange-400 transition-all shadow-sm"
              onClick={clear}
            >
              {t('Clear Cart')}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: "#ea580c" }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all shadow-md"
              onClick={() => navigate('/checkout')}
            >
              {t('Proceed to Checkout')} <FiArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
