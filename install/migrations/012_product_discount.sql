-- Per-product sale discount shown on SALE and applied at checkout
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS discount_percent TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER price;
