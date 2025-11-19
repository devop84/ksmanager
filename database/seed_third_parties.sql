INSERT INTO third_parties (name, category_id, phone, email, note) VALUES
('Island Flow Logistics', (SELECT id FROM third_parties_categories WHERE name = 'Logistics Provider'), '+1 808 555 9911', 'ops@islandflowlogistics.com', 'Handles weekly freight from Oahu'),
('BlueFin Boats', (SELECT id FROM third_parties_categories WHERE name = 'Transportation'), '+1 242 555 7733', 'charters@bluefinboats.co', 'Boat transfers for downwind trips'),
('Peak Performance Clinic', (SELECT id FROM third_parties_categories WHERE name = 'Medical Partner'), '+34 922 555 443', 'care@peakperformanceclinic.es', 'On-call physio and first-aid'),
('Swift Wing Supplies', (SELECT id FROM third_parties_categories WHERE name = 'Equipment Supplier'), '+61 2 5550 8822', 'hello@swiftwingsupplies.au', 'Emergency kite replacement stock'),
('Sunset Catering Co.', (SELECT id FROM third_parties_categories WHERE name = 'Catering'), '+1 305 555 6611', 'events@sunsetcatering.co', 'Preferred vendor for VIP events');

