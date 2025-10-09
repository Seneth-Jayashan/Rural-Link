import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { get } from '../../shared/api.js'
import { Spinner } from '../../shared/ui/Spinner.jsx'

export default function OrderTracking(){
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  useEffect(()=>{
    const path = orderId === 'last' ? '/api/orders/last' : `/api/orders/${orderId}`
    get(path)
      .then(d=> setOrder(d.data))
      .catch(e=> setError(e.message))
  },[orderId])

  return (
    <div className="p-3 pb-16">
      <h1 className="text-lg font-semibold mb-2">Track Order</h1>
      {error && <div className="text-red-600">{error}</div>}
      {!order && !error && (
        <div className="flex items-center gap-2 text-gray-600"><Spinner size={18} /> Loading...</div>
      )}
      {order && (
        <div className="space-y-2">
          <div className="font-medium">Order {order.orderNumber}</div>
          <div className="text-sm">Status: {order.status}</div>
          <div className="text-sm text-gray-700">Total: ${order.total?.toFixed?.(2) || order.total}</div>
          <div>
            <div className="font-medium mb-1">Items</div>
            <div className="space-y-1">
              {order.items?.map((it, idx)=> (
                <div key={idx} className="text-xs text-gray-700 flex justify-between">
                  <span>{it.product?.name || 'Item'}</span>
                  <span>x{it.quantity} • ${it.total?.toFixed?.(2) || (it.price * it.quantity).toFixed?.(2)}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="font-medium mb-1">Timeline</div>
            <div className="space-y-1">
              {order.trackingHistory?.map((h,idx)=> (
                <div key={idx} className="text-xs text-gray-700">
                  {new Date(h.timestamp).toLocaleString()} — {h.status.replace('_',' ')} {h.note?`• ${h.note}`:''}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


