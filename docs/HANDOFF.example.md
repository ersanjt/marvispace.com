# Client Handoff — MARVISPACE (template)

Copy to `docs/HANDOFF.local.md` (gitignored) and fill in client-specific values.

## What you receive

| Item | Details |
|------|---------|
| Website | https://yourdomain.com |
| Admin | https://yourdomain.com/admin |
| Hosting | cPanel account |
| Source | GitHub repository |

## Database

| Item | Value |
|------|-------|
| Database | `cpaneluser_store` |
| Config | `/home/cpaneluser/api_config.php` (private, not in git) |
| Health | `curl -s https://yourdomain.com/api/v1/health.php` |
| Setup | `bash install/setup-server.sh` — see `docs/SERVER-SETUP.md` |

## Admin login

Credentials are set during server provisioning — **not stored in GitHub**.

```bash
MARVISPACE_ADMIN_EMAIL='admin@client.com' \
MARVISPACE_ADMIN_PASSWORD='StrongUniquePassword' \
bash install/setup-server.sh
```

Recovery code: set via `MARVISPACE_RECOVERY_CODE` on server only.

## Deploy

Push to `main` → GitHub Actions → `deploy.sh`
