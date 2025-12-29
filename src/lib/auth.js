import sql from './neon.js'
import { hashPassword, verifyPassword } from './password.js'

/**
 * Create a new user in the database
 */
export async function createUser(name, email, password) {
  try {
    // Hash the password
    const passwordHash = await hashPassword(password)

    // Insert user into database (default role is viewonly)
    const result = await sql`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (${name}, ${email}, ${passwordHash}, 'viewonly')
      RETURNING id, name, email, role, created_at
    `

    return result[0]
  } catch (error) {
    if (error.code === '23505') { // Unique violation (email already exists)
      throw new Error('Email already registered')
    }
    throw error
  }
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(email, password) {
  try {
    // Find user by email
    const users = await sql`
      SELECT id, name, email, password_hash, role, language
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `

    if (users.length === 0) {
      throw new Error('Invalid email or password')
    }

    const user = users[0]

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      throw new Error('Invalid email or password')
    }

    // Return user without password hash
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'viewonly',
      language: user.language || 'en-US'
    }
  } catch (error) {
    throw error
  }
}

/**
 * Create a new session
 */
export async function createSession(userId) {
  try {
    // Generate a random session token
    const sessionToken = generateSessionToken()
    
    // Set expiration to 30 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Insert session into database
    const result = await sql`
      INSERT INTO sessions (user_id, session_token, expires_at)
      VALUES (${userId}, ${sessionToken}, ${expiresAt.toISOString()})
      RETURNING id, session_token, expires_at
    `

    return result[0]
  } catch (error) {
    throw error
  }
}

/**
 * Verify and get session
 */
export async function getSession(sessionToken) {
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
      return null
    }

    const session = sessions[0]
    return {
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
    }
  } catch (error) {
    throw error
  }
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(sessionToken) {
  try {
    await sql`
      DELETE FROM sessions
      WHERE session_token = ${sessionToken}
    `
  } catch (error) {
    throw error
  }
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions() {
  try {
    await sql`
      DELETE FROM sessions
      WHERE expires_at < CURRENT_TIMESTAMP
    `
  } catch (error) {
    console.error('Error cleaning up sessions:', error)
  }
}

/**
 * Generate a random session token
 */
function generateSessionToken() {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Update user language preference
 */
export async function updateUserLanguage(userId, language) {
  try {
    await sql`
      UPDATE users
      SET language = ${language}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `
  } catch (error) {
    throw error
  }
}

/**
 * Get app setting (global settings like currency)
 */
export async function getAppSetting(key) {
  try {
    const result = await sql`
      SELECT value
      FROM app_settings
      WHERE key = ${key}
      LIMIT 1
    `
    return result.length > 0 ? result[0].value : null
  } catch (error) {
    throw error
  }
}

/**
 * Set app setting (global settings like currency)
 */
export async function setAppSetting(key, value) {
  try {
    await sql`
      INSERT INTO app_settings (key, value, updated_at)
      VALUES (${key}, ${value}, CURRENT_TIMESTAMP)
      ON CONFLICT (key) 
      DO UPDATE SET value = ${value}, updated_at = CURRENT_TIMESTAMP
    `
  } catch (error) {
    throw error
  }
}

