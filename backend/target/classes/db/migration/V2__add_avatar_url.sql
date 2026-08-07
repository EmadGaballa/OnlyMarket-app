-- Add avatar_url column to users for profile avatar uploads.
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);