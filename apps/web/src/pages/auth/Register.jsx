import { useState } from 'react'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { motion } from 'framer-motion'
import {
  FiUser,
  FiMail,
  FiLock,
  FiUserCheck,
  FiChevronDown,
  FiPhone,
  FiBriefcase,
  FiFileText,
} from 'react-icons/fi'
import { useToast } from '../../shared/ui/Toast.jsx'
import { useNavigate } from 'react-router-dom'

export default function Register() {
  const { t } = useI18n()
  const { register: registerUser } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'customer',
    phone: '',
    businessName: '',
    businessLicense: '',
    taxId: '',
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
      setMessage('Registered successfully. Please verify your email.')
      notify({
        type: 'success',
        title: 'Registration complete',
        message: 'Check your email to verify your account.',
      })
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err.message)
      notify({
        type: 'error',
        title: 'Registration failed',
        message: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center px-5 py-10 text-black">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 border border-orange-100 flex flex-col items-center"
      >
        {/* App header */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center mb-6"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center shadow-lg mb-3">
            <FiUser className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{t('Create Account')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('Join us and start exploring')}</p>
        </motion.div>

        {/* Form */}
        <form onSubmit={submit} className="w-full space-y-4">
          {/* Name fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm focus-within:ring-2 ring-orange-400 transition">
              <FiUser className="text-orange-500 text-lg" />
              <input
                className="flex-1 bg-transparent placeholder-gray-400 text-sm outline-none"
                placeholder={t('First name')}
                value={form.firstName}
                onChange={e => update('firstName', e.target.value)}
              />
            </div>
            <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm focus-within:ring-2 ring-orange-400 transition">
              <FiUser className="text-orange-500 text-lg" />
              <input
                className="flex-1 bg-transparent placeholder-gray-400 text-sm outline-none"
                placeholder={t('Last name')}
                value={form.lastName}
                onChange={e => update('lastName', e.target.value)}
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm focus-within:ring-2 ring-orange-400 transition">
            <FiMail className="text-orange-500 text-lg" />
            <input
              className="flex-1 bg-transparent placeholder-gray-400 text-sm outline-none"
              placeholder={t('Email')}
              type="email"
              value={form.email}
              onChange={e => update('email', e.target.value)}
            />
          </div>

          <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm focus-within:ring-2 ring-orange-400 transition">
            <FiLock className="text-orange-500 text-lg" />
            <input
              className="flex-1 bg-transparent placeholder-gray-400 text-sm outline-none"
              placeholder={t('Password')}
              type="password"
              value={form.password}
              onChange={e => update('password', e.target.value)}
            />
          </div>

          <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm focus-within:ring-2 ring-orange-400 transition">
            <FiPhone className="text-orange-500 text-lg" />
            <input
              className="flex-1 bg-transparent placeholder-gray-400 text-sm outline-none"
              placeholder={t('Phone number')}
              value={form.phone}
              onChange={e => update('phone', e.target.value)}
            />
          </div>

          {/* Role Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full bg-gray-50 rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm focus-within:ring-2 ring-orange-400 transition text-sm text-black"
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
                className="absolute w-full bg-white border border-gray-200 rounded-xl shadow-md mt-2 overflow-hidden z-10"
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
                    {t(r)}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Merchant fields */}
          {form.role === 'merchant' && (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm focus-within:ring-2 ring-orange-400 transition">
                <FiBriefcase className="text-orange-500 text-lg" />
                <input
                  className="flex-1 bg-transparent placeholder-gray-400 text-sm outline-none"
                  placeholder={t('Business name')}
                  value={form.businessName}
                  onChange={e => update('businessName', e.target.value)}
                />
              </div>

              <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm focus-within:ring-2 ring-orange-400 transition">
                <FiFileText className="text-orange-500 text-lg" />
                <input
                  className="flex-1 bg-transparent placeholder-gray-400 text-sm outline-none"
                  placeholder={t('Business License')}
                  value={form.businessLicense}
                  onChange={e => update('businessLicense', e.target.value)}
                />
              </div>

              <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm focus-within:ring-2 ring-orange-400 transition">
                <FiFileText className="text-orange-500 text-lg" />
                <input
                  className="flex-1 bg-transparent placeholder-gray-400 text-sm outline-none"
                  placeholder={t('Tax ID')}
                  value={form.taxId}
                  onChange={e => update('taxId', e.target.value)}
                />
              </div>
            </div>
          )}

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
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 rounded-2xl mt-2 shadow-md hover:shadow-lg transition-all disabled:opacity-70 active:scale-95"
          >
            {loading ? t('Registering...') : t('Register')}
          </motion.button>
        </form>

        <div className="flex flex-col items-center mt-5">
          <p className="text-center text-sm text-gray-600">
            {t('Already have an account?')}{' '}
            <a href="/login" className="text-orange-600 font-medium hover:underline">
              {t('Login')}
            </a>
          </p>
        </div>
      </motion.div>

      {/* Background glow accent */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1 }}
        className="absolute bottom-0 left-0 w-40 h-40 bg-orange-200 rounded-full blur-3xl opacity-30"
      />
    </div>
  )
}
