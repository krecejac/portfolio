-- Add a home-region preference to users, for location-biased recommendations.
-- Idempotent so it's safe to re-run against an existing DB.
ALTER TABLE users ADD COLUMN IF NOT EXISTS home_region TEXT;
