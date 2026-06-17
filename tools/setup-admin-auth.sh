#!/bin/bash
# Create or update MARVISPACE admin HTTP Basic Auth
# Run on server as root:
#   bash /home/marvispace/repositories/marvispace.com/tools/setup-admin-auth.sh
#   bash tools/setup-admin-auth.sh myNewPassword

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
  echo "ERROR: htpasswd not found. Install httpd-tools."
  exit 1
fi

htpasswd -cb "$HTPASSWD" "$ADMIN_USER" "$PASS"
chown "$USER:$USER" "$HTPASSWD"
chmod 640 "$HTPASSWD"

echo "Admin auth file: $HTPASSWD"
echo "Username: $ADMIN_USER"
if [[ "$GENERATED" -eq 1 ]]; then
  echo "Generated password: $PASS"
  echo "Save this password — it will not be shown again."
else
  echo "Password updated."
fi
