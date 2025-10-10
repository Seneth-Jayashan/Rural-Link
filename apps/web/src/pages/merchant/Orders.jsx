import { useEffect, useState, useRef } from 'react'
import { get, post } from '../../shared/api.js'
import { useToast } from '../../shared/ui/Toast.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiPackage, FiClock, FiCheck, FiX, FiRotateCw,
  FiTruck, FiFilter, FiChevronLeft, FiChevronRight, FiChevronDown
} from 'react-icons/fi'

export default function MerchantOrders() {
  const { notify } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [rejectReason, setRejectReason] = useState('')
  const [busyId, setBusyId] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showFilter, setShowFilter] = useState(false)
  const filterRef = useRef(null)

  // ✅ Fixed data loading with proper query handling
  async function load() {
    try {
      setLoading(true)

      const params = new URLSearchParams({ page, limit: 10 })
      if (status !== 'all') params.append('status', status)

      const d = await get(`/api/orders/merchant?${params.toString()}`)
      setOrders(d.data || [])
      setTotalPages(d.pagination?.pages || 1)
    } catch (e) {
      notify({ type: 'error', title: 'Failed', message: e.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [status, page])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilter(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function updateStatus(id, nextStatus) {
    try {
      setBusyId(id)
      const body = nextStatus === 'cancelled'
        ? { status: nextStatus, reason: rejectReason }
        : { status: nextStatus }

      await post(`/api/orders/${id}/status`, body)
      notify({
        type: 'success',
        title: `Order ${nextStatus.replace('_', ' ')}`,
        message: 'Status updated successfully'
      })
      setRejectReason('')
      setSelectedOrder(null)
      load()
    } catch (e) {
      notify({ type: 'error', title: 'Failed', message: e.message })
    } finally {
      setBusyId('')
    }
  }

  const getStatusColor = (status) => ({
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    preparing: 'bg-orange-100 text-orange-800 border-orange-200',
    ready: 'bg-purple-100 text-purple-800 border-purple-200',
    picked_up: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    in_transit: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200'
  }[status] || 'bg-gray-100 text-gray-800 border-gray-200')

  const getStatusIcon = (status) => ({
    pending: <FiClock className="w-4 h-4" />,
    confirmed: <FiCheck className="w-4 h-4" />,
    preparing: <FiRotateCw className="w-4 h-4" />,
    ready: <FiPackage className="w-4 h-4" />,
    delivered: <FiTruck className="w-4 h-4" />,
    cancelled: <FiX className="w-4 h-4" />
  }[status] || <FiPackage className="w-4 h-4" />)

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
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600 text-sm mt-1">Track and manage restaurant orders easily</p>
          </div>
        </div>
      </motion.div>

      <div className="max-w-5xl mx-auto">
        {/* Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-4 sm:p-6 mb-5"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-xl">
                <FiFilter className="w-4 h-4 text-orange-600" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Filter Orders</h2>
            </div>

            {/* Dropdown */}
            <div ref={filterRef} className="relative w-full sm:w-72">
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="w-full flex items-center justify-between border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50/70 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
              >
                <div className="flex items-center gap-2 text-gray-700">
                  {{
                    all: <FiPackage className="w-4 h-4 text-orange-500" />,
                    pending: <FiClock className="w-4 h-4 text-yellow-500" />,
                    confirmed: <FiCheck className="w-4 h-4 text-blue-500" />,
                    preparing: <FiRotateCw className="w-4 h-4 text-orange-500" />,
                    ready: <FiPackage className="w-4 h-4 text-purple-500" />,
                    cancelled: <FiX className="w-4 h-4 text-red-500" />,
                    delivered: <FiTruck className="w-4 h-4 text-green-500" />
                  }[status] || <FiPackage className="w-4 h-4 text-gray-500" />}
                  <span className="font-medium capitalize">
                    {status.replace('_', ' ') || 'All Orders'}
                  </span>
                </div>
                <FiChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform ${showFilter ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {showFilter && (
                  <motion.ul
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-10 w-full bg-white border border-gray-200 rounded-2xl mt-2 shadow-lg overflow-hidden"
                  >
                    {[
                      { key: 'all', label: 'All Orders', icon: <FiPackage className="w-4 h-4 text-orange-500" /> },
                      { key: 'pending', label: 'Pending', icon: <FiClock className="w-4 h-4 text-yellow-500" /> },
                      { key: 'confirmed', label: 'Confirmed', icon: <FiCheck className="w-4 h-4 text-blue-500" /> },
                      { key: 'preparing', label: 'Preparing', icon: <FiRotateCw className="w-4 h-4 text-orange-500" /> },
                      { key: 'ready', label: 'Ready', icon: <FiPackage className="w-4 h-4 text-purple-500" /> },
                      { key: 'cancelled', label: 'Cancelled', icon: <FiX className="w-4 h-4 text-red-500" /> },
                      { key: 'delivered', label: 'Delivered', icon: <FiTruck className="w-4 h-4 text-green-500" /> }
                    ].map(opt => (
                      <li
                        key={opt.key}
                        onClick={() => {
                          setStatus(opt.key)
                          setPage(1)
                          setShowFilter(false)
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-orange-50 transition-all ${
                          status === opt.key ? 'bg-orange-100/70 font-semibold text-orange-700' : 'text-gray-700'
                        }`}
                      >
                        {opt.icon}
                        {opt.label}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="bg-white/80 rounded-3xl border border-orange-100 p-8 text-center shadow-lg">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && orders.length === 0 && (
          <div className="bg-white/90 rounded-3xl border border-orange-100 p-8 text-center shadow-lg">
            <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FiPackage className="w-7 h-7 text-orange-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No orders found</h3>
            <p className="text-gray-500 text-sm">There are no {status} orders right now.</p>
          </div>
        )}

        {/* Orders */}
        <AnimatePresence>
          {!loading && orders.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
            >
              {orders.map((o, index) => (
                <motion.div
                  key={o._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-3xl shadow-lg border border-orange-100 p-5 hover:shadow-xl transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">#{o.orderNumber}</h3>
                      <p className="text-gray-600 text-xs">
                        {new Date(o.createdAt).toLocaleDateString()} • {new Date(o.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full border text-xs font-medium flex items-center gap-2 ${getStatusColor(o.status)}`}>
                      {getStatusIcon(o.status)} {o.status.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>

                  {o.customer && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-200 mb-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 text-sm font-semibold">
                          {o.customer.firstName?.[0]}{o.customer.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{o.customer.firstName} {o.customer.lastName}</div>
                        {o.customer.phone && <div className="text-xs text-gray-600">{o.customer.phone}</div>}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 mb-3">
                    {o.items?.slice(0, 3).map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-3">
                          {it.product?.images?.[0]?.url ? (
                            <img
                              src={it.product.images[0].url}
                              alt={it.product.name}
                              className="w-10 h-10 object-cover rounded-lg border"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-orange-100 rounded-lg border" />
                          )}
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{it.product?.name}</div>
                            <div className="text-xs text-gray-500">Qty: {it.quantity}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900 text-sm">
                            LKR {it.total?.toFixed?.(2) || (it.price * it.quantity).toFixed?.(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {o.items?.length > 3 && (
                      <p className="text-center text-xs text-gray-500">+{o.items.length - 3} more items</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-2xl border border-orange-200 mb-3">
                    <span className="font-semibold text-gray-900 text-sm">Total</span>
                    <span className="text-lg font-bold text-orange-600">LKR {o.total?.toFixed?.(2) || o.total}</span>
                  </div>

                  <div className="space-y-2">
                    {o.status === 'pending' && (
                      <>
                        <button
                          disabled={busyId === o._id}
                          className="w-full py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 active:scale-95 transition-all disabled:opacity-50"
                          onClick={() => updateStatus(o._id, 'confirmed')}
                        >
                          {busyId === o._id ? 'Processing...' : 'Accept Order'}
                        </button>
                        <button
                          className="w-full py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 active:scale-95 transition-all"
                          onClick={() => setSelectedOrder(selectedOrder?._id === o._id ? null : o)}
                        >
                          Reject
                        </button>

                        {selectedOrder?._id === o._id && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                            <textarea
                              value={rejectReason}
                              onChange={e => setRejectReason(e.target.value)}
                              placeholder="Reason for rejection..."
                              className="w-full border border-gray-200 rounded-2xl p-3 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-200 outline-none"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <button
                                disabled={!rejectReason.trim()}
                                className="flex-1 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50"
                                onClick={() => updateStatus(o._id, 'cancelled')}
                              >
                                Confirm
                              </button>
                              <button
                                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
                                onClick={() => { setSelectedOrder(null); setRejectReason('') }}
                              >
                                Cancel
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </>
                    )}

                    {o.status === 'confirmed' && (
                      <button
                        disabled={busyId === o._id}
                        className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 active:scale-95 transition-all"
                        onClick={() => updateStatus(o._id, 'preparing')}
                      >
                        Start Preparing
                      </button>
                    )}

                    {o.status === 'preparing' && (
                      <button
                        disabled={busyId === o._id}
                        className="w-full py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 active:scale-95 transition-all"
                        onClick={() => updateStatus(o._id, 'ready')}
                      >
                        Mark as Ready
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 bg-white rounded-2xl shadow-lg border border-orange-100 p-4 text-sm">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="flex items-center gap-1 text-gray-700 font-medium hover:text-orange-600 disabled:opacity-50"
            >
              <FiChevronLeft /> Prev
            </button>
            <div className="text-gray-700">
              Page <span className="font-semibold text-orange-600">{page}</span> of{' '}
              <span className="font-semibold text-orange-600">{totalPages}</span>
            </div>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 text-gray-700 font-medium hover:text-orange-600 disabled:opacity-50"
            >
              Next <FiChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
