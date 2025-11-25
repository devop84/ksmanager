-- ============================================
-- SEED DATA
-- ============================================
-- This file contains all data from the database
-- Generated on: 2025-11-25T16:29:49.962Z
-- 
-- IMPORTANT: Run this file AFTER running schema.sql
-- ============================================

-- Disable foreign key checks temporarily (if needed)
-- Note: PostgreSQL doesn't support disabling foreign keys,
-- so ensure data is inserted in the correct order

BEGIN;

-- Table: users
-- 2 row(s)

INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at) VALUES
  (1, 'admin', 'admin@ksmanager.com', 'Qh2V8ZWrCMmPbsz1gb5/JwJqJ1xrW5d6TWmxMOfOEmLWLkAFLGdAcZm+G6uw9jZJ', 'admin', '2025-11-22T00:26:50.724Z', '2025-11-23T04:31:39.536Z'),
  (3, 'View Only', 'viewonly@ksmanager.com', 'yItRI9EqBmdBU9dV1500gKJteelZ0SDCJy+TI4oiaLTlPmoLMdqtL+lMrSSqm29B', 'viewonly', '2025-11-23T04:31:28.615Z', '2025-11-23T04:31:28.615Z');

-- Table: hotels
-- 5 row(s)

INSERT INTO hotels (id, name, phone, address, note, created_at, updated_at) VALUES
  (1, 'Pousada Atins', '+55 98 99123-1001', 'Rua Principal, Atins, MA', 'Beachfront pousada', '2025-11-22T23:38:58.801Z', '2025-11-22T23:38:58.801Z'),
  (2, 'Hotel Lençóis', '+55 98 99123-1002', 'Av. Principal, Barreirinhas, MA', 'Near Lençóis Maranhenses', '2025-11-22T23:38:58.801Z', '2025-11-22T23:38:58.801Z'),
  (3, 'Atins Beach Resort', '+55 98 99123-1003', 'Praia de Atins, Atins, MA', 'Luxury beach resort', '2025-11-22T23:38:58.801Z', '2025-11-22T23:38:58.801Z'),
  (4, 'Pousada do Vento', '+55 98 99123-1004', 'Rua do Kite, Atins, MA', 'Kitesurf friendly', '2025-11-22T23:38:58.801Z', '2025-11-22T23:38:58.801Z'),
  (5, 'Hotel Maré', '+55 98 99123-1005', 'Centro, Barreirinhas, MA', 'City center hotel', '2025-11-22T23:38:58.801Z', '2025-11-22T23:38:58.801Z');

-- Table: agencies
-- 5 row(s)

INSERT INTO agencies (id, name, phone, email, commission, note, created_at, updated_at) VALUES
  (1, 'Brasil Planet Turismo', '+55 98 98831-6668', 'info@brasilplanet.com.br', '15.00', 'Transporte e turismo em Barreirinhas', '2025-11-22T23:38:58.920Z', '2025-11-22T23:38:58.920Z'),
  (2, 'Atins Kiteboarding (AKB)', '+55 98 99171-7120', 'contato@atinskiteboarding.com.br', '18.00', 'Especialista em kitesurf em Atins', '2025-11-22T23:38:58.920Z', '2025-11-22T23:38:58.920Z'),
  (3, 'Aquarela Travel', '+55 98 99171-7121', 'info@aquarelatravel.com.br', '12.50', 'Serviços de viagem diversos', '2025-11-22T23:38:58.920Z', '2025-11-22T23:38:58.920Z'),
  (4, 'Atins Adventure', '+55 98 99123-5001', 'hello@atinsadventure.com.br', '17.00', 'Aventuras e expedições', '2025-11-22T23:38:58.920Z', '2025-11-22T23:38:58.920Z'),
  (5, 'Lençóis Maranhenses Tour', '+55 98 99123-5002', 'contato@lencoismaranhensestour.com.br', '16.00', 'Tours no Parque Nacional', '2025-11-22T23:38:58.920Z', '2025-11-22T23:38:58.920Z');

-- Table: third_parties_categories
-- 3 row(s)

INSERT INTO third_parties_categories (id, name, description) VALUES
  (1, 'Transport Services', 'Transfer and taxi companies for customer transportation'),
  (2, 'Mechanics', 'Equipment repair and maintenance mechanics'),
  (3, 'Downwinder Guides', 'Professional guides for downwinder tours');

-- Table: payment_methods
-- 8 row(s)

INSERT INTO payment_methods (id, name, description, created_at, updated_at) VALUES
  (1, 'Cash', 'Cash payments', '2025-11-22T23:38:58.430Z', '2025-11-22T23:38:58.430Z'),
  (2, 'Credit Card', 'Credit card transactions', '2025-11-22T23:38:58.430Z', '2025-11-22T23:38:58.430Z'),
  (3, 'Debit Card', 'Debit card transactions', '2025-11-22T23:38:58.430Z', '2025-11-22T23:38:58.430Z'),
  (4, 'Bank Transfer', 'Wire transfer or bank transfer', '2025-11-22T23:38:58.430Z', '2025-11-22T23:38:58.430Z'),
  (5, 'PayPal', 'PayPal online payments', '2025-11-22T23:38:58.430Z', '2025-11-22T23:38:58.430Z'),
  (6, 'Stripe', 'Stripe payment gateway', '2025-11-22T23:38:58.430Z', '2025-11-22T23:38:58.430Z'),
  (7, 'Check', 'Check payments', '2025-11-22T23:38:58.430Z', '2025-11-22T23:38:58.430Z'),
  (8, 'Cryptocurrency', 'Cryptocurrency payments', '2025-11-22T23:38:58.430Z', '2025-11-22T23:38:58.430Z');

-- Table: transaction_types
-- 10 row(s)

INSERT INTO transaction_types (id, code, label, direction, description, created_at, updated_at) VALUES
  (1, 'CUSTOMER_PAYMENT', 'Customer Payment', 'income', 'Customer payment for lessons and services', '2025-11-22T23:38:58.549Z', '2025-11-22T23:38:58.549Z'),
  (2, 'INSTRUCTOR_SALARY', 'Instructor Salary', 'expense', 'Payment of salaries to instructors', '2025-11-22T23:38:58.549Z', '2025-11-22T23:38:58.549Z'),
  (3, 'STAFF_SALARY', 'Staff Salary', 'expense', 'Payment of salaries to staff members', '2025-11-22T23:38:58.549Z', '2025-11-22T23:38:58.549Z'),
  (4, 'COMPANY_TRANSFER', 'Company to Company Transfer', 'transfer', 'Transfer between company accounts', '2025-11-22T23:38:58.549Z', '2025-11-22T23:38:58.549Z'),
  (5, 'CUSTOMER_REFUND', 'Customer Refund', 'expense', 'Refund to customers for cancelled services', '2025-11-22T23:38:58.549Z', '2025-11-22T23:38:58.549Z'),
  (6, 'AGENCY_COMMISSION', 'Agency Commission', 'expense', 'Commission payment to agencies', '2025-11-22T23:38:58.549Z', '2025-11-22T23:38:58.549Z'),
  (7, 'THIRD_PARTY_PAYMENT', 'Third Party Payment', 'expense', 'Payment to third party suppliers or services', '2025-11-22T23:38:58.549Z', '2025-11-22T23:38:58.549Z'),
  (8, 'RENTAL_PAYMENT', 'Rental Payment', 'income', 'Customer payment for equipment rental', '2025-11-22T23:38:58.549Z', '2025-11-22T23:38:58.549Z'),
  (9, 'SHOP_MAINTENANCE', 'Shop Maintenance', 'expense', 'Maintenance costs for shop facilities', '2025-11-22T23:38:58.549Z', '2025-11-22T23:38:58.549Z'),
  (10, 'EQUIPMENT_REPAIR', 'Equipment Repair', 'expense', 'Repair costs for kitesurfing equipment', '2025-11-22T23:38:58.549Z', '2025-11-22T23:38:58.549Z');

-- Table: company_accounts
-- 3 row(s)

INSERT INTO company_accounts (id, name, details, note) VALUES
  (1, 'Cashier', 'Caixa registradora - dinheiro em espécie', 'Caixa para pagamentos em dinheiro'),
  (2, 'Banco do Brasil', 'Banco: Banco do Brasil, Agência: 1234-5, Conta: 12345-6, CPF/CNPJ: 12.345.678/0001-90', 'Conta corrente principal'),
  (3, 'Bradesco', 'Banco: Bradesco, Agência: 5678-9, Conta: 98765-4, CPF/CNPJ: 12.345.678/0001-90', 'Conta corrente secundária');

-- Table: instructors
-- 5 row(s)

INSERT INTO instructors (id, fullname, phone, email, bankdetail, hourlyrate, commission, monthlyfix, note, created_at, updated_at) VALUES
  (1, 'Carlos Silva', '+55 98 99123-3001', 'carlos.silva@kiteschool.com', 'Banco do Brasil, Agência: 1234-5, Conta: 11111-1', '120.00', '0.00', '0.00', 'Instrutor brasileiro experiente, 10+ anos', '2025-11-22T23:38:59.281Z', '2025-11-23T03:43:47.682Z'),
  (2, 'Mike Johnson', '+1 555-3002', 'mike.johnson@kiteschool.com', 'Bank: Chase, Account: 1234567890', '120.00', '0.00', '0.00', 'Senior instructor from USA, IKO certified', '2025-11-22T23:38:59.281Z', '2025-11-23T03:44:02.698Z'),
  (3, 'Sarah Williams', '+1 555-3003', 'sarah.williams@kiteschool.com', 'Bank: Bank of America, Account: 9876543210', '120.00', '0.00', '0.00', 'Advanced lessons specialist', '2025-11-22T23:38:59.281Z', '2025-11-23T03:44:12.113Z'),
  (4, 'Tom Rodriguez', '+34 91 123 4567', 'tom.rodriguez@kiteschool.com', 'Bank: BBVA, Account: 5555555555', '120.00', '0.00', '0.00', 'Beginner-friendly instructor from Spain', '2025-11-22T23:38:59.281Z', '2025-11-23T03:44:19.632Z'),
  (5, 'Emma Davis', '+44 20 7946 0959', 'emma.davis@kiteschool.com', 'Bank: HSBC, Account: 1111222233', '120.00', '0.00', '0.00', 'Youth programs coordinator from UK', '2025-11-22T23:38:59.281Z', '2025-11-23T03:43:55.962Z');

-- Table: staff
-- 3 row(s)

INSERT INTO staff (id, fullname, role, phone, email, bankdetail, hourlyrate, commission, monthlyfix, note, created_at, updated_at) VALUES
  (1, 'João Silva', 'Manager', '+55 98 99123-4001', 'joao.silva@kiteschool.com', 'Banco do Brasil, Agência: 1234-5, Conta: 30000-1', '35.00', '10.00', '3500.00', 'Gerente de operações', '2025-11-22T23:38:59.401Z', '2025-11-22T23:38:59.401Z'),
  (2, 'Maria Santos', 'Receptionist', '+55 98 99123-4002', 'maria.santos@kiteschool.com', 'Banco do Brasil, Agência: 1234-5, Conta: 30000-2', '18.00', '5.00', '2800.00', 'Recepcionista e atendimento', '2025-11-22T23:38:59.401Z', '2025-11-22T23:38:59.401Z'),
  (3, 'Pedro Oliveira', 'Beach Boy', '+55 98 99123-4003', 'pedro.oliveira@kiteschool.com', 'Banco do Brasil, Agência: 1234-5, Conta: 30000-3', '15.00', '3.00', '2400.00', 'Equipamentos e praia', '2025-11-22T23:38:59.401Z', '2025-11-22T23:38:59.401Z');

-- Table: service_categories
-- 4 row(s)

INSERT INTO service_categories (id, name, description, created_at) VALUES
  (1, 'Lessons', 'Kitesurfing lesson services', '2025-11-22T23:38:57.781Z'),
  (2, 'Rental', 'Equipment rental services', '2025-11-22T23:38:57.781Z'),
  (3, 'Storage', 'Equipment storage services', '2025-11-22T23:38:57.781Z'),
  (4, 'Downwinds', 'Downwinder tour services', '2025-11-22T23:38:57.781Z');

-- Table: services
-- 5 row(s)

INSERT INTO services (id, category_id, name, description, base_price, currency, is_active, created_at, updated_at, duration_unit) VALUES
  (1, 1, 'Kitesurf Private Lessons', 'One-on-one private kitesurf lessons', '390.00', 'BRL', TRUE, '2025-11-22T23:38:57.922Z', '2025-11-22T23:38:57.922Z', 'hours'),
  (2, 1, 'Wingfoil Private Lessons', 'One-on-one Wingfoil Private Lessons', '490.00', 'BRL', TRUE, '2025-11-22T23:38:57.922Z', '2025-11-22T23:38:57.922Z', 'hours'),
  (3, 2, 'Board Rental (by hour)', 'Board rental per hour', '150.00', 'BRL', TRUE, '2025-11-22T23:38:57.922Z', '2025-11-22T23:38:57.922Z', 'hours'),
  (4, 2, 'Board Rental (by day)', 'Board rental per day', '500.00', 'BRL', TRUE, '2025-11-22T23:38:57.922Z', '2025-11-23T02:21:47.019Z', 'days'),
  (5, 3, 'Individual Private Storage', 'Private storage for equipment', '150.00', 'BRL', TRUE, '2025-11-22T23:38:57.922Z', '2025-11-22T23:38:57.922Z', 'days');

-- Table: service_packages
-- 9 row(s)

INSERT INTO service_packages (id, service_id, name, duration_hours, price, currency, description, is_active, created_at, updated_at, duration_days, duration_months) VALUES
  (1, 1, '4h Package', '4.00', '1520.00', 'BRL', NULL, TRUE, '2025-11-22T23:38:58.069Z', '2025-11-22T23:38:58.069Z', NULL, NULL),
  (2, 1, '6h Package', '6.00', '2220.00', 'BRL', NULL, TRUE, '2025-11-22T23:38:58.069Z', '2025-11-22T23:38:58.069Z', NULL, NULL),
  (3, 1, '8h Package', '8.00', '2880.00', 'BRL', NULL, TRUE, '2025-11-22T23:38:58.069Z', '2025-11-22T23:38:58.069Z', NULL, NULL),
  (4, 1, '10h Package', '10.00', '3500.00', 'BRL', NULL, TRUE, '2025-11-22T23:38:58.069Z', '2025-11-22T23:38:58.069Z', NULL, NULL),
  (5, 2, '4h Package', '4.00', '1920.00', 'BRL', NULL, TRUE, '2025-11-22T23:38:58.069Z', '2025-11-22T23:38:58.069Z', NULL, NULL),
  (6, 2, '6h Package', '6.00', '2820.00', 'BRL', NULL, TRUE, '2025-11-22T23:38:58.069Z', '2025-11-22T23:38:58.069Z', NULL, NULL),
  (7, 2, '8h Package', '8.00', '3680.00', 'BRL', NULL, TRUE, '2025-11-22T23:38:58.069Z', '2025-11-22T23:38:58.069Z', NULL, NULL),
  (8, 2, '10h Package', '10.00', '4500.00', 'BRL', NULL, TRUE, '2025-11-22T23:38:58.069Z', '2025-11-22T23:38:58.069Z', NULL, NULL),
  (19, 1, '2h Package', '2.00', '780.00', 'BRL', NULL, TRUE, '2025-11-23T02:22:17.314Z', '2025-11-23T02:22:27.147Z', NULL, NULL);

-- Table: product_categories
-- 4 row(s)

INSERT INTO product_categories (id, name, description, created_at) VALUES
  (1, 'Clothing', 'Kitesurfing apparel and clothing', '2025-11-22T23:38:58.189Z'),
  (2, 'Sun Protection', 'Sunscreen and sun protection items', '2025-11-22T23:38:58.189Z'),
  (3, 'Equipment', 'Kitesurfing equipment and accessories', '2025-11-22T23:38:58.189Z'),
  (4, 'Accessories', 'Miscellaneous kitesurfing accessories', '2025-11-22T23:38:58.189Z');

-- Table: products
-- 12 row(s)

INSERT INTO products (id, category_id, name, description, price, currency, sku, stock_quantity, is_active, created_at, updated_at) VALUES
  (1, 1, 'Kitesurfing T-Shirt', 'Branded kitesurfing t-shirt', '45.00', 'BRL', 'TSH-001', 50, TRUE, '2025-11-22T23:38:58.311Z', '2025-11-22T23:38:58.311Z'),
  (2, 1, 'Rash Guard', 'UV protection rash guard', '65.00', 'BRL', 'RASH-001', 30, TRUE, '2025-11-22T23:38:58.311Z', '2025-11-22T23:38:58.311Z'),
  (3, 1, 'Board Shorts', 'Quick-dry board shorts', '85.00', 'BRL', 'SHORT-001', 40, TRUE, '2025-11-22T23:38:58.311Z', '2025-11-22T23:38:58.311Z'),
  (4, 2, 'Sunscreen SPF 50', 'Waterproof sunscreen 100ml', '25.00', 'BRL', 'SPF-001', 100, TRUE, '2025-11-22T23:38:58.311Z', '2025-11-22T23:38:58.311Z'),
  (5, 2, 'Sunscreen SPF 30', 'Waterproof sunscreen 100ml', '20.00', 'BRL', 'SPF-002', 80, TRUE, '2025-11-22T23:38:58.311Z', '2025-11-22T23:38:58.311Z'),
  (6, 2, 'Sun Hat', 'Wide-brim sun hat', '35.00', 'BRL', 'HAT-001', 25, TRUE, '2025-11-22T23:38:58.311Z', '2025-11-22T23:38:58.311Z'),
  (7, 3, 'Kite Repair Kit', 'Essential repair tools and patches', '35.00', 'BRL', 'REP-001', 30, TRUE, '2025-11-22T23:38:58.311Z', '2025-11-22T23:38:58.311Z'),
  (8, 3, 'Pump Adapter', 'Pump adapter for kite inflation', '15.00', 'BRL', 'PUMP-001', 50, TRUE, '2025-11-22T23:38:58.311Z', '2025-11-22T23:38:58.311Z'),
  (9, 3, 'Safety Leash', 'Kite safety leash', '45.00', 'BRL', 'LEASH-001', 20, TRUE, '2025-11-22T23:38:58.311Z', '2025-11-22T23:38:58.311Z'),
  (10, 4, 'Waterproof Phone Case', 'Waterproof case for phone', '30.00', 'BRL', 'CASE-001', 40, TRUE, '2025-11-22T23:38:58.311Z', '2025-11-22T23:38:58.311Z'),
  (11, 4, 'GoPro Mount', 'Mount for action camera', '25.00', 'BRL', 'MOUNT-001', 30, TRUE, '2025-11-22T23:38:58.311Z', '2025-11-22T23:38:58.311Z'),
  (12, 4, 'Towel', 'Quick-dry microfiber towel', '20.00', 'BRL', 'TOWEL-001', 60, TRUE, '2025-11-22T23:38:58.311Z', '2025-11-22T23:38:58.311Z');

-- Table: customers
-- 50 row(s)

INSERT INTO customers (id, fullname, phone, email, doctype, doc, country, birthdate, note, hotel_id, agency_id, created_at, updated_at) VALUES
  (1, 'James Anderson', '+1 555-2001', 'james.anderson@email.com', 'passport', 'US123456789', 'USA', '1985-03-15T03:00:00.000Z', NULL, 1, 1, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (2, 'Sophia Martinez', '+1 555-2002', 'sophia.martinez@email.com', 'passport', 'MX321654987', 'Mexico', '1995-05-18T03:00:00.000Z', NULL, 2, 2, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (3, 'Thomas Müller', '+49 30 12345678', 'thomas.mueller@email.com', 'passport', 'DE987654321', 'Germany', '1990-07-22T03:00:00.000Z', NULL, 3, 3, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (4, 'Emma Wilson', '+44 20 7946 0958', 'emma.wilson@email.com', 'passport', 'GB456789123', 'UK', '1992-01-30T03:00:00.000Z', NULL, 4, 4, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (5, 'Pierre Dubois', '+33 1 42 86 83 26', 'pierre.dubois@email.com', 'passport', 'FR369258147', 'France', '1989-04-20T03:00:00.000Z', NULL, 5, 5, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (6, 'Isabella Rossi', '+39 06 12345678', 'isabella.rossi@email.com', 'passport', 'IT741852963', 'Italy', '1994-10-07T03:00:00.000Z', NULL, 1, 1, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (7, 'David Chen', '+86 10 12345678', 'david.chen@email.com', 'passport', 'CN123456789', 'China', '1988-11-05T02:00:00.000Z', NULL, 2, 2, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (8, 'Olivia Smith', '+61 2 9374 4000', 'olivia.smith@email.com', 'passport', 'AU147258369', 'Australia', '1991-08-03T03:00:00.000Z', NULL, 3, 3, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (9, 'Lucas Santos', '+55 11 98765-4321', 'lucas.santos@email.com', 'passport', 'BR963741852', 'Brazil', '1984-11-11T03:00:00.000Z', NULL, 4, 4, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (10, 'Amelia Brown', '+64 9 123 4567', 'amelia.brown@email.com', 'passport', 'NZ159753468', 'New Zealand', '1996-09-23T03:00:00.000Z', NULL, 5, 5, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (11, 'Mateo Rodriguez', '+57 1 234 5678', 'mateo.rodriguez@email.com', 'passport', 'CO741963258', 'Colombia', '1995-02-22T03:00:00.000Z', NULL, 1, 1, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (12, 'Chloe Thompson', '+1 416 555 1234', 'chloe.thompson@email.com', 'passport', 'CA789123456', 'Canada', '1993-08-27T03:00:00.000Z', NULL, 2, 2, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (13, 'Yuki Tanaka', '+81 3 1234 5678', 'yuki.tanaka@email.com', 'passport', 'JP963852741', 'Japan', '1996-04-19T03:00:00.000Z', NULL, 3, 3, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (14, 'Liam O''Connor', '+353 1 234 5678', 'liam.oconnor@email.com', 'passport', 'IE852147963', 'Ireland', '1997-01-24T03:00:00.000Z', NULL, 4, 4, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (15, 'Nora Johansson', '+46 8 123 456 78', 'nora.johansson@email.com', 'passport', 'SE741963852', 'Sweden', '1994-05-16T03:00:00.000Z', NULL, 5, 5, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (16, 'Michael Johnson', '+1 555-2016', 'michael.johnson@email.com', 'passport', 'US234567890', 'USA', '1987-12-08T02:00:00.000Z', NULL, 1, 1, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (17, 'Anna Kowalski', '+48 22 1234567', 'anna.kowalski@email.com', 'passport', 'PL963741258', 'Poland', '1993-06-26T03:00:00.000Z', NULL, 2, 2, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (18, 'Sebastian Schmidt', '+49 30 87654321', 'sebastian.schmidt@email.com', 'passport', 'DE876543210', 'Germany', '1992-09-06T03:00:00.000Z', NULL, 3, 3, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (19, 'Grace Scott', '+44 20 7946 0959', 'grace.scott@email.com', 'passport', 'GB567890123', 'UK', '1997-01-24T03:00:00.000Z', NULL, 4, 4, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (20, 'Luis Fernandez', '+34 91 234 5678', 'luis.fernandez@email.com', 'passport', 'ES987654321', 'Spain', '1991-12-15T03:00:00.000Z', NULL, 5, 5, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (21, 'Maria Garcia', '+34 91 345 6789', 'maria.garcia@email.com', 'passport', 'ES876543210', 'Spain', '1990-07-22T03:00:00.000Z', NULL, 1, 1, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (22, 'Alexander Petrov', '+7 495 1234567', 'alexander.petrov@email.com', 'passport', 'RU963741852', 'Russia', '1986-07-31T03:00:00.000Z', NULL, 2, 2, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (23, 'Eva Andersson', '+46 8 234 567 89', 'eva.andersson@email.com', 'passport', 'SE654321987', 'Sweden', '1993-03-21T03:00:00.000Z', NULL, 3, 3, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (24, 'Daniel White', '+1 555-2024', 'daniel.white@email.com', 'passport', 'US345678901', 'USA', '1989-08-30T03:00:00.000Z', NULL, 4, 4, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (25, 'Camille Martin', '+33 1 42 86 83 27', 'camille.martin@email.com', 'passport', 'FR258147369', 'France', '1995-05-16T03:00:00.000Z', NULL, 5, 5, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (26, 'Marco Bianchi', '+39 06 23456789', 'marco.bianchi@email.com', 'passport', 'IT852963741', 'Italy', '1992-11-09T03:00:00.000Z', NULL, 1, 1, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (27, 'Sarah O''Brien', '+353 1 345 6789', 'sarah.obrien@email.com', 'passport', 'IE741852963', 'Ireland', '1994-02-13T03:00:00.000Z', NULL, 2, 2, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (28, 'Hiroshi Yamamoto', '+81 3 2345 6789', 'hiroshi.yamamoto@email.com', 'passport', 'JP852741963', 'Japan', '1988-04-20T03:00:00.000Z', NULL, 3, 3, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (29, 'Olivia Brown', '+61 2 9374 4001', 'olivia.brown@email.com', 'passport', 'AU258369147', 'Australia', '1996-10-07T03:00:00.000Z', NULL, 4, 4, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (30, 'Sofia Hernandez', '+57 1 345 6789', 'sofia.hernandez@email.com', 'passport', 'CO852741963', 'Colombia', '1997-07-09T03:00:00.000Z', NULL, 5, 5, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (31, 'Benjamin Lee', '+86 10 23456789', 'benjamin.lee@email.com', 'passport', 'CN234567890', 'China', '1991-01-17T03:00:00.000Z', NULL, 1, 1, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (32, 'Charlotte Taylor', '+1 555-2032', 'charlotte.taylor@email.com', 'passport', 'US456789012', 'USA', '1994-08-27T03:00:00.000Z', NULL, 2, 2, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (33, 'Lucas Fernandez', '+34 91 456 7890', 'lucas.fernandez@email.com', 'passport', 'ES765432109', 'Spain', '1993-05-14T03:00:00.000Z', NULL, 3, 3, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (34, 'Emma Thompson', '+44 20 7946 0960', 'emma.thompson@email.com', 'passport', 'GB678901234', 'UK', '1995-09-11T03:00:00.000Z', NULL, 4, 4, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (35, 'Maximilian Weber', '+49 30 98765432', 'maximilian.weber@email.com', 'passport', 'DE765432109', 'Germany', '1990-12-25T03:00:00.000Z', NULL, 5, 5, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (36, 'Isabella Costa', '+55 11 98765-4322', 'isabella.costa@email.com', 'passport', 'BR852963741', 'Brazil', '1992-06-18T03:00:00.000Z', NULL, 1, 1, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (37, 'Ryan Murphy', '+1 555-2037', 'ryan.murphy@email.com', 'passport', 'US567890123', 'USA', '1988-03-22T03:00:00.000Z', NULL, 2, 2, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (38, 'Sophie Laurent', '+33 1 42 86 83 28', 'sophie.laurent@email.com', 'passport', 'FR147258369', 'France', '1994-11-05T03:00:00.000Z', NULL, 3, 3, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (39, 'Giovanni Romano', '+39 06 34567890', 'giovanni.romano@email.com', 'passport', 'IT963741852', 'Italy', '1991-08-19T03:00:00.000Z', NULL, 4, 4, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (40, 'Hannah Schmidt', '+49 30 11111111', 'hannah.schmidt@email.com', 'passport', 'DE654321098', 'Germany', '1996-02-28T03:00:00.000Z', NULL, 5, 5, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (41, 'James Wilson', '+1 555-2041', 'james.wilson@email.com', 'passport', 'US678901234', 'USA', '1991-12-15T03:00:00.000Z', NULL, 1, 1, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (42, 'Maria Rodriguez', '+34 91 567 8901', 'maria.rodriguez@email.com', 'passport', 'ES654321098', 'Spain', '1993-07-08T03:00:00.000Z', NULL, 2, 2, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (43, 'Oliver Brown', '+44 20 7946 0961', 'oliver.brown@email.com', 'passport', 'GB789012345', 'UK', '1995-04-12T03:00:00.000Z', NULL, 3, 3, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (44, 'Lina Andersson', '+46 8 345 678 90', 'lina.andersson@email.com', 'passport', 'SE543210987', 'Sweden', '1992-10-30T03:00:00.000Z', NULL, 4, 4, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (45, 'Thomas Anderson', '+1 555-2045', 'thomas.anderson@email.com', 'passport', 'US789012345', 'USA', '1989-01-17T02:00:00.000Z', NULL, 5, 5, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (46, 'Elena Petrov', '+7 495 2345678', 'elena.petrov@email.com', 'passport', 'RU852741963', 'Russia', '1994-06-24T03:00:00.000Z', NULL, 1, 1, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (47, 'Luca Bianchi', '+39 06 45678901', 'luca.bianchi@email.com', 'passport', 'IT741852963', 'Italy', '1993-09-03T03:00:00.000Z', NULL, 2, 2, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (48, 'Amelie Dubois', '+33 1 42 86 83 29', 'amelie.dubois@email.com', 'passport', 'FR258369147', 'France', '1996-12-20T03:00:00.000Z', NULL, 3, 3, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (49, 'Noah Johnson', '+1 555-2049', 'noah.johnson@email.com', 'passport', 'US890123456', 'USA', '1992-05-07T03:00:00.000Z', NULL, 4, 4, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z'),
  (50, 'Mia Williams', '+61 2 9374 4002', 'mia.williams@email.com', 'passport', 'AU369147258', 'Australia', '1995-11-14T03:00:00.000Z', NULL, 5, 5, '2025-11-22T23:38:59.522Z', '2025-11-22T23:38:59.522Z');

-- Table: third_parties
-- 4 row(s)

INSERT INTO third_parties (id, name, category_id, phone, email, note, created_at, updated_at) VALUES
  (1, 'Atins Transfer', 1, '+55 98 99123-6001', 'transfer@atins.com.br', 'Transfer service from airport to Atins', '2025-11-22T23:38:59.159Z', '2025-11-22T23:38:59.159Z'),
  (2, 'Táxi Atins', 1, '+55 98 99123-6002', 'taxi@atins.com.br', 'Taxi service in Atins and Barreirinhas', '2025-11-22T23:38:59.159Z', '2025-11-22T23:38:59.159Z'),
  (3, 'Mecânica do João', 2, '+55 98 99123-6101', 'joao@mecanicaatins.com.br', 'Kite and equipment repair specialist', '2025-11-22T23:38:59.159Z', '2025-11-22T23:38:59.159Z'),
  (4, 'Downwinder Guide Atins', 3, '+55 98 99123-6201', 'guide@downwinderatins.com.br', 'Professional downwinder guide services', '2025-11-22T23:38:59.159Z', '2025-11-22T23:38:59.159Z');

-- Table: transactions
-- 4 row(s)

INSERT INTO transactions (id, occurred_at, amount, currency, type_id, payment_method_id, source_entity_type, source_entity_id, destination_entity_type, destination_entity_id, reference, note, created_by, created_at, updated_at) VALUES
  (462, '2025-11-24T17:39:39.253Z', '1000.00', 'BRL', 1, 4, 'customer', 22, 'company_account', 2, 'ORD-2025-000057-PAY-0056', 'Payment for order ORD-2025-000057', NULL, '2025-11-24T17:39:38.826Z', '2025-11-24T17:39:38.826Z'),
  (463, '2025-11-24T17:39:50.398Z', '195.00', 'BRL', 5, 4, 'company_account', 2, 'customer', 22, 'ORD-2025-000057', NULL, 1, '2025-11-24T17:39:50.090Z', '2025-11-24T17:39:50.090Z'),
  (464, '2025-11-24T18:05:07.297Z', '780.00', 'BRL', 1, 2, 'customer', 22, 'company_account', 2, 'ORD-2025-000060-PAY-0057', 'Payment for order ORD-2025-000060', NULL, '2025-11-24T18:05:06.820Z', '2025-11-24T18:05:06.820Z'),
  (465, '2025-11-24T18:13:21.399Z', '1000.00', 'BRL', 1, 4, 'customer', 22, 'company_account', 2, 'ORD-2025-000061-PAY-0058', 'Payment for order ORD-2025-000061', NULL, '2025-11-24T18:13:20.904Z', '2025-11-24T18:13:20.904Z');

-- Table: orders
-- 8 row(s)

INSERT INTO orders (id, order_number, customer_id, status, subtotal, tax_amount, discount_amount, total_amount, currency, total_paid, balance_due, created_at, updated_at, closed_at, cancelled_at, agency_id, created_by, note) VALUES
  (1, 'ORD-2025-000001', 1, 'closed', '1520.00', '0.00', '0.00', '1520.00', 'BRL', '1520.00', '0.00', '2025-11-20T10:00:00.000Z', '2025-11-20T10:30:00.000Z', '2025-11-20T10:30:00.000Z', NULL, 1, 1, '4h kitesurf package'),
  (2, 'ORD-2025-000002', 2, 'closed', '2220.00', '0.00', '0.00', '2220.00', 'BRL', '2220.00', '0.00', '2025-11-20T11:00:00.000Z', '2025-11-20T11:15:00.000Z', '2025-11-20T11:15:00.000Z', NULL, 2, 1, '6h kitesurf package'),
  (3, 'ORD-2025-000003', 3, 'open', '3225.00', '0.00', '0.00', '3225.00', 'BRL', '1500.00', '1725.00', '2025-11-21T09:00:00.000Z', '2025-11-21T09:20:00.000Z', NULL, NULL, 3, 1, '8h kitesurf package + products - partial payment'),
  (4, 'ORD-2025-000004', 4, 'closed', '1920.00', '0.00', '0.00', '1920.00', 'BRL', '1920.00', '0.00', '2025-11-21T14:00:00.000Z', '2025-11-21T14:10:00.000Z', '2025-11-21T14:10:00.000Z', NULL, 4, 1, '4h wingfoil package'),
  (5, 'ORD-2025-000005', 5, 'cancelled', '3500.00', '0.00', '0.00', '3500.00', 'BRL', '0.00', '3500.00', '2025-11-22T08:00:00.000Z', '2025-11-22T08:30:00.000Z', NULL, '2025-11-22T08:30:00.000Z', 5, 1, '10h package - customer cancelled'),
  (6, 'ORD-2025-000006', 6, 'open', '780.00', '0.00', '0.00', '780.00', 'BRL', '780.00', '0.00', '2025-11-23T10:00:00.000Z', '2025-11-23T10:05:00.000Z', NULL, NULL, 1, 1, '2h kitesurf package'),
  (7, 'ORD-2025-000007', 7, 'closed', '3615.00', '0.00', '0.00', '3615.00', 'BRL', '3615.00', '0.00', '2025-11-23T15:00:00.000Z', '2025-11-23T15:30:00.000Z', '2025-11-23T15:30:00.000Z', NULL, 2, 1, '10h kitesurf package + products'),
  (8, 'ORD-2025-000008', 8, 'open', '500.00', '0.00', '0.00', '500.00', 'BRL', '0.00', '500.00', '2025-11-24T12:00:00.000Z', '2025-11-24T12:00:00.000Z', NULL, NULL, 3, 1, 'Board rental for 1 day');

-- Table: order_items
-- 12 row(s)

INSERT INTO order_items (id, order_id, item_type, item_id, item_name, quantity, unit_price, subtotal, note, created_at) VALUES
  (1, 1, 'service_package', 1, '4h Package', 1, '1520.00', '1520.00', NULL, '2025-11-20T10:00:00.000Z'),
  (2, 2, 'service_package', 2, '6h Package', 1, '2220.00', '2220.00', NULL, '2025-11-20T11:00:00.000Z'),
  (3, 3, 'service_package', 3, '8h Package', 1, '2880.00', '2880.00', NULL, '2025-11-21T09:00:00.000Z'),
  (4, 4, 'service_package', 5, '4h Package', 1, '1920.00', '1920.00', NULL, '2025-11-21T14:00:00.000Z'),
  (5, 5, 'service_package', 4, '10h Package', 1, '3500.00', '3500.00', NULL, '2025-11-22T08:00:00.000Z'),
  (6, 6, 'service_package', 19, '2h Package', 1, '780.00', '780.00', NULL, '2025-11-23T10:00:00.000Z'),
  (7, 7, 'service_package', 4, '10h Package', 1, '3500.00', '3500.00', NULL, '2025-11-23T15:00:00.000Z'),
  (8, 7, 'product', 4, 'Sunscreen SPF 50', 2, '25.00', '50.00', NULL, '2025-11-23T15:00:00.000Z'),
  (9, 7, 'product', 2, 'Rash Guard', 1, '65.00', '65.00', NULL, '2025-11-23T15:00:00.000Z'),
  (10, 8, 'service', 4, 'Board Rental (by day)', 1, '500.00', '500.00', NULL, '2025-11-24T12:00:00.000Z'),
  (11, 3, 'product', 1, 'Kitesurfing T-Shirt', 1, '45.00', '45.00', NULL, '2025-11-21T09:15:00.000Z'),
  (12, 3, 'service', 3, 'Board Rental (by hour)', 2, '150.00', '300.00', NULL, '2025-11-21T09:15:00.000Z');

-- Table: order_payments
-- 7 row(s)

INSERT INTO order_payments (id, order_id, amount, currency, payment_method_id, occurred_at, created_by, company_account_id, transaction_id, note, created_at) VALUES
  (1, 1, '1520.00', 'BRL', 2, '2025-11-20T10:00:00.000Z', 1, 2, NULL, 'Credit card payment', '2025-11-20T10:00:00.000Z'),
  (2, 2, '2220.00', 'BRL', 1, '2025-11-20T11:00:00.000Z', 1, 1, NULL, 'Cash payment', '2025-11-20T11:00:00.000Z'),
  (3, 3, '1500.00', 'BRL', 2, '2025-11-21T09:00:00.000Z', 1, 2, NULL, 'Partial payment - credit card', '2025-11-21T09:00:00.000Z'),
  (4, 4, '1920.00', 'BRL', 4, '2025-11-21T14:00:00.000Z', 1, 2, NULL, 'Bank transfer', '2025-11-21T14:00:00.000Z'),
  (5, 6, '780.00', 'BRL', 1, '2025-11-23T10:00:00.000Z', 1, 1, NULL, 'Cash payment', '2025-11-23T10:00:00.000Z'),
  (6, 7, '2000.00', 'BRL', 2, '2025-11-23T15:00:00.000Z', 1, 2, NULL, 'Credit card - first payment', '2025-11-23T15:00:00.000Z'),
  (7, 7, '1615.00', 'BRL', 1, '2025-11-23T15:30:00.000Z', 1, 1, NULL, 'Cash - final payment', '2025-11-23T15:30:00.000Z');

-- Table: order_refunds
-- 1 row(s)

INSERT INTO order_refunds (id, order_id, amount, currency, payment_method_id, occurred_at, created_by, company_account_id, transaction_id, note, created_at) VALUES
  (1, 5, '3500.00', 'BRL', 4, '2025-11-22T08:30:00.000Z', 1, 2, NULL, 'Full refund for cancelled order', '2025-11-22T08:30:00.000Z');

-- Table: customer_service_credits
-- 6 row(s)

INSERT INTO customer_service_credits (id, customer_id, order_item_id, service_package_id, service_id, total_hours, total_days, total_months, status, expires_at, created_at, updated_at) VALUES
  (1, 1, 1, 1, 1, '4.00', NULL, NULL, 'active', '2026-11-20T10:00:00.000Z', '2025-11-20T10:00:00.000Z', '2025-11-20T10:00:00.000Z'),
  (2, 2, 2, 2, 1, '6.00', NULL, NULL, 'active', '2026-11-20T11:00:00.000Z', '2025-11-20T11:00:00.000Z', '2025-11-20T11:00:00.000Z'),
  (3, 3, 3, 3, 1, '8.00', NULL, NULL, 'active', '2026-11-21T09:00:00.000Z', '2025-11-21T09:00:00.000Z', '2025-11-21T09:00:00.000Z'),
  (4, 4, 4, 5, 2, '4.00', NULL, NULL, 'active', '2026-11-21T14:00:00.000Z', '2025-11-21T14:00:00.000Z', '2025-11-21T14:00:00.000Z'),
  (5, 6, 6, 19, 1, '2.00', NULL, NULL, 'active', '2026-11-23T10:00:00.000Z', '2025-11-23T10:00:00.000Z', '2025-11-23T10:00:00.000Z'),
  (6, 7, 7, 4, 1, '10.00', NULL, NULL, 'active', '2026-11-23T15:00:00.000Z', '2025-11-23T15:00:00.000Z', '2025-11-23T15:00:00.000Z');

-- Table: scheduled_appointments
-- 10 row(s)

INSERT INTO scheduled_appointments (id, customer_id, service_id, service_package_id, credit_id, order_id, scheduled_start, scheduled_end, duration_hours, duration_days, duration_months, status, instructor_id, staff_id, attendee_name, note, created_at, updated_at, completed_at, cancelled_at, created_by) VALUES
  (1, 1, 1, 1, 1, 1, '2025-11-25T09:00:00.000Z', '2025-11-25T11:00:00.000Z', '2.00', NULL, NULL, 'scheduled', 1, NULL, NULL, 'First lesson', '2025-11-20T10:00:00.000Z', '2025-11-20T10:00:00.000Z', NULL, NULL, 1),
  (2, 1, 1, 1, 1, 1, '2025-11-26T09:00:00.000Z', '2025-11-26T11:00:00.000Z', '2.00', NULL, NULL, 'scheduled', 1, NULL, NULL, 'Second lesson', '2025-11-20T10:00:00.000Z', '2025-11-20T10:00:00.000Z', NULL, NULL, 1),
  (3, 2, 1, 2, 2, 2, '2025-11-25T14:00:00.000Z', '2025-11-25T16:00:00.000Z', '2.00', NULL, NULL, 'completed', 2, NULL, NULL, 'Completed lesson', '2025-11-20T11:00:00.000Z', '2025-11-25T16:00:00.000Z', '2025-11-25T16:00:00.000Z', NULL, 1),
  (4, 2, 1, 2, 2, 2, '2025-11-26T14:00:00.000Z', '2025-11-26T16:00:00.000Z', '2.00', NULL, NULL, 'scheduled', 2, NULL, NULL, NULL, '2025-11-20T11:00:00.000Z', '2025-11-20T11:00:00.000Z', NULL, NULL, 1),
  (5, 3, 1, 3, 3, 3, '2025-11-27T10:00:00.000Z', '2025-11-27T12:00:00.000Z', '2.00', NULL, NULL, 'scheduled', 3, NULL, NULL, NULL, '2025-11-21T09:00:00.000Z', '2025-11-21T09:00:00.000Z', NULL, NULL, 1),
  (6, 4, 2, 5, 4, 4, '2025-11-28T09:00:00.000Z', '2025-11-28T11:00:00.000Z', '2.00', NULL, NULL, 'scheduled', 4, NULL, NULL, 'Wingfoil lesson', '2025-11-21T14:00:00.000Z', '2025-11-21T14:00:00.000Z', NULL, NULL, 1),
  (7, 6, 1, 19, 5, 6, '2025-11-29T08:00:00.000Z', '2025-11-29T10:00:00.000Z', '2.00', NULL, NULL, 'scheduled', 1, NULL, NULL, NULL, '2025-11-23T10:00:00.000Z', '2025-11-23T10:00:00.000Z', NULL, NULL, 1),
  (8, 7, 1, 4, 6, 7, '2025-11-30T09:00:00.000Z', '2025-11-30T11:00:00.000Z', '2.00', NULL, NULL, 'scheduled', 2, NULL, NULL, NULL, '2025-11-23T15:00:00.000Z', '2025-11-23T15:00:00.000Z', NULL, NULL, 1),
  (9, 7, 1, 4, 6, 7, '2025-12-01T09:00:00.000Z', '2025-12-01T11:00:00.000Z', '2.00', NULL, NULL, 'scheduled', 2, NULL, NULL, NULL, '2025-11-23T15:00:00.000Z', '2025-11-23T15:00:00.000Z', NULL, NULL, 1),
  (10, 8, 4, NULL, NULL, 8, '2025-11-25T08:00:00.000Z', '2025-11-26T08:00:00.000Z', NULL, '1.00', NULL, 'scheduled', NULL, 3, NULL, 'Board rental', '2025-11-24T12:00:00.000Z', '2025-11-24T12:00:00.000Z', NULL, NULL, 1);

-- Table: feedback
-- No data found

-- Table: sessions
-- 21 row(s)

INSERT INTO sessions (id, user_id, session_token, expires_at, created_at) VALUES
  (4, 1, '53bab3bd601a6abce2f57146e5f712ed42f90387c2068e20721a79c1a5b2aa61', '2025-12-22T15:45:57.407Z', '2025-11-22T15:45:57.008Z'),
  (5, 1, '831e9a61c97caa876351f7fa31781e8efd3f3fa1fb75e3e461a0402f7ff5646c', '2025-12-22T20:45:58.444Z', '2025-11-22T20:45:57.404Z'),
  (6, 1, '53fafb4d58806dcf44886416a596c866544b866d6499b70faf4047a66807c653', '2025-12-22T23:49:07.547Z', '2025-11-22T23:49:07.270Z'),
  (7, 1, '462b2eb59efcdfbd84f3cd4d79ef1b0cdae36d5c72ee73026e14f2f557db5444', '2025-12-22T23:51:52.353Z', '2025-11-22T23:51:52.070Z'),
  (8, 1, '5bef8a57f09589bf44ed6573a909c119af3cde7d9838813ef854089987518609', '2025-12-23T00:36:14.587Z', '2025-11-23T00:36:14.211Z'),
  (9, 1, '55ee7da060dbd6e7e0b259e08c09576c37a78ecfa7dffcd168494d4257c86d5f', '2025-12-23T02:25:34.628Z', '2025-11-23T02:25:34.156Z'),
  (10, 1, 'ab98889bd89a56b4602063d2751d38394e319a30184176bd814b1a05e7167c87', '2025-12-23T02:34:28.351Z', '2025-11-23T02:34:27.929Z'),
  (11, 1, '9df5c127d2956d132a63a566455fc8b7740f851873459f18ee81b6bc2a0eb7c7', '2025-12-23T02:46:40.451Z', '2025-11-23T02:46:40.087Z'),
  (12, 1, '717b37d0f1cac5d0ccabb6aef53223b48a177f8e7c5885f98a9eb44559150e2c', '2025-12-23T03:00:53.923Z', '2025-11-23T03:00:53.595Z'),
  (13, 1, '729d318a291d873a5be3dbb988d38a942048b1c4b89d611a49cea53e6a6d6401', '2025-12-23T03:32:53.273Z', '2025-11-23T03:32:52.983Z'),
  (14, 1, '541aa3e2c2a0b0a9260c76ddefd4da2a3993b53b3817dba6bf76bf84399e062e', '2025-12-23T04:08:41.546Z', '2025-11-23T04:08:41.241Z'),
  (15, 1, '7771b716251ee403c4253c870f5d6e9fc4129aa24727ff7355160a17f5e63a9b', '2025-12-23T04:12:56.581Z', '2025-11-23T04:12:56.273Z'),
  (20, 1, '7d0618a4012b5d5dc4ee0bcf14e61d0076a251c4b68df3c2e5bfdd66d6775490', '2025-12-23T04:37:06.943Z', '2025-11-23T04:37:06.602Z'),
  (22, 1, '40c0bd4d22836bb853fe0061d1d1d708e61e86d53961e7ebbac666289489fbad', '2025-12-23T18:17:23.871Z', '2025-11-23T18:17:23.534Z'),
  (23, 3, 'e4de7d8179e6e0eb15306fa45c7fdd5d7a3450e2f1b304e54bf75a7e1dc59efc', '2025-12-23T19:08:12.221Z', '2025-11-23T19:08:12.415Z'),
  (24, 1, 'ad4ed9b0f73a1ddf377d128f74f215874a2a525634cbd5f936c03304f0e09090', '2025-12-23T20:44:06.403Z', '2025-11-23T20:44:05.985Z'),
  (26, 3, '695838285fbe1161bc087c6166afa0d618858c4fccfa5aa180e86d5008c43240', '2025-12-23T22:00:42.205Z', '2025-11-23T22:00:42.334Z'),
  (27, 1, 'c45a415800c86b04dd74912e5016cb755a29567f35320e010fa11ee0df59b55a', '2025-12-24T03:00:16.556Z', '2025-11-24T03:00:16.354Z'),
  (29, 1, 'c75f84f5f269ec9f20f29f180a46ea52905eb5bbcfc2b72598a22aa9d365f461', '2025-12-25T19:08:37.231Z', '2025-11-25T19:08:36.719Z'),
  (30, 1, 'baacd73d94da095f4d417665c450b1fbbb69602e5a0135d1c04df5d3f4f2206d', '2025-12-25T19:12:24.571Z', '2025-11-25T19:12:24.051Z'),
  (31, 1, '99d36e5482df15c266f41c5541f9968c9b4dcb69fd027ecc38854a9776ffe653', '2025-12-25T19:13:45.722Z', '2025-11-25T19:13:45.200Z');

COMMIT;

-- ============================================
-- END OF SEED DATA
-- ============================================
