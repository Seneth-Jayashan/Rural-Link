import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const AuthContext = createContext({ user:null, loading:true })

export function AuthProvider({ children }){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const init = useCallback(async ()=> {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const res = await fetch(`${BASE}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        if (res.ok) {
          setUser(data.user)
        } else {
          localStorage.removeItem('token')  // 👈 token invalid
          setUser(null)
        }
      }
    } catch {
      localStorage.removeItem('token')
      setUser(null)
    }
    setLoading(false)
  }, [])


  useEffect(()=>{ init() },[init])

  const login = useCallback(async (email, password)=>{
    const res = await fetch(`${BASE}/api/auth/login`,{ method:'POST', headers:{ 'Content-Type':'application/json' }, credentials:'include', body: JSON.stringify({ email, password }) })
    const data = await res.json()
    if (data.token) localStorage.setItem('token', data.token)
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
      } else if (key === 'address' && typeof value === 'object') {
        // Handle nested address object by flattening it
        Object.entries(value).forEach(([addrKey, addrValue]) => {
          if (addrValue !== undefined && addrValue !== null) {
            formData.append(`address.${addrKey}`, addrValue)
          }
        })
      } else if (key === 'shopLocation' && typeof value === 'object') {
        // Flatten shopLocation including coordinates
        Object.entries(value).forEach(([shopKey, shopVal]) => {
          if (shopKey === 'coordinates' && typeof shopVal === 'object') {
            if (shopVal.latitude !== undefined && shopVal.latitude !== null) {
              formData.append('shopLocation.coordinates.latitude', shopVal.latitude)
            }
            if (shopVal.longitude !== undefined && shopVal.longitude !== null) {
              formData.append('shopLocation.coordinates.longitude', shopVal.longitude)
            }
          } else if (shopVal !== undefined && shopVal !== null) {
            formData.append(`shopLocation.${shopKey}`, shopVal)
          }
        })
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

  const logout = useCallback(async ()=> {
    try {
      await fetch(`${BASE}/api/auth/logout`, { 
        method: 'POST', 
        credentials: 'include' 
      })
    } catch (e) {
      console.warn('Logout request failed:', e)
    } finally {
      localStorage.removeItem('token')  // 👈 clear saved token
      setUser(null)
    }
  }, [])


  const value = useMemo(()=>({ user, loading, init, login, register, logout }), [user, loading, init, login, register, logout])

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

export function useAuth(){
  return useContext(AuthContext)
}


