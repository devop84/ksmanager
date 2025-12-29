-- Migration: Add user language preference and app settings table
-- This migration adds:
-- 1. language column to users table (per-user setting)
-- 2. app_settings table for global settings like currency

-- Add language column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en-US';

-- Create app_settings table for global settings
CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default currency setting if it doesn't exist
INSERT INTO app_settings (key, value)
VALUES ('currency', 'USD')
ON CONFLICT (key) DO NOTHING;

-- Create index on app_settings key for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

