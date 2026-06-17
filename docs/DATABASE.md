# MARVISPACE — Database setup (cPanel)

## Correct cPanel naming

| Item | Recommended name | Notes |
|------|------------------|--------|
| Database | `marvispace_store` | Main store database |
| DB User | `marvispace_storeuser` | App user only (not `admin`) |
| Privileges | ALL on `marvispace_store` | Link user to **that** database |

**Do not create random databases like `marvispace_harder`** — the app connects via `api_config.php`, not every database you create in cPanel.

---

## Automatic install (recommended — root/WHM)

```bash
cd /home/marvispace/repositories/marvispace.com
git pull
bash install/setup-server.sh
```

This will:
1. Create `marvispace_store` + MySQL user
2. Write `/home/marvispace/api_config.php` (outside public_html)
3. Run professional migrations
4. Seed products + admin
5. Deploy

---

## Troubleshooting `Access denied (1045)`

The password in `api_config.php` may not match cPanel MySQL (often when the user was created manually).

**As root on WHM:**

```bash
cd /home/marvispace/repositories/marvispace.com
git pull
bash install/fix-mysql-user.sh
php install/migrate.php
php install/doctor.php
```

Or run UAPI manually (this server needs **full** names with `marvispace_` prefix):

```bash
DB_PASS=$(php -r '$c=require "/home/marvispace/api_config.php"; echo $c["db"]["pass"];')
uapi --user=marvispace Mysql create_database name=marvispace_store
uapi --user=marvispace Mysql create_user name=marvispace_storeuser password="$DB_PASS"
uapi --user=marvispace Mysql set_privileges_on_database \
  user=marvispace_storeuser database=marvispace_store privileges=ALL
```

If you only have `marvispace_harder` in cPanel, that is the **wrong** database — create `marvispace_store` as above.

---

## Manual cPanel database

If you created a database in cPanel:

1. **MySQL Databases** → add user to database → **ALL PRIVILEGES**
2. On server:

```bash
cd /home/marvispace/repositories/marvispace.com
git pull

MARVISPACE_DB_NAME='marvispace_store' \
MARVISPACE_DB_USER='marvispace_storeuser' \
MARVISPACE_DB_PASS='YOUR_DB_PASSWORD' \
php install/provision-database.php

bash deploy.sh
```

---

## Schema (v2)

| Table | Purpose |
|-------|---------|
| `products` | Catalog, stock, pricing |
| `orders` | Order + indexed customer/shipping columns |
| `order_items` | Line items (FK → orders) |
| `admin_users` | Admins (bcrypt, role, is_active) |
| `site_settings` | Favicon and site config |
| `cart_sessions` | Shopping cart (browser cookie → session row) |
| `cart_items` | Cart line items |
| `login_attempts` | Brute-force protection |
| `schema_migrations` | Schema version tracking |

### Key `orders` columns

- `customer_email`, `customer_first_name`, `customer_last_name`, `customer_phone`
- `shipping_address1`, `shipping_city`, `shipping_country`, ...
- `payment_method`, `tax_id`
- `confirmation_email_sent_at`, `admin_notified_at`

---

## Migrations

```bash
php install/migrate.php --status   # status
php install/migrate.php            # apply pending
```

Files in `install/migrations/`:
- `001_initial.sql`
- `002_professional_orders.sql`
- `003_admin_and_settings.sql`
- `004_products_constraints.sql`
- `005_cart.sql`

---

## Health check

```bash
curl -s https://marvispace.com/api/v1/health.php
```

Expected: `"database": true`, `"version": "2"`, table counts.

---

## Security

- DB password only in `/home/marvispace/api_config.php` (chmod 640)
- Admin passwords: bcrypt in `admin_users`
- Session: HttpOnly + Secure + SameSite=Strict
- Login: max 8 failed attempts per 15 minutes
- Orders: server-side validation (email, address, phone, payment)
- Admin API: session required

---

## If you created `marvispace_harder`

That database is **not** connected to the app. Delete it or use `provision-database.php` with the correct names — the database name must match `api_config.php`.
