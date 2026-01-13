import { neon, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'
import { verifyPassword } from '../lib/password.js'
import crypto from 'node:crypto'

// Configure Neon for serverless environments (Vercel)
neonConfig.webSocketConstructor = ws

// Check for DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set')
}

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null

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
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Find user by email
    const users = await sql`
      SELECT id, name, email, password_hash, role, language
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const user = users[0]

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Generate session token
    const sessionToken = generateSessionToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Create session
    await sql`
      INSERT INTO sessions (user_id, session_token, expires_at)
      VALUES (${user.id}, ${sessionToken}, ${expiresAt.toISOString()})
    `

    // Return user without password hash
    return res.status(200).json({
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
    console.error('Login error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}

function generateSessionToken() {
  // Use Node.js crypto for server-side token generation
  return crypto.randomBytes(32).toString('hex')
}
