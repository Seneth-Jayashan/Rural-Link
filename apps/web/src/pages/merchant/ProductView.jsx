import { useEffect, useState } from 'react'
import { get } from '../../shared/api.js'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiEdit2, FiArrowLeft, FiPackage, FiTag, FiDollarSign, FiBox, FiActivity, FiFileText, FiShoppingBag, FiCalendar } from 'react-icons/fi'
import { Spinner } from '../../shared/ui/Spinner.jsx'

export default function ProductView(){
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(()=>{
    async function load(){
      try{
        const d = await get(`/api/products/${id}`)
        setProduct(d.data)
      }catch(e){
        setError(e.message || 'Failed to load product')
      }finally{
        setLoading(false)
      }
    }
    load()
  },[id])

  const firstImg = Array.isArray(product?.images) && product.images.length ? product.images[0] : null

  const getStatusColor = (status) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-red-100 text-red-800 border-red-200',
      draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      archived: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  if(loading) return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 p-4">
      <div className="max-w-2xl mx-auto text-center py-12">
        <Spinner size={48} className="text-orange-500 mx-auto mb-4" />
        <p className="text-gray-600">Loading product details...</p>
      </div>
    </div>
  )

  if(error) return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 p-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border border-red-200 rounded-3xl p-6 text-center"
        >
          <div className="text-red-500 text-lg mb-2">⚠️</div>
          <div className="text-red-600 font-medium mb-2">{error}</div>
          <button
            onClick={() => navigate('/merchant/products')}
            className="px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            Back to Products
          </button>
        </motion.div>
      </div>
    </div>
  )

  if(!product) return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 p-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-8 text-center"
        >
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiPackage className="w-8 h-8 text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Product Not Found</h3>
          <p className="text-gray-500 text-sm mb-4">The product you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/merchant/products')}
            className="px-6 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            Back to Products
          </button>
        </motion.div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 p-4 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/merchant/products')}
            className="p-3 bg-white rounded-2xl shadow-lg border border-orange-100 hover:shadow-xl transition-all"
          >
            <FiArrowLeft className="w-5 h-5 text-orange-600" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Product Details</h1>
            <p className="text-gray-600 text-sm mt-1">View and manage product information</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={()=>navigate(`/merchant/products/${product._id}/edit`)}
            className="hidden sm:flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg hover:shadow-xl"
          >
            <FiEdit2 className="w-4 h-4" />
            Edit
          </motion.button>
        </div>
      </motion.div>

      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 overflow-hidden"
        >
          {/* Product Image */}
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              {firstImg ? (
                <img 
                  src={firstImg.url} 
                  alt={firstImg.alt||product.name} 
                  className="w-full h-48 sm:h-64 object-cover"
                />
              ) : (
                <div className="w-full h-48 sm:h-64 bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                  <FiPackage className="w-16 h-16 text-orange-300" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <div className={`px-3 py-1.5 rounded-full border text-sm font-medium flex items-center gap-2 ${getStatusColor(product.status)}`}>
                  <FiActivity className="w-3 h-3" />
                  <span className="hidden sm:inline">{(product.status || 'active').toUpperCase()}</span>
                  <span className="sm:hidden">{(product.status || 'active').charAt(0).toUpperCase()}</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Product Details */}
          <div className="p-4 sm:p-6 space-y-6">
            {/* Product Name */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <FiShoppingBag className="w-4 h-4 text-orange-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Product Information</h2>
              </div>
              <div className="bg-gradient-to-r from-orange-50/50 to-amber-50/50 rounded-2xl p-4 border border-orange-200">
                <div className="text-sm text-gray-600 mb-1">Product Name</div>
                <div className="text-xl font-bold text-gray-900 break-words">{product.name}</div>
              </div>
            </div>

            {/* Key Stats - Horizontal Scroll for Mobile */}
            <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide snap-x snap-mandatory">
              {/* Price */}
              <div className="flex-shrink-0 bg-gradient-to-r from-orange-50/50 to-amber-50/50 rounded-2xl p-4 border border-orange-200 min-w-[140px] snap-start">
                <div className="flex items-center gap-2 mb-2">
                  <FiDollarSign className="w-4 h-4 text-orange-600" />
                  <div className="text-sm text-gray-600">Price</div>
                </div>
                <div className="text-xl font-bold text-orange-600">${product.price?.toFixed(2)}</div>
              </div>

              {/* Stock */}
              <div className="flex-shrink-0 bg-gradient-to-r from-orange-50/50 to-amber-50/50 rounded-2xl p-4 border border-orange-200 min-w-[140px] snap-start">
                <div className="flex items-center gap-2 mb-2">
                  <FiBox className="w-4 h-4 text-orange-600" />
                  <div className="text-sm text-gray-600">Stock</div>
                </div>
                <div className={`text-xl font-bold ${
                  product.stock > 10 ? 'text-green-600' : 
                  product.stock > 0 ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {product.stock}
                  <div className="text-xs font-normal mt-1">
                    {product.stock === 0 ? 'Out of stock' : 
                     product.stock <= 10 ? 'Low stock' : 'In stock'}
                  </div>
                </div>
              </div>

              {/* Category */}
              <div className="flex-shrink-0 bg-gradient-to-r from-orange-50/50 to-amber-50/50 rounded-2xl p-4 border border-orange-200 min-w-[140px] snap-start">
                <div className="flex items-center gap-2 mb-2">
                  <FiTag className="w-4 h-4 text-orange-600" />
                  <div className="text-sm text-gray-600">Category</div>
                </div>
                <div className="text-base font-semibold text-gray-900 truncate">
                  {product.category || <span className="text-gray-400 italic">Not set</span>}
                </div>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-xl">
                    <FiFileText className="w-4 h-4 text-purple-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Description</h2>
                </div>
                <div className="bg-gradient-to-r from-orange-50/50 to-amber-50/50 rounded-2xl p-4 border border-orange-200">
                  <div className="text-sm text-gray-600 mb-2">Product Description</div>
                  <div className="text-base text-gray-900 whitespace-pre-wrap leading-relaxed">
                    {product.description}
                  </div>
                </div>
              </div>
            )}

            {/* Additional Images */}
            {Array.isArray(product.images) && product.images.length > 1 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-xl">
                    <FiPackage className="w-4 h-4 text-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Additional Images</h2>
                </div>
                <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
                  {product.images.slice(1).map((image, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      className="flex-shrink-0 w-32 h-32 rounded-2xl border border-orange-200 overflow-hidden bg-gray-100"
                    >
                      <img 
                        src={image.url} 
                        alt={image.alt || `${product.name} ${index + 2}`}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Created/Updated Info */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-orange-200">
              <div className="text-center p-3 bg-gradient-to-r from-orange-50/50 to-amber-50/50 rounded-2xl border border-orange-200">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <FiCalendar className="w-3 h-3 text-gray-500" />
                  <div className="text-xs text-gray-500">Created</div>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div className="text-center p-3 bg-gradient-to-r from-orange-50/50 to-amber-50/50 rounded-2xl border border-orange-200">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <FiCalendar className="w-3 h-3 text-gray-500" />
                  <div className="text-xs text-gray-500">Updated</div>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Edit Button - Mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 flex flex-col sm:flex-row gap-3"
        >
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={()=>navigate(`/merchant/products/${product._id}/edit`)}
            className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl py-4 font-semibold text-lg hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg hover:shadow-xl"
          >
            <FiEdit2 className="w-5 h-5" />
            Edit Product
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/merchant/products')}
            className="flex-1 flex items-center justify-center gap-3 bg-white text-gray-700 rounded-2xl py-4 font-semibold text-lg border border-orange-200 hover:bg-orange-50 transition-all shadow-lg hover:shadow-xl sm:hidden"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back to List
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}