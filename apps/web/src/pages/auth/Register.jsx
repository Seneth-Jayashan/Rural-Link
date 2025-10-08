import { useState } from 'react'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { motion } from 'framer-motion'
import { FiUser, FiMail, FiLock, FiUserCheck } from 'react-icons/fi'
import { useToast } from '../../shared/ui/Toast.jsx'

export default function Register(){
  const { t } = useI18n()
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', password:'', role:'customer' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function update(k,v){ setForm(prev=>({ ...prev, [k]:v })) }

  const { register:registerUser } = useAuth()
  const { notify } = useToast()
  async function submit(e){
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try{
      await registerUser(form)
      setMessage('Registered. Please verify your email.')
      notify({ type:'success', title:'Registration complete', message:'Check your email to verify' })
    }catch(err){
      setError(err.message)
      notify({ type:'error', title:'Registration failed', message: err.message })
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-sm mx-auto">
      <motion.h1 className="text-2xl font-semibold mb-4" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>{t('register')}</motion.h1>
      <form className="space-y-3" onSubmit={submit}>
        <div className="grid grid-cols-2 gap-2">
          <div className="border rounded p-2 flex items-center gap-2"><FiUser /><input className="flex-1 outline-none" placeholder="First name" value={form.firstName} onChange={e=>update('firstName', e.target.value)} /></div>
          <div className="border rounded p-2 flex items-center gap-2"><FiUser /><input className="flex-1 outline-none" placeholder="Last name" value={form.lastName} onChange={e=>update('lastName', e.target.value)} /></div>
        </div>
        <div className="w-full border rounded p-2 flex items-center gap-2"><FiMail /><input className="flex-1 outline-none" placeholder="Email" value={form.email} onChange={e=>update('email', e.target.value)} /></div>
        <div className="w-full border rounded p-2 flex items-center gap-2"><FiLock /><input className="flex-1 outline-none" placeholder="Password" type="password" value={form.password} onChange={e=>update('password', e.target.value)} /></div>
        <div className="w-full border rounded p-2 flex items-center gap-2"><FiUserCheck /><select className="flex-1 outline-none" value={form.role} onChange={e=>update('role', e.target.value)}>
          <option value="customer">Customer</option>
          <option value="merchant">Merchant</option>
          <option value="deliver">Deliver</option>
        </select></div>
        {error && <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="text-red-600 text-sm">{error}</motion.div>}
        {message && <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="text-green-700 text-sm">{message}</motion.div>}
        <motion.button whileTap={{ scale: 0.98 }} className="w-full btn-brand rounded p-2 disabled:opacity-50" disabled={loading}>{loading?'...':t('register')}</motion.button>
      </form>
    </div>
  )
}


