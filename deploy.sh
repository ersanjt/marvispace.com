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

if su "$USER" -s /bin/bash -c "cd '$REPO' && git pull origin main"; then
  echo "    git pull OK (as $USER)"
else
  echo "    git pull as $USER failed, retrying as root..."
  cd "$REPO"
  git pull origin main
fi

chown -R "$USER:$USER" "$REPO"

HTPASSWD="/home/$USER/.htpasswd"
if [[ ! -f "$HTPASSWD" ]]; then
  echo "==> Creating admin .htpasswd (first-time setup)..."
  bash "$REPO/tools/setup-admin-auth.sh"
fi

echo "==> Syncing to public_html..."
rsync -av --delete \
  --exclude .git \
  --exclude .cpanel.yml \
  --exclude .gitignore \
  --exclude docs/ \
  --exclude tools/ \
  --exclude package.json \
  --exclude deploy.sh \
  --exclude .user.ini \
  --exclude php.ini \
  --exclude .well-known \
  "$REPO/" "$WEB/"

chown -R "$USER:$USER" "$WEB"
find "$WEB" -type d -exec chmod 755 {} \;
find "$WEB" -type f -exec chmod 644 {} \;

# Keep a root-level shortcut in sync with the repo script
cp -f "$REPO/deploy.sh" /home/marvispace/deploy.sh
chmod 755 /home/marvispace/deploy.sh

echo "==> Deploy completed successfully."
