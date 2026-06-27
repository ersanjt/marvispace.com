# Deploy marvispace.com on cPanel (safe / isolated)

> **Project layout:** see `README.md` — runtime assets live under `assets/`.  
> `tools/` and `docs/` are excluded from production deploy.

This project is **only** for account `marvispace`.
Do not run these commands in other users' home folders.

## Paths

| Item | Path |
|------|------|
| cPanel user | `marvispace` |
| Home | `/home/marvispace` |
| Website root | `/home/marvispace/public_html` |
| Git repo (recommended) | `/home/marvispace/repositories/marvispace.com` |
| GitHub | `https://github.com/ersanjt/marvispace.com.git` |

---

## Method C — GitHub Actions (automatic on push)

Every push to `main` triggers `.github/workflows/deploy.yml`, which SSHs to the server and runs `deploy.sh`.

### One-time server setup (WHM as root)

After pulling this workflow to the server, authorize the GitHub Actions deploy key:

```bash
bash /home/marvispace/repositories/marvispace.com/tools/setup-github-actions-ssh.sh --key "PASTE_PUBLIC_KEY_HERE"
```

Or add manually to `/root/.ssh/authorized_keys` (comment: `github-actions-marvispace-deploy`).

GitHub repository secrets (already configured):

| Secret | Purpose |
|--------|---------|
| `SSH_HOST` | Server IP (`92.205.182.143`) |
| `SSH_USER` | `root` |
| `SSH_PORT` | `22` |
| `SSH_PRIVATE_KEY` | Deploy key (ed25519) |

Monitor runs: https://github.com/ersanjt/marvispace.com/actions

Re-run a failed deploy: **Actions** → **Deploy to production** → **Run workflow**.

---

## Method A — cPanel UI (manual)

1. Log in to **cPanel** as `marvispace` (not WHM root).
2. Open **Git™ Version Control**.
3. Click **Create**.
4. Fill in:
   - **Clone URL:** `https://github.com/ersanjt/marvispace.com.git`
   - **Repository Path:** `repositories/marvispace.com`
5. Click **Create**.
6. Open the new repository → **Pull or Deploy** → **Update from Remote**.
7. Click **Deploy HEAD Commit**.

The file `.cpanel.yml` copies site files into `public_html` automatically.

---

## Method B — WHM Terminal (only marvispace)

Run as **root**, but execute git commands **as user marvispace**.

### 1) Safety check — do not touch other accounts

```bash
# Only list marvispace paths
ls -la /home/marvispace
ls -la /home/marvispace/public_html
ls -la /home/marvispace/repositories 2>/dev/null || echo "no repositories yet"
```

### 2) Clone repo (first time only)

```bash
su - marvispace -c 'mkdir -p ~/repositories'
su - marvispace -c 'cd ~/repositories && git clone https://github.com/ersanjt/marvispace.com.git marvispace.com'
```

### 3) Deploy to public_html

```bash
su - marvispace -c 'cd ~/repositories/marvispace.com && git pull origin main'
su - marvispace -c 'rsync -av --delete --exclude .git --exclude .cpanel.yml --exclude .gitignore ~/repositories/marvispace.com/ ~/public_html/'
```

### 4) Fix permissions (if needed)

```bash
chown -R marvispace:marvispace /home/marvispace/public_html
find /home/marvispace/public_html -type d -exec chmod 755 {} \;
find /home/marvispace/public_html -type f -exec chmod 644 {} \;
```

### 5) Future updates

`marvispace` shell is disabled on this server, so run deploy as **root**:

```bash
bash /home/marvispace/repositories/marvispace.com/deploy.sh
```

If `git pull` fails with `Permission denied` on `.git/FETCH_HEAD`:

```bash
chown -R marvispace:marvispace /home/marvispace/repositories/marvispace.com
chmod -R u+rwX /home/marvispace/repositories/marvispace.com/.git
su marvispace -s /bin/bash -c 'cd /home/marvispace/repositories/marvispace.com && git pull origin main'
bash /home/marvispace/repositories/marvispace.com/deploy.sh
```

If you see `dubious ownership` once:

```bash
git config --global --add safe.directory /home/marvispace/repositories/marvispace.com
chown -R marvispace:marvispace /home/marvispace/repositories/marvispace.com
```

### Admin shows 500 or browser popup login

The site now uses a **custom admin login page** (not HTTP Basic Auth).

Change password locally, then deploy:

```bash
node tools/set-admin-password.mjs 'YourSecurePassword'
```

Optional extra protection: cPanel → **Directory Privacy** on `/admin`.

---

## Private GitHub repo (optional)

If the repo is private, create a deploy key only for this project:

```bash
su - marvispace -c 'mkdir -p ~/.ssh && chmod 700 ~/.ssh'
su - marvispace -c 'ssh-keygen -t ed25519 -C "marvispace-deploy" -f ~/.ssh/marvispace_deploy -N ""'
su - marvispace -c 'cat ~/.ssh/marvispace_deploy.pub'
```

Add the public key in GitHub → repo **Settings → Deploy keys**.

Then clone with SSH:

```bash
su - marvispace -c 'cd ~/repositories && git clone git@github.com:ersanjt/marvispace.com.git marvispace.com'
```

---

## What NOT to do

- Do not run `git` inside `/home/marvispace/public_html` if another project already uses it.
- Do not delete `/home/*/repositories` for other users.
- Do not change global git config on the server.
- Do not run `rsync --delete` on folders outside `/home/marvispace/public_html`.
