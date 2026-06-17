#!/bin/bash
# MARVISPACE — one-time MySQL + API config setup (WHM as root)
# Usage:
#   bash /home/marvispace/repositories/marvispace.com/install/setup-server.sh
#
# Optional env:
#   MARVISPACE_ADMIN_EMAIL=ersanjahedtabrizi@gmail.com
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

if [[ -f "$CONFIG" ]]; then
  echo "==> Config exists: $CONFIG"
  echo "    Skipping database creation. To reset, remove config and re-run."
else
  DB_PASS="$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 24)"

  echo "==> Creating MySQL database and user (cPanel UAPI)..."
  uapi --user="$USER" Mysql create_database name="$DB_SHORT" || true
  uapi --user="$USER" Mysql create_user name="$DB_USER_SHORT" password="$DB_PASS" || true
  uapi --user="$USER" Mysql set_privileges_on_database user="$DB_USER_SHORT" database="$DB_SHORT" privileges=ALL

  RECOVERY_CODE="${MARVISPACE_RECOVERY_CODE:-MarviRecover2026!}"
  RECOVERY_BCRYPT="$(php -r 'echo password_hash(getenv("RC"), PASSWORD_BCRYPT);' RC="$RECOVERY_CODE")"

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

echo "==> Importing schema..."
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$REPO/install/schema.sql"

echo "==> Seeding products + admin..."
cd "$REPO"
MARVISPACE_ADMIN_EMAIL="${MARVISPACE_ADMIN_EMAIL:-ersanjahedtabrizi@gmail.com}" \
MARVISPACE_ADMIN_PASSWORD="${MARVISPACE_ADMIN_PASSWORD:-20231030Zhanna@}" \
php install/seed.php

echo "==> Ensuring recovery code in API config..."
php install/patch-api-config.php

echo "==> Deploying site files..."
bash "$REPO/deploy.sh"

echo ""
echo "==> Setup complete."
echo "    API health: https://marvispace.com/api/v1/health.php"
echo "    Admin:      https://marvispace.com/admin"
echo "    Config:     $CONFIG (keep private)"
