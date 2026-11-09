-- Seed a starter set of categories so the app is usable on first load.
INSERT INTO "categories" ("name", "color", "monthly_budget") VALUES
  ('Food & Dining', '#e76f51', 6000),
  ('Transport', '#2a9d8f', 2000),
  ('Shopping', '#e9c46a', 3000),
  ('Bills & Utilities', '#264653', 4000),
  ('Entertainment', '#9b5de5', 1500),
  ('Health', '#f15bb5', 1000),
  ('Education', '#00bbf9', 2500),
  ('Other', '#64748b', 1000)
ON CONFLICT ("name") DO NOTHING;
