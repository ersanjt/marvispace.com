# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| `main` branch (production) | Yes |

## Reporting a vulnerability

**Do not** open public GitHub issues for security problems.

Email **security@marvispace.com** (or the repository owner via GitHub private advisory) with:

- Description of the issue
- Steps to reproduce
- Impact assessment

We aim to respond within 72 hours.

## What must never be committed

- `assets/js/config/admin-auth.js` (password hashes)
- `api/config.local.php` or server `api_config.php`
- SSH private keys, `.pem`, `.deploy-keys/`
- Database passwords, SMTP passwords, recovery codes
- `.env` files with real credentials

Use `.example` files and server-side config outside the web root.

## Production secrets location

| Secret | Location |
|--------|----------|
| Database credentials | `/home/marvispace/api_config.php` |
| Admin passwords | MySQL `admin_users` (bcrypt) |
| Recovery code | `api_config.php` → `admin.recovery_bcrypt` |
| SMTP password | `api_config.php` → `mail.smtp.pass` |
| SSH deploy key | GitHub Actions secrets only |

## If credentials were exposed

1. Change admin password immediately (`/admin` or `php install/seed.php` with new env)
2. Rotate recovery code: `MARVISPACE_FORCE_RECOVERY=1 MARVISPACE_RECOVERY_CODE='NewCode' php install/patch-api-config.php`
3. Rotate database and SMTP passwords in cPanel
4. Regenerate GitHub Actions SSH key if private key was leaked
