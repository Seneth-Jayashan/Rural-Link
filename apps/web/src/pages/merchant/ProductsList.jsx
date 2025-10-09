import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { get, del } from '../../shared/api.js'
import { motion } from 'framer-motion'
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi'
import { useToast } from '../../shared/ui/Toast.jsx'

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

  return (
    <div className="p-3 pb-16">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-semibold">Products</h1>
        <Link to="/merchant/products/new" className="inline-flex items-center gap-2 bg-blue-600 text-white rounded px-3 py-2 text-sm">
          <FiPlus /> Add Product
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-2">
          {products.length === 0 && (
            <div className="text-sm text-gray-500">No products yet</div>
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
                    <div className="text-xs text-gray-500">Stock: {p.stock} • ${p.price}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-1 text-blue-600" onClick={()=>navigate(`/merchant/products/${p._id}/edit`)}><FiEdit2 /> Edit</button>
                  <button className="flex items-center gap-1 text-red-600" onClick={()=>remove(p._id)}><FiTrash2 /> Delete</button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}


