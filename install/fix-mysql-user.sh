#!/bin/bash
# Sync MySQL user/password/privileges with api_config.php (run as root on WHM).
#
#   bash install/fix-mysql-user.sh
#
# Reads /home/marvispace/api_config.php and ensures cPanel MySQL matches.

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

# cPanel UAPI uses short names (without account prefix)
DB_SHORT="${DB_FULL#${CPANEL_USER}_}"
DB_USER_SHORT="${DB_USER_FULL#${CPANEL_USER}_}"

echo "==> MARVISPACE MySQL fix"
echo "    Database: ${DB_FULL} (short: ${DB_SHORT})"
echo "    User:     ${DB_USER_FULL} (short: ${DB_USER_SHORT})"

echo "==> Ensuring database exists..."
uapi --user="$CPANEL_USER" Mysql create_database name="$DB_SHORT" || true

echo "==> Setting user password to match api_config.php..."
if uapi --user="$CPANEL_USER" Mysql set_password user="$DB_USER_SHORT" password="$DB_PASS" 2>/dev/null | grep -q '"status":1'; then
  echo "    Password updated."
else
  echo "    User missing — creating..."
  uapi --user="$CPANEL_USER" Mysql create_user name="$DB_USER_SHORT" password="$DB_PASS"
fi

echo "==> Granting ALL on database..."
uapi --user="$CPANEL_USER" Mysql set_privileges_on_database \
  user="$DB_USER_SHORT" database="$DB_SHORT" privileges=ALL

echo "==> Testing connection..."
if mysql -u "$DB_USER_FULL" -p"$DB_PASS" -e "USE \`${DB_FULL}\`; SELECT 1;" 2>/dev/null; then
  echo "    Connection: OK"
else
  echo "ERROR: Still cannot connect. Check manually:"
  echo "  mysql -u ${DB_USER_FULL} -p -e \"SELECT 1\""
  exit 1
fi

if [[ -d "$REPO" ]]; then
  echo "==> Running doctor..."
  php "$REPO/install/doctor.php" || true
fi

echo "==> Done. Next: php install/migrate.php"
