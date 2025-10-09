import { useEffect, useState } from 'react'
import { get } from '../../shared/api.js'
import { Spinner } from '../../shared/ui/Spinner.jsx'
import { getSocket, authenticate, onOrderMessage } from '../../shared/socket.js'

function Timeline({ status, history }){
  const steps = ['pending','confirmed','preparing','ready','picked_up','in_transit','delivered']
  const currentIdx = Math.max(0, steps.indexOf(status))
  return (
    <div>
      <div className="flex items-center gap-2 overflow-x-auto py-2">
        {steps.map((s, idx)=>{
          const done = idx <= currentIdx
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 ${done? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-2.5 h-2.5 rounded-full ${done? 'bg-green-600' : 'bg-gray-300'}`}></div>
                <div className="text-xs whitespace-nowrap">{s.replace('_',' ')}</div>
              </div>
              {idx < steps.length-1 && (
                <div className={`h-0.5 w-8 ${idx < currentIdx ? 'bg-green-600' : 'bg-gray-300'}`}></div>
              )}
            </div>
          )
        })}
      </div>
      <div className="space-y-1 mt-2">
        {history?.map((h,idx)=> (
          <div key={idx} className="text-xs text-gray-700">
            {new Date(h.timestamp).toLocaleString()} — {h.status.replace('_',' ')} {h.note?`• ${h.note}`:''}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TrackAll(){
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newMessages, setNewMessages] = useState({}) // orderId -> count of new messages

  useEffect(()=>{
    let mounted = true
    get('/api/orders/me')
      .then((d)=>{ 
        if(mounted){ 
          setOrders(d.data||[]); 
          setLoading(false) 
        } 
      })
      .catch((e)=>{ 
        if(mounted){ 
          setError(e.message||'Failed to load orders'); 
          setLoading(false) 
        } 
      })
    return ()=>{ mounted = false }
  },[])

  // Initialize socket and listen for new messages
  useEffect(()=>{
    getSocket()
    authenticate()
    
    const offMessage = onOrderMessage((message) => {
      // Check if this message is for one of our orders
      const orderExists = orders.some(order => order._id === message.orderId)
      if (orderExists) {
        setNewMessages(prev => ({
          ...prev,
          [message.orderId]: (prev[message.orderId] || 0) + 1
        }))
      }
    })
    
    return () => {
      if (offMessage) offMessage()
    }
  }, [orders])

  // Clear notification when user clicks on chat
  const clearNotification = (orderId) => {
    setNewMessages(prev => {
      const updated = { ...prev }
      delete updated[orderId]
      return updated
    })
  }

  if (loading) return (
    <div className="p-3"><div className="flex items-center gap-2 text-gray-600"><Spinner size={18} /> Loading your orders...</div></div>
  )
  if (error) return <div className="p-3 text-red-600">{error}</div>

  return (
    <div className="p-3 pb-16">
      <h1 className="text-lg font-semibold mb-3">Track All Orders</h1>

      {orders.length === 0 && (
        <div className="text-gray-600 text-sm">You have no orders yet.</div>
      )}

      <div className="space-y-4">
        {orders.map((o)=> (
          <div key={o._id} className="border rounded p-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">Order {o.orderNumber}</div>
              <div className="text-xs text-gray-600">{(o.status||'').replace('_',' ')}</div>
            </div>
            <div className="mt-1 text-sm text-gray-700 flex flex-wrap gap-x-4 gap-y-1">
              <div>Total: ${o.total?.toFixed?.(2) || o.total}</div>
              <div>Items: {o.items?.length || 0}</div>
              {o.deliveryPerson && (
                <div>Courier: {o.deliveryPerson?.firstName} {o.deliveryPerson?.lastName}</div>
              )}
            </div>

            <div className="mt-3">
              <Timeline status={o.status} history={o.trackingHistory} />
            </div>

            {/* Review link for delivered orders */}
            {(((o?.status||'')+'').toLowerCase().replace(/\s+/g,'_').trim() === 'delivered') && (
              <div className="mt-2">
                <a href={`/track/${o._id}#reviews`} className="text-green-700 underline text-sm">Review</a>
              </div>
            )}

            {/* Chat button for orders with delivery person (not delivered) */}
            {o.deliveryPerson && ['picked_up', 'in_transit'].includes(o.status) && o.status !== 'delivered' && (
              <div className="mt-3">
                <a 
                  href={`/track/${o._id}`} 
                  onClick={() => clearNotification(o._id)}
                  className={`inline-block px-3 py-1 text-sm rounded relative ${
                    newMessages[o._id] ? 'bg-orange-500 text-white animate-pulse' : 'bg-blue-600 text-white'
                  }`}
                >
                  View full chat
                  {newMessages[o._id] && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {newMessages[o._id]}
                    </span>
                  )}
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
