-- Equipment categories
INSERT INTO equipment_categories (name) VALUES
('Boards'),
('Kites'),
('Harnesses')
ON CONFLICT (name) DO NOTHING;

-- Equipment items
WITH board_category AS (
  SELECT id FROM equipment_categories WHERE name = 'Boards'
)
INSERT INTO equipment (category_id, name, description)
SELECT id, 'Cabrinha Spectrum 138', 'All-around freeride twin tip board' FROM board_category
ON CONFLICT DO NOTHING;

WITH kite_category AS (
  SELECT id FROM equipment_categories WHERE name = 'Kites'
)
INSERT INTO equipment (category_id, name, description)
SELECT id, 'Duotone Rebel 9m', 'Stable freeride kite ideal for most wind conditions' FROM kite_category
ON CONFLICT DO NOTHING;

WITH harness_category AS (
  SELECT id FROM equipment_categories WHERE name = 'Harnesses'
)
INSERT INTO equipment (category_id, name, description)
SELECT id, 'Mystic Warrior Waist Harness', 'Comfortable waist harness with spreader bar' FROM harness_category
ON CONFLICT DO NOTHING;

