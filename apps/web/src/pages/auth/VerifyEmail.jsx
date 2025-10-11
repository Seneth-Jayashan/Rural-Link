import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Spinner } from '../../shared/ui/Spinner.jsx'
import { useToast } from '../../shared/ui/Toast.jsx'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'

export default function VerifyEmail() {
  const { token, hint } = useParams()
  const { notify } = useToast()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const ranRef = useRef(false)
  const navigate = useNavigate()
  const { t } = useI18n()

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    async function verify() {
      try {
        const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/verify-email/${token}/${hint}`
        console.log('🔍 Fetching:', apiUrl)
        const res = await fetch(apiUrl)
        const data = await res.json().catch(() => ({ message: 'Invalid response' }))
        console.log('✅ Response:', res.status, data)

        if (res.ok) {
          setStatus('success')
          setMessage(data.message || t('Email verified successfully'))
          notify({ type: 'success', title: t('Verified'), message: t('You can now log in') })

          // Wait 2 seconds, then open the app
          setTimeout(() => {
            // Try to open the Android app via deep link
            window.location.href = `rurallink://login`      
          }, 2000)
        } else {
          setStatus('error')
          setMessage(data.message || t('Invalid or expired token'))
          notify({ type: 'error', title: t('Verification failed'), message: data.message })
        }
      } catch (err) {
        console.error('❌ Verification failed:', err)
        setStatus('error')
        setMessage(err.message || t('Something went wrong'))
        notify({ type: 'error', title: t('Verification failed'), message: err.message })
      }
    }

    verify()
  }, [token, hint])

  return (
    <div className="p-6 max-w-sm mx-auto text-center">
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-3">
          <Spinner size={40} />
          <div>{t('Verifying your email…')}</div>
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
            {t('Go to login')}
          </Link>
        </div>
      )}
    </div>
  )
}
