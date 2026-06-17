-- Add display name to admin users (safe to re-run on MariaDB 10.0.2+)
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS name VARCHAR(255) NOT NULL DEFAULT '' AFTER email;
