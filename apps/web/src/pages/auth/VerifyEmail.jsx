import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Spinner } from '../../shared/ui/Spinner.jsx'
import { useToast } from '../../shared/ui/Toast.jsx'

export default function VerifyEmail(){
  const { token } = useParams()
  const { notify } = useToast()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')

  useEffect(()=>{
    let active = true
    async function run(){
      try{
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/verify-email/${token}`)
        const data = await res.json()
        if (!active) return
        if(res.ok){
          setStatus('success'); setMessage(data.message||'Email verified successfully')
          notify({ type:'success', title:'Verified', message:'You can now log in' })
        } else {
          setStatus('error'); setMessage(data.message||'Invalid or expired token')
          notify({ type:'error', title:'Verification failed', message: data.message })
        }
      }catch(err){
        if (!active) return
        setStatus('error'); setMessage(err.message)
        notify({ type:'error', title:'Verification failed', message: err.message })
      }
    }
    run()
    return ()=>{ active=false }
  },[token])

  return (
    <div className="p-6 max-w-sm mx-auto text-center">
      {status==='loading' && (
        <div className="flex flex-col items-center gap-3">
          <Spinner size={40} />
          <div>Verifying your email…</div>
        </div>
      )}
      {status!=='loading' && (
        <div className="space-y-4">
          <div className={`text-lg font-semibold ${status==='success'?'text-brand-600':'text-red-600'}`}>{message}</div>
          <Link to="/login" className="btn-brand rounded px-4 py-2 inline-block">Go to login</Link>
        </div>
      )}
    </div>
  )
}


