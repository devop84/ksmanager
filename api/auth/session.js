import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Get session
    const sessionToken = req.headers.authorization?.replace('Bearer ', '') || req.query.token

    if (!sessionToken) {
      return res.status(401).json({ error: 'No session token provided' })
    }

    try {
      const sessions = await sql`
        SELECT s.id, s.user_id, s.expires_at, u.id as user_id, u.name, u.email, u.role, u.language
        FROM sessions s
        INNER JOIN users u ON s.user_id = u.id
        WHERE s.session_token = ${sessionToken}
          AND s.expires_at > CURRENT_TIMESTAMP
        LIMIT 1
      `

      if (sessions.length === 0) {
        return res.status(401).json({ error: 'Invalid or expired session' })
      }

      const session = sessions[0]
      return res.status(200).json({
        id: session.id,
        userId: session.user_id,
        expiresAt: session.expires_at,
        user: {
          id: session.user_id,
          name: session.name,
          email: session.email,
          role: session.role || 'viewonly',
          language: session.language || 'en-US'
        }
      })
    } catch (error) {
      console.error('Session check error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  } else if (req.method === 'DELETE') {
    // Delete session (logout)
    const sessionToken = req.headers.authorization?.replace('Bearer ', '') || req.query.token

    if (!sessionToken) {
      return res.status(400).json({ error: 'No session token provided' })
    }

    try {
      await sql`
        DELETE FROM sessions
        WHERE session_token = ${sessionToken}
      `
      return res.status(200).json({ message: 'Session deleted' })
    } catch (error) {
      console.error('Logout error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}
