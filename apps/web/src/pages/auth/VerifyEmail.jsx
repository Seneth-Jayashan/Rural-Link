import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Spinner } from '../../shared/ui/Spinner.jsx'
import { useToast } from '../../shared/ui/Toast.jsx'
import { useNavigate } from 'react-router-dom'  // <== Import useNavigate

export default function VerifyEmail() {
  const { token, hint } = useParams()
  const { notify } = useToast()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const ranRef = useRef(false)
  const navigate = useNavigate() // <== Initialize navigate


  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    async function verify() {
      try {
        const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/verify-email/${token}/${hint}`
        console.log('🔍 Fetching:', apiUrl)
        const res = await fetch(apiUrl)

        // Handle non-JSON responses gracefully
        let data = {}
        try {
          data = await res.json()
        } catch (e) {
          console.warn('⚠️ Non-JSON response from server:', e)
          data = { message: 'Unexpected response from server' }
        }

        console.log('✅ Response:', res.status, data)

        if (res.ok) {
          setStatus('success')
          setMessage(data.message || 'Email verified successfully')
          notify({ type: 'success', title: 'Verified', message: 'You can now log in' })

          setTimeout(() => {
            navigate('/login')
          }, 2500)
        } else {
          setStatus('error')
          setMessage(data.message || 'Invalid or expired token')
          notify({ type: 'error', title: 'Verification failed', message: data.message })
        }
      } catch (err) {
        console.error('❌ Verification failed:', err)
        setStatus('error')
        setMessage(err.message || 'Something went wrong')
        notify({ type: 'error', title: 'Verification failed', message: err.message })
      }
    }

    verify()
  }, [token, hint])

  console.log('🧩 Render status:', status, message)

  return (
    <div className="p-6 max-w-sm mx-auto text-center">
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-3">
          <Spinner size={40} />
          <div>Verifying your email…</div>
        </div>
      )}
      {status !== 'loading' && (
        <div className="space-y-4">
          <div
            className={`text-lg font-semibold ${
              status === 'success' ? 'text-brand-600' : 'text-red-600'
            }`}
          >
            {message}
          </div>
          <Link to="/login" className="btn-brand rounded px-4 py-2 inline-block">
            Go to login
          </Link>
        </div>
      )}
    </div>
  )
}
