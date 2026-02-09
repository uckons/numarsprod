-- Add dedicated package pricing fields for FNB package conversion
ALTER TABLE fnb_items
  ADD COLUMN IF NOT EXISTS package_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS package_name VARCHAR(120);
