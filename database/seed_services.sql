-- Service categories
INSERT INTO service_categories (name) VALUES
('lessons'),
('rentals')
ON CONFLICT (name) DO NOTHING;

-- Lesson services
WITH base_categories AS (
  SELECT id FROM service_categories WHERE name = 'lessons'
)
INSERT INTO services (name, category_id, description, active)
SELECT 'Private 1h Lesson', id, 'One-on-one instruction, 60 minutes', TRUE FROM base_categories
ON CONFLICT DO NOTHING;

WITH base_categories AS (
  SELECT id FROM service_categories WHERE name = 'lessons'
),
existing_service AS (
  SELECT s.id
  FROM services s
  JOIN base_categories bc ON s.category_id = bc.id
  WHERE s.name = 'Private 1h Lesson'
)
INSERT INTO services_lessons (service_id, default_duration_hours, base_price_per_hour, requires_package_pricing)
SELECT id, 1.0, 120.00, TRUE FROM existing_service
ON CONFLICT (service_id) DO NOTHING;

WITH existing_service AS (
  SELECT s.id
  FROM services s
  WHERE s.name = 'Private 1h Lesson'
)
INSERT INTO services_lessons_packages (service_id, min_total_hours, max_total_hours, price_per_hour) VALUES
((SELECT id FROM existing_service), 0, 3, 120.00),
((SELECT id FROM existing_service), 3, 6, 110.00),
((SELECT id FROM existing_service), 6, NULL, 100.00)
ON CONFLICT DO NOTHING;

-- Rental services
WITH rental_category AS (
  SELECT id FROM service_categories WHERE name = 'rentals'
)
INSERT INTO services (name, category_id, description, active)
SELECT 'Twin Tip Board Rental', id, 'Quality boards available hourly or daily', TRUE FROM rental_category
ON CONFLICT DO NOTHING;

WITH rental_service AS (
  SELECT s.id
  FROM services s
  JOIN rental_category rc ON s.category_id = rc.id
  WHERE s.name = 'Twin Tip Board Rental'
)
INSERT INTO services_rentals (service_id, gear_id, hourly_rate, daily_rate, weekly_rate)
SELECT id, 'board-twintip', 30.00, 120.00, 420.00 FROM rental_service
ON CONFLICT (service_id) DO UPDATE
SET gear_id = EXCLUDED.gear_id,
    hourly_rate = EXCLUDED.hourly_rate,
    daily_rate = EXCLUDED.daily_rate,
    weekly_rate = EXCLUDED.weekly_rate;

WITH storage_category AS (
  SELECT id FROM service_categories WHERE name = 'storage'
)
INSERT INTO service_categories (name) VALUES ('storage')
ON CONFLICT (name) DO NOTHING;

WITH storage_category AS (
  SELECT id FROM service_categories WHERE name = 'storage'
)
INSERT INTO services (name, category_id, description, active)
SELECT 'Individual Storage', id, 'Secure locker for personal gear', TRUE FROM storage_category
ON CONFLICT DO NOTHING;

WITH storage_service AS (
  SELECT s.id
  FROM services s
  JOIN storage_category sc ON s.category_id = sc.id
  WHERE s.name = 'Individual Storage'
)
INSERT INTO services_storage (service_id, daily_rate, weekly_rate, monthly_rate)
SELECT id, 15.00, 80.00, 250.00 FROM storage_service
ON CONFLICT (service_id) DO UPDATE
SET daily_rate = EXCLUDED.daily_rate,
    weekly_rate = EXCLUDED.weekly_rate,
    monthly_rate = EXCLUDED.monthly_rate;

