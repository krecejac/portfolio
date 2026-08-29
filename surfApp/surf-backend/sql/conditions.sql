-- Per-spot forecast snapshot cache. One row per spot holds the latest enriched
-- surf snapshot (the full /api/forecast payload) plus a few denormalized columns
-- (rating/score/wave_height) so the board can sort by conditions cheaply without
-- opening the JSONB. Written read-through by /api/forecast: the API serves this
-- row while it's fresh and refreshes it from Open-Meteo once it goes stale.
-- Idempotent, safe to re-run.
CREATE TABLE IF NOT EXISTS spot_conditions (
  spot_id     INTEGER PRIMARY KEY REFERENCES spots(id) ON DELETE CASCADE,
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  rating      TEXT,
  score       INTEGER,
  wave_height REAL,
  snapshot    JSONB NOT NULL
);
