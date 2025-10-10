import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'
import { get, put, post, API_BASE } from '../../shared/api.js'
import { motion } from 'framer-motion'
import { User as UserIcon, Phone as PhoneIcon, Pencil as PencilIcon, ArrowLeft } from 'lucide-react'

export default function AccountEdit(){
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useI18n()
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

  const onChange = (e)=> setProfile(p=> ({ ...p, [e.target.name]: e.target.value }))

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
      if(res?.success){ setMessage(t('Profile updated successfully')); setTimeout(()=> navigate('/account'), 600) }
    }catch(e){ setMessage(e.message || t('Failed to update')) }
    setSaving(false)
  }

  if(loading){
    return <div className="p-6">{t('Loading...')}</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 p-4 pb-24">
      <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} onClick={()=> navigate(-1)}
            className="p-2 rounded-xl border border-orange-200 text-orange-600 hover:bg-orange-50">
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <h1 className="text-xl font-semibold text-gray-900">{t('Edit Account')}</h1>
        </div>

        <section className="bg-white rounded-2xl shadow-md border border-orange-100 p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-orange-100 border border-orange-200 flex items-center justify-center group cursor-pointer">
              {(photoPreview || photoUrl) ? (
                <img key={photoBust} src={photoPreview || photoUrl} alt={fullName} className="w-full h-full object-cover" onError={()=>{ setPhotoPreview(''); setPhotoUrl('') }} />
              ) : (
                <UserIcon className="w-10 h-10 text-orange-500" />
              )}
              <input id="accountPhotoEdit" type="file" accept="image/*" onChange={onPhotoChange} className="hidden" />
              <label
                htmlFor="accountPhotoEdit"
                className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors duration-200"
                role="button"
                tabIndex={0}
                aria-label={t('Change photo')}
                title={t('Change photo')}
              >
                <div className="opacity-0 group-hover:opacity-100 text-white flex items-center gap-2 text-xs font-medium bg-black/30 px-3 py-1.5 rounded-full">
                  <PencilIcon className="w-4 h-4" />
                  <span>{t('Change photo')}</span>
                </div>
              </label>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">{fullName}</h2>
              <p className="text-gray-500 text-sm">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t('First Name')}</label>
              <input name="firstName" value={profile.firstName} onChange={onChange} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-orange-400 outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t('Last Name')}</label>
              <input name="lastName" value={profile.lastName} onChange={onChange} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-orange-400 outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">{t('Phone Number')}</label>
              <div className="flex items-center gap-2 w-full px-3 py-2 border rounded-xl focus-within:ring-2 focus-within:ring-orange-400">
                <PhoneIcon className="w-4 h-4 text-orange-500" />
                <input
                  name="phone"
                  value={profile.phone}
                  onChange={onChange}
                  placeholder={t('Enter your phone number')}
                  className="flex-1 outline-none"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">{t('Include country code if applicable')}</p>
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={onSave} disabled={saving}
                className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-semibold shadow-md hover:bg-emerald-700 disabled:opacity-50">
                {saving ? t('Saving...') : t('Save Changes')}
              </motion.button>
              {message && <div className="text-sm text-green-600">{message}</div>}
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  )
}


