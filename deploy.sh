#!/bin/bash
# MARVISPACE deploy script
# @author Ersan JT <https://github.com/ersanjt>
# Run on server as root:
#   bash /home/marvispace/repositories/marvispace.com/deploy.sh

set -euo pipefail

REPO="/home/marvispace/repositories/marvispace.com"
WEB="/home/marvispace/public_html"
USER="marvispace"

if [[ ! -d "$REPO/.git" ]]; then
  echo "ERROR: Git repo not found at $REPO"
  exit 1
fi

echo "==> Fixing repo ownership..."
chown -R "$USER:$USER" "$REPO"
chmod -R u+rwX "$REPO/.git"

echo "==> Pulling latest from GitHub..."
git config --global --add safe.directory "$REPO" 2>/dev/null || true

ADMIN_CFG="assets/js/config/admin-auth.js"
ADMIN_EXAMPLE="assets/js/config/admin-auth.js.example"
cd "$REPO"

if [[ ! -f "$ADMIN_CFG" && -f "$ADMIN_EXAMPLE" ]]; then
  cp "$ADMIN_EXAMPLE" "$ADMIN_CFG"
  echo "    Created admin-auth.js from example (local fallback — configure if needed)"
fi

if su "$USER" -s /bin/bash -c "cd '$REPO' && git pull origin main"; then
  echo "    git pull OK (as $USER)"
else
  echo "    git pull as $USER failed, retrying as root..."
  git pull origin main
fi

chown -R "$USER:$USER" "$REPO"

echo "==> Syncing to public_html..."
rsync -av --delete \
  --exclude .git \
  --exclude .cpanel.yml \
  --exclude .gitignore \
  --exclude docs/ \
  --exclude install/ \
  --exclude tools/ \
  --exclude package.json \
  --exclude deploy.sh \
  --exclude .user.ini \
  --exclude php.ini \
  --exclude .well-known \
  "$REPO/" "$WEB/"

chown -R "$USER:$USER" "$WEB"
find "$WEB" -type d -exec chmod 755 {} \;
find "$WEB" -type f ! -name 'config.local.php' -exec chmod 644 {} \;

# Web PHP (open_basedir) may not read /home/marvispace/api_config.php — sync for includes
CONFIG_SRC="/home/marvispace/api_config.php"
CONFIG_DST="$WEB/api/config.local.php"
if [[ -f "$CONFIG_SRC" ]]; then
  php -r '
    $c = require "'"$CONFIG_SRC"'";
    $c["db"]["host"] = "127.0.0.1";
    file_put_contents("'"$CONFIG_DST"'", "<?php\nreturn " . var_export($c, true) . ";\n");
  '
  chown "$USER:$USER" "$CONFIG_DST"
  chmod 640 "$CONFIG_DST"
  echo "==> Synced API config → public_html/api/config.local.php (host 127.0.0.1)"
fi

# Keep a root-level shortcut in sync with the repo script
cp -f "$REPO/deploy.sh" /home/marvispace/deploy.sh
chmod 755 /home/marvispace/deploy.sh

echo "==> Deploy completed successfully."
