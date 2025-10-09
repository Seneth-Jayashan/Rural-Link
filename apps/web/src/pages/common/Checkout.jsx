import { useMemo, useState } from 'react'
import { useCart } from '../../shared/CartContext.jsx'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { motion } from 'framer-motion'
import { post } from '../../shared/api.js'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../shared/ui/Toast.jsx'

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

  async function placeOrder(){
    try{
      if(items.length === 0){ notify({ type:'error', title:'Cart empty' }); return }
      if(!address.street || !address.city || !address.state || !address.zipCode || !address.country){
        notify({ type:'error', title:'Address incomplete' }); return
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
      notify({ type:'success', title:'Order placed' })
      navigate('/track/last')
    }catch(err){
      notify({ type:'error', title:'Failed', message: err.message })
    }finally{ setSaving(false) }
  }

  return (
    <div className="p-3 pb-16">
      <h1 className="text-lg font-semibold mb-3 text-black">Checkout</h1>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-sm text-black mb-1">Name</label>
            <input className="w-full border border-gray-300 rounded p-2" value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-black mb-1">Phone</label>
            <input className="w-full border border-gray-300 rounded p-2" value={phone} onChange={e=>setPhone(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-sm text-black mb-1">Street</label>
            <input className="w-full border border-gray-300 rounded p-2" value={address.street} onChange={e=>setAddress(a=>({ ...a, street:e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm text-black mb-1">City</label>
            <input className="w-full border border-gray-300 rounded p-2" value={address.city} onChange={e=>setAddress(a=>({ ...a, city:e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm text-black mb-1">State</label>
            <input className="w-full border border-gray-300 rounded p-2" value={address.state} onChange={e=>setAddress(a=>({ ...a, state:e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm text-black mb-1">Zip Code</label>
            <input className="w-full border border-gray-300 rounded p-2" value={address.zipCode} onChange={e=>setAddress(a=>({ ...a, zipCode:e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm text-black mb-1">Country</label>
            <input className="w-full border border-gray-300 rounded p-2" value={address.country} onChange={e=>setAddress(a=>({ ...a, country:e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="block text-sm text-black mb-1">Payment Method</label>
          <select className="w-full border border-gray-300 rounded p-2" value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}>
            <option value="cash">Cash on Delivery</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-black mb-1">Delivery Instructions</label>
          <textarea className="w-full border border-gray-300 rounded p-2" rows={3} value={instructions} onChange={e=>setInstructions(e.target.value)} />
        </div>

        <div className="border rounded p-3 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-medium text-black">${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Delivery</span><span className="font-medium text-black">${deliveryFee.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Tax</span><span className="font-medium text-black">${tax.toFixed(2)}</span></div>
          <div className="flex justify-between pt-1 border-t"><span className="text-black font-semibold">Total</span><span className="font-semibold text-black">${total.toFixed(2)}</span></div>
        </div>

        <motion.button whileTap={{ scale:0.98 }} disabled={saving || items.length===0} className="w-full flex items-center justify-center gap-2 bg-green-600 text-white rounded p-3 font-semibold" onClick={placeOrder}>
          {saving ? 'Placing...' : 'Place Order'}
        </motion.button>
      </div>
    </div>
  )
}


