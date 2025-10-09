import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext({ items: [], addItem: ()=>{}, updateQty: ()=>{}, removeItem: ()=>{}, clear: ()=>{}, subtotal: 0 })

export function CartProvider({ children }){
  const [items, setItems] = useState([])

  useEffect(()=>{
    try{
      const saved = localStorage.getItem('cart')
      if(saved){ setItems(JSON.parse(saved)) }
    }catch{}
  },[])

  useEffect(()=>{
    try{ localStorage.setItem('cart', JSON.stringify(items)) }catch{}
  },[items])

  const addItem = useCallback((product, quantity = 1)=>{
    setItems(prev => {
      const idx = prev.findIndex(it => it.product._id === product._id)
      if(idx >= 0){
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: Math.min(next[idx].quantity + quantity, 99) }
        return next
      }
      return [...prev, { product, quantity }]
    })
  },[])

  const updateQty = useCallback((productId, quantity)=>{
    setItems(prev => prev.map(it => it.product._id === productId ? { ...it, quantity: Math.max(1, Math.min(99, quantity||1)) } : it))
  },[])

  const removeItem = useCallback((productId)=>{
    setItems(prev => prev.filter(it => it.product._id !== productId))
  },[])

  const clear = useCallback(()=> setItems([]),[])

  const subtotal = useMemo(()=> items.reduce((sum, it)=> sum + (it.product.price * it.quantity), 0), [items])

  const value = useMemo(()=>({ items, addItem, updateQty, removeItem, clear, subtotal }), [items, addItem, updateQty, removeItem, clear, subtotal])

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  )
}

export function useCart(){
  return useContext(CartContext)
}


