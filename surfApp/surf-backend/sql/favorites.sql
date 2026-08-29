-- Idempotent: safe to run on a database that already has the table.
CREATE TABLE IF NOT EXISTS favorites (
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  spot_id  INTEGER NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, spot_id)
);