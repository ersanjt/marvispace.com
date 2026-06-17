# Server setup — MySQL + PHP API (one time)

Run **once** on WHM as **root** after `git pull`:

```bash
MARVISPACE_ADMIN_EMAIL='admin@yourdomain.com' \
MARVISPACE_ADMIN_PASSWORD='YourStrongPasswordHere' \
bash /home/marvispace/repositories/marvispace.com/install/setup-server.sh
```

`MARVISPACE_ADMIN_PASSWORD` is **required** (never stored in git).

Optional recovery code:

```bash
MARVISPACE_RECOVERY_CODE='YourRecoveryCode' \
MARVISPACE_ADMIN_EMAIL='admin@yourdomain.com' \
MARVISPACE_ADMIN_PASSWORD='YourStrongPasswordHere' \
bash install/setup-server.sh
```

## What this script does

1. Creates MySQL database `marvispace_store` + user via cPanel UAPI
2. Writes private config: `/home/marvispace/api_config.php` (outside git)
3. Runs database migrations
4. Seeds products + admin user
5. Runs `deploy.sh`

## Verify

```bash
curl -s https://marvispace.com/api/v1/health.php
php install/doctor.php
```

## phpMyAdmin

cPanel → **phpMyAdmin** → database `marvispace_store`

| Table | Purpose |
|-------|---------|
| `products` | Catalog |
| `orders` | Orders (indexed customer fields) |
| `order_items` | Line items |
| `admin_users` | Admin accounts (bcrypt) |
| `site_settings` | Favicon, store config |
| `schema_migrations` | DB version |

## Admin login

Credentials are set via environment variables during setup — not in the repository.

Login uses **PHP session** (HttpOnly, Secure). Passwords stored as **bcrypt** in MySQL.

## Password recovery

Set recovery code on server only:

```bash
MARVISPACE_RECOVERY_CODE='YourCode' php install/patch-api-config.php
```

## Re-run seed only

```bash
MARVISPACE_ADMIN_EMAIL='admin@yourdomain.com' \
MARVISPACE_ADMIN_PASSWORD='NewPassword' \
php install/seed.php
```

## Order emails (SMTP)

Create mailbox **orders@marvispace.com** in cPanel → Email Accounts.

**On the same cPanel server** (recommended when `mail.marvispace.com` DNS is missing):

```bash
MARVISPACE_SMTP_HOST=localhost \
MARVISPACE_SMTP_PORT=587 \
MARVISPACE_SMTP_SECURE=tls \
MARVISPACE_SMTP_PASS='orders-mailbox-password' \
php install/patch-api-config-mail.php

php install/test-mail.php --probe
php install/test-mail.php
```

`patch-api-config-mail.php` auto-switches to `localhost:587` if `mail.marvispace.com` does not resolve.

Optional: add DNS **A** record `mail.marvispace.com` → server IP, then use port 465/ssl.

```bash
MARVISPACE_SMTP_PASS='orders-mailbox-password' \
php install/patch-api-config-mail.php
```

Enable **SPF** and **DKIM** in cPanel → Email Deliverability.

---

```
Browser → /api/v1/*.php → MySQL (marvispace_store)
Cart    → MySQL (cart_sessions + cart_items, cookie session)
Admin   → PHP session cookie + admin_users table
bootstrap.php and health.php load config in this order:
1. `/home/marvispace/api_config.php` (CLI / install scripts)
2. `public_html/api/config.local.php` (synced on each deploy — used by web PHP)

`deploy.sh` copies the private config into `api/config.local.php` (blocked by `.htaccess`).
```

## Troubleshooting

```bash
php install/doctor.php
php install/migrate.php --status
```

See [DATABASE.md](DATABASE.md) for full database documentation.

## Caching (no stale site after deploy)

The repo sends **no-cache** for HTML, JS, CSS, and API. Product photos in `/assets/images/` use 1-day cache only.

**cPanel NGINX Caching** (separate layer) may still cache pages. After each deploy:

1. cPanel → **NGINX Caching** → **Clear Cache**
2. Or disable NGINX cache for this account if you prefer always-fresh HTML

Browser: hard refresh `Ctrl+Shift+R` once after deploy if needed.
