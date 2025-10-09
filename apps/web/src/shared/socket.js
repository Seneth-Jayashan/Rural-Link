import { io } from 'socket.io-client'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'
let socket

export function getSocket(){
  if (socket) return socket
  socket = io(BASE, { withCredentials:true, autoConnect:true })
  const token = localStorage.getItem('token')
  if (token) socket.emit('authenticate', token)
  return socket
}

export function authenticate(){
  const s = getSocket()
  const token = localStorage.getItem('token')
  if (token) s.emit('authenticate', token)
}

export function joinOrder(orderId){
  getSocket().emit('joinOrderRoom', orderId)
}

export function onOrderMessage(cb){
  const s = getSocket()
  const handler = (msg)=> cb && cb(msg)
  s.on('orderMessage', handler)
  return ()=> s.off('orderMessage', handler)
}

export function sendOrderMessage({ orderId, text, tempId }){
  getSocket().emit('orderMessage', { orderId, text, tempId })
}


