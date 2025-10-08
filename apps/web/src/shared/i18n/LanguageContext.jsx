import { createContext, useContext, useMemo, useState } from 'react'

const LanguageContext = createContext({ lang: 'en', t: (k)=>k, setLang: ()=>{} })

const strings = {
  en: { login: 'Login', register: 'Register', welcome: 'Welcome', placeOrder: 'Place Order' },
  si: { login: 'ඇතුල් වන්න', register: 'ලියාපදිංචි වන්න', welcome: 'සාදරයෙන්', placeOrder: 'ඇණවුම කරන්න' },
  ta: { login: 'உள்நுழை', register: 'பதிவு செய்', welcome: 'வரவேற்கிறோம்', placeOrder: 'ஆர்டர் செய்யவும்' },
}

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


