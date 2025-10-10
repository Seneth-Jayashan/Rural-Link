import { useEffect, useMemo, useState } from 'react'
import { get, post } from '../../shared/api.js'
import { useToast } from '../../shared/ui/Toast.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiPackage, FiClock, FiCheck, FiX, FiRotateCw,
  FiTruck, FiFilter, FiChevronLeft, FiChevronRight, FiChevronDown
} from 'react-icons/fi'

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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/40 p-4 pb-28 sm:pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto mb-4 sm:mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white rounded-2xl shadow-md border border-orange-100">
            <FiPackage className="w-6 h-6 text-orange-600" />
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


