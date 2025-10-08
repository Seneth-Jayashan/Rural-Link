import { Outlet, Link, useLocation, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useI18n } from '../shared/i18n/LanguageContext.jsx'
import { useAuth } from '../shared/auth/AuthContext.jsx'

export function AppShell() {
  const location = useLocation()
  const { user, logout } = useAuth()
  return (
    <div className="min-h-dvh flex flex-col bg-[#fff7ed]">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b p-3 flex items-center justify-between">
        <Link to="/" className="font-bold text-ink">Rural Link</Link>
        <nav className="flex gap-3 text-sm">
          {!user && <Link to="/login">Login</Link>}
          {!user && <Link to="/register">Register</Link>}
          {user && <button className="text-red-600" onClick={logout}>Logout</button>}
          <LanguageSwitcher />
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      {user && (
        <nav className="fixed bottom-0 inset-x-0 bg-white border-t grid grid-cols-3 text-center text-sm">
          {user.role==='customer' && (
            <>
              <Link to="/" className={`p-2 ${location.pathname==='/'?'text-brand-600':'text-gray-600'}`}>Home</Link>
              <div className="p-2 text-gray-400">&nbsp;</div>
              <div className="p-2 text-gray-400">&nbsp;</div>
            </>
          )}
          {user.role==='merchant' && (
            <>
              <Link to="/merchant" className={`p-2 ${location.pathname.startsWith('/merchant')?'text-brand-600':'text-gray-600'}`}>Merchant</Link>
              <div className="p-2 text-gray-400">&nbsp;</div>
              <div className="p-2 text-gray-400">&nbsp;</div>
            </>
          )}
          {user.role==='deliver' && (
            <>
              <Link to="/deliver" className={`p-2 ${location.pathname.startsWith('/deliver')?'text-brand-600':'text-gray-600'}`}>Deliver</Link>
              <div className="p-2 text-gray-400">&nbsp;</div>
              <div className="p-2 text-gray-400">&nbsp;</div>
            </>
          )}
        </nav>
      )}
    </div>
  )
}

function LanguageSwitcher(){
  const { lang:ctxLang, setLang } = useI18n()
  const [lang, setLocalLang] = useState(localStorage.getItem('lang')||ctxLang||'en')
  useEffect(()=>{ localStorage.setItem('lang', lang); setLang(lang) },[lang])
  return (
    <select value={lang} onChange={(e)=>setLocalLang(e.target.value)} className="border rounded p-1">
      <option value="en">EN</option>
      <option value="si">SI</option>
      <option value="ta">TA</option>
    </select>
  )
}


