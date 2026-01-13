# Security Migration Guide

## ⚠️ Important: Database Credentials Security Fix

This application has been updated to secure database credentials by moving all database access to server-side API endpoints.

## What Changed

### Before (Insecure)
- ❌ Database connection string exposed in client-side JavaScript (`VITE_NEON_DATABASE_URL`)
- ❌ Direct SQL queries from browser
- ❌ Anyone could inspect code and see database credentials

### After (Secure)
- ✅ Database credentials stored only on server (Vercel environment variables)
- ✅ All database operations go through secure API endpoints
- ✅ Client only has session tokens, never database credentials

## Migration Steps

### 1. Update Vercel Environment Variables

**Remove:**
- `VITE_NEON_DATABASE_URL` (no longer needed, was exposing credentials)

**Ensure:**
- `DATABASE_URL` is set (created automatically by Neon integration)

### 2. Deploy API Functions

The `/api` folder contains serverless functions that will be automatically deployed with Vercel. No additional configuration needed.

### 3. Code Changes (Already Done)

The following files have been updated:
- ✅ `src/lib/neon.js` - Now redirects to secure wrapper
- ✅ `src/lib/secureDb.js` - New secure database wrapper
- ✅ `src/lib/api.js` - API client for making authenticated requests
- ✅ `src/pages/Login.jsx` - Uses API for authentication
- ✅ `src/pages/Signup.jsx` - Uses API for registration
- ✅ `src/App.jsx` - Uses API for session management
- ✅ `src/context/SettingsContext.jsx` - Uses API for settings

### 4. Automatic Migration

**Good News:** Most of your existing code will continue to work!

The `src/lib/neon.js` file now automatically redirects to `src/lib/secureDb.js`, which maintains the same API. This means:

- ✅ Existing `import sql from './lib/neon'` statements continue to work
- ✅ Existing `sql`...`` template literal syntax continues to work
- ✅ All queries are automatically routed through secure API

### 5. Testing

After deployment, test:
- [ ] User login
- [ ] User signup
- [ ] Session persistence
- [ ] Settings (language, currency, timezone)
- [ ] All CRUD operations
- [ ] Database queries from components

## API Endpoints Created

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration  
- `GET /api/auth/session` - Get current session
- `DELETE /api/auth/session` - Logout

### Database
- `POST /api/db/query` - Execute parameterized SQL queries (authenticated)

### Settings
- `GET /api/settings/app-settings?key=...` - Get global setting
- `POST /api/settings/app-settings` - Set global setting

### User Settings
- `PUT /api/users/language` - Update user language preference

## Security Features

1. **Session-Based Authentication:** All API requests require valid session tokens
2. **Parameterized Queries:** Prevents SQL injection attacks
3. **Server-Side Only Credentials:** Database connection string never exposed to client
4. **Automatic Migration:** Existing code works without changes

## Troubleshooting

### "Unauthorized" errors
- Check that session token is being sent in Authorization header
- Verify session hasn't expired
- Check that user is logged in

### Database query errors
- Ensure queries use parameterized format (`$1`, `$2`, etc.)
- Check that session is valid
- Verify query syntax is correct

### Settings not saving
- Check browser console for API errors
- Verify session token is valid
- Check network tab for failed requests

## Next Steps for Enhanced Security

1. **Add Row Level Security (RLS):** Implement PostgreSQL RLS policies
2. **Query Whitelisting:** Create specific endpoints for each operation type
3. **Rate Limiting:** Add rate limiting to API endpoints
4. **Input Validation:** Add comprehensive input validation
5. **Audit Logging:** Log all database operations

## Rollback (If Needed)

If you need to rollback:
1. Restore `VITE_NEON_DATABASE_URL` in Vercel
2. Revert `src/lib/neon.js` to original version
3. Remove API folder

However, **this is not recommended** as it re-exposes database credentials.
