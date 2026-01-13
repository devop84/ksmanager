import crypto from 'crypto'

/**
 * Hash a password using Node.js crypto (for server-side use)
 * Compatible with the client-side password hashing format
 */
export async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    try {
      // Generate a random salt (16 bytes)
      const salt = crypto.randomBytes(16)
      
      // Hash the password with PBKDF2
      crypto.pbkdf2(password, salt, 100000, 64, 'sha256', (err, derivedKey) => {
        if (err) {
          reject(err)
          return
        }
        
        // Combine salt and hash
        const combined = Buffer.concat([salt, derivedKey])
        
        // Convert to base64 for storage (compatible with client-side format)
        resolve(combined.toString('base64'))
      })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Verify a password against a hash
 * Compatible with the client-side password hashing format
 */
export async function verifyPassword(password, hash) {
  return new Promise((resolve) => {
    try {
      // Decode the hash from base64
      const combined = Buffer.from(hash, 'base64')
      
      // Extract salt (first 16 bytes)
      const salt = combined.slice(0, 16)
      
      // Extract stored hash (remaining bytes)
      const storedHash = combined.slice(16)
      
      // Hash the password with the same salt
      crypto.pbkdf2(password, salt, 100000, 64, 'sha256', (err, derivedKey) => {
        if (err) {
          resolve(false)
          return
        }
        
        // Compare hashes (constant-time comparison)
        try {
          resolve(crypto.timingSafeEqual(storedHash, derivedKey))
        } catch (compareError) {
          resolve(false)
        }
      })
    } catch (error) {
      resolve(false)
    }
  })
}
