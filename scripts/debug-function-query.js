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

async function debugFunction() {
  try {
    await client.connect();
    console.log('Connected to database\n');

    const orderId = 1; // Test with order 1

    // Step by step query to see what's happening
    console.log('=== Step 1: Services in order ===');
    const services = await client.query(`
      SELECT DISTINCT s.id, s.name, s.duration_unit
      FROM services s
      WHERE s.duration_unit != 'none'
      AND (
          EXISTS (
              SELECT 1 FROM order_items oi
              WHERE oi.order_id = $1
              AND (
                  (oi.item_type = 'service_package' AND EXISTS (
                      SELECT 1 FROM service_packages sp 
                      WHERE sp.id = oi.item_id AND sp.service_id = s.id
                  ))
                  OR (oi.item_type = 'service' AND oi.item_id = s.id)
              )
          )
          OR EXISTS (
              SELECT 1 FROM scheduled_appointments sa
              WHERE sa.order_id = $1
              AND sa.service_id = s.id
          )
      )
    `, [orderId]);
    
    services.rows.forEach(s => {
      console.log(`  Service ${s.id}: ${s.name} (${s.duration_unit})`);
    });

    console.log('\n=== Step 2: Order items joined with services ===');
    const orderItems = await client.query(`
      SELECT 
        s.id as service_id,
        s.name as service_name,
        oi.id as order_item_id,
        oi.item_type,
        oi.quantity,
        sp.duration_hours,
        sp.duration_days,
        sp.duration_months
      FROM (
          SELECT DISTINCT s.id, s.name, s.duration_unit
          FROM services s
          WHERE s.duration_unit != 'none'
          AND (
              EXISTS (
                  SELECT 1 FROM order_items oi
                  WHERE oi.order_id = $1
                  AND (
                      (oi.item_type = 'service_package' AND EXISTS (
                          SELECT 1 FROM service_packages sp 
                          WHERE sp.id = oi.item_id AND sp.service_id = s.id
                      ))
                      OR (oi.item_type = 'service' AND oi.item_id = s.id)
                  )
              )
              OR EXISTS (
                  SELECT 1 FROM scheduled_appointments sa
                  WHERE sa.order_id = $1
                  AND sa.service_id = s.id
              )
          )
      ) s
      LEFT JOIN order_items oi ON oi.order_id = $1
          AND (
              (oi.item_type = 'service_package' AND EXISTS (
                  SELECT 1 FROM service_packages sp2 
                  WHERE sp2.id = oi.item_id AND sp2.service_id = s.id
              ))
              OR (oi.item_type = 'service' AND oi.item_id = s.id)
          )
      LEFT JOIN service_packages sp ON oi.item_type = 'service_package' AND sp.id = oi.item_id AND sp.service_id = s.id
      ORDER BY s.id, oi.id
    `, [orderId]);
    
    console.log(`Found ${orderItems.rows.length} rows`);
    orderItems.rows.forEach(row => {
      console.log(`  Service ${row.service_id} (${row.service_name}): Order Item ${row.order_item_id}, Type: ${row.item_type}, Qty: ${row.quantity}, Duration: ${row.duration_hours || row.duration_days || row.duration_months || 'N/A'}`);
    });

    console.log('\n=== Step 3: With appointments join ===');
    const withAppointments = await client.query(`
      SELECT 
        s.id as service_id,
        s.name as service_name,
        oi.id as order_item_id,
        oi.quantity,
        sp.duration_hours,
        sa.id as appointment_id,
        sa.duration_hours as appointment_duration
      FROM (
          SELECT DISTINCT s.id, s.name, s.duration_unit
          FROM services s
          WHERE s.duration_unit != 'none'
          AND (
              EXISTS (
                  SELECT 1 FROM order_items oi
                  WHERE oi.order_id = $1
                  AND (
                      (oi.item_type = 'service_package' AND EXISTS (
                          SELECT 1 FROM service_packages sp 
                          WHERE sp.id = oi.item_id AND sp.service_id = s.id
                      ))
                      OR (oi.item_type = 'service' AND oi.item_id = s.id)
                  )
              )
              OR EXISTS (
                  SELECT 1 FROM scheduled_appointments sa
                  WHERE sa.order_id = $1
                  AND sa.service_id = s.id
              )
          )
      ) s
      LEFT JOIN order_items oi ON oi.order_id = $1
          AND (
              (oi.item_type = 'service_package' AND EXISTS (
                  SELECT 1 FROM service_packages sp2 
                  WHERE sp2.id = oi.item_id AND sp2.service_id = s.id
              ))
              OR (oi.item_type = 'service' AND oi.item_id = s.id)
          )
      LEFT JOIN service_packages sp ON oi.item_type = 'service_package' AND sp.id = oi.item_id AND sp.service_id = s.id
      LEFT JOIN scheduled_appointments sa ON sa.order_id = $1 
          AND sa.service_id = s.id
      ORDER BY s.id, oi.id, sa.id
    `, [orderId]);
    
    console.log(`Found ${withAppointments.rows.length} rows`);
    const grouped = {};
    withAppointments.rows.forEach(row => {
      const key = `${row.service_id}-${row.order_item_id}`;
      if (!grouped[key]) {
        grouped[key] = { service: row.service_name, order_item: row.order_item_id, quantity: row.quantity, duration: row.duration_hours, appointments: [] };
      }
      if (row.appointment_id) {
        grouped[key].appointments.push({ id: row.appointment_id, duration: row.appointment_duration });
      }
    });
    
    Object.values(grouped).forEach(group => {
      console.log(`  Service: ${group.service}, Order Item: ${group.order_item_id}, Qty: ${group.quantity}, Duration: ${group.duration}`);
      console.log(`    Appointments: ${group.appointments.length}`);
      if (group.appointments.length > 0) {
        console.log(`    ⚠️  This order item appears ${group.appointments.length} times in the join!`);
        group.appointments.forEach(apt => {
          console.log(`      Appointment ${apt.id}: ${apt.duration} hours`);
        });
      }
    });

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

debugFunction();

