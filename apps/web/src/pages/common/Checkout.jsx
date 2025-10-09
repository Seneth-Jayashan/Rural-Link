import { useMemo, useState } from 'react'
import { useCart } from '../../shared/CartContext.jsx'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import { post } from '../../shared/api.js'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../shared/ui/Toast.jsx'
import { FiMapPin, FiPhone, FiUser, FiCreditCard, FiMessageSquare, FiArrowLeft, FiCheck } from 'react-icons/fi'

export default function Checkout(){
  const { items, subtotal, clear } = useCart()
  const { user } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()

  const [name, setName] = useState(`${user?.firstName || ''} ${user?.lastName || ''}`.trim())
  const [phone, setPhone] = useState(user?.phone || '')
  const [address, setAddress] = useState({
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || '',
    country: user?.address?.country || ''
  })
  const [instructions, setInstructions] = useState('')
  const [saving, setSaving] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash')

  const deliveryFee = useMemo(()=> subtotal > 50 ? 0 : 5, [subtotal])
  const tax = useMemo(()=> subtotal * 0.1, [subtotal])
  const total = useMemo(()=> subtotal + deliveryFee + tax, [subtotal, deliveryFee, tax])

  const isFormValid = address.street && address.city && address.state && address.zipCode && address.country && name && phone

  async function placeOrder(){
    try{
      if(items.length === 0){ notify({ type:'error', title:'Cart empty' }); return }
      if(!isFormValid){
        notify({ type:'error', title:'Please fill all required fields' }); return
      }
      setSaving(true)
      const payload = {
        items: items.map(it => ({ product: it.product._id, quantity: it.quantity })),
        deliveryAddress: address,
        paymentMethod,
        specialInstructions: instructions,
        contact: { name, phone }
      }
      await post('/api/orders', payload)
      clear()
      notify({ type:'success', title:'Order placed successfully!' })
      navigate('/track/last')
    }catch(err){
      notify({ type:'error', title:'Failed to place order', message: err.message })
    }finally{ setSaving(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 p-4 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-white rounded-2xl shadow-lg border border-orange-100 hover:shadow-xl transition-all"
          >
            <FiArrowLeft className="w-5 h-5 text-orange-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            <p className="text-gray-600 text-sm mt-1">Complete your order</p>
          </div>
        </div>
      </motion.div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-orange-100 rounded-xl">
              <FiUser className="w-4 h-4 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                  value={name} 
                  onChange={e=>setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                  value={phone} 
                  onChange={e=>setPhone(e.target.value)}
                  placeholder="Your phone number"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Delivery Address */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-orange-100 rounded-xl">
              <FiMapPin className="w-4 h-4 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Delivery Address</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
              <input 
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                value={address.street} 
                onChange={e=>setAddress(a=>({ ...a, street:e.target.value }))}
                placeholder="Enter street address"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
              <input 
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                value={address.city} 
                onChange={e=>setAddress(a=>({ ...a, city:e.target.value }))}
                placeholder="City"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
              <input 
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                value={address.state} 
                onChange={e=>setAddress(a=>({ ...a, state:e.target.value }))}
                placeholder="State"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code *</label>
              <input 
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                value={address.zipCode} 
                onChange={e=>setAddress(a=>({ ...a, zipCode:e.target.value }))}
                placeholder="Zip code"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
              <input 
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                value={address.country} 
                onChange={e=>setAddress(a=>({ ...a, country:e.target.value }))}
                placeholder="Country"
              />
            </div>
          </div>
        </motion.div>

        {/* Payment Method */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-orange-100 rounded-xl">
              <FiCreditCard className="w-4 h-4 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
          </div>
          
          <select 
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none appearance-none"
            value={paymentMethod} 
            onChange={e=>setPaymentMethod(e.target.value)}
          >
            <option value="cash">💵 Cash on Delivery</option>
          </select>
        </motion.div>

        {/* Delivery Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-orange-100 rounded-xl">
              <FiMessageSquare className="w-4 h-4 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Delivery Instructions</h2>
          </div>
          
          <textarea 
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none resize-none"
            rows={3} 
            value={instructions} 
            onChange={e=>setInstructions(e.target.value)}
            placeholder="Any special delivery instructions? (optional)"
          />
        </motion.div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Subtotal ({items.length} items)</span>
              <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Delivery</span>
              <span className={`font-medium ${deliveryFee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                {deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium text-gray-900">${tax.toFixed(2)}</span>
            </div>
            
            <div className="border-t border-gray-200 pt-3 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900 text-lg">Total</span>
                <span className="font-bold text-xl text-orange-600">${total.toFixed(2)}</span>
              </div>
              
              {subtotal < 50 && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-orange-600 mt-3 text-center bg-orange-50 py-2 rounded-xl border border-orange-200"
                >
                  🚚 Add <span className="font-semibold">${(50 - subtotal).toFixed(2)}</span> more for free delivery!
                </motion.p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Place Order Button */}
        <motion.button 
          whileHover={{ scale: isFormValid && !saving ? 1.02 : 1 }}
          whileTap={{ scale: isFormValid && !saving ? 0.98 : 1 }}
          disabled={saving || items.length === 0 || !isFormValid}
          className={`w-full flex items-center justify-center gap-3 rounded-2xl py-4 font-semibold text-lg shadow-lg transition-all ${
            isFormValid && !saving && items.length > 0
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-xl hover:from-orange-600 hover:to-amber-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          onClick={placeOrder}
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Placing Order...
            </>
          ) : (
            <>
              <FiCheck className="w-5 h-5" />
              Place Order - ${total.toFixed(2)}
            </>
          )}
        </motion.button>

        {/* Item Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-sm text-gray-500"
        >
          {items.length} item{items.length !== 1 ? 's' : ''} in your order
        </motion.div>
      </div>
    </div>
  )
}