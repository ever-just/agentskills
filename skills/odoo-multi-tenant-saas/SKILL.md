# Odoo Multi-Tenant SaaS Platform

## Overview

Build a self-hosted, multi-tenant SaaS platform on Odoo 19 Community Edition. Each tenant gets an isolated PostgreSQL database, custom subdomain, and fully debranded UI — all from a single Odoo binary.

Use this skill when you need to:
- Launch a white-labeled Odoo-based SaaS product
- Provision isolated tenant workspaces with automated signup + Stripe billing
- Debrand Odoo Community to remove all upstream references
- Route subdomains to per-tenant databases via Nginx + dbfilter

---

## Architecture

```
*.yourdomain.com → Nginx (wildcard SSL) → ┌─ yourdomain.com     → FastAPI control plane (signup, Stripe)
                                          └─ <org>.yourdomain.com → Odoo 19 (dbfilter → DB <org>)
                                                                          │
                                                              PostgreSQL: one DB per tenant
```

## Key Components

### 1. Control Plane (FastAPI)
- Signup form at root domain → Stripe checkout → webhook → provisioning
- `provisioning.py`: creates DB, installs modules, sets admin creds, configures mail
- Status polling endpoint for post-signup "setting up" page
- Workspace login redirect for returning users

### 2. Debranding Module (`everjust_brand` pattern)
- `auto_install = True` — every tenant gets it
- Browser tab title, favicon, login page logo
- "Powered by" footers removed (backend, portal, reports, email)
- User menu external links removed
- Enterprise upgrade banners hidden
- `list_db = False` in odoo.conf

### 3. Multi-Tenant Routing
- Nginx wildcard server: `~^(?<tenant>.+)\.yourdomain\.com$`
- Odoo `dbfilter = ^%d$` extracts subdomain from Host header
- Root domain → control plane (port 8000)
- Wildcard → Odoo (port 8069)

### 4. Provisioning Flow
```python
def provision_tenant(subdomain, admin_login, admin_password):
    # 1. Initialize DB with modules
    docker exec odoo odoo -d {subdomain} -i base,brand,theme --stop-after-init
    # 2. Set admin credentials via ORM shell
    # 3. Configure mail (Resend SMTP)
    # 4. Optional: DNS A record via GoDaddy API
```

### 5. Docker Compose Stack
- `db` — PostgreSQL 16
- `odoo` — Official odoo:19 image + custom addons volume
- `control-plane` — FastAPI with Docker CLI for `docker exec`
- `nginx` — Wildcard SSL, subdomain routing

## Subdomain Validation
```python
SUBDOMAIN_RE = re.compile(r"^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$")
RESERVED = {"www", "app", "api", "admin", "mail", "ftp", "staging", "test"}
```

## Stripe Integration
- Graduated pricing: base seats flat + per-seat overage
- `allow_promotion_codes = True` for free access codes
- `payment_method_collection = "if_required"` for $0 checkouts
- Webhook handles `checkout.session.completed` → provision
- Webhook handles `invoice.payment_failed` → suspend (deactivate users)

## SSL
- Wildcard cert via Let's Encrypt DNS-01 challenge (GoDaddy DNS plugin)
- Auto-renewal cron

## Pitfalls
- `dbfilter` must match `^%d$` exactly — `%d` = first subdomain segment
- `list_db = False` is critical — prevents database manager exposure
- Password in metadata: use a one-time token store for production
- Admin user is always UID 2 in Odoo (UID 1 is OdooBot)
- Module `auto_install = True` only triggers when ALL dependencies are installed
