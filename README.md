# MARVISPACE

Premium leather apparel storefront — **marvispace.com**

Static frontend with Yeezy-inspired UX, client-side cart/checkout demo, and admin dashboard.

## Stack

- HTML / CSS / ES modules (no build step required for production)
- Apache clean URLs (`.htaccess`)
- cPanel + Cloudflare hosting
- Product data: `assets/js/data/products.js`
- Persistence: browser `localStorage` (demo — replace with backend for production sales)

## Quick start (local)

```bash
npx serve .
# or any static file server from project root
```

Open `http://localhost:3000`

## Deploy (production)

```bash
bash /home/marvispace/repositories/marvispace.com/deploy.sh
```

See [docs/DEPLOY.md](docs/DEPLOY.md) and [docs/HANDOFF.md](docs/HANDOFF.md).

## Project layout

```
index.html          Storefront
checkout.html       Checkout flow
admin.html          Admin panel (custom sign-in page)
assets/css/         Stylesheets
assets/js/          Application code
assets/images/      Product photography
docs/               Deploy & handoff guides
tools/              Sitemap generator, admin auth setup
```

Full tree: [docs/STRUCTURE.md](docs/STRUCTURE.md)

## Admin access

Open `/admin` for the custom sign-in page (Yeezy-style UI).

Set password hash:

```bash
node tools/set-admin-password.mjs 'YourSecurePassword'
```

Default password after setup: `MarviAdmin2026!` (change immediately).

Optional: cPanel **Directory Privacy** on `/admin` for server-level protection.

## Developer

**Ersan JT** — [github.com/ersanjt](https://github.com/ersanjt)

Repository: [github.com/ersanjt/marvispace.com](https://github.com/ersanjt/marvispace.com)
