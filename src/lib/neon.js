/**
 * ⚠️ SECURITY WARNING: This file exposes database credentials to the client!
 * 
 * This file has been replaced with a secure API-based approach.
 * All database operations now go through secure serverless functions.
 * 
 * To migrate:
 * 1. Replace: import sql from './lib/neon.js'
 * 2. With: import sql from './lib/secureDb.js'
 * 
 * The secureDb.js maintains the same API, so your existing code will work.
 */

// Redirect to secure database wrapper
import secureSql from './secureDb.js';

// Show warning in development
if (import.meta.env.DEV) {
  console.warn(
    '⚠️ SECURITY: You are using the insecure neon.js file. ' +
    'Please migrate to secureDb.js to keep database credentials secure. ' +
    'See README_SECURITY.md for migration instructions.'
  );
}

export default secureSql;

