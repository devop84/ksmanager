CREATE TABLE IF NOT EXISTS company_accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    details TEXT,
    note TEXT
);

CREATE INDEX IF NOT EXISTS idx_company_accounts_name ON company_accounts(name);

