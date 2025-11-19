CREATE TABLE IF NOT EXISTS third_parties_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT
);

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

