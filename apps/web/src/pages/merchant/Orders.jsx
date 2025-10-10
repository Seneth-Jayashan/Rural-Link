import { useEffect, useMemo, useState } from 'react'
import { get, post } from '../../shared/api.js'
import { useToast } from '../../shared/ui/Toast.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPackage, FiClock, FiCheck, FiX, FiPlay, FiRotateCw, FiTruck, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

export default function MerchantOrders(){
  const { notify } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [rejectReason, setRejectReason] = useState('')
  const [busyId, setBusyId] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)

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
      notify({ type:'success', title:`Order ${nextStatus.replace('_', ' ')}`, message: 'Status updated successfully' })
      setRejectReason('')
      setSelectedOrder(null)
      load()
    }catch(e){
      notify({ type:'error', title:'Failed', message:e.message })
    }finally{
      setBusyId('')
    }
  }

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      preparing: 'bg-orange-100 text-orange-800 border-orange-200',
      ready: 'bg-purple-100 text-purple-800 border-purple-200',
      picked_up: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      in_transit: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    }
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusIcon = (status) => {
    const icons = {
      pending: <FiClock className="w-4 h-4" />,
      confirmed: <FiCheck className="w-4 h-4" />,
      preparing: <FiRotateCw className="w-4 h-4" />,
      ready: <FiPackage className="w-4 h-4" />,
      delivered: <FiTruck className="w-4 h-4" />,
      cancelled: <FiX className="w-4 h-4" />
    }
    return icons[status] || <FiPackage className="w-4 h-4" />
  }

  const statusSteps = [
    { key: 'pending', label: 'Pending', action: 'Accept' },
    { key: 'confirmed', label: 'Confirmed', action: 'Start Preparing' },
    { key: 'preparing', label: 'Preparing', action: 'Mark Ready' },
    { key: 'ready', label: 'Ready', action: null }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 p-4 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white rounded-2xl shadow-lg border border-orange-100">
            <FiPackage className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600 text-sm mt-1">Manage and track your restaurant orders</p>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto">
        {/* Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-xl">
                <FiFilter className="w-4 h-4 text-orange-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Filter Orders</h2>
            </div>
            
            <select 
              className="border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none appearance-none"
              value={status} 
              onChange={e=>{ setPage(1); setStatus(e.target.value) }}
            >
              <option value="pending">🕒 Pending Orders</option>
              <option value="confirmed">✅ Confirmed Orders</option>
              <option value="preparing">👨‍🍳 Preparing Orders</option>
              <option value="ready">📦 Ready Orders</option>
              <option value="cancelled">❌ Cancelled Orders</option>
              <option value="delivered">🚚 Delivered Orders</option>
            </select>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-8 text-center"
          >
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && orders.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-8 text-center"
          >
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiPackage className="w-8 h-8 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500 text-sm">There are no {status} orders at the moment</p>
          </motion.div>
        )}

        {/* Orders Grid */}
        <AnimatePresence>
          {!loading && orders.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {orders.map((o, index) => (
                <motion.div
                  key={o._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6 hover:shadow-xl transition-all duration-300"
                >
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">#{o.orderNumber}</h3>
                      <p className="text-gray-600 text-sm">
                        {new Date(o.createdAt).toLocaleDateString()} • {new Date(o.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full border text-sm font-medium flex items-center gap-2 ${getStatusColor(o.status)}`}>
                      {getStatusIcon(o.status)}
                      {o.status.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>

                  {/* Customer Info */}
                  {o.customer && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl border border-gray-200 mb-4">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 text-sm font-semibold">
                          {o.customer.firstName?.[0]}{o.customer.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {o.customer.firstName} {o.customer.lastName}
                        </div>
                        {o.customer.phone && (
                          <div className="text-xs text-gray-600">{o.customer.phone}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 text-sm mb-2">Order Items</h4>
                    <div className="space-y-2">
                      {o.items?.slice(0, 4).map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50/50 rounded-xl border border-gray-200">
                          <div className="flex items-center gap-3">
                            {it.product?.images?.[0]?.url ? (
                              <img
                                src={it.product.images[0].url}
                                alt={it.product.name}
                                className="w-10 h-10 object-cover rounded-lg border"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg border border-orange-200" />
                            )}
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{it.product?.name}</div>
                              <div className="text-xs text-gray-500">Qty: {it.quantity}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">${it.total?.toFixed?.(2) || (it.price * it.quantity).toFixed?.(2)}</div>
                            <div className="text-xs text-gray-500">${it.price?.toFixed(2)} each</div>
                          </div>
                        </div>
                      ))}
                      {o.items?.length > 4 && (
                        <div className="text-center py-2">
                          <span className="text-sm text-gray-500">
                            +{o.items.length - 4} more items
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Total */}
                  <div className="flex items-center justify-between p-3 bg-orange-50/50 rounded-2xl border border-orange-200 mb-4">
                    <span className="font-semibold text-gray-900">Total Amount</span>
                    <span className="text-xl font-bold text-orange-600">${o.total?.toFixed?.(2) || o.total}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {/* Pending Order Actions */}
                    {o.status === 'pending' && (
                      <>
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={busyId===o._id}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
                            onClick={()=>updateStatus(o._id, 'confirmed')}
                          >
                            {busyId===o._id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <FiCheck className="w-4 h-4" />
                            )}
                            Accept Order
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={busyId===o._id}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
                            onClick={() => setSelectedOrder(selectedOrder?._id === o._id ? null : o)}
                          >
                            <FiX className="w-4 h-4" />
                            Reject
                          </motion.button>
                        </div>

                        {/* Rejection Reason Input */}
                        {selectedOrder?._id === o._id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-2"
                          >
                            <textarea
                              value={rejectReason}
                              onChange={e=>setRejectReason(e.target.value)}
                              placeholder="Please provide a reason for rejection..."
                              className="w-full border border-gray-200 rounded-2xl p-3 text-sm bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none resize-none"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={busyId===o._id || !rejectReason.trim()}
                                className="flex-1 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 transition-all"
                                onClick={()=>updateStatus(o._id, 'cancelled')}
                              >
                                Confirm Rejection
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                                onClick={() => {
                                  setSelectedOrder(null)
                                  setRejectReason('')
                                }}
                              >
                                Cancel
                              </motion.button>
                            </div>
                          </motion.div>
                        )}
                      </>
                    )}

                    {/* Confirmed Order Actions */}
                    {o.status === 'confirmed' && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={busyId===o._id}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
                        onClick={()=>updateStatus(o._id, 'preparing')}
                      >
                        {busyId===o._id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <FiPlay className="w-4 h-4" />
                        )}
                        Start Preparing
                      </motion.button>
                    )}

                    {/* Preparing Order Actions */}
                    {o.status === 'preparing' && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={busyId===o._id}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
                        onClick={()=>updateStatus(o._id, 'ready')}
                      >
                        {busyId===o._id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <FiPackage className="w-4 h-4" />
                        )}
                        Mark as Ready
                      </motion.button>
                    )}

                    {/* Status Progress */}
                    {['pending', 'confirmed', 'preparing', 'ready'].includes(o.status) && (
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                          <span>Order Progress</span>
                          <span>{statusSteps.findIndex(s => s.key === o.status) + 1} of {statusSteps.length}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${((statusSteps.findIndex(s => s.key === o.status) + 1) / statusSteps.length) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mt-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-orange-100 p-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={page<=1}
              onClick={()=>setPage(p=>p-1)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <FiChevronLeft className="w-4 h-4" />
              Previous
            </motion.button>
            
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="font-semibold">Page</span>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg font-bold">{page}</span>
              <span className="text-gray-500">of {totalPages}</span>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={page>=totalPages}
              onClick={()=>setPage(p=>p+1)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
              <FiChevronRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  )
}