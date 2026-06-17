# Client Handoff — MARVISPACE

## What you receive

| Item | Details |
|------|---------|
| Website | https://marvispace.com |
| Admin | https://marvispace.com/admin |
| Hosting | cPanel account `marvispace` |
| Source | GitHub `ersanjt/marvispace.com` |

## Current capabilities

**Included (ready):**
- Product catalog with image gallery and size selection
- Shopping cart and Yeezy-style checkout UI
- Order confirmation page (`/order-confirmation`)
- Order lookup on same device (`/order-status`)
- Admin dashboard for products and orders (browser storage)
- SEO: sitemap, robots, meta tags, clean URLs
- Footer legal pages (Contact, Terms, Privacy, Accessibility, DNSMPI)

**Not included yet (next phase for real sales):**
- Payment gateway (Stripe, PayPal, etc.)
- Transactional email (order confirmations)
- Shipping carrier integration

> **Setup:** Run `install/setup-server.sh` once on WHM to create MySQL + API. See `docs/SERVER-SETUP.md`.

> Orders and products are stored in **MySQL** on the server (`marvispace_store`).  
> Shopping cart stays in the **customer's browser** until checkout.  
> For a live store, connect a payment provider and backend API.

## Database (MySQL on cPanel)

| Item | Value |
|------|-------|
| Database | `marvispace_store` |
| Tables | `products`, `orders`, `order_items`, `admin_users` |
| Config file | `/home/marvispace/api_config.php` (private) |
| API health | https://marvispace.com/api/v1/health.php |
| Setup (once) | `bash install/setup-server.sh` — see `docs/SERVER-SETUP.md` |
| phpMyAdmin | cPanel → phpMyAdmin → `marvispace_store` |

## Admin login

Open https://marvispace.com/admin — server-side session (after MySQL setup).

| Field | Value |
|-------|-------|
| Email | `ersanjahedtabrizi@gmail.com` |
| Password | Set in `install/setup-server.sh` (`MARVISPACE_ADMIN_PASSWORD`) |

**First-time server setup:**

```bash
bash /home/marvispace/repositories/marvispace.com/install/setup-server.sh
```

Legacy client-side login applies only if API/database is not configured.

## Deploy updates

**Automatic:** push to `main` on GitHub → [Actions](https://github.com/ersanjt/marvispace.com/actions) deploys to the server.

**Manual fallback:**

```bash
bash /home/marvispace/repositories/marvispace.com/deploy.sh
```

## Support email

Create in cPanel: `support@marvispace.com`  
Update if needed in `assets/js/config/site.js`

## Recommended next steps

1. Connect **Stripe** (or Shopify/Swell) for payments
2. Move orders to a **server database**
3. Enable **order confirmation emails** via cPanel SMTP or SendGrid
4. Replace demo checkout submit with payment API
5. Enable **Cloudflare Force HTTPS** in cPanel

## Developer contact

**Ersan JT** — https://github.com/ersanjt
