import { motion } from 'framer-motion'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'

export default function Terms(){
  const { t } = useI18n()
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 p-4 pb-24">
      <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md border border-orange-100 p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('Terms and Conditions')}</h1>
        <p className="text-gray-700 text-sm">
          {t('These terms govern your use of Rural Link. By using the app, you agree to these terms including privacy, acceptable use, and limitations of liability.')} 
        </p>
        <ul className="list-disc pl-6 text-gray-700 text-sm space-y-2">
          <li>{t('Respect other users and comply with applicable laws.')}</li>
          <li>{t('Do not abuse, reverse engineer, or disrupt the service.')}</li>
          <li>{t('We may update these terms; continued use means you accept the changes.')}</li>
        </ul>
        <p className="text-gray-700 text-sm">
          {t('For questions, please contact support.')}
        </p>
      </motion.div>
    </div>
  )
}


