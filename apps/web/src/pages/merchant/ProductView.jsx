import { useEffect, useState } from 'react'
import { get } from '../../shared/api.js'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiEdit2, FiArrowLeft, FiPackage, FiTag, FiDollarSign, FiBox, FiActivity, FiFileText, FiShoppingBag } from 'react-icons/fi'
import { Spinner } from '../../shared/ui/Spinner.jsx'

export default function ProductView(){
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(()=>{
    async function load(){
      try{
        const d = await get(`/api/products/${id}`)
        setProduct(d.data)
      }finally{
        setLoading(false)
      }
    }
    load()
  },[id])

  const firstImg = Array.isArray(product?.images) && product.images.length ? product.images[0] : null

  const firstImg = Array.isArray(product.images) && product.images.length ? product.images[0] : null

  if(loading) return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 p-4">
      <div className="max-w-2xl mx-auto text-center py-12">
        <Spinner size={48} className="text-orange-500 mx-auto mb-4" />
        <p className="text-gray-600">Loading product details...</p>
      </div>
    </div>
  )
}


