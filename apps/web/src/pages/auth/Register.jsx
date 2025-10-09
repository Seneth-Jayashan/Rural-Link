import { useState } from 'react'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { motion } from 'framer-motion'
import { FiUser, FiMail, FiLock, FiUserCheck, FiChevronDown } from 'react-icons/fi'
import { useToast } from '../../shared/ui/Toast.jsx'

export default function Register() {
  const { t } = useI18n()
  const { register: registerUser } = useAuth()
  const { notify } = useToast()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'customer',
    // deliver-specific fields
    employeeId: '',
    department: '',
    hireDate: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  function update(k, v) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      await registerUser(form)
      setMessage('Registered. Please verify your email.')
      notify({
        type: 'success',
        title: 'Registration complete',
        message: 'Check your email to verify.'
      })
    } catch (err) {
      setError(err.message)
      notify({
        type: 'error',
        title: 'Registration failed',
        message: err.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-white flex items-center justify-center px-5 text-black">
      <motion.div
        className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.h1
          className="text-center text-3xl font-bold mb-6 text-orange-500"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {t('register')}
        </motion.h1>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-gray-300 rounded-lg p-3 flex items-center gap-2">
              <FiUser className="text-orange-500 text-lg" />
              <input
                className="flex-1 bg-transparent text-black placeholder-gray-500 outline-none text-sm"
                placeholder="First name"
                value={form.firstName}
                onChange={e => update('firstName', e.target.value)}
              />
            </div>
            <div className="border border-gray-300 rounded-lg p-3 flex items-center gap-2">
              <FiUser className="text-orange-500 text-lg" />
              <input
                className="flex-1 bg-transparent text-black placeholder-gray-500 outline-none text-sm"
                placeholder="Last name"
                value={form.lastName}
                onChange={e => update('lastName', e.target.value)}
              />
            </div>
          </div>

          <div className="border border-gray-300 rounded-lg p-3 flex items-center gap-2">
            <FiMail className="text-orange-500 text-lg" />
            <input
              className="flex-1 bg-transparent text-black placeholder-gray-500 outline-none text-sm"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={e => update('email', e.target.value)}
            />
          </div>

          <div className="border border-gray-300 rounded-lg p-3 flex items-center gap-2">
            <FiLock className="text-orange-500 text-lg" />
            <input
              className="flex-1 bg-transparent text-black placeholder-gray-500 outline-none text-sm"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={e => update('password', e.target.value)}
            />
          </div>

          {/* Custom Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full border border-gray-300 rounded-lg p-3 flex items-center justify-between text-sm text-black bg-white"
            >
              <div className="flex items-center gap-2">
                <FiUserCheck className="text-orange-500 text-lg" />
                <span className="capitalize">{t(form.role)}</span>
              </div>
              <FiChevronDown
                className={`text-orange-500 transition-transform duration-200 ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute w-full bg-white border border-gray-200 rounded-lg shadow-md mt-2 overflow-hidden z-10"
              >
                {['customer', 'merchant', 'deliver'].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      update('role', r)
                      setDropdownOpen(false)
                    }}
                    className={`w-full text-left px-4 py-3 text-sm capitalize ${
                      form.role === r
                        ? 'bg-orange-50 text-orange-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </motion.div>
            )}
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

          {message && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-green-600 text-sm text-center"
            >
              {message}
            </motion.div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl mt-2 shadow-md disabled:opacity-70 transition-transform active:scale-95"
          >
            {loading ? 'Registering...' : t('register')}
          </motion.button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-4">
          Already have an account?{' '}
          <a href="/login" className="text-orange-500 font-medium">
            Log in
          </a>
        </p>
      </motion.div>
    </div>
  )
}
