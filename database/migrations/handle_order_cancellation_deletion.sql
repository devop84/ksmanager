-- Migration: Handle Order Cancellation and Deletion with Appointments
-- Date: 2024
-- Description: Updates foreign key constraints and provides guidance for handling
--              appointments and credits when orders are cancelled or deleted

-- Step 1: Change scheduled_appointments.order_id to CASCADE on delete
-- This allows orders to be deleted, and all appointments (including completed) will be deleted
ALTER TABLE scheduled_appointments 
DROP CONSTRAINT IF EXISTS scheduled_appointments_order_id_fkey;

ALTER TABLE scheduled_appointments 
ADD CONSTRAINT scheduled_appointments_order_id_fkey 
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- Step 2: Create a function to check if order can be cancelled
-- Returns true if order can be cancelled (no completed appointments), false otherwise
CREATE OR REPLACE FUNCTION can_cancel_order(order_id_param INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    completed_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO completed_count
    FROM scheduled_appointments
    WHERE order_id = order_id_param
      AND status = 'completed';
    
    RETURN completed_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create a function to handle order cancellation
-- This function will:
-- 1. Cancel all appointments (scheduled, rescheduled, no_show) - only called if no completed appointments
-- 2. Delete credits associated with the order
CREATE OR REPLACE FUNCTION handle_order_cancellation(order_id_param INTEGER)
RETURNS void AS $$
BEGIN
    -- Cancel all scheduled/rescheduled/no_show appointments for this order
    UPDATE scheduled_appointments
    SET status = 'cancelled',
        cancelled_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE order_id = order_id_param
      AND status IN ('scheduled', 'rescheduled', 'no_show');
    
    -- Delete all credits associated with this order's items
    DELETE FROM customer_service_credits
    WHERE order_item_id IN (
        SELECT id FROM order_items WHERE order_id = order_id_param
    );
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create a function to handle order deletion
-- This function will:
-- 1. Delete credits (handled by CASCADE from order_items)
-- 2. The order deletion itself will CASCADE delete all appointments (including completed)
-- 3. Order items will be deleted via CASCADE
-- Note: All appointments (including completed) will be deleted via CASCADE
CREATE OR REPLACE FUNCTION handle_order_deletion(order_id_param INTEGER)
RETURNS void AS $$
BEGIN
    -- Delete credits explicitly (though CASCADE will handle it)
    DELETE FROM customer_service_credits
    WHERE order_item_id IN (
        SELECT id FROM order_items WHERE order_id = order_id_param
    );
    
    -- The actual order deletion should be done in application code after this
    -- All appointments will be deleted via CASCADE when the order is deleted
END;
$$ LANGUAGE plpgsql;

-- Note: The application code should call these functions or handle the logic
-- when cancelling or deleting orders to ensure data consistency

