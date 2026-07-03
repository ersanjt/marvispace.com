-- Granular admin dashboard permissions (JSON)
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS permissions JSON NULL AFTER role;

-- Existing admins: full access except user management (owners keep NULL = all access)
UPDATE admin_users
SET permissions = JSON_OBJECT(
  'dashboard', true,
  'products', true,
  'orders', true,
  'users', false,
  'settings', true
)
WHERE role = 'admin' AND permissions IS NULL;

UPDATE admin_users SET permissions = NULL WHERE role = 'owner';
