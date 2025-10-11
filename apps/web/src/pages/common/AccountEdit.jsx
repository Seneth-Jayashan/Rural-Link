import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'
import { get, put, post, API_BASE } from '../../shared/api.js'
import { motion, AnimatePresence } from 'framer-motion'
import { User as UserIcon, Phone as PhoneIcon, Pencil as PencilIcon, ArrowLeft, Mail, MapPin, Camera, Save } from 'lucide-react'

export default function AccountEdit(){
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useI18n()
  const [profile, setProfile] = useState({ 
    firstName:'', 
    lastName:'', 
    phone:'', 
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Sri Lanka',
    }, 
    profileImage:'' 
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoBust, setPhotoBust] = useState(0)

  useEffect(()=>{
    let cancelled = false
    const load = async ()=>{
      setLoading(true)
      try{
        const res = await get('/api/auth/me')
        if(!cancelled && res && res.user){
          setProfile({
            firstName: res.user.firstName || '',
            lastName: res.user.lastName || '',
            phone: res.user.phone || '',
            address: res.user.address || {
              street: '',
              city: '',
              state: '',
              zipCode: '',
              country: 'Sri Lanka',
            },
            profileImage: res.user.profileImage || ''
          })
          setPhotoUrl(res.user.profileImage ? `${API_BASE}${res.user.profileImage}` : '')
        }
      }catch{}
      setLoading(false)
    }
    load()
    return ()=>{ cancelled = true }
  },[])

  const fullName = useMemo(()=> `${profile.firstName} ${profile.lastName}`.trim() || user?.email || '—', [profile, user])

  const onChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1]
      setProfile(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }))
    } else {
      setProfile(prev => ({ ...prev, [name]: value }))
    }
  }

  const onPhotoChange = (e)=>{
    const file = e.target.files?.[0]
    if(!file) return
    if(file.size > 5 * 1024 * 1024) { setMessage(t('Image too large (max 5MB)')); return }
    if(!file.type.startsWith('image/')) { setMessage(t('Please select an image file')); return }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const onSave = async ()=>{
    setSaving(true)
    setMessage('')
    try{
      // If there is a new photo selected, upload it first
      if(photoFile){
        const fd = new FormData()
        fd.append('profilePic', photoFile)
        const resPhoto = await post('/api/auth/profile/photo', fd)
        if(resPhoto?.success && resPhoto.user?.profileImage){
          setProfile(p=> ({ ...p, profileImage: resPhoto.user.profileImage }))
          setPhotoUrl(`${API_BASE}${resPhoto.user.profileImage}`)
          setPhotoPreview('')
          setPhotoFile(null)
          setPhotoBust(v=> v+1)
        }
      }
      const res = await put('/api/auth/profile', profile)
      if(res?.success){ 
        setMessage(t('Profile updated successfully')); 
        setTimeout(()=> navigate('/account'), 1000) 
      }
    }catch(e){ setMessage(e.message || t('Failed to update')) }
    setSaving(false)
  }

  if(loading){
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('Loading...')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 p-4 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto mb-6"
      >
        <div className="flex items-center gap-3">
          <motion.button 
            whileHover={{ scale:1.05 }} 
            whileTap={{ scale:0.95 }} 
            onClick={()=> navigate(-1)}
            className="p-2 bg-white rounded-2xl shadow-lg border border-orange-100 hover:shadow-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-orange-600" />
          </motion.button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('Edit Profile')}</h1>
            <p className="text-gray-600 text-sm mt-1">{t('Update your personal information')}</p>
          </div>
        </div>
      </motion.div>

      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6 space-y-6"
        >
          {/* Profile Photo Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-orange-100 rounded-xl">
                <Camera className="w-4 h-4 text-orange-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">{t('Profile Photo')}</h2>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Profile Picture */}
              <div className="relative group">
                <div className="w-28 h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-100 to-amber-100 border-4 border-white shadow-xl">
                  <AnimatePresence mode="wait">
                    {(photoPreview || photoUrl) ? (
                      <motion.img
                        key={photoBust}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        src={photoPreview || photoUrl} 
                        alt={fullName} 
                        className="w-full h-full object-cover"
                        onError={()=>{ setPhotoPreview(''); setPhotoUrl('') }} 
                      />
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center"
                      >
                        <UserIcon className="w-12 h-12 text-orange-500" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Camera Button */}
                <input id="accountPhotoEdit" type="file" accept="image/*" onChange={onPhotoChange} className="hidden" />
                <motion.label 
                  htmlFor="accountPhotoEdit"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg flex items-center justify-center cursor-pointer border-2 border-white transition-all"
                >
                  <PencilIcon className="w-4 h-4" />
                </motion.label>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{fullName}</h3>
                <p className="text-gray-500 text-sm mb-2">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Personal Information Form */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-100 rounded-xl">
                <UserIcon className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">{t('Personal Information')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('First Name')} *</label>
                <input 
                  name="firstName" 
                  value={profile.firstName} 
                  onChange={onChange}
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                  placeholder={t('Enter your first name')}
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Last Name')} *</label>
                <input 
                  name="lastName" 
                  value={profile.lastName} 
                  onChange={onChange}
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                  placeholder={t('Enter your last name')}
                />
              </div>

              {/* Email (Read-only) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Email Address')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input 
                    value={user?.email || ''}
                    disabled
                    className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-3 bg-gray-100 text-gray-500 cursor-not-allowed"
                    placeholder={t('Email address')}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">{t('Email cannot be changed')}</p>
              </div>

              {/* Phone Number */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Phone Number')}</label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    name="phone"
                    value={profile.phone}
                    onChange={onChange}
                    placeholder={t('Enter your phone number')}
                    className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">{t('Include country code if applicable')}</p>
              </div>

              {/* Address Section */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-green-100 rounded-xl">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('Address Information')}</h3>
                </div>
                
                <div className="space-y-4">
                  {/* Street Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Street Address')}</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        name="address.street"
                        value={profile.address.street}
                        onChange={onChange}
                        placeholder={t('Enter street address')}
                        className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* City and State */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('City')}</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          name="address.city"
                          value={profile.address.city}
                          onChange={onChange}
                          placeholder={t('Enter city')}
                          className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('State/Province')}</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          name="address.state"
                          value={profile.address.state}
                          onChange={onChange}
                          placeholder={t('Enter state/province')}
                          className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Zip Code and Country */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('Postal Code')}</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          name="address.zipCode"
                          value={profile.address.zipCode}
                          onChange={onChange}
                          placeholder={t('Enter postal code')}
                          className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('Country')}</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          name="address.country"
                          value={profile.address.country}
                          onChange={onChange}
                          placeholder={t('Enter country')}
                          className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">{t('Your address helps with accurate deliveries')}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSave}
              disabled={saving || !profile.firstName || !profile.lastName}
              className={`flex-1 flex items-center justify-center gap-3 rounded-2xl py-4 font-semibold text-lg shadow-lg transition-all ${
                !saving && profile.firstName && profile.lastName
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-xl hover:from-orange-600 hover:to-amber-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('Saving Changes...')}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {t('Save Changes')}
                </>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(-1)}
              className="flex-1 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-all"
            >
              {t('Cancel')}
            </motion.button>
          </div>

          {/* Status Message */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                className={`p-4 rounded-2xl text-center font-medium ${
                  message.includes('success') 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}