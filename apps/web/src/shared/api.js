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
  const contentType = res.headers.get('content-type') || ''
  let data
  if(contentType.includes('application/json')){
    data = await res.json().catch(()=>({}))
  }else{
    const text = await res.text().catch(()=> '')
    data = text ? { message: text } : {}
  }
  if(!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

export const get = (path)=> api(path)
export const post = (path, body)=> api(path, { method:'POST', body })
export const put = (path, body)=> api(path, { method:'PUT', body })
export const del = (path)=> api(path, { method:'DELETE' })

// Helper for FormData uploads
export async function uploadFormData(path, formData, method = 'POST') {
  const token = localStorage.getItem('token')
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include',
    body: formData
  })
  
  const contentType = response.headers.get('content-type') || ''
  let data
  if(contentType.includes('application/json')){
    data = await response.json().catch(()=>({}))
  }else{
    const text = await response.text().catch(()=> '')
    data = text ? { message: text } : {}
  }
  if(!response.ok) throw new Error(data.message || 'Request failed')
  return data
}

export const API_BASE = BASE

// Helper function to get full image URL
export function getImageUrl(imagePath) {
  if (!imagePath) return null
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) return imagePath
  // If it starts with /, it's a relative path from the API
  if (imagePath.startsWith('/')) return `${BASE}${imagePath}`
  // Otherwise, assume it's a relative path
  return `${BASE}/${imagePath}`
}



// Removed NLP helper