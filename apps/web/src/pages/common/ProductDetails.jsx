import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { get, getImageUrl } from '../../shared/api.js'
import { useCart } from '../../shared/CartContext.jsx'
import { useToast } from '../../shared/ui/Toast.jsx'
import { formatLKR } from '../../shared/currency.js'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiShoppingCart, FiStar } from 'react-icons/fi'

export default function ProductDetails() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [product, setProduct] = useState(null)
  const [qty, setQty] = useState(1)
  const { addItem, canAddProduct, currentMerchant } = useCart()
  const { notify } = useToast()

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const res = await get(`/api/products/public/${id}`)
        if (!cancelled) setProduct(res.data)
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load product')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (id) load()
    return () => { cancelled = true }
  }, [id])

  const canAdd = useMemo(() => {
    if (!product) return false
    try { return canAddProduct(product) } catch { return false }
  }, [product, canAddProduct])

  const onAddToCart = async () => {
    if (!product) return
    try {
      if (!canAdd) {
        notify({ type: 'error', title: 'Cannot add', message: `Only products from ${currentMerchant?.businessName || 'current merchant'} allowed in cart` })
        return
      }
      await addItem(product, qty)
      notify({ type: 'success', title: 'Added to cart', message: product.name })
    } catch (e) {
      notify({ type: 'error', title: 'Cannot add to cart', message: e.message || 'Please try again' })
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error || !product) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl p-6 text-center shadow-lg w-full max-w-sm">
        <div className="text-red-500 text-2xl mb-2">⚠️</div>
        <div className="text-gray-700 mb-4">{error || 'Product not found'}</div>
        <Link to="/" className="inline-block px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold shadow-md hover:bg-orange-600 transition">Go Home</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20 mb-8 ">
      <div className="max-w-md mx-auto space-y-5">

        {/* Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 font-medium text-lg">
          <FiArrowLeft /> Back
        </Link>

        {/* Product Image */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          {product.images?.[0]?.url ? (
            <img 
              src={getImageUrl(product.images[0].url)} 
              alt={product.name} 
              className="w-full h-64 sm:h-80 object-cover"
            />
          ) : (
            <div className="w-full h-64 sm:h-80 bg-orange-100" />
          )}

          {product.images?.length > 1 && (
            <div className="p-3 flex gap-2 overflow-x-auto bg-gray-50">
              {product.images.slice(1, 6).map((img, i) => (
                <img 
                  key={i} 
                  src={getImageUrl(img.url)} 
                  alt={img.alt || 'Image'} 
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-gray-200"
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="bg-white rounded-3xl shadow-lg p-5 space-y-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{product.name}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
            <div className="flex items-center gap-1 text-amber-500">
              <FiStar /> <span>{(product.rating?.average ?? 0).toFixed(1)}</span> 
              <span className="text-gray-400">({product.rating?.count ?? 0})</span>
            </div>
            <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs">{product.category}</span>
            {product.isVegetarian && <span className="px-2 py-1 rounded-lg bg-green-100 text-green-700 text-xs">Vegetarian</span>}
            {product.isVegan && <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs">Vegan</span>}
            {product.isGlutenFree && <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs">Gluten Free</span>}
          </div>

          {/* Price */}
          <div className="text-2xl sm:text-3xl font-bold text-orange-600">{formatLKR(product.price)}</div>

          {/* Quantity + Add to Cart (Mobile Friendly) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
            <div className="flex items-center border rounded-xl overflow-hidden bg-gray-50 shadow-sm w-full sm:w-auto">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-4 py-2 text-gray-700 hover:bg-gray-100 transition">-</button>
              <div className="px-4 py-2 text-center min-w-[40px]">{qty}</div>
              <button onClick={() => setQty(q => Math.min(99, q + 1))} className="px-4 py-2 text-gray-700 hover:bg-gray-100 transition">+</button>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={(product.stock ?? 0) <= 0}
              onClick={onAddToCart}
              className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-semibold shadow-lg flex items-center justify-center gap-2 transition ${
                (product.stock ?? 0) <= 0 
                  ? 'bg-gray-400 cursor-not-allowed text-white' 
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              <FiShoppingCart /> {(!canAdd && currentMerchant) ? 'Switch' : 'Add to Cart'}
            </motion.button>
          </div>

          {/* Stock Info */}
          {(product.stock ?? 0) <= 0 ? (
            <div className="text-red-600 text-sm mt-2">Out of stock</div>
          ) : product.stock <= (product.minStock ?? 0) ? (
            <div className="text-amber-600 text-sm mt-2">Limited stock available</div>
          ) : null}
        </div>

        {/* Description */}
        <div className="bg-white rounded-3xl shadow-lg p-5">
          <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{product.description}</p>
        </div>

        {/* Merchant Info */}
        <div className="bg-white rounded-3xl shadow-lg p-5 space-y-2">
          <div className="text-sm text-gray-700">
            <div className="font-semibold">{product.merchant?.businessName || 'Merchant'}</div>
            {product.merchant?.shopLocation?.fullAddress && (
              <div className="text-xs text-gray-500">{product.merchant.shopLocation.fullAddress}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
