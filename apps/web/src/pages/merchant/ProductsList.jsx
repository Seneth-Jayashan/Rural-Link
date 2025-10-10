import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { get, del } from '../../shared/api.js'
import { motion } from 'framer-motion'
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi'
import { useToast } from '../../shared/ui/Toast.jsx'
import { Spinner } from '../../shared/ui/Spinner.jsx'

export default function ProductsList(){
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const { notify } = useToast()
  const navigate = useNavigate()

  async function load(){
    try{
      setLoading(true)
      const d = await get('/api/products')
      setProducts(d.data||[])
    }catch(err){
      notify({ type:'error', title:'Failed to load', message: err.message })
    }finally{
      setLoading(false)
    }
  }

  useEffect(()=>{ load() },[])

  async function remove(id){
    try{
      await del(`/api/products/${id}`)
      notify({ type:'success', title:'Deleted' })
      setProducts(prev => prev.filter(p => p._id !== id))
    }catch(err){
      notify({ type:'error', title:'Delete failed', message: err.message })
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
      )}
    </div>
  )
}


