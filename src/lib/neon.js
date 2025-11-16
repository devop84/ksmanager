import { neon } from '@neondatabase/serverless';

// Get the connection string from environment variables
const connectionString = import.meta.env.VITE_NEON_DATABASE_URL;

if (!connectionString) {
  console.warn('VITE_NEON_DATABASE_URL is not set. Please add it to your .env file.');
}

// Create the Neon SQL client
const sql = neon(connectionString);

export default sql;

