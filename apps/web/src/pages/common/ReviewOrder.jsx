import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { get, post } from '../../shared/api.js'

export default function ReviewOrder(){
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewed, setReviewed] = useState({}) // product:<bool>, delivery:<bool>
  const [productReviews, setProductReviews] = useState({}) // productId -> { rating, comment }
  const [driverReview, setDriverReview] = useState({ rating: 0, comment: '' })

  useEffect(()=>{
    async function load(){
      try{
        const path = orderId === 'last' ? '/api/orders/last' : `/api/orders/${orderId}`
        const d = await get(path)
        setOrder(d.data)
      }catch(e){ setError(e.message||'Failed to load order') }
      finally{ setLoading(false) }
    }
    load()
  },[orderId])

  if (loading) return <div className="p-3">Loading...</div>
  if (error) return <div className="p-3 text-red-600">{error}</div>
  if (!order) return <div className="p-3">Order not found</div>

  const normalizedStatus = ((order?.status||'')+'').toLowerCase().trim().replace(/\s+/g,'_')
  const isDelivered = normalizedStatus === 'delivered' || normalizedStatus.includes('deliver')

  return (
    <div className="p-3 pb-16">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Review Order</h1>
        <Link to={`/track/${order._id}`} className="text-blue-700 underline text-sm">Back to tracking</Link>
      </div>

      <div className="text-sm text-gray-700 mt-1">Order {order.orderNumber} • Status: {(order.status||'').toString().replace('_',' ')}</div>

      {!isDelivered && (
        <div className="mt-3 p-2 rounded bg-yellow-100 text-yellow-900 text-sm">
          You can submit reviews after the order is delivered.
        </div>
      )}

      {isDelivered && (
        <div className="mt-4 space-y-5">
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
                          }}>Submit Product Review</button>
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
  )
}
