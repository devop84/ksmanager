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
async function loadSeedData() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected!\n');
    
    // Read the seed SQL file
    const seedSqlPath = path.join(__dirname, '..', 'database', 'seed.sql');
    
    if (!fs.existsSync(seedSqlPath)) {
      console.error(`Error: Seed file not found at ${seedSqlPath}`);
      process.exit(1);
    }
    
    const seedSql = fs.readFileSync(seedSqlPath, 'utf8');
    
    console.log('Loading seed data...');
    console.log('This may take a moment depending on the amount of data...\n');
    
    // Execute the seed SQL
    await client.query(seedSql);
    
    // Update sequences to match the max IDs in tables (to avoid conflicts on future inserts)
    console.log('Updating sequences...');
    const updateSequences = `
      SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1), true);
      SELECT setval('sessions_id_seq', COALESCE((SELECT MAX(id) FROM sessions), 1), true);
      SELECT setval('customers_id_seq', COALESCE((SELECT MAX(id) FROM customers), 1), true);
      SELECT setval('hotels_id_seq', COALESCE((SELECT MAX(id) FROM hotels), 1), true);
      SELECT setval('agencies_id_seq', COALESCE((SELECT MAX(id) FROM agencies), 1), true);
      SELECT setval('third_parties_categories_id_seq', COALESCE((SELECT MAX(id) FROM third_parties_categories), 1), true);
      SELECT setval('third_parties_id_seq', COALESCE((SELECT MAX(id) FROM third_parties), 1), true);
      SELECT setval('payment_methods_id_seq', COALESCE((SELECT MAX(id) FROM payment_methods), 1), true);
      SELECT setval('transaction_types_id_seq', COALESCE((SELECT MAX(id) FROM transaction_types), 1), true);
      SELECT setval('transactions_id_seq', COALESCE((SELECT MAX(id) FROM transactions), 1), true);
      SELECT setval('company_accounts_id_seq', COALESCE((SELECT MAX(id) FROM company_accounts), 1), true);
      SELECT setval('instructors_id_seq', COALESCE((SELECT MAX(id) FROM instructors), 1), true);
      SELECT setval('staff_id_seq', COALESCE((SELECT MAX(id) FROM staff), 1), true);
      SELECT setval('feedback_id_seq', COALESCE((SELECT MAX(id) FROM feedback), 1), true);
      SELECT setval('service_categories_id_seq', COALESCE((SELECT MAX(id) FROM service_categories), 1), true);
      SELECT setval('services_id_seq', COALESCE((SELECT MAX(id) FROM services), 1), true);
      SELECT setval('service_packages_id_seq', COALESCE((SELECT MAX(id) FROM service_packages), 1), true);
      SELECT setval('product_categories_id_seq', COALESCE((SELECT MAX(id) FROM product_categories), 1), true);
      SELECT setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products), 1), true);
      SELECT setval('orders_id_seq', COALESCE((SELECT MAX(id) FROM orders), 1), true);
      SELECT setval('order_items_id_seq', COALESCE((SELECT MAX(id) FROM order_items), 1), true);
      SELECT setval('order_payments_id_seq', COALESCE((SELECT MAX(id) FROM order_payments), 1), true);
      SELECT setval('order_refunds_id_seq', COALESCE((SELECT MAX(id) FROM order_refunds), 1), true);
      SELECT setval('customer_service_credits_id_seq', COALESCE((SELECT MAX(id) FROM customer_service_credits), 1), true);
      SELECT setval('scheduled_appointments_id_seq', COALESCE((SELECT MAX(id) FROM scheduled_appointments), 1), true);
    `;
    await client.query(updateSequences);
    
    console.log('\n✅ Seed data loaded successfully!');
    console.log('Your database has been populated with seed data.');
    console.log('All sequences have been updated to match the loaded data.');
    
  } catch (error) {
    console.error('\n❌ Error loading seed data:', error.message);
    if (error.code === '23505') {
      console.error('Duplicate key error: Some data may already exist in the database.');
      console.error('Consider running "npm run reset-db" first to clear existing data.');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the load
loadSeedData().catch(async (error) => {
  console.error('Fatal error:', error);
  try {
    await client.end();
  } catch (e) {
    // Ignore errors when closing
  }
  process.exit(1);
});

