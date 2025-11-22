-- ============================================
-- SEED DATA FOR KSMANAGER
-- ============================================
-- This file contains seed data for development/testing
-- Run this after running schema.sql
-- ============================================

-- Enable UUID extension if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS
-- ============================================

-- NOTE: Admin user is NOT created here because password hashing requires JavaScript.
-- To create the admin user (email: admin@ksmanager.com, password: password):
-- Run: npm run create-admin
-- 
-- This will create/update the admin user with the proper password hash.

-- ============================================
-- PAYMENT METHODS
-- ============================================

INSERT INTO payment_methods (name, description) VALUES
('Cash', 'Cash payments'),
('Credit Card', 'Credit card transactions'),
('Debit Card', 'Debit card transactions'),
('Bank Transfer', 'Wire transfer or bank transfer'),
('PayPal', 'PayPal online payments'),
('Stripe', 'Stripe payment gateway'),
('Check', 'Check payments'),
('Cryptocurrency', 'Cryptocurrency payments')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- TRANSACTION TYPES
-- ============================================

INSERT INTO transaction_types (code, label, direction, description) VALUES
('CUSTOMER_PAYMENT', 'Customer Payment', 'income', 'Customer payment for lessons and services'),
('INSTRUCTOR_SALARY', 'Instructor Salary', 'expense', 'Payment of salaries to instructors'),
('STAFF_SALARY', 'Staff Salary', 'expense', 'Payment of salaries to staff members'),
('COMPANY_TRANSFER', 'Company to Company Transfer', 'transfer', 'Transfer between company accounts'),
('CUSTOMER_REFUND', 'Customer Refund', 'expense', 'Refund to customers for cancelled services'),
('AGENCY_COMMISSION', 'Agency Commission', 'expense', 'Commission payment to agencies'),
('THIRD_PARTY_PAYMENT', 'Third Party Payment', 'expense', 'Payment to third party suppliers or services'),
('RENTAL_PAYMENT', 'Rental Payment', 'income', 'Customer payment for equipment rental'),
('SHOP_MAINTENANCE', 'Shop Maintenance', 'expense', 'Maintenance costs for shop facilities'),
('EQUIPMENT_REPAIR', 'Equipment Repair', 'expense', 'Repair costs for kitesurfing equipment')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- HOTELS (25 hotels from Atins)
-- ============================================

INSERT INTO hotels (name, phone, address, note) VALUES
('Atins Charme Chalés', '+55 98 99123-4567', 'Praia de Atins, Atins, MA 65590-000', 'Chalés charmosos com jardins exuberantes'),
('Rancharia Charme Beach', '+55 98 99123-4568', 'Beira Mar, Atins, MA 65590-000', 'Pousada à beira-mar'),
('Alma Charme Atins', '+55 98 99123-4569', 'Centro, Atins, MA 65590-000', 'Conforto e essência autêntica de Atins'),
('Vila Aty Lodge', '+55 98 99123-4570', 'Rua Principal, Atins, MA 65590-000', 'Lodge aconchegante próximo às atrações'),
('Pousada Muita Paz', '+55 98 99123-4571', 'Praia de Atins, Atins, MA 65590-000', 'Pousada tranquila à beira-mar'),
('Pousada do Irmão', '+55 98 99123-4572', 'Centro de Atins, Atins, MA 65590-000', 'Pousada familiar'),
('Pousada Vila Parnaíba', '+55 98 99123-4573', 'Beira Mar, Atins, MA 65590-000', 'Pousada com vista para o mar'),
('Oceano Atins', '+55 98 99123-4574', 'Praia de Atins, Atins, MA 65590-000', 'Acomodações à beira-mar com vista do oceano'),
('Pousada Maresia', '+55 98 99123-4575', 'Rua da Praia, Atins, MA 65590-000', 'Quartos espaçosos e café da manhã'),
('Pousada Cajueiro Atins', '+55 98 99123-4576', 'Centro, Atins, MA 65590-000', 'Pousada rústica e aconchegante'),
('Pousada Paraíso dos Lençóis', '+55 98 99123-4577', 'Atins, Barreirinhas, MA 65590-000', 'Paraíso próximo aos Lençóis'),
('Pousada Sol de Atins', '+55 98 99123-4578', 'Praia de Atins, Atins, MA 65590-000', 'Pousada com vista para o nascer do sol'),
('Pousada Vento do Mar', '+55 98 99123-4579', 'Beira Mar, Atins, MA 65590-000', 'Aproveite a brisa do mar'),
('Vila Aty Lodge Boutique', '+55 98 99123-4580', 'Rua Principal, Atins, MA 65590-000', 'Lodge boutique com decoração única'),
('Green Village Atins', '+55 98 99123-4581', 'Centro de Atins, Atins, MA 65590-000', 'Vila ecológica ideal para viajantes conscientes'),
('Pousada Jurará', '+55 98 99123-4582', 'Praia de Atins, Atins, MA 65590-000', 'Pousada rústica à beira-mar'),
('Pousada Carcará', '+55 98 99123-4583', 'Centro, Atins, MA 65590-000', 'Pousada simples e acolhedora'),
('Pousada Flamboyant', '+55 98 99123-4584', 'Beira Mar, Atins, MA 65590-000', 'Pousada com varanda e vista para o mar'),
('Pousada Nativa', '+55 98 99123-4585', 'Rua Principal, Atins, MA 65590-000', 'Pousada nativa e autêntica'),
('Pousada Vasto Horizonte', '+55 98 99123-4586', 'Praia de Atins, Atins, MA 65590-000', 'Horizonte vasto e belo'),
('Pousada Velho Bateau', '+55 98 99123-4587', 'Centro de Atins, Atins, MA 65590-000', 'Pousada familiar no centro'),
('Casa Branca Atins', '+55 98 99123-4588', 'Praia de Atins, Atins, MA 65590-000', 'Casa branca à beira-mar'),
('Pousada Eureka', '+55 98 99123-4589', 'Beira Mar, Atins, MA 65590-000', 'Pousada com ambiente tranquilo'),
('Villa Pantai Boutique Hotel', '+55 98 99123-4590', 'Rua Principal, Atins, MA 65590-000', 'Boutique hotel com decoração única'),
('La Ferme de Georges', '+55 98 99123-4591', 'Praia de Atins, Atins, MA 65590-000', 'Lodge com charme rústico francês')
ON CONFLICT DO NOTHING;

-- ============================================
-- AGENCIES (10 agencies from Atins)
-- ============================================

INSERT INTO agencies (name, phone, email, commission, note) VALUES
('Brasil Planet Turismo', '+55 98 98831-6668', 'info@brasilplanet.com.br', 15.00, 'Transporte e turismo em Barreirinhas'),
('Atins Kiteboarding (AKB)', '+55 98 99171-7120', 'contato@atinskiteboarding.com.br', 18.00, 'Especialista em kitesurf em Atins'),
('Aquarela Travel', '+55 98 99171-7121', 'info@aquarelatravel.com.br', 12.50, 'Serviços de viagem diversos'),
('Atins Adventure', '+55 98 99123-5001', 'hello@atinsadventure.com.br', 17.00, 'Aventuras e expedições'),
('Lençóis Maranhenses Tour', '+55 98 99123-5002', 'contato@lencoismaranhensestour.com.br', 16.00, 'Tours no Parque Nacional'),
('Kite Atins', '+55 98 99123-5004', 'book@kiteatins.com.br', 18.50, 'Aulas de kitesurf e aluguel de equipamentos'),
('Atins Offroad', '+55 98 99123-5005', 'contato@atinsoffroad.com.br', 15.50, 'Tours offroad e aventura'),
('Jurema Transportes e Turismo', '+55 98 98831-6669', 'info@jurematransportes.com.br', 14.50, 'Transporte e turismo na região'),
('Atins Tours', '+55 98 99123-5010', 'tours@atins.com.br', 15.00, 'Guias e tours personalizados'),
('Atins Kitesurf School', '+55 98 99123-5009', 'school@atinskitesurf.com.br', 19.00, 'Escola de kitesurf profissional')
ON CONFLICT DO NOTHING;

-- ============================================
-- THIRD PARTY CATEGORIES
-- ============================================

INSERT INTO third_parties_categories (name, description) VALUES
('Transport Services', 'Transfer and taxi companies for customer transportation'),
('Mechanics', 'Equipment repair and maintenance mechanics'),
('Downwinder Guides', 'Professional guides for downwinder tours')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- THIRD PARTIES (10 third parties: transport, mechanics, guides)
-- ============================================

INSERT INTO third_parties (name, category_id, phone, email, note) VALUES
('Atins Transfer', (SELECT id FROM third_parties_categories WHERE name = 'Transport Services'), '+55 98 99123-6001', 'transfer@atins.com.br', 'Transfer service from airport to Atins'),
('Táxi Atins', (SELECT id FROM third_parties_categories WHERE name = 'Transport Services'), '+55 98 99123-6002', 'taxi@atins.com.br', 'Taxi service in Atins and Barreirinhas'),
('4x4 Transfer Atins', (SELECT id FROM third_parties_categories WHERE name = 'Transport Services'), '+55 98 99123-6003', 'transfer4x4@atins.com.br', '4x4 vehicle transfer service'),
('Atins Express', (SELECT id FROM third_parties_categories WHERE name = 'Transport Services'), '+55 98 99123-6004', 'express@atins.com.br', 'Express transfer service'),
('Lençóis Transfer', (SELECT id FROM third_parties_categories WHERE name = 'Transport Services'), '+55 98 99123-6005', 'transfer@lencois.com.br', 'Transfer service to Lençóis Maranhenses'),
('Mecânica do João', (SELECT id FROM third_parties_categories WHERE name = 'Mechanics'), '+55 98 99123-6101', 'joao@mecanicaatins.com.br', 'Kite and equipment repair specialist'),
('Atins Equipment Repair', (SELECT id FROM third_parties_categories WHERE name = 'Mechanics'), '+55 98 99123-6102', 'repair@atins.com.br', 'Professional kite equipment repair'),
('Mecânica Maré', (SELECT id FROM third_parties_categories WHERE name = 'Mechanics'), '+55 98 99123-6103', 'mare@mecanica.com.br', 'Board and equipment repair service'),
('Downwinder Guide Atins', (SELECT id FROM third_parties_categories WHERE name = 'Downwinder Guides'), '+55 98 99123-6201', 'guide@downwinderatins.com.br', 'Professional downwinder guide services'),
('Atins Kite Guide', (SELECT id FROM third_parties_categories WHERE name = 'Downwinder Guides'), '+55 98 99123-6202', 'guide@atinskite.com.br', 'Experienced kite guide for downwinders')
ON CONFLICT DO NOTHING;

-- ============================================
-- COMPANY ACCOUNTS (3 accounts: Cashier, Banco do Brasil, Bradesco)
-- ============================================

INSERT INTO company_accounts (name, details, note) VALUES
('Cashier', 'Caixa registradora - dinheiro em espécie', 'Caixa para pagamentos em dinheiro'),
('Banco do Brasil', 'Banco: Banco do Brasil, Agência: 1234-5, Conta: 12345-6, CPF/CNPJ: 12.345.678/0001-90', 'Conta corrente principal'),
('Bradesco', 'Banco: Bradesco, Agência: 5678-9, Conta: 98765-4, CPF/CNPJ: 12.345.678/0001-90', 'Conta corrente secundária')
ON CONFLICT DO NOTHING;

-- ============================================
-- CUSTOMERS (50 international customers)
-- ============================================

INSERT INTO customers (fullname, phone, email, doctype, doc, country, birthdate, hotel_id, agency_id, note) VALUES
('James Anderson', '+1 555-2001', 'james.anderson@email.com', 'passport', 'US123456789', 'USA', '1985-03-15', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Sophia Martinez', '+1 555-2002', 'sophia.martinez@email.com', 'passport', 'MX321654987', 'Mexico', '1995-05-18', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Thomas Müller', '+49 30 12345678', 'thomas.mueller@email.com', 'passport', 'DE987654321', 'Germany', '1990-07-22', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Emma Wilson', '+44 20 7946 0958', 'emma.wilson@email.com', 'passport', 'GB456789123', 'UK', '1992-01-30', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Pierre Dubois', '+33 1 42 86 83 26', 'pierre.dubois@email.com', 'passport', 'FR369258147', 'France', '1989-04-20', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Isabella Rossi', '+39 06 12345678', 'isabella.rossi@email.com', 'passport', 'IT741852963', 'Italy', '1994-10-07', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('David Chen', '+86 10 12345678', 'david.chen@email.com', 'passport', 'CN123456789', 'China', '1988-11-05', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Olivia Smith', '+61 2 9374 4000', 'olivia.smith@email.com', 'passport', 'AU147258369', 'Australia', '1991-08-03', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Lucas Santos', '+55 11 98765-4321', 'lucas.santos@email.com', 'passport', 'BR963741852', 'Brazil', '1984-11-11', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Amelia Brown', '+64 9 123 4567', 'amelia.brown@email.com', 'passport', 'NZ159753468', 'New Zealand', '1996-09-23', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Mateo Rodriguez', '+57 1 234 5678', 'mateo.rodriguez@email.com', 'passport', 'CO741963258', 'Colombia', '1995-02-22', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Chloe Thompson', '+1 416 555 1234', 'chloe.thompson@email.com', 'passport', 'CA789123456', 'Canada', '1993-08-27', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Yuki Tanaka', '+81 3 1234 5678', 'yuki.tanaka@email.com', 'passport', 'JP963852741', 'Japan', '1996-04-19', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Liam O''Connor', '+353 1 234 5678', 'liam.oconnor@email.com', 'passport', 'IE852147963', 'Ireland', '1997-01-24', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Nora Johansson', '+46 8 123 456 78', 'nora.johansson@email.com', 'passport', 'SE741963852', 'Sweden', '1994-05-16', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Michael Johnson', '+1 555-2016', 'michael.johnson@email.com', 'passport', 'US234567890', 'USA', '1987-12-08', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Anna Kowalski', '+48 22 1234567', 'anna.kowalski@email.com', 'passport', 'PL963741258', 'Poland', '1993-06-26', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Sebastian Schmidt', '+49 30 87654321', 'sebastian.schmidt@email.com', 'passport', 'DE876543210', 'Germany', '1992-09-06', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Grace Scott', '+44 20 7946 0959', 'grace.scott@email.com', 'passport', 'GB567890123', 'UK', '1997-01-24', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Luis Fernandez', '+34 91 234 5678', 'luis.fernandez@email.com', 'passport', 'ES987654321', 'Spain', '1991-12-15', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Maria Garcia', '+34 91 345 6789', 'maria.garcia@email.com', 'passport', 'ES876543210', 'Spain', '1990-07-22', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Alexander Petrov', '+7 495 1234567', 'alexander.petrov@email.com', 'passport', 'RU963741852', 'Russia', '1986-07-31', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Eva Andersson', '+46 8 234 567 89', 'eva.andersson@email.com', 'passport', 'SE654321987', 'Sweden', '1993-03-21', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Daniel White', '+1 555-2024', 'daniel.white@email.com', 'passport', 'US345678901', 'USA', '1989-08-30', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Camille Martin', '+33 1 42 86 83 27', 'camille.martin@email.com', 'passport', 'FR258147369', 'France', '1995-05-16', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Marco Bianchi', '+39 06 23456789', 'marco.bianchi@email.com', 'passport', 'IT852963741', 'Italy', '1992-11-09', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Sarah O''Brien', '+353 1 345 6789', 'sarah.obrien@email.com', 'passport', 'IE741852963', 'Ireland', '1994-02-13', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Hiroshi Yamamoto', '+81 3 2345 6789', 'hiroshi.yamamoto@email.com', 'passport', 'JP852741963', 'Japan', '1988-04-20', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Olivia Brown', '+61 2 9374 4001', 'olivia.brown@email.com', 'passport', 'AU258369147', 'Australia', '1996-10-07', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Sofia Hernandez', '+57 1 345 6789', 'sofia.hernandez@email.com', 'passport', 'CO852741963', 'Colombia', '1997-07-09', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Benjamin Lee', '+86 10 23456789', 'benjamin.lee@email.com', 'passport', 'CN234567890', 'China', '1991-01-17', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Charlotte Taylor', '+1 555-2032', 'charlotte.taylor@email.com', 'passport', 'US456789012', 'USA', '1994-08-27', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Nikos Papadopoulos', '+30 21 1234 5678', 'nikos.papadopoulos@email.com', 'passport', 'GR741258369', 'Greece', '1987-06-14', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Victoria Nelson', '+90 212 123 4567', 'victoria.nelson@email.com', 'passport', 'TR852963741', 'Turkey', '1996-04-02', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('William Thompson', '+1 555-2035', 'william.thompson@email.com', 'passport', 'US567890123', 'USA', '1984-10-18', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Amelie Dubois', '+33 1 42 86 83 28', 'amelie.dubois@email.com', 'passport', 'FR147258369', 'France', '1998-01-30', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Hannah Cohen', '+972 2 123 4567', 'hannah.cohen@email.com', 'passport', 'IL741852963', 'Israel', '1993-09-23', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Lucas Brown', '+64 9 234 5678', 'lucas.brown@email.com', 'passport', 'NZ258147369', 'New Zealand', '1992-12-21', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Elena Rodriguez', '+34 91 456 7890', 'elena.rodriguez@email.com', 'passport', 'ES765432109', 'Spain', '1995-03-04', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Maximilian Weber', '+49 30 98765432', 'maximilian.weber@email.com', 'passport', 'DE765432109', 'Germany', '1989-05-23', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Alice Green', '+44 20 7946 0960', 'alice.green@email.com', 'passport', 'GB678901234', 'UK', '1996-06-26', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Andre Silva', '+55 11 97654-3210', 'andre.silva@email.com', 'passport', 'BR852741963', 'Brazil', '1991-11-30', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Luna Van Der Berg', '+31 20 1234567', 'luna.vanderberg@email.com', 'passport', 'NL147369258', 'Netherlands', '1994-02-28', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Jack Murphy', '+353 1 456 7890', 'jack.murphy@email.com', 'passport', 'IE963741852', 'Ireland', '1990-08-03', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Aria Kim', '+82 2 1234 5678', 'aria.kim@email.com', 'passport', 'KR852741963', 'South Korea', '1997-04-19', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Oliver Hansen', '+45 33 123456', 'oliver.hansen@email.com', 'passport', 'DK741258963', 'Denmark', '1992-02-13', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Sofia Andersson', '+46 8 345 678 90', 'sofia.andersson@email.com', 'passport', 'SE567890123', 'Sweden', '1995-11-29', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Ryan O''Sullivan', '+61 2 9374 4002', 'ryan.osullivan@email.com', 'passport', 'AU369147258', 'Australia', '1988-03-21', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Mia Johansson', '+46 8 456 789 01', 'mia.johansson@email.com', 'passport', 'SE654321098', 'Sweden', '1993-07-09', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('James Wilson', '+1 555-2050', 'james.wilson@email.com', 'passport', 'US678901234', 'USA', '1991-12-15', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL)
ON CONFLICT DO NOTHING;

-- ============================================
-- INSTRUCTORS (10 instructors: international with few Brazilian)
-- ============================================

INSERT INTO instructors (fullname, phone, email, bankdetail, hourlyrate, commission, monthlyfix, note) VALUES
('Carlos Silva', '+55 98 99123-3001', 'carlos.silva@kiteschool.com', 'Banco do Brasil, Agência: 1234-5, Conta: 11111-1', 45.00, 20.00, 2000.00, 'Instrutor brasileiro experiente, 10+ anos'),
('Mike Johnson', '+1 555-3002', 'mike.johnson@kiteschool.com', 'Bank: Chase, Account: 1234567890', 42.00, 18.00, 1800.00, 'Senior instructor from USA, IKO certified'),
('Sarah Williams', '+1 555-3003', 'sarah.williams@kiteschool.com', 'Bank: Bank of America, Account: 9876543210', 40.00, 20.00, 1500.00, 'Advanced lessons specialist'),
('Tom Rodriguez', '+34 91 123 4567', 'tom.rodriguez@kiteschool.com', 'Bank: BBVA, Account: 5555555555', 38.00, 15.00, 1600.00, 'Beginner-friendly instructor from Spain'),
('Emma Davis', '+44 20 7946 0959', 'emma.davis@kiteschool.com', 'Bank: HSBC, Account: 1111222233', 43.00, 22.00, 1900.00, 'Youth programs coordinator from UK'),
('Alex Martinez', '+1 555-3006', 'alex.martinez@kiteschool.com', 'Bank: Chase, Account: 4444555566', 41.00, 19.00, 1700.00, 'Competition training specialist'),
('Jessica Brown', '+61 2 9374 4001', 'jessica.brown@kiteschool.com', 'Bank: ANZ, Account: 7777888899', 39.00, 17.00, 1650.00, 'Women''s program specialist from Australia'),
('Chris Anderson', '+1 555-3008', 'chris.anderson@kiteschool.com', 'Bank: US Bank, Account: 1212121212', 44.00, 21.00, 1850.00, 'Advanced windsurfing instructor'),
('Ryan Moore', '+49 30 12345679', 'ryan.moore@kiteschool.com', 'Bank: Deutsche Bank, Account: 5656565656', 37.00, 16.00, 1550.00, 'Group lesson coordinator from Germany'),
('Fernando Costa', '+55 98 99123-3010', 'fernando.costa@kiteschool.com', 'Banco do Brasil, Agência: 1234-5, Conta: 22222-2', 46.00, 23.00, 2100.00, 'Instrutor brasileiro certificado IKO')
ON CONFLICT DO NOTHING;

-- ============================================
-- STAFF (5 staff members with Brazilian names)
-- ============================================

INSERT INTO staff (fullname, role, phone, email, bankdetail, hourlyrate, commission, monthlyfix, note) VALUES
('João Silva', 'Manager', '+55 98 99123-4001', 'joao.silva@kiteschool.com', 'Banco do Brasil, Agência: 1234-5, Conta: 30000-1', 35.00, 10.00, 3500.00, 'Gerente de operações'),
('Maria Santos', 'Receptionist', '+55 98 99123-4002', 'maria.santos@kiteschool.com', 'Banco do Brasil, Agência: 1234-5, Conta: 30000-2', 18.00, 5.00, 2800.00, 'Recepcionista e atendimento'),
('Pedro Oliveira', 'Beach Boy', '+55 98 99123-4003', 'pedro.oliveira@kiteschool.com', 'Banco do Brasil, Agência: 1234-5, Conta: 30000-3', 15.00, 3.00, 2400.00, 'Equipamentos e praia'),
('Ana Costa', 'Receptionist', '+55 98 99123-4004', 'ana.costa@kiteschool.com', 'Banco do Brasil, Agência: 1234-5, Conta: 30000-4', 17.00, 4.00, 2700.00, 'Atendimento ao cliente'),
('Rafael Souza', 'Beach Boy', '+55 98 99123-4005', 'rafael.souza@kiteschool.com', 'Banco do Brasil, Agência: 1234-5, Conta: 30000-5', 16.00, 3.50, 2500.00, 'Coordenador de segurança na praia')
ON CONFLICT DO NOTHING;

-- ============================================
-- TRANSACTIONS (50 realistic transactions for kitesurf school)
-- ============================================

-- Generate 25 customer payments (kitesurf lessons)
WITH customer_payments AS (
    SELECT 
        row_number() OVER () as rn,
        CURRENT_TIMESTAMP - (random() * INTERVAL '90 days') as occurred_at,
        CASE 
            WHEN random() < 0.3 THEN (random() * 50 + 80)::NUMERIC(12,2)  -- Beginner lesson $80-$130
            WHEN random() < 0.6 THEN (random() * 50 + 120)::NUMERIC(12,2)  -- Intermediate $120-$170
            WHEN random() < 0.8 THEN (random() * 50 + 150)::NUMERIC(12,2)  -- Advanced $150-$200
            ELSE (random() * 100 + 200)::NUMERIC(12,2)  -- Private lesson $200-$300
        END as amount,
        'BRL' as currency,
        (SELECT id FROM transaction_types WHERE code = 'CUSTOMER_PAYMENT' LIMIT 1) as type_id,
        CASE 
            WHEN random() < 0.4 THEN (SELECT id FROM payment_methods WHERE name = 'Cash' LIMIT 1)
            WHEN random() < 0.7 THEN (SELECT id FROM payment_methods WHERE name = 'Credit Card' LIMIT 1)
            WHEN random() < 0.9 THEN (SELECT id FROM payment_methods WHERE name = 'Debit Card' LIMIT 1)
            ELSE (SELECT id FROM payment_methods WHERE name = 'Bank Transfer' LIMIT 1)
        END as payment_method_id,
        'customer' as source_entity_type,
        (SELECT id FROM customers ORDER BY RANDOM() LIMIT 1) as source_entity_id,
        'company_account' as destination_entity_type,
        CASE 
            WHEN random() < 0.5 THEN (SELECT id FROM company_accounts WHERE name = 'Cashier' LIMIT 1)
            ELSE (SELECT id FROM company_accounts WHERE name = 'Banco do Brasil' LIMIT 1)
        END as destination_entity_id,
        CASE 
            WHEN random() < 0.25 THEN 'Aula de kitesurf iniciante - 2h'
            WHEN random() < 0.5 THEN 'Aula de kitesurf intermediário - 2h'
            WHEN random() < 0.75 THEN 'Aula de kitesurf avançado - 2h'
            ELSE 'Aula particular de kitesurf - 3h'
        END as note,
        (SELECT id FROM users WHERE role = 'admin' LIMIT 1) as created_by
    FROM generate_series(1, 25)
)
INSERT INTO transactions (occurred_at, amount, currency, type_id, payment_method_id, source_entity_type, source_entity_id, destination_entity_type, destination_entity_id, reference, note, created_by)
SELECT 
    occurred_at,
    amount,
    currency,
    type_id,
    payment_method_id,
    source_entity_type,
    source_entity_id,
    destination_entity_type,
    destination_entity_id,
    'AUL-' || LPAD(rn::TEXT, 6, '0') as reference,
    note,
    created_by
FROM customer_payments;

-- Generate 15 rental payments (equipment rental)
WITH rental_payments AS (
    SELECT 
        row_number() OVER () as rn,
        CURRENT_TIMESTAMP - (random() * INTERVAL '90 days') as occurred_at,
        CASE 
            WHEN random() < 0.4 THEN (random() * 30 + 50)::NUMERIC(12,2)  -- Half day $50-$80
            WHEN random() < 0.7 THEN (random() * 40 + 80)::NUMERIC(12,2)  -- Full day $80-$120
            ELSE (random() * 60 + 120)::NUMERIC(12,2)  -- 2 days $120-$180
        END as amount,
        'BRL' as currency,
        (SELECT id FROM transaction_types WHERE code = 'RENTAL_PAYMENT' LIMIT 1) as type_id,
        CASE 
            WHEN random() < 0.5 THEN (SELECT id FROM payment_methods WHERE name = 'Cash' LIMIT 1)
            WHEN random() < 0.8 THEN (SELECT id FROM payment_methods WHERE name = 'Credit Card' LIMIT 1)
            ELSE (SELECT id FROM payment_methods WHERE name = 'Debit Card' LIMIT 1)
        END as payment_method_id,
        'customer' as source_entity_type,
        (SELECT id FROM customers ORDER BY RANDOM() LIMIT 1) as source_entity_id,
        'company_account' as destination_entity_type,
        CASE 
            WHEN random() < 0.5 THEN (SELECT id FROM company_accounts WHERE name = 'Cashier' LIMIT 1)
            ELSE (SELECT id FROM company_accounts WHERE name = 'Banco do Brasil' LIMIT 1)
        END as destination_entity_id,
        CASE 
            WHEN random() < 0.33 THEN 'Aluguel kit completo - meio dia'
            WHEN random() < 0.66 THEN 'Aluguel kit completo - 1 dia'
            ELSE 'Aluguel kit completo - 2 dias'
        END as note,
        (SELECT id FROM users WHERE role = 'admin' LIMIT 1) as created_by
    FROM generate_series(1, 15)
)
INSERT INTO transactions (occurred_at, amount, currency, type_id, payment_method_id, source_entity_type, source_entity_id, destination_entity_type, destination_entity_id, reference, note, created_by)
SELECT 
    occurred_at,
    amount,
    currency,
    type_id,
    payment_method_id,
    source_entity_type,
    source_entity_id,
    destination_entity_type,
    destination_entity_id,
    'ALU-' || LPAD(rn::TEXT, 6, '0') as reference,
    note,
    created_by
FROM rental_payments;

-- Add 5 instructor salary payments (monthly)
WITH instructor_salaries AS (
    SELECT 
        row_number() OVER () as rn,
        DATE_TRUNC('month', CURRENT_TIMESTAMP - (random() * INTERVAL '90 days')) + INTERVAL '27 days' as occurred_at,
        CASE 
            WHEN random() < 0.3 THEN 1800.00 + (random() * 800 + 400)::NUMERIC(12,2)
            WHEN random() < 0.6 THEN 2000.00 + (random() * 900 + 500)::NUMERIC(12,2)
            ELSE 2100.00 + (random() * 1000 + 600)::NUMERIC(12,2)
        END as amount,
        'BRL' as currency,
        (SELECT id FROM transaction_types WHERE code = 'INSTRUCTOR_SALARY' LIMIT 1) as type_id,
        (SELECT id FROM payment_methods WHERE name = 'Bank Transfer' LIMIT 1) as payment_method_id,
        'company_account' as source_entity_type,
        (SELECT id FROM company_accounts WHERE name = 'Banco do Brasil' LIMIT 1) as source_entity_id,
        'instructor' as destination_entity_type,
        (SELECT id FROM instructors ORDER BY RANDOM() LIMIT 1) as destination_entity_id,
        'Salário mensal e comissão - ' || TO_CHAR(DATE_TRUNC('month', CURRENT_TIMESTAMP - (random() * INTERVAL '90 days')) + INTERVAL '27 days', 'Month YYYY') as note,
        (SELECT id FROM users WHERE role = 'admin' LIMIT 1) as created_by
    FROM generate_series(1, 5)
)
INSERT INTO transactions (occurred_at, amount, currency, type_id, payment_method_id, source_entity_type, source_entity_id, destination_entity_type, destination_entity_id, reference, note, created_by)
SELECT 
    occurred_at,
    -ABS(amount) as amount,
    currency,
    type_id,
    payment_method_id,
    source_entity_type,
    source_entity_id,
    destination_entity_type,
    destination_entity_id,
    'INS-' || LPAD(rn::TEXT, 6, '0') as reference,
    note,
    created_by
FROM instructor_salaries;

-- Add 2 staff salary payments (monthly)
WITH staff_salaries AS (
    SELECT 
        row_number() OVER () as rn,
        DATE_TRUNC('month', CURRENT_TIMESTAMP - (random() * INTERVAL '90 days')) + INTERVAL '27 days' as occurred_at,
        CASE 
            WHEN random() < 0.5 THEN 2400.00
            ELSE 2800.00
        END as amount,
        'BRL' as currency,
        (SELECT id FROM transaction_types WHERE code = 'STAFF_SALARY' LIMIT 1) as type_id,
        (SELECT id FROM payment_methods WHERE name = 'Bank Transfer' LIMIT 1) as payment_method_id,
        'company_account' as source_entity_type,
        (SELECT id FROM company_accounts WHERE name = 'Banco do Brasil' LIMIT 1) as source_entity_id,
        'staff' as destination_entity_type,
        (SELECT id FROM staff ORDER BY RANDOM() LIMIT 1) as destination_entity_id,
        'Salário mensal - ' || TO_CHAR(DATE_TRUNC('month', CURRENT_TIMESTAMP - (random() * INTERVAL '90 days')) + INTERVAL '27 days', 'Month YYYY') as note,
        (SELECT id FROM users WHERE role = 'admin' LIMIT 1) as created_by
    FROM generate_series(1, 2)
)
INSERT INTO transactions (occurred_at, amount, currency, type_id, payment_method_id, source_entity_type, source_entity_id, destination_entity_type, destination_entity_id, reference, note, created_by)
SELECT 
    occurred_at,
    -ABS(amount) as amount,
    currency,
    type_id,
    payment_method_id,
    source_entity_type,
    source_entity_id,
    destination_entity_type,
    destination_entity_id,
    'STF-' || LPAD(rn::TEXT, 6, '0') as reference,
    note,
    created_by
FROM staff_salaries;

-- Add 1 agency commission payment
WITH agency_commission AS (
    SELECT 
        CURRENT_TIMESTAMP - (random() * INTERVAL '30 days') as occurred_at,
        (random() * 500 + 300)::NUMERIC(12,2) as amount,
        'BRL' as currency,
        (SELECT id FROM transaction_types WHERE code = 'AGENCY_COMMISSION' LIMIT 1) as type_id,
        (SELECT id FROM payment_methods WHERE name = 'Bank Transfer' LIMIT 1) as payment_method_id,
        'company_account' as source_entity_type,
        (SELECT id FROM company_accounts WHERE name = 'Banco do Brasil' LIMIT 1) as source_entity_id,
        'agency' as destination_entity_type,
        (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1) as destination_entity_id,
        'Comissão mensal de agência' as note,
        (SELECT id FROM users WHERE role = 'admin' LIMIT 1) as created_by
)
INSERT INTO transactions (occurred_at, amount, currency, type_id, payment_method_id, source_entity_type, source_entity_id, destination_entity_type, destination_entity_id, reference, note, created_by)
SELECT 
    occurred_at,
    -ABS(amount) as amount,
    currency,
    type_id,
    payment_method_id,
    source_entity_type,
    source_entity_id,
    destination_entity_type,
    destination_entity_id,
    'AGC-000001' as reference,
    note,
    created_by
FROM agency_commission;

-- Add 1 transfer payment (transport service)
WITH transfer_payment AS (
    SELECT 
        CURRENT_TIMESTAMP - (random() * INTERVAL '90 days') as occurred_at,
        (random() * 300 + 200)::NUMERIC(12,2) as amount,
        'BRL' as currency,
        (SELECT id FROM transaction_types WHERE code = 'THIRD_PARTY_PAYMENT' LIMIT 1) as type_id,
        CASE 
            WHEN random() < 0.5 THEN (SELECT id FROM payment_methods WHERE name = 'Cash' LIMIT 1)
            ELSE (SELECT id FROM payment_methods WHERE name = 'Bank Transfer' LIMIT 1)
        END as payment_method_id,
        'company_account' as source_entity_type,
        (SELECT id FROM company_accounts WHERE name = 'Cashier' LIMIT 1) as source_entity_id,
        'third_party' as destination_entity_type,
        (SELECT id FROM third_parties WHERE category_id = (SELECT id FROM third_parties_categories WHERE name = 'Transport Services' LIMIT 1) ORDER BY RANDOM() LIMIT 1) as destination_entity_id,
        'Transfer de cliente do aeroporto para Atins' as note,
        (SELECT id FROM users WHERE role = 'admin' LIMIT 1) as created_by
)
INSERT INTO transactions (occurred_at, amount, currency, type_id, payment_method_id, source_entity_type, source_entity_id, destination_entity_type, destination_entity_id, reference, note, created_by)
SELECT 
    occurred_at,
    -ABS(amount) as amount,
    currency,
    type_id,
    payment_method_id,
    source_entity_type,
    source_entity_id,
    destination_entity_type,
    destination_entity_id,
    'TRF-000001' as reference,
    note,
    created_by
FROM transfer_payment;

-- Add 1 equipment repair payment (mechanic)
WITH equipment_repair AS (
    SELECT 
        CURRENT_TIMESTAMP - (random() * INTERVAL '90 days') as occurred_at,
        (random() * 400 + 150)::NUMERIC(12,2) as amount,
        'BRL' as currency,
        (SELECT id FROM transaction_types WHERE code = 'EQUIPMENT_REPAIR' LIMIT 1) as type_id,
        CASE 
            WHEN random() < 0.5 THEN (SELECT id FROM payment_methods WHERE name = 'Cash' LIMIT 1)
            ELSE (SELECT id FROM payment_methods WHERE name = 'Bank Transfer' LIMIT 1)
        END as payment_method_id,
        'company_account' as source_entity_type,
        (SELECT id FROM company_accounts WHERE name = 'Cashier' LIMIT 1) as source_entity_id,
        'third_party' as destination_entity_type,
        (SELECT id FROM third_parties WHERE category_id = (SELECT id FROM third_parties_categories WHERE name = 'Mechanics' LIMIT 1) ORDER BY RANDOM() LIMIT 1) as destination_entity_id,
        CASE 
            WHEN random() < 0.33 THEN 'Reparo de kite - tecido rasgado'
            WHEN random() < 0.66 THEN 'Reparo de prancha - borda rachada'
            ELSE 'Reparo de trapézio e linhas'
        END as note,
        (SELECT id FROM users WHERE role = 'admin' LIMIT 1) as created_by
)
INSERT INTO transactions (occurred_at, amount, currency, type_id, payment_method_id, source_entity_type, source_entity_id, destination_entity_type, destination_entity_id, reference, note, created_by)
SELECT 
    occurred_at,
    -ABS(amount) as amount,
    currency,
    type_id,
    payment_method_id,
    source_entity_type,
    source_entity_id,
    destination_entity_type,
    destination_entity_id,
    'REP-000001' as reference,
    note,
    created_by
FROM equipment_repair;

-- Add 1 downwinder guide payment
WITH guide_payment AS (
    SELECT 
        CURRENT_TIMESTAMP - (random() * INTERVAL '90 days') as occurred_at,
        (random() * 500 + 300)::NUMERIC(12,2) as amount,
        'BRL' as currency,
        (SELECT id FROM transaction_types WHERE code = 'THIRD_PARTY_PAYMENT' LIMIT 1) as type_id,
        CASE 
            WHEN random() < 0.5 THEN (SELECT id FROM payment_methods WHERE name = 'Cash' LIMIT 1)
            ELSE (SELECT id FROM payment_methods WHERE name = 'Bank Transfer' LIMIT 1)
        END as payment_method_id,
        'company_account' as source_entity_type,
        (SELECT id FROM company_accounts WHERE name = 'Banco do Brasil' LIMIT 1) as source_entity_id,
        'third_party' as destination_entity_type,
        (SELECT id FROM third_parties WHERE category_id = (SELECT id FROM third_parties_categories WHERE name = 'Downwinder Guides' LIMIT 1) ORDER BY RANDOM() LIMIT 1) as destination_entity_id,
        'Pagamento guia downwinder - tour completo' as note,
        (SELECT id FROM users WHERE role = 'admin' LIMIT 1) as created_by
)
INSERT INTO transactions (occurred_at, amount, currency, type_id, payment_method_id, source_entity_type, source_entity_id, destination_entity_type, destination_entity_id, reference, note, created_by)
SELECT 
    occurred_at,
    -ABS(amount) as amount,
    currency,
    type_id,
    payment_method_id,
    source_entity_type,
    source_entity_id,
    destination_entity_type,
    destination_entity_id,
    'GUI-000001' as reference,
    note,
    created_by
FROM guide_payment;

-- ============================================
-- SERVICE CATEGORIES
-- ============================================

INSERT INTO service_categories (name, description) VALUES
('Lessons', 'Kitesurfing lesson services'),
('Rental', 'Equipment rental services'),
('Storage', 'Equipment storage services'),
('Downwinds', 'Downwinder tour services')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- SERVICES
-- ============================================

INSERT INTO services (category_id, name, description, base_price, currency) VALUES
((SELECT id FROM service_categories WHERE name = 'Lessons'), 'Beginner Lesson', '2-hour beginner kitesurfing lesson', 120.00, 'BRL'),
((SELECT id FROM service_categories WHERE name = 'Lessons'), 'Intermediate Lesson', '2-hour intermediate kitesurfing lesson', 150.00, 'BRL'),
((SELECT id FROM service_categories WHERE name = 'Lessons'), 'Advanced Lesson', '2-hour advanced kitesurfing lesson', 180.00, 'BRL'),
((SELECT id FROM service_categories WHERE name = 'Lessons'), 'Private Lesson', 'Private one-on-one lesson', 200.00, 'BRL'),
((SELECT id FROM service_categories WHERE name = 'Rental'), 'Full Kit Rental', 'Complete kite equipment rental (kite, board, harness)', 80.00, 'BRL'),
((SELECT id FROM service_categories WHERE name = 'Rental'), 'Kite Only Rental', 'Kite and bar rental', 50.00, 'BRL'),
((SELECT id FROM service_categories WHERE name = 'Rental'), 'Board Only Rental', 'Kiteboard rental', 30.00, 'BRL'),
((SELECT id FROM service_categories WHERE name = 'Storage'), 'Daily Storage', 'Daily equipment storage', 10.00, 'BRL'),
((SELECT id FROM service_categories WHERE name = 'Storage'), 'Weekly Storage', 'Weekly equipment storage', 50.00, 'BRL'),
((SELECT id FROM service_categories WHERE name = 'Downwinds'), 'Downwinder Tour', 'Guided downwinder tour', 200.00, 'BRL')
ON CONFLICT DO NOTHING;

-- ============================================
-- SERVICE PACKAGES (Lesson Packages)
-- ============================================

INSERT INTO service_packages (service_id, name, duration_hours, price, currency, description) VALUES
((SELECT id FROM services WHERE name = 'Beginner Lesson'), '2h Package', 2.0, 120.00, 'BRL', '2-hour beginner lesson package'),
((SELECT id FROM services WHERE name = 'Beginner Lesson'), '4h Package', 4.0, 220.00, 'BRL', '4-hour beginner lesson package (save R$20)'),
((SELECT id FROM services WHERE name = 'Beginner Lesson'), '6h Package', 6.0, 300.00, 'BRL', '6-hour beginner lesson package (save R$60)'),
((SELECT id FROM services WHERE name = 'Beginner Lesson'), '8h Package', 8.0, 380.00, 'BRL', '8-hour beginner lesson package (save R$100)'),
((SELECT id FROM services WHERE name = 'Beginner Lesson'), '10h Package', 10.0, 450.00, 'BRL', '10-hour beginner lesson package (save R$150)'),
((SELECT id FROM services WHERE name = 'Intermediate Lesson'), '2h Package', 2.0, 150.00, 'BRL', '2-hour intermediate lesson package'),
((SELECT id FROM services WHERE name = 'Intermediate Lesson'), '4h Package', 4.0, 280.00, 'BRL', '4-hour intermediate lesson package (save R$20)'),
((SELECT id FROM services WHERE name = 'Intermediate Lesson'), '6h Package', 6.0, 390.00, 'BRL', '6-hour intermediate lesson package (save R$60)'),
((SELECT id FROM services WHERE name = 'Advanced Lesson'), '2h Package', 2.0, 180.00, 'BRL', '2-hour advanced lesson package'),
((SELECT id FROM services WHERE name = 'Advanced Lesson'), '4h Package', 4.0, 340.00, 'BRL', '4-hour advanced lesson package (save R$20)')
ON CONFLICT DO NOTHING;

-- ============================================
-- PRODUCT CATEGORIES
-- ============================================

INSERT INTO product_categories (name, description) VALUES
('Clothing', 'Kitesurfing apparel and clothing'),
('Sun Protection', 'Sunscreen and sun protection items'),
('Equipment', 'Kitesurfing equipment and accessories'),
('Accessories', 'Miscellaneous kitesurfing accessories')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- PRODUCTS
-- ============================================

INSERT INTO products (category_id, name, description, price, currency, sku, stock_quantity) VALUES
((SELECT id FROM product_categories WHERE name = 'Clothing'), 'Kitesurfing T-Shirt', 'Branded kitesurfing t-shirt', 45.00, 'BRL', 'TSH-001', 50),
((SELECT id FROM product_categories WHERE name = 'Clothing'), 'Rash Guard', 'UV protection rash guard', 65.00, 'BRL', 'RASH-001', 30),
((SELECT id FROM product_categories WHERE name = 'Clothing'), 'Board Shorts', 'Quick-dry board shorts', 85.00, 'BRL', 'SHORT-001', 40),
((SELECT id FROM product_categories WHERE name = 'Sun Protection'), 'Sunscreen SPF 50', 'Waterproof sunscreen 100ml', 25.00, 'BRL', 'SPF-001', 100),
((SELECT id FROM product_categories WHERE name = 'Sun Protection'), 'Sunscreen SPF 30', 'Waterproof sunscreen 100ml', 20.00, 'BRL', 'SPF-002', 80),
((SELECT id FROM product_categories WHERE name = 'Sun Protection'), 'Sun Hat', 'Wide-brim sun hat', 35.00, 'BRL', 'HAT-001', 25),
((SELECT id FROM product_categories WHERE name = 'Equipment'), 'Kite Repair Kit', 'Essential repair tools and patches', 35.00, 'BRL', 'REP-001', 30),
((SELECT id FROM product_categories WHERE name = 'Equipment'), 'Pump Adapter', 'Pump adapter for kite inflation', 15.00, 'BRL', 'PUMP-001', 50),
((SELECT id FROM product_categories WHERE name = 'Equipment'), 'Safety Leash', 'Kite safety leash', 45.00, 'BRL', 'LEASH-001', 20),
((SELECT id FROM product_categories WHERE name = 'Accessories'), 'Waterproof Phone Case', 'Waterproof case for phone', 30.00, 'BRL', 'CASE-001', 40),
((SELECT id FROM product_categories WHERE name = 'Accessories'), 'GoPro Mount', 'Mount for action camera', 25.00, 'BRL', 'MOUNT-001', 30),
((SELECT id FROM product_categories WHERE name = 'Accessories'), 'Towel', 'Quick-dry microfiber towel', 20.00, 'BRL', 'TOWEL-001', 60)
ON CONFLICT DO NOTHING;

-- ============================================
-- SAMPLE ORDERS (Optional - for testing)
-- ============================================
-- Note: Sample orders are created only if admin user and customers exist
-- They demonstrate the tab/payment system

-- Create Order 1: Customer with lesson package and products (open tab)
DO $$
DECLARE
    v_customer_id INTEGER;
    v_instructor_id INTEGER;
    v_admin_id INTEGER;
    v_order_id INTEGER;
    v_package_id INTEGER;
    v_sunscreen_id INTEGER;
    v_rashguard_id INTEGER;
    v_cash_payment_method_id INTEGER;
    v_cashier_account_id INTEGER;
BEGIN
    -- Get IDs
    SELECT id INTO v_customer_id FROM customers LIMIT 1;
    SELECT id INTO v_instructor_id FROM instructors LIMIT 1;
    SELECT id INTO v_admin_id FROM users WHERE role = 'admin' LIMIT 1;
    SELECT id INTO v_package_id FROM service_packages WHERE name = '4h Package' AND service_id = (SELECT id FROM services WHERE name = 'Beginner Lesson') LIMIT 1;
    SELECT id INTO v_sunscreen_id FROM products WHERE name = 'Sunscreen SPF 50' LIMIT 1;
    SELECT id INTO v_rashguard_id FROM products WHERE name = 'Rash Guard' LIMIT 1;
    SELECT id INTO v_cash_payment_method_id FROM payment_methods WHERE name = 'Cash' LIMIT 1;
    SELECT id INTO v_cashier_account_id FROM company_accounts WHERE name = 'Cashier' LIMIT 1;
    
    -- Only create if all required data exists
    IF v_customer_id IS NOT NULL AND v_admin_id IS NOT NULL THEN
        -- Create order
        INSERT INTO orders (order_number, customer_id, status, instructor_id, created_by)
        VALUES (NULL, v_customer_id, 'open', v_instructor_id, v_admin_id)
        RETURNING id INTO v_order_id;
        
        -- Add items if they exist
        IF v_package_id IS NOT NULL THEN
            INSERT INTO order_items (order_id, item_type, item_id, item_name, quantity, unit_price, subtotal)
            VALUES (v_order_id, 'service_package', v_package_id, '4h Package - Beginner Lesson', 1, 220.00, 220.00);
        END IF;
        
        IF v_sunscreen_id IS NOT NULL THEN
            INSERT INTO order_items (order_id, item_type, item_id, item_name, quantity, unit_price, subtotal)
            VALUES (v_order_id, 'product', v_sunscreen_id, 'Sunscreen SPF 50', 2, 25.00, 50.00);
        END IF;
        
        IF v_rashguard_id IS NOT NULL THEN
            INSERT INTO order_items (order_id, item_type, item_id, item_name, quantity, unit_price, subtotal)
            VALUES (v_order_id, 'product', v_rashguard_id, 'Rash Guard', 1, 65.00, 65.00);
        END IF;
        
        -- Add deposit payment
        IF v_cash_payment_method_id IS NOT NULL THEN
            INSERT INTO order_payments (order_id, amount, currency, payment_method_id, company_account_id, occurred_at, created_by, note)
            VALUES (v_order_id, 100.00, 'BRL', v_cash_payment_method_id, v_cashier_account_id, CURRENT_TIMESTAMP, v_admin_id, 'Deposit payment');
        END IF;
    END IF;
END $$;

-- Create Order 2: Closed order with full payment
DO $$
DECLARE
    v_customer_id INTEGER;
    v_admin_id INTEGER;
    v_order_id INTEGER;
    v_rental_service_id INTEGER;
    v_storage_service_id INTEGER;
    v_card_payment_method_id INTEGER;
    v_bank_account_id INTEGER;
    v_closed_date TIMESTAMP;
BEGIN
    -- Get IDs (different customer if possible)
    SELECT id INTO v_customer_id FROM customers ORDER BY id OFFSET 1 LIMIT 1;
    -- Fallback to first customer if only one exists
    IF v_customer_id IS NULL THEN
        SELECT id INTO v_customer_id FROM customers LIMIT 1;
    END IF;
    
    SELECT id INTO v_admin_id FROM users WHERE role = 'admin' LIMIT 1;
    SELECT id INTO v_rental_service_id FROM services WHERE name = 'Full Kit Rental' LIMIT 1;
    SELECT id INTO v_storage_service_id FROM services WHERE name = 'Daily Storage' LIMIT 1;
    SELECT id INTO v_card_payment_method_id FROM payment_methods WHERE name = 'Credit Card' LIMIT 1;
    SELECT id INTO v_bank_account_id FROM company_accounts WHERE name = 'Banco do Brasil' LIMIT 1;
    
    v_closed_date := CURRENT_TIMESTAMP - INTERVAL '2 days';
    
    -- Only create if all required data exists
    IF v_customer_id IS NOT NULL AND v_admin_id IS NOT NULL THEN
        -- Create closed order
        INSERT INTO orders (order_number, customer_id, status, closed_at, created_by)
        VALUES (NULL, v_customer_id, 'closed', v_closed_date, v_admin_id)
        RETURNING id INTO v_order_id;
        
        -- Add items if they exist
        IF v_rental_service_id IS NOT NULL THEN
            INSERT INTO order_items (order_id, item_type, item_id, item_name, quantity, unit_price, subtotal)
            VALUES (v_order_id, 'service', v_rental_service_id, 'Full Kit Rental', 2, 80.00, 160.00);
        END IF;
        
        IF v_storage_service_id IS NOT NULL THEN
            INSERT INTO order_items (order_id, item_type, item_id, item_name, quantity, unit_price, subtotal)
            VALUES (v_order_id, 'service', v_storage_service_id, 'Daily Storage', 2, 10.00, 20.00);
        END IF;
        
        -- Add full payment
        IF v_card_payment_method_id IS NOT NULL THEN
            INSERT INTO order_payments (order_id, amount, currency, payment_method_id, company_account_id, occurred_at, created_by, note)
            VALUES (v_order_id, 180.00, 'BRL', v_card_payment_method_id, v_bank_account_id, v_closed_date, v_admin_id, 'Full payment - order closed');
        END IF;
    END IF;
END $$;

-- ============================================
-- SEED COMPLETE
-- ============================================
