import { getSocket } from './socket'

// Basic ICE servers: public STUN for dev
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' }
]

export function createPeerConnection({ onTrack, onIceCandidate, onConnectionState, iceServers = ICE_SERVERS } = {}) {
  const pc = new RTCPeerConnection({ iceServers })

  pc.onicecandidate = (e) => {
    if (e.candidate && typeof onIceCandidate === 'function') onIceCandidate(e.candidate)
  }

  pc.ontrack = (e) => {
    if (typeof onTrack === 'function') onTrack(e.streams[0])
  }

  pc.onconnectionstatechange = () => {
    if (typeof onConnectionState === 'function') onConnectionState(pc.connectionState)
  }

  return pc
}

export async function getUserMedia({ audio = true, video = false } = {}) {
  return await navigator.mediaDevices.getUserMedia({ audio, video })
}

// Caller flow
export async function startCall({ to, media, pc, onOfferCreated }) {
  // Attach media tracks to pc
  media.getTracks().forEach((t) => pc.addTrack(t, media))

  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)

  if (typeof onOfferCreated === 'function') onOfferCreated(offer)

  const socket = getSocket()
  socket.emit('call:init', { to, type: media.getVideoTracks().length ? 'video' : 'audio' })
  socket.emit('call:offer', { to, sdp: offer })
}

export async function handleAnswer({ sdp, pc }) {
  await pc.setRemoteDescription(new RTCSessionDescription(sdp))
}

// Callee flow
export async function acceptCall({ from, media, pc }) {
  media.getTracks().forEach((t) => pc.addTrack(t, media))
  const answer = await pc.createAnswer()
  await pc.setLocalDescription(answer)
  getSocket().emit('call:accept', { to: from })
  getSocket().emit('call:answer', { to: from, sdp: answer })
}

export async function handleOffer({ sdp, pc }) {
  await pc.setRemoteDescription(new RTCSessionDescription(sdp))
}

export function sendIceCandidate({ to, candidate }) {
  getSocket().emit('call:ice', { to, candidate })
}

export function wireCallSignaling({ onRing, onOffer, onAnswer, onIce, onEnd }) {
  const s = getSocket()
  if (onRing) s.on('call:ring', onRing)
  if (onOffer) s.on('call:offer', onOffer)
  if (onAnswer) s.on('call:answer', onAnswer)
  if (onIce) s.on('call:ice', onIce)
  if (onEnd) s.on('call:end', onEnd)
  return () => {
    onRing && s.off('call:ring', onRing)
    onOffer && s.off('call:offer', onOffer)
    onAnswer && s.off('call:answer', onAnswer)
    onIce && s.off('call:ice', onIce)
    onEnd && s.off('call:end', onEnd)
  }
}

export function endCall({ to, pc, reason = 'ended' }) {
  getSocket().emit('call:end', { to, reason })
  try { pc && pc.close() } catch {}
}
