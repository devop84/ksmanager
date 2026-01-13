/**
 * Secure database wrapper that routes all queries through the API
 * This replaces direct database access to keep credentials secure
 * 
 * Usage: import sql from './lib/secureDb.js'
 * Then use: const result = await sql`SELECT * FROM users WHERE id = ${userId}`
 */

import api from './api.js'

/**
 * Convert template literal to parameterized query
 */
function buildParameterizedQuery(strings, values) {
  let query = strings[0]
  const params = []
  
  for (let i = 0; i < values.length; i++) {
    params.push(values[i])
    query += `$${i + 1}` + (strings[i + 1] || '')
  }
  
  return { query, params }
}

/**
 * Secure SQL client that routes queries through the API
 * Maintains compatibility with existing code using sql`...` syntax
 */
async function sql(strings, ...values) {
  const { query, params } = buildParameterizedQuery(strings, values)
  
  try {
    return await api.query(query, params)
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

export default sql
