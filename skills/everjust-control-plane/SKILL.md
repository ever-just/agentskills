---
name: everjust-control-plane
description: Operate the everjust.app CONTROL PLANE — the FastAPI service at the everjust.app root that runs the public marketing site, self-serve signup, Stripe billing, tenant provisioning, and suspend/resume. Use when the task is about signup or checkout, Stripe prices/webhooks/coupons, creating or deleting a tenant workspace, why a paying customer has no workspace, the in-app billing manager (Settings → Billing / everjust_billing / /billing/portal), activating a feature package on a tenant, subdomain validation and reserved names, or the control-plane's own env vars and data tables. This is the layer ABOVE the tenants — everything here happens BEFORE a workspace exists or ACROSS all of them. It is NOT Odoo: for work inside a provisioned tenant read [[everjust-platform]] and [[everjust-agent-mcp]]; for box-shell tenant ops read [[everjust-odoo-shell-ops]]. Money moves here, so read the invariants before touching signup, pricing, or the webhook.
---

# everjust.app control plane — signup, billing, provisioning

The **control plane** is a FastAPI service (`control-plane/` in `ever-just/ww.everjust.app`)
that serves `https://everjust.app` itself: the marketing site, `/docs`, `/signup`,
the Stripe webhook, and the code that *creates tenant databases*. Tenants live at
`https://<subdomain>.everjust.app` and are Odoo; the control plane is not.

**Self-serve signup is live and charges real cards.** A mistake in this codebase
either takes money without delivering a workspace, delivers a workspace without
taking money, or bills the wrong amount. Treat every change to signup, pricing,
or the webhook as a money change.

## When to use this skill

- Anything about **signup / checkout / pricing tiers / Stripe** (prices, coupons,
  webhooks, the New Business step-up, promotion codes).
- **Provisioning**: creating a tenant, a signup that paid but has no workspace,
  personalization, the "is it ready yet" question, DNS, the welcome email.
- **The in-app billing manager** — `Settings → Billing` inside a tenant, the
  `everjust_billing` addon, `POST /billing/portal`, billing tokens.
- **Tenant lifecycle across the fleet**: suspend on dunning failure, resume on
  recovery, activating a feature package on an existing tenant.
- Control-plane **env vars, data tables, tests, or deploy behavior**.

**Not this skill:** editing records, mail, website content, or anything else
*inside* one workspace — that's [[everjust-platform]] (rules) +
[[everjust-agent-mcp]] (the toolset) or [[everjust-odoo-shell-ops]] (box shell).

## The shape (read this before your first change)

| Fact | Consequence |
|---|---|
| One `control-plane` container, built from `control-plane/`, `restart: unless-stopped` | A code change needs a rebuild, not just a restart |
| It **mounts `/var/run/docker.sock`** | Provisioning runs `docker exec <odoo container> odoo …` — it drives Odoo's CLI from outside |
| Config is read from env **at import time** | Flipping a flag in `deployment/.env` does nothing until the container restarts |
| `stripe.api_key = os.environ["STRIPE_SECRET_KEY"]` — **bracket, not `.get`** | With no key the module raises `KeyError` at import and the app won't start. `tests/conftest.py` sets dummy env for this reason |
| Control tables live in the **`postgres`** database; each tenant is its own DB named exactly `<subdomain>` | `provisioning._pg_connect()` defaults to `postgres`; `_pg_connect(sub)` reaches into one tenant |
| Changes under `control-plane/` classify as deploy class **`light`** | Control-plane deploys rebuild that container and do **not** stop Odoo — no tenant sign-in outage. Mixing in an `addons/` change escalates the whole push (see [[github-actions-ec2-deploy]] and the repo's `zero-downtime-deploy` skill) |

Control-plane tables, all auto-created on first use (`CREATE TABLE IF NOT EXISTS`
inside each accessor — there are no migrations to run):

| Table | Module | Holds |
|---|---|---|
| `everjust_pending_signups` | `signup_store.py` | org, subdomain, admin email, **admin password**, personalization. 7-day TTL |
| `everjust_handled_checkouts` | `signup_store.py` | Claimed Stripe checkout ids — webhook idempotency |
| `everjust_billing_customers` | `billing_store.py` | subdomain → Stripe customer id |

> ⚠️ `deployment/scripts/backup_all.sh` skips the `postgres` and `control`
> databases, so **none of the three tables above is backed up**. Losing them
> loses in-flight signups (including the only copy of a paying customer's admin
> password) and the billing customer map. Say so if you touch backups; don't
> quietly assume they're covered.

## The money path, end to end

```
GET  /signup?plan=<slug>          wizard; deflects to /walkthrough if SELF_SERVE_SIGNUP is off
POST /signup/checkout             validate → reserve subdomain → Stripe embedded Checkout → clientSecret
     (POST /signup is the no-JS twin: same validation, HOSTED checkout, 303 redirect)
   … customer pays …
POST /stripe/webhook              checkout.session.completed
        ├─ billing_store.set_customer(subdomain, customer)     (before the idempotency return)
        ├─ guard 1: database_exists(subdomain)? → ack, done
        ├─ signup_store.peek(token)   ← PEEK, not pop
        ├─ guard 2: signup_store.claim_checkout(id)  → atomic; duplicate delivery acks
        ├─ plan == new-business? → _schedule_new_business_stepup(subscription)
        └─ background_tasks → _provision_from_checkout(...)     ~2 min
GET  /welcome?s=<session>&subdomain=<sub>   polls GET /status/<sub> until ready
GET  /status/<sub>                {"ready": is_provisioned(sub)}
```

Design points that are load-bearing — do not "simplify" them:

- **The webhook acks in milliseconds and provisions in the background.**
  Provisioning takes ~2 minutes; Stripe's webhook timeout is ~10 seconds. Doing
  it inline made Stripe time out and retry, i.e. double-provision attempts.
- **Peek, don't pop.** The pending row is deleted only *after* provisioning
  succeeds. It holds the customer's admin password — the only copy — so a crash
  mid-provision leaves it recoverable instead of stranding a paid customer.
- **Two idempotency guards, not one.** `database_exists` only flips true after
  `CREATE DATABASE`, so it cannot dedupe deliveries that race *during*
  provisioning; `claim_checkout` is the atomic claim that does.
- **`PAID BUT UNPROVISIONABLE` returns 500 on purpose.** An unresolvable token
  must keep paging (via Stripe retries) rather than be silently acked.
- **A `SubdomainReserved` error is a feature.** Two concurrent signups for the
  same address must not both reach checkout — only one can ever provision, so
  the second would be charged for nothing.

### Pricing and plan handling

`content.PRICING` in `control-plane/content.py` is the **single source of
truth** for tiers, amounts, and copy — templates, JSON-LD, `llms.txt`, the docs,
and `scripts/stripe_bootstrap_prices.py` all read it. Change a price there, in
one place.

Stripe price IDs come from env, one per tier slug:
`STRIPE_PRICE_AGENTS` / `STRIPE_PRICE_STANDARD` / `STRIPE_PRICE_NEW_BUSINESS`.
Create them idempotently with `python3 control-plane/scripts/stripe_bootstrap_prices.py`
(stable per-tier `lookup_key`; re-running finds the existing price).

Two deflection rules exist so a bad request can never overbill:

1. `_valid_plan()` — a garbled, tampered, or unknown plan slug does **not**
   fall back to the priciest tier. It deflects to `/walkthrough` (409 JSON for
   the embedded path, 307 for the form path).
2. `_price_for_plan()` — a tier with no configured price returns `""` and also
   deflects. It must **never** fall back to the legacy single `STRIPE_PRICE_ID`
   constant, which is a different amount. (That constant is now referenced
   nowhere but its own definition — dead, kept only as documentation of the
   trap.)

**New Business** ($599/mo, businesses registered <12 months) is encoded as a
Stripe `SubscriptionSchedule`: 12 iterations of the New Business price, then an
open-ended Standard phase, `end_behavior="release"`. It is deliberately
**best-effort and undercharge-safe** — if the schedule call fails, the customer
stays on the flat $599 and the log emits a `CRITICAL` saying a manual step-up is
owed at month 12. Never make this fatal to a checkout the customer already paid.
The code verifies the edit produced ≥2 phases; a 1-phase result is a silent
"step-up will never happen" bug and is logged as CRITICAL too.

Checkout uses `allow_promotion_codes=True` and
`payment_method_collection="if_required"`, so a **100%-off promotion code makes
an account free with no card collected**. Audit coupons before assuming revenue.

### Signup gating

`SELF_SERVE_SIGNUP` defaults to **off in code** and is set to `1` in
`deployment/.env` **on the server**. The repo therefore always *looks* gated
while production is live and charging. **Trust the running site, not the
default.** Kill switch: remove the var from `deployment/.env` and restart the
control-plane container — it is read once at import, so a restart is mandatory.

## Provisioning: what actually happens

```python
provisioning.provision_tenant(subdomain, admin_login, admin_password,
                              org_name="", personalization=None)
```

Refuses invalid/reserved subdomains and refuses to touch an existing DB. Then:

**Essential (a failure here is a real provisioning failure):**
1. `docker exec … odoo -d <sub> -i EVERJUST_MODULES --stop-after-init` — creates
   the DB and installs the base stack. The brand satellites arrive via Odoo's
   dependency + `auto_install` resolution, not by being listed.
2. `_set_admin_credentials` · 3. `_configure_mail` · 4. `_configure_dms`

**Best-effort (each logs, none blocks — the customer has paid, they get a tenant):**
`_apply_company_profile` → `_record_personalization` → `_install_personalized_apps`
→ `_apply_website_branding` (SSRF-guarded fetch — keep the guard) →
`_configure_billing` → `_provision_nextcloud` → `ensure_dns` → `_prewarm_assets`

**Last, always last:** `_mark_provisioned` writes `everjust.provisioned = "1"`
into the tenant's `ir_config_parameter`. `/status` keys off *that*, not off
`pg_database` — the DB row appears within seconds of `CREATE DATABASE`, roughly
100 s before modules finish installing, and keying off it sent customers to a
half-built workspace that errored on login. **Never move this step earlier.**

Module selection is **allow-listed**. `personalized_modules()` maps the captured
industry + goals through `INDUSTRY_MODULES` / `GOAL_MODULES` (falling back to
`DEFAULT_MODULES`), then filters everything through `ALLOWED_MODULES` — so a
customer-supplied string can never install an arbitrary module. Any tenant that
gets `crm` also gets `CRM_ECOSYSTEM_MODULES` (site form, livechat, events,
campaigns) so a pipeline is never delivered with no lead sources.

`_prewarm_assets` exists because a brand-new tenant never goes through the
deploy pipeline's prewarm, so its first asset compile happened on the customer's
own first login — observed racing personalization's module installs into an SCSS
failure. Compiling once, after installs settle, removes the race.

### Subdomain rules

`^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$`, plus a reserved set:
`www app api admin mail ftp staging test docs status help`.
`validate_subdomain()` is the only gate — call it before **any** operation that
takes a subdomain, especially before anything that shells out to
`odoo -d <name>`: Odoo's `-d` **silently creates** a database that doesn't
exist, so a typo'd subdomain spins up an orphan tenant. `enable_features()`
guards this explicitly; copy that pattern.

## Billing manager (the tenant-facing half)

Addon `addons/everjust_billing/` adds **Settings → Billing** inside a tenant.
The chain:

```
tenant admin clicks Billing
  → res_company.action_open_billing_portal()      requires base.group_system
  → POST <control-plane>/billing/portal
       data:   subdomain = <tenant DB name>
       header: X-Everjust-Billing-Token: <token>
  → control plane verifies, resolves the Stripe customer, returns {"url": …}
  → ir.actions.act_url opens the Stripe customer portal
```

**The token is `HMAC-SHA256(BILLING_PORTAL_SECRET, subdomain)`** — computed by
the shared `control-plane/billing_token.py:compute()` so the endpoint and
provisioning can never drift, compared with `hmac.compare_digest`, stored in the
tenant as `ir.config_parameter` `everjust.billing_token`.

Why this design, and what you must not undo:

- The token is **bound to one subdomain**, so a tenant admin who reads it (they
  can) still cannot open anyone else's billing. The `subdomain` in the request
  body is **not** a trust boundary — it has to match the token.
- The master secret lives **only** in the control plane, never in a tenant DB.
- `_CP_URL` in the addon comes from the `EVERJUST_CONTROL_PLANE_URL` **env var**,
  deliberately *not* an `ir.config_parameter` — a tenant admin must not be able
  to repoint a server-to-server callback that carries their token.
- With `BILLING_PORTAL_SECRET` unset, the token is skipped and the menu shows
  "contact support". Fail-closed, not fail-open.

Customer resolution order: `billing_store.get_customer(sub)` → fallback
`stripe.Subscription.search(metadata['subdomain'])`, which caches its answer.
`404` means "no billing account linked yet" and the addon says exactly that.

**Backfill for pre-existing tenants:**
```bash
BILLING_PORTAL_SECRET=… python3 deployment/scripts/backfill_billing.py \
    headsup tcstartupweek connectdomain
```
Idempotent; reuses `provisioning._configure_billing` so backfilled and new
tenants are identical. Needs docker access — run it **on the server**. Until it
is run for a tenant, only *newly provisioned* workspaces have Settings → Billing.

## Fleet lifecycle: suspend, resume, feature packages

**Suspend** (`customer.subscription.deleted`, or `invoice.payment_failed` **only
once `next_payment_attempt is None`** — never on a transient decline):
records the currently-active user ids in `everjust.suspended_user_ids`,
deactivates every `res_users` except ids 1 and 2, writes `everjust.suspended`.
Data is never deleted.

Order matters and is documented in the code: **deactivate before writing the
flag.** If the flag were written first, a crash between the two statements would
leave a tenant marked suspended with every user still active, and the
idempotency guard would skip the deactivation forever. The Nextcloud mirror call
runs on *every* invocation, including the already-suspended short-circuit, so a
transient failure gets retried by a later webhook redelivery.

**Resume** (`invoice.payment_succeeded`) reactivates exactly the recorded ids —
never a user disabled for unrelated reasons — and is a no-op when the tenant
isn't marked suspended. It **re-checks the subscription's current status first**:
Stripe does not guarantee cross-event-type ordering, and a trailing paid invoice
on a canceled subscription would otherwise silently reopen a workspace the
customer deliberately cancelled. Keep that guard.

**Feature packages** (`FEATURE_MODULES`) are curated OCA module sets that
substitute for paid Odoo Enterprise capabilities. They are inert until activated
per tenant:

```bash
curl -s -X POST https://everjust.app/admin/tenants/<sub>/features \
  -H "X-Admin-Secret: $CONTROL_PLANE_SECRET" \
  -H 'Content-Type: application/json' \
  -d '{"features":["accounting_plus"]}'      # 202 + the module list it will install
curl -s https://everjust.app/admin/features -H "X-Admin-Secret: $CONTROL_PLANE_SECRET"
```

Auth is `CONTROL_PLANE_SECRET` (`X-Admin-Secret` or `Bearer`), constant-time
compared, **fail-closed if unset**. Validation is synchronous (401/400/404) and
the install runs in the background because it takes minutes.

The install is **atomic per invocation**: if any module in the package can't
install — usually because its OCA repo isn't vendored on the host — Odoo rolls
back the whole `-i` and *nothing* activates. That's logged as a warning, not
raised. Three things must agree or a package references a module Odoo can't
find: `FEATURE_MODULE_REPOS`, `deployment/oca-manifest.txt`, and `odoo.conf`'s
`addons_path`. Wiring tests assert all three.

## Invariants — don't break these

1. **Never make a best-effort provisioning stage fatal.** The customer has paid;
   a failed logo fetch must not cost them a workspace.
2. **Never log a raw provisioning exception.** Provisioning shells out to Odoo
   with the DB password in `argv`, and `CalledProcessError` stringifies the full
   `argv`. Use `_scrub_secrets(str(e))` and drop `exc_info` — this is why
   `_provision_from_checkout` looks the way it does.
3. **Never widen module installation beyond `ALLOWED_MODULES`.**
4. **Never call `odoo -d <sub>` without `validate_subdomain` + `database_exists`.**
5. **Never let an unknown plan or unpriced tier reach Stripe.** Deflect.
6. **Never move `_mark_provisioned` off the last line.**
7. **Never put the billing control-plane URL in an `ir.config_parameter`.**
8. **Rate-limit key is the LAST `X-Forwarded-For` hop.** nginx appends the real
   peer, so the last hop can't be forged. Keying on the first hop would let a
   caller rotate fake IPs (bypass) or forge a victim's IP (lockout).
9. **Keep the SSRF guard in `website_enrichment.py`** — it fetches
   customer-supplied URLs during branding.
10. **Secrets never enter tracked files.** They belong in `deployment/.env`
    (gitignored) or the environment secret config. `.env.example` documents
    names only. Sentry is opt-in, `send_default_pii=False`,
    `max_request_body_size="never"`, and `before_send` scrubs known secrets.

## Working on it

```bash
cd control-plane && python3 -m pytest tests -q     # conftest supplies dummy env
bash deployment/scripts/branding_lint.sh           # fails on user-facing "Odoo"
```

Relevant suites: `test_billing_portal.py`, `test_billing_provisioning.py`,
`test_new_business_stepup.py`, `test_signup_embedded.py`,
`test_tenant_suspend_resume_sql.py`, `test_signup_store_sql.py`.

Marketing-site conventions (content is data-driven from `content.py`; visuals
are CSS/SVG diagrams, never product screenshots; docs are Markdown under
`docs_content/`) live in the repo's `CLAUDE.md` — follow them for any page work.
Any PR that ships a user-facing capability updates `content.py` **in the same PR**.

## Known gaps (verified, as of 2026-07-27)

State these plainly if a task touches them; don't paper over them.

- **The plan tier does not change what gets provisioned.** `provision_tenant()`
  takes no `plan` argument — `plan` reaches the webhook, drives the price and
  the New Business schedule, and stops there. A $2,500 "With Agents" workspace
  is byte-identical to a $1,500 Standard one; no agent module is in
  `EVERJUST_MODULES`, and agent access is granted per workspace by request.
  Anything that promises tier-gated *provisioning* is aspirational.
- **New Business eligibility is a checkbox**, self-declared at signup. The
  public copy says so ("we may ask for your formation document or EIN date").
  Keep those two facts in agreement.
- **Control-plane tables are not backed up** (see the warning above).
- **Config changes need a container restart** — every flag is read at import.

## Cross-references

- [[everjust-platform]] — operating rules *inside* a provisioned tenant. Read
  first whenever your work crosses into a workspace.
- [[everjust-agent-mcp]] — the per-tenant `/mcp` server and its toolset.
- [[everjust-odoo-shell-ops]] — SSH/`docker exec` tenant ops and the deploy
  pipeline's failure modes.
- [[everjust-tenant-domain-migration]] — moving a live tenant to a new public
  domain (the `*.everjust.app` machine host always stays).
- [[github-actions-ec2-deploy]] — the deploy workflow this service ships through.

In-repo sources of truth: `docs/signup/` (restore plan, go-live runbook,
follow-ups), `docs/website-audit/PRICING_MODEL.md`,
`docs/enterprise-parity-research/` (feature packages), and `CLAUDE.md`.
