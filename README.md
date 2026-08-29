# MARVISPACE

Premium leather apparel e-commerce — [marvispace.com](https://marvispace.com)

Static storefront + PHP/MySQL API + admin dashboard. Yeezy-inspired UX.

## Stack

- HTML / CSS / ES modules (no build step)
- PHP 8+ REST API (`/api/v1/`)
- MySQL on cPanel
- Apache clean URLs
- GitHub Actions deploy

## Quick start (local)

```bash
git clone https://github.com/ersanjt/marvispace.com.git
cd marvispace.com
cp .env.example .env          # fill in locally — never commit .env
cp assets/js/config/admin-auth.js.example assets/js/config/admin-auth.js
npx serve .
```

## Server setup

See [docs/SERVER-SETUP.md](docs/SERVER-SETUP.md) and [docs/DATABASE.md](docs/DATABASE.md).

```bash
MARVISPACE_ADMIN_EMAIL='you@example.com' \
MARVISPACE_ADMIN_PASSWORD='YourStrongPassword' \
bash install/setup-server.sh
```

## Security

- **No secrets in git** — see [SECURITY.md](SECURITY.md)
- Production config: `/home/marvispace/api_config.php` (outside web root)
- Report vulnerabilities privately (see SECURITY.md)

## Project layout

```
index.php / index.html  Storefront entry (SEO + /en /tr)
product.php             Product URLs
page.php                Bilingual legal/info router
templates/              HTML for those pages (contact, privacy, …)
checkout.html           Checkout
admin.html              Admin panel
order-status.html       Order lookup
api/                    PHP REST API (`/api/v1/`, `api/lib/`)
assets/css|js|images    Front-end (js/pages = page scripts)
install/                Migrations, seed, server scripts
docs/                   Deployment & database guides
tools/                  One-off maint scripts (not the public site)
```

## Admin

`/admin` — server-side session auth (MySQL). Local fallback config is gitignored.

## Deploy

Push to `main` → GitHub Actions → SSH → `deploy.sh`

Manual: `bash deploy.sh` on server

## Developer

**Ersan JT** — [github.com/ersanjt](https://github.com/ersanjt)
