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

