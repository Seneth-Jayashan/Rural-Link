import { useEffect, useState, useRef } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { get, post } from '../../shared/api.js'
import { Spinner } from '../../shared/ui/Spinner.jsx'
// Chat/Call removed

export default function OrderTracking(){
  const { orderId } = useParams()
  const location = useLocation()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewed, setReviewed] = useState({}) // { product:<bool>, delivery:<bool> }
  const [productReviews, setProductReviews] = useState({}) // productId -> { rating, comment }
  const [driverReview, setDriverReview] = useState({ rating: 0, comment: '' })

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

          {/* Communication with assigned deliverer removed */}

          {/* Quick CTA to review */}
          {order.status === 'delivered' && (
            <div className="mt-3">
              <a href="#reviews" className="inline-block bg-green-600 text-white px-3 py-1 text-sm rounded">Review this order</a>
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
                            <textarea className="w-full border rounded p-2 text-sm" rows={2} placeholder="Write your feedback (optional)"
                              value={productReviews[pid]?.comment||''}
                              onChange={(e)=> setProductReviews(prev=> ({...prev, [pid]: { ...(prev[pid]||{}), comment: e.target.value }}))}
                            />
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
                      <textarea className="w-full border rounded p-2 text-sm" rows={2} placeholder="Feedback for driver (optional)"
                        value={driverReview.comment}
                        onChange={(e)=> setDriverReview(prev=> ({...prev, comment: e.target.value}))}
                      />
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


