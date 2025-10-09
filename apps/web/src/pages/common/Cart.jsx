import { useMemo } from 'react'
import { useCart } from '../../shared/CartContext.jsx'
import { motion } from 'framer-motion'
import { FiTrash2, FiMinus, FiPlus, FiArrowRight } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

export default function Cart(){
  const { items, updateQty, removeItem, clear, subtotal } = useCart()
  const navigate = useNavigate()

  const deliveryFee = useMemo(()=> subtotal > 50 ? 0 : 5, [subtotal])
  const tax = useMemo(()=> subtotal * 0.1, [subtotal])
  const total = useMemo(()=> subtotal + deliveryFee + tax, [subtotal, deliveryFee, tax])

  return (
    <div className="p-3 pb-16">
      <h1 className="text-lg font-semibold mb-3 text-black">Your Cart</h1>

      {items.length === 0 ? (
        <div className="text-sm text-gray-500">Your cart is empty</div>
      ) : (
        <div className="space-y-3">
          {items.map(({ product, quantity })=> (
            <div key={product._id} className="border rounded p-2 flex items-center gap-3">
              {Array.isArray(product.images) && product.images.length ? (
                <img src={product.images[0].url} alt={product.images[0].alt||product.name} className="w-14 h-14 object-cover rounded border" />
              ) : (
                <div className="w-14 h-14 rounded bg-gray-100" />
              )}
              <div className="flex-1">
                <div className="font-medium text-black">{product.name}</div>
                <div className="text-xs text-gray-500">${product.price}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-2 py-1 border rounded" onClick={()=>updateQty(product._id, quantity-1)}><FiMinus /></button>
                <div className="w-8 text-center">{quantity}</div>
                <button className="px-2 py-1 border rounded" onClick={()=>updateQty(product._id, quantity+1)}><FiPlus /></button>
              </div>
              <button className="text-red-600" onClick={()=>removeItem(product._id)}><FiTrash2 /></button>
            </div>
          ))}

          <div className="border rounded p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-medium text-black">${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Delivery</span><span className="font-medium text-black">${deliveryFee.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Tax</span><span className="font-medium text-black">${tax.toFixed(2)}</span></div>
            <div className="flex justify-between pt-1 border-t"><span className="text-black font-semibold">Total</span><span className="font-semibold text-black">${total.toFixed(2)}</span></div>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex-1 border rounded px-3 py-2" onClick={clear}>Clear</button>
            <motion.button whileTap={{ scale:0.98 }} className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white rounded px-3 py-2" onClick={()=>navigate('/checkout')}>
              Proceed to Checkout <FiArrowRight />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  )
}


