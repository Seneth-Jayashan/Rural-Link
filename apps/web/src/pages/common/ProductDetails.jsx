import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { get, getImageUrl } from '../../shared/api.js'
import { useCart } from '../../shared/CartContext.jsx'
import { useToast } from '../../shared/ui/Toast.jsx'
import { formatLKR } from '../../shared/currency.js'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiShoppingCart, FiStar } from 'react-icons/fi'

export default function ProductDetails(){
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [product, setProduct] = useState(null)
  const [qty, setQty] = useState(1)
  const { addItem, canAddProduct, currentMerchant } = useCart()
  const { notify } = useToast()

  useEffect(() => {
    let cancelled = false
    async function load(){
      try{
        setLoading(true)
        const res = await get(`/api/products/public/${id}`)
        if (!cancelled) setProduct(res.data)
      }catch(e){
        if (!cancelled) setError(e.message || 'Failed to load product')
      }finally{
        if (!cancelled) setLoading(false)
      }
    }
    if (id) load()
    return () => { cancelled = true }
  }, [id])

  const canAdd = useMemo(() => {
    if (!product) return false
    try{ return canAddProduct(product) }catch{ return false }
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mt-16" />
      </div>
    </div>
  )
  if (error || !product) return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-orange-100 p-8 text-center shadow">
        <div className="text-red-500 mb-2 text-lg">⚠️</div>
        <div className="text-gray-700">{error || 'Product not found'}</div>
        <Link to="/" className="inline-block mt-4 px-4 py-2 rounded-xl bg-orange-500 text-white">Go Home</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-700 hover:text-orange-600">
            <FiArrowLeft /> Back
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Images */}
          <div className="bg-white rounded-3xl border border-orange-100 p-4 shadow-sm">
            {product.images?.[0]?.url ? (
              <img
                src={getImageUrl(product.images[0].url)}
                alt={product.images[0]?.alt || product.name}
                className="w-full h-80 object-cover rounded-2xl border"
              />
            ) : (
              <div className="w-full h-80 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl border" />
            )}
            {product.images?.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {product.images.slice(1, 6).map((img, i) => (
                  <img key={i} src={getImageUrl(img.url)} alt={img.alt||'Image'} className="w-full h-16 object-cover rounded-xl border" />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-orange-100 p-5 shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{product.name}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-1 text-amber-600">
                  <FiStar />
                  <span>{(product.rating?.average ?? 0).toFixed?.(1)}</span>
                  <span className="text-gray-400">({product.rating?.count ?? 0})</span>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-gray-100 border text-gray-700 text-xs capitalize">{product.category}</span>
                {product.isVegetarian && <span className="px-2 py-0.5 rounded-lg bg-green-100 border text-green-700 text-xs">Vegetarian</span>}
                {product.isVegan && <span className="px-2 py-0.5 rounded-lg bg-emerald-100 border text-emerald-700 text-xs">Vegan</span>}
                {product.isGlutenFree && <span className="px-2 py-0.5 rounded-lg bg-blue-100 border text-blue-700 text-xs">Gluten Free</span>}
              </div>
              <div className="text-3xl font-bold text-orange-600 mt-3">{formatLKR(product.price)}</div>
            </div>

            <div className="bg-white rounded-3xl border border-orange-100 p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </div>

            

            <div className="bg-white rounded-3xl border border-orange-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  <div className="font-semibold">{product.merchant?.businessName || 'Merchant'}</div>
                  {product.merchant?.shopLocation?.fullAddress && (
                    <div className="text-xs text-gray-500">{product.merchant.shopLocation.fullAddress}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border rounded-xl overflow-hidden">
                    <button onClick={()=>setQty(q=>Math.max(1,q-1))} className="px-3 py-2 text-gray-700">-</button>
                    <div className="px-3 py-2 min-w-8 text-center">{qty}</div>
                    <button onClick={()=>setQty(q=>Math.min(99,q+1))} className="px-3 py-2 text-gray-700">+</button>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={(product.stock ?? 0) <= 0}
                    onClick={onAddToCart}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold shadow ${((product.stock??0)<=0) ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                  >
                    <FiShoppingCart />
                    {(!canAdd && currentMerchant) ? `Switching merchant` : 'Add to Cart'}
                  </motion.button>
                </div>
              </div>
              {(product.stock ?? 0) <= 0 ? (
                <div className="mt-2 text-sm text-red-600">Out of stock</div>
              ) : product.stock <= (product.minStock ?? 0) ? (
                <div className="mt-2 text-sm text-amber-600">Limited stock available</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
