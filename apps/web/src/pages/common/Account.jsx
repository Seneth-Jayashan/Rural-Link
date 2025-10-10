import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'
import { get, put, post, API_BASE } from '../../shared/api.js'
import { motion } from 'framer-motion'
import { User as UserIcon, Globe2, LogOut, FileText, Phone as PhoneIcon, Pencil as PencilIcon } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export default function Account(){
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { lang, setLang, t } = useI18n()
  const [profile, setProfile] = useState({ firstName:'', lastName:'', phone:'', address:'', profileImage:'' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [editing, setEditing] = useState(false)
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

  // removed photo fetching logic

  const onSave = async ()=>{
    setSaving(true)
    setMessage('')
    try{
      const res = await put('/api/auth/profile', profile)
      if(res?.success){ setMessage(t('Profile updated successfully')) }
    }catch(e){ setMessage(e.message || t('Failed to update')) }
    setSaving(false)
    setEditing(false)
  }

  if(loading){
    return <div className="p-6">{t('Loading...')}</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 p-4 pb-24">
      <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} className="max-w-2xl mx-auto space-y-6">
        {/* Compact Profile Card with Avatar, Name and Edit */}
        <section className="bg-white rounded-2xl shadow-md border border-orange-100 p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-orange-100 border border-orange-200 flex items-center justify-center">
              {(photoPreview || photoUrl) ? (
                <img key={photoBust} src={photoPreview || photoUrl} alt={fullName} className="w-full h-full object-cover" onError={()=>{ setPhotoPreview(''); setPhotoUrl('') }} />
              ) : (
                <UserIcon className="w-8 h-8 text-orange-500" />
              )}
              {editing && (
                <>
                  <input id="accountPhoto" type="file" accept="image/*" onChange={onPhotoChange} className="hidden" />
                  <label htmlFor="accountPhoto" className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-md flex items-center justify-center cursor-pointer">
                    <PencilIcon className="w-3.5 h-3.5" />
                  </label>
                </>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{fullName}</h2>
              <p className="text-gray-500 text-sm">{user?.email}</p>
            </div>
            <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} onClick={()=> navigate('/account/edit')}
              className="px-4 py-2 rounded-xl border border-orange-300 text-orange-700 font-semibold hover:bg-orange-50">
              {t('Edit Account')}
            </motion.button>
          </div>

          {/* Editing moved to /account/edit */}
        </section>

        {/* Language & Legal */}
        <section className="bg-white rounded-2xl shadow-md border border-orange-100 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">{t('Language')}</h2>
          </div>
          <select value={lang} onChange={(e)=> setLang(e.target.value)} className="w-full sm:w-48 px-3 py-2 border rounded-xl">
            <option value="en">EN</option>
            <option value="si">SI</option>
            <option value="ta">TA</option>
          </select>

          <Link to="/terms" className="flex items-center gap-2 text-sm text-gray-700 hover:text-orange-600">
            <FileText className="w-4 h-4" /> {t('Terms and Conditions')}
          </Link>
        </section>

        {/* Auth */}
        <section className="bg-white rounded-2xl shadow-md border border-orange-100 p-6">
          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={logout}
            className="w-full sm:w-auto px-5 py-2 bg-red-500 text-white rounded-xl font-semibold shadow-md hover:bg-red-600 flex items-center gap-2 justify-center">
            <LogOut className="w-4 h-4" /> {t('Logout')}
          </motion.button>
        </section>
      </motion.div>
    </div>
  )
}


