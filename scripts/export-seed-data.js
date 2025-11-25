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

// Define tables in dependency order (respecting foreign keys)
const tables = [
  // Base tables (no foreign keys or only to other base tables)
  'users',
  'hotels',
  'agencies',
  'third_parties_categories',
  'payment_methods',
  'transaction_types',
  'company_accounts',
  'instructors',
  'staff',
  'service_categories',
  'services',
  'service_packages',
  'product_categories',
  'products',
  
  // Dependent tables
  'customers',
  'third_parties',
  'transactions',
  'orders',
  'order_items',
  'order_payments',
  'order_refunds',
  'customer_service_credits',
  'scheduled_appointments',
  'feedback',
  'sessions',
];

// Function to escape SQL strings
function escapeSQLString(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }
  // Escape single quotes and backslashes
  return `'${String(value).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

// Function to get column names for a table
async function getTableColumns(tableName) {
  try {
    const result = await client.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_name = $1
       ORDER BY ordinal_position`,
      [tableName]
    );
    return result.rows;
  } catch (error) {
    console.error(`Error getting columns for ${tableName}:`, error);
    return [];
  }
}

// Function to export data from a table
async function exportTableData(tableName) {
  try {
    console.log(`Exporting data from ${tableName}...`);
    
    // Get column names first
    const columns = await getTableColumns(tableName);
    if (!columns || columns.length === 0) {
      return `-- Table: ${tableName}\n-- Table not found or has no columns\n\n`;
    }
    const columnNames = columns.map(col => col.column_name);
    
    // Get all data from table using pg client
    // For safety, we validate tableName is in our allowed list
    if (!tables.includes(tableName)) {
      throw new Error(`Table ${tableName} is not in the allowed list`);
    }
    
    // Construct the query - escape table name to prevent SQL injection
    // (though we control the table names, it's good practice)
    const escapedTableName = `"${tableName}"`;
    
    // Check if table has an 'id' column for ordering
    const hasIdColumn = columnNames.includes('id');
    const orderBy = hasIdColumn ? 'ORDER BY id' : '';
    const query = `SELECT * FROM ${escapedTableName} ${orderBy}`;
    
    const result = await client.query(query);
    const data = result.rows;
    
    if (!data || data.length === 0) {
      return `-- Table: ${tableName}\n-- No data found\n\n`;
    }
    
    // Generate INSERT statements
    let output = `-- Table: ${tableName}\n`;
    output += `-- ${data.length} row(s)\n\n`;
    
    // Generate INSERT statements in batches for better readability
    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      output += `INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES\n`;
      
      const values = batch.map((row, idx) => {
        const rowValues = columnNames.map(col => {
          const value = row[col];
          return escapeSQLString(value);
        });
        const comma = idx < batch.length - 1 ? ',' : ';';
        return `  (${rowValues.join(', ')})${comma}`;
      });
      
      output += values.join('\n') + '\n\n';
    }
    
    return output;
  } catch (error) {
    console.error(`Error exporting ${tableName}:`, error);
    return `-- Table: ${tableName}\n-- Error: ${error.message}\n\n`;
  }
}

// Main function
async function exportAllData() {
  console.log('Connecting to database...');
  await client.connect();
  console.log('Connected!\n');
  
  console.log('Starting database export...\n');
  
  let seedContent = `-- ============================================
-- SEED DATA
-- ============================================
-- This file contains all data from the database
-- Generated on: ${new Date().toISOString()}
-- 
-- IMPORTANT: Run this file AFTER running schema.sql
-- ============================================

-- Disable foreign key checks temporarily (if needed)
-- Note: PostgreSQL doesn't support disabling foreign keys,
-- so ensure data is inserted in the correct order

BEGIN;

`;

  // Export each table
  for (const table of tables) {
    try {
      const tableData = await exportTableData(table);
      seedContent += tableData;
    } catch (error) {
      console.error(`Failed to export ${table}:`, error);
      seedContent += `-- Table: ${table}\n-- Failed to export: ${error.message}\n\n`;
    }
  }
  
  seedContent += `COMMIT;

-- ============================================
-- END OF SEED DATA
-- ============================================
`;

  // Write to file
  const outputPath = path.join(__dirname, '..', 'database', 'seed.sql');
  fs.writeFileSync(outputPath, seedContent, 'utf8');
  
  // Close database connection
  await client.end();
  
  console.log(`\n✅ Export complete!`);
  console.log(`Seed file created at: ${outputPath}`);
  console.log(`Total tables exported: ${tables.length}`);
}

// Run the export
exportAllData().catch(async (error) => {
  console.error('Fatal error:', error);
  try {
    await client.end();
  } catch (e) {
    // Ignore errors when closing
  }
  process.exit(1);
});

