import { useEffect, useState } from 'react'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { motion } from 'framer-motion'
import { FiMail, FiLock } from 'react-icons/fi'
import { useToast } from '../../shared/ui/Toast.jsx'

export default function Login() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login, user } = useAuth()
  const { notify } = useToast()

  useEffect(() => {
    if (user) window.location.href = '/'
  }, [user])

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const u = await login(email, password)
      if (u?.token) localStorage.setItem('token', u.token)
      notify({ type: 'success', title: 'Welcome back', message: 'Login successful' })
    } catch (err) {
      setError(err.message)
      notify({ type: 'error', title: 'Login failed', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-white flex items-center justify-center px-4 text-black">
      <motion.div
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8 border border-orange-100"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.h1
          className="text-center text-3xl font-bold mb-6 text-orange-500"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {t('login')}
        </motion.h1>

        <form onSubmit={submit} className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2 focus-within:ring-2 ring-orange-400 transition">
            <FiMail className="text-orange-500 text-lg" />
            <input
              className="flex-1 bg-transparent placeholder-gray-500 outline-none text-sm"
              placeholder="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2 focus-within:ring-2 ring-orange-400 transition">
            <FiLock className="text-orange-500 text-lg" />
            <input
              className="flex-1 bg-transparent placeholder-gray-500 outline-none text-sm"
              placeholder="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm text-center"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 rounded-xl mt-2 shadow-md hover:shadow-lg transition-all disabled:opacity-70 active:scale-95"
          >
            {loading ? 'Logging in...' : t('login')}
          </motion.button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Don’t have an account?{' '}
          <a href="/register" className="text-orange-600 font-medium hover:underline">
            Register
          </a>
        </p>
      </motion.div>
    </div>
  )
}
