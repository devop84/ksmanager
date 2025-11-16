/**
 * Hash a password using Web Crypto API
 * Note: In production, consider using a dedicated password hashing library
 * or implementing server-side hashing for better security
 */
export async function hashPassword(password) {
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
  return btoa(String.fromCharCode(...combined))
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password, hash) {
  try {
    // Decode the hash from base64
    const combined = Uint8Array.from(atob(hash), c => c.charCodeAt(0))
    
    // Extract salt (first 16 bytes)
    const salt = combined.slice(0, 16)
    
    // Extract stored key (remaining bytes)
    const storedKey = combined.slice(16)

    // Convert password to ArrayBuffer
    const encoder = new TextEncoder()
    const data = encoder.encode(password)

    // Import key for PBKDF2
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      data,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )

    // Derive key using same parameters
    const derivedKey = await crypto.subtle.deriveKey(
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

    // Export the derived key
    const exportedKey = await crypto.subtle.exportKey('raw', derivedKey)
    const derivedKeyArray = new Uint8Array(exportedKey)

    // Compare keys (constant-time comparison)
    if (derivedKeyArray.length !== storedKey.length) {
      return false
    }

    let isEqual = true
    for (let i = 0; i < derivedKeyArray.length; i++) {
      if (derivedKeyArray[i] !== storedKey[i]) {
        isEqual = false
      }
    }

    return isEqual
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}

