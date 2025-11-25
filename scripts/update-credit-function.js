import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

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
        const cleanValue = value.replace(/^["']|["']$/g, '');
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = cleanValue;
        }
      }
    }
  });
}

const connectionString = process.env.VITE_NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: Database connection string not found.');
  process.exit(1);
}

const client = new Client({ connectionString });

async function updateFunction() {
  try {
    await client.connect();
    console.log('Connected to database\n');

    // Read the updated function from schema.sql
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schemaContent = readFileSync(schemaPath, 'utf8');
    
    // Extract the function definition
    const functionMatch = schemaContent.match(/CREATE OR REPLACE FUNCTION get_order_all_service_credits\(order_id_param INTEGER\)[\s\S]*?\$\$ LANGUAGE plpgsql;/);
    
    if (!functionMatch) {
      console.error('Could not find function definition in schema.sql');
      process.exit(1);
    }

    const functionSQL = functionMatch[0];
    console.log('Updating function...\n');
    
    await client.query(functionSQL);
    console.log('✅ Function updated successfully!\n');

    // Test the function
    console.log('Testing function with order ID 1...');
    const testResult = await client.query('SELECT * FROM get_order_all_service_credits(1)');
    testResult.rows.forEach(row => {
      console.log(`Service: ${row.service_name}`);
      console.log(`  Credits from items: ${row.credits_from_items}`);
      console.log(`  Credits used: ${row.credits_used_by_appointments}`);
      console.log(`  Balance: ${row.balance}`);
    });

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

updateFunction();

