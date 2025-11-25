# Database Export Script

## Export Seed Data

This script exports all data from your database into a `seed.sql` file.

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Set your database connection string:

**Option A: Create a `.env` file in the project root** (recommended):
```bash
# Create .env file in the project root
VITE_NEON_DATABASE_URL=your_connection_string_here
```

**Option B: Set environment variable in PowerShell**:
```powershell
$env:VITE_NEON_DATABASE_URL="your_connection_string_here"
# OR
$env:DATABASE_URL="your_connection_string_here"
```

**Option C: Set environment variable in Bash/Linux/Mac**:
```bash
export VITE_NEON_DATABASE_URL="your_connection_string_here"
# OR
export DATABASE_URL="your_connection_string_here"
```

**Note**: The script will automatically read from `.env` file if it exists in the project root.

### Usage

Run the export script:
```bash
npm run extract-seed
```

This will:
1. Connect to your database
2. Export all data from all tables in the correct order (respecting foreign keys)
3. Create a `database/seed.sql` file with INSERT statements

### Output

The script generates `database/seed.sql` with:
- All data from all tables
- INSERT statements in the correct order
- Proper SQL escaping for strings, dates, and NULL values
- Transaction wrapping (BEGIN/COMMIT)

### Notes

- The script exports data in dependency order to respect foreign key constraints
- Empty tables are included with comments
- The generated file can be run directly on a fresh database (after running schema.sql)
- Make sure to run `schema.sql` first before importing the seed data

---

## Load Seed Data

This script loads seed data from `database/seed.sql` into your database.

### Prerequisites

Same as export script - ensure your database connection string is set (see above).

### Usage

**Option 1: Using npm script** (recommended):
```bash
npm run load-seed
```

**Option 2: Run SQL file directly**:
```bash
# Using psql or your database client
psql your_connection_string < database/seed.sql
```

The script will:
1. Connect to your database
2. Execute all INSERT statements from `database/seed.sql`
3. Load all seed data into the database

### Before Loading Seed Data

**Important**: Make sure you've run `database/schema.sql` first to create all tables!

If you have existing data and want to start fresh:
```bash
npm run reset-db    # Clear all data
npm run load-seed   # Load seed data
```

### Notes

- The seed file contains INSERT statements in the correct order (respecting foreign keys)
- If you get duplicate key errors, some data may already exist - consider resetting first
- The script will show helpful error messages if something goes wrong

---

## Reset Database

This script will **DELETE ALL DATA** from your database and reset all ID sequences to 1.

### ⚠️ WARNING

**This action is irreversible!** All data will be permanently deleted.

### Prerequisites

Same as export script - ensure your database connection string is set (see above).

### Usage

**Option 1: Using npm script** (recommended):
```bash
npm run reset-db
```

**Option 2: Run SQL file directly**:
```bash
# Using psql or your database client
psql your_connection_string < database/reset.sql
```

The script will:
1. Wait 3 seconds (giving you time to cancel with Ctrl+C)
2. Truncate all tables in the correct order
3. Reset all sequences to start from 1
4. Complete the transaction

### After Reset

After resetting, you can repopulate the database:
1. Run `database/schema.sql` to recreate tables (if needed)
2. Run `database/seed.sql` to load seed data

### What Gets Reset

- All tables are truncated (all data deleted)
- All sequences reset to 1:
  - `users_id_seq`
  - `customers_id_seq`
  - `orders_id_seq`
  - `order_items_id_seq`
  - And all other table sequences
- Order number sequence reset (if exists)

### Notes

- The reset script uses `TRUNCATE CASCADE` to handle foreign key constraints
- All sequences are reset to start from 1 (not 0, as PostgreSQL sequences start at 1)
- The script runs in a transaction, so if anything fails, it will rollback

