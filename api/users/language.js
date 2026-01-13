import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export default async function handler(req, res) {
  if (req.method !== 'PUT' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify session
  const sessionToken = req.headers.authorization?.replace('Bearer ', '')
  if (!sessionToken) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Get user from session
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

  const userId = sessions[0].user_id
  const { language } = req.body

  if (!language) {
    return res.status(400).json({ error: 'Language is required' })
  }

  try {
    await sql`
      UPDATE users
      SET language = ${language}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `
    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Update user language error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
