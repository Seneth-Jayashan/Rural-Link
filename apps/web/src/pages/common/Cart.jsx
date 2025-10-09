import { useMemo } from 'react'
import { useCart } from '../../shared/CartContext.jsx'
import { motion } from 'framer-motion'
import { FiTrash2, FiMinus, FiPlus, FiArrowRight } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

export default function Cart() {
  const { items, updateQty, removeItem, clear, subtotal } = useCart()
  const navigate = useNavigate()

  const deliveryFee = useMemo(() => subtotal > 50 ? 0 : 5, [subtotal])
  const tax = useMemo(() => subtotal * 0.1, [subtotal])
  const total = useMemo(() => subtotal + deliveryFee + tax, [subtotal, deliveryFee, tax])

  return (
    <div className="p-4 pb-20 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold mb-4 text-gray-900">Your Cart</h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
          <div className="text-xl mb-2">🛒</div>
          <span className="text-sm">Your cart is empty</span>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(({ product, quantity }) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-md p-3 flex items-center gap-4"
            >
              {Array.isArray(product.images) && product.images.length ? (
                <img
                  src={product.images[0].url}
                  alt={product.images[0].alt || product.name}
                  className="w-16 h-16 object-cover rounded-xl border"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-200" />
              )}

              <div className="flex-1">
                <div className="font-medium text-gray-900">{product.name}</div>
                <div className="text-sm text-gray-500">${product.price}</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition"
                  onClick={() => updateQty(product._id, quantity - 1)}
                >
                  <FiMinus />
                </button>
                <div className="w-8 text-center font-medium">{quantity}</div>
                <button
                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition"
                  onClick={() => updateQty(product._id, quantity + 1)}
                >
                  <FiPlus />
                </button>
              </div>

              <button
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                onClick={() => removeItem(product._id)}
              >
                <FiTrash2 />
              </button>
            </motion.div>
          ))}

          {/* Summary */}
          <div className="bg-white rounded-xl shadow-md p-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Delivery</span>
              <span className="font-medium text-gray-900">${deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Tax</span>
              <span className="font-medium text-gray-900">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-semibold text-gray-900">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-gray-700 font-medium hover:bg-gray-100 transition"
              onClick={clear}
            >
              Clear Cart
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.97 }}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white font-medium rounded-xl px-4 py-3 hover:bg-green-700 transition"
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout <FiArrowRight />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  )
}
