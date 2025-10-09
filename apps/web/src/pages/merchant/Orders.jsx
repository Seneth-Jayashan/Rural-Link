import { useEffect, useMemo, useState } from 'react'
import { get, post } from '../../shared/api.js'
import { useToast } from '../../shared/ui/Toast.jsx'

export default function MerchantOrders(){
  const { notify } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [rejectReason, setRejectReason] = useState('')
  const [busyId, setBusyId] = useState('')

  async function load(){
    try{
      setLoading(true)
      const d = await get(`/api/orders/merchant?status=${encodeURIComponent(status)}&page=${page}&limit=10`)
      setOrders(d.data || [])
      setTotalPages(d.pagination?.pages || 1)
    }catch(e){
      notify({ type:'error', title:'Failed', message:e.message })
    }finally{
      setLoading(false)
    }
  }

  useEffect(()=>{ load() }, [status, page])

  async function updateStatus(id, nextStatus){
    try{
      setBusyId(id)
      const body = nextStatus === 'cancelled' ? { status: nextStatus, reason: rejectReason } : { status: nextStatus }
      await post(`/api/orders/${id}/status`, body)
      notify({ type:'success', title:`Order ${nextStatus}` })
      setRejectReason('')
      load()
    }catch(e){
      notify({ type:'error', title:'Failed', message:e.message })
    }finally{
      setBusyId('')
    }
  }

  return (
    <div className="p-3 pb-16">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-semibold text-black">Orders</h1>
        <select className="border rounded p-2 text-sm" value={status} onChange={e=>{ setPage(1); setStatus(e.target.value) }}>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="cancelled">Cancelled</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      {loading && <div>Loading...</div>}

      {!loading && orders.length === 0 && (
        <div className="text-gray-600">No orders</div>
      )}

      <div className="space-y-3">
        {orders.map(o => (
          <div key={o._id} className="border rounded p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-black">{o.orderNumber}</div>
                <div className="text-xs text-gray-600">{new Date(o.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-sm font-medium text-black">${o.total?.toFixed?.(2) || o.total}</div>
            </div>
            <div className="mt-2 text-sm text-gray-700">
              {o.items?.slice(0,3).map((it, idx)=> (
                <span key={idx} className="mr-2">{it.product?.name} x{it.quantity}</span>
              ))}
              {o.items?.length > 3 && <span>+{o.items.length - 3} more</span>}
            </div>

            {o.status === 'pending' && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <button disabled={busyId===o._id} className="px-3 py-2 rounded bg-green-600 text-white text-sm" onClick={()=>updateStatus(o._id, 'confirmed')}>Accept</button>
                  <button disabled={busyId===o._id} className="px-3 py-2 rounded bg-red-600 text-white text-sm" onClick={()=>updateStatus(o._id, 'cancelled')}>Reject</button>
                </div>
                <input value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="Reason for rejection" className="w-full border rounded p-2 text-sm" />
              </div>
            )}

            {o.status === 'confirmed' && (
              <div className="mt-3 flex gap-2">
                <button disabled={busyId===o._id} className="px-3 py-2 rounded bg-blue-600 text-white text-sm" onClick={()=>updateStatus(o._id, 'preparing')}>Start Preparing</button>
              </div>
            )}

            {o.status === 'preparing' && (
              <div className="mt-3 flex gap-2">
                <button disabled={busyId===o._id} className="px-3 py-2 rounded bg-indigo-600 text-white text-sm" onClick={()=>updateStatus(o._id, 'ready')}>Mark Ready</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1 rounded border">Prev</button>
        <div>Page {page} / {totalPages}</div>
        <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} className="px-3 py-1 rounded border">Next</button>
      </div>
    </div>
  )
}


