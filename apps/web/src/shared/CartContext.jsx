import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './auth/AuthContext.jsx'
import { get, post, put, del } from './api.js'

const CartContext = createContext({ items: [], addItem: ()=>{}, updateQty: ()=>{}, removeItem: ()=>{}, clear: ()=>{}, subtotal: 0 })

export function CartProvider({ children }){
  const [items, setItems] = useState([])
  const { user } = useAuth()

  useEffect(()=>{
    try{
      const saved = localStorage.getItem('cart')
      if(saved){ setItems(JSON.parse(saved)) }
    }catch{}
  },[])

  useEffect(()=>{
    try{ localStorage.setItem('cart', JSON.stringify(items)) }catch{}
  },[items])

  // Sync with backend when authenticated
  useEffect(()=>{
    let cancelled = false
    const sync = async ()=>{
      if(!user) return
      try{
        // Merge any local items into server once on login
        const local = (()=>{ try{ return JSON.parse(localStorage.getItem('cart')||'[]') }catch{ return [] } })()
        if(Array.isArray(local) && local.length){
          await post('/api/cart/merge', { items: local.map(it=> ({ product: it.product._id, quantity: it.quantity })) })
          localStorage.removeItem('cart')
        }
      }catch{}
      try{
        const data = await get('/api/cart')
        if(!cancelled && data && data.cart && Array.isArray(data.cart.items)){
          // items come as { product: {...}, quantity }
          setItems(data.cart.items.map(it=> ({ product: it.product, quantity: it.quantity })))
        }
      }catch{}
    }
    sync()
    return ()=>{ cancelled = true }
  },[user])

  const addItem = useCallback(async (product, quantity = 1)=>{
    if(user){
      try{
        const data = await post('/api/cart/items', { productId: product._id, quantity })
        if(data && data.cart && Array.isArray(data.cart.items)){
          setItems(data.cart.items.map(it=> ({ product: it.product, quantity: it.quantity })))
          return
        }
      }catch{}
    }
    setItems(prev => {
      const idx = prev.findIndex(it => it.product._id === product._id)
      if(idx >= 0){
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: Math.min(next[idx].quantity + quantity, 99) }
        return next
      }
      return [...prev, { product, quantity }]
    })
  },[user])

  const updateQty = useCallback(async (productId, quantity)=>{
    const clamped = Math.max(1, Math.min(99, quantity||1))
    if(user){
      try{
        const data = await put(`/api/cart/items/${productId}`, { quantity: clamped })
        if(data && data.cart && Array.isArray(data.cart.items)){
          setItems(data.cart.items.map(it=> ({ product: it.product, quantity: it.quantity })))
          return
        }
      }catch{}
    }
    setItems(prev => prev.map(it => it.product._id === productId ? { ...it, quantity: clamped } : it))
  },[user])

  const removeItem = useCallback(async (productId)=>{
    if(user){
      try{
        const data = await del(`/api/cart/items/${productId}`)
        if(data && data.cart && Array.isArray(data.cart.items)){
          setItems(data.cart.items.map(it=> ({ product: it.product, quantity: it.quantity })))
          return
        }
      }catch{}
    }
    setItems(prev => prev.filter(it => it.product._id !== productId))
  },[user])

  const clear = useCallback(async ()=>{
    if(user){
      try{
        const data = await del('/api/cart')
        if(data && data.cart){
          setItems([])
          return
        }
      }catch{}
    }
    setItems([])
  },[user])

  const subtotal = useMemo(()=> items.reduce((sum, it)=> sum + (it.product.price * it.quantity), 0), [items])

  const value = useMemo(()=>({ items, addItem, updateQty, removeItem, clear, subtotal }), [items, addItem, updateQty, removeItem, clear, subtotal])

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  )
}

export function useCart(){
  return useContext(CartContext)
}


