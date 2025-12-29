-- Migration: Add timezone to app_settings (global setting)
-- This migration adds timezone as a global setting in app_settings table

-- Insert default timezone setting if it doesn't exist
-- The application will auto-detect and set the timezone on first load
INSERT INTO app_settings (key, value)
VALUES ('timezone', 'UTC')
ON CONFLICT (key) DO NOTHING;

