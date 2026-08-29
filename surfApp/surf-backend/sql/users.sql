CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  verified      BOOLEAN NOT NULL DEFAULT false,
  verify_token  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);