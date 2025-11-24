-- Migration: Redo Credit System
-- Date: 2024
-- Description: Implements new credit system where:
--   - Appointments can only be made if customer has order open
--   - Appointments don't need credit to be created but can generate negative credits
--   - Orders can only be closed if all service credits are 0

-- Step 1: Add order_id to scheduled_appointments table
ALTER TABLE scheduled_appointments 
ADD COLUMN IF NOT EXISTS order_id INTEGER REFERENCES orders(id) ON DELETE RESTRICT;

-- Create index for order_id
CREATE INDEX IF NOT EXISTS idx_scheduled_appointments_order ON scheduled_appointments(order_id);

-- Step 2: Create function to calculate credit balance per service per order
-- This calculates: (credits from order_items) - (appointments duration)
CREATE OR REPLACE FUNCTION get_order_service_credit_balance(order_id_param INTEGER, service_id_param INTEGER)
RETURNS TABLE (
    service_id INTEGER,
    service_name VARCHAR,
    duration_unit VARCHAR,
    credits_from_items NUMERIC,
    credits_used_by_appointments NUMERIC,
    balance NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as service_id,
        s.name as service_name,
        s.duration_unit,
        -- Sum of credits from order_items for this service
        CASE 
            WHEN s.duration_unit = 'hours' THEN 
                COALESCE(SUM(
                    CASE 
                        WHEN oi.item_type = 'service_package' THEN sp.duration_hours * oi.quantity
                        WHEN oi.item_type = 'service' THEN 1 * oi.quantity
                        ELSE 0
                    END
                ), 0)
            WHEN s.duration_unit = 'days' THEN 
                COALESCE(SUM(
                    CASE 
                        WHEN oi.item_type = 'service_package' THEN sp.duration_days * oi.quantity
                        WHEN oi.item_type = 'service' THEN 1 * oi.quantity
                        ELSE 0
                    END
                ), 0)
            WHEN s.duration_unit = 'months' THEN 
                COALESCE(SUM(
                    CASE 
                        WHEN oi.item_type = 'service_package' THEN sp.duration_months * oi.quantity
                        WHEN oi.item_type = 'service' THEN 1 * oi.quantity
                        ELSE 0
                    END
                ), 0)::NUMERIC
            ELSE 0
        END as credits_from_items,
        -- Sum of appointments duration for this service in this order
        CASE 
            WHEN s.duration_unit = 'hours' THEN 
                COALESCE(SUM(sa.duration_hours) FILTER (
                    WHERE sa.status IN ('scheduled', 'completed') 
                    AND sa.cancelled_at IS NULL
                ), 0)
            WHEN s.duration_unit = 'days' THEN 
                COALESCE(SUM(sa.duration_days) FILTER (
                    WHERE sa.status IN ('scheduled', 'completed') 
                    AND sa.cancelled_at IS NULL
                ), 0)
            WHEN s.duration_unit = 'months' THEN 
                COALESCE(SUM(sa.duration_months) FILTER (
                    WHERE sa.status IN ('scheduled', 'completed') 
                    AND sa.cancelled_at IS NULL
                ), 0)::NUMERIC
            ELSE 0
        END as credits_used_by_appointments,
        -- Balance = credits_from_items - credits_used_by_appointments
        CASE 
            WHEN s.duration_unit = 'hours' THEN 
                COALESCE(SUM(
                    CASE 
                        WHEN oi.item_type = 'service_package' THEN sp.duration_hours * oi.quantity
                        WHEN oi.item_type = 'service' THEN 1 * oi.quantity
                        ELSE 0
                    END
                ), 0) - COALESCE(SUM(sa.duration_hours) FILTER (
                    WHERE sa.status IN ('scheduled', 'completed') 
                    AND sa.cancelled_at IS NULL
                ), 0)
            WHEN s.duration_unit = 'days' THEN 
                COALESCE(SUM(
                    CASE 
                        WHEN oi.item_type = 'service_package' THEN sp.duration_days * oi.quantity
                        WHEN oi.item_type = 'service' THEN 1 * oi.quantity
                        ELSE 0
                    END
                ), 0) - COALESCE(SUM(sa.duration_days) FILTER (
                    WHERE sa.status IN ('scheduled', 'completed') 
                    AND sa.cancelled_at IS NULL
                ), 0)
            WHEN s.duration_unit = 'months' THEN 
                (COALESCE(SUM(
                    CASE 
                        WHEN oi.item_type = 'service_package' THEN sp.duration_months * oi.quantity
                        WHEN oi.item_type = 'service' THEN 1 * oi.quantity
                        ELSE 0
                    END
                ), 0)::NUMERIC - COALESCE(SUM(sa.duration_months) FILTER (
                    WHERE sa.status IN ('scheduled', 'completed') 
                    AND sa.cancelled_at IS NULL
                ), 0)::NUMERIC)
            ELSE 0
        END as balance
    FROM services s
    LEFT JOIN order_items oi ON oi.order_id = order_id_param
        AND (
            (oi.item_type = 'service_package' AND EXISTS (
                SELECT 1 FROM service_packages sp2 
                WHERE sp2.id = oi.item_id AND sp2.service_id = s.id
            ))
            OR (oi.item_type = 'service' AND oi.item_id = s.id)
        )
    LEFT JOIN service_packages sp ON oi.item_type = 'service_package' AND sp.id = oi.item_id AND sp.service_id = s.id
    LEFT JOIN scheduled_appointments sa ON sa.order_id = order_id_param 
        AND sa.service_id = s.id
    WHERE s.id = service_id_param
        AND s.duration_unit != 'none'
    GROUP BY s.id, s.name, s.duration_unit;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create function to get all service credit balances for an order
CREATE OR REPLACE FUNCTION get_order_all_service_credits(order_id_param INTEGER)
RETURNS TABLE (
    service_id INTEGER,
    service_name VARCHAR,
    duration_unit VARCHAR,
    credits_from_items NUMERIC,
    credits_used_by_appointments NUMERIC,
    balance NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        s.id as service_id,
        s.name as service_name,
        s.duration_unit,
        -- Sum of credits from order_items for this service
        CASE 
            WHEN s.duration_unit = 'hours' THEN 
                COALESCE(SUM(
                    CASE 
                        WHEN oi.item_type = 'service_package' THEN sp.duration_hours * oi.quantity
                        WHEN oi.item_type = 'service' THEN 1 * oi.quantity
                        ELSE 0
                    END
                ) FILTER (WHERE oi.id IS NOT NULL), 0)
            WHEN s.duration_unit = 'days' THEN 
                COALESCE(SUM(
                    CASE 
                        WHEN oi.item_type = 'service_package' THEN sp.duration_days * oi.quantity
                        WHEN oi.item_type = 'service' THEN 1 * oi.quantity
                        ELSE 0
                    END
                ) FILTER (WHERE oi.id IS NOT NULL), 0)
            WHEN s.duration_unit = 'months' THEN 
                COALESCE(SUM(
                    CASE 
                        WHEN oi.item_type = 'service_package' THEN sp.duration_months * oi.quantity
                        WHEN oi.item_type = 'service' THEN 1 * oi.quantity
                        ELSE 0
                    END
                ) FILTER (WHERE oi.id IS NOT NULL), 0)::NUMERIC
            ELSE 0
        END as credits_from_items,
        -- Sum of appointments duration for this service in this order
        CASE 
            WHEN s.duration_unit = 'hours' THEN 
                COALESCE(SUM(sa.duration_hours) FILTER (
                    WHERE sa.status IN ('scheduled', 'completed') 
                    AND sa.cancelled_at IS NULL
                ), 0)
            WHEN s.duration_unit = 'days' THEN 
                COALESCE(SUM(sa.duration_days) FILTER (
                    WHERE sa.status IN ('scheduled', 'completed') 
                    AND sa.cancelled_at IS NULL
                ), 0)
            WHEN s.duration_unit = 'months' THEN 
                COALESCE(SUM(sa.duration_months) FILTER (
                    WHERE sa.status IN ('scheduled', 'completed') 
                    AND sa.cancelled_at IS NULL
                ), 0)::NUMERIC
            ELSE 0
        END as credits_used_by_appointments,
        -- Balance = credits_from_items - credits_used_by_appointments
        CASE 
            WHEN s.duration_unit = 'hours' THEN 
                COALESCE(SUM(
                    CASE 
                        WHEN oi.item_type = 'service_package' THEN sp.duration_hours * oi.quantity
                        WHEN oi.item_type = 'service' THEN 1 * oi.quantity
                        ELSE 0
                    END
                ) FILTER (WHERE oi.id IS NOT NULL), 0) - COALESCE(SUM(sa.duration_hours) FILTER (
                    WHERE sa.status IN ('scheduled', 'completed') 
                    AND sa.cancelled_at IS NULL
                ), 0)
            WHEN s.duration_unit = 'days' THEN 
                COALESCE(SUM(
                    CASE 
                        WHEN oi.item_type = 'service_package' THEN sp.duration_days * oi.quantity
                        WHEN oi.item_type = 'service' THEN 1 * oi.quantity
                        ELSE 0
                    END
                ) FILTER (WHERE oi.id IS NOT NULL), 0) - COALESCE(SUM(sa.duration_days) FILTER (
                    WHERE sa.status IN ('scheduled', 'completed') 
                    AND sa.cancelled_at IS NULL
                ), 0)
            WHEN s.duration_unit = 'months' THEN 
                (COALESCE(SUM(
                    CASE 
                        WHEN oi.item_type = 'service_package' THEN sp.duration_months * oi.quantity
                        WHEN oi.item_type = 'service' THEN 1 * oi.quantity
                        ELSE 0
                    END
                ) FILTER (WHERE oi.id IS NOT NULL), 0)::NUMERIC - COALESCE(SUM(sa.duration_months) FILTER (
                    WHERE sa.status IN ('scheduled', 'completed') 
                    AND sa.cancelled_at IS NULL
                ), 0)::NUMERIC)
            ELSE 0
        END as balance
    FROM (
        -- Get all services that have either order_items or appointments in this order
        SELECT DISTINCT s.id, s.name, s.duration_unit
        FROM services s
        WHERE s.duration_unit != 'none'
        AND (
            EXISTS (
                SELECT 1 FROM order_items oi
                WHERE oi.order_id = order_id_param
                AND (
                    (oi.item_type = 'service_package' AND EXISTS (
                        SELECT 1 FROM service_packages sp 
                        WHERE sp.id = oi.item_id AND sp.service_id = s.id
                    ))
                    OR (oi.item_type = 'service' AND oi.item_id = s.id)
                )
            )
            OR EXISTS (
                SELECT 1 FROM scheduled_appointments sa
                WHERE sa.order_id = order_id_param
                AND sa.service_id = s.id
            )
        )
    ) s
    LEFT JOIN order_items oi ON oi.order_id = order_id_param
        AND (
            (oi.item_type = 'service_package' AND EXISTS (
                SELECT 1 FROM service_packages sp2 
                WHERE sp2.id = oi.item_id AND sp2.service_id = s.id
            ))
            OR (oi.item_type = 'service' AND oi.item_id = s.id)
        )
    LEFT JOIN service_packages sp ON oi.item_type = 'service_package' AND sp.id = oi.item_id AND sp.service_id = s.id
    LEFT JOIN scheduled_appointments sa ON sa.order_id = order_id_param 
        AND sa.service_id = s.id
    GROUP BY s.id, s.name, s.duration_unit
    HAVING (
        -- Only return services that have non-zero balance or have items/appointments
        COALESCE(SUM(
            CASE 
                WHEN oi.item_type = 'service_package' THEN 
                    CASE 
                        WHEN s.duration_unit = 'hours' THEN sp.duration_hours * oi.quantity
                        WHEN s.duration_unit = 'days' THEN sp.duration_days * oi.quantity
                        WHEN s.duration_unit = 'months' THEN sp.duration_months * oi.quantity
                        ELSE 0
                    END
                WHEN oi.item_type = 'service' THEN 1 * oi.quantity
                ELSE 0
            END
        ) FILTER (WHERE oi.id IS NOT NULL), 0) != 0
        OR COALESCE(SUM(
            CASE 
                WHEN s.duration_unit = 'hours' THEN sa.duration_hours
                WHEN s.duration_unit = 'days' THEN sa.duration_days
                WHEN s.duration_unit = 'months' THEN sa.duration_months
                ELSE 0
            END
        ) FILTER (
            WHERE sa.status IN ('scheduled', 'completed') 
            AND sa.cancelled_at IS NULL
        ), 0) != 0
    )
    ORDER BY s.name;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create function to check if order can be closed (all credits must be 0)
CREATE OR REPLACE FUNCTION can_close_order(order_id_param INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    non_zero_balance_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO non_zero_balance_count
    FROM get_order_all_service_credits(order_id_param)
    WHERE ABS(balance) > 0.01;  -- Allow small floating point differences
    
    RETURN non_zero_balance_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Update existing appointments to link them to open orders
-- This will link appointments to the customer's open order if one exists
UPDATE scheduled_appointments sa
SET order_id = (
    SELECT o.id 
    FROM orders o 
    WHERE o.customer_id = sa.customer_id 
    AND o.status = 'open'
    ORDER BY o.created_at DESC
    LIMIT 1
)
WHERE sa.order_id IS NULL
AND EXISTS (
    SELECT 1 
    FROM orders o 
    WHERE o.customer_id = sa.customer_id 
    AND o.status = 'open'
);

-- Step 6: Make order_id NOT NULL for new appointments (but allow NULL for existing ones temporarily)
-- We'll add a constraint later after all data is migrated
-- For now, we'll handle this in application code

