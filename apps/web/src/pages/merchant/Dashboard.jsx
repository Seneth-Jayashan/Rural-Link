import { useEffect, useState } from 'react'
import { get, post, put, del } from '../../shared/api.js'
import { motion } from 'framer-motion'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import { useToast } from '../../shared/ui/Toast.jsx'

export default function MerchantDashboard(){
  const [products, setProducts] = useState([])
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [desc, setDesc] = useState('')
  const [category, setCategory] = useState('food')

  async function load(){
    try{ const d = await get('/api/products'); setProducts(d.data||[]) }catch{}
  }

  useEffect(()=>{ load() },[])

  async function addProduct(e){
    e.preventDefault()
    await post('/api/products',{ name, description: desc, category, price: parseFloat(price||0), stock: parseInt(stock||0) })
    setName(''); setPrice(''); setStock(''); setDesc('')
    load()
  }

  const { notify } = useToast()
  async function remove(id){ await del(`/api/products/${id}`); notify({ type:'success', title:'Deleted' }); load() }

  return (
    <div className="p-3 pb-16">
      <h1 className="text-lg font-semibold mb-3">Merchant Dashboard</h1>
      <form className="grid grid-cols-2 gap-2 mb-4" onSubmit={addProduct}>
        <input className="border rounded p-2 col-span-2" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
        <select className="border rounded p-2" value={category} onChange={e=>setCategory(e.target.value)}>
          <option value="food">Food</option>
          <option value="groceries">Groceries</option>
          <option value="pharmacy">Pharmacy</option>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
          <option value="books">Books</option>
          <option value="other">Other</option>
        </select>
        <input className="border rounded p-2" placeholder="Price" value={price} onChange={e=>setPrice(e.target.value)} />
        <input className="border rounded p-2" placeholder="Stock" value={stock} onChange={e=>setStock(e.target.value)} />
        <textarea className="border rounded p-2 col-span-2" placeholder="Description" value={desc} onChange={e=>setDesc(e.target.value)} />
        <motion.button whileTap={{ scale:0.98 }} className="flex items-center justify-center gap-2 bg-blue-600 text-white rounded p-2 col-span-2"><FiPlus /> Add Product</motion.button>
      </form>

      <div className="space-y-2">
        {products.map(p=> (
          <motion.div key={p._id} className="border rounded p-2 flex items-center justify-between" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-gray-500">Stock: {p.stock} • ${p.price}</div>
            </div>
            <button className="flex items-center gap-1 text-red-600" onClick={()=>remove(p._id)}><FiTrash2 /> Delete</button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}


