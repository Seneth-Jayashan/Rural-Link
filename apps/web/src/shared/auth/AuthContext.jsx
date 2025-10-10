import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const AuthContext = createContext({ user:null, loading:true })

export function AuthProvider({ children }){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const init = useCallback(async ()=>{
    try{
      const res = await fetch(`${BASE}/api/auth/me`, { credentials:'include' })
      const data = await res.json()
      if(res.ok){ setUser(data.user) } else { setUser(null) }
    }catch{ setUser(null) }
    setLoading(false)
  },[])

  useEffect(()=>{ init() },[init])

  const login = useCallback(async (email, password)=>{
    const res = await fetch(`${BASE}/api/auth/login`,{ method:'POST', headers:{ 'Content-Type':'application/json' }, credentials:'include', body: JSON.stringify({ email, password }) })
    const data = await res.json()
    if(!res.ok) throw new Error(data.message || 'Login failed')
    setUser(data.user)
    return { ...data.user, token: data.token }
  },[])

  const register = useCallback(async (payload)=>{
    const formData = new FormData()
    Object.entries(payload).forEach(([key, value])=>{
      if (value === undefined || value === null) return
      if (key === 'profilePic') {
        if (value instanceof File) formData.append('profilePic', value)
      } else {
        formData.append(key, value)
      }
    })

    const res = await fetch(`${BASE}/api/auth/register`,{
      method:'POST',
      credentials:'include',
      body: formData
    })
    const data = await res.json()
    if(!res.ok) throw new Error(data.message || 'Registration failed')
    return true
  },[])

  const logout = useCallback(async ()=>{
    try{ await fetch(`${BASE}/api/auth/logout`, { method:'POST', credentials:'include' }) }catch{}
    setUser(null)
  },[])

  const value = useMemo(()=>({ user, loading, init, login, register, logout }), [user, loading, init, login, register, logout])

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

export function useAuth(){
  return useContext(AuthContext)
}


