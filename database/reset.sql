-- ============================================
-- DATABASE RESET SCRIPT
-- ============================================
-- This script will:
-- 1. Truncate all tables (delete all data)
-- 2. Reset all sequences to start from 1
-- 
-- WARNING: This will DELETE ALL DATA in the database!
-- Use with caution. This is irreversible.
-- ============================================

BEGIN;

-- Truncate all tables in reverse dependency order (to avoid foreign key issues)
-- Using CASCADE to handle foreign key constraints automatically
-- Start with tables that have foreign keys, then base tables

-- Sessions (depends on users)
TRUNCATE TABLE sessions CASCADE;

-- Scheduled appointments (depends on many tables)
TRUNCATE TABLE scheduled_appointments CASCADE;

-- Customer service credits (depends on order_items, customers, services, service_packages)
TRUNCATE TABLE customer_service_credits CASCADE;

-- Order refunds (depends on orders, payment_methods, company_accounts, transactions)
TRUNCATE TABLE order_refunds CASCADE;

-- Order payments (depends on orders, payment_methods, company_accounts, transactions)
TRUNCATE TABLE order_payments CASCADE;

-- Order items (depends on orders, services, products, service_packages)
TRUNCATE TABLE order_items CASCADE;

-- Orders (depends on customers, agencies, users)
TRUNCATE TABLE orders CASCADE;

-- Transactions (depends on transaction_types, payment_methods, company_accounts, users)
TRUNCATE TABLE transactions CASCADE;

-- Feedback (depends on customers, services, instructors)
TRUNCATE TABLE feedback CASCADE;

-- Third parties (depends on third_parties_categories)
TRUNCATE TABLE third_parties CASCADE;

-- Customers (depends on hotels, agencies)
TRUNCATE TABLE customers CASCADE;

-- Base tables (no foreign key dependencies or only to other base tables)
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE hotels CASCADE;
TRUNCATE TABLE agencies CASCADE;
TRUNCATE TABLE third_parties_categories CASCADE;
TRUNCATE TABLE payment_methods CASCADE;
TRUNCATE TABLE transaction_types CASCADE;
TRUNCATE TABLE company_accounts CASCADE;
TRUNCATE TABLE instructors CASCADE;
TRUNCATE TABLE staff CASCADE;
TRUNCATE TABLE service_categories CASCADE;
TRUNCATE TABLE services CASCADE;
TRUNCATE TABLE service_packages CASCADE;
TRUNCATE TABLE product_categories CASCADE;
TRUNCATE TABLE products CASCADE;

-- Reset all sequences to start from 1
-- Get all sequences from tables with SERIAL PRIMARY KEY
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE sessions_id_seq RESTART WITH 1;
ALTER SEQUENCE customers_id_seq RESTART WITH 1;
ALTER SEQUENCE hotels_id_seq RESTART WITH 1;
ALTER SEQUENCE agencies_id_seq RESTART WITH 1;
ALTER SEQUENCE third_parties_categories_id_seq RESTART WITH 1;
ALTER SEQUENCE third_parties_id_seq RESTART WITH 1;
ALTER SEQUENCE payment_methods_id_seq RESTART WITH 1;
ALTER SEQUENCE transaction_types_id_seq RESTART WITH 1;
ALTER SEQUENCE transactions_id_seq RESTART WITH 1;
ALTER SEQUENCE company_accounts_id_seq RESTART WITH 1;
ALTER SEQUENCE instructors_id_seq RESTART WITH 1;
ALTER SEQUENCE staff_id_seq RESTART WITH 1;
ALTER SEQUENCE feedback_id_seq RESTART WITH 1;
ALTER SEQUENCE service_categories_id_seq RESTART WITH 1;
ALTER SEQUENCE services_id_seq RESTART WITH 1;
ALTER SEQUENCE service_packages_id_seq RESTART WITH 1;
ALTER SEQUENCE product_categories_id_seq RESTART WITH 1;
ALTER SEQUENCE products_id_seq RESTART WITH 1;
ALTER SEQUENCE orders_id_seq RESTART WITH 1;
ALTER SEQUENCE order_items_id_seq RESTART WITH 1;
ALTER SEQUENCE order_payments_id_seq RESTART WITH 1;
ALTER SEQUENCE order_refunds_id_seq RESTART WITH 1;
ALTER SEQUENCE customer_service_credits_id_seq RESTART WITH 1;
ALTER SEQUENCE scheduled_appointments_id_seq RESTART WITH 1;

-- Reset order number sequence (used by generate_order_number() function)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'orders_order_number_seq') THEN
        ALTER SEQUENCE orders_order_number_seq RESTART WITH 1;
    END IF;
END $$;

COMMIT;

-- ============================================
-- DATABASE RESET COMPLETE
-- ============================================
-- All tables have been truncated and sequences reset.
-- You can now run schema.sql and seed.sql to repopulate.
-- ============================================

