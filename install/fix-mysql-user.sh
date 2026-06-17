#!/bin/bash
# Sync MySQL user/password/privileges with api_config.php (run as root on WHM).
#
#   bash install/fix-mysql-user.sh
#
# Reads /home/marvispace/api_config.php and ensures cPanel MySQL matches.
# Some cPanel builds require full names (marvispace_store); others use short (store).

set -euo pipefail

CPANEL_USER="marvispace"
CONFIG="/home/marvispace/api_config.php"
REPO="/home/marvispace/repositories/marvispace.com"

if [[ $EUID -ne 0 ]]; then
  echo "ERROR: Run as root on WHM."
  exit 1
fi

if [[ ! -f "$CONFIG" ]]; then
  echo "ERROR: Config not found: $CONFIG"
  exit 1
fi

DB_FULL=$(php -r '$c=require "'"$CONFIG"'"; echo $c["db"]["name"];')
DB_USER_FULL=$(php -r '$c=require "'"$CONFIG"'"; echo $c["db"]["user"];')
DB_PASS=$(php -r '$c=require "'"$CONFIG"'"; echo $c["db"]["pass"];')

DB_SHORT="${DB_FULL#${CPANEL_USER}_}"
DB_USER_SHORT="${DB_USER_FULL#${CPANEL_USER}_}"

uapi_ok() {
  local out
  out=$("$@" 2>&1) || true
  echo "$out" | grep -q '"status":1'
}

uapi_create_database() {
  if uapi_ok uapi --user="$CPANEL_USER" Mysql create_database name="$DB_FULL"; then
    echo "    Database created: ${DB_FULL}"
    return 0
  fi
  if uapi_ok uapi --user="$CPANEL_USER" Mysql create_database name="$DB_SHORT"; then
    echo "    Database created: ${DB_SHORT} → ${DB_FULL}"
    return 0
  fi
  echo "    Database may already exist: ${DB_FULL}"
}

uapi_ensure_user() {
  if uapi_ok uapi --user="$CPANEL_USER" Mysql set_password user="$DB_USER_FULL" password="$DB_PASS"; then
    echo "    Password set for ${DB_USER_FULL}"
    return 0
  fi
  if uapi_ok uapi --user="$CPANEL_USER" Mysql set_password user="$DB_USER_SHORT" password="$DB_PASS"; then
    echo "    Password set for ${DB_USER_SHORT}"
    return 0
  fi
  if uapi_ok uapi --user="$CPANEL_USER" Mysql create_user name="$DB_USER_FULL" password="$DB_PASS"; then
    echo "    User created: ${DB_USER_FULL}"
    return 0
  fi
  uapi --user="$CPANEL_USER" Mysql create_user name="$DB_USER_SHORT" password="$DB_PASS"
  echo "    User created: ${DB_USER_SHORT} → ${DB_USER_FULL}"
}

uapi_grant_all() {
  if uapi_ok uapi --user="$CPANEL_USER" Mysql set_privileges_on_database \
    user="$DB_USER_FULL" database="$DB_FULL" privileges=ALL; then
    echo "    Privileges OK (${DB_USER_FULL} → ${DB_FULL})"
    return 0
  fi
  if uapi_ok uapi --user="$CPANEL_USER" Mysql set_privileges_on_database \
    user="$DB_USER_SHORT" database="$DB_SHORT" privileges=ALL; then
    echo "    Privileges OK (${DB_USER_SHORT} → ${DB_SHORT})"
    return 0
  fi
  echo "ERROR: Could not grant privileges."
  exit 1
}

echo "==> MARVISPACE MySQL fix"
echo "    Database: ${DB_FULL}"
echo "    User:     ${DB_USER_FULL}"
echo ""
echo "    (Your server currently has marvispace_harder — the app needs marvispace_store)"
echo ""

echo "==> Creating database if missing..."
uapi_create_database

echo "==> Creating/updating user..."
uapi_ensure_user

echo "==> Granting ALL privileges..."
uapi_grant_all

echo "==> Testing connection..."
if mysql -u "$DB_USER_FULL" -p"$DB_PASS" -e "USE \`${DB_FULL}\`; SELECT 1;" 2>/dev/null; then
  echo "    Connection: OK"
else
  echo "ERROR: Still cannot connect."
  echo "  uapi --user=marvispace Mysql list_databases"
  echo "  uapi --user=marvispace Mysql list_users"
  exit 1
fi

if [[ -d "$REPO" ]]; then
  echo "==> Running migrations..."
  php "$REPO/install/migrate.php"
  echo "==> Running doctor..."
  php "$REPO/install/doctor.php" || true
fi

echo "==> Done."
