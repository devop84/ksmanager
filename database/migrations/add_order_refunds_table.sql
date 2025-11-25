-- Migration: Add order_refunds table
-- Date: 2024
-- Description: Creates the order_refunds table to track refunds made on orders

-- Refunds table (refunds can be made on an order)
CREATE TABLE IF NOT EXISTS order_refunds (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Refund details
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    payment_method_id INTEGER NOT NULL REFERENCES payment_methods(id) ON DELETE RESTRICT,
    
    -- When and who
    occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Company account (mandatory for refunds)
    company_account_id INTEGER NOT NULL REFERENCES company_accounts(id) ON DELETE RESTRICT,
    
    -- Transaction reference (linked to general ledger)
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
    
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_refunds_order ON order_refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_order_refunds_occurred_at ON order_refunds(occurred_at);
CREATE INDEX IF NOT EXISTS idx_order_refunds_payment_method ON order_refunds(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_order_refunds_transaction ON order_refunds(transaction_id);



