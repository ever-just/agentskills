---
name: everjust-quickbooks
description: Operate the QuickBooks Online accounting connector of an everjust.app tenant (connect via OAuth, pull the chart of accounts QBO→Odoo, push a posted customer invoice Odoo→QBO, check connection/reconnect health) via the Odoo MCP/ORM. Use when the task is to sync accounts from QuickBooks, push an Odoo invoice to QuickBooks, diagnose a dead/expiring QBO connection, or reason about which Intuit env (sandbox vs production) a tenant is on. This is the everjust_quickbooks stack (custom account extension); the OAuth token lifecycle is the whole game. IMPORTANT: this module is NOT installed on any tenant yet — it lives in the addon tree, so treat every recipe as "once it is installed." CRITICAL: refresh tokens ROTATE and are committed immediately under a Postgres advisory lock — NEVER mutate qbo tokens outside qbo.client helpers, and always check needs_reconnect(). Default env is sandbox. Cross-references [[everjust-platform]] and [[everjust-agent-mcp]]; sibling of [[everjust-mail-ops]] and [[everjust-sms]].
---

# EVERJUST QuickBooks — Agent Skill

Operate the **QuickBooks Online accounting connector** of an everjust.app tenant as an
agent: connect a tenant's Odoo to its Intuit QBO company via OAuth2, pull the QBO chart
of accounts into Odoo, push a posted Odoo customer invoice into QBO, and reason about
connection health — all through the Odoo MCP / ORM (`search`, `get`/`read`, `create`,
`update`/`write`, `call` a model method; see [[everjust-agent-mcp]] for opening the
session against the right tenant DB). The everjust-specific addon is
**`everjust_quickbooks`** (source:
`/Users/cloudaistudio/Desktop/ww.everjust.app/addons/everjust_quickbooks/`). It depends
on stock Odoo **`account`**.

> **NOT INSTALLED ANYWHERE YET.** As of this writing `everjust_quickbooks` is present in
> the container addons path (`/mnt/extra-addons/everjust_quickbooks`) but is in state
> **`uninstalled`** on BOTH `connectdomain` and `tcstartupweek`. Its hard dependency
> `account` is also `uninstalled` on both — so installing the connector pulls the whole
> Accounting app in with it. **Every recipe below assumes the module has been installed
> on the target tenant.** If a call raises "model `qbo.client` does not exist" or
> "unknown model," the module is simply not installed on that DB — that is expected,
> not a bug. Do not attempt to install it or install `account` as a side effect of a
> sync task; that is a deliberate platform-ops decision, see [[everjust-platform]].

## When to use this skill

- **Connect a tenant to QuickBooks** — kick off / finish the OAuth2 authorize flow and
  confirm the realm is linked. (The actual browser hop is human-driven; see below.)
- **Pull the chart of accounts** — QBO `Account` → Odoo `account.account`, idempotent.
- **Push a customer invoice** — a *posted* Odoo `out_invoice` → a QBO `Invoice`
  (creating the QBO `Customer` first if needed).
- **Diagnose a QBO connection** — is it connected? does it need reconnect (revoked or
  near-expiry refresh token)? which Intuit environment is it on?
- **Reason about tokens** — understand why a sync 401'd, refreshed, or demanded a
  reconnect — WITHOUT ever hand-editing a token param.

**Do NOT use this skill for**, and stop if the task is really:
- **Installing the module / the Accounting app** — that is a platform-ops decision
  ([[everjust-platform]]), not a sync task. This skill assumes it's installed.
- **Editing QBO tokens by hand** to "fix" a connection — the tokens rotate under a lock
  and commit immediately; a raw `set_param` will silently break the connection (see
  Pitfalls). The only supported repair is re-running the OAuth flow.
- **General Odoo Accounting** (reconciliation, journals, taxes) — that's stock `account`,
  not this connector. This module only adds `qbo_id` mirrors + sync/push methods.
- **Bulk historical migration** — the invoice push is lean v1 (one `SalesItemLine` per
  line, no per-product item mapping, no tax-code mapping); it is not a full ledger sync.

You reach the ORM through the platform's Odoo MCP tools — see [[everjust-agent-mcp]] for
opening an `env` against the right tenant DB, running a shell, or calling a model method.
Every recipe below is expressed as ORM/method calls you route through that MCP.

## Architecture (the model map)

One tenant DB per customer. Everything QBO is per-tenant, and — crucially — **all QBO
credentials and connection state live in `ir.config_parameter` under the
`everjust_quickbooks.*` namespace** (mirroring `everjust_phone` / `everjust_ringover`).
DB-per-tenant isolation therefore gives secret isolation for free: there is one shared
EVERJUST Intuit *app* (client id/secret), but each tenant DB holds its own `realm_id`
and its own tokens.

| Model | Kind | Role |
|---|---|---|
| `qbo.client` | **AbstractModel** (stateless helper) | The whole OAuth2 + REST engine. Reads/writes the `everjust_quickbooks.*` config params, mints/refreshes/rotates tokens, and exposes `query()` / `post_object()` against the Intuit Accounting API. **This is the ONLY thing allowed to touch tokens.** |
| `account.account` | inherits stock | + `qbo_id` (Char, indexed, readonly). Holds the CoA-sync methods; `qbo_id` makes the pull idempotent. |
| `account.move` | inherits stock | + `qbo_id` (Char, indexed, readonly). Holds the invoice-push methods; `qbo_id` on the move makes re-push an update, not a duplicate. |
| `res.partner` | inherits stock | + `qbo_id` (Char, indexed, readonly). Caches the QBO `Customer` Id so an invoice push doesn't re-create the customer. |
| `qbo.account.sync.wizard` | TransientModel | The "Pull Chart of Accounts" wizard; thin wrapper over `account.account._qbo_sync_chart_of_accounts()`. |
| `res.config.settings` | inherits stock | Settings surface: app creds, environment, redirect URI, and the **computed** `qbo_is_connected` / `qbo_reconnect_required` banners. |

### The `everjust_quickbooks.*` config params (state lives here, NOT on a model)

Written by the OAuth callback and the token helpers; seeded empty by `data/config_params.xml`.

| Param | Written by | Meaning |
|---|---|---|
| `client_id`, `client_secret` | admin (Settings) | The shared EVERJUST Intuit app creds. |
| `environment` | admin (Settings) | `sandbox` (**default**) or `production`. Selects API base + discovery. |
| `redirect_uri` | admin (Settings) | Exact HTTPS callback registered in the Intuit app, e.g. `https://<tenant>.everjust.app/quickbooks/callback`. |
| `realm_id` | OAuth callback | The tenant's QBO **company** Id. Also the advisory-lock key seed. |
| `access_token` | `qbo.client._store_tokens` | ~1h bearer. **Never set by hand.** |
| `refresh_token` | `qbo.client._store_tokens` | Long-lived but **ROTATES on every refresh**. **Never set by hand.** |
| `token_expiry` | `_store_tokens` | ISO UTC access-token expiry (refreshed 120s early). |
| `refresh_token_expiry` | `_store_tokens` | ISO UTC of the refresh token's own rolling ~100-day expiry — drives the 7-day reconnect warning. |
| `reconnect_required` | `_perform_refresh` on `invalid_grant` | `"1"` = the refresh token was revoked; connection is dead until re-OAuth. Cleared on a healthy `_store_tokens`. |

### The OAuth flow (human-in-the-loop; you don't drive the browser)

Two `auth='user'` controller routes, guarded by an HMAC-over-nonce state:
`/quickbooks/connect` (builds the Intuit authorize URL, 302s the admin to Intuit) and
`/quickbooks/callback` (verifies state, exchanges the code, persists `realm_id` + tokens).
From Settings the button `res.config.settings.action_qbo_connect()` saves creds then
redirects to `/quickbooks/connect`. **As an agent you can't complete this** — it needs a
logged-in human to authorize at Intuit. Your job is to (a) confirm creds/redirect-URI are
set, (b) hand the admin the connect URL, (c) after they return, verify with
`qbo.client.is_connected()`.

### The token lifecycle — the ONE thing to get right

`qbo.client` is the single writer of the token params, and it protects the rotating
refresh token aggressively. Read these before touching anything QBO:

- **`_valid_access_token()`** — returns a live access token, refreshing transparently if
  `_token_expired()`. Everything (`query`, `post_object`, `get_client`, `_headers`) goes
  through it.
- **`_lock_for_refresh()`** — takes a **per-tenant Postgres advisory xact lock**
  (`pg_advisory_xact_lock`, key = `crc32("qbo_refresh:" + realm_id)`) so two workers can't
  both spend the SAME rotating refresh token (Intuit rotation would invalidate it and one
  side would persist a dead token). Then re-reads past the ORM cache to see a concurrent
  winner's committed token.
- **`_store_tokens()`** — writes the new access + rotated refresh token and **commits
  immediately** (`self.env.cr.commit()`, skipped only in test mode) so a later failure in
  the same request can never lose the rotated refresh token. It also clears
  `reconnect_required` on success.
- **`_request()`** — HTTP with a **one-shot 401 refresh-and-retry** (`_force_refresh`),
  because Intuit can invalidate an access token before its local 1h expiry.
- **`needs_reconnect()`** — True if `reconnect_required == "1"` OR the refresh token's
  rolling expiry is within 7 days. **This is the health check you watch.**
- **`cron_refresh_token()`** — a scheduled ~12h best-effort refresh (`ir.cron`
  "QuickBooks: Refresh Access Token", active) so the connection never goes cold.

The takeaway: **you never read, write, or "refresh" a token yourself.** You call a
high-level method (`query`, `post_object`, `is_connected`, `needs_reconnect`) and let
`qbo.client` do the locking + rotation + commit.

## Recipes

Route each through the Odoo MCP (open an `env` on the tenant DB — see
[[everjust-agent-mcp]]). `qbo.client` is an AbstractModel, so call its `@api.model`
methods on `env["qbo.client"]` directly (no record needed).

### Check connection health (always do this before a sync/push)

```python
qbo = env["qbo.client"]
qbo.is_connected()        # True once realm_id + refresh_token both present (OAuth done)
qbo.needs_reconnect()     # True if refresh token revoked OR within 7 days of expiry
qbo._environment()        # "sandbox" (default) or "production" — CONFIRM before writing data
# The read-only state, straight from the params (never write these):
icp = env["ir.config_parameter"].sudo()
{k: icp.get_param("everjust_quickbooks.%s" % k) for k in
 ("realm_id", "environment", "token_expiry", "refresh_token_expiry", "reconnect_required")}
```
Gate every operation on this: if `not is_connected()` → the tenant hasn't OAuth'd; if
`needs_reconnect()` → **stop and ask a human to reconnect** (a sync will fail or is about
to). Do NOT try to "wake" the connection by editing params. And always confirm
`_environment()` — a sandbox connection pushing what you think is production data (or vice
versa) is a silent data-integrity trap.

### Start / confirm the OAuth connect (agent preps, human authorizes)

```python
qbo = env["qbo.client"]
# 1) Confirm the app creds + redirect URI are set (else the connect route bounces):
for k in ("client_id", "client_secret", "redirect_uri"):
    assert qbo._get_param(k), "Missing everjust_quickbooks.%s — set it in Settings" % k
# 2) The admin must click "Connect QuickBooks" in Settings, or open the connect URL,
#    which 302s to Intuit for authorization:
connect_url = "https://<tenant-domain>.everjust.app/quickbooks/connect"
# 3) After they return from Intuit, VERIFY it took (callback persisted realm + tokens):
qbo.is_connected()        # -> True, and:
qbo._get_param("realm_id")   # the linked QBO company
```
You cannot complete step 2 as an agent (it needs an interactive Intuit login). Never
fabricate `realm_id`/tokens to "simulate" a connection — an invalid token set will 401
every call and can flip `reconnect_required`.

### Pull the chart of accounts (QBO → Odoo `account.account`)

```python
# Idempotent on account.account.qbo_id, then falls back to matching by code.
created, updated = env["account.account"]._qbo_sync_chart_of_accounts()
# Or the button/server-action entry point (returns a UI notification dict):
env["account.account"].action_qbo_pull_chart_of_accounts()
# Or drive the wizard the same way a user would:
w = env["qbo.account.sync.wizard"].create({})
w.action_pull(); w.result_message
# Inspect what landed:
env["account.account"].search_read(
    [("qbo_id", "!=", False)], ["code", "name", "account_type", "qbo_id"])
```
The sync **paginates** QBO (`STARTPOSITION`/`MAXRESULTS 1000`) so accounts past the first
1000 aren't dropped, maps QBO `AccountType`/`AccountSubType` → Odoo `account_type`,
sanitizes `AcctNum` to Odoo's `[A-Za-z0-9.]` code charset (synthesizing `QBO<id>` if
empty), and isolates each upsert in a **savepoint** so one bad record can't abort the
batch. It matches by `qbo_id` then `code` — deliberately **no name fallback** (a name
match would fuse onto an unrelated localization account). This is a one-way QBO→Odoo pull;
it does not push Odoo accounts back.

### Push a posted customer invoice (Odoo → QBO `Invoice`)

```python
inv = env["account.move"].search(
    [("move_type", "=", "out_invoice"), ("state", "=", "posted")], limit=1)
inv.action_qbo_push_invoice()   # per-move guarded; posts a chatter note with the QBO Id
inv.read(["name", "qbo_id"])    # qbo_id set -> re-push UPDATES (sparse) rather than dups
```
Guards: it refuses anything that isn't a **posted `out_invoice`** (raises `UserError`).
It first ensures the QBO `Customer` exists via
`inv.partner_id.commercial_partner_id._qbo_ensure_customer()` (which reuses a QBO customer
with the same `DisplayName`, else creates one and caches `res.partner.qbo_id`), then builds
a lean payload — one `SalesItemLine` per product line (`Amount = price_subtotal`), no
per-product `ItemRef` and no tax mapping (v1 TODOs). If `move.qbo_id` is already set it
sends `sparse=True` to update in place. Bulk-push a set the same way:
`env["account.move"].browse(ids).action_qbo_push_invoice()` (also wired as an invoice-list
cog action). A push that returns no Id posts no chatter and increments nothing — read
`move.qbo_id` to confirm it actually landed.

### Run a raw QBO query / entity write (when you need the API directly)

```python
qbo = env["qbo.client"]
# SQL-like read (paginate yourself past 1000 rows, like the CoA sync does):
qbo.query("SELECT * FROM Account STARTPOSITION 1 MAXRESULTS 1000").get("Account", [])
qbo.query("SELECT * FROM Customer WHERE DisplayName = 'Acme'").get("Customer", [])
# Entity create/update (entity name lowercase; response key is Capitalized):
qbo.post_object("customer", {"DisplayName": "Acme Co"})
qbo.post_object("invoice", {"CustomerRef": {"value": "58"}, "Line": [...]})
```
Both go through `_request` → `_valid_access_token`, so the token is refreshed/rotated and
the 401-retry happens for you. Use these only for things the two shipped syncs don't cover;
prefer the higher-level `_qbo_sync_chart_of_accounts` / `action_qbo_push_invoice` when they
fit, so `qbo_id` bookkeeping stays correct.

## Pitfalls

1. **NEVER mutate a QBO token param by hand.** `access_token` / `refresh_token` /
   `token_expiry` / `refresh_token_expiry` / `reconnect_required` are owned exclusively by
   `qbo.client._store_tokens`. The refresh token **rotates on every refresh** and is
   committed the instant Intuit hands over a new one, guarded by a per-tenant
   `pg_advisory_xact_lock`. A raw `set_param("everjust_quickbooks.refresh_token", ...)`
   bypasses the lock and the rotation bookkeeping — you'll spend a stale token, Intuit
   invalidates it, and the connection dies. The only supported repair for a broken
   connection is re-running the OAuth flow.

2. **Always check `needs_reconnect()` — and honor it.** It's True when a prior refresh got
   `invalid_grant` (token revoked → `reconnect_required="1"`) OR the refresh token's rolling
   ~100-day expiry is within 7 days. If it's True, syncs are failing or about to; **stop
   and get a human to reconnect** rather than retrying. The Settings banner
   (`qbo_reconnect_required`) is just this method surfaced.

3. **Default environment is `sandbox`.** `_environment()` falls back to `sandbox` for any
   unrecognized value, and the seed param is `sandbox`. Before pushing invoices or trusting
   pulled accounts, confirm `_environment()` — pushing real invoices into a sandbox company
   (or sandbox test data into production) is a silent, expensive mistake. Sandbox and
   production also hit different API bases and are different Intuit companies entirely.

4. **`is_connected()` ≠ "healthy."** It only checks `realm_id` + `refresh_token` are
   *present*. The refresh token can still be revoked/expired. Pair it with
   `needs_reconnect()`, and remember `_request` does a one-shot 401 refresh-retry — a
   single 401 self-heals, a persistent failure means reconnect.

5. **This module is UNINSTALLED on every tenant, and so is `account`.** A missing-model
   error is the expected state, not a bug. Installing the connector drags the full stock
   Accounting app in as a dependency — that's a platform-ops call ([[everjust-platform]]),
   not something to trigger from a sync task.

6. **The Python libs are lazy-imported.** `intuit-oauth` (`intuitlib`) and
   `python-quickbooks` are imported *inside* methods, not declared in
   `external_dependencies` (Odoo 19 would block install on a missing dep). If they're not
   baked into the image, connect/refresh/sync raise a clear `UserError` ("connector library
   is not installed … add it to the application image") at call time — that's an image
   problem, fix it in the Dockerfile, not by editing params.

7. **CoA pull is one-way and matches only on `qbo_id`/`code`.** It never pushes Odoo
   accounts to QBO and deliberately has **no name-based match** — don't expect it to
   reconcile accounts that differ in both `qbo_id` and `code`. It synthesizes a `QBO<id>`
   code when QBO has no usable `AcctNum`.

8. **Invoice push is intentionally lean (v1).** One `SalesItemLine` per product line at
   `price_subtotal`; **no** per-product `ItemRef`, **no** tax-code mapping, only posted
   `out_invoice`. Don't treat it as a faithful full-fidelity export or a two-way ledger
   sync. `DocNumber` is truncated to 21 chars.

9. **Everything is per-tenant / per-`realm_id`.** Tokens, realm, and the advisory-lock key
   are all tenant-scoped. When operating multi-tenant, confirm you're on the right tenant DB
   before any QBO call (see [[everjust-agent-mcp]]) — there is no cross-tenant QBO state.

10. **Provider exceptions embed the raw token body — never echo them.** `_perform_refresh`
    deliberately logs *type/status/tid*, not the exception string, because Intuit's error
    string embeds the OAuth token-endpoint response body. If you surface refresh errors,
    keep that discipline: don't interpolate the raw provider exception into logs or UI.
