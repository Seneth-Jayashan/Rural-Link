import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'

export default function Onboarding() {
  const [showSplash, setShowSplash] = useState(true)
  const [current, setCurrent] = useState(0)
  const navigate = useNavigate()
  const { t } = useI18n()

  // --- Splash Screen ---
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  // --- Slide Navigation ---
  const nextSlide = () => {
    if (current < slides.length - 1) {
      setCurrent((prev) => prev + 1)
    } else {
      navigate('/login')
    }
  }

  const prevSlide = () => {
    if (current > 0) setCurrent((prev) => prev - 1)
  }

  // --- Slide Content ---
  const slides = [
    { title: t('onboard1Title'), description: t('onboard1Desc'), image: '/onboard1.png' },
    { title: t('onboard2Title'), description: t('onboard2Desc'), image: '/onboard2.png' },
    { title: t('onboard3Title'), description: t('onboard3Desc'), image: '/onboard3.png' },
  ]

  // --- Splash Screen Display ---
  if (showSplash) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white relative overflow-hidden">
        <motion.img
          src="/logo.png"
          alt="Logo"
          className="w-48 h-48 object-contain z-10"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, duration: 1.5 }}
        />
      </div>
    )
  }

  // --- Onboarding Screen ---
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white p-4">
      {/* Slide content */}
      <motion.div
        key={current}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center text-center w-full max-w-sm card p-6"
      >
        <img
          src={slides[current].image}
          alt={slides[current].title}
          className="w-64 h-64 object-contain mb-6"
        />
        <h2 className="text-2xl font-bold mb-2 text-ink">{slides[current].title}</h2>
        <p className="text-gray-600">{slides[current].description}</p>
      </motion.div>

      {/* Navigation Dots */}
      <div className="flex mt-6 space-x-2">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${current === i ? 'bg-orange-500' : 'bg-gray-300'}`}
          />
        ))}
      </div>

      {/* Buttons */}
      <div className="flex mt-6 w-full max-w-sm justify-between">
        {current > 0 ? (
          <button
            onClick={prevSlide}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"
          >
            {t('back') || 'Back'}
          </button>
        ) : (
          <div />
        )}

        <button
          onClick={nextSlide}
          className="btn-brand px-4 py-2 rounded-lg"
        >
          {current === slides.length - 1 ? t('getStarted') || 'Get Started' : t('next') || 'Next'}
        </button>
      </div>
    </div>
  )
}
