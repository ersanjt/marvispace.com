-- iyzico Paynet payment gateway (orders + site settings)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(32) NOT NULL DEFAULT 'unpaid' AFTER payment_method,
  ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(32) NOT NULL DEFAULT '' AFTER payment_status,
  ADD COLUMN IF NOT EXISTS gateway_reference VARCHAR(64) NOT NULL DEFAULT '' AFTER payment_gateway,
  ADD COLUMN IF NOT EXISTS gateway_transaction_id VARCHAR(64) NOT NULL DEFAULT '' AFTER gateway_reference,
  ADD COLUMN IF NOT EXISTS gateway_session_id VARCHAR(128) NOT NULL DEFAULT '' AFTER gateway_transaction_id,
  ADD COLUMN IF NOT EXISTS gateway_token_id VARCHAR(128) NOT NULL DEFAULT '' AFTER gateway_session_id,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP NULL DEFAULT NULL AFTER gateway_token_id,
  ADD COLUMN IF NOT EXISTS payment_error TEXT NULL AFTER paid_at;

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_gateway_session ON orders (gateway_session_id);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(32) NOT NULL,
  gateway VARCHAR(32) NOT NULL DEFAULT 'paynet',
  step VARCHAR(32) NOT NULL DEFAULT '',
  status VARCHAR(32) NOT NULL DEFAULT '',
  request_json JSON NULL,
  response_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_payment_tx_order (order_id),
  INDEX idx_payment_tx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES
  ('paynet_enabled', '0'),
  ('paynet_mode', 'sandbox'),
  ('paynet_domain', 'marvispace.com'),
  ('paynet_publishable_key', ''),
  ('paynet_instalment', '0'),
  ('store_currency', 'TRY');
