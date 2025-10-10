import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { get, del, getImageUrl } from '../../shared/api.js'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiTrash2, FiEdit2, FiPackage, FiSearch, FiFilter, FiBox, FiDollarSign, FiActivity } from 'react-icons/fi'
import { useToast } from '../../shared/ui/Toast.jsx'
import { Spinner } from '../../shared/ui/Spinner.jsx'

export default function ProductsList(){
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const { notify } = useToast()
  const navigate = useNavigate()

  async function load(){
    try{
      setLoading(true)
      const d = await get('/api/products')
      setProducts(d.data||[])
    }catch(err){
      notify({ type:'error', title:'Failed to load products', message: err.message })
    }finally{
      setLoading(false)
    }
  }

  useEffect(()=>{ load() },[])

  async function remove(id){
    if(!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return
    try{
      await del(`/api/products/${id}`)
      notify({ type:'success', title:'Product Deleted', message: 'Product has been removed successfully' })
      setProducts(prev => prev.filter(p => p._id !== id))
    }catch(err){
      notify({ type:'error', title:'Delete Failed', message: err.message })
    }
  }

  // Filter products based on search and status
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.category?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'in' && product.stock > 0) ||
      (filterStatus === 'out' && product.stock === 0)
    return matchesSearch && matchesStatus
  })

  const getStockColor = (stock) => {
    if (stock === 0) return 'text-red-600 bg-red-50 border-red-200'
    if (stock <= 10) return 'text-orange-600 bg-orange-50 border-orange-200'
    return 'text-green-600 bg-green-50 border-green-200'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 p-4 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto mb-4"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white rounded-2xl shadow-lg border border-orange-100">
            <FiPackage className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Product Catalog</h1>
            <p className="text-gray-600 text-sm mt-1">Manage your product inventory</p>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto">
        {/* Stats Cards - Mobile Friendly */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex overflow-x-auto gap-3 pb-2 scrollbar-hide"
        >
          {/* Total Products */}
          <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-orange-100 p-3 text-center min-w-[100px]">
            <div className="text-lg font-bold text-orange-600">{products.length}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          {/* In Stock */}
          <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-orange-100 p-3 text-center min-w-[100px]">
            <div className="text-lg font-bold text-green-600">
              {products.filter(p => p.stock > 0).length}
            </div>
            <div className="text-xs text-gray-600">In Stock</div>
          </div>
          {/* Out of Stock */}
          <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-orange-100 p-3 text-center min-w-[100px]">
            <div className="text-lg font-bold text-red-600">
              {products.filter(p => p.stock === 0).length}
            </div>
            <div className="text-xs text-gray-600">Out of Stock</div>
          </div>
        </motion.div>

        {/* Search and Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-4 mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between"
        >
          {/* Search Input */}
          <div className="flex-1 w-full sm:w-auto">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 border border-gray-200 rounded-2xl pl-10 pr-4 py-2 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
              />
            </div>
          </div>

          {/* Filter and Add Button */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Status Filter */}
            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-200 rounded-2xl pl-10 pr-4 py-2 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none appearance-none"
              >
                <option value="all">All</option>
                <option value="in">In Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>

            {/* Add Product Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/merchant/products/new')}
              className="flex items-center justify-center gap-2 bg-orange-500 text-white rounded-2xl px-4 py-2 font-semibold hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl"
            >
              <FiPlus className="w-4 h-4" />
              Add Product
            </motion.button>
          </div>
        </motion.div>

        {/* Loading */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6 text-center"
          >
            <Spinner size={48} className="text-orange-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading your products...</p>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6 text-center"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiPackage className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {products.length === 0 ? 'No products yet' : 'No products found'}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {products.length === 0 
                ? 'Get started by adding your first product.' 
                : 'Try adjusting your search or filter.'}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/merchant/products/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              Add Product
            </motion.button>
          </motion.div>
        )}

        {/* Products Grid */}
        <AnimatePresence>
          {!loading && filteredProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredProducts.map((p, index) => {
                const firstImg = Array.isArray(p.images) && p.images.length ? p.images[0] : null
                return (
                  <motion.div
                    key={p._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -3, scale: 1.02 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-orange-100 overflow-hidden hover:shadow-xl transition-all duration-300 group"
                  >
                    {/* Image */}
                    <div 
                      className="relative h-40 sm:h-48 bg-gradient-to-br from-orange-50 to-amber-50 cursor-pointer overflow-hidden"
                      onClick={() => navigate(`/merchant/products/${p._id}`)}
                    >
                      {firstImg ? (
                        <img 
                          src={getImageUrl(firstImg.url)} 
                          alt={firstImg.alt || p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FiPackage className="w-10 h-10 text-orange-300" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <div className={`px-2 py-1 rounded-full border text-xs font-medium ${getStockColor(p.stock)}`}>
                          <FiBox className="w-3 h-3 inline mr-1" />
                          {p.stock} in stock
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3 
                        className="font-semibold text-gray-900 text-base mb-1 cursor-pointer hover:text-orange-600 line-clamp-2"
                        onClick={() => navigate(`/merchant/products/${p._id}`)}
                      >
                        {p.name}
                      </h3>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1 text-gray-600">
                          <span className="font-semibold text-gray-900 text-sm">LKR {p.price?.toFixed(2)}</span>
                        </div>
                        {p.category && (
                          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {p.category}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => navigate(`/merchant/products/${p._id}/edit`)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
                        >
                          <FiEdit2 className="w-3.5 h-3.5" />
                          Edit
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => remove(p._id)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                          Delete
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Count */}
        {!loading && filteredProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-center text-sm text-gray-500"
          >
            Showing {filteredProducts.length} of {products.length} products
            {(searchTerm || filterStatus !== 'all') && ' (filtered)'}
          </motion.div>
        )}
      </div>
    </div>
  )
}
