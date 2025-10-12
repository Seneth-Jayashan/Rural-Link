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
          localStorage.removeItem('token')  // 👈 token invalid
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
      localStorage.removeItem('token')  // 👈 clear saved token
      setUser(null)
    }
  }, [])

// ----------------------------------------------------
// 👇 UPDATED: Forgot Password (Step 1: Request Code)
// ----------------------------------------------------

  /**
   * Sends a request to the backend to generate and send a 6-digit code.
   * Returns a verificationId if successful.
   * @param {string} email 
   * @returns {Promise<{verificationId: string | null}>}
   */
  const forgotPassword = useCallback(async (email) => {
    const res = await fetch(`${BASE}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Failed to send verification code')
    
    // Return the message and the new verificationId
    return { message: data.message, verificationId: data.verificationId }
  }, [])

// ----------------------------------------------------
// 👇 NEW: Verify Code (Step 2: Verify Code and get Final Reset Token)
// ----------------------------------------------------

  /**
   * Verifies the 6-digit code and returns the final, long-lived reset token.
   * @param {string} verificationId - ID received from forgotPassword.
   * @param {string} code - 6-digit code entered by the user.
   * @returns {Promise<{token: string}>}
   */
  const verifyCode = useCallback(async (verificationId, code) => {
    const res = await fetch(`${BASE}/api/auth/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationId, code })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Verification failed. Code may be invalid or expired.')
    
    // The backend sends the final reset token back as 'token'
    return { token: data.token }
  }, [])


// ----------------------------------------------------
// 👇 RESET PASSWORD (Step 3: Final Reset)
// ----------------------------------------------------

  /**
   * Resets the user's password using the final reset token.
   * @param {string} token - The long-lived token received from verifyCode.
   * @param {string} newPassword - The new password (must meet minimum length).
   * @returns {Promise<boolean>}
   */
  const resetPassword = useCallback(async (token, newPassword) => {
    const res = await fetch(`${BASE}/api/auth/reset-password/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Failed to reset password. Link may be invalid or expired.')
    return true
  }, [])


  const value = useMemo(()=>({ 
    user, 
    loading, 
    init, 
    login, 
    register, 
    logout, 
    forgotPassword, // Step 1
    verifyCode,     // Step 2 (NEW)
    resetPassword   // Step 3
  }), [user, loading, init, login, register, logout, forgotPassword, verifyCode, resetPassword])

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

export function useAuth(){
  return useContext(AuthContext)
}