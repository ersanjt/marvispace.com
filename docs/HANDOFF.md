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
- Server database for orders
- Transactional email (order confirmations)
- Multi-device order tracking
- Shipping carrier integration

> Orders today are stored in the **customer's browser**. Admin sees orders placed from browsers that share the same device storage context. For a live store, connect a payment provider and backend API.

## Admin login

Open https://marvispace.com/admin — custom sign-in page.

| Field | Value |
|-------|-------|
| Email | `ersanjahedtabrizi@gmail.com` |
| Password | Set on server (see below) |
| Recovery code (default) | `MarviRecover2026!` — change after first use |

**Change password on server:**

```bash
cd /home/marvispace/repositories/marvispace.com
node tools/set-admin-password.mjs 'YourSecurePassword' 'YourRecoveryCode'
bash deploy.sh
```

**Forgot password in browser:** use **Forgot password?** on `/admin` with admin email + recovery code.

For stronger protection, also enable **cPanel → Directory Privacy** on `/admin`.

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
