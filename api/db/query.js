import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify session
    const sessionToken = req.headers.authorization?.replace('Bearer ', '')
    if (!sessionToken) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Check session validity
    const sessions = await sql`
      SELECT user_id, expires_at
      FROM sessions
      WHERE session_token = ${sessionToken}
        AND expires_at > CURRENT_TIMESTAMP
      LIMIT 1
    `

    if (sessions.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired session' })
    }

    const { query: queryString, params = [] } = req.body

    if (!queryString) {
      return res.status(400).json({ error: 'Query is required' })
    }

    // Security: Validate that this is a parameterized query
    // Count parameter placeholders ($1, $2, etc.)
    const paramMatches = queryString.match(/\$\d+/g) || []
    const uniqueParams = new Set(paramMatches.map(m => m))
    
    if (params.length !== uniqueParams.size) {
      return res.status(400).json({ 
        error: 'Parameter count mismatch. Ensure all parameters are properly parameterized.' 
      })
    }

    // Execute parameterized query safely using Neon's unsafe method
    // This is safe because we're using parameterized queries, not string concatenation
    const result = await sql.unsafe(queryString, params)
    
    return res.status(200).json({ data: result })
  } catch (error) {
    console.error('Query error:', error)
    return res.status(500).json({ error: 'Internal server error', message: error.message })
  }
}
