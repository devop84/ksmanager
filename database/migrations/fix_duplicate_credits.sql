-- Migration: Fix Duplicate Credits Issue
-- Date: 2025-11-25
-- Description: 
--   - Updates the trigger to check for existing credits before creating new ones
--   - Removes duplicate credits that may have been created (keeps the first one per order_item_id)

-- Step 1: Remove duplicate credits, keeping only the first one for each order_item_id
-- This will delete any duplicate credits that were created
DELETE FROM customer_service_credits csc1
WHERE EXISTS (
    SELECT 1
    FROM customer_service_credits csc2
    WHERE csc2.order_item_id = csc1.order_item_id
      AND csc2.id < csc1.id
);

-- Step 2: The trigger function has already been updated in schema.sql
-- to check for existing credits before creating new ones
-- This migration just cleans up any existing duplicates

