-- ============================================
-- AUTHENTICATION & USERS
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'viewonly',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- ============================================
-- CUSTOMERS & RELATED ENTITIES
-- ============================================

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    fullname VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    doctype VARCHAR(100),
    doc VARCHAR(150),
    country VARCHAR(100),
    birthdate DATE,
    note TEXT,
    hotel_id INTEGER,
    agency_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Hotels table
CREATE TABLE IF NOT EXISTS hotels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hotels_name ON hotels(name);
CREATE INDEX IF NOT EXISTS idx_hotels_phone ON hotels(phone);

-- Agencies table
CREATE TABLE IF NOT EXISTS agencies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    commission NUMERIC(5,2),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agencies_name ON agencies(name);
CREATE INDEX IF NOT EXISTS idx_agencies_email ON agencies(email);

-- Third party categories
CREATE TABLE IF NOT EXISTS third_parties_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT
);

-- Third parties table
CREATE TABLE IF NOT EXISTS third_parties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES third_parties_categories(id) ON DELETE SET NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_third_parties_name ON third_parties(name);
CREATE INDEX IF NOT EXISTS idx_third_parties_category ON third_parties(category_id);

-- ============================================
-- FINANCIAL SYSTEM (GENERAL LEDGER)
-- ============================================

-- Payment methods
CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transaction types
CREATE TABLE IF NOT EXISTS transaction_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    label VARCHAR(255) NOT NULL,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('income', 'expense', 'transfer')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transaction_types_direction ON transaction_types(direction);

-- Financial transactions ledger (for general company transactions)
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    amount NUMERIC(12,2) NOT NULL CHECK (amount <> 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    type_id INTEGER NOT NULL REFERENCES transaction_types(id) ON DELETE RESTRICT,
    payment_method_id INTEGER REFERENCES payment_methods(id) ON DELETE SET NULL,
    source_entity_type VARCHAR(100) NOT NULL,
    source_entity_id INTEGER,
    destination_entity_type VARCHAR(100) NOT NULL,
    destination_entity_id INTEGER,
    reference VARCHAR(255),
    note TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_occurred_at ON transactions(occurred_at);
CREATE INDEX IF NOT EXISTS idx_transactions_type_id ON transactions(type_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method_id ON transactions(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_transactions_source ON transactions(source_entity_type, source_entity_id);
CREATE INDEX IF NOT EXISTS idx_transactions_destination ON transactions(destination_entity_type, destination_entity_id);

-- Company accounts table
CREATE TABLE IF NOT EXISTS company_accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    details TEXT,
    note TEXT
);

CREATE INDEX IF NOT EXISTS idx_company_accounts_name ON company_accounts(name);

-- ============================================
-- INSTRUCTORS & STAFF
-- ============================================

-- Instructors table
CREATE TABLE IF NOT EXISTS instructors (
    id SERIAL PRIMARY KEY,
    fullname VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    bankdetail TEXT,
    hourlyrate NUMERIC(10,2),
    commission NUMERIC(5,2),
    monthlyfix NUMERIC(10,2),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_instructors_name ON instructors(fullname);
CREATE INDEX IF NOT EXISTS idx_instructors_email ON instructors(email);

-- Staff table
-- Similar to instructors but for other staff members (receptionists, beachboys, administrators, etc.)
CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    fullname VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    bankdetail TEXT,
    hourlyrate NUMERIC(10,2),
    commission NUMERIC(5,2),
    monthlyfix NUMERIC(10,2),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_staff_name ON staff(fullname);
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);

-- ============================================
-- FEEDBACK
-- ============================================

-- Feedback table for collecting user feedback
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN ('bug', 'feature', 'ux', 'workflow', 'other')),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'in_progress', 'resolved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================
