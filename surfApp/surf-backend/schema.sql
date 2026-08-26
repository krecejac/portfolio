CREATE TABLE spots (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL
);

INSERT INTO spots (name, lat, lon) VALUES
  ('Matosinhos', 41.183, -8.702),
  ('Espinho', 41.006, -8.646),
  ('Figueira da Foz (Cabedelo)', 40.14, -8.875),
  ('Nazaré (Praia do Norte)', 39.605, -9.085),
  ('Peniche (Supertubos)', 39.345, -9.367),
  ('Ericeira (Ribeira d''Ilhas)', 38.996, -9.421),
  ('Guincho', 38.733, -9.475),
  ('Carcavelos', 38.677, -9.337),
  ('Costa da Caparica', 38.64, -9.235),
  ('Arrifana', 37.294, -8.867),
  ('Praia do Amado', 37.166, -8.906),
  ('Sagres (Tonel)', 37.02, -8.951);