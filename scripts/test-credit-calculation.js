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

async function testCreditCalculation() {
  try {
    await client.connect();
    console.log('Connected to database\n');

    // Get a recent order with a service package
    const orderResult = await client.query(`
      SELECT o.id, o.order_number, oi.id as order_item_id, oi.item_type, oi.item_name, oi.quantity,
             sp.duration_hours, sp.duration_days, sp.duration_months, s.duration_unit
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN service_packages sp ON oi.item_type = 'service_package' AND oi.item_id = sp.id
      LEFT JOIN services s ON (oi.item_type = 'service_package' AND sp.service_id = s.id) OR (oi.item_type = 'service' AND oi.item_id = s.id)
      WHERE oi.item_type = 'service_package'
      ORDER BY oi.id DESC
      LIMIT 1
    `);

    if (orderResult.rows.length === 0) {
      console.log('No service package orders found');
      await client.end();
      return;
    }

    const order = orderResult.rows[0];
    console.log(`Testing with Order ID: ${order.id}, Order Item ID: ${order.order_item_id}`);
    console.log(`  Package: ${order.item_name}`);
    console.log(`  Quantity: ${order.quantity}`);
    console.log(`  Package Duration Hours: ${order.duration_hours}`);
    console.log(`  Service Duration Unit: ${order.duration_unit}\n`);

    // Test the function
    console.log('=== Function Result ===');
    const functionResult = await client.query(`
      SELECT * FROM get_order_all_service_credits(${order.id})
    `);
    
    functionResult.rows.forEach(row => {
      console.log(`Service: ${row.service_name}`);
      console.log(`  Credits from items: ${row.credits_from_items}`);
      console.log(`  Credits used: ${row.credits_used_by_appointments}`);
      console.log(`  Balance: ${row.balance}`);
      console.log('');
    });

    // Manual calculation
    console.log('=== Manual Calculation ===');
    const expected = parseFloat(order.duration_hours || 0) * parseInt(order.quantity || 1);
    console.log(`Expected: ${order.duration_hours} * ${order.quantity} = ${expected}`);
    
    if (functionResult.rows.length > 0) {
      const actual = parseFloat(functionResult.rows[0].credits_from_items || 0);
      console.log(`Actual from function: ${actual}`);
      if (Math.abs(actual - expected) > 0.01) {
        console.log(`⚠️  MISMATCH! Expected ${expected} but got ${actual}`);
      } else {
        console.log('✅ Match!');
      }
    }

    // Check the raw query that the function uses
    console.log('\n=== Raw Query Test ===');
    const rawQuery = await client.query(`
      SELECT DISTINCT
        s.id as service_id,
        s.name as service_name,
        s.duration_unit,
        oi.id as order_item_id,
        oi.quantity,
        sp.duration_hours,
        CASE 
          WHEN oi.item_type = 'service_package' THEN sp.duration_hours * oi.quantity
          WHEN oi.item_type = 'service' THEN 1 * oi.quantity
          ELSE 0
        END as calculated_credit
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN service_packages sp ON oi.item_type = 'service_package' AND oi.item_id = sp.id
      LEFT JOIN services s ON (oi.item_type = 'service_package' AND sp.service_id = s.id) OR (oi.item_type = 'service' AND oi.item_id = s.id)
      WHERE o.id = ${order.id}
        AND oi.item_type IN ('service_package', 'service')
    `);

    console.log('Raw query results:');
    rawQuery.rows.forEach(row => {
      console.log(`  Order Item ${row.order_item_id}: ${row.calculated_credit} ${row.duration_unit} (${row.quantity} x ${row.duration_hours || 1})`);
    });

    // Check if there are multiple rows per order_item (which would cause double counting)
    const countQuery = await client.query(`
      SELECT 
        oi.id as order_item_id,
        COUNT(*) as row_count
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN service_packages sp ON oi.item_type = 'service_package' AND oi.item_id = sp.id
      LEFT JOIN services s ON (oi.item_type = 'service_package' AND sp.service_id = s.id) OR (oi.item_type = 'service' AND oi.item_id = s.id)
      WHERE o.id = ${order.id}
        AND oi.item_type IN ('service_package', 'service')
      GROUP BY oi.id
      HAVING COUNT(*) > 1
    `);

    if (countQuery.rows.length > 0) {
      console.log('\n⚠️  WARNING: Found order items that appear multiple times in the join!');
      countQuery.rows.forEach(row => {
        console.log(`  Order Item ${row.order_item_id}: ${row.row_count} rows`);
      });
    } else {
      console.log('\n✅ No duplicate rows in join');
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testCreditCalculation();

