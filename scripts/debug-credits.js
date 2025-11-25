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

async function debugCredits() {
  try {
    await client.connect();
    console.log('Connected to database\n');

    // Check for duplicate credits by order_item_id
    console.log('=== Checking for duplicate credits ===');
    const duplicates = await client.query(`
      SELECT 
        order_item_id,
        COUNT(*) as credit_count,
        STRING_AGG(id::text, ', ') as credit_ids,
        STRING_AGG(total_hours::text, ', ') as total_hours_values,
        STRING_AGG(total_days::text, ', ') as total_days_values,
        STRING_AGG(total_months::text, ', ') as total_months_values
      FROM customer_service_credits
      WHERE order_item_id IS NOT NULL
      GROUP BY order_item_id
      HAVING COUNT(*) > 1
      ORDER BY order_item_id
    `);
    
    if (duplicates.rows.length > 0) {
      console.log(`Found ${duplicates.rows.length} order items with duplicate credits:\n`);
      duplicates.rows.forEach(row => {
        console.log(`  Order Item ID: ${row.order_item_id}`);
        console.log(`    Credit Count: ${row.credit_count}`);
        console.log(`    Credit IDs: ${row.credit_ids}`);
        console.log(`    Total Hours: ${row.total_hours_values}`);
        console.log(`    Total Days: ${row.total_days_values}`);
        console.log(`    Total Months: ${row.total_months_values}`);
        console.log('');
      });
    } else {
      console.log('No duplicate credits found by order_item_id\n');
    }

    // Check recent order items with their credits
    console.log('=== Recent order items with credits ===');
    const recentItems = await client.query(`
      SELECT 
        oi.id as order_item_id,
        oi.item_type,
        oi.item_name,
        oi.quantity,
        oi.order_id,
        sp.duration_hours as package_duration_hours,
        sp.duration_days as package_duration_days,
        sp.duration_months as package_duration_months,
        s.duration_unit,
        COUNT(csc.id) as credit_count,
        SUM(csc.total_hours) as sum_total_hours,
        SUM(csc.total_days) as sum_total_days,
        SUM(csc.total_months) as sum_total_months,
        STRING_AGG(csc.id::text, ', ') as credit_ids
      FROM order_items oi
      LEFT JOIN service_packages sp ON oi.item_type = 'service_package' AND oi.item_id = sp.id
      LEFT JOIN services s ON (oi.item_type = 'service_package' AND sp.service_id = s.id) OR (oi.item_type = 'service' AND oi.item_id = s.id)
      LEFT JOIN customer_service_credits csc ON oi.id = csc.order_item_id
      WHERE oi.item_type IN ('service_package', 'service')
      GROUP BY oi.id, oi.item_type, oi.item_name, oi.quantity, oi.order_id, 
               sp.duration_hours, sp.duration_days, sp.duration_months, s.duration_unit
      ORDER BY oi.id DESC
      LIMIT 10
    `);
    
    if (recentItems.rows.length > 0) {
      recentItems.rows.forEach(row => {
        console.log(`Order Item ID: ${row.order_item_id}`);
        console.log(`  Type: ${row.item_type}`);
        console.log(`  Name: ${row.item_name}`);
        console.log(`  Quantity: ${row.quantity}`);
        console.log(`  Package Duration (hours): ${row.package_duration_hours || 'N/A'}`);
        console.log(`  Service Duration Unit: ${row.duration_unit || 'N/A'}`);
        console.log(`  Credit Count: ${row.credit_count}`);
        console.log(`  Sum Total Hours: ${row.sum_total_hours || 0}`);
        console.log(`  Sum Total Days: ${row.sum_total_days || 0}`);
        console.log(`  Sum Total Months: ${row.sum_total_months || 0}`);
        console.log(`  Credit IDs: ${row.credit_ids || 'None'}`);
        
        // Calculate expected vs actual
        if (row.item_type === 'service_package' && row.package_duration_hours) {
          const expected = row.package_duration_hours * row.quantity;
          const actual = parseFloat(row.sum_total_hours || 0);
          console.log(`  Expected Hours: ${expected}`);
          console.log(`  Actual Hours: ${actual}`);
          if (actual !== expected) {
            console.log(`  ⚠️  MISMATCH! Expected ${expected} but got ${actual}`);
          }
        }
        console.log('');
      });
    }

    // Check trigger definition
    console.log('=== Trigger Definition ===');
    const triggerInfo = await client.query(`
      SELECT 
        tgname as trigger_name,
        tgenabled as enabled,
        pg_get_triggerdef(oid) as definition
      FROM pg_trigger
      WHERE tgname = 'trigger_create_service_credits'
    `);
    
    if (triggerInfo.rows.length > 0) {
      console.log(triggerInfo.rows[0].definition);
    } else {
      console.log('Trigger not found!');
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

debugCredits();

