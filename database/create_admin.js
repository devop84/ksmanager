/**
 * Helper script to create admin user with proper password hash
 * Run this with Node.js: node database/create_admin.js
 * 
 * Make sure VITE_NEON_DATABASE_URL is set in your .env file or environment variables
 */

import { neon } from '@neondatabase/serverless'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { config } from 'dotenv'
import { webcrypto } from 'crypto'

// Use Node.js crypto API
const crypto = webcrypto

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const envPath = join(__dirname, '..', '.env')
config({ path: envPath })

// Get database URL from environment
const connectionString = process.env.VITE_NEON_DATABASE_URL || process.env.DATABASE_URL

if (!connectionString) {
  console.error('Error: Database connection string not found!')
  console.error('Please set VITE_NEON_DATABASE_URL in your .env file')
  process.exit(1)
}

const sql = neon(connectionString)

/**
 * Hash a password using Web Crypto API (same as the application)
 */
async function hashPassword(password) {
  // Convert password to ArrayBuffer
  const encoder = new TextEncoder()
  const data = encoder.encode(password)

  // Generate a salt
  const salt = crypto.getRandomValues(new Uint8Array(16))

  // Import key for PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    data,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  // Derive key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt']
  )

  // Export the key and combine with salt
  const exportedKey = await crypto.subtle.exportKey('raw', key)
  const keyArray = new Uint8Array(exportedKey)
  
  // Combine salt and key for storage
  const combined = new Uint8Array(salt.length + keyArray.length)
  combined.set(salt, 0)
  combined.set(keyArray, salt.length)

  // Convert to base64 for storage
  return Buffer.from(combined).toString('base64')
}

async function createAdminUser() {
  try {
    const name = 'admin'
    const email = 'admin@ksmanager.com'
    const password = 'password'
    const role = 'admin'

    console.log('Creating admin user...')
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)

    // Hash the password using the application's hashing function
    const passwordHash = await hashPassword(password)

    // Insert or update the admin user
    const result = await sql`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (${name}, ${email}, ${passwordHash}, ${role})
      ON CONFLICT (email) DO UPDATE
      SET password_hash = ${passwordHash}, role = ${role}, name = ${name}
      RETURNING id, name, email, role
    `

    console.log('\n✓ Admin user created/updated successfully!')
    console.log(result[0])
    console.log(`\nLogin credentials:`)
    console.log(`  Email: ${email}`)
    console.log(`  Password: ${password}`)
  } catch (error) {
    console.error('\n✗ Error creating admin user:')
    console.error(error.message)
    if (error.code) {
      console.error(`Error code: ${error.code}`)
    }
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

createAdminUser()
