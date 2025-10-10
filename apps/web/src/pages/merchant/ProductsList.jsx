import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { get, del } from '../../shared/api.js'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiTrash2, FiEdit2, FiPackage, FiSearch, FiFilter, FiBox, FiDollarSign, FiActivity } from 'react-icons/fi'
import { useToast } from '../../shared/ui/Toast.jsx'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'
import { formatLKR } from '../../shared/currency.js'

export default function ProductsList(){
  const { t } = useI18n()
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
    <div className="p-3 pb-16">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-semibold">{t('Products')}</h1>
        <Link to="/merchant/products/new" className="inline-flex items-center gap-2 bg-blue-600 text-white rounded px-3 py-2 text-sm">
          <FiPlus /> {t('Add Product')}
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">{t('Loading...')}</div>
      ) : (
        <div className="space-y-2">
          {products.length === 0 && (
            <div className="text-sm text-gray-500">{t('No products yet')}</div>
          )}
          {products.map(p=> {
            const firstImg = Array.isArray(p.images) && p.images.length ? p.images[0] : null
            return (
              <motion.div key={p._id} className="border rounded p-2 flex items-center justify-between" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
                <div className="flex items-center gap-3">
                  {firstImg && (
                    <img src={firstImg.url} alt={firstImg.alt||p.name} className="w-12 h-12 object-cover rounded border" onClick={()=>navigate(`/merchant/products/${p._id}`)} />
                  )}
                  <div>
                    <button className="font-medium text-left hover:underline" onClick={()=>navigate(`/merchant/products/${p._id}`)}>{p.name}</button>
                    <div className="text-xs text-gray-500">{t('Stock')}: {p.stock} • {formatLKR(p.price)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-1 text-blue-600" onClick={()=>navigate(`/merchant/products/${p._id}/edit`)}><FiEdit2 /> {t('Edit')}</button>
                  <button className="flex items-center gap-1 text-red-600" onClick={()=>remove(p._id)}><FiTrash2 /> {t('Delete')}</button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
