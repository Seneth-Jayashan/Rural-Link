import { useRef, useState } from 'react'
import { post } from '../../shared/api.js'
import { motion } from 'framer-motion'
import { FiPlus, FiImage, FiX } from 'react-icons/fi'
import { useToast } from '../../shared/ui/Toast.jsx'
import { useNavigate } from 'react-router-dom'

export default function ProductCreate(){
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [desc, setDesc] = useState('')
  const [category, setCategory] = useState('food')
  const [saving, setSaving] = useState(false)
  const [imageDataUrl, setImageDataUrl] = useState('')
  const [imageError, setImageError] = useState('')
  const fileInputRef = useRef(null)
  const { notify } = useToast()
  const navigate = useNavigate()

  function onPickImage(){
    fileInputRef.current?.click()
  }

  function onFileChange(e){
    setImageError('')
    const file = e.target.files?.[0]
    if(!file) return
    const isImage = /^image\/(png|jpe?g|webp|gif)$/i.test(file.type)
    if(!isImage){ setImageError('Please select a valid image file'); return }
    const maxBytes = 2 * 1024 * 1024
    if(file.size > maxBytes){ setImageError('Image must be under 2MB'); return }
    const reader = new FileReader()
    reader.onload = () => setImageDataUrl(String(reader.result||''))
    reader.readAsDataURL(file)
  }

  function removeImage(){
    setImageDataUrl('')
    if(fileInputRef.current) fileInputRef.current.value = ''
  }

  async function addProduct(e){
    e.preventDefault()
    try{
      setSaving(true)
      const payload = {
        name,
        description: desc,
        category,
        price: parseFloat(price||0),
        stock: parseInt(stock||0),
        images: imageDataUrl ? [{ url: imageDataUrl, alt: name }] : []
      }
      await post('/api/products', payload)
      notify({ type:'success', title:'Product created' })
      navigate('/merchant/products')
    }catch(err){
      notify({ type:'error', title:'Create failed', message: err.message })
    }finally{ setSaving(false) }
  }

  return (
    <div className="p-3 pb-16">
      <h1 className="text-lg font-semibold mb-3 text-black">Add Product</h1>

      <form onSubmit={addProduct} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-black mb-1">Name</label>
            <input className="w-full border border-gray-300 rounded-lg p-3 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="Product name" value={name} onChange={e=>setName(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">Category</label>
            <select className="w-full border border-gray-300 rounded-lg p-3 bg-white text-black focus:outline-none focus:ring-2 focus:ring-orange-400" value={category} onChange={e=>setCategory(e.target.value)}>
              <option value="food">Food</option>
              <option value="groceries">Groceries</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="books">Books</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 col-span-2">
            <div>
              <label className="block text-sm font-medium text-black mb-1">Price</label>
              <input className="w-full border border-gray-300 rounded-lg p-3 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="0.00" inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Stock</label>
              <input className="w-full border border-gray-300 rounded-lg p-3 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="0" inputMode="numeric" value={stock} onChange={e=>setStock(e.target.value)} />
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-black mb-1">Description</label>
            <textarea rows={4} className="w-full border border-gray-300 rounded-lg p-3 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="Describe the product" value={desc} onChange={e=>setDesc(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-2">Product Photo</label>
          {!imageDataUrl ? (
            <button type="button" onClick={onPickImage} className="w-full border-2 border-dashed border-gray-300 hover:border-orange-400 rounded-xl p-6 bg-white text-gray-600 flex flex-col items-center justify-center gap-2 transition">
              <FiImage className="text-black" />
              <span className="text-sm">Tap to upload image (PNG, JPG, WEBP, max 2MB)</span>
            </button>
          ) : (
            <div className="relative">
              <img src={imageDataUrl} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-gray-300" />
              <button type="button" onClick={removeImage} className="absolute top-2 right-2 bg-white/90 text-black rounded-full p-2 border border-gray-300">
                <FiX />
              </button>
            </div>
          )}
          {imageError && <div className="text-red-600 text-sm mt-2">{imageError}</div>}
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={onFileChange} />
        </div>

        <motion.button whileTap={{ scale:0.98 }} disabled={saving || !name || !price || !stock} className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white rounded-xl p-3 font-semibold disabled:opacity-60">
          <FiPlus /> {saving ? 'Saving...' : 'Add Product'}
        </motion.button>
      </form>
    </div>
  )
}


