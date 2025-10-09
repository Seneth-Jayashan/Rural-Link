import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { getSocket, onMessage, sendMessage, onTyping, setTyping, onReceipt, onPresence } from '../../shared/realtime/socket.js'
import { createPeerConnection, getUserMedia, startCall, handleOffer, handleAnswer, acceptCall, wireCallSignaling, sendIceCandidate, endCall } from '../../shared/realtime/webrtc.js'

export default function CommDemo(){
  const { user } = useAuth()
  const [targetId, setTargetId] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [ring, setRing] = useState(null) // { from, type }
  const [status, setStatus] = useState('idle')

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const pcRef = useRef(null)
  const mediaRef = useRef(null)
  const activePeerRef = useRef(null) // userId of the person we are in call with

  // Ensure socket is created once logged in
  useEffect(()=>{ if (user) getSocket() },[user])

  // Chat listeners
  useEffect(()=>{
    const offMsg = onMessage((msg)=>{
      setMessages((prev)=>[...prev, { ...msg, incoming:true }])
    })
    const offTyping = onTyping(()=>{})
    const offReceipt = onReceipt(()=>{})
    const offPresence = onPresence(()=>{})
    return ()=>{ offMsg && offMsg(); offTyping && offTyping(); offReceipt && offReceipt(); offPresence && offPresence() }
  },[])

  // Call signaling
  useEffect(()=>{
    return wireCallSignaling({
      onRing: ({ from, type })=>{ setRing({ from, type }); setStatus('ringing') },
      onOffer: async ({ from, sdp })=>{
        if (!pcRef.current) pcRef.current = createPeerConnection({
          onTrack: (stream)=>{ if(remoteVideoRef.current) remoteVideoRef.current.srcObject = stream },
          onIceCandidate: (c)=>{ sendIceCandidate({ to: from, candidate: c }) },
          onConnectionState: (cs)=> setStatus(cs)
        })
        await handleOffer({ sdp, pc: pcRef.current })
      },
      onAnswer: async ({ from, sdp })=>{
        if (!pcRef.current) return
        await handleAnswer({ sdp, pc: pcRef.current })
      },
      onIce: async ({ from, candidate })=>{
        if (pcRef.current && candidate) {
          try { await pcRef.current.addIceCandidate(candidate) } catch {}
        }
      },
      onEnd: ({ from })=>{
        cleanupCall()
      }
    })
  },[])

  async function ensureMedia(video=false){
    if (!mediaRef.current) {
      mediaRef.current = await getUserMedia({ audio: true, video })
      if (localVideoRef.current && video) localVideoRef.current.srcObject = mediaRef.current
    }
    return mediaRef.current
  }

  async function makeCall(video=false){
    if (!targetId) return alert('Enter target userId')
    const media = await ensureMedia(video)
    if (!pcRef.current) pcRef.current = createPeerConnection({
      onTrack: (stream)=>{ if(remoteVideoRef.current) remoteVideoRef.current.srcObject = stream },
      onIceCandidate: (c)=>{ sendIceCandidate({ to: targetId, candidate: c }) },
      onConnectionState: (cs)=> setStatus(cs)
    })
    activePeerRef.current = targetId
    await startCall({ to: targetId, media, pc: pcRef.current })
  }

  async function answerCall(){
    if (!ring) return
    const media = await ensureMedia(ring.type === 'video')
    if (!pcRef.current) pcRef.current = createPeerConnection({
      onTrack: (stream)=>{ if(remoteVideoRef.current) remoteVideoRef.current.srcObject = stream },
      onIceCandidate: (c)=>{ sendIceCandidate({ to: ring.from, candidate: c }) },
      onConnectionState: (cs)=> setStatus(cs)
    })
    activePeerRef.current = ring.from
    await acceptCall({ from: ring.from, media, pc: pcRef.current })
    setRing(null)
  }

  function hangup(){
    if (activePeerRef.current) endCall({ to: activePeerRef.current, pc: pcRef.current })
    cleanupCall()
  }

  function cleanupCall(){
    try { pcRef.current && pcRef.current.close() } catch {}
    pcRef.current = null
    activePeerRef.current = null
    setRing(null)
    setStatus('idle')
  }

  async function send(){
    if (!targetId || !input.trim()) return
    const messageId = crypto.randomUUID()
    const text = input
    setInput('')
    const ack = await sendMessage({ to: targetId, messageId, text })
    setMessages((prev)=>[...prev, { from: user?._id, to: targetId, messageId, text, ack, incoming:false }])
  }

  const canCall = useMemo(()=>Boolean(user && targetId && targetId !== user._id), [user, targetId])

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Realtime Demo (Chat + Call)</h1>
      <div className="text-sm text-gray-600">Your ID: <code>{user?._id}</code></div>

      <div className="flex items-center gap-2">
        <input className="border px-2 py-1" placeholder="Target userId" value={targetId} onChange={e=>setTargetId(e.target.value)} />
        <button className="bg-blue-600 text-white px-3 py-1 disabled:opacity-50" disabled={!canCall} onClick={()=>makeCall(false)}>Call (Audio)</button>
        <button className="bg-indigo-600 text-white px-3 py-1 disabled:opacity-50" disabled={!canCall} onClick={()=>makeCall(true)}>Call (Video)</button>
        <button className="bg-red-600 text-white px-3 py-1" onClick={hangup}>Hang Up</button>
        <div>Status: {status}</div>
      </div>

      {ring && (
        <div className="p-2 border rounded flex items-center gap-2">
          <div>Incoming {ring.type} call from <code>{ring.from}</code></div>
          <button className="bg-green-600 text-white px-3 py-1" onClick={answerCall}>Accept</button>
          <button className="bg-gray-400 text-white px-3 py-1" onClick={cleanupCall}>Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2 className="font-semibold">Local</h2>
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full bg-black aspect-video" />
        </div>
        <div>
          <h2 className="font-semibold">Remote</h2>
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full bg-black aspect-video" />
        </div>
      </div>

      <div className="border rounded p-2">
        <div className="font-semibold mb-2">Chat</div>
        <div className="h-40 overflow-auto border p-2 space-y-1">
          {messages.map((m)=> (
            <div key={m.messageId} className={m.incoming? '' : 'text-right'}>
              <div className="inline-block bg-gray-100 px-2 py-1 rounded">{m.text}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input className="border flex-1 px-2 py-1" value={input} onChange={(e)=>{ setInput(e.target.value); setTyping({ to: targetId, isTyping:true }) }} placeholder="Type message" />
          <button className="bg-blue-600 text-white px-3 py-1" onClick={send}>Send</button>
        </div>
      </div>
    </div>
  )
}
