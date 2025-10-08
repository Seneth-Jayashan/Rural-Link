import { create } from 'zustand'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const useAuth = create((set, get)=>({
  user: null,
  loading: true,
  error: '',

  init: async ()=>{
    try{
      const res = await fetch(`${BASE}/api/auth/me`, { credentials:'include' })
      const data = await res.json()
      if(res.ok){ set({ user: data.user, loading:false }) }
      else { set({ user:null, loading:false }) }
    }catch{
      set({ user:null, loading:false })
    }
  },

  login: async (email, password)=>{
    set({ error:'', loading:true })
    try{
      const res = await fetch(`${BASE}/api/auth/login`,{
        method:'POST', headers:{ 'Content-Type':'application/json' }, credentials:'include', body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if(!res.ok) throw new Error(data.message || 'Login failed')
      set({ user: data.user, loading:false })
      return data.user
    }catch(e){ set({ error: e.message, loading:false }); throw e }
  },

  register: async (payload)=>{
    set({ error:'', loading:true })
    try{
      const res = await fetch(`${BASE}/api/auth/register`,{
        method:'POST', headers:{ 'Content-Type':'application/json' }, credentials:'include', body: JSON.stringify(payload)
      })
      const data = await res.json()
      if(!res.ok) throw new Error(data.message || 'Registration failed')
      set({ loading:false })
      return true
    }catch(e){ set({ error: e.message, loading:false }); throw e }
  },

  logout: async ()=>{
    try{ await fetch(`${BASE}/api/auth/logout`, { method:'POST', credentials:'include' }) }catch{}
    set({ user:null })
  }
}))


