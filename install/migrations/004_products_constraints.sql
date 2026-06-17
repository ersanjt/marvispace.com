-- Product catalog constraints
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sku VARCHAR(64) DEFAULT NULL AFTER id,
  ADD COLUMN IF NOT EXISTS is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER in_stock;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku ON products (sku);
