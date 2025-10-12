import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useI18n } from '../../shared/i18n/LanguageContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiCheck, FiArrowLeft, FiKey } from 'react-icons/fi';
import { useToast } from '../../shared/ui/Toast.jsx';
import { useAuth } from '../../shared/auth/AuthContext.jsx';

// =================================================================
// ⚛️ VERIFY CODE COMPONENT
// =================================================================

export default function VerifyCode() {
    const { t } = useI18n();
    const { notify } = useToast();
    const navigate = useNavigate();
    const location = useLocation(); // To access state passed from previous route
    
    const { verifyCode } = useAuth();

    // Expect the verificationId to be passed via route state
    const verificationId = location.state?.verificationId; 
    
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Status can be 'ready', 'success', or 'error'
    const [status, setStatus] = useState(verificationId ? 'ready' : 'error'); 

    // Redirect if verification ID is missing (user navigated directly)
    useEffect(() => {
        if (!verificationId) {
            setError(t('Verification process expired or started incorrectly.'));
            setStatus('error');
            // Give user a moment to see the error, then push to start of flow
            setTimeout(() => navigate('/forgot-password'), 3000); 
        }
    }, [verificationId, navigate, t]);

    const handleCodeChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, ''); // Allow only digits
        if (value.length <= 6) {
            setCode(value);
        }
    };

    async function submit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (code.length !== 6) {
            const msg = t('Please enter the complete 6-digit code.');
            setError(msg);
            notify({ type: 'error', title: t('Validation Error'), message: msg });
            setLoading(false);
            return;
        }

        if (status !== 'ready' || !verificationId) {
            setError(t('The verification session is invalid. Please restart the process.'));
            setLoading(false);
            return;
        }

        try {
            // 🚀 STEP 2: Call the AuthContext function
            const result = await verifyCode(verificationId, code);

            // On success, notify and navigate to the final ResetPasswordPage
            notify({ 
                type: 'success', 
                title: t('Code Verified!'), 
                message: t('Please set your new password now.') 
            });
            
            // Pass the long-lived reset token to the final reset page
            navigate('/reset-password', { replace: true, state: { token: result.token } });
            
        } catch (err) {
            // On failure
            const message = err.message || t('Verification failed. Code or session expired.');
            setError(message);
            notify({ type: 'error', title: t('Verification Failed'), message: message });
            setStatus('ready'); // Keep form ready for re-entry
        } finally {
            setLoading(false);
        }
    }

    const renderContent = () => {
        if (status === 'error') {
            return (
                <div className="text-center p-4">
                    <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">{t('Session Error')}</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link to="/forgot-password" className="text-sm text-orange-600 font-medium hover:underline">
                        {t('Start Reset Process')}
                    </Link>
                </div>
            );
        }

        return (
            <>
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center mb-6"
                >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center shadow-lg mb-3">
                        <FiCheck className="text-white text-2xl" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">{t('Verify Code')}</h1>
                    <p className="text-gray-500 text-sm mt-1 text-center">
                        {t('Enter the 6-digit code sent to your email.')}
                    </p>
                </motion.div>

                <form onSubmit={submit} className="w-full space-y-4">
                    <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm focus-within:ring-2 ring-orange-400 transition">
                        <FiKey className="text-orange-500 text-lg" />
                        <input
                            className="flex-1 bg-transparent placeholder-gray-400 text-center text-lg tracking-widest outline-none"
                            placeholder="• • • • • •"
                            type="text"
                            inputMode="numeric"
                            maxLength="6"
                            value={code}
                            onChange={handleCodeChange}
                            disabled={loading}
                            required
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
                        disabled={loading || code.length !== 6}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 rounded-2xl mt-2 shadow-md hover:shadow-lg transition-all disabled:opacity-70 active:scale-95"
                    >
                        {loading ? t('Verifying...') : t('Verify')}
                    </motion.button>
                </form>

                <div className="flex flex-col items-center mt-5">
                    <Link
                        to="/forgot-password"
                        className="text-sm text-gray-600 hover:underline"
                    >
                        {t('Request new code')}
                    </Link>
                </div>
            </>
        );
    };

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center px-5 py-10 text-black">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 border border-orange-100 flex flex-col items-center relative"
            >
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 p-2 text-gray-600 hover:text-orange-500 transition-colors"
                >
                    <FiArrowLeft className="w-6 h-6" />
                </button>
                
                <AnimatePresence mode="wait">
                    <motion.div key={status} className="w-full">
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </motion.div>

            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1 }}
                className="absolute top-0 right-0 w-40 h-40 bg-orange-200 rounded-full blur-3xl opacity-30"
            />
        </div>
    );
}