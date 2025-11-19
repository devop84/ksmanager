CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

