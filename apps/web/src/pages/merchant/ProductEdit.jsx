import { useEffect, useRef, useState } from 'react'
import { get, uploadFormData, del } from '../../shared/api.js'
import { motion } from 'framer-motion'
import { FiSave, FiTrash2, FiImage, FiX } from 'react-icons/fi'
import { useToast } from '../../shared/ui/Toast.jsx'
import { useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'

export default function ProductEdit(){
  const { id } = useParams()
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [desc, setDesc] = useState('')
  const [category, setCategory] = useState('food')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imageDataUrl, setImageDataUrl] = useState('')
  const [existingImageUrl, setExistingImageUrl] = useState('')
  const [imageError, setImageError] = useState('')
  const fileInputRef = useRef(null)
  const { notify } = useToast()
  const navigate = useNavigate()

  useEffect(()=>{
    async function load(){
      try{
        const d = await get(`/api/products/${id}`)
        const p = d.data
        setName(p?.name||'')
        setPrice(String(p?.price||''))
        setStock(String(p?.stock||''))
        setDesc(p?.description||'')
        setCategory(p?.category||'food')
        const firstImg = Array.isArray(p?.images) && p.images.length ? p.images[0] : null
        setExistingImageUrl(firstImg?.url||'')
      }catch(err){
        notify({ type:'error', title:'Failed to load', message: err.message })
      }finally{ setLoading(false) }
    }
    load()
  },[id])

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

  async function save(e){
    e.preventDefault()
    try{
      setSaving(true)
      
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('name', name)
      formData.append('description', desc)
      formData.append('category', category)
      formData.append('price', parseFloat(price||0))
      formData.append('stock', parseInt(stock||0))
      
      // Add image file if a new one was selected
      if (fileInputRef.current?.files?.[0]) {
        formData.append('image', fileInputRef.current.files[0])
      }
      
      // Use the uploadFormData helper
      await uploadFormData(`/api/products/${id}`, formData, 'PUT')
      
      notify({ type:'success', title:'Saved' })
      navigate('/merchant/products')
    }catch(err){
      notify({ type:'error', title:'Save failed', message: err.message })
    }finally{ setSaving(false) }
  }

  async function remove(){
    try{
      await del(`/api/products/${id}`)
      notify({ type:'success', title:'Deleted' })
      navigate('/merchant/products')
    }catch(err){
      notify({ type:'error', title:'Delete failed', message: err.message })
    }
  }

  if(loading) return <div className="p-3">Loading...</div>

  return (
    <div className="p-3 pb-16">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-semibold">{t('Edit Product')}</h1>
        <button className="flex items-center gap-2 text-red-600" onClick={remove}><FiTrash2 /> {t('Delete')}</button>
      </div>
      <form className="grid grid-cols-2 gap-3 mb-4" onSubmit={save}>
        <input className="border border-gray-300 rounded-lg p-3 col-span-2 bg-white text-black" placeholder={t('Name')} value={name} onChange={e=>setName(e.target.value)} />
        <select className="border border-gray-300 rounded-lg p-3 bg-white text-black" value={category} onChange={e=>setCategory(e.target.value)}>
          <option value="food">{t('Food')}</option>
          <option value="groceries">{t('Groceries')}</option>
          <option value="pharmacy">{t('Pharmacy')}</option>
          <option value="electronics">{t('Electronics')}</option>
          <option value="clothing">{t('Clothing')}</option>
          <option value="books">{t('Books')}</option>
          <option value="other">{t('Other')}</option>
        </select>
        <input className="border border-gray-300 rounded-lg p-3 bg-white text-black" placeholder={t('Price')} inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value)} />
        <input className="border border-gray-300 rounded-lg p-3 bg-white text-black" placeholder={t('Stock')} inputMode="numeric" value={stock} onChange={e=>setStock(e.target.value)} />
        <textarea className="border border-gray-300 rounded-lg p-3 col-span-2 bg-white text-black" rows={4} placeholder={t('Description')} value={desc} onChange={e=>setDesc(e.target.value)} />

        <div className="col-span-2">
          <label className="block text-sm font-medium text-black mb-2">{t('Product Photo')}</label>
          {!(imageDataUrl || existingImageUrl) ? (
            <button type="button" onClick={onPickImage} className="w-full border-2 border-dashed border-gray-300 hover:border-orange-400 rounded-xl p-6 bg-white text-gray-600 flex flex-col items-center justify-center gap-2 transition">
              <FiImage className="text-black" />
              <span className="text-sm">{t('Tap to upload image (PNG, JPG, WEBP, max 2MB)')}</span>
            </button>
          ) : (
            <div className="relative">
              <img src={imageDataUrl || existingImageUrl} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-gray-300" />
              <button type="button" onClick={removeImage} className="absolute top-2 right-2 bg-white/90 text-black rounded-full p-2 border border-gray-300">
                <FiX />
              </button>
            </div>
          )}
          {imageError && <div className="text-red-600 text-sm mt-2">{imageError}</div>}
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={onFileChange} />
        </div>

        <motion.button whileTap={{ scale:0.98 }} disabled={saving} className="flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl p-3 col-span-2">
          <FiSave /> {saving ? t('Saving...') : t('Save Changes')}
        </motion.button>
      </form>
    </div>
  )
}


