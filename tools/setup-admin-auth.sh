#!/bin/bash
# Create or update MARVISPACE admin HTTP Basic Auth
# Run on server as root:
#   bash /home/marvispace/repositories/marvispace.com/tools/setup-admin-auth.sh
#   bash tools/setup-admin-auth.sh 'MySecurePassword'

set -euo pipefail

HTPASSWD="/home/marvispace/.htpasswd"
USER="marvispace"
ADMIN_USER="admin"
PASS="${1:-}"

if [[ -z "$PASS" ]]; then
  PASS="$(openssl rand -base64 14 | tr -d '/+=' | head -c 16)"
  GENERATED=1
else
  GENERATED=0
fi

if ! command -v htpasswd >/dev/null 2>&1; then
  echo "ERROR: htpasswd not found. Install httpd-tools (yum install httpd-tools)."
  exit 1
fi

# -B = bcrypt (works on cPanel/EasyApache); fallback to default apr1
if htpasswd -cbB "$HTPASSWD" "$ADMIN_USER" "$PASS" 2>/dev/null; then
  :
else
  htpasswd -cb "$HTPASSWD" "$ADMIN_USER" "$PASS"
fi

chown "$USER:$USER" "$HTPASSWD"
# Apache (nobody) must read this file — outside public_html, 644 is safe on cPanel
chmod 644 "$HTPASSWD"

if [[ ! -s "$HTPASSWD" ]]; then
  echo "ERROR: $HTPASSWD is empty"
  exit 1
fi

echo "OK: Admin auth file ready at $HTPASSWD ($(wc -c < "$HTPASSWD") bytes, mode $(stat -c '%a' "$HTPASSWD"))"
echo "Username: $ADMIN_USER"
if [[ "$GENERATED" -eq 1 ]]; then
  echo "Generated password: $PASS"
  echo "SAVE THIS PASSWORD — shown once only."
else
  echo "Password updated successfully."
fi
