#!/bin/bash
# Run on server as root: bash /home/marvispace/deploy.sh

REPO="/home/marvispace/repositories/marvispace.com"
WEB="/home/marvispace/public_html"

cd "$REPO" || exit 1

git config --global --add safe.directory "$REPO" 2>/dev/null
git pull origin main

chown -R marvispace:marvispace "$REPO"

rsync -av \
  --exclude .git \
  --exclude .cpanel.yml \
  --exclude .gitignore \
  --exclude DEPLOY.md \
  --exclude deploy.sh \
  --exclude .htaccess \
  --exclude .user.ini \
  --exclude php.ini \
  --exclude .well-known \
  "$REPO/" "$WEB/"

chown -R marvispace:marvispace "$WEB"
echo "Deploy completed."
