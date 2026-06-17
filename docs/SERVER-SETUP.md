# Server setup — MySQL + PHP API (one time)

Run **once** on WHM as **root** after `git pull`:

```bash
bash /home/marvispace/repositories/marvispace.com/install/setup-server.sh
```

Optional custom admin password:

```bash
MARVISPACE_ADMIN_EMAIL='ersanjahedtabrizi@gmail.com' \
MARVISPACE_ADMIN_PASSWORD='YourSecurePassword' \
bash /home/marvispace/repositories/marvispace.com/install/setup-server.sh
```

## What this script does

1. Creates MySQL database `marvispace_store` + user via cPanel UAPI
2. Writes private config: `/home/marvispace/api_config.php` (outside git)
3. Imports `install/schema.sql`
4. Seeds 17 products + admin user (`install/seed.php`)
5. Runs `deploy.sh` → syncs `api/` to `public_html`

## Verify

```bash
curl -s https://marvispace.com/api/v1/health.php
# {"ok":true,"data":{"database":true,"version":"1"}}
```

## phpMyAdmin (manual check)

cPanel → **phpMyAdmin** → database `marvispace_store`

| Table | Contents |
|-------|----------|
| `products` | Catalog |
| `orders` | Customer orders |
| `order_items` | Line items |
| `admin_users` | Admin login (bcrypt) |

## Admin login (after setup)

- URL: https://marvispace.com/admin
- Email: `ersanjahedtabrizi@gmail.com`
- Password: set in `MARVISPACE_ADMIN_PASSWORD` (default in script: `20231030Zhanna@`)

Login uses **PHP session** on the server (secure). Client-side password hash is no longer used when API is active.

## Password recovery (Forgot password?)

Default **recovery code:** `MarviRecover2026!`

On the server (once, if not done during setup):

```bash
cd /home/marvispace/repositories/marvispace.com
php install/patch-api-config.php
bash deploy.sh
```

Custom recovery code:

```bash
MARVISPACE_RECOVERY_CODE='YourRecoveryCode' php install/patch-api-config.php
```

## Re-run seed only

```bash
cd /home/marvispace/repositories/marvispace.com
php install/seed.php
bash deploy.sh
```

## Architecture

```
Browser → /api/v1/*.php → MySQL (marvispace_store)
Cart    → localStorage (browser only)
Admin   → PHP session cookie (httponly, secure)
Config  → /home/marvispace/api_config.php (not in public_html)
```

## Troubleshooting

**health.php shows `"database":false`**
- Run `install/setup-server.sh` again
- Check `/home/marvispace/api_config.php` exists

**Admin login fails after API setup**
- Clear browser cookies for `marvispace.com`
- Re-run seed: `php install/seed.php`

**500 on API**
- Check `tail -f /home/marvispace/logs/error_log` in cPanel
