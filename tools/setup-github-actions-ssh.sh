#!/bin/bash
# One-time setup: allow GitHub Actions to SSH and run deploy.sh
# Run on WHM as root:
#   bash /home/marvispace/repositories/marvispace.com/tools/setup-github-actions-ssh.sh
#
# Paste the PUBLIC key from GitHub repo secrets setup (or tools output) when prompted.

set -euo pipefail

AUTH_KEYS="/root/.ssh/authorized_keys"
MARKER="# github-actions-marvispace-deploy"

echo "==> GitHub Actions SSH setup for marvispace.com deploy"
echo ""

if [[ "${1:-}" == "--key" && -n "${2:-}" ]]; then
  PUBKEY="$2"
else
  echo "Paste the deploy PUBLIC key (single line, starts with ssh-ed25519), then press Enter:"
  read -r PUBKEY
fi

if [[ -z "$PUBKEY" || "$PUBKEY" != ssh-* ]]; then
  echo "ERROR: Invalid public key."
  exit 1
fi

mkdir -p /root/.ssh
chmod 700 /root/.ssh
touch "$AUTH_KEYS"
chmod 600 "$AUTH_KEYS"

if grep -qF "$MARKER" "$AUTH_KEYS" 2>/dev/null; then
  sed -i "/$MARKER/d" "$AUTH_KEYS"
fi

echo "$PUBKEY $MARKER" >> "$AUTH_KEYS"
echo "==> Public key added to $AUTH_KEYS"

# Ensure deploy script is executable
chmod 755 /home/marvispace/repositories/marvispace.com/deploy.sh 2>/dev/null || true

echo "==> Done. Push to main on GitHub to trigger auto-deploy."
