import { useEffect, useState } from 'react'
import { get } from '../../shared/api.js'
import { Spinner } from '../../shared/ui/Spinner.jsx'
// Chat/Call removed

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

  useEffect(()=>{
    let mounted = true
    get('/api/orders/me')
      .then((d)=>{ if(mounted){ setOrders(d.data||[]); setLoading(false) } })
      .catch((e)=>{ if(mounted){ setError(e.message||'Failed to load orders'); setLoading(false) } })
    return ()=>{ mounted = false }
  },[])

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

            {/* Communication with delivery person removed */}
          </div>
        ))}
      </div>
    </div>
  )
}
