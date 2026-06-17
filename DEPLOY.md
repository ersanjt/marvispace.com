# Deploy marvispace.com on cPanel (safe / isolated)

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

## Method A — cPanel UI (recommended, safest)

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

```bash
su - marvispace -c 'cd ~/repositories/marvispace.com && git pull origin main && rsync -av --delete --exclude .git --exclude .cpanel.yml --exclude .gitignore ./ ~/public_html/'
```

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
