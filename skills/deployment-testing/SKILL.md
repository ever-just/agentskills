# Deployment & Testing for app.customagents.io

## Dashboard (Next.js on Netlify)

### Deploy — CI/CD (preferred)
Deploys happen **automatically** via GitHub Actions on every push/merge to `main` that touches `dashboard/**`.
Workflow: `.github/workflows/deploy-dashboard.yml`
- Uses `netlify deploy --build --prod` (single command — plugin controls publish dir)
- Required GitHub secrets: `NETLIFY_AUTH_TOKEN`, `NETLIFY_DASHBOARD_SITE_ID`
- Preview deploys automatically on PRs

### Deploy — Manual (emergency only)
```bash
cd dashboard
NETLIFY_AUTH_TOKEN=<pat> NETLIFY_SITE_ID=5c00db58-10cc-4d37-a25c-b559e9e8dcb6 netlify deploy --build --prod
```

**netlify.toml MUST have:**
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

**CRITICAL rules:**
- Use `netlify deploy --build --prod` — single command, plugin controls publish dir automatically
- Do NOT use `--no-build` without a prior `netlify build` — breaks SSR routing
- Do NOT use `--dir` flag — bypasses plugin, causes MIME type issues
- Do NOT set `publish = ".netlify/static"` — plugin v5.15+ validates this dir BEFORE creating it → fails
- Static assets are served from `_next/static/*` via the server function, NOT the CDN publish dir
- Netlify GitHub integration is linked: `ever-just/app.customagents.io` → auto-builds on push to main
- Neon extension was REMOVED from Netlify site — do not reinstall (we use MongoDB)

### Build & Lint (local only, no deploy)
```bash
cd dashboard
npm run build
npm run lint
```

## API (Docker Compose on DigitalOcean)

- Droplet IP: 134.209.221.255
- Stack: MongoDB 7 + Redis 7 + Bun API via Docker Compose
- Nginx reverse proxy on port 80/443 with Let's Encrypt SSL
- SSH: `ssh root@134.209.221.255`
- Project path on server: `/opt/customagents`

### Deploy
```bash
# 1. Sync API source (exclude node_modules — Docker installs deps)
rsync -avz --exclude='node_modules' --exclude='.git' --exclude='bun.lockb' ./api/ root@134.209.221.255:/opt/customagents/api/
# 2. Rebuild and restart container
ssh root@134.209.221.255 "cd /opt/customagents && docker compose build api && docker compose up -d api"
# 3. Verify
curl https://api.customagents.io/health
```

### View Logs
```bash
ssh root@134.209.221.255 "docker compose -f /opt/customagents/docker-compose.yml logs -f api --tail=100"
```

## URLs

| Service | URL |
|---------|-----|
| Dashboard | https://app.customagents.io |
| API Health | https://api.customagents.io/health |
| Netlify | https://app-customagents-io.netlify.app |

## DNS

- Managed via Cloudflare (zone: customagents.io)
- `app` → CNAME to `app-customagents-io.netlify.app`
- `api` → A record to `134.209.221.255` (DNS only, no proxy)
- Cloudflare API token stored as secret

## Testing Patterns

### PWA Verification
- Check `document.querySelector('link[rel="manifest"]')` returns manifest URL
- Check `navigator.serviceWorker.controller` is active
- Verify meta tags: `theme-color`, `apple-mobile-web-app-capable`, `viewport`

### Mobile Responsive Testing
- Use `set_mobile: true` in browser tool to simulate mobile viewport
- Verify sidebar is off-screen (elements marked `offscreen`)
- Verify hamburger menu button has `aria-label="Open menu"`
- Test sidebar open/close: click hamburger → sidebar visible → click backdrop → sidebar hidden
- Test auto-close on navigation: click nav item → sidebar closes

### CORS Verification
- `curl -sI -H "Origin: https://app.customagents.io" https://api.customagents.io/v1/agents`
- Verify `Access-Control-Allow-Origin` appears exactly once
- CORS is handled by Express only (not Nginx) to avoid header duplication

## Known Issues

- `/activity` and `/drafts` routes return 404 on RSC prefetch — these are Next.js prefetch errors for routes that exist but may not have proper server rendering setup
- API returns 400 on `/v1/agents` without proper API key — expected until real credentials are configured
- No CI configured — lint and build must be verified locally before push
