import { useEffect, useState } from 'react'
import { get, post } from '../../shared/api.js'
import { motion } from 'framer-motion'
import { FiMapPin, FiTruck } from 'react-icons/fi'
import { useToast } from '../../shared/ui/Toast.jsx'

export default function DeliveryDashboard(){
  const [available, setAvailable] = useState([])

  async function load(){
    try{ const d = await get('/api/orders/available'); setAvailable(d.data||[]) }catch{}
  }
  useEffect(()=>{ load() },[])

  const { notify } = useToast()
  async function accept(order){
    await post(`/api/orders/${order._id}/accept`)
    notify({ type:'success', title:'Accepted', message:`Order ${order.orderNumber}` })
    load()
  }

  return (
    <div className="p-3 pb-16">
      <h1 className="text-lg font-semibold mb-3">Deliveries</h1>
      <div className="space-y-2">
        {available.map(o=> (
          <motion.div key={o._id} className="border rounded p-2" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
            <div className="font-medium">Order {o.orderNumber}</div>
            <div className="text-xs text-gray-500 flex items-center gap-2"><FiMapPin /> Items: {o.items?.length||0}</div>
            <motion.button whileTap={{ scale:0.98 }} className="mt-2 flex items-center gap-2 bg-green-600 text-white rounded px-3 py-1" onClick={()=>accept(o)}><FiTruck /> Accept</motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}


