import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'
import { get, put, post, API_BASE } from '../../shared/api.js'
import { motion, AnimatePresence } from 'framer-motion'
import { User as UserIcon, Globe2, LogOut, FileText, Phone as PhoneIcon, MapPin, Mail, Edit3, Camera, Shield, HelpCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export default function Account(){
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { lang, setLang, t } = useI18n()
  const [profile, setProfile] = useState({ firstName:'', lastName:'', phone:'', address:'', profileImage:'' })
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
            address: res.user.address || '',
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
  
  const formattedAddress = useMemo(() => {
    if (!profile.address) return '—'
    if (typeof profile.address === 'string') return profile.address
    if (typeof profile.address === 'object') {
      const { street, city, state, zipCode, country } = profile.address
      const parts = [street, city, state, zipCode, country].filter(Boolean)
      return parts.length > 0 ? parts.join(', ') : '—'
    }
    return '—'
  }, [profile.address])

  const onPhotoChange = (e)=>{
    const file = e.target.files?.[0]
    if(!file) return
    if(file.size > 5 * 1024 * 1024) { setMessage(t('Image too large (max 5MB)')); return }
    if(!file.type.startsWith('image/')) { setMessage(t('Please select an image file')); return }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const onUploadPhoto = async ()=>{
    if(!photoFile) return
    setSaving(true)
    setMessage('')
    try{
      const fd = new FormData()
      fd.append('profilePic', photoFile)
      const res = await post('/api/auth/profile/photo', fd)
      if(res?.success && res.user?.profileImage){
        setProfile(p=> ({ ...p, profileImage: res.user.profileImage }))
        setPhotoUrl(`${API_BASE}${res.user.profileImage}`)
        setPhotoPreview('')
        setPhotoFile(null)
        setPhotoBust(v=> v+1)
        setMessage(t('Profile photo updated'))
      }
    }catch(e){ setMessage(e.message || t('Failed to upload')) }
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm border-b border-orange-100 px-4 py-4 shadow-lg"
      >
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 text-center">{t('My Profile')}</h1>
          <p className="text-gray-600 text-sm text-center mt-1">{t('Manage your account settings')}</p>
        </div>
      </motion.div>

      <div className="max-w-2xl mx-auto p-4">
        <motion.div 
          initial={{ opacity:0, y:10 }} 
          animate={{ opacity:1, y:0 }} 
          className="space-y-6"
        >
          {/* Profile Picture Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6"
          >
            <div className="flex flex-col items-center space-y-4">
              {/* Circular Profile Picture */}
              <div className="relative">
                <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-orange-100 to-amber-100 border-4 border-white shadow-xl">
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
                <input id="accountPhoto" type="file" accept="image/*" onChange={onPhotoChange} className="hidden" />
                <motion.label 
                  htmlFor="accountPhoto" 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg flex items-center justify-center cursor-pointer border-2 border-white transition-all"
                >
                  <Camera className="w-4 h-4" />
                </motion.label>
              </div>

              {/* User Info */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{fullName}</h2>
                <p className="text-gray-500 text-sm">{user?.email}</p>
                <div className="mt-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium inline-block">
                  {user?.role || 'Customer'}
                </div>
              </div>

              {/* Upload Photo Button if there's a pending photo */}
              <AnimatePresence>
                {photoPreview && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={onUploadPhoto}
                    disabled={saving}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t('Uploading...')}
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        {t('Save Photo')}
                      </>
                    )}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.section>

          {/* Personal Information */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <UserIcon className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{t('Personal Information')}</h3>
              </div>
              <motion.button 
                whileHover={{ scale:1.05 }} 
                whileTap={{ scale:0.95 }} 
                onClick={()=> navigate('/account/edit')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <Edit3 className="w-4 h-4" />
                {t('Edit')}
              </motion.button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-orange-50/50 to-amber-50/50 rounded-2xl border border-orange-200">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <UserIcon className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">{t('Full Name')}</p>
                  <p className="text-gray-900 font-medium text-lg break-words">{fullName}</p>
                </div>
              </div>

              {/* Email - Fixed to stay on one line */}
              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-orange-50/50 to-amber-50/50 rounded-2xl border border-orange-200">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Mail className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">{t('Email')}</p>
                  <p className="text-gray-900 font-medium text-lg truncate">{user?.email || '—'}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-orange-50/50 to-amber-50/50 rounded-2xl border border-orange-200">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <PhoneIcon className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">{t('Phone')}</p>
                  <p className="text-gray-900 font-medium text-lg break-words">{profile.phone || '—'}</p>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-orange-50/50 to-amber-50/50 rounded-2xl border border-orange-200">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <MapPin className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">{t('Address')}</p>
                  <p className="text-gray-900 font-medium text-lg break-words">{formattedAddress}</p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Settings */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6 space-y-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-xl">
                <Globe2 className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{t('Settings')}</h3>
            </div>
            
            {/* Language */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50/50 to-amber-50/50 rounded-2xl border border-orange-200">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Globe2 className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium">{t('Language')}</p>
                  <p className="text-xs text-gray-500">{t('App language preference')}</p>
                </div>
              </div>
              <select 
                value={lang} 
                onChange={(e)=> setLang(e.target.value)} 
                className="px-4 py-2 border border-orange-200 rounded-xl bg-white text-sm focus:border-orange-300 focus:ring-2 focus:ring-orange-200 outline-none"
              >
                <option value="en">🇺🇸 English</option>
                <option value="si">🇱🇰 සිංහල</option>
                <option value="ta">🇱🇰 தமிழ்</option>
              </select>
            </div>

            {/* Terms */}
            <Link to="/terms" className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50/50 to-amber-50/50 rounded-2xl border border-orange-200 hover:bg-orange-100/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                  <FileText className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium">{t('Terms and Conditions')}</p>
                  <p className="text-xs text-gray-500">{t('Read our terms of service')}</p>
                </div>
              </div>
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            </Link>

            {/* Privacy Policy */}
            <Link to="/privacy" className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50/50 to-amber-50/50 rounded-2xl border border-orange-200 hover:bg-orange-100/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                  <Shield className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium">{t('Privacy Policy')}</p>
                  <p className="text-xs text-gray-500">{t('How we handle your data')}</p>
                </div>
              </div>
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            </Link>

            {/* Help & Support */}
            <Link to="/help" className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50/50 to-amber-50/50 rounded-2xl border border-orange-200 hover:bg-orange-100/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                  <HelpCircle className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium">{t('Help & Support')}</p>
                  <p className="text-xs text-gray-500">{t('Get help with the app')}</p>
                </div>
              </div>
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            </Link>
          </motion.section>

          {/* Logout */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6"
          >
            <motion.button 
              whileHover={{ scale:1.02 }} 
              whileTap={{ scale:0.98 }} 
              onClick={logout}
              className="w-full py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-3 hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl"
            >
              <LogOut className="w-5 h-5" /> 
              {t('Logout')}
            </motion.button>
          </motion.section>
        </motion.div>

        {/* Status Message */}
        <AnimatePresence>
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-24 left-4 right-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-4 rounded-2xl text-sm text-center shadow-xl backdrop-blur-sm"
            >
              {message}
              <motion.button 
                onClick={() => setMessage('')}
                className="absolute top-2 right-2 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs hover:bg-white/30 transition-colors"
              >
                ×
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}