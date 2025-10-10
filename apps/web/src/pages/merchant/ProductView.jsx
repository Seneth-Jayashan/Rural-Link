import { useEffect, useState } from 'react'
import { get } from '../../shared/api.js'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiEdit2 } from 'react-icons/fi'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'
import { formatLKR } from '../../shared/currency.js'

export default function ProductView(){
  const { id } = useParams()
  const { t } = useI18n()
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

  if(loading) return <div className="p-3">{t('Loading...')}</div>
  if(!product) return <div className="p-3">{t('Not found')}</div>

  const firstImg = Array.isArray(product.images) && product.images.length ? product.images[0] : null

  return (
    <div className="p-3 pb-16">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-semibold text-black">{t('Product Details')}</h1>
        <button className="flex items-center gap-2 text-blue-600" onClick={()=>navigate(`/merchant/products/${product._id}/edit`)}><FiEdit2 /> {t('Edit')}</button>
      </div>

      <div className="space-y-3">
        {firstImg && (
          <img src={firstImg.url} alt={firstImg.alt||product.name} className="w-full h-48 object-cover rounded-xl border border-gray-300" />
        )}
        <div>
          <div className="text-sm text-gray-500">{t('Name')}</div>
          <div className="text-base font-semibold text-black">{product.name}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-sm text-gray-500">{t('Category')}</div>
            <div className="text-base text-black">{product.category}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">{t('Price')}</div>
            <div className="text-base text-black">{formatLKR(product.price)}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-sm text-gray-500">{t('Stock')}</div>
            <div className="text-base text-black">{product.stock}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">{t('Status')}</div>
            <div className="text-base text-black">{product.status||'active'}</div>
          </div>
        </div>
        {product.description && (
          <div>
            <div className="text-sm text-gray-500">{t('Description')}</div>
            <div className="text-base text-black whitespace-pre-wrap">{product.description}</div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <motion.button whileTap={{ scale:0.98 }} onClick={()=>navigate(`/merchant/products/${product._id}/edit`)} className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white rounded-xl p-3 font-semibold">
          <FiEdit2 /> {t('Edit Product')}
        </motion.button>
      </div>
    </div>
  )
}


