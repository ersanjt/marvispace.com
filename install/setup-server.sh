#!/bin/bash
# MARVISPACE — one-time MySQL + API config setup (WHM as root)
# Usage:
#   bash /home/marvispace/repositories/marvispace.com/install/setup-server.sh
#
# Optional env:
#   MARVISPACE_ADMIN_EMAIL=admin@yourdomain.com
#   MARVISPACE_ADMIN_PASSWORD='YourSecurePassword'

set -euo pipefail

USER="marvispace"
REPO="/home/marvispace/repositories/marvispace.com"
CONFIG="/home/marvispace/api_config.php"
DB_SHORT="store"
DB_USER_SHORT="storeuser"
DB_FULL="${USER}_${DB_SHORT}"
DB_USER_FULL="${USER}_${DB_USER_SHORT}"

if [[ ! -d "$REPO" ]]; then
  echo "ERROR: Repo not found at $REPO"
  exit 1
fi

if [[ -z "${MARVISPACE_ADMIN_EMAIL:-}" ]]; then
  echo "ERROR: MARVISPACE_ADMIN_EMAIL is required."
  echo "       MARVISPACE_ADMIN_EMAIL='admin@yourdomain.com' MARVISPACE_ADMIN_PASSWORD='...' bash install/setup-server.sh"
  exit 1
fi

if [[ -z "${MARVISPACE_ADMIN_PASSWORD:-}" ]]; then
  echo "ERROR: MARVISPACE_ADMIN_PASSWORD is required."
  exit 1
fi

if [[ -f "$CONFIG" ]]; then
  echo "==> Config exists: $CONFIG"
  echo "    Skipping database creation. To reset, remove config and re-run."
else
  DB_PASS="$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 24)"

  echo "==> Creating MySQL database and user (cPanel UAPI)..."
  uapi --user="$USER" Mysql create_database name="$DB_SHORT" || true
  uapi --user="$USER" Mysql create_user name="$DB_USER_SHORT" password="$DB_PASS" || true
  uapi --user="$USER" Mysql set_privileges_on_database user="$DB_USER_SHORT" database="$DB_SHORT" privileges=ALL

  RECOVERY_CODE="${MARVISPACE_RECOVERY_CODE:-}"
  if [[ -z "$RECOVERY_CODE" ]]; then
    RECOVERY_CODE="$(openssl rand -base64 18 | tr -dc 'A-Za-z0-9!@#%' | head -c 16)"
    echo "    Generated recovery code (save it securely): ${RECOVERY_CODE}"
  fi
  RECOVERY_BCRYPT="$(php -r 'echo password_hash(getenv("RC"), PASSWORD_BCRYPT);' RC="$RECOVERY_CODE")"
  ADMIN_NOTIFY_EMAIL="${MARVISPACE_ADMIN_EMAIL:-}"

  echo "==> Writing $CONFIG ..."
  cat > "$CONFIG" <<EOF
<?php
return [
  'db' => [
    'host' => 'localhost',
    'name' => '${DB_FULL}',
    'user' => '${DB_USER_FULL}',
    'pass' => '${DB_PASS}',
  ],
  'site' => [
    'url' => 'https://marvispace.com',
  ],
  'admin' => [
    'recovery_bcrypt' => '${RECOVERY_BCRYPT}',
  ],
  'mail' => [
    'from' => 'orders@marvispace.com',
    'from_name' => 'MARVISPACE Orders',
    'support' => 'support@marvispace.com',
    'admin_notify' => '${ADMIN_NOTIFY_EMAIL}',
    'smtp' => [
      'host' => 'mail.marvispace.com',
      'port' => 465,
      'secure' => 'ssl',
      'user' => 'orders@marvispace.com',
      'pass' => '',
    ],
  ],
];
EOF
  chmod 640 "$CONFIG"
  chown "$USER:$USER" "$CONFIG"
  echo "    Database: $DB_FULL"
  echo "    DB user:  $DB_USER_FULL"
fi

# Load config for mysql import
DB_NAME=$(php -r '$c=require "'"$CONFIG"'"; echo $c["db"]["name"];')
DB_USER=$(php -r '$c=require "'"$CONFIG"'"; echo $c["db"]["user"];')
DB_PASS=$(php -r '$c=require "'"$CONFIG"'"; echo $c["db"]["pass"];')

echo "==> Running database migrations..."
if ! php "$REPO/install/migrate.php"; then
  echo "ERROR: migrations failed. Running doctor..."
  php "$REPO/install/doctor.php" || true
  exit 1
fi

echo "==> Seeding products + admin..."
cd "$REPO"
MARVISPACE_ADMIN_EMAIL="${MARVISPACE_ADMIN_EMAIL}" \
MARVISPACE_ADMIN_PASSWORD="${MARVISPACE_ADMIN_PASSWORD}" \
php install/seed.php

echo "==> Ensuring recovery code in API config..."
php install/patch-api-config.php

echo "==> Ensuring mail settings in API config..."
php install/patch-api-config-mail.php

echo "==> Deploying site files..."
bash "$REPO/deploy.sh"

echo ""
echo "==> Setup complete."
echo "    API health: https://marvispace.com/api/v1/health.php"
echo "    Admin:      https://marvispace.com/admin"
echo "    Config:     $CONFIG (keep private)"
