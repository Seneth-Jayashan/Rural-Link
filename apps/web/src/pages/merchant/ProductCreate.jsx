import { useRef, useState } from 'react'
import { post } from '../../shared/api.js'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiPlus, FiImage, FiX, FiArrowLeft, FiDollarSign,
  FiPackage, FiTag, FiFileText, FiBox,
  FiShoppingBag, FiCpu, FiBook, FiShoppingCart, FiHeart, FiChevronDown
} from 'react-icons/fi'
import { useToast } from '../../shared/ui/Toast.jsx'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'

export default function ProductCreate(){
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [desc, setDesc] = useState('')
  const [category, setCategory] = useState('food')
  const [saving, setSaving] = useState(false)
  const [imageDataUrl, setImageDataUrl] = useState('')
  const [imageError, setImageError] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const fileInputRef = useRef(null)
  const { notify } = useToast()
  const navigate = useNavigate()

  const categories = [
    { id: 'food', name: 'Food', icon: <FiShoppingBag className="w-4 h-4 text-orange-600" /> },
    { id: 'groceries', name: 'Groceries', icon: <FiShoppingCart className="w-4 h-4 text-green-600" /> },
    { id: 'pharmacy', name: 'Pharmacy', icon: <FiHeart className="w-4 h-4 text-pink-600" /> },
    { id: 'electronics', name: 'Electronics', icon: <FiCpu className="w-4 h-4 text-blue-600" /> },
    { id: 'clothing', name: 'Clothing', icon: <FiPackage className="w-4 h-4 text-purple-600" /> },
    { id: 'books', name: 'Books', icon: <FiBook className="w-4 h-4 text-amber-600" /> },
    { id: 'other', name: 'Other', icon: <FiBox className="w-4 h-4 text-gray-600" /> }
  ]

  function onPickImage() {
    fileInputRef.current?.click()
  }

  function onFileChange(e) {
    setImageError('')
    const file = e.target.files?.[0]
    if (!file) return
    const isImage = /^image\/(png|jpe?g|webp|gif)$/i.test(file.type)
    if (!isImage) { setImageError('Please select a valid image file'); return }
    const maxBytes = 2 * 1024 * 1024
    if (file.size > maxBytes) { setImageError('Image must be under 2MB'); return }
    const reader = new FileReader()
    reader.onload = () => setImageDataUrl(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  function removeImage() {
    setImageDataUrl('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function addProduct(e) {
    e.preventDefault()
    try {
      setSaving(true)
      const payload = {
        name,
        description: desc,
        category,
        price: parseFloat(price || 0),
        stock: parseInt(stock || 0),
        images: imageDataUrl ? [{ url: imageDataUrl, alt: name }] : []
      }
      await post('/api/products', payload)
      notify({ type: 'success', title: 'Product Created', message: 'Your product has been added successfully!' })
      navigate('/merchant/products')
    } catch (err) {
      notify({ type: 'error', title: 'Create Failed', message: err.message })
    } finally { setSaving(false) }
  }

  const isFormValid = name && price && stock
  const selectedCategory = categories.find(c => c.id === category)

  return (
    <div className="p-3 pb-16">
      <h1 className="text-lg font-semibold mb-3 text-black">{t('Add Product')}</h1>

      <form onSubmit={addProduct} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-black mb-1">{t('Name')}</label>
            <input className="w-full border border-gray-300 rounded-lg p-3 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder={t('Product name')} value={name} onChange={e=>setName(e.target.value)} />
          </div>
        </div>
      </motion.div>

      <div className="max-w-2xl mx-auto">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={addProduct}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6 space-y-6"
        >
          {/* Product Image Section */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">{t('Category')}</label>
            <select className="w-full border border-gray-300 rounded-lg p-3 bg-white text-black focus:outline-none focus:ring-2 focus:ring-orange-400" value={category} onChange={e=>setCategory(e.target.value)}>
              <option value="food">{t('Food')}</option>
              <option value="groceries">{t('Groceries')}</option>
              <option value="pharmacy">{t('Pharmacy')}</option>
              <option value="electronics">{t('Electronics')}</option>
              <option value="clothing">{t('Clothing')}</option>
              <option value="books">{t('Books')}</option>
              <option value="other">{t('Other')}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 col-span-2">
            <div>
              <label className="block text-sm font-medium text-black mb-1">{t('Price')}</label>
              <input className="w-full border border-gray-300 rounded-lg p-3 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder={t('0.00')} inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">{t('Stock')}</label>
              <input className="w-full border border-gray-300 rounded-lg p-3 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder={t('0')} inputMode="numeric" value={stock} onChange={e=>setStock(e.target.value)} />
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-black mb-1">{t('Description')}</label>
            <textarea rows={4} className="w-full border border-gray-300 rounded-lg p-3 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder={t('Describe the product')} value={desc} onChange={e=>setDesc(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-2">{t('Product Photo')}</label>
          {!imageDataUrl ? (
            <button type="button" onClick={onPickImage} className="w-full border-2 border-dashed border-gray-300 hover:border-orange-400 rounded-xl p-6 bg-white text-gray-600 flex flex-col items-center justify-center gap-2 transition">
              <FiImage className="text-black" />
              <span className="text-sm">{t('Tap to upload image (PNG, JPG, WEBP, max 2MB)')}</span>
            </button>
          ) : (
            <div className="relative">
              <img src={imageDataUrl} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-gray-300" />
              <button type="button" onClick={removeImage} className="absolute top-2 right-2 bg-white/90 text-black rounded-full p-2 border border-gray-300">
                <FiX />
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: isFormValid && !saving ? 1.02 : 1 }}
            whileTap={{ scale: isFormValid && !saving ? 0.98 : 1 }}
            disabled={saving || !isFormValid}
            type="submit"
            className={`w-full flex items-center justify-center gap-3 rounded-2xl py-4 font-semibold text-lg shadow-lg transition-all ${isFormValid && !saving
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-xl hover:from-orange-600 hover:to-amber-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating Product...
              </>
            ) : (
              <>
                <FiPlus className="w-5 h-5" />
                Create Product
              </>
            )}
          </motion.button>

        <motion.button whileTap={{ scale:0.98 }} disabled={saving || !name || !price || !stock} className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white rounded-xl p-3 font-semibold disabled:opacity-60">
          <FiPlus /> {saving ? t('Saving...') : t('Add Product')}
        </motion.button>
      </form>
    </div>
  )
}
