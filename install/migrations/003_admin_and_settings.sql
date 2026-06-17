-- Admin hardening + site settings + login audit
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS name VARCHAR(255) NOT NULL DEFAULT '' AFTER email,
  ADD COLUMN IF NOT EXISTS role ENUM('owner', 'admin') NOT NULL DEFAULT 'admin' AFTER password_hash,
  ADD COLUMN IF NOT EXISTS is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER role,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP NULL DEFAULT NULL AFTER is_active,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

CREATE TABLE IF NOT EXISTS site_settings (
  setting_key VARCHAR(64) NOT NULL PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES
  ('favicon_url', '/favicon.svg'),
  ('favicon_type', 'image/svg+xml'),
  ('store_name', 'MARVISPACE'),
  ('store_currency', 'USD');

CREATE TABLE IF NOT EXISTS login_attempts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL DEFAULT '',
  success TINYINT(1) NOT NULL DEFAULT 0,
  attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_login_attempts_email_time (email, attempted_at),
  INDEX idx_login_attempts_ip_time (ip_address, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
