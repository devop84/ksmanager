-- Seed data for staff table
-- Sample staff members: receptionists, beachboys, administrators, and other employees

INSERT INTO staff (fullname, role, phone, email, bankdetail, hourlyrate, commission, monthlyfix, note) VALUES
('Maria Silva', 'receptionist', '+55 11 98765-4321', 'maria.silva@example.com', 'Banco do Brasil - Ag: 1234-5, CC: 12345-6', 25.00, NULL, 2000.00, 'Main receptionist, works morning shift'),
('João Santos', 'beachboy', '+55 11 98765-4322', 'joao.santos@example.com', 'Caixa Econômica - Ag: 5678, CC: 98765-4', 20.00, NULL, 1500.00, 'Beach equipment setup and customer assistance'),
('Ana Costa', 'administrator', '+55 11 98765-4323', 'ana.costa@example.com', 'Bradesco - Ag: 9012-3, CC: 45678-9', 35.00, NULL, 3500.00, 'Office administrator, handles daily operations'),
('Carlos Oliveira', 'beachboy', '+55 11 98765-4324', 'carlos.oliveira@example.com', 'Itaú - Ag: 3456-7, CC: 78901-2', 20.00, NULL, 1500.00, 'Beach services and equipment maintenance'),
('Patricia Lima', 'receptionist', '+55 11 98765-4325', 'patricia.lima@example.com', 'Santander - Ag: 7890-1, CC: 23456-7', 25.00, NULL, 2000.00, 'Evening shift receptionist'),
('Roberto Alves', 'other', '+55 11 98765-4326', 'roberto.alves@example.com', 'Banco Inter - Ag: 1111, CC: 11111-1', 18.00, NULL, NULL, 'Part-time helper, flexible schedule');

