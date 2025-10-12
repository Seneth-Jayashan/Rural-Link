import { useMemo } from 'react'
import { useCart } from '../../shared/CartContext.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import { FiTrash2, FiMinus, FiPlus, FiArrowRight, FiShoppingBag } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'
import { formatLKR } from '../../shared/currency.js'
import { getImageUrl } from '../../shared/api.js'

export default function Cart() {
  const { items, updateQty, removeItem, clear, subtotal, currentMerchant } = useCart()
  const navigate = useNavigate()
  const { t } = useI18n()

  const deliveryFee = useMemo(() => (subtotal > 5000 ? 0 : 500), [subtotal])
  const tax = useMemo(() => subtotal * 0.1, [subtotal])
  const total = useMemo(() => subtotal + deliveryFee + tax, [subtotal, deliveryFee, tax])

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-100/40 pb-24 mb-2">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-20 bg-white/80 backdrop-blur-md shadow-sm p-4 flex items-center gap-3"
      >
        <div className="p-2 bg-orange-100 rounded-xl">
          <FiShoppingBag className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t('Your Cart')}</h1>
          <p className="text-gray-500 text-xs">
            {items.length} {items.length !== 1 ? t('items') : t('item')}
          </p>
        </div>
      </motion.div>

      {/* Merchant Info */}
      {currentMerchant && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-3"
        >
          <div className="bg-white rounded-2xl shadow-md border border-orange-100 p-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
                <FiShoppingBag className="text-orange-600 w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{currentMerchant.businessName}</p>
                <p className="text-xs text-gray-500">{t('Single merchant order')}</p>
              </div>
            </div>
            <button
              onClick={clear}
              className="text-xs px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
            >
              {t('Clear')}
            </button>
          </div>
        </motion.div>
      )}

      {/* Empty Cart */}
      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center mt-32 text-center px-6"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-amber-200 rounded-3xl flex items-center justify-center shadow-md mb-6">
            <FiShoppingBag className="w-10 h-10 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700">{t('Your cart feels lonely')}</h3>
          <p className="text-sm text-gray-500 mb-5">{t('Add some amazing products to get started')}</p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-orange-500 text-white rounded-xl font-semibold shadow-md hover:bg-orange-600 transition"
            onClick={() => navigate('/')}
          >
            {t('Start Shopping')}
          </motion.button>
        </motion.div>
      ) : (
        <div className="px-4 mt-4 space-y-3">
          {/* Cart Items */}
          <AnimatePresence>
            {items.map(({ product, quantity }) => (
              <motion.div
                key={product._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="bg-white rounded-2xl p-3 shadow-md border border-orange-100 flex gap-3 items-center"
              >
                {/* Image */}
                <div className="relative">
                  {product.images?.length ? (
                    <img
                      src={getImageUrl(product.images[0].url)}
                      alt={product.name}
                      className="w-16 h-16 rounded-xl object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-orange-100" />
                  )}
                  <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {quantity}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-800 truncate">{product.name}</h3>
                  <p className="text-orange-600 font-semibold text-base">{formatLKR(product.price)}</p>
                </div>

                {/* Controls */}
                <div className="flex flex-col items-center gap-1">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center"
                    onClick={() => updateQty(product._id, quantity + 1)}
                  >
                    <FiPlus className="w-3 h-3 text-gray-600" />
                  </motion.button>

                  <span className="text-sm font-semibold">{quantity}</span>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center"
                    onClick={() => updateQty(product._id, quantity - 1)}
                  >
                    <FiMinus className="w-3 h-3 text-gray-600" />
                  </motion.button>
                </div>

                {/* Remove */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  className="ml-2 w-8 h-8 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 rounded-md"
                  onClick={() => removeItem(product._id)}
                >
                  <FiTrash2 className="w-4 h-4" />
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Summary (now scrollable with content) */}
          <div className="bg-white rounded-3xl shadow-md border border-orange-100 p-5 mt-4 space-y-3">
            <div className="w-12 h-1.5 bg-gray-300 mx-auto rounded-full mb-3" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>{t('Subtotal')}</span>
              <span className="font-medium text-gray-800">{formatLKR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{t('Delivery')}</span>
              <span className={`font-medium ${deliveryFee === 0 ? 'text-green-600' : 'text-gray-800'}`}>
                {deliveryFee === 0 ? t('FREE') : formatLKR(deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{t('Tax')}</span>
              <span className="font-medium text-gray-800">{formatLKR(tax)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="font-semibold text-gray-900">{t('Total')}</span>
              <span className="text-lg font-bold text-orange-600">{formatLKR(total)}</span>
            </div>

            <div className="flex gap-2 mt-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex-1 py-3 text-sm font-semibold border border-orange-300 text-orange-700 rounded-xl"
                onClick={clear}
              >
                {t('Clear')}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-500 text-white text-sm font-semibold rounded-xl shadow-md hover:bg-orange-600"
                onClick={() => navigate('/checkout')}
              >
                {t('Checkout')}
                <FiArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
