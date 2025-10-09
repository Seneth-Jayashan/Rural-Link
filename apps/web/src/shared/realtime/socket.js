import { io } from 'socket.io-client'

// Prefer cookie-based auth; optionally pass token if you store it client-side too
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

let socket

export function getSocket() {
  if (socket && socket.connected) return socket
  if (!socket) {
    socket = io(API_BASE, {
      withCredentials: true,
      transports: ['websocket'],
      autoConnect: false,
      // If you also store JWT in memory/localStorage, provide it here
      auth: () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        return token ? { token } : {}
      }
    })

    // Basic logging
    socket.on('connect', () => console.log('[socket] connected', socket.id))
    socket.on('connect_error', (e) => console.warn('[socket] connect_error', e?.message))
    socket.on('disconnect', (r) => console.log('[socket] disconnected', r))
  }
  if (!socket.connected) socket.connect()
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
  }
}

// Chat helpers
export function sendMessage({ to, messageId, text, meta }) {
  return new Promise((resolve) => {
    getSocket().emit('chat:send', { to, messageId, text, meta }, (ack) => resolve(ack))
  })
}

export function onMessage(cb) {
  const s = getSocket()
  s.on('chat:deliver', cb)
  return () => s.off('chat:deliver', cb)
}

export function setTyping({ to, isTyping }) {
  getSocket().emit('chat:typing', { to, isTyping })
}

export function onTyping(cb) {
  const s = getSocket()
  s.on('chat:typing', cb)
  return () => s.off('chat:typing', cb)
}

export function sendReceipt({ to, messageId, status = 'seen' }) {
  getSocket().emit('chat:receipt', { to, messageId, status })
}

export function onReceipt(cb) {
  const s = getSocket()
  s.on('chat:receipt', cb)
  return () => s.off('chat:receipt', cb)
}

// Presence
export function onPresence(cb) {
  const s = getSocket()
  s.on('presence:state', cb)
  return () => s.off('presence:state', cb)
}

// Order room (existing feature)
export function joinOrderRoom(orderId) {
  getSocket().emit('joinOrderRoom', orderId)
}
