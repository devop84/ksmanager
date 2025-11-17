-- Sample orders with statuses
WITH lesson_data AS (
  SELECT
    (SELECT id FROM services WHERE name = 'Private 1h Lesson' LIMIT 1) AS service_id,
    (SELECT id FROM customers ORDER BY id LIMIT 1) AS customer_id,
    (SELECT id FROM instructors ORDER BY id LIMIT 1) AS instructor_id
),
lesson_order AS (
  INSERT INTO orders (service_id, customer_id, cancelled)
  SELECT service_id, customer_id, FALSE
  FROM lesson_data
  RETURNING id
)
INSERT INTO orders_lessons (order_id, student_id, instructor_id, starting, ending, note)
SELECT lesson_order.id, lesson_data.customer_id, lesson_data.instructor_id,
       NOW() + INTERVAL '1 day',
       NOW() + INTERVAL '1 day 2 hours',
       'Intro lesson focusing on board control'
FROM lesson_order, lesson_data
ON CONFLICT (order_id) DO NOTHING;

WITH rental_data AS (
  SELECT
    (SELECT id FROM services WHERE name = 'Twin Tip Board Rental' LIMIT 1) AS service_id,
    (SELECT id FROM customers ORDER BY id OFFSET 1 LIMIT 1) AS customer_id,
    (SELECT id FROM equipment ORDER BY id LIMIT 1) AS equipment_id
),
rental_order AS (
  INSERT INTO orders (service_id, customer_id, cancelled)
  SELECT service_id, customer_id, FALSE
  FROM rental_data
  RETURNING id
)
INSERT INTO orders_rentals (order_id, equipment_id, hourly, daily, weekly, starting, ending, note)
SELECT rental_order.id, rental_data.equipment_id, FALSE, TRUE, FALSE,
       NOW() - INTERVAL '1 day',
       NOW() + INTERVAL '1 day',
       'Weekend rental with insurance'
FROM rental_order, rental_data
ON CONFLICT (order_id) DO NOTHING;

WITH storage_data AS (
  SELECT
    s.id AS service_id,
    (SELECT id FROM customers ORDER BY id OFFSET 2 LIMIT 1) AS customer_id
  FROM services s
  JOIN service_categories sc ON sc.id = s.category_id
  WHERE sc.name = 'storage'
  ORDER BY s.id
  LIMIT 1
),
storage_order AS (
  INSERT INTO orders (service_id, customer_id, cancelled)
  SELECT service_id, customer_id, FALSE
  FROM storage_data
  RETURNING id
)
INSERT INTO orders_storage (order_id, storage_id, daily, weekly, monthly, starting, ending, note)
SELECT storage_order.id, storage_data.service_id, FALSE, FALSE, TRUE,
       NOW() - INTERVAL '40 days',
       NOW() - INTERVAL '10 days',
       'Monthly storage for travel'
FROM storage_order, storage_data
ON CONFLICT (order_id) DO NOTHING;

WITH cancelled_data AS (
  SELECT
    (SELECT id FROM services WHERE name = 'Private 1h Lesson' LIMIT 1) AS service_id,
    (SELECT id FROM customers ORDER BY id OFFSET 3 LIMIT 1) AS customer_id,
    (SELECT id FROM instructors ORDER BY id OFFSET 1 LIMIT 1) AS instructor_id
),
cancelled_order AS (
  INSERT INTO orders (service_id, customer_id, cancelled)
  SELECT service_id, customer_id, TRUE
  FROM cancelled_data
  RETURNING id
)
INSERT INTO orders_lessons (order_id, student_id, instructor_id, starting, ending, note)
SELECT cancelled_order.id, cancelled_data.customer_id, cancelled_data.instructor_id,
       NOW() + INTERVAL '5 days',
       NOW() + INTERVAL '5 days 1 hour',
       'Customer cancelled due to weather'
FROM cancelled_order, cancelled_data
ON CONFLICT (order_id) DO NOTHING;