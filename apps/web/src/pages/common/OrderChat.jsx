import { useEffect, useRef, useState } from 'react'
import { get } from '../../shared/api.js'
import { getSocket, authenticate, joinOrder, onOrderMessage, sendOrderMessage } from '../../shared/socket.js'

export default function OrderChat({ orderId, meId }){
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef(null)

  useEffect(()=>{ getSocket(); authenticate() },[])

  // Load existing chat messages from database
  useEffect(()=>{
    if (!orderId) return
    
    const loadMessages = async () => {
      try {
        setLoading(true)
        const response = await get(`/api/chat/orders/${orderId}/messages`)
        setMessages(response.data || [])
      } catch (error) {
        console.error('Failed to load chat messages:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadMessages()
  }, [orderId])

  useEffect(()=>{
    if (!orderId) return
    joinOrder(orderId)
    const off = onOrderMessage((m)=>{
      if (m.orderId === orderId) {
        setMessages(prev=> {
          // Check if message already exists (prevent duplicates)
          const exists = prev.some(existing => 
            existing.tempId === m.tempId || 
            (existing.timestamp === m.timestamp && existing.text === m.text)
          )
          if (exists) return prev
          return [...prev, m]
        })
      }
    })
    return ()=>{ off && off() }
  },[orderId])

  useEffect(()=>{
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  },[messages])

  async function send(){
    const text = input.trim()
    if (!text) return
    const tempId = crypto.randomUUID()
    setInput('')
    
    // Add message optimistically
    const mine = { orderId, from: meId, text, timestamp: Date.now(), tempId }
    setMessages(prev=> [...prev, mine])
    
    // Send to server
    sendOrderMessage({ orderId, text, tempId })
  }

  return (
    <div className="border rounded p-2">
      <div className="font-medium mb-1">Chat</div>
      <div ref={listRef} className="h-40 overflow-auto border p-2 space-y-1 bg-white">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-sm">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-sm">No messages yet</div>
          </div>
        ) : (
          messages.map((m)=>{
            // Handle both populated and non-populated message objects
            const fromId = m.from?._id || m.from
            const isMine = String(fromId) === String(meId)
            return (
              <div key={m.tempId || m.timestamp} className={`flex ${isMine? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  isMine 
                    ? 'bg-orange-500 text-white rounded-br-sm' 
                    : 'bg-gray-200 text-gray-800 rounded-bl-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            )
          })
        )}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <input 
          className="border flex-1 px-2 py-1" 
          value={input} 
          onChange={(e)=>setInput(e.target.value)} 
          onKeyPress={(e)=> e.key === 'Enter' && send()}
          placeholder="Type a message" 
        />
        <button className="bg-blue-600 text-white px-3 py-1" onClick={send}>Send</button>
      </div>
    </div>
  )
}


