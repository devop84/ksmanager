import crypto from 'crypto'

/**
 * Hash a password using PBKDF2.
 *
 * We derive a 32-byte key to stay compatible with the legacy client-side
 * hashing (16-byte salt + 32-byte hash stored as base64). This also works for
 * any hashes already stored in the database with that format.
 */
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16)
  const iterations = 100000
  const keylen = 32 // matches legacy client-side length
  const digest = 'sha256'

  const derivedKey = await new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, keylen, digest, (err, dk) => {
      if (err) return reject(err)
      resolve(dk)
    })
  })

  // Store as base64: salt (16 bytes) + hash
  return Buffer.concat([salt, derivedKey]).toString('base64')
}

/**
 * Verify a password against a stored base64 hash.
 *
 * Supports both legacy (16-byte salt + 32-byte hash) and any future hashes
 * that match the stored hash length.
 */
export async function verifyPassword(password, hash) {
  try {
    const combined = Buffer.from(hash, 'base64')
    const salt = combined.slice(0, 16)
    const storedHash = combined.slice(16)

    // Derive using the same length as the stored hash to maintain compatibility
    const iterations = 100000
    const keylen = storedHash.length
    const digest = 'sha256'

    const derivedKey = await new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, iterations, keylen, digest, (err, dk) => {
        if (err) return reject(err)
        resolve(dk)
      })
    })

    if (derivedKey.length !== storedHash.length) {
      return false
    }

    return crypto.timingSafeEqual(storedHash, derivedKey)
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}
