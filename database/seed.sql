-- ============================================
-- FRESH SEED DATA FOR KSMANAGER
-- ============================================
-- This file contains fresh seed data for all tables (except users)
-- All IDs start from 1
-- Generated: 2025-11-22T20:37:00.246Z
-- ============================================

-- ============================================
-- SERVICE CATEGORIES
-- ============================================

INSERT INTO service_categories (id, name, description, created_at) VALUES
(1, 'Lessons', 'Kitesurfing lesson services', NOW()),
(2, 'Rental', 'Equipment rental services', NOW()),
(3, 'Storage', 'Equipment storage services', NOW()),
(4, 'Downwinds', 'Downwinder tour services', NOW());

-- ============================================
-- SERVICES
-- ============================================

INSERT INTO services (id, category_id, name, description, base_price, currency, is_active, created_at, updated_at, duration_unit) VALUES
(1, 1, 'Kitesurf Private Lessons', 'One-on-one private kitesurf lessons', 390.00, 'BRL', TRUE, NOW(), NOW(), 'hours'),
(2, 1, 'Wingfoil Private Lessons', 'One-on-one Wingfoil Private Lessons', 490.00, 'BRL', TRUE, NOW(), NOW(), 'hours'),
(3, 2, 'Board Rental (by hour)', 'Board rental per hour', 150.00, 'BRL', TRUE, NOW(), NOW(), 'hours'),
(4, 2, 'Board Rental (by day)', 'Board rental per day', 500.00, 'BRL', TRUE, NOW(), NOW(), 'days'),
(5, 3, 'Individual Private Storage', 'Private storage for equipment', 150.00, 'BRL', TRUE, NOW(), NOW(), 'days');

-- ============================================
-- SERVICE PACKAGES
-- ============================================

INSERT INTO service_packages (id, service_id, name, duration_hours, price, currency, description, is_active, created_at, updated_at, duration_days, duration_months) VALUES
(1, 1, '4h Package', 4.00, 1520.00, 'BRL', NULL, TRUE, NOW(), NOW(), NULL, NULL),
(2, 1, '6h Package', 6.00, 2220.00, 'BRL', NULL, TRUE, NOW(), NOW(), NULL, NULL),
(3, 1, '8h Package', 8.00, 2880.00, 'BRL', NULL, TRUE, NOW(), NOW(), NULL, NULL),
(4, 1, '10h Package', 10.00, 3500.00, 'BRL', NULL, TRUE, NOW(), NOW(), NULL, NULL),
(5, 2, '4h Package', 4.00, 1920.00, 'BRL', NULL, TRUE, NOW(), NOW(), NULL, NULL),
(6, 2, '6h Package', 6.00, 2820.00, 'BRL', NULL, TRUE, NOW(), NOW(), NULL, NULL),
(7, 2, '8h Package', 8.00, 3680.00, 'BRL', NULL, TRUE, NOW(), NOW(), NULL, NULL),
(8, 2, '10h Package', 10.00, 4500.00, 'BRL', NULL, TRUE, NOW(), NOW(), NULL, NULL);

-- ============================================
-- PRODUCT CATEGORIES
-- ============================================

INSERT INTO product_categories (id, name, description, created_at) VALUES
(1, 'Clothing', 'Kitesurfing apparel and clothing', NOW()),
(2, 'Sun Protection', 'Sunscreen and sun protection items', NOW()),
(3, 'Equipment', 'Kitesurfing equipment and accessories', NOW()),
(4, 'Accessories', 'Miscellaneous kitesurfing accessories', NOW());

-- ============================================
-- PRODUCTS
-- ============================================

INSERT INTO products (id, category_id, name, description, price, currency, sku, stock_quantity, is_active, created_at, updated_at) VALUES
(1, 1, 'Kitesurfing T-Shirt', 'Branded kitesurfing t-shirt', 45.00, 'BRL', 'TSH-001', 50, TRUE, NOW(), NOW()),
(2, 1, 'Rash Guard', 'UV protection rash guard', 65.00, 'BRL', 'RASH-001', 30, TRUE, NOW(), NOW()),
(3, 1, 'Board Shorts', 'Quick-dry board shorts', 85.00, 'BRL', 'SHORT-001', 40, TRUE, NOW(), NOW()),
(4, 2, 'Sunscreen SPF 50', 'Waterproof sunscreen 100ml', 25.00, 'BRL', 'SPF-001', 100, TRUE, NOW(), NOW()),
(5, 2, 'Sunscreen SPF 30', 'Waterproof sunscreen 100ml', 20.00, 'BRL', 'SPF-002', 80, TRUE, NOW(), NOW()),
(6, 2, 'Sun Hat', 'Wide-brim sun hat', 35.00, 'BRL', 'HAT-001', 25, TRUE, NOW(), NOW()),
(7, 3, 'Kite Repair Kit', 'Essential repair tools and patches', 35.00, 'BRL', 'REP-001', 30, TRUE, NOW(), NOW()),
(8, 3, 'Pump Adapter', 'Pump adapter for kite inflation', 15.00, 'BRL', 'PUMP-001', 50, TRUE, NOW(), NOW()),
(9, 3, 'Safety Leash', 'Kite safety leash', 45.00, 'BRL', 'LEASH-001', 20, TRUE, NOW(), NOW()),
(10, 4, 'Waterproof Phone Case', 'Waterproof case for phone', 30.00, 'BRL', 'CASE-001', 40, TRUE, NOW(), NOW()),
(11, 4, 'GoPro Mount', 'Mount for action camera', 25.00, 'BRL', 'MOUNT-001', 30, TRUE, NOW(), NOW()),
(12, 4, 'Towel', 'Quick-dry microfiber towel', 20.00, 'BRL', 'TOWEL-001', 60, TRUE, NOW(), NOW());

-- ============================================
-- PAYMENT METHODS
-- ============================================

INSERT INTO payment_methods (id, name, description, created_at, updated_at) VALUES
(1, 'Cash', 'Cash payments', NOW(), NOW()),
(2, 'Credit Card', 'Credit card transactions', NOW(), NOW()),
(3, 'Debit Card', 'Debit card transactions', NOW(), NOW()),
(4, 'Bank Transfer', 'Wire transfer or bank transfer', NOW(), NOW()),
(5, 'PayPal', 'PayPal online payments', NOW(), NOW()),
(6, 'Stripe', 'Stripe payment gateway', NOW(), NOW()),
(7, 'Check', 'Check payments', NOW(), NOW()),
(8, 'Cryptocurrency', 'Cryptocurrency payments', NOW(), NOW());

-- ============================================
-- TRANSACTION TYPES
-- ============================================

INSERT INTO transaction_types (id, code, label, direction, description, created_at, updated_at) VALUES
(1, 'CUSTOMER_PAYMENT', 'Customer Payment', 'income', 'Customer payment for lessons and services', NOW(), NOW()),
(2, 'INSTRUCTOR_SALARY', 'Instructor Salary', 'expense', 'Payment of salaries to instructors', NOW(), NOW()),
(3, 'STAFF_SALARY', 'Staff Salary', 'expense', 'Payment of salaries to staff members', NOW(), NOW()),
(4, 'COMPANY_TRANSFER', 'Company to Company Transfer', 'transfer', 'Transfer between company accounts', NOW(), NOW()),
(5, 'CUSTOMER_REFUND', 'Customer Refund', 'expense', 'Refund to customers for cancelled services', NOW(), NOW()),
(6, 'AGENCY_COMMISSION', 'Agency Commission', 'expense', 'Commission payment to agencies', NOW(), NOW()),
(7, 'THIRD_PARTY_PAYMENT', 'Third Party Payment', 'expense', 'Payment to third party suppliers or services', NOW(), NOW()),
(8, 'RENTAL_PAYMENT', 'Rental Payment', 'income', 'Customer payment for equipment rental', NOW(), NOW()),
(9, 'SHOP_MAINTENANCE', 'Shop Maintenance', 'expense', 'Maintenance costs for shop facilities', NOW(), NOW()),
(10, 'EQUIPMENT_REPAIR', 'Equipment Repair', 'expense', 'Repair costs for kitesurfing equipment', NOW(), NOW());

-- ============================================
-- COMPANY ACCOUNTS
-- ============================================

INSERT INTO company_accounts (id, name, details, note) VALUES
(1, 'Cashier', 'Caixa registradora - dinheiro em espécie', 'Caixa para pagamentos em dinheiro'),
(2, 'Banco do Brasil', 'Banco: Banco do Brasil, Agência: 1234-5, Conta: 12345-6, CPF/CNPJ: 12.345.678/0001-90', 'Conta corrente principal'),
(3, 'Bradesco', 'Banco: Bradesco, Agência: 5678-9, Conta: 98765-4, CPF/CNPJ: 12.345.678/0001-90', 'Conta corrente secundária');

-- ============================================
-- HOTELS
-- ============================================

INSERT INTO hotels (id, name, phone, address, note, created_at, updated_at) VALUES
(1, 'Pousada Atins', '+55 98 99123-1001', 'Rua Principal, Atins, MA', 'Beachfront pousada', NOW(), NOW()),
(2, 'Hotel Lençóis', '+55 98 99123-1002', 'Av. Principal, Barreirinhas, MA', 'Near Lençóis Maranhenses', NOW(), NOW()),
(3, 'Atins Beach Resort', '+55 98 99123-1003', 'Praia de Atins, Atins, MA', 'Luxury beach resort', NOW(), NOW()),
(4, 'Pousada do Vento', '+55 98 99123-1004', 'Rua do Kite, Atins, MA', 'Kitesurf friendly', NOW(), NOW()),
(5, 'Hotel Maré', '+55 98 99123-1005', 'Centro, Barreirinhas, MA', 'City center hotel', NOW(), NOW());

-- ============================================
-- AGENCIES
-- ============================================

INSERT INTO agencies (id, name, phone, email, commission, note, created_at, updated_at) VALUES
(1, 'Brasil Planet Turismo', '+55 98 98831-6668', 'info@brasilplanet.com.br', 15.00, 'Transporte e turismo em Barreirinhas', NOW(), NOW()),
(2, 'Atins Kiteboarding (AKB)', '+55 98 99171-7120', 'contato@atinskiteboarding.com.br', 18.00, 'Especialista em kitesurf em Atins', NOW(), NOW()),
(3, 'Aquarela Travel', '+55 98 99171-7121', 'info@aquarelatravel.com.br', 12.50, 'Serviços de viagem diversos', NOW(), NOW()),
(4, 'Atins Adventure', '+55 98 99123-5001', 'hello@atinsadventure.com.br', 17.00, 'Aventuras e expedições', NOW(), NOW()),
(5, 'Lençóis Maranhenses Tour', '+55 98 99123-5002', 'contato@lencoismaranhensestour.com.br', 16.00, 'Tours no Parque Nacional', NOW(), NOW());

-- ============================================
-- THIRD PARTIES CATEGORIES
-- ============================================

INSERT INTO third_parties_categories (id, name, description) VALUES
(1, 'Transport Services', 'Transfer and taxi companies for customer transportation'),
(2, 'Mechanics', 'Equipment repair and maintenance mechanics'),
(3, 'Downwinder Guides', 'Professional guides for downwinder tours');

-- ============================================
-- THIRD PARTIES
-- ============================================

INSERT INTO third_parties (id, name, category_id, phone, email, note, created_at, updated_at) VALUES
(1, 'Atins Transfer', 1, '+55 98 99123-6001', 'transfer@atins.com.br', 'Transfer service from airport to Atins', NOW(), NOW()),
(2, 'Táxi Atins', 1, '+55 98 99123-6002', 'taxi@atins.com.br', 'Taxi service in Atins and Barreirinhas', NOW(), NOW()),
(3, 'Mecânica do João', 2, '+55 98 99123-6101', 'joao@mecanicaatins.com.br', 'Kite and equipment repair specialist', NOW(), NOW()),
(4, 'Downwinder Guide Atins', 3, '+55 98 99123-6201', 'guide@downwinderatins.com.br', 'Professional downwinder guide services', NOW(), NOW());

-- ============================================
-- INSTRUCTORS
-- ============================================

INSERT INTO instructors (id, fullname, phone, email, bankdetail, hourlyrate, commission, monthlyfix, note, created_at, updated_at) VALUES
(1, 'Carlos Silva', '+55 98 99123-3001', 'carlos.silva@kiteschool.com', 'Banco do Brasil, Agência: 1234-5, Conta: 11111-1', 45.00, 20.00, 2000.00, 'Instrutor brasileiro experiente, 10+ anos', NOW(), NOW()),
(2, 'Mike Johnson', '+1 555-3002', 'mike.johnson@kiteschool.com', 'Bank: Chase, Account: 1234567890', 42.00, 18.00, 1800.00, 'Senior instructor from USA, IKO certified', NOW(), NOW()),
(3, 'Sarah Williams', '+1 555-3003', 'sarah.williams@kiteschool.com', 'Bank: Bank of America, Account: 9876543210', 40.00, 20.00, 1500.00, 'Advanced lessons specialist', NOW(), NOW()),
(4, 'Tom Rodriguez', '+34 91 123 4567', 'tom.rodriguez@kiteschool.com', 'Bank: BBVA, Account: 5555555555', 38.00, 15.00, 1600.00, 'Beginner-friendly instructor from Spain', NOW(), NOW()),
(5, 'Emma Davis', '+44 20 7946 0959', 'emma.davis@kiteschool.com', 'Bank: HSBC, Account: 1111222233', 43.00, 22.00, 1900.00, 'Youth programs coordinator from UK', NOW(), NOW());

-- ============================================
-- STAFF
-- ============================================

INSERT INTO staff (id, fullname, role, phone, email, bankdetail, hourlyrate, commission, monthlyfix, note, created_at, updated_at) VALUES
(1, 'João Silva', 'Manager', '+55 98 99123-4001', 'joao.silva@kiteschool.com', 'Banco do Brasil, Agência: 1234-5, Conta: 30000-1', 35.00, 10.00, 3500.00, 'Gerente de operações', NOW(), NOW()),
(2, 'Maria Santos', 'Receptionist', '+55 98 99123-4002', 'maria.santos@kiteschool.com', 'Banco do Brasil, Agência: 1234-5, Conta: 30000-2', 18.00, 5.00, 2800.00, 'Recepcionista e atendimento', NOW(), NOW()),
(3, 'Pedro Oliveira', 'Beach Boy', '+55 98 99123-4003', 'pedro.oliveira@kiteschool.com', 'Banco do Brasil, Agência: 1234-5, Conta: 30000-3', 15.00, 3.00, 2400.00, 'Equipamentos e praia', NOW(), NOW());

-- ============================================
-- CUSTOMERS (50 customers)
-- ============================================

INSERT INTO customers (id, fullname, phone, email, doctype, doc, country, birthdate, note, hotel_id, agency_id, created_at, updated_at) VALUES
(1, 'James Anderson', '+1 555-2001', 'james.anderson@email.com', 'passport', 'US123456789', 'USA', '1985-03-15', NULL, 1, 1, NOW(), NOW()),
(2, 'Sophia Martinez', '+1 555-2002', 'sophia.martinez@email.com', 'passport', 'MX321654987', 'Mexico', '1995-05-18', NULL, 2, 2, NOW(), NOW()),
(3, 'Thomas Müller', '+49 30 12345678', 'thomas.mueller@email.com', 'passport', 'DE987654321', 'Germany', '1990-07-22', NULL, 3, 3, NOW(), NOW()),
(4, 'Emma Wilson', '+44 20 7946 0958', 'emma.wilson@email.com', 'passport', 'GB456789123', 'UK', '1992-01-30', NULL, 4, 4, NOW(), NOW()),
(5, 'Pierre Dubois', '+33 1 42 86 83 26', 'pierre.dubois@email.com', 'passport', 'FR369258147', 'France', '1989-04-20', NULL, 5, 5, NOW(), NOW()),
(6, 'Isabella Rossi', '+39 06 12345678', 'isabella.rossi@email.com', 'passport', 'IT741852963', 'Italy', '1994-10-07', NULL, 1, 1, NOW(), NOW()),
(7, 'David Chen', '+86 10 12345678', 'david.chen@email.com', 'passport', 'CN123456789', 'China', '1988-11-05', NULL, 2, 2, NOW(), NOW()),
(8, 'Olivia Smith', '+61 2 9374 4000', 'olivia.smith@email.com', 'passport', 'AU147258369', 'Australia', '1991-08-03', NULL, 3, 3, NOW(), NOW()),
(9, 'Lucas Santos', '+55 11 98765-4321', 'lucas.santos@email.com', 'passport', 'BR963741852', 'Brazil', '1984-11-11', NULL, 4, 4, NOW(), NOW()),
(10, 'Amelia Brown', '+64 9 123 4567', 'amelia.brown@email.com', 'passport', 'NZ159753468', 'New Zealand', '1996-09-23', NULL, 5, 5, NOW(), NOW()),
(11, 'Mateo Rodriguez', '+57 1 234 5678', 'mateo.rodriguez@email.com', 'passport', 'CO741963258', 'Colombia', '1995-02-22', NULL, 1, 1, NOW(), NOW()),
(12, 'Chloe Thompson', '+1 416 555 1234', 'chloe.thompson@email.com', 'passport', 'CA789123456', 'Canada', '1993-08-27', NULL, 2, 2, NOW(), NOW()),
(13, 'Yuki Tanaka', '+81 3 1234 5678', 'yuki.tanaka@email.com', 'passport', 'JP963852741', 'Japan', '1996-04-19', NULL, 3, 3, NOW(), NOW()),
(14, 'Liam O''Connor', '+353 1 234 5678', 'liam.oconnor@email.com', 'passport', 'IE852147963', 'Ireland', '1997-01-24', NULL, 4, 4, NOW(), NOW()),
(15, 'Nora Johansson', '+46 8 123 456 78', 'nora.johansson@email.com', 'passport', 'SE741963852', 'Sweden', '1994-05-16', NULL, 5, 5, NOW(), NOW()),
(16, 'Michael Johnson', '+1 555-2016', 'michael.johnson@email.com', 'passport', 'US234567890', 'USA', '1987-12-08', NULL, 1, 1, NOW(), NOW()),
(17, 'Anna Kowalski', '+48 22 1234567', 'anna.kowalski@email.com', 'passport', 'PL963741258', 'Poland', '1993-06-26', NULL, 2, 2, NOW(), NOW()),
(18, 'Sebastian Schmidt', '+49 30 87654321', 'sebastian.schmidt@email.com', 'passport', 'DE876543210', 'Germany', '1992-09-06', NULL, 3, 3, NOW(), NOW()),
(19, 'Grace Scott', '+44 20 7946 0959', 'grace.scott@email.com', 'passport', 'GB567890123', 'UK', '1997-01-24', NULL, 4, 4, NOW(), NOW()),
(20, 'Luis Fernandez', '+34 91 234 5678', 'luis.fernandez@email.com', 'passport', 'ES987654321', 'Spain', '1991-12-15', NULL, 5, 5, NOW(), NOW()),
(21, 'Maria Garcia', '+34 91 345 6789', 'maria.garcia@email.com', 'passport', 'ES876543210', 'Spain', '1990-07-22', NULL, 1, 1, NOW(), NOW()),
(22, 'Alexander Petrov', '+7 495 1234567', 'alexander.petrov@email.com', 'passport', 'RU963741852', 'Russia', '1986-07-31', NULL, 2, 2, NOW(), NOW()),
(23, 'Eva Andersson', '+46 8 234 567 89', 'eva.andersson@email.com', 'passport', 'SE654321987', 'Sweden', '1993-03-21', NULL, 3, 3, NOW(), NOW()),
(24, 'Daniel White', '+1 555-2024', 'daniel.white@email.com', 'passport', 'US345678901', 'USA', '1989-08-30', NULL, 4, 4, NOW(), NOW()),
(25, 'Camille Martin', '+33 1 42 86 83 27', 'camille.martin@email.com', 'passport', 'FR258147369', 'France', '1995-05-16', NULL, 5, 5, NOW(), NOW()),
(26, 'Marco Bianchi', '+39 06 23456789', 'marco.bianchi@email.com', 'passport', 'IT852963741', 'Italy', '1992-11-09', NULL, 1, 1, NOW(), NOW()),
(27, 'Sarah O''Brien', '+353 1 345 6789', 'sarah.obrien@email.com', 'passport', 'IE741852963', 'Ireland', '1994-02-13', NULL, 2, 2, NOW(), NOW()),
(28, 'Hiroshi Yamamoto', '+81 3 2345 6789', 'hiroshi.yamamoto@email.com', 'passport', 'JP852741963', 'Japan', '1988-04-20', NULL, 3, 3, NOW(), NOW()),
(29, 'Olivia Brown', '+61 2 9374 4001', 'olivia.brown@email.com', 'passport', 'AU258369147', 'Australia', '1996-10-07', NULL, 4, 4, NOW(), NOW()),
(30, 'Sofia Hernandez', '+57 1 345 6789', 'sofia.hernandez@email.com', 'passport', 'CO852741963', 'Colombia', '1997-07-09', NULL, 5, 5, NOW(), NOW()),
(31, 'Benjamin Lee', '+86 10 23456789', 'benjamin.lee@email.com', 'passport', 'CN234567890', 'China', '1991-01-17', NULL, 1, 1, NOW(), NOW()),
(32, 'Charlotte Taylor', '+1 555-2032', 'charlotte.taylor@email.com', 'passport', 'US456789012', 'USA', '1994-08-27', NULL, 2, 2, NOW(), NOW()),
(33, 'Lucas Fernandez', '+34 91 456 7890', 'lucas.fernandez@email.com', 'passport', 'ES765432109', 'Spain', '1993-05-14', NULL, 3, 3, NOW(), NOW()),
(34, 'Emma Thompson', '+44 20 7946 0960', 'emma.thompson@email.com', 'passport', 'GB678901234', 'UK', '1995-09-11', NULL, 4, 4, NOW(), NOW()),
(35, 'Maximilian Weber', '+49 30 98765432', 'maximilian.weber@email.com', 'passport', 'DE765432109', 'Germany', '1990-12-25', NULL, 5, 5, NOW(), NOW()),
(36, 'Isabella Costa', '+55 11 98765-4322', 'isabella.costa@email.com', 'passport', 'BR852963741', 'Brazil', '1992-06-18', NULL, 1, 1, NOW(), NOW()),
(37, 'Ryan Murphy', '+1 555-2037', 'ryan.murphy@email.com', 'passport', 'US567890123', 'USA', '1988-03-22', NULL, 2, 2, NOW(), NOW()),
(38, 'Sophie Laurent', '+33 1 42 86 83 28', 'sophie.laurent@email.com', 'passport', 'FR147258369', 'France', '1994-11-05', NULL, 3, 3, NOW(), NOW()),
(39, 'Giovanni Romano', '+39 06 34567890', 'giovanni.romano@email.com', 'passport', 'IT963741852', 'Italy', '1991-08-19', NULL, 4, 4, NOW(), NOW()),
(40, 'Hannah Schmidt', '+49 30 11111111', 'hannah.schmidt@email.com', 'passport', 'DE654321098', 'Germany', '1996-02-28', NULL, 5, 5, NOW(), NOW()),
(41, 'James Wilson', '+1 555-2041', 'james.wilson@email.com', 'passport', 'US678901234', 'USA', '1991-12-15', NULL, 1, 1, NOW(), NOW()),
(42, 'Maria Rodriguez', '+34 91 567 8901', 'maria.rodriguez@email.com', 'passport', 'ES654321098', 'Spain', '1993-07-08', NULL, 2, 2, NOW(), NOW()),
(43, 'Oliver Brown', '+44 20 7946 0961', 'oliver.brown@email.com', 'passport', 'GB789012345', 'UK', '1995-04-12', NULL, 3, 3, NOW(), NOW()),
(44, 'Lina Andersson', '+46 8 345 678 90', 'lina.andersson@email.com', 'passport', 'SE543210987', 'Sweden', '1992-10-30', NULL, 4, 4, NOW(), NOW()),
(45, 'Thomas Anderson', '+1 555-2045', 'thomas.anderson@email.com', 'passport', 'US789012345', 'USA', '1989-01-17', NULL, 5, 5, NOW(), NOW()),
(46, 'Elena Petrov', '+7 495 2345678', 'elena.petrov@email.com', 'passport', 'RU852741963', 'Russia', '1994-06-24', NULL, 1, 1, NOW(), NOW()),
(47, 'Luca Bianchi', '+39 06 45678901', 'luca.bianchi@email.com', 'passport', 'IT741852963', 'Italy', '1993-09-03', NULL, 2, 2, NOW(), NOW()),
(48, 'Amelie Dubois', '+33 1 42 86 83 29', 'amelie.dubois@email.com', 'passport', 'FR258369147', 'France', '1996-12-20', NULL, 3, 3, NOW(), NOW()),
(49, 'Noah Johnson', '+1 555-2049', 'noah.johnson@email.com', 'passport', 'US890123456', 'USA', '1992-05-07', NULL, 4, 4, NOW(), NOW()),
(50, 'Mia Williams', '+61 2 9374 4002', 'mia.williams@email.com', 'passport', 'AU369147258', 'Australia', '1995-11-14', NULL, 5, 5, NOW(), NOW());

-- ============================================
-- ORDERS (50 orders)
-- ============================================

INSERT INTO orders (id, order_number, customer_id, status, subtotal, tax_amount, discount_amount, total_amount, currency, total_paid, balance_due, created_at, updated_at, closed_at, cancelled_at, agency_id, created_by, note) VALUES
(1, 'ORD-2025-000001', 31, 'closed', 450.00, 0.00, 0.00, 450.00, 'BRL', 450.00, 0.00, '2025-11-15T11:00:00.000Z', '2025-11-15T11:00:00.000Z', '2025-11-15T13:00:00.000Z', NULL, 4, NULL, NULL),
(2, 'ORD-2025-000002', 47, 'closed', 3500.00, 0.00, 0.00, 3500.00, 'BRL', 3500.00, 0.00, '2025-11-15T12:00:00.000Z', '2025-11-15T12:00:00.000Z', '2025-11-15T14:00:00.000Z', NULL, 2, NULL, NULL),
(3, 'ORD-2025-000003', 32, 'closed', 150.00, 0.00, 0.00, 150.00, 'BRL', 150.00, 0.00, '2025-11-15T13:00:00.000Z', '2025-11-15T13:00:00.000Z', '2025-11-15T15:00:00.000Z', NULL, 3, NULL, NULL),
(4, 'ORD-2025-000004', 21, 'closed', 2820.00, 0.00, 0.00, 2820.00, 'BRL', 2820.00, 0.00, '2025-11-15T14:00:00.000Z', '2025-11-15T14:00:00.000Z', '2025-11-15T16:00:00.000Z', NULL, 3, NULL, NULL),
(5, 'ORD-2025-000005', 48, 'closed', 1520.00, 0.00, 0.00, 1520.00, 'BRL', 1520.00, 0.00, '2025-11-15T15:00:00.000Z', '2025-11-15T15:00:00.000Z', '2025-11-15T17:00:00.000Z', NULL, 1, NULL, NULL),
(6, 'ORD-2025-000006', 39, 'closed', 3500.00, 0.00, 0.00, 3500.00, 'BRL', 3500.00, 0.00, '2025-11-16T16:00:00.000Z', '2025-11-16T16:00:00.000Z', '2025-11-16T18:00:00.000Z', NULL, NULL, NULL, NULL),
(7, 'ORD-2025-000007', 47, 'closed', 3500.00, 0.00, 0.00, 3500.00, 'BRL', 3500.00, 0.00, '2025-11-16T17:00:00.000Z', '2025-11-16T17:00:00.000Z', '2025-11-16T19:00:00.000Z', NULL, 1, NULL, NULL),
(8, 'ORD-2025-000008', 16, 'closed', 2820.00, 0.00, 0.00, 2820.00, 'BRL', 2820.00, 0.00, '2025-11-16T18:00:00.000Z', '2025-11-16T18:00:00.000Z', '2025-11-16T20:00:00.000Z', NULL, NULL, NULL, NULL),
(9, 'ORD-2025-000009', 44, 'closed', 2220.00, 0.00, 0.00, 2220.00, 'BRL', 2220.00, 0.00, '2025-11-16T11:00:00.000Z', '2025-11-16T11:00:00.000Z', '2025-11-16T13:00:00.000Z', NULL, 5, NULL, NULL),
(10, 'ORD-2025-000010', 50, 'closed', 1520.00, 0.00, 0.00, 1520.00, 'BRL', 1520.00, 0.00, '2025-11-16T12:00:00.000Z', '2025-11-16T12:00:00.000Z', '2025-11-16T14:00:00.000Z', NULL, 3, NULL, NULL),
(11, 'ORD-2025-000011', 35, 'closed', 1920.00, 0.00, 0.00, 1920.00, 'BRL', 1920.00, 0.00, '2025-11-17T13:00:00.000Z', '2025-11-17T13:00:00.000Z', '2025-11-17T15:00:00.000Z', NULL, NULL, NULL, NULL),
(12, 'ORD-2025-000012', 19, 'closed', 500.00, 0.00, 0.00, 500.00, 'BRL', 500.00, 0.00, '2025-11-17T14:00:00.000Z', '2025-11-17T14:00:00.000Z', '2025-11-17T16:00:00.000Z', NULL, 3, NULL, NULL),
(13, 'ORD-2025-000013', 10, 'cancelled', 500.00, 0.00, 0.00, 500.00, 'BRL', 0.00, 500.00, '2025-11-17T15:00:00.000Z', '2025-11-17T15:00:00.000Z', NULL, '2025-11-17T16:00:00.000Z', NULL, NULL, NULL),
(14, 'ORD-2025-000014', 6, 'closed', 1920.00, 0.00, 0.00, 1920.00, 'BRL', 1920.00, 0.00, '2025-11-17T16:00:00.000Z', '2025-11-17T16:00:00.000Z', '2025-11-17T18:00:00.000Z', NULL, 3, NULL, NULL),
(15, 'ORD-2025-000015', 40, 'closed', 2880.00, 0.00, 0.00, 2880.00, 'BRL', 2880.00, 0.00, '2025-11-17T17:00:00.000Z', '2025-11-17T17:00:00.000Z', '2025-11-17T19:00:00.000Z', NULL, 1, NULL, NULL),
(16, 'ORD-2025-000016', 43, 'open', 4500.00, 0.00, 0.00, 4500.00, 'BRL', 82.00, 4418.00, '2025-11-18T18:00:00.000Z', '2025-11-18T18:00:00.000Z', NULL, NULL, NULL, NULL, NULL),
(17, 'ORD-2025-000017', 39, 'closed', 3500.00, 0.00, 0.00, 3500.00, 'BRL', 3500.00, 0.00, '2025-11-18T11:00:00.000Z', '2025-11-18T11:00:00.000Z', '2025-11-18T13:00:00.000Z', NULL, 4, NULL, NULL),
(18, 'ORD-2025-000018', 12, 'closed', 1520.00, 0.00, 0.00, 1520.00, 'BRL', 1520.00, 0.00, '2025-11-18T12:00:00.000Z', '2025-11-18T12:00:00.000Z', '2025-11-18T14:00:00.000Z', NULL, 2, NULL, NULL),
(19, 'ORD-2025-000019', 38, 'closed', 1920.00, 0.00, 0.00, 1920.00, 'BRL', 1920.00, 0.00, '2025-11-18T13:00:00.000Z', '2025-11-18T13:00:00.000Z', '2025-11-18T15:00:00.000Z', NULL, 2, NULL, NULL),
(20, 'ORD-2025-000020', 21, 'closed', 390.00, 0.00, 0.00, 390.00, 'BRL', 390.00, 0.00, '2025-11-18T14:00:00.000Z', '2025-11-18T14:00:00.000Z', '2025-11-18T16:00:00.000Z', NULL, NULL, NULL, NULL),
(21, 'ORD-2025-000021', 25, 'closed', 1920.00, 0.00, 0.00, 1920.00, 'BRL', 1920.00, 0.00, '2025-11-19T15:00:00.000Z', '2025-11-19T15:00:00.000Z', '2025-11-19T17:00:00.000Z', NULL, 2, NULL, NULL),
(22, 'ORD-2025-000022', 17, 'closed', 1170.00, 0.00, 0.00, 1170.00, 'BRL', 1170.00, 0.00, '2025-11-19T16:00:00.000Z', '2025-11-19T16:00:00.000Z', '2025-11-19T18:00:00.000Z', NULL, NULL, NULL, NULL),
(23, 'ORD-2025-000023', 38, 'closed', 780.00, 0.00, 0.00, 780.00, 'BRL', 780.00, 0.00, '2025-11-19T17:00:00.000Z', '2025-11-19T17:00:00.000Z', '2025-11-19T19:00:00.000Z', NULL, 1, NULL, NULL),
(24, 'ORD-2025-000024', 4, 'cancelled', 600.00, 0.00, 0.00, 600.00, 'BRL', 0.00, 600.00, '2025-11-19T18:00:00.000Z', '2025-11-19T18:00:00.000Z', NULL, '2025-11-19T19:00:00.000Z', 2, NULL, NULL),
(25, 'ORD-2025-000025', 48, 'closed', 2220.00, 0.00, 0.00, 2220.00, 'BRL', 2220.00, 0.00, '2025-11-19T11:00:00.000Z', '2025-11-19T11:00:00.000Z', '2025-11-19T13:00:00.000Z', NULL, NULL, NULL, NULL),
(26, 'ORD-2025-000026', 13, 'closed', 2820.00, 0.00, 0.00, 2820.00, 'BRL', 2820.00, 0.00, '2025-11-20T12:00:00.000Z', '2025-11-20T12:00:00.000Z', '2025-11-20T14:00:00.000Z', NULL, 3, NULL, NULL),
(27, 'ORD-2025-000027', 36, 'closed', 4500.00, 0.00, 0.00, 4500.00, 'BRL', 4500.00, 0.00, '2025-11-20T13:00:00.000Z', '2025-11-20T13:00:00.000Z', '2025-11-20T15:00:00.000Z', NULL, 5, NULL, NULL),
(28, 'ORD-2025-000028', 20, 'closed', 1920.00, 0.00, 0.00, 1920.00, 'BRL', 1920.00, 0.00, '2025-11-20T14:00:00.000Z', '2025-11-20T14:00:00.000Z', '2025-11-20T16:00:00.000Z', NULL, 1, NULL, NULL),
(29, 'ORD-2025-000029', 7, 'closed', 3500.00, 0.00, 0.00, 3500.00, 'BRL', 3500.00, 0.00, '2025-11-20T15:00:00.000Z', '2025-11-20T15:00:00.000Z', '2025-11-20T17:00:00.000Z', NULL, 2, NULL, NULL),
(30, 'ORD-2025-000030', 14, 'closed', 1520.00, 0.00, 0.00, 1520.00, 'BRL', 1520.00, 0.00, '2025-11-20T16:00:00.000Z', '2025-11-20T16:00:00.000Z', '2025-11-20T18:00:00.000Z', NULL, 1, NULL, NULL),
(31, 'ORD-2025-000031', 31, 'closed', 600.00, 0.00, 0.00, 600.00, 'BRL', 600.00, 0.00, '2025-11-21T17:00:00.000Z', '2025-11-21T17:00:00.000Z', '2025-11-21T19:00:00.000Z', NULL, 3, NULL, NULL),
(32, 'ORD-2025-000032', 2, 'closed', 500.00, 0.00, 0.00, 500.00, 'BRL', 500.00, 0.00, '2025-11-21T18:00:00.000Z', '2025-11-21T18:00:00.000Z', '2025-11-21T20:00:00.000Z', NULL, 4, NULL, NULL),
(33, 'ORD-2025-000033', 6, 'closed', 1920.00, 0.00, 0.00, 1920.00, 'BRL', 1920.00, 0.00, '2025-11-21T11:00:00.000Z', '2025-11-21T11:00:00.000Z', '2025-11-21T13:00:00.000Z', NULL, 4, NULL, NULL),
(34, 'ORD-2025-000034', 44, 'closed', 2880.00, 0.00, 0.00, 2880.00, 'BRL', 2880.00, 0.00, '2025-11-21T12:00:00.000Z', '2025-11-21T12:00:00.000Z', '2025-11-21T14:00:00.000Z', NULL, 4, NULL, NULL),
(35, 'ORD-2025-000035', 46, 'closed', 2820.00, 0.00, 0.00, 2820.00, 'BRL', 2820.00, 0.00, '2025-11-21T13:00:00.000Z', '2025-11-21T13:00:00.000Z', '2025-11-21T15:00:00.000Z', NULL, 4, NULL, NULL),
(36, 'ORD-2025-000036', 49, 'closed', 2220.00, 0.00, 0.00, 2220.00, 'BRL', 2220.00, 0.00, '2025-11-22T14:00:00.000Z', '2025-11-22T14:00:00.000Z', '2025-11-22T16:00:00.000Z', NULL, NULL, NULL, NULL),
(37, 'ORD-2025-000037', 19, 'closed', 3500.00, 0.00, 0.00, 3500.00, 'BRL', 3500.00, 0.00, '2025-11-22T15:00:00.000Z', '2025-11-22T15:00:00.000Z', '2025-11-22T17:00:00.000Z', NULL, 4, NULL, NULL),
(38, 'ORD-2025-000038', 25, 'closed', 4500.00, 0.00, 0.00, 4500.00, 'BRL', 4500.00, 0.00, '2025-11-22T16:00:00.000Z', '2025-11-22T16:00:00.000Z', '2025-11-22T18:00:00.000Z', NULL, NULL, NULL, NULL),
(39, 'ORD-2025-000039', 38, 'closed', 2220.00, 0.00, 0.00, 2220.00, 'BRL', 2220.00, 0.00, '2025-11-22T17:00:00.000Z', '2025-11-22T17:00:00.000Z', '2025-11-22T19:00:00.000Z', NULL, 2, NULL, NULL),
(40, 'ORD-2025-000040', 40, 'cancelled', 4500.00, 0.00, 0.00, 4500.00, 'BRL', 0.00, 4500.00, '2025-11-22T18:00:00.000Z', '2025-11-22T18:00:00.000Z', NULL, '2025-11-22T19:00:00.000Z', 4, NULL, NULL),
(41, 'ORD-2025-000041', 23, 'closed', 900.00, 0.00, 0.00, 900.00, 'BRL', 900.00, 0.00, '2025-11-23T11:00:00.000Z', '2025-11-23T11:00:00.000Z', '2025-11-23T13:00:00.000Z', NULL, 5, NULL, NULL),
(42, 'ORD-2025-000042', 44, 'closed', 2220.00, 0.00, 0.00, 2220.00, 'BRL', 2220.00, 0.00, '2025-11-23T12:00:00.000Z', '2025-11-23T12:00:00.000Z', '2025-11-23T14:00:00.000Z', NULL, 1, NULL, NULL),
(43, 'ORD-2025-000043', 27, 'closed', 980.00, 0.00, 0.00, 980.00, 'BRL', 980.00, 0.00, '2025-11-23T13:00:00.000Z', '2025-11-23T13:00:00.000Z', '2025-11-23T15:00:00.000Z', NULL, 1, NULL, NULL),
(44, 'ORD-2025-000044', 20, 'closed', 1520.00, 0.00, 0.00, 1520.00, 'BRL', 1520.00, 0.00, '2025-11-23T14:00:00.000Z', '2025-11-23T14:00:00.000Z', '2025-11-23T16:00:00.000Z', NULL, 5, NULL, NULL),
(45, 'ORD-2025-000045', 5, 'closed', 4500.00, 0.00, 0.00, 4500.00, 'BRL', 4500.00, 0.00, '2025-11-23T15:00:00.000Z', '2025-11-23T15:00:00.000Z', '2025-11-23T17:00:00.000Z', NULL, 5, NULL, NULL),
(46, 'ORD-2025-000046', 24, 'closed', 390.00, 0.00, 0.00, 390.00, 'BRL', 390.00, 0.00, '2025-11-24T16:00:00.000Z', '2025-11-24T16:00:00.000Z', '2025-11-24T18:00:00.000Z', NULL, 5, NULL, NULL),
(47, 'ORD-2025-000047', 3, 'open', 3500.00, 0.00, 0.00, 3500.00, 'BRL', 850.00, 2650.00, '2025-11-24T17:00:00.000Z', '2025-11-24T17:00:00.000Z', NULL, NULL, 1, NULL, NULL),
(48, 'ORD-2025-000048', 24, 'closed', 4500.00, 0.00, 0.00, 4500.00, 'BRL', 4500.00, 0.00, '2025-11-24T18:00:00.000Z', '2025-11-24T18:00:00.000Z', '2025-11-24T20:00:00.000Z', NULL, 1, NULL, NULL),
(49, 'ORD-2025-000049', 23, 'closed', 3500.00, 0.00, 0.00, 3500.00, 'BRL', 3500.00, 0.00, '2025-11-24T11:00:00.000Z', '2025-11-24T11:00:00.000Z', '2025-11-24T13:00:00.000Z', NULL, NULL, NULL, NULL),
(50, 'ORD-2025-000050', 35, 'closed', 1920.00, 0.00, 0.00, 1920.00, 'BRL', 1920.00, 0.00, '2025-11-24T12:00:00.000Z', '2025-11-24T12:00:00.000Z', '2025-11-24T14:00:00.000Z', NULL, NULL, NULL, NULL);

-- ============================================
-- ORDER ITEMS
-- ============================================

INSERT INTO order_items (id, order_id, item_type, item_id, item_name, quantity, unit_price, subtotal, note, created_at) VALUES
(1, 1, 'service', 3, 'Board Rental (by hour)', 1, 150.00, 450.00, NULL, '2025-11-15T11:00:00.000Z'),
(2, 2, 'service_package', 4, '8h Package', 1, 3500.00, 3500.00, NULL, '2025-11-15T12:00:00.000Z'),
(3, 3, 'service', 3, 'Board Rental (by hour)', 1, 150.00, 150.00, NULL, '2025-11-15T13:00:00.000Z'),
(4, 4, 'service_package', 6, '4h Package', 1, 2820.00, 2820.00, NULL, '2025-11-15T14:00:00.000Z'),
(5, 5, 'service_package', 1, '2h Package', 1, 1520.00, 1520.00, NULL, '2025-11-15T15:00:00.000Z'),
(6, 6, 'service_package', 4, '8h Package', 1, 3500.00, 3500.00, NULL, '2025-11-16T16:00:00.000Z'),
(7, 7, 'service_package', 4, '8h Package', 1, 3500.00, 3500.00, NULL, '2025-11-16T17:00:00.000Z'),
(8, 8, 'service_package', 6, '4h Package', 1, 2820.00, 2820.00, NULL, '2025-11-16T18:00:00.000Z'),
(9, 9, 'service_package', 2, '4h Package', 1, 2220.00, 2220.00, NULL, '2025-11-16T11:00:00.000Z'),
(10, 10, 'service_package', 1, '2h Package', 1, 1520.00, 1520.00, NULL, '2025-11-16T12:00:00.000Z'),
(11, 11, 'service_package', 5, '2h Package', 1, 1920.00, 1920.00, NULL, '2025-11-17T13:00:00.000Z'),
(12, 12, 'service', 4, 'Board Rental (by day)', 1, 500.00, 500.00, NULL, '2025-11-17T14:00:00.000Z'),
(13, 13, 'service', 4, 'Board Rental (by day)', 1, 500.00, 500.00, NULL, '2025-11-17T15:00:00.000Z'),
(14, 14, 'service_package', 5, '2h Package', 1, 1920.00, 1920.00, NULL, '2025-11-17T16:00:00.000Z'),
(15, 15, 'service_package', 3, '6h Package', 1, 2880.00, 2880.00, NULL, '2025-11-17T17:00:00.000Z'),
(16, 16, 'service_package', 8, '8h Package', 1, 4500.00, 4500.00, NULL, '2025-11-18T18:00:00.000Z'),
(17, 17, 'service_package', 4, '8h Package', 1, 3500.00, 3500.00, NULL, '2025-11-18T11:00:00.000Z'),
(18, 18, 'service_package', 1, '2h Package', 1, 1520.00, 1520.00, NULL, '2025-11-18T12:00:00.000Z'),
(19, 19, 'service_package', 5, '2h Package', 1, 1920.00, 1920.00, NULL, '2025-11-18T13:00:00.000Z'),
(20, 20, 'service', 1, 'Kitesurf Private Lessons', 1, 390.00, 390.00, NULL, '2025-11-18T14:00:00.000Z'),
(21, 21, 'service_package', 5, '2h Package', 1, 1920.00, 1920.00, NULL, '2025-11-19T15:00:00.000Z'),
(22, 22, 'service', 1, 'Kitesurf Private Lessons', 1, 390.00, 1170.00, NULL, '2025-11-19T16:00:00.000Z'),
(23, 23, 'service', 1, 'Kitesurf Private Lessons', 1, 390.00, 780.00, NULL, '2025-11-19T17:00:00.000Z'),
(24, 24, 'service', 3, 'Board Rental (by hour)', 1, 150.00, 600.00, NULL, '2025-11-19T18:00:00.000Z'),
(25, 25, 'service_package', 2, '4h Package', 1, 2220.00, 2220.00, NULL, '2025-11-19T11:00:00.000Z'),
(26, 26, 'service_package', 6, '4h Package', 1, 2820.00, 2820.00, NULL, '2025-11-20T12:00:00.000Z'),
(27, 27, 'service_package', 8, '8h Package', 1, 4500.00, 4500.00, NULL, '2025-11-20T13:00:00.000Z'),
(28, 28, 'service_package', 5, '2h Package', 1, 1920.00, 1920.00, NULL, '2025-11-20T14:00:00.000Z'),
(29, 29, 'service_package', 4, '8h Package', 1, 3500.00, 3500.00, NULL, '2025-11-20T15:00:00.000Z'),
(30, 30, 'service_package', 1, '2h Package', 1, 1520.00, 1520.00, NULL, '2025-11-20T16:00:00.000Z'),
(31, 31, 'service', 3, 'Board Rental (by hour)', 1, 150.00, 600.00, NULL, '2025-11-21T17:00:00.000Z'),
(32, 32, 'service', 4, 'Board Rental (by day)', 1, 500.00, 500.00, NULL, '2025-11-21T18:00:00.000Z'),
(33, 33, 'service_package', 5, '2h Package', 1, 1920.00, 1920.00, NULL, '2025-11-21T11:00:00.000Z'),
(34, 34, 'service_package', 3, '6h Package', 1, 2880.00, 2880.00, NULL, '2025-11-21T12:00:00.000Z'),
(35, 35, 'service_package', 6, '4h Package', 1, 2820.00, 2820.00, NULL, '2025-11-21T13:00:00.000Z'),
(36, 36, 'service_package', 2, '4h Package', 1, 2220.00, 2220.00, NULL, '2025-11-22T14:00:00.000Z'),
(37, 37, 'service_package', 4, '8h Package', 1, 3500.00, 3500.00, NULL, '2025-11-22T15:00:00.000Z'),
(38, 38, 'service_package', 8, '8h Package', 1, 4500.00, 4500.00, NULL, '2025-11-22T16:00:00.000Z'),
(39, 39, 'service_package', 2, '4h Package', 1, 2220.00, 2220.00, NULL, '2025-11-22T17:00:00.000Z'),
(40, 40, 'service_package', 8, '8h Package', 1, 4500.00, 4500.00, NULL, '2025-11-22T18:00:00.000Z'),
(41, 41, 'service', 3, 'Board Rental (by hour)', 1, 150.00, 900.00, NULL, '2025-11-23T11:00:00.000Z'),
(42, 42, 'service_package', 2, '4h Package', 1, 2220.00, 2220.00, NULL, '2025-11-23T12:00:00.000Z'),
(43, 43, 'service', 2, 'Wingfoil Private Lessons', 1, 490.00, 980.00, NULL, '2025-11-23T13:00:00.000Z'),
(44, 44, 'service_package', 1, '2h Package', 1, 1520.00, 1520.00, NULL, '2025-11-23T14:00:00.000Z'),
(45, 45, 'service_package', 8, '8h Package', 1, 4500.00, 4500.00, NULL, '2025-11-23T15:00:00.000Z'),
(46, 46, 'service', 1, 'Kitesurf Private Lessons', 1, 390.00, 390.00, NULL, '2025-11-24T16:00:00.000Z'),
(47, 47, 'service_package', 4, '8h Package', 1, 3500.00, 3500.00, NULL, '2025-11-24T17:00:00.000Z'),
(48, 48, 'service_package', 8, '8h Package', 1, 4500.00, 4500.00, NULL, '2025-11-24T18:00:00.000Z'),
(49, 49, 'service_package', 4, '8h Package', 1, 3500.00, 3500.00, NULL, '2025-11-24T11:00:00.000Z'),
(50, 50, 'service_package', 5, '2h Package', 1, 1920.00, 1920.00, NULL, '2025-11-24T12:00:00.000Z');

-- ============================================
-- CUSTOMER SERVICE CREDITS
-- ============================================

INSERT INTO customer_service_credits (id, customer_id, order_item_id, service_package_id, service_id, total_hours, total_days, total_months, status, expires_at, created_at, updated_at) VALUES
(1, 31, 1, NULL, 3, '3.00', NULL, NULL, 'active', NULL, '2025-11-15T11:00:00.000Z', '2025-11-15T11:00:00.000Z'),
(2, 47, 2, 4, 1, '8.00', NULL, NULL, 'active', NULL, '2025-11-15T12:00:00.000Z', '2025-11-15T12:00:00.000Z'),
(3, 32, 3, NULL, 3, '1.00', NULL, NULL, 'active', NULL, '2025-11-15T13:00:00.000Z', '2025-11-15T13:00:00.000Z'),
(4, 21, 4, 6, 2, '4.00', NULL, NULL, 'active', NULL, '2025-11-15T14:00:00.000Z', '2025-11-15T14:00:00.000Z'),
(5, 48, 5, 1, 1, '2.00', NULL, NULL, 'active', NULL, '2025-11-15T15:00:00.000Z', '2025-11-15T15:00:00.000Z'),
(6, 39, 6, 4, 1, '8.00', NULL, NULL, 'active', NULL, '2025-11-16T16:00:00.000Z', '2025-11-16T16:00:00.000Z'),
(7, 47, 7, 4, 1, '8.00', NULL, NULL, 'active', NULL, '2025-11-16T17:00:00.000Z', '2025-11-16T17:00:00.000Z'),
(8, 16, 8, 6, 2, '4.00', NULL, NULL, 'active', NULL, '2025-11-16T18:00:00.000Z', '2025-11-16T18:00:00.000Z'),
(9, 44, 9, 2, 1, '4.00', NULL, NULL, 'active', NULL, '2025-11-16T11:00:00.000Z', '2025-11-16T11:00:00.000Z'),
(10, 50, 10, 1, 1, '2.00', NULL, NULL, 'active', NULL, '2025-11-16T12:00:00.000Z', '2025-11-16T12:00:00.000Z'),
(11, 35, 11, 5, 2, '2.00', NULL, NULL, 'active', NULL, '2025-11-17T13:00:00.000Z', '2025-11-17T13:00:00.000Z'),
(12, 19, 12, NULL, 4, NULL, '1.00', NULL, 'active', NULL, '2025-11-17T14:00:00.000Z', '2025-11-17T14:00:00.000Z'),
(13, 10, 13, NULL, 4, NULL, '1.00', NULL, 'active', NULL, '2025-11-17T15:00:00.000Z', '2025-11-17T15:00:00.000Z'),
(14, 6, 14, 5, 2, '2.00', NULL, NULL, 'active', NULL, '2025-11-17T16:00:00.000Z', '2025-11-17T16:00:00.000Z'),
(15, 40, 15, 3, 1, '6.00', NULL, NULL, 'active', NULL, '2025-11-17T17:00:00.000Z', '2025-11-17T17:00:00.000Z'),
(16, 43, 16, 8, 2, '8.00', NULL, NULL, 'active', NULL, '2025-11-18T18:00:00.000Z', '2025-11-18T18:00:00.000Z'),
(17, 39, 17, 4, 1, '8.00', NULL, NULL, 'active', NULL, '2025-11-18T11:00:00.000Z', '2025-11-18T11:00:00.000Z'),
(18, 12, 18, 1, 1, '2.00', NULL, NULL, 'active', NULL, '2025-11-18T12:00:00.000Z', '2025-11-18T12:00:00.000Z'),
(19, 38, 19, 5, 2, '2.00', NULL, NULL, 'active', NULL, '2025-11-18T13:00:00.000Z', '2025-11-18T13:00:00.000Z'),
(20, 21, 20, NULL, 1, '2.00', NULL, NULL, 'active', NULL, '2025-11-18T14:00:00.000Z', '2025-11-18T14:00:00.000Z'),
(21, 25, 21, 5, 2, '2.00', NULL, NULL, 'active', NULL, '2025-11-19T15:00:00.000Z', '2025-11-19T15:00:00.000Z'),
(22, 17, 22, NULL, 1, '6.00', NULL, NULL, 'active', NULL, '2025-11-19T16:00:00.000Z', '2025-11-19T16:00:00.000Z'),
(23, 38, 23, NULL, 1, '4.00', NULL, NULL, 'active', NULL, '2025-11-19T17:00:00.000Z', '2025-11-19T17:00:00.000Z'),
(24, 4, 24, NULL, 3, '4.00', NULL, NULL, 'active', NULL, '2025-11-19T18:00:00.000Z', '2025-11-19T18:00:00.000Z'),
(25, 48, 25, 2, 1, '4.00', NULL, NULL, 'active', NULL, '2025-11-19T11:00:00.000Z', '2025-11-19T11:00:00.000Z'),
(26, 13, 26, 6, 2, '4.00', NULL, NULL, 'active', NULL, '2025-11-20T12:00:00.000Z', '2025-11-20T12:00:00.000Z'),
(27, 36, 27, 8, 2, '8.00', NULL, NULL, 'active', NULL, '2025-11-20T13:00:00.000Z', '2025-11-20T13:00:00.000Z'),
(28, 20, 28, 5, 2, '2.00', NULL, NULL, 'active', NULL, '2025-11-20T14:00:00.000Z', '2025-11-20T14:00:00.000Z'),
(29, 7, 29, 4, 1, '8.00', NULL, NULL, 'active', NULL, '2025-11-20T15:00:00.000Z', '2025-11-20T15:00:00.000Z'),
(30, 14, 30, 1, 1, '2.00', NULL, NULL, 'active', NULL, '2025-11-20T16:00:00.000Z', '2025-11-20T16:00:00.000Z'),
(31, 31, 31, NULL, 3, '4.00', NULL, NULL, 'active', NULL, '2025-11-21T17:00:00.000Z', '2025-11-21T17:00:00.000Z'),
(32, 2, 32, NULL, 4, NULL, '1.00', NULL, 'active', NULL, '2025-11-21T18:00:00.000Z', '2025-11-21T18:00:00.000Z'),
(33, 6, 33, 5, 2, '2.00', NULL, NULL, 'active', NULL, '2025-11-21T11:00:00.000Z', '2025-11-21T11:00:00.000Z'),
(34, 44, 34, 3, 1, '6.00', NULL, NULL, 'active', NULL, '2025-11-21T12:00:00.000Z', '2025-11-21T12:00:00.000Z'),
(35, 46, 35, 6, 2, '4.00', NULL, NULL, 'active', NULL, '2025-11-21T13:00:00.000Z', '2025-11-21T13:00:00.000Z'),
(36, 49, 36, 2, 1, '4.00', NULL, NULL, 'active', NULL, '2025-11-22T14:00:00.000Z', '2025-11-22T14:00:00.000Z'),
(37, 19, 37, 4, 1, '8.00', NULL, NULL, 'active', NULL, '2025-11-22T15:00:00.000Z', '2025-11-22T15:00:00.000Z'),
(38, 25, 38, 8, 2, '8.00', NULL, NULL, 'active', NULL, '2025-11-22T16:00:00.000Z', '2025-11-22T16:00:00.000Z'),
(39, 38, 39, 2, 1, '4.00', NULL, NULL, 'active', NULL, '2025-11-22T17:00:00.000Z', '2025-11-22T17:00:00.000Z'),
(40, 40, 40, 8, 2, '8.00', NULL, NULL, 'active', NULL, '2025-11-22T18:00:00.000Z', '2025-11-22T18:00:00.000Z'),
(41, 23, 41, NULL, 3, '6.00', NULL, NULL, 'active', NULL, '2025-11-23T11:00:00.000Z', '2025-11-23T11:00:00.000Z'),
(42, 44, 42, 2, 1, '4.00', NULL, NULL, 'active', NULL, '2025-11-23T12:00:00.000Z', '2025-11-23T12:00:00.000Z'),
(43, 27, 43, NULL, 2, '4.00', NULL, NULL, 'active', NULL, '2025-11-23T13:00:00.000Z', '2025-11-23T13:00:00.000Z'),
(44, 20, 44, 1, 1, '2.00', NULL, NULL, 'active', NULL, '2025-11-23T14:00:00.000Z', '2025-11-23T14:00:00.000Z'),
(45, 5, 45, 8, 2, '8.00', NULL, NULL, 'active', NULL, '2025-11-23T15:00:00.000Z', '2025-11-23T15:00:00.000Z'),
(46, 24, 46, NULL, 1, '2.00', NULL, NULL, 'active', NULL, '2025-11-24T16:00:00.000Z', '2025-11-24T16:00:00.000Z'),
(47, 3, 47, 4, 1, '8.00', NULL, NULL, 'active', NULL, '2025-11-24T17:00:00.000Z', '2025-11-24T17:00:00.000Z'),
(48, 24, 48, 8, 2, '8.00', NULL, NULL, 'active', NULL, '2025-11-24T18:00:00.000Z', '2025-11-24T18:00:00.000Z'),
(49, 23, 49, 4, 1, '8.00', NULL, NULL, 'active', NULL, '2025-11-24T11:00:00.000Z', '2025-11-24T11:00:00.000Z'),
(50, 35, 50, 5, 2, '2.00', NULL, NULL, 'active', NULL, '2025-11-24T12:00:00.000Z', '2025-11-24T12:00:00.000Z');

-- ============================================
-- ORDER PAYMENTS
-- ============================================

INSERT INTO order_payments (id, order_id, amount, currency, payment_method_id, occurred_at, created_by, company_account_id, transaction_id, note, created_at) VALUES
(1, 1, 450.00, 'BRL', 2, '2025-11-15T13:00:00.000Z', NULL, 2, NULL, NULL, '2025-11-15T13:00:00.000Z'),
(2, 2, 3500.00, 'BRL', 1, '2025-11-15T14:00:00.000Z', NULL, 2, NULL, NULL, '2025-11-15T14:00:00.000Z'),
(3, 3, 150.00, 'BRL', 1, '2025-11-15T15:00:00.000Z', NULL, 2, NULL, NULL, '2025-11-15T15:00:00.000Z'),
(4, 4, 2820.00, 'BRL', 3, '2025-11-15T16:00:00.000Z', NULL, 2, NULL, NULL, '2025-11-15T16:00:00.000Z'),
(5, 5, 1520.00, 'BRL', 3, '2025-11-15T17:00:00.000Z', NULL, 1, NULL, NULL, '2025-11-15T17:00:00.000Z'),
(6, 6, 3500.00, 'BRL', 2, '2025-11-16T18:00:00.000Z', NULL, 2, NULL, NULL, '2025-11-16T18:00:00.000Z'),
(7, 7, 3500.00, 'BRL', 3, '2025-11-16T19:00:00.000Z', NULL, 2, NULL, NULL, '2025-11-16T19:00:00.000Z'),
(8, 8, 2820.00, 'BRL', 2, '2025-11-16T20:00:00.000Z', NULL, 2, NULL, NULL, '2025-11-16T20:00:00.000Z'),
(9, 9, 2220.00, 'BRL', 2, '2025-11-16T13:00:00.000Z', NULL, 1, NULL, NULL, '2025-11-16T13:00:00.000Z'),
(10, 10, 1520.00, 'BRL', 3, '2025-11-16T14:00:00.000Z', NULL, 1, NULL, NULL, '2025-11-16T14:00:00.000Z'),
(11, 11, 1920.00, 'BRL', 3, '2025-11-17T15:00:00.000Z', NULL, 1, NULL, NULL, '2025-11-17T15:00:00.000Z'),
(12, 12, 500.00, 'BRL', 1, '2025-11-17T16:00:00.000Z', NULL, 1, NULL, NULL, '2025-11-17T16:00:00.000Z'),
(13, 14, 1920.00, 'BRL', 1, '2025-11-17T18:00:00.000Z', NULL, 1, NULL, NULL, '2025-11-17T18:00:00.000Z'),
(14, 15, 2880.00, 'BRL', 3, '2025-11-17T19:00:00.000Z', NULL, 1, NULL, NULL, '2025-11-17T19:00:00.000Z'),
(15, 17, 3500.00, 'BRL', 1, '2025-11-18T13:00:00.000Z', NULL, 1, NULL, NULL, '2025-11-18T13:00:00.000Z'),
(16, 18, 1520.00, 'BRL', 1, '2025-11-18T14:00:00.000Z', NULL, 2, NULL, NULL, '2025-11-18T14:00:00.000Z'),
(17, 19, 1920.00, 'BRL', 2, '2025-11-18T15:00:00.000Z', NULL, 1, NULL, NULL, '2025-11-18T15:00:00.000Z'),
(18, 20, 390.00, 'BRL', 2, '2025-11-18T16:00:00.000Z', NULL, 2, NULL, NULL, '2025-11-18T16:00:00.000Z'),
(19, 21, 1920.00, 'BRL', 1, '2025-11-19T17:00:00.000Z', NULL, 1, NULL, NULL, '2025-11-19T17:00:00.000Z'),
(20, 22, 1170.00, 'BRL', 2, '2025-11-19T18:00:00.000Z', NULL, 2, NULL, NULL, '2025-11-19T18:00:00.000Z'),
(21, 23, 780.00, 'BRL', 1, '2025-11-19T19:00:00.000Z', NULL, 1, NULL, NULL, '2025-11-19T19:00:00.000Z'),
(22, 25, 2220.00, 'BRL', 3, '2025-11-19T13:00:00.000Z', NULL, 2, NULL, NULL, '2025-11-19T13:00:00.000Z'),
(23, 26, 2820.00, 'BRL', 3, '2025-11-20T14:00:00.000Z', NULL, 1, NULL, NULL, '2025-11-20T14:00:00.000Z'),
(24, 27, 4500.00, 'BRL', 1, '2025-11-20T15:00:00.000Z', NULL, 2, NULL, NULL, '2025-11-20T15:00:00.000Z'),
(25, 28, 1920.00, 'BRL', 1, '2025-11-20T16:00:00.000Z', NULL, 1, NULL, NULL, '2025-11-20T16:00:00.000Z'),
(26, 29, 3500.00, 'BRL', 2, '2025-11-20T17:00:00.000Z', NULL, 1, NULL, NULL, '2025-11-20T17:00:00.000Z'),
(27, 30, 1520.00, 'BRL', 1, '2025-11-20T18:00:00.000Z', NULL, 2, NULL, NULL, '2025-11-20T18:00:00.000Z'),
(28, 31, 600.00, 'BRL', 1, '2025-11-21T19:00:00.000Z', NULL, 2, NULL, NULL, '2025-11-21T19:00:00.000Z'),
(29, 32, 500.00, 'BRL', 1, '2025-11-21T20:00:00.000Z', NULL, 1, NULL, NULL, '2025-11-21T20:00:00.000Z'),
(30, 33, 1920.00, 'BRL', 2, '2025-11-21T13:00:00.000Z', NULL, 2, NULL, NULL, '2025-11-21T13:00:00.000Z'),
(31, 34, 2880.00, 'BRL', 2, '2025-11-21T14:00:00.000Z', NULL, 2, NULL, NULL, '2025-11-21T14:00:00.000Z'),
(32, 35, 2820.00, 'BRL', 1, '2025-11-21T15:00:00.000Z', NULL, 2, NULL, NULL, '2025-11-21T15:00:00.000Z'),
(33, 36, 2220.00, 'BRL', 1, '2025-11-22T16:00:00.000Z', NULL, 2, NULL, NULL, '2025-11-22T16:00:00.000Z'),
(34, 37, 3500.00, 'BRL', 2, '2025-11-22T17:00:00.000Z', NULL, 2, NULL, NULL, '2025-11-22T17:00:00.000Z'),
(35, 38, 4500.00, 'BRL', 2, '2025-11-22T18:00:00.000Z', NULL, 2, NULL, NULL, '2025-11-22T18:00:00.000Z'),
(36, 39, 2220.00, 'BRL', 1, '2025-11-22T19:00:00.000Z', NULL, 1, NULL, NULL, '2025-11-22T19:00:00.000Z'),
(37, 41, 900.00, 'BRL', 2, '2025-11-23T13:00:00.000Z', NULL, 1, NULL, NULL, '2025-11-23T13:00:00.000Z'),
(38, 42, 2220.00, 'BRL', 3, '2025-11-23T14:00:00.000Z', NULL, 2, NULL, NULL, '2025-11-23T14:00:00.000Z'),
(39, 43, 980.00, 'BRL', 3, '2025-11-23T15:00:00.000Z', NULL, 1, NULL, NULL, '2025-11-23T15:00:00.000Z'),
(40, 44, 1520.00, 'BRL', 2, '2025-11-23T16:00:00.000Z', NULL, 2, NULL, NULL, '2025-11-23T16:00:00.000Z'),
(41, 45, 4500.00, 'BRL', 3, '2025-11-23T17:00:00.000Z', NULL, 1, NULL, NULL, '2025-11-23T17:00:00.000Z'),
(42, 46, 390.00, 'BRL', 1, '2025-11-24T18:00:00.000Z', NULL, 2, NULL, NULL, '2025-11-24T18:00:00.000Z'),
(43, 48, 4500.00, 'BRL', 3, '2025-11-24T20:00:00.000Z', NULL, 1, NULL, NULL, '2025-11-24T20:00:00.000Z'),
(44, 49, 3500.00, 'BRL', 1, '2025-11-24T13:00:00.000Z', NULL, 1, NULL, NULL, '2025-11-24T13:00:00.000Z'),
(45, 50, 1920.00, 'BRL', 2, '2025-11-24T14:00:00.000Z', NULL, 2, NULL, NULL, '2025-11-24T14:00:00.000Z');

-- ============================================
-- SCHEDULED APPOINTMENTS (20 appointments)
-- ============================================

INSERT INTO scheduled_appointments (id, customer_id, service_id, service_package_id, credit_id, scheduled_start, scheduled_end, duration_hours, duration_days, duration_months, status, instructor_id, staff_id, note, created_at, updated_at, completed_at, cancelled_at, created_by, attendee_name) VALUES
(1, 28, 2, NULL, NULL, '2025-11-25T12:00:00.000Z', '2025-11-25T14:00:00.000Z', 2.00, NULL, NULL, 'completed', 4, NULL, NULL, '2025-11-25T12:00:00.000Z', '2025-11-25T12:00:00.000Z', '2025-11-25T14:00:00.000Z', NULL, NULL, NULL),
(2, 44, 1, 2, 9, '2025-11-25T13:00:00.000Z', '2025-11-25T15:00:00.000Z', 2.00, NULL, NULL, 'completed', 4, NULL, NULL, '2025-11-25T13:00:00.000Z', '2025-11-25T13:00:00.000Z', '2025-11-25T15:00:00.000Z', NULL, NULL, NULL),
(3, 16, 2, 6, 8, '2025-11-25T14:00:00.000Z', '2025-11-25T16:00:00.000Z', 2.00, NULL, NULL, 'completed', 1, NULL, NULL, '2025-11-25T14:00:00.000Z', '2025-11-25T14:00:00.000Z', '2025-11-25T16:00:00.000Z', NULL, NULL, NULL),
(4, 33, 3, NULL, NULL, '2025-11-26T15:00:00.000Z', '2025-11-26T17:00:00.000Z', 2.00, NULL, NULL, 'scheduled', 2, NULL, NULL, '2025-11-26T15:00:00.000Z', '2025-11-26T15:00:00.000Z', NULL, NULL, NULL, NULL),
(5, 17, 1, NULL, 22, '2025-11-26T16:00:00.000Z', '2025-11-26T18:00:00.000Z', 2.00, NULL, NULL, 'scheduled', 4, NULL, NULL, '2025-11-26T16:00:00.000Z', '2025-11-26T16:00:00.000Z', NULL, NULL, NULL, NULL),
(6, 7, 1, 4, 29, '2025-11-26T17:00:00.000Z', '2025-11-26T19:00:00.000Z', 2.00, NULL, NULL, 'scheduled', 3, NULL, NULL, '2025-11-26T17:00:00.000Z', '2025-11-26T17:00:00.000Z', NULL, NULL, NULL, NULL),
(7, 33, 3, NULL, NULL, '2025-11-27T18:00:00.000Z', '2025-11-27T20:00:00.000Z', 2.00, NULL, NULL, 'scheduled', 4, NULL, NULL, '2025-11-27T18:00:00.000Z', '2025-11-27T18:00:00.000Z', NULL, NULL, NULL, NULL),
(8, 26, 2, NULL, NULL, '2025-11-27T19:00:00.000Z', '2025-11-27T21:00:00.000Z', 2.00, NULL, NULL, 'completed', 5, NULL, NULL, '2025-11-27T19:00:00.000Z', '2025-11-27T19:00:00.000Z', '2025-11-27T21:00:00.000Z', NULL, NULL, NULL),
(9, 4, 3, NULL, 24, '2025-11-27T12:00:00.000Z', '2025-11-27T14:00:00.000Z', 2.00, NULL, NULL, 'scheduled', 5, NULL, NULL, '2025-11-27T12:00:00.000Z', '2025-11-27T12:00:00.000Z', NULL, NULL, NULL, NULL),
(10, 23, 2, NULL, NULL, '2025-11-28T13:00:00.000Z', '2025-11-28T15:00:00.000Z', 2.00, NULL, NULL, 'cancelled', 5, NULL, NULL, '2025-11-28T13:00:00.000Z', '2025-11-28T13:00:00.000Z', NULL, '2025-11-28T12:00:00.000Z', NULL, NULL),
(11, 27, 2, NULL, NULL, '2025-11-28T14:00:00.000Z', '2025-11-28T16:00:00.000Z', 2.00, NULL, NULL, 'scheduled', 5, NULL, NULL, '2025-11-28T14:00:00.000Z', '2025-11-28T14:00:00.000Z', NULL, NULL, NULL, NULL),
(12, 3, 1, 4, 47, '2025-11-28T15:00:00.000Z', '2025-11-28T17:00:00.000Z', 2.00, NULL, NULL, 'scheduled', 2, NULL, NULL, '2025-11-28T15:00:00.000Z', '2025-11-28T15:00:00.000Z', NULL, NULL, NULL, NULL),
(13, 5, 2, 8, 45, '2025-11-29T16:00:00.000Z', '2025-11-29T18:00:00.000Z', 2.00, NULL, NULL, 'scheduled', 2, NULL, NULL, '2025-11-29T16:00:00.000Z', '2025-11-29T16:00:00.000Z', NULL, NULL, NULL, NULL),
(14, 14, 1, 1, 30, '2025-11-29T17:00:00.000Z', '2025-11-29T19:00:00.000Z', 2.00, NULL, NULL, 'scheduled', 1, NULL, NULL, '2025-11-29T17:00:00.000Z', '2025-11-29T17:00:00.000Z', NULL, NULL, NULL, NULL),
(15, 38, 2, 5, 19, '2025-11-29T18:00:00.000Z', '2025-11-29T20:00:00.000Z', 2.00, NULL, NULL, 'completed', 1, NULL, NULL, '2025-11-29T18:00:00.000Z', '2025-11-29T18:00:00.000Z', '2025-11-29T20:00:00.000Z', NULL, NULL, NULL),
(16, 40, 1, 3, 15, '2025-11-30T19:00:00.000Z', '2025-11-30T21:00:00.000Z', 2.00, NULL, NULL, 'scheduled', 5, NULL, NULL, '2025-11-30T19:00:00.000Z', '2025-11-30T19:00:00.000Z', NULL, NULL, NULL, NULL),
(17, 7, 3, NULL, NULL, '2025-11-30T12:00:00.000Z', '2025-11-30T14:00:00.000Z', 2.00, NULL, NULL, 'scheduled', 5, NULL, NULL, '2025-11-30T12:00:00.000Z', '2025-11-30T12:00:00.000Z', NULL, NULL, NULL, NULL),
(18, 34, 2, NULL, NULL, '2025-11-30T13:00:00.000Z', '2025-11-30T15:00:00.000Z', 2.00, NULL, NULL, 'scheduled', 4, NULL, NULL, '2025-11-30T13:00:00.000Z', '2025-11-30T13:00:00.000Z', NULL, NULL, NULL, NULL),
(19, 50, 2, NULL, NULL, '2025-12-01T14:00:00.000Z', '2025-12-01T16:00:00.000Z', 2.00, NULL, NULL, 'scheduled', 3, NULL, NULL, '2025-12-01T14:00:00.000Z', '2025-12-01T14:00:00.000Z', NULL, NULL, NULL, NULL),
(20, 16, 3, NULL, NULL, '2025-12-01T15:00:00.000Z', '2025-12-01T17:00:00.000Z', 2.00, NULL, NULL, 'scheduled', 1, NULL, NULL, '2025-12-01T15:00:00.000Z', '2025-12-01T15:00:00.000Z', NULL, NULL, NULL, NULL);

