import { neon } from '@neondatabase/serverless';

// Get the connection string from environment variables
// Vite only exposes variables with VITE_ prefix to the client
// For Vercel + Neon integration: Set VITE_NEON_DATABASE_URL in Vercel dashboard
// For local development: Set VITE_NEON_DATABASE_URL in .env file
const connectionString = import.meta.env.VITE_NEON_DATABASE_URL;

if (!connectionString) {
  console.warn('VITE_NEON_DATABASE_URL is not set. Please add it to your .env file for local development, or configure it in Vercel dashboard for production.');
}

// Create the Neon SQL client
const sql = neon(connectionString);

export default sql;

