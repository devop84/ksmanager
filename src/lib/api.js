/**
 * API Client for making authenticated requests
 * This replaces direct database access with secure API calls
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

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config)
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error('API request error:', error)
    throw error
  }
}

export const api = {
  // Auth endpoints
  auth: {
    login: async (email, password) => {
      const result = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
      return result
    },
    
    signup: async (name, email, password) => {
      const result = await request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      })
      return result
    },
    
    getSession: async (token) => {
      return request(`/auth/session?token=${token}`, { method: 'GET' })
    },
    
    logout: async (token) => {
      return request(`/auth/session?token=${token}`, { method: 'DELETE' })
    }
  },

  // Database query endpoint
  query: async (query, params = []) => {
    const result = await request('/db/query', {
      method: 'POST',
      body: JSON.stringify({ query, params })
    })
    return result.data
  },

  // Settings endpoints
  settings: {
    getAppSetting: async (key) => {
      const result = await request(`/settings/app-settings?key=${key}`, { method: 'GET' })
      return result.value
    },
    
    setAppSetting: async (key, value) => {
      return request('/settings/app-settings', {
        method: 'POST',
        body: JSON.stringify({ key, value })
      })
    }
  },

  // User settings endpoints
  users: {
    updateLanguage: async (language) => {
      return request('/users/language', {
        method: 'PUT',
        body: JSON.stringify({ language })
      })
    }
  }
}

export default api
