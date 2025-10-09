import { useEffect, useState, useRef } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { get, post } from '../../shared/api.js'
import { Spinner } from '../../shared/ui/Spinner.jsx'
import OrderChat from './OrderChat.jsx'
import { generateGhostText, generateSimpleGhostText } from '../../shared/huggingFaceApi.js'

export default function OrderTracking(){
  const { orderId } = useParams()
  const location = useLocation()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewed, setReviewed] = useState({}) // { product:<bool>, delivery:<bool> }
  const [productReviews, setProductReviews] = useState({}) // productId -> { rating, comment }
  const [driverReview, setDriverReview] = useState({ rating: 0, comment: '' })
  const [ghostText, setGhostText] = useState({}) // productId -> ghost text
  const [generatingGhost, setGeneratingGhost] = useState({}) // productId -> loading state
  const [typingTimeout, setTypingTimeout] = useState({}) // productId -> timeout ID

  useEffect(()=>{
    const path = orderId === 'last' ? '/api/orders/last' : `/api/orders/${orderId}`
    get(path)
      .then(d=> setOrder(d.data))
      .catch(e=> setError(e.message))
  },[orderId])

  // Scroll to reviews if hash provided
  const reviewsRef = useRef(null)
  useEffect(()=>{
    if (order && location?.hash === '#reviews' && reviewsRef.current) {
      reviewsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [order, location?.hash])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(typingTimeout).forEach(timeoutId => {
        if (timeoutId) clearTimeout(timeoutId)
      })
    }
  }, [typingTimeout])

  const generateProductGhostText = async (productId, productName) => {
    setGeneratingGhost(prev => ({ ...prev, [productId]: true }))
    try {
      const aiText = await generateGhostText(productName, 'product')
      const fallbackText = generateSimpleGhostText('product')
      setGhostText(prev => ({ ...prev, [productId]: aiText || fallbackText }))
    } catch (error) {
      console.error('Error generating ghost text:', error)
      setGhostText(prev => ({ ...prev, [productId]: generateSimpleGhostText('product') }))
    } finally {
      setGeneratingGhost(prev => ({ ...prev, [productId]: false }))
    }
  }

  const generateDeliveryGhostText = async () => {
    setGeneratingGhost(prev => ({ ...prev, 'delivery': true }))
    try {
      const aiText = await generateGhostText('delivery service', 'delivery')
      const fallbackText = generateSimpleGhostText('delivery')
      setGhostText(prev => ({ ...prev, 'delivery': aiText || fallbackText }))
    } catch (error) {
      console.error('Error generating ghost text:', error)
      setGhostText(prev => ({ ...prev, 'delivery': generateSimpleGhostText('delivery') }))
    } finally {
      setGeneratingGhost(prev => ({ ...prev, 'delivery': false }))
    }
  }

  // Auto-generate suggestions as user types
  const handleProductTextChange = (productId, productName, value) => {
    // Update the text immediately
    setProductReviews(prev => ({...prev, [productId]: { ...(prev[productId]||{}), comment: value }}))
    
    // Clear existing timeout
    if (typingTimeout[productId]) {
      clearTimeout(typingTimeout[productId])
    }
    
    // Only generate suggestions if user has typed at least 3 characters
    if (value.length >= 3) {
      const timeoutId = setTimeout(() => {
        generateProductGhostText(productId, productName)
      }, 1000) // Wait 1 second after user stops typing
      
      setTypingTimeout(prev => ({ ...prev, [productId]: timeoutId }))
    } else {
      // Clear ghost text if user hasn't typed enough
      setGhostText(prev => ({ ...prev, [productId]: null }))
    }
  }

  const handleDeliveryTextChange = (value) => {
    // Update the text immediately
    setDriverReview(prev => ({...prev, comment: value}))
    
    // Clear existing timeout
    if (typingTimeout['delivery']) {
      clearTimeout(typingTimeout['delivery'])
    }
    
    // Only generate suggestions if user has typed at least 3 characters
    if (value.length >= 3) {
      const timeoutId = setTimeout(() => {
        generateDeliveryGhostText()
      }, 1000) // Wait 1 second after user stops typing
      
      setTypingTimeout(prev => ({ ...prev, 'delivery': timeoutId }))
    } else {
      // Clear ghost text if user hasn't typed enough
      setGhostText(prev => ({ ...prev, 'delivery': null }))
    }
  }

  return (
    <div className="p-3 pb-16">
      <h1 className="text-lg font-semibold mb-2">Track Order</h1>
      {error && <div className="text-red-600">{error}</div>}
      {!order && !error && (
        <div className="flex items-center gap-2 text-gray-600"><Spinner size={18} /> Loading...</div>
      )}
      {order && (
        <div className="space-y-2">
          <div className="font-medium">Order {order.orderNumber}</div>
          <div className="text-sm">Status: {order.status.replace('_',' ')}</div>
          <div className="text-sm text-gray-700">Total: ${order.total?.toFixed?.(2) || order.total}</div>
          <div>
            <div className="font-medium mb-1">Items</div>
            <div className="space-y-1">
              {order.items?.map((it, idx)=> (
                <div key={idx} className="text-xs text-gray-700 flex justify-between">
                  <span>{it.product?.name || 'Item'}</span>
                  <span>x{it.quantity} • ${it.total?.toFixed?.(2) || (it.price * it.quantity).toFixed?.(2)}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="font-medium mb-1">Timeline</div>
            {/* Progress steps */}
            {(()=>{
              const steps = ['pending','confirmed','preparing','ready','picked_up','in_transit','delivered']
              const currentIdx = Math.max(0, steps.indexOf(order.status))
              return (
                <div className="flex items-center gap-2 overflow-x-auto py-2">
                  {steps.map((s, idx)=>{
                    const done = idx <= currentIdx
                    return (
                      <div key={s} className="flex items-center gap-2">
                        <div className={`flex items-center gap-2 ${done? 'text-green-600' : 'text-gray-400'}`}>
                          <div className={`w-2.5 h-2.5 rounded-full ${done? 'bg-green-600' : 'bg-gray-300'}`}></div>
                          <div className="text-xs whitespace-nowrap">{s.replace('_',' ')}</div>
                        </div>
                        {idx < steps.length-1 && (
                          <div className={`h-0.5 w-8 ${idx < currentIdx ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })()}

            {/* Raw history */}
            <div className="space-y-1 mt-2">
              {order.trackingHistory?.map((h,idx)=> (
                <div key={idx} className="text-xs text-gray-700">
                  {new Date(h.timestamp).toLocaleString()} — {h.status.replace('_',' ')} {h.note?`• ${h.note}`:''}
                </div>
              ))}
            </div>
          </div>

          {/* Customer chat with assigned driver when picked_up or in_transit (not delivered) */}
          {order.deliveryPerson?._id && ['picked_up','in_transit'].includes(order.status) && order.status !== 'delivered' && (
            <div className="mt-3">
              <div className="font-medium mb-1">Chat with your courier</div>
              <OrderChat orderId={order._id} meId={order.customer?._id} />
            </div>
          )}


          {/* Reviews after delivery */}
          {order.status === 'delivered' && (
            <div ref={reviewsRef} id="reviews" className="mt-4 space-y-4">
              <div>
                <div className="font-medium mb-2">Rate Your Products</div>
                <div className="space-y-3">
                  {order.items?.map((it, idx)=>{
                    const pid = it.product?._id
                    return (
                      <div key={idx} className="border rounded p-2">
                        <div className="text-sm font-medium">{it.product?.name || 'Item'}</div>
                        {!reviewed[`product:${pid}`] ? (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <span>Rating:</span>
                              {[1,2,3,4,5].map(st=> (
                                <button type="button" key={st} className={`px-2 py-0.5 border ${ (productReviews[pid]?.rating||0) >= st ? 'bg-yellow-300' : 'bg-white' }`}
                                  onClick={()=> setProductReviews(prev=> ({...prev, [pid]: { ...(prev[pid]||{}), rating: st }}))}>{st}</button>
                              ))}
                            </div>
                            <div className="relative">
                              <textarea className="w-full border rounded p-2 text-sm" rows={2} 
                                placeholder="Write your feedback (optional)"
                                value={productReviews[pid]?.comment||''}
                                onChange={(e)=> handleProductTextChange(pid, it.product?.name || 'product', e.target.value)}
                              />
                              {ghostText[pid] && productReviews[pid]?.comment && productReviews[pid]?.comment.length >= 3 && (
                                <div className="mt-1 p-2 text-sm text-blue-500 italic bg-blue-50/50 rounded border-l-2 border-blue-300">
                                  💡 AI Suggestion: {ghostText[pid]}
                                  <button 
                                    type="button"
                                    className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                    onClick={() => setProductReviews(prev=> ({...prev, [pid]: { ...(prev[pid]||{}), comment: ghostText[pid] }}))}
                                  >
                                    Use
                                  </button>
                                </div>
                              )}
                              {generatingGhost[pid] && (
                                <div className="mt-1 p-2 text-sm text-gray-500 italic bg-gray-50 rounded">
                                  🤖 Generating AI suggestion...
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 mt-2">
                              <button type="button" className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded border border-blue-300 hover:bg-blue-200 disabled:opacity-50"
                                onClick={() => generateProductGhostText(pid, it.product?.name || 'product')}
                                disabled={generatingGhost[pid]}
                              >
                                {generatingGhost[pid] ? 'Generating...' : '🤖 Get AI suggestion'}
                              </button>
                              {ghostText[pid] && (
                                <button type="button" className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded border border-green-300 hover:bg-green-200"
                                  onClick={() => setProductReviews(prev=> ({...prev, [pid]: { ...(prev[pid]||{}), comment: ghostText[pid] }}))}
                                >
                                  ✓ Use suggestion
                                </button>
                              )}
                            </div>
                            <button className="bg-green-600 text-white px-3 py-1 text-sm disabled:opacity-50"
                              disabled={submitting || !(productReviews[pid]?.rating>0)}
                              onClick={async ()=>{
                                try{
                                  setSubmitting(true)
                                  await post('/api/reviews', {
                                    orderId: order._id,
                                    type: 'product',
                                    rating: productReviews[pid]?.rating,
                                    comment: productReviews[pid]?.comment||'',
                                    productId: pid
                                  })
                                  setReviewed(prev=> ({...prev, [`product:${pid}`]: true}))
                                }catch(e){ setError(e.message||'Failed to submit review') }
                                finally{ setSubmitting(false) }
                              }}>Submit Review</button>
                          </div>
                        ) : (
                          <div className="text-xs text-green-700 mt-1">Thanks! Your review was submitted.</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {order.deliveryPerson?._id && (
                <div>
                  <div className="font-medium mb-2">Rate Your Delivery</div>
                  {!reviewed['delivery'] ? (
                    <div className="border rounded p-2 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span>Driver rating:</span>
                        {[1,2,3,4,5].map(st=> (
                          <button type="button" key={st} className={`px-2 py-0.5 border ${ (driverReview.rating||0) >= st ? 'bg-yellow-300' : 'bg-white' }`}
                            onClick={()=> setDriverReview(prev=> ({...prev, rating: st}))}>{st}</button>
                        ))}
                      </div>
                      <div className="relative">
                        <textarea className="w-full border rounded p-2 text-sm" rows={2} 
                          placeholder="Feedback for driver (optional)"
                          value={driverReview.comment}
                          onChange={(e)=> handleDeliveryTextChange(e.target.value)}
                        />
                        {ghostText['delivery'] && driverReview.comment && driverReview.comment.length >= 3 && (
                          <div className="mt-1 p-2 text-sm text-blue-500 italic bg-blue-50/50 rounded border-l-2 border-blue-300">
                            💡 AI Suggestion: {ghostText['delivery']}
                            <button 
                              type="button"
                              className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              onClick={() => setDriverReview(prev=> ({...prev, comment: ghostText['delivery']}))}
                            >
                              Use
                            </button>
                          </div>
                        )}
                        {generatingGhost['delivery'] && (
                          <div className="mt-1 p-2 text-sm text-gray-500 italic bg-gray-50 rounded">
                            🤖 Generating AI suggestion...
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button type="button" className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded border border-blue-300 hover:bg-blue-200 disabled:opacity-50"
                          onClick={generateDeliveryGhostText}
                          disabled={generatingGhost['delivery']}
                        >
                          {generatingGhost['delivery'] ? 'Generating...' : '🤖 Get AI suggestion'}
                        </button>
                        {ghostText['delivery'] && (
                          <button type="button" className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded border border-green-300 hover:bg-green-200"
                            onClick={() => setDriverReview(prev=> ({...prev, comment: ghostText['delivery']}))}
                          >
                            ✓ Use suggestion
                          </button>
                        )}
                      </div>
                      <button className="bg-blue-600 text-white px-3 py-1 text-sm disabled:opacity-50"
                        disabled={submitting || !(driverReview.rating>0)}
                        onClick={async ()=>{
                          try{
                            setSubmitting(true)
                            await post('/api/reviews', {
                              orderId: order._id,
                              type: 'delivery',
                              rating: driverReview.rating,
                              comment: driverReview.comment||'',
                              deliveryPersonId: order.deliveryPerson._id
                            })
                            setReviewed(prev=> ({...prev, ['delivery']: true}))
                          }catch(e){ setError(e.message||'Failed to submit review') }
                          finally{ setSubmitting(false) }
                        }}>Submit Driver Review</button>
                    </div>
                  ) : (
                    <div className="text-xs text-green-700">Thanks! Your driver review was submitted.</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}


