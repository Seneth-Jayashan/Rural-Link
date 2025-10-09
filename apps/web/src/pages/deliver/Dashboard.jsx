import { useEffect, useState } from 'react'
import { get, post } from '../../shared/api.js'
import { motion } from 'framer-motion'
import { FiMapPin, FiTruck, FiUser, FiPhone, FiCheckCircle } from 'react-icons/fi'
import { useToast } from '../../shared/ui/Toast.jsx'
import OrderChat from '../common/OrderChat.jsx'

export default function DeliveryDashboard(){
  const [available, setAvailable] = useState([])
  const [assigned, setAssigned] = useState([])

  async function load(){
    try{
      const [a, mine] = await Promise.all([
        get('/api/orders/available'),
        get('/api/orders/deliver')
      ])
      setAvailable(a.data||[])
      setAssigned(mine.data||[])
    }catch{}
  }
  useEffect(()=>{ load() },[])


  const { notify } = useToast()
  async function accept(order){
    await post(`/api/orders/${order._id}/accept`)
    notify({ type:'success', title:'Accepted', message:`Order ${order.orderNumber}` })
    load()
  }
  async function decline(order){
    await post(`/api/orders/${order._id}/decline`, { reason:'Not available' })
    notify({ type:'success', title:'Declined', message:`Order ${order.orderNumber}` })
    load()
  }
  async function startDelivery(order){
    await post(`/api/orders/${order._id}/delivery-status`, { status:'in_transit' })
    notify({ type:'success', title:'In transit', message:`Order ${order.orderNumber}` })
    load()
  }
  async function completeDelivery(order){
    await post(`/api/orders/${order._id}/delivery-status`, { status:'delivered' })
    notify({ type:'success', title:'Delivered', message:`Order ${order.orderNumber}` })
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
            <div className="mt-2 flex items-center gap-2">
              <motion.button whileTap={{ scale:0.98 }} className="flex items-center gap-2 bg-green-600 text-white rounded px-3 py-1" onClick={()=>accept(o)}><FiTruck /> Accept</motion.button>
              <motion.button whileTap={{ scale:0.98 }} className="flex items-center gap-2 bg-red-600 text-white rounded px-3 py-1" onClick={()=>decline(o)}>
                Decline
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mt-6 mb-2">My Deliveries</h2>
      <div className="space-y-2">
        {assigned.map(o=> (
          <motion.div key={o._id} className="border rounded p-3" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
            <div className="flex items-center justify-between">
              <div className="font-medium">Order {o.orderNumber}</div>
              <div className="text-xs text-gray-600">{o.status.replace('_',' ')}</div>
            </div>
            <div className="mt-1 text-sm text-gray-700">
              <div className="flex items-center gap-2"><FiUser /> {o.customer?.firstName} {o.customer?.lastName}</div>
              <div className="flex items-center gap-2"><FiPhone /> {o.customer?.phone || 'N/A'}</div>
              <div className="flex items-center gap-2"><FiMapPin /> {o.deliveryAddress?.street}, {o.deliveryAddress?.city}</div>
            </div>
            <div className="mt-2 text-xs text-gray-600">Items: {o.items?.map((it,idx)=> `${it.product?.name || 'Item'} x${it.quantity}`).join(', ')}</div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {o.status === 'picked_up' && (
                <motion.button whileTap={{ scale:0.98 }} className="flex items-center gap-2 bg-blue-600 text-white rounded px-3 py-1" onClick={()=>startDelivery(o)}>
                  <FiTruck /> Start Delivery
                </motion.button>
              )}
              {o.status === 'in_transit' && (
                <motion.button whileTap={{ scale:0.98 }} className="flex items-center gap-2 bg-green-600 text-white rounded px-3 py-1" onClick={()=>completeDelivery(o)}>
                  <FiCheckCircle /> Mark Delivered
                </motion.button>
              )}
            </div>
            {['picked_up','in_transit'].includes(o.status) && o.status !== 'delivered' && (
              <div className="mt-3">
                <div className="font-medium mb-1">Chat with customer</div>
                <OrderChat orderId={o._id} meId={o.deliveryPerson} />
              </div>
            )}
          </motion.div>
        ))}
        {assigned.length === 0 && (
          <div className="text-gray-600 text-sm">No assigned deliveries</div>
        )}
      </div>

    </div>
  )
}


