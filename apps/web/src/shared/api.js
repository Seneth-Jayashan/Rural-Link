const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export async function api(path, { method = 'GET', body, headers } = {}){
  const token = localStorage.getItem('token')
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  const res = await fetch(`${BASE}${path}`,{
    method,
    headers: { ...(isFormData ? {} : { 'Content-Type':'application/json' }), ...(token? { Authorization: `Bearer ${token}` } : {}), ...(headers||{}) },
    credentials: 'include',
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  })
  const data = await res.json().catch(()=>({}))
  if(!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

export const get = (path)=> api(path)
export const post = (path, body)=> api(path, { method:'POST', body })
export const put = (path, body)=> api(path, { method:'PUT', body })
export const del = (path)=> api(path, { method:'DELETE' })


