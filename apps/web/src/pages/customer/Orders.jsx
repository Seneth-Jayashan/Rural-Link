import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../../shared/api.js'
import { Spinner } from '../../shared/ui/Spinner.jsx'
import { useI18n } from '../../shared/i18n/LanguageContext.jsx'

export default function CustomerOrders(){
  const { t } = useI18n()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(()=>{
    let mounted = true
    get('/api/orders/me')
      .then((d)=>{ if(mounted){ setOrders(d.data||[]); setLoading(false) } })
      .catch((e)=>{ if(mounted){ setError(e.message||'Failed to load orders'); setLoading(false) } })
    return ()=>{ mounted = false }
  },[])

  if (loading) return (
    <div className="p-3"><div className="flex items-center gap-2 text-gray-600"><Spinner size={18} /> {t('Loading your orders...')}</div></div>
  )

  if (error) return (
    <div className="p-3 text-red-600">{error}</div>
  )

  return (
    <div className="p-3 pb-16">
      <h1 className="text-lg font-semibold mb-3">{t('My Orders')}</h1>

      {orders.length === 0 && (
        <div className="text-gray-600 text-sm">{t('You have no orders yet.')}</div>
      )}

      <div className="space-y-2">
        {orders.map((o)=> (
          <div key={o._id} className="border rounded p-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">{t('Order')} {o.orderNumber}</div>
              <div className="text-xs text-gray-600">{(o.status||'').replace('_',' ')}</div>
            </div>
            <div className="mt-1 text-sm text-gray-700 flex flex-wrap gap-x-4 gap-y-1">
              <div>{t('Total')}: ${o.total?.toFixed?.(2) || o.total}</div>
              <div>{t('Items')}: {o.items?.length || 0}</div>
              {o.deliveryPerson && (
                <div>{t('Courier')}: {o.deliveryPerson?.firstName} {o.deliveryPerson?.lastName}</div>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Link className="text-blue-700 underline" to={`/track/${o._id}`}>{t('Track')}</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
