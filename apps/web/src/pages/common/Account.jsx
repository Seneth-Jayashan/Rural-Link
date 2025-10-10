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
    </div>
  )
}


