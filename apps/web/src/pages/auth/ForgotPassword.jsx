import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../shared/i18n/LanguageContext.jsx';
import { motion } from 'framer-motion';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import { useToast } from '../../shared/ui/Toast.jsx';
import { useAuth } from '../../shared/auth/AuthContext.jsx'; 

export default function ForgotPassword() {
    const { t } = useI18n();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { notify } = useToast();
    const navigate = useNavigate();
    
    // Access the forgotPassword function from AuthContext
    const { forgotPassword } = useAuth(); 

    async function submit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');

        // --- Validation ---
        if (!email.trim()) {
            setError(t('Email is required'));
            notify({ type: 'error', title: t('Validation Error'), message: t('Please enter your email address') });
            setLoading(false);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError(t('Invalid email format'));
            notify({ type: 'error', title: t('Validation Error'), message: t('Please enter a valid email address') });
            setLoading(false);
            return;
        }

        try {
            // 🚀 STEP 1: Request the 6-digit code
            const result = await forgotPassword(email);
            
            // Check if the backend returned a verificationId.
            // Note: The backend returns success: true even if the user isn't found for security reasons.
            if (result.verificationId) {
                
                // On success, notify the user and navigate to the VerifyCode page
                notify({ 
                    type: 'success', 
                    title: t('Code Sent!'), 
                    message: t('Please enter the 6-digit code sent to your email.') 
                });
                
                // 🧭 Navigate to /verify-code and pass the verificationId in state
                navigate('/verify-code', { 
                    state: { verificationId: result.verificationId } 
                });
                
            } else {
                 // If verificationId is null (user not found, but backend returned success: true)
                notify({ 
                    type: 'success', 
                    title: t('Email Sent!'), 
                    message: t('If the email is valid, a code has been sent.') 
                });
                // We don't navigate, we let the user know to check their email.
            }

        } catch (err) {
            // Use err.message from the AuthContext throw (e.g., Server error)
            const message = err.message || t('Server error. Please try again later.');
            setError(message);
            notify({ type: 'error', title: t('Request Failed'), message: message });
        } finally {
            setLoading(false);
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
                {/* Back Button */}
                <button
                    onClick={() => navigate('/login')}
                    className="absolute top-4 left-4 p-2 text-gray-600 hover:text-orange-500 transition-colors"
                >
                    <FiArrowLeft className="w-6 h-6" />
                </button>

                {/* Header */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center mb-6"
                >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center shadow-lg mb-3">
                        <FiMail className="text-white text-2xl" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">{t('Forgot Password')}</h1>
                    <p className="text-gray-500 text-sm mt-1 text-center">{t('Enter your email to receive a 6-digit verification code.')}</p>
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
                            disabled={loading}
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
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 rounded-2xl mt-2 shadow-md hover:shadow-lg transition-all disabled:opacity-70 active:scale-95"
                    >
                        {loading ? t('Sending Code...') : t('Send Verification Code')}
                    </motion.button>
                </form>

                {/* Login Link */}
                <div className="flex flex-col items-center mt-5">
                    <a
                        onClick={() => navigate('/login')}
                        className="text-sm text-orange-600 hover:underline cursor-pointer"
                    >
                        {t('Back to Login')}
                    </a>
                </div>
            </motion.div>

            {/* Background Accent Circle */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1 }}
                className="absolute top-0 left-0 w-40 h-40 bg-orange-200 rounded-full blur-3xl opacity-30"
            />
        </div>
    );
}