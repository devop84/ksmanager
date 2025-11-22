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
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
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
-- SERVICES & PRODUCTS CATALOG
-- ============================================

-- Service categories (lessons, rental, storage, downwinds)
CREATE TABLE IF NOT EXISTS service_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_service_categories_name ON service_categories(name);

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES service_categories(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    duration_unit VARCHAR(20) CHECK (duration_unit IN ('hours', 'days', 'months', 'none')) DEFAULT 'none',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_duration_unit ON services(duration_unit);

-- Service packages (e.g., 2h, 4h, 6h, 8h, 10h lesson packages)
CREATE TABLE IF NOT EXISTS service_packages (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,  -- e.g., "2h Package", "4h Package"
    duration_hours NUMERIC(5,2),  -- Used when service.duration_unit = 'hours'
    duration_days NUMERIC(5,2),   -- Used when service.duration_unit = 'days'
    duration_months INTEGER,      -- Used when service.duration_unit = 'months'
    price NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_service_packages_service ON service_packages(service_id);
CREATE INDEX IF NOT EXISTS idx_service_packages_active ON service_packages(is_active);

-- Product categories (clothing, sun protector, equipment, etc.)
CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_categories_name ON product_categories(name);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES product_categories(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    sku VARCHAR(100),  -- Stock Keeping Unit
    stock_quantity INTEGER DEFAULT 0,  -- Current stock
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- ============================================
-- ORDERS & PURCHASES (The "Tab" System)
-- ============================================

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS orders_order_number_seq START 1;

-- Orders table (represents a customer's tab/purchase session)
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,  -- e.g., "ORD-2024-001234"
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
    
    -- Totals (calculated from order_items)
    subtotal NUMERIC(12,2) DEFAULT 0,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    total_amount NUMERIC(12,2) DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    
    -- Payment tracking
    total_paid NUMERIC(12,2) DEFAULT 0,
    balance_due NUMERIC(12,2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,  -- When the bill was closed
    cancelled_at TIMESTAMP,
    
    -- Optional relationships
    agency_id INTEGER REFERENCES agencies(id) ON DELETE SET NULL,  -- If booked through agency
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,  -- Staff member who created
    
    note TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_agency ON orders(agency_id);

-- Order items table (services/products/packages in an order)
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Polymorphic reference: which type of item
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('service', 'product', 'service_package')),
    item_id INTEGER NOT NULL,  -- References services.id, products.id, or service_packages.id
    
    -- Item details (snapshot at time of purchase)
    item_name VARCHAR(255) NOT NULL,  -- Snapshot of name
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,  -- quantity * unit_price
    
    -- Optional metadata
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_type ON order_items(item_type, item_id);

-- ============================================
-- ORDER PAYMENTS (Multiple payments per order)
-- ============================================

-- Payments table (multiple payments can be made on an order)
CREATE TABLE IF NOT EXISTS order_payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Payment details
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    payment_method_id INTEGER NOT NULL REFERENCES payment_methods(id) ON DELETE RESTRICT,
    
    -- When and who
    occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Optional reference to company_account if needed
    company_account_id INTEGER REFERENCES company_accounts(id) ON DELETE SET NULL,
    
    -- Transaction reference (linked to general ledger)
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
    
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_payments_order ON order_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_occurred_at ON order_payments(occurred_at);
CREATE INDEX IF NOT EXISTS idx_order_payments_payment_method ON order_payments(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_transaction ON order_payments(transaction_id);

-- ============================================
-- HELPER FUNCTIONS & TRIGGERS
-- ============================================

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                           LPAD(nextval('orders_order_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order number
CREATE TRIGGER trigger_generate_order_number
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_number();

-- Function to update order totals when items change
CREATE OR REPLACE FUNCTION update_order_totals()
RETURNS TRIGGER AS $$
DECLARE
    affected_order_id INTEGER;
BEGIN
    affected_order_id := COALESCE(NEW.order_id, OLD.order_id);
    
    UPDATE orders
    SET 
        subtotal = COALESCE((
            SELECT SUM(subtotal) 
            FROM order_items 
            WHERE order_id = affected_order_id
        ), 0),
        total_amount = COALESCE((
            SELECT SUM(subtotal) 
            FROM order_items 
            WHERE order_id = affected_order_id
        ), 0) - COALESCE(discount_amount, 0) + COALESCE(tax_amount, 0),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = affected_order_id;
    
    -- Also update balance_due based on current total_paid
    UPDATE orders
    SET balance_due = total_amount - COALESCE(total_paid, 0)
    WHERE id = affected_order_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate totals when order items change
CREATE TRIGGER trigger_update_order_totals
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_order_totals();

-- Function to update order payment balance and create transaction
CREATE OR REPLACE FUNCTION update_order_payment_balance()
RETURNS TRIGGER AS $$
DECLARE
    order_rec RECORD;
    order_total NUMERIC(12,2);
    total_paid_calc NUMERIC(12,2);
    transaction_type_id INTEGER;
    payment_rec RECORD;
    new_transaction_id INTEGER;
    company_account INTEGER;
BEGIN
    -- Get order details
    SELECT * INTO order_rec FROM orders WHERE id = COALESCE(NEW.order_id, OLD.order_id);
    
    -- Get order total
    order_total := order_rec.total_amount;
    
    -- Calculate total paid
    SELECT COALESCE(SUM(amount), 0) INTO total_paid_calc
    FROM order_payments
    WHERE order_id = COALESCE(NEW.order_id, OLD.order_id);
    
    -- Update order payment totals
    UPDATE orders
    SET 
        total_paid = total_paid_calc,
        balance_due = order_total - total_paid_calc,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.order_id, OLD.order_id);
    
    -- If this is a new payment (INSERT), create a transaction record
    IF TG_OP = 'INSERT' AND NEW.transaction_id IS NULL THEN
        -- Get the customer payment transaction type
        SELECT id INTO transaction_type_id 
        FROM transaction_types 
        WHERE code = 'CUSTOMER_PAYMENT' 
        LIMIT 1;
        
        -- Get company account (default to Cashier if not set)
        company_account := COALESCE(NEW.company_account_id, 
            (SELECT id FROM company_accounts WHERE name = 'Cashier' LIMIT 1));
        
        -- Create transaction in general ledger
        INSERT INTO transactions (
            occurred_at,
            amount,
            currency,
            type_id,
            payment_method_id,
            source_entity_type,
            source_entity_id,
            destination_entity_type,
            destination_entity_id,
            reference,
            note,
            created_by
        ) VALUES (
            NEW.occurred_at,
            NEW.amount,
            NEW.currency,
            transaction_type_id,
            NEW.payment_method_id,
            'customer',
            order_rec.customer_id,
            'company_account',
            company_account,
            order_rec.order_number || '-PAY-' || LPAD(NEW.id::TEXT, 4, '0'),
            COALESCE(NEW.note, 'Payment for order ' || order_rec.order_number),
            NEW.created_by
        ) RETURNING id INTO new_transaction_id;
        
        -- Update order_payment with transaction_id
        UPDATE order_payments
        SET transaction_id = new_transaction_id
        WHERE id = NEW.id;
    END IF;
    
    -- If payment is deleted, optionally mark transaction as voided or delete it
    -- For now, we'll leave the transaction but you can add logic here if needed
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update balance when payments change and create transaction
CREATE TRIGGER trigger_update_order_payment_balance
AFTER INSERT OR UPDATE OR DELETE ON order_payments
FOR EACH ROW
EXECUTE FUNCTION update_order_payment_balance();

-- ============================================
-- SCHEDULING & AGENDA SYSTEM
-- ============================================

-- Customer service credits table
-- Tracks credits from purchased service packages
CREATE TABLE IF NOT EXISTS customer_service_credits (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_item_id INTEGER NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    
    -- Link to the service package that was purchased (NULL for direct service purchases)
    service_package_id INTEGER REFERENCES service_packages(id) ON DELETE RESTRICT,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    
    -- Credit details (based on service.duration_unit)
    -- Only one of these will be populated based on service.duration_unit
    total_hours NUMERIC(5,2),      -- For services with duration_unit = 'hours'
    total_days NUMERIC(5,2),       -- For services with duration_unit = 'days'
    total_months INTEGER,          -- For services with duration_unit = 'months'
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'fully_used')),
    
    -- Expiry (optional - can be NULL for no expiration)
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_service_credits_customer ON customer_service_credits(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_service_credits_order_item ON customer_service_credits(order_item_id);
CREATE INDEX IF NOT EXISTS idx_customer_service_credits_service_package ON customer_service_credits(service_package_id);
CREATE INDEX IF NOT EXISTS idx_customer_service_credits_service ON customer_service_credits(service_id);
CREATE INDEX IF NOT EXISTS idx_customer_service_credits_status ON customer_service_credits(status);
CREATE INDEX IF NOT EXISTS idx_customer_service_credits_expires_at ON customer_service_credits(expires_at);

-- Scheduled appointments table
CREATE TABLE IF NOT EXISTS scheduled_appointments (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- What service is being scheduled
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    service_package_id INTEGER REFERENCES service_packages(id) ON DELETE SET NULL,  -- Optional: if booked from a package
    
    -- Which credit is being used (can be NULL if it's a direct service purchase, not from credit)
    credit_id INTEGER REFERENCES customer_service_credits(id) ON DELETE SET NULL,
    
    -- Scheduling details
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Duration consumed (based on service.duration_unit)
    duration_hours NUMERIC(5,2),   -- For services with duration_unit = 'hours'
    duration_days NUMERIC(5,2),    -- For services with duration_unit = 'days'
    duration_months INTEGER,       -- For services with duration_unit = 'months'
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled')),
    
    -- Optional: assign instructor/staff
    instructor_id INTEGER REFERENCES instructors(id) ON DELETE SET NULL,
    staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
    
    -- Optional: name of the person attending (for appointments booked for family/friends)
    attendee_name VARCHAR(255),
    
    -- Notes
    note TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Who created/modified
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Check that end is after start
    CONSTRAINT check_scheduled_time CHECK (scheduled_end > scheduled_start)
);

CREATE INDEX IF NOT EXISTS idx_scheduled_appointments_customer ON scheduled_appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_appointments_service ON scheduled_appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_appointments_credit ON scheduled_appointments(credit_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_appointments_status ON scheduled_appointments(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_appointments_start ON scheduled_appointments(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_scheduled_appointments_end ON scheduled_appointments(scheduled_end);
CREATE INDEX IF NOT EXISTS idx_scheduled_appointments_instructor ON scheduled_appointments(instructor_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_appointments_staff ON scheduled_appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_appointments_date_range ON scheduled_appointments(scheduled_start, scheduled_end);

-- Function to calculate credit balance
CREATE OR REPLACE FUNCTION get_credit_balance(credit_id_param INTEGER)
RETURNS TABLE (
    credit_id INTEGER,
    total NUMERIC,
    used NUMERIC,
    available NUMERIC,
    duration_unit VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        csc.id,
        CASE 
            WHEN s.duration_unit = 'hours' THEN csc.total_hours
            WHEN s.duration_unit = 'days' THEN csc.total_days
            WHEN s.duration_unit = 'months' THEN csc.total_months::NUMERIC
            ELSE 0
        END as total,
        CASE 
            WHEN s.duration_unit = 'hours' THEN COALESCE(SUM(sa.duration_hours), 0)
            WHEN s.duration_unit = 'days' THEN COALESCE(SUM(sa.duration_days), 0)
            WHEN s.duration_unit = 'months' THEN COALESCE(SUM(sa.duration_months), 0)::NUMERIC
            ELSE 0
        END as used,
        CASE 
            WHEN s.duration_unit = 'hours' THEN csc.total_hours - COALESCE(SUM(sa.duration_hours), 0)
            WHEN s.duration_unit = 'days' THEN csc.total_days - COALESCE(SUM(sa.duration_days), 0)
            WHEN s.duration_unit = 'months' THEN (csc.total_months::NUMERIC - COALESCE(SUM(sa.duration_months), 0)::NUMERIC)
            ELSE 0
        END as available,
        s.duration_unit
    FROM customer_service_credits csc
    JOIN services s ON csc.service_id = s.id
    LEFT JOIN scheduled_appointments sa ON sa.credit_id = csc.id 
        AND sa.status IN ('scheduled', 'completed')
        AND (sa.cancelled_at IS NULL)
    WHERE csc.id = credit_id_param
        AND csc.status = 'active'
    GROUP BY csc.id, csc.total_hours, csc.total_days, csc.total_months, s.duration_unit;
END;
$$ LANGUAGE plpgsql;

-- Function to get all credits for a customer with balances
CREATE OR REPLACE FUNCTION get_customer_credits(customer_id_param INTEGER)
RETURNS TABLE (
    credit_id INTEGER,
    customer_id INTEGER,
    order_item_id INTEGER,
    service_package_id INTEGER,
    service_id INTEGER,
    service_name VARCHAR,
    package_name VARCHAR,
    duration_unit VARCHAR,
    total NUMERIC,
    used NUMERIC,
    available NUMERIC,
    status VARCHAR,
    expires_at TIMESTAMP,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        csc.id as credit_id,
        csc.customer_id,
        csc.order_item_id,
        csc.service_package_id,
        csc.service_id,
        s.name as service_name,
        sp.name as package_name,
        s.duration_unit,
        CASE 
            WHEN s.duration_unit = 'hours' THEN csc.total_hours
            WHEN s.duration_unit = 'days' THEN csc.total_days
            WHEN s.duration_unit = 'months' THEN csc.total_months::NUMERIC
            ELSE 0
        END as total,
        CASE 
            WHEN s.duration_unit = 'hours' THEN COALESCE(SUM(sa.duration_hours) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
            WHEN s.duration_unit = 'days' THEN COALESCE(SUM(sa.duration_days) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
            WHEN s.duration_unit = 'months' THEN COALESCE(SUM(sa.duration_months) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)::NUMERIC
            ELSE 0
        END as used,
        CASE 
            WHEN s.duration_unit = 'hours' THEN csc.total_hours - COALESCE(SUM(sa.duration_hours) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
            WHEN s.duration_unit = 'days' THEN csc.total_days - COALESCE(SUM(sa.duration_days) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
            WHEN s.duration_unit = 'months' THEN (csc.total_months::NUMERIC - COALESCE(SUM(sa.duration_months) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)::NUMERIC)
            ELSE 0
        END as available,
        csc.status,
        csc.expires_at,
        csc.created_at
    FROM customer_service_credits csc
    JOIN services s ON csc.service_id = s.id
    LEFT JOIN service_packages sp ON csc.service_package_id = sp.id
    LEFT JOIN scheduled_appointments sa ON sa.credit_id = csc.id
    WHERE csc.customer_id = customer_id_param
    GROUP BY csc.id, csc.customer_id, csc.order_item_id, csc.service_package_id, csc.service_id, 
             s.name, sp.name, s.duration_unit, csc.total_hours, csc.total_days, csc.total_months,
             csc.status, csc.expires_at, csc.created_at
    ORDER BY csc.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create credits when service_package is purchased
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
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_service_credits
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION create_service_credits_from_order_item();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp for credits and appointments
CREATE TRIGGER trigger_update_customer_service_credits_updated_at
BEFORE UPDATE ON customer_service_credits
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_scheduled_appointments_updated_at
BEFORE UPDATE ON scheduled_appointments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();