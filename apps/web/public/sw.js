const CACHE = 'rl-cache-v1'
const OFFLINE_ORDERS = 'offline-orders'

self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE))
})

self.addEventListener('fetch', (e)=>{
  const { request } = e
  if (request.method === 'POST' && request.url.includes('/api/orders')){
    e.respondWith((async ()=>{
      try{
        const res = await fetch(request.clone())
        return res
      }catch(err){
        const body = await request.clone().json().catch(()=>null)
        const db = await openDB()
        const tx = db.transaction(OFFLINE_ORDERS, 'readwrite')
        await tx.store.add({ body, createdAt: Date.now() })
        await tx.done
        return new Response(JSON.stringify({ success:true, offline:true, message:'Queued offline' }), { status: 200, headers: { 'Content-Type':'application/json' } })
      }
    })())
  }
})

async function openDB(){
  return await new Promise((resolve, reject)=>{
    const req = indexedDB.open('rural-link', 1)
    req.onupgradeneeded = ()=>{
      const db = req.result
      if(!db.objectStoreNames.contains(OFFLINE_ORDERS)) db.createObjectStore(OFFLINE_ORDERS, { keyPath:'createdAt' })
    }
    req.onsuccess = ()=> resolve(req.result)
    req.onerror = ()=> reject(req.error)
  })
}

self.addEventListener('sync', (event)=>{
  if (event.tag === 'sync-orders'){
    event.waitUntil(flushOrders())
  }
})

async function flushOrders(){
  const db = await openDB()
  const tx = db.transaction(OFFLINE_ORDERS, 'readwrite')
  const store = tx.store
  const all = await store.getAll()
  for (const entry of all){
    try{
      await fetch('/api/orders', { method:'POST', headers:{ 'Content-Type':'application/json' }, credentials:'include', body: JSON.stringify(entry.body) })
      await store.delete(entry.createdAt)
    }catch{}
  }
  await tx.done
}


