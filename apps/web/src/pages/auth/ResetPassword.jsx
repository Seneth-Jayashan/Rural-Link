import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom'; // Changed useParams to useLocation
import { useI18n } from '../../shared/i18n/LanguageContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useToast } from '../../shared/ui/Toast.jsx';
import { useAuth } from '../../shared/auth/AuthContext.jsx';

export default function ResetPasswordPage() { // Renamed to ResetPasswordPage for clarity
    const { t } = useI18n();
    const { notify } = useToast();
    const navigate = useNavigate();
    const location = useLocation(); // 👈 Use useLocation to get state
    
    // The final reset token is now passed in the navigation state from VerifyCode.jsx
    const token = location.state?.token || 'missing'; 
    
    const { resetPassword } = useAuth();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    // Initial status checks if the token is available
    const [status, setStatus] = useState(token !== 'missing' ? 'form' : 'error'); 
    const [message, setMessage] = useState('');

    const MIN_PASSWORD_LENGTH = 6;

    // Set initial error message if token is missing
    useEffect(() => {
        if (token === 'missing' && status !== 'error') {
            setMessage(t('Session expired or token is missing. Please restart the password reset process.'));
            setStatus('error');
        }
    }, [token, status, t]);

    async function submit(e) {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // --- 1. Client-Side Validation ---
        if (!token || token === 'missing') {
            setMessage(t('The reset session is invalid. Please restart the process.'));
            setStatus('error');
            setLoading(false);
            return;
        }
        
        if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
            setMessage(t(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`));
            setStatus('error');
            setLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage(t('New password and confirmation password do not match.'));
            setStatus('error');
            setLoading(false);
            return;
        }

        // --- 2. API Call ---
        try {
            await resetPassword(token, newPassword); // Use the token from state

            // On success
            notify({ 
                type: 'success', 
                title: t('Success!'), 
                message: t('Your password has been successfully reset.') 
            });
            setMessage(t('Your password has been reset. Redirecting to login...'));
            setStatus('success');
            
            setTimeout(() => navigate('/login'), 3000);

        } catch (err) {
            // On failure
            const errorMsg = err.message || t('Failed to reset password. Please request a new code.');
            notify({ type: 'error', title: t('Reset Failed'), message: errorMsg });
            setMessage(errorMsg);
            setStatus('error'); // Show error state
        } finally {
            setLoading(false);
        }
    }

    // Determine the content to display based on the status state
    const content = (
        <motion.div
            key={status}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.3 }}
            className="w-full"
        >
            {status === 'form' && (
                <>
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center mb-6"
                    >
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center shadow-lg mb-3">
                            <FiLock className="text-white text-2xl" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">{t('Set New Password')}</h1>
                        <p className="text-gray-500 text-sm mt-1 text-center">{t('Enter your new password below.')}</p>
                    </motion.div>

                    <form onSubmit={submit} className="w-full space-y-4">
                        <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm focus-within:ring-2 ring-orange-400 transition">
                            <FiLock className="text-orange-500 text-lg" />
                            <input
                                className="flex-1 bg-transparent placeholder-gray-400 text-sm outline-none"
                                placeholder={t('New Password')}
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                disabled={loading}
                                minLength={MIN_PASSWORD_LENGTH}
                                required
                            />
                        </div>

                        <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm focus-within:ring-2 ring-orange-400 transition">
                            <FiLock className="text-orange-500 text-lg" />
                            <input
                                className="flex-1 bg-transparent placeholder-gray-400 text-sm outline-none"
                                placeholder={t('Confirm New Password')}
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                disabled={loading}
                                minLength={MIN_PASSWORD_LENGTH}
                                required
                            />
                        </div>

                        {message && (
                            <div className="text-red-500 text-sm text-center">
                                {message}
                            </div>
                        )}

                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 rounded-2xl mt-2 shadow-md hover:shadow-lg transition-all disabled:opacity-70 active:scale-95"
                        >
                            {loading ? t('Resetting...') : t('Change Password')}
                        </motion.button>
                    </form>
                </>
            )}

            {status === 'success' && (
                <div className="text-center p-4">
                    <FiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">{t('Password Changed!')}</h2>
                    <p className="text-gray-600 mb-6">{message}</p>
                    <Link to="/login" className="text-sm text-orange-600 font-medium hover:underline">
                        {t('Go to Login')}
                    </Link>
                </div>
            )}
            
            {status === 'error' && (
                <div className="text-center p-4">
                    <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">{t('Error Occurred')}</h2>
                    <p className="text-gray-600 mb-6">{message}</p>
                    <Link to="/forgot-password" className="text-sm text-orange-600 font-medium hover:underline block mt-2">
                        {t('Request a new code')}
                    </Link>
                </div>
            )}
        </motion.div>
    );

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center px-5 py-10 text-black">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 border border-orange-100 flex flex-col items-center relative"
            >
                <AnimatePresence mode="wait">
                    {content}
                </AnimatePresence>
            </motion.div>

            {/* Background Accent Circle */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1 }}
                className="absolute bottom-0 right-0 w-40 h-40 bg-orange-200 rounded-full blur-3xl opacity-30"
            />
        </div>
    );
}