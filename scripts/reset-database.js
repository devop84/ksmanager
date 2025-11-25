import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load .env file if it exists
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, '');
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = cleanValue;
        }
      }
    }
  });
}

// Get connection string from environment variable
const connectionString = process.env.VITE_NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: Database connection string not found.');
  console.error('Please set VITE_NEON_DATABASE_URL or DATABASE_URL environment variable.');
  process.exit(1);
}

// Create PostgreSQL client
const client = new Client({ connectionString });

// Main function
async function resetDatabase() {
  console.log('⚠️  WARNING: This will DELETE ALL DATA from the database!');
  console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
  
  // Wait 3 seconds
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected!\n');
    
    // Read the reset SQL file
    const resetSqlPath = path.join(__dirname, '..', 'database', 'reset.sql');
    const resetSql = fs.readFileSync(resetSqlPath, 'utf8');
    
    console.log('Executing reset script...');
    await client.query(resetSql);
    
    console.log('\n✅ Database reset complete!');
    console.log('All tables have been truncated and sequences reset to 1.');
    console.log('You can now run schema.sql and seed.sql to repopulate the database.');
    
  } catch (error) {
    console.error('\n❌ Error resetting database:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the reset
resetDatabase().catch(async (error) => {
  console.error('Fatal error:', error);
  try {
    await client.end();
  } catch (e) {
    // Ignore errors when closing
  }
  process.exit(1);
});

