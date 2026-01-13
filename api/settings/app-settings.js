import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export default async function handler(req, res) {
  const sessionToken = req.headers.authorization?.replace('Bearer ', '')

  // For write operations, require a valid session
  if (req.method === 'POST' || req.method === 'PUT') {
    if (!sessionToken) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const sessions = await sql`
      SELECT user_id
      FROM sessions
      WHERE session_token = ${sessionToken}
        AND expires_at > CURRENT_TIMESTAMP
      LIMIT 1
    `

    if (sessions.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired session' })
    }
  }

  if (req.method === 'GET') {
    // Public read: allow fetching global settings without a session token
    const { key } = req.query

    if (!key) {
      return res.status(400).json({ error: 'Setting key is required' })
    }

    try {
      const result = await sql`
        SELECT value
        FROM app_settings
        WHERE key = ${key}
        LIMIT 1
      `
      return res.status(200).json({ value: result.length > 0 ? result[0].value : null })
    } catch (error) {
      console.error('Get app setting error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  } else if (req.method === 'POST' || req.method === 'PUT') {
    // Set app setting
    const { key, value } = req.body

    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Setting key and value are required' })
    }

    try {
      await sql`
        INSERT INTO app_settings (key, value, updated_at)
        VALUES (${key}, ${value}, CURRENT_TIMESTAMP)
        ON CONFLICT (key) 
        DO UPDATE SET value = ${value}, updated_at = CURRENT_TIMESTAMP
      `
      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Set app setting error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}
