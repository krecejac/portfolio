-- Idempotent: safe to run on a database that already has the table. Older
-- installs that predate email verification pick up the new columns from verify.sql.
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  verified      BOOLEAN NOT NULL DEFAULT false,
  verify_token  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);