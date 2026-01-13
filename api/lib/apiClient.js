/**
 * API Client utility for making authenticated requests to serverless functions
 */

const API_BASE = '/api'

async function request(endpoint, options = {}) {
  const sessionToken = localStorage.getItem('kiteManager_session')
  
  const headers = {
    'Content-Type': 'application/json',
    ...(sessionToken && { Authorization: `Bearer ${sessionToken}` }),
    ...options.headers
  }

  const config = {
    ...options,
    headers
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export const api = {
  // Auth endpoints
  auth: {
    login: (email, password) => 
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }),
    
    signup: (name, email, password) =>
      request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      }),
    
    getSession: (token) =>
      request(`/auth/session?token=${token}`, { method: 'GET' }),
    
    logout: (token) =>
      request(`/auth/session?token=${token}`, { method: 'DELETE' })
  },

  // Database query endpoint (for complex queries)
  query: (query, params = []) =>
    request('/db/query', {
      method: 'POST',
      body: JSON.stringify({ query, params })
    })
}

export default api
