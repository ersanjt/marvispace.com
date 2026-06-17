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

htpasswd -cb "$HTPASSWD" "$ADMIN_USER" "$PASS"
chown "$USER:$USER" "$HTPASSWD"
chmod 644 "$HTPASSWD"

# cPanel/Apache often runs as nobody — allow read if group exists
if getent group nobody >/dev/null 2>&1; then
  chgrp nobody "$HTPASSWD" 2>/dev/null || true
  chmod 640 "$HTPASSWD" 2>/dev/null || chmod 644 "$HTPASSWD"
fi

if [[ ! -r "$HTPASSWD" ]]; then
  echo "ERROR: $HTPASSWD is not readable"
  exit 1
fi

echo "OK: Admin auth file ready at $HTPASSWD"
echo "Username: $ADMIN_USER"
if [[ "$GENERATED" -eq 1 ]]; then
  echo "Generated password: $PASS"
  echo "SAVE THIS PASSWORD — shown once only."
else
  echo "Password updated successfully."
fi
