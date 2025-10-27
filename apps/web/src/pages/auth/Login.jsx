import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { motion } from 'framer-motion'
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import { useToast } from '../../shared/ui/Toast.jsx'
import { requestNotificationPermission, saveFCMToken } from '../../notifications.js'


// =================================================================
// 🚀 GLOBAL SETUP: Define the handler outside the component lifecycle
// =================================================================

// This global variable acts as a bridge to hold the token if it arrives
// before the React component has finished mounting (common in WebViews).
let globalFCMTokenBridge = null;
const NATIVE_TOKEN_EVENT = 'NATIVE_FCM_TOKEN_READY';

if (typeof window !== 'undefined') {
    // Define the function that the Android native code calls.
    window.onAppTokenReceived = (token) => {
        console.log('🔥 GLOBAL: FCM Token received from Android:', token);
        // 1. Store the token globally
        globalFCMTokenBridge = token;
        // 2. Dispatch an event to notify any *already mounted* React components
        window.dispatchEvent(new Event(NATIVE_TOKEN_EVENT));
    };
}


// =================================================================
// ⚛️ REACT COMPONENT UPDATE
// =================================================================

export default function Login() {
    const { t } = useI18n()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { login, user } = useAuth()
    const { notify } = useToast()
    const navigate = useNavigate()

    // 🔹 Use the bridge value to initialize the component's state
    const [fcmToken, setFcmToken] = useState(globalFCMTokenBridge)

    // Effect for handling user redirect after login
    useEffect(() => {
        if (user) {
            if (user.role === 'merchant') navigate('/merchant', { replace: true })
            else if (user.role === 'deliver') navigate('/deliver', { replace: true })
            else navigate('/', { replace: true })
        }
    }, [user, navigate])

    // Effect for handling FCM Token fetching
    useEffect(() => {
        // Function to handle the native token being ready
        const handleNativeTokenReady = () => {
            if (globalFCMTokenBridge) {
                setFcmToken(globalFCMTokenBridge);
                // notify({ type: 'success', title: 'FCM Token Found', message: 'Using native app token' })
            }
        };

        // 1. Listen for the event that the global handler dispatches
        window.addEventListener(NATIVE_TOKEN_EVENT, handleNativeTokenReady);

        // 2. If no native token is available, try to get the web token
        // The check is `!globalFCMTokenBridge` to prioritize the native one.
        if (!globalFCMTokenBridge) {
            (async () => {
                try {
                    const webToken = await requestNotificationPermission()
                    if (webToken) {
                        console.log('🌐 Web FCM Token:', webToken)
                        setFcmToken(webToken)
                    }
                } catch (err) {
                    console.warn('FCM web token request failed:', err)
                }
            })()
        }


        return () => {
            // Cleanup the event listener
            window.removeEventListener(NATIVE_TOKEN_EVENT, handleNativeTokenReady);
        };
    }, [notify])


    async function submit(e) {
        e.preventDefault()
        setLoading(true)
        setError('')
      
      // Validate required fields
      if (!email.trim()) {
        setError(t('Email is required'))
        notify({ type: 'error', title: t('Validation Error'), message: t('Please enter your email address') })
        setLoading(false)
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setError(t('Invalid email format'))
        notify({ type: 'error', title: t('Validation Error'), message: t('Please enter a valid email address') })
        setLoading(false)
        return
      }

      if (!password.trim()) {
        setError(t('Password is required'))
        notify({ type: 'error', title: t('Validation Error'), message: t('Please enter your password') })
        setLoading(false)
        return
      } 

        try {
            // Ensure we have the most up-to-date token (native or web)
            let tokenToSave = fcmToken;
            
            // If the token is still missing, try to get it again (mostly for web fallback)
            if (!tokenToSave) {
                notify({ type: 'error', title: t('Need Notification Permission'), message: t('Please allow notifications before logging in') })

                tokenToSave = await requestNotificationPermission()
                if (!tokenToSave) return
            }

            const u = await login(email, password)
            if (u?.token) localStorage.setItem('token', u.token)

            // ✅ Save the token to the backend after successful login
            if (tokenToSave) {
                await saveFCMToken(tokenToSave)
                console.log(t('✅ FCM token saved successfully to backend'))
            } else {
                console.warn(t('⚠️ No FCM token available to save. Notifications may not work. Please refresh.'))
                notify({ type: 'error', title: t('Token Missing'), message: t('Notifications may not work. Please refresh.') })

            }

            notify({ type: 'success', title: t('Welcome back!'), message: t('Login successful') })

            if (u?.role === 'merchant') navigate('/merchant', { replace: true })
            else if (u?.role === 'deliver') navigate('/deliver', { replace: true })
            else navigate('/', { replace: true })
        } catch (err) {
            setError(err.message)
            notify({ type: 'error', title: t('Login failed'), message: err.message })
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
                {/* App Header */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center mb-6"
                >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center shadow-lg mb-3">
                        <span className="text-white text-2xl font-bold">L</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">{t('Welcome Back')}</h1>
                    <p className="text-gray-500 text-sm mt-1">{t('Login to continue')}</p>
                </motion.div>

                {/* Form */}
                <form onSubmit={submit} className="w-full space-y-4">
                    <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm focus-within:ring-2 ring-orange-400 transition">
                        <FiMail className="text-orange-500 text-lg" />
                        <input
                            className="flex-1 bg-transparent placeholder-gray-400 text-sm outline-none"
                            placeholder={t('Email')}
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm focus-within:ring-2 ring-orange-400 transition">
                        <FiLock className="text-orange-500 text-lg" />
                        <input
                            className="flex-1 bg-transparent placeholder-gray-400 text-sm outline-none"
                            placeholder={t('Password')}
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            aria-label={showPassword ? t('Hide password') : t('Show password')}
                            onClick={() => setShowPassword(s => !s)}
                            className="text-orange-500 hover:text-orange-600 focus:outline-none"
                        >
                            {showPassword ? <FiEyeOff className="text-lg" /> : <FiEye className="text-lg" />}
                        </button>
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
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 rounded-2xl mt-2 shadow-md hover:shadow-lg transition-all disabled:opacity-70 active:scale-95"
                    >
                        {loading ? t('Logging in...') : t('Login')}
                    </motion.button>
                </form>

                {/* Bottom Links */}
                <div className="flex flex-col items-center mt-5">
                    <a
                        href="/forgot-password"
                        className="text-sm text-orange-600 hover:underline"
                    >
                        {t('Forgot Password?')}
                    </a>
                    <p className="text-center text-sm text-gray-600 mt-2">
                        {t('Don’t have an account?')}
                        {' '}
                        <a href="/register" className="text-orange-600 font-medium hover:underline">
                            {t('Register')}
                        </a>
                    </p>
                </div>
            </motion.div>

            {/* Background Accent Circle */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1 }}
                className="absolute bottom-0 right-0 w-40 h-40 bg-orange-200 rounded-full blur-3xl opacity-30"
            />
        </div>
    )
}