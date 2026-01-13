/**
 * Database connection wrapper
 * 
 * This file redirects to secureDb.js which uses API-based database access.
 * All database operations go through secure serverless functions.
 * 
 * You can import from this file or secureDb.js directly - both work the same way.
 */

// Redirect to secure database wrapper
import secureSql from './secureDb.js';

export default secureSql;

