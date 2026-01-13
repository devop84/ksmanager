import { neon } from '@neondatabase/serverless'
import { hashPassword } from '../lib/password.js'
import crypto from 'node:crypto'

const sql = neon(process.env.DATABASE_URL)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' })
    }

    // Hash the password
    const passwordHash = await hashPassword(password)

    // Auto-detect timezone for new user
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

    // Insert user into database
    const result = await sql`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (${name}, ${email}, ${passwordHash}, 'viewonly')
      RETURNING id, name, email, role, language, created_at
    `

    const user = result[0]

    // Generate session token
    const sessionToken = generateSessionToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Create session
    await sql`
      INSERT INTO sessions (user_id, session_token, expires_at)
      VALUES (${user.id}, ${sessionToken}, ${expiresAt.toISOString()})
    `

    return res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'viewonly',
        language: user.language || 'en-US'
      },
      sessionToken
    })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' })
    }
    console.error('Signup error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

function generateSessionToken() {
  // Use Node.js crypto for server-side token generation
  return crypto.randomBytes(32).toString('hex')
}
