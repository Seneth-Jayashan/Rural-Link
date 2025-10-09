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

// WebRTC Call signaling
export function initiateCall({ orderId, recipientId, offer }){
  getSocket().emit('call:offer', { orderId, recipientId, offer })
}

export function answerCall({ callId, answer }){
  getSocket().emit('call:answer', { callId, answer })
}

export function sendIceCandidate({ callId, candidate }){
  getSocket().emit('call:ice-candidate', { callId, candidate })
}

export function acceptCall({ callId, orderId }){
  getSocket().emit('call:accepted', { callId, orderId })
}

export function rejectCall({ callId, orderId }){
  getSocket().emit('call:rejected', { callId, orderId })
}

export function endCall({ callId }){
  getSocket().emit('call:ended', { callId })
}

// WebRTC event listeners
export function onCallOffer(cb){
  const s = getSocket()
  const handler = (data) => cb && cb(data)
  s.on('call:offer', handler)
  return () => s.off('call:offer', handler)
}

export function onCallAnswer(cb){
  const s = getSocket()
  const handler = (data) => cb && cb(data)
  s.on('call:answer', handler)
  return () => s.off('call:answer', handler)
}

export function onCallIceCandidate(cb){
  const s = getSocket()
  const handler = (data) => cb && cb(data)
  s.on('call:ice-candidate', handler)
  return () => s.off('call:ice-candidate', handler)
}

export function onCallAccepted(cb){
  const s = getSocket()
  const handler = (data) => cb && cb(data)
  s.on('call:accepted', handler)
  return () => s.off('call:accepted', handler)
}

export function onCallRejected(cb){
  const s = getSocket()
  const handler = (data) => cb && cb(data)
  s.on('call:rejected', handler)
  return () => s.off('call:rejected', handler)
}

export function onCallEnded(cb){
  const s = getSocket()
  const handler = (data) => cb && cb(data)
  s.on('call:ended', handler)
  return () => s.off('call:ended', handler)
}


