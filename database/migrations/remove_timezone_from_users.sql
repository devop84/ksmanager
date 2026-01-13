-- Migration: Remove timezone column from users table
-- This migration removes the timezone column from users table since timezone is now a global setting in app_settings

-- Remove timezone column from users table if it exists
ALTER TABLE users 
DROP COLUMN IF EXISTS timezone;




