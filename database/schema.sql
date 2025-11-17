-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

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

-- Service categories
CREATE TABLE IF NOT EXISTS service_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Services catalog
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INTEGER NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lesson services
CREATE TABLE IF NOT EXISTS services_lessons (
    service_id INTEGER PRIMARY KEY REFERENCES services(id) ON DELETE CASCADE,
    default_duration_hours NUMERIC(5,2) NOT NULL,
    base_price_per_hour NUMERIC(10,2) NOT NULL,
    requires_package_pricing BOOLEAN DEFAULT FALSE
);

-- Lesson pricing tiers (packages)
CREATE TABLE IF NOT EXISTS services_lessons_packages (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    min_total_hours NUMERIC(6,2) NOT NULL,
    max_total_hours NUMERIC(6,2),
    price_per_hour NUMERIC(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_lessons_service_id ON services_lessons(service_id);
CREATE INDEX IF NOT EXISTS idx_services_lessons_packages_service_id ON services_lessons_packages(service_id);

-- Rental services
CREATE TABLE IF NOT EXISTS services_rentals (
    service_id INTEGER PRIMARY KEY REFERENCES services(id) ON DELETE CASCADE,
    gear_id VARCHAR(100),
    hourly_rate NUMERIC(10,2),
    daily_rate NUMERIC(10,2),
    weekly_rate NUMERIC(10,2)
);

CREATE INDEX IF NOT EXISTS idx_services_rentals_service_id ON services_rentals(service_id);

-- Storage services
CREATE TABLE IF NOT EXISTS services_storage (
    service_id INTEGER PRIMARY KEY REFERENCES services(id) ON DELETE CASCADE,
    daily_rate NUMERIC(10,2),
    weekly_rate NUMERIC(10,2),
    monthly_rate NUMERIC(10,2)
);

CREATE INDEX IF NOT EXISTS idx_services_storage_service_id ON services_storage(service_id);

-- Equipment categories
CREATE TABLE IF NOT EXISTS equipment_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Equipment inventory
CREATE TABLE IF NOT EXISTS equipment (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES equipment_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category_id);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    cancelled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_service_id ON orders(service_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

CREATE TABLE IF NOT EXISTS orders_lessons (
    order_id INTEGER PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    instructor_id INTEGER REFERENCES instructors(id) ON DELETE SET NULL,
    starting TIMESTAMP NOT NULL,
    ending TIMESTAMP NOT NULL,
    note TEXT
);

CREATE TABLE IF NOT EXISTS orders_rentals (
    order_id INTEGER PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
    equipment_id INTEGER REFERENCES equipment(id) ON DELETE SET NULL,
    hourly BOOLEAN DEFAULT FALSE,
    daily BOOLEAN DEFAULT FALSE,
    weekly BOOLEAN DEFAULT FALSE,
    starting TIMESTAMP NOT NULL,
    ending TIMESTAMP NOT NULL,
    note TEXT
);

CREATE TABLE IF NOT EXISTS orders_storage (
    order_id INTEGER PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
    storage_id INTEGER REFERENCES services_storage(service_id) ON DELETE SET NULL,
    daily BOOLEAN DEFAULT FALSE,
    weekly BOOLEAN DEFAULT FALSE,
    monthly BOOLEAN DEFAULT FALSE,
    starting TIMESTAMP NOT NULL,
    ending TIMESTAMP NOT NULL,
    note TEXT
);

