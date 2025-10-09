import { createContext, useContext, useMemo, useState } from 'react'

const LanguageContext = createContext({ lang: 'en', t: (k)=>k, setLang: ()=>{} })

const strings = {
  en: {
    login: 'Login',
    register: 'Register',
    welcome: 'Welcome',
    placeOrder: 'Place Order',
    onboard1Title: 'Welcome to Rural Link',
    onboard1Desc: 'Connect with local businesses, farmers, and customers seamlessly.',
    onboard2Title: 'Fast Deliveries',
    onboard2Desc: 'Track your orders in real-time and get updates instantly.',
    onboard3Title: 'Manage Everything',
    onboard3Desc: 'From products to orders, manage your business easily.',
    back: 'Back',
    next: 'Next',
    getStarted: 'Get Started'
  },
  si: {
    login: 'ඇතුල් වන්න',
    register: 'ලියාපදිංචි වන්න',
    welcome: 'සාදරයෙන්',
    placeOrder: 'ඇණවුම කරන්න',
    onboard1Title: 'Rural Link වෙත සාදරයෙන් පිළිගනිමු',
    onboard1Desc: 'ස්ථානයේ ව්‍යාපාර, ගොවීන්, සහ පාරිභෝගිකයන් සමඟ පහසුවෙන් සම්බන්ධ වන්න.',
    onboard2Title: 'වේගවත් බෙදාහැරීම්',
    onboard2Desc: 'ඔබගේ ඇණවුම් සැබෑ කාලීනව අනුවාද කරනු ලබයි සහ නවීකරණ ලබා ගන්න.',
    onboard3Title: 'සියල්ල කළමනාකරණය කරන්න',
    onboard3Desc: 'නිෂ්පාදන සිට ඇණවුම් දක්වා, ඔබගේ ව්‍යාපාර පහසුවෙන් කළමනාකරණය කරන්න.',
    back: 'ආපසු',
    next: 'ඊළඟ',
    getStarted: 'ආරම්භ කරන්න'
  },
  ta: {
    login: 'உள்நுழை',
    register: 'பதிவு செய்',
    welcome: 'வரவேற்கிறோம்',
    placeOrder: 'ஆர்டர் செய்யவும்',
    onboard1Title: 'Rural Link இற்கு வரவேற்கிறோம்',
    onboard1Desc: 'உள்ளூர் வணிகங்கள், விவசாயிகள் மற்றும் வாடிக்கையாளர்களுடன் எளிதாக இணைக்கவும்.',
    onboard2Title: 'விரைவு விநியோகங்கள்',
    onboard2Desc: 'உங்கள் ஆர்டர்களை நேரடியாக பின்தொடரவும் மற்றும் உடனடி புதுப்பிப்புகளை பெறவும்.',
    onboard3Title: 'எல்லாவற்றையும் மேலாண்மை செய்க',
    onboard3Desc: 'உற்பத்திகள் முதல் ஆர்டர்கள் வரை உங்கள் வணிகத்தை எளிதாக நிர்வகிக்கவும்.',
    back: 'மீண்டும்',
    next: 'அடுத்து',
    getStarted: 'தொடங்குங்கள்'
  }
};



export function LanguageProvider({ children }){
  const [lang, setLang] = useState('en')
  const t = useMemo(()=> (key)=> strings[lang]?.[key] || key, [lang])
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useI18n(){
  return useContext(LanguageContext)
}


