import { useRef, useState } from 'react'
import { uploadFormData } from '../../shared/api.js'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiPlus, FiImage, FiX, FiArrowLeft, FiDollarSign,
  FiPackage, FiTag, FiFileText, FiBox,
  FiShoppingBag, FiCpu, FiBook, FiShoppingCart, FiHeart, FiChevronDown
} from 'react-icons/fi'
import { useToast } from '../../shared/ui/Toast.jsx'
import { useNavigate } from 'react-router-dom'

export default function ProductCreate() {
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
      
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('name', name)
      formData.append('description', desc)
      formData.append('category', category)
      formData.append('price', parseFloat(price || 0))
      formData.append('stock', parseInt(stock || 0))
      
      // Add image file if selected
      if (fileInputRef.current?.files?.[0]) {
        formData.append('image', fileInputRef.current.files[0])
      }
      
      // Use the uploadFormData helper
      await uploadFormData('/api/products', formData, 'POST')
      
      notify({ type: 'success', title: 'Product Created', message: 'Your product has been added successfully!' })
      navigate('/merchant/products')
    } catch (err) {
      notify({ type: 'error', title: 'Create Failed', message: err.message })
    } finally { setSaving(false) }
  }

  const isFormValid = name && price && stock
  const selectedCategory = categories.find(c => c.id === category)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 p-4 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate('/merchant/products')}
            className="p-2 bg-white rounded-2xl shadow-lg border border-orange-100 hover:shadow-xl transition-all"
          >
            <FiArrowLeft className="w-5 h-5 text-orange-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
            <p className="text-gray-600 text-sm mt-1">Create a new product for your catalog</p>
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
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-orange-100 rounded-xl">
                <FiImage className="w-4 h-4 text-orange-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Product Image</h2>
            </div>

            <AnimatePresence>
              {!imageDataUrl ? (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onPickImage}
                  className="w-full border-2 border-dashed border-gray-300 hover:border-orange-400 rounded-2xl p-8 bg-gray-50/50 text-gray-600 flex flex-col items-center justify-center gap-3 transition-all hover:bg-orange-50/50 group"
                >
                  <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors">
                    <FiImage className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">Upload Product Image</div>
                    <div className="text-sm text-gray-500 mt-1">PNG, JPG, WEBP, GIF • Max 2MB</div>
                  </div>
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative group"
                >
                  <img
                    src={imageDataUrl}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-2xl border-2 border-orange-200 shadow-md group-hover:shadow-lg transition-all"
                  />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={removeImage}
                    className="absolute top-3 right-3 bg-white/90 text-red-600 rounded-full p-2 border border-red-200 shadow-lg hover:bg-red-50 transition-all"
                  >
                    <FiX className="w-4 h-4" />
                  </motion.button>
                  <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                    Image Preview
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {imageError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
              >
                {imageError}
              </motion.div>
            )}
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={onFileChange} />
          </div>

          {/* Basic Information */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-100 rounded-xl">
                <FiPackage className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            </div>

            <div className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                <input
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none placeholder-gray-400"
                  placeholder="Enter product name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              {/* Category and Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category (custom dropdown) */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <button
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-full flex items-center justify-between border border-gray-200 rounded-2xl pl-10 pr-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all relative"
                  >
                    <div className="flex items-center gap-2 text-gray-700">
                      {selectedCategory?.icon}
                      <span>{selectedCategory?.name}</span>
                    </div>
                    <FiChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                    <FiTag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {showDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute z-20 mt-2 w-full bg-white border border-orange-100 rounded-2xl shadow-lg overflow-hidden"
                      >
                        {categories.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setCategory(c.id)
                              setShowDropdown(false)
                            }}
                            className={`w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-orange-50 transition-colors ${c.id === category ? 'bg-orange-100/60' : ''
                              }`}
                          >
                            {c.icon}
                            <span className="text-gray-700">{c.name}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
                  <div className="relative">
                    <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none placeholder-gray-400"
                      placeholder="0.00"
                      inputMode="decimal"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                    />
                  </div>
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock *</label>
                  <div className="relative">
                    <FiBox className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none placeholder-gray-400"
                      placeholder="0"
                      inputMode="numeric"
                      value={stock}
                      onChange={e => setStock(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple-100 rounded-xl">
                <FiFileText className="w-4 h-4 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Description</h2>
            </div>

            <textarea
              rows={4}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none placeholder-gray-400 resize-none"
              placeholder="Describe your product features, benefits, and details..."
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
            <div className="text-xs text-gray-500 mt-2">
              Optional but recommended for better customer understanding
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

          {/* Form Requirements */}
          <div className="text-center text-sm text-gray-500">
            * Required fields
          </div>
        </motion.form>
      </div>
    </div>
  )
}
