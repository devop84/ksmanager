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
const databaseUrl = process.env.VITE_NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Error: Database connection string not found. Please set VITE_NEON_DATABASE_URL or DATABASE_URL environment variable.');
  process.exit(1);
}

const client = new Client({ connectionString: databaseUrl });

async function fixDuplicateCredits() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Step 1: Remove duplicate credits, keeping only the first one for each order_item_id
    console.log('\nRemoving duplicate credits...');
    const deleteResult = await client.query(`
      DELETE FROM customer_service_credits csc1
      WHERE EXISTS (
          SELECT 1
          FROM customer_service_credits csc2
          WHERE csc2.order_item_id = csc1.order_item_id
            AND csc2.id < csc1.id
      )
    `);
    console.log(`  - Removed ${deleteResult.rowCount} duplicate credit(s)`);

    // Step 2: Update the trigger function to prevent future duplicates
    console.log('\nUpdating trigger function...');
    const triggerFunction = `
      CREATE OR REPLACE FUNCTION create_service_credits_from_order_item()
      RETURNS TRIGGER AS $$
      DECLARE
          pkg RECORD;
          svc RECORD;
          credit_total_hours NUMERIC(5,2);
          credit_total_days NUMERIC(5,2);
          credit_total_months INTEGER;
          i INTEGER;
          customer_id_val INTEGER;
          credit_id_val INTEGER;
      BEGIN
          -- Process service_package order items
          IF NEW.item_type = 'service_package' THEN
              -- Get customer_id from order
              SELECT customer_id INTO customer_id_val
              FROM orders
              WHERE id = NEW.order_id;
              
              -- Get service package details
              SELECT sp.*, s.duration_unit, s.id as service_id
              INTO pkg
              FROM service_packages sp
              JOIN services s ON sp.service_id = s.id
              WHERE sp.id = NEW.item_id
              LIMIT 1;
              
              IF FOUND THEN
                  -- Only create credit if duration_unit is not 'none'
                  IF pkg.duration_unit != 'none' THEN
                      -- Check if credit already exists for this order_item_id to prevent duplicates
                      SELECT id INTO credit_id_val
                      FROM customer_service_credits
                      WHERE order_item_id = NEW.id
                      LIMIT 1;
                      
                      -- Only create credit if it doesn't already exist
                      IF credit_id_val IS NULL THEN
                          -- Determine which duration field to use based on service duration_unit
                          -- Multiply by quantity to get total credit amount
                          IF pkg.duration_unit = 'hours' THEN
                              credit_total_hours := pkg.duration_hours * NEW.quantity;
                              credit_total_days := NULL;
                              credit_total_months := NULL;
                          ELSIF pkg.duration_unit = 'days' THEN
                              credit_total_hours := NULL;
                              credit_total_days := pkg.duration_days * NEW.quantity;
                              credit_total_months := NULL;
                          ELSIF pkg.duration_unit = 'months' THEN
                              credit_total_hours := NULL;
                              credit_total_days := NULL;
                              credit_total_months := pkg.duration_months * NEW.quantity;
                          END IF;
                          
                          -- Create a single credit with total amount (quantity * duration)
                          INSERT INTO customer_service_credits (
                              customer_id,
                              order_item_id,
                              service_package_id,
                              service_id,
                              total_hours,
                              total_days,
                              total_months,
                              status
                          )
                          VALUES (
                              customer_id_val,
                              NEW.id,
                              pkg.id,
                              pkg.service_id,
                              credit_total_hours,
                              credit_total_days,
                              credit_total_months,
                              'active'
                          )
                          RETURNING id INTO credit_id_val;
                      
                          -- Transfer orphaned appointments to this new credit
                          -- Find appointments for this customer+service that have no credit_id (orphaned)
                          UPDATE scheduled_appointments
                          SET credit_id = credit_id_val
                          WHERE customer_id = customer_id_val
                            AND service_id = pkg.service_id
                            AND credit_id IS NULL
                            AND status IN ('scheduled', 'completed')
                            AND cancelled_at IS NULL;
                      END IF;
                  END IF;
              END IF;
          END IF;
          
          -- Also process direct service order items (if service has duration_unit)
          IF NEW.item_type = 'service' THEN
              -- Get customer_id from order
              SELECT customer_id INTO customer_id_val
              FROM orders
              WHERE id = NEW.order_id;
              
              -- Get service details
              SELECT s.id as service_id, s.duration_unit
              INTO svc
              FROM services s
              WHERE s.id = NEW.item_id
              LIMIT 1;
              
              IF FOUND AND svc.duration_unit != 'none' THEN
                  -- Check if credit already exists for this order_item_id to prevent duplicates
                  SELECT id INTO credit_id_val
                  FROM customer_service_credits
                  WHERE order_item_id = NEW.id
                  LIMIT 1;
                  
                  -- Only create credit if it doesn't already exist
                  IF credit_id_val IS NULL THEN
                      -- Determine which duration field to use based on service duration_unit
                      -- For direct services, use 1 unit per quantity (multiply by quantity)
                      IF svc.duration_unit = 'hours' THEN
                          credit_total_hours := 1 * NEW.quantity;
                          credit_total_days := NULL;
                          credit_total_months := NULL;
                      ELSIF svc.duration_unit = 'days' THEN
                          credit_total_hours := NULL;
                          credit_total_days := 1 * NEW.quantity;
                          credit_total_months := NULL;
                      ELSIF svc.duration_unit = 'months' THEN
                          credit_total_hours := NULL;
                          credit_total_days := NULL;
                          credit_total_months := 1 * NEW.quantity;
                      END IF;
                      
                      -- Create a single credit with total amount (quantity * 1 unit)
                      INSERT INTO customer_service_credits (
                          customer_id,
                          order_item_id,
                          service_package_id,
                          service_id,
                          total_hours,
                          total_days,
                          total_months,
                          status
                      )
                      VALUES (
                          customer_id_val,
                          NEW.id,
                          NULL,  -- No package for direct service
                          svc.service_id,
                          credit_total_hours,
                          credit_total_days,
                          credit_total_months,
                          'active'
                      )
                      RETURNING id INTO credit_id_val;
                      
                      -- Transfer orphaned appointments to this new credit
                      UPDATE scheduled_appointments
                      SET credit_id = credit_id_val
                      WHERE customer_id = customer_id_val
                        AND service_id = svc.service_id
                        AND credit_id IS NULL
                        AND status IN ('scheduled', 'completed')
                        AND cancelled_at IS NULL;
                  END IF;
              END IF;
          END IF;
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    await client.query(triggerFunction);
    console.log('  - Trigger function updated successfully');

    console.log('\n✅ Fix completed successfully!');
    console.log('   - Duplicate credits have been removed');
    console.log('   - Trigger function has been updated to prevent future duplicates');

  } catch (error) {
    console.error('Error fixing duplicate credits:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixDuplicateCredits();

