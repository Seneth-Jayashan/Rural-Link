import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './auth/AuthContext.jsx'
import { get, post, put, del } from './api.js'

const CartContext = createContext({ 
  items: [], 
  addItem: ()=>{}, 
  updateQty: ()=>{}, 
  removeItem: ()=>{}, 
  clear: ()=>{}, 
  subtotal: 0,
  currentMerchant: null,
  canAddProduct: ()=>{}
})

export function CartProvider({ children }){
  const [items, setItems] = useState([])
  const { user } = useAuth()

  // Load guest cart from localStorage when there is no authenticated user
  useEffect(()=>{
    if(!user){
      try{
        const saved = localStorage.getItem('cart')
        setItems(saved ? JSON.parse(saved) : [])
      }catch{
        setItems([])
      }
    }
  },[user])

  // Persist cart only for guests; never persist authenticated users' carts to localStorage
  useEffect(()=>{
    if(!user){
      try{ localStorage.setItem('cart', JSON.stringify(items)) }catch{}
    }
  },[items, user])

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

  // Clean up items with null products
  const cleanItems = useMemo(() => {
    return items.filter(it => it.product && it.product._id);
  }, [items]);

  // Get current merchant from cart items
  const currentMerchant = useMemo(() => {
    if (cleanItems.length === 0) return null;
    const firstItem = cleanItems[0];
    return firstItem.product?.merchant || null;
  }, [cleanItems]);

  // Check if a product can be added to cart (same merchant or empty cart)
  const canAddProduct = useCallback((product) => {
    if (!product || !product.merchant) return false;
    if (cleanItems.length === 0) return true;
    
    // More robust comparison - check both _id and businessName
    const isSameMerchant = currentMerchant && (
      currentMerchant._id === product.merchant._id ||
      (currentMerchant.businessName && product.merchant.businessName && 
       currentMerchant.businessName === product.merchant.businessName)
    );
    
    return isSameMerchant;
  }, [cleanItems, currentMerchant]);

  const addItem = useCallback(async (product, quantity = 1)=>{
    // Check if product can be added (same merchant validation)
    if (!canAddProduct(product)) {
      throw new Error(`You can only add products from ${currentMerchant?.businessName || 'the current merchant'}. Please clear your cart first to add products from a different merchant.`);
    }

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
  },[user, canAddProduct, currentMerchant])

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

  // Auto-cleanup invalid items
  useEffect(() => {
    const hasInvalidItems = items.some(it => !it.product || !it.product._id);
    if (hasInvalidItems) {
      setItems(prev => prev.filter(it => it.product && it.product._id));
    }
  }, [items]);

  const subtotal = useMemo(()=> cleanItems.reduce((sum, it)=> {
    if (!it.product || typeof it.product.price !== 'number') return sum;
    return sum + (it.product.price * it.quantity);
  }, 0), [cleanItems])

  const value = useMemo(()=>({ 
    items: cleanItems, 
    addItem, 
    updateQty, 
    removeItem, 
    clear, 
    subtotal,
    currentMerchant,
    canAddProduct
  }), [cleanItems, addItem, updateQty, removeItem, clear, subtotal, currentMerchant, canAddProduct])

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  )
}

export function useCart(){
  return useContext(CartContext)
}


