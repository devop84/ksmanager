import { neon, Pool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

// Configure Neon for serverless environments (Vercel)
// Vercel's Node.js runtime doesn't have WebSocket, so we use the 'ws' package
// This configuration is required for database connections to work in production
neonConfig.webSocketConstructor = ws

// Check for DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set')
}

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Check database connection
  if (!sql) {
    console.error('Database connection not available - DATABASE_URL missing')
    return res.status(500).json({ 
      error: 'Database configuration error',
      message: 'DATABASE_URL environment variable is not set'
    })
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

    // Execute parameterized query using Pool.query which supports parameterized queries
    // The Pool class from @neondatabase/serverless supports $1, $2, etc. placeholders
    if (!pool) {
      throw new Error('Database pool not available')
    }
    
    const result = await pool.query(queryString, params)
    
    // Pool.query returns { rows, rowCount, ... } - return just the rows array to match expected format
    return res.status(200).json({ data: result.rows })
  } catch (error) {
    console.error('Query error:', error)
    return res.status(500).json({ error: 'Internal server error', message: error.message })
  }
}
