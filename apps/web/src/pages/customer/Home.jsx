import { useEffect, useState } from 'react'
import { get, post } from '../../shared/api.js'
import { motion } from 'framer-motion'
import { FiSearch, FiShoppingBag } from 'react-icons/fi'
import { useToast } from '../../shared/ui/Toast.jsx'
import { Spinner } from '../../shared/ui/Spinner.jsx'

export default function CustomerHome(){
  const [q, setQ] = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(()=>{
    let mounted = true
    setLoading(true)
    get(`/api/products/search?q=${encodeURIComponent(q)}`)
      .then(d=> mounted && setProducts(d.data || []))
      .catch(e=> mounted && setError(e.message))
      .finally(()=> mounted && setLoading(false))
    return ()=>{ mounted=false }
  },[q])

  const { notify } = useToast()
  async function placeQuickOrder(product){
    try{
      const res = await post('/api/orders',{
        items: [{ product: product._id, quantity: 1 }],
        deliveryAddress: { street:'', city:'', state:'', zipCode:'', country:'' },
        paymentMethod: 'cash'
      })
      if (res.offline){
        notify({ type:'info', title:'Offline', message:'Order queued and will sync later' })
      } else {
        notify({ type:'success', title:'Order placed', message:`${product.name}` })
      }
    }catch(err){
      notify({ type:'error', title:'Failed', message: err.message })
    }
  }

  return (
    <div className="p-3 pb-16">
      <div className="sticky top-[52px] bg-white z-0">
        <div className="w-full border rounded p-2 flex items-center gap-2">
          <FiSearch className="text-gray-400" />
          <input className="flex-1 outline-none" placeholder="Search products" value={q} onChange={e=>setQ(e.target.value)} />
        </div>
      </div>
      {loading && (
        <div className="p-6 flex justify-center">
          <Spinner size={36} />
        </div>
      )}
      {error && <div className="p-4 text-red-600">{error}</div>}
      <div className="grid grid-cols-2 gap-3 mt-3">
        {products.map((p,idx)=> (
          <motion.div key={p._id} className="border rounded overflow-hidden" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: idx*0.02 }}>
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200" />
            <div className="p-2">
              <div className="text-sm font-medium line-clamp-2">{p.name}</div>
              <div className="text-xs text-gray-500">{p?.merchant?.businessName || ''}</div>
              <div className="flex items-center justify-between mt-2">
                <div className="font-semibold">${p.price}</div>
                <motion.button whileTap={{ scale:0.98 }} className="flex items-center gap-1 text-white bg-green-600 rounded px-2 py-1 text-xs" onClick={()=>placeQuickOrder(p)}>
                  <FiShoppingBag /> Buy
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}


