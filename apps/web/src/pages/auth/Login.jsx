import { useEffect, useState } from 'react'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { motion } from 'framer-motion'
import { FiMail, FiLock } from 'react-icons/fi'
import { useToast } from '../../shared/ui/Toast.jsx'

export default function Login(){
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login, user } = useAuth()
  const { notify } = useToast()
  useEffect(()=>{ if(user) window.location.href='/' },[user])

  async function submit(e){
    e.preventDefault()
    setLoading(true)
    setError('')
    try{
      const u = await login(email, password)
      if (u?.token) localStorage.setItem('token', u.token)
      notify({ type:'success', title:'Welcome back', message:'Login successful' })
    }catch(err){
      setError(err.message)
      notify({ type:'error', title:'Login failed', message: err.message })
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-sm mx-auto">
      <motion.h1 className="text-2xl font-semibold mb-4"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>{t('login')}</motion.h1>
      <form className="space-y-3" onSubmit={submit}>
        <div className="w-full border rounded p-2 flex items-center gap-2">
          <FiMail className="text-gray-400" />
          <input className="flex-1 outline-none" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div className="w-full border rounded p-2 flex items-center gap-2">
          <FiLock className="text-gray-400" />
          <input className="flex-1 outline-none" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        {error && <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="text-red-600 text-sm">{error}</motion.div>}
        <motion.button whileTap={{ scale: 0.98 }} className="w-full btn-brand rounded p-2 disabled:opacity-50" disabled={loading}>{loading?'...':t('login')}</motion.button>
      </form>
    </div>
  )
}


