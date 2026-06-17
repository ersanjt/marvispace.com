-- Normalize order customer data + email tracking (e-commerce)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS currency CHAR(3) NOT NULL DEFAULT 'USD' AFTER total,
  ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255) NOT NULL DEFAULT '' AFTER currency,
  ADD COLUMN IF NOT EXISTS customer_first_name VARCHAR(100) NOT NULL DEFAULT '' AFTER customer_email,
  ADD COLUMN IF NOT EXISTS customer_last_name VARCHAR(100) NOT NULL DEFAULT '' AFTER customer_first_name,
  ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(32) NOT NULL DEFAULT '' AFTER customer_last_name,
  ADD COLUMN IF NOT EXISTS shipping_address1 VARCHAR(255) NOT NULL DEFAULT '' AFTER customer_phone,
  ADD COLUMN IF NOT EXISTS shipping_address2 VARCHAR(255) NOT NULL DEFAULT '' AFTER shipping_address1,
  ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100) NOT NULL DEFAULT '' AFTER shipping_address2,
  ADD COLUMN IF NOT EXISTS shipping_state VARCHAR(100) NOT NULL DEFAULT '' AFTER shipping_city,
  ADD COLUMN IF NOT EXISTS shipping_zip VARCHAR(20) NOT NULL DEFAULT '' AFTER shipping_state,
  ADD COLUMN IF NOT EXISTS shipping_country VARCHAR(64) NOT NULL DEFAULT '' AFTER shipping_zip,
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(32) NOT NULL DEFAULT '' AFTER shipping_country,
  ADD COLUMN IF NOT EXISTS tax_id VARCHAR(64) NOT NULL DEFAULT '' AFTER payment_method,
  ADD COLUMN IF NOT EXISTS customer_subscribed TINYINT(1) NOT NULL DEFAULT 0 AFTER tax_id,
  ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMP NULL DEFAULT NULL AFTER customer_subscribed,
  ADD COLUMN IF NOT EXISTS admin_notified_at TIMESTAMP NULL DEFAULT NULL AFTER confirmation_email_sent_at,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders (customer_email);

-- Backfill indexed columns from legacy customer JSON
UPDATE orders SET
  customer_email = LOWER(JSON_UNQUOTE(JSON_EXTRACT(customer, '$.email'))),
  customer_first_name = JSON_UNQUOTE(JSON_EXTRACT(customer, '$.firstName')),
  customer_last_name = JSON_UNQUOTE(JSON_EXTRACT(customer, '$.lastName')),
  customer_phone = JSON_UNQUOTE(JSON_EXTRACT(customer, '$.phone')),
  shipping_address1 = JSON_UNQUOTE(JSON_EXTRACT(customer, '$.address')),
  shipping_address2 = JSON_UNQUOTE(JSON_EXTRACT(customer, '$.address2')),
  shipping_city = JSON_UNQUOTE(JSON_EXTRACT(customer, '$.city')),
  shipping_state = JSON_UNQUOTE(JSON_EXTRACT(customer, '$.state')),
  shipping_zip = JSON_UNQUOTE(JSON_EXTRACT(customer, '$.zip')),
  shipping_country = JSON_UNQUOTE(JSON_EXTRACT(customer, '$.country')),
  payment_method = JSON_UNQUOTE(JSON_EXTRACT(customer, '$.payment')),
  tax_id = JSON_UNQUOTE(JSON_EXTRACT(customer, '$.taxId')),
  customer_subscribed = IF(JSON_EXTRACT(customer, '$.subscribe') IN (true, 1, 'true', '1'), 1, 0)
WHERE customer_email = '' OR customer_email IS NULL;
