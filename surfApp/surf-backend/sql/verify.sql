-- Email verification: a flag + a one-time token per user. Idempotent, safe to
-- run on an existing users table.
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verify_token TEXT;
