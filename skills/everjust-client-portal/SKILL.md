---
name: everjust-client-portal
description: Operate the everjust.app CLIENT PORTAL (the /my/* self-service frontend) as an agent — grant a customer login access to their portal (portal.wizard / portal.wizard.user.action_grant_access, which creates a res.users with share=True in group_portal and emails a set-password invite), or SHARE a single backend record via a signed access-token link (portal.share / get_portal_url / _get_share_url on portal.mixin) with no login at all. Use when the task is "invite <customer> to the portal", "give <contact> portal access", "send <partner> a link to view this invoice/quote/task", "why can a portal user see X but not Y", or minting a shareable /my URL. This is Odoo's portal stack (portal.mixin, portal.wizard(.user), portal.share, res.users share=True) — NOT internal-user provisioning, NOT the public marketing website, NOT the everjust.mail webmail. Odoo 19: res.users groups are group_ids, NOT groups_id. Cross-refs [[everjust-platform]], [[everjust-agent-mcp]], [[everjust-mail-ops]].
---

# EVERJUST Client Portal — Agent Skill

Operate the **client portal**: the `/my/*` self-service frontend where a customer logs in
(or follows a signed link) to see *their own* records — quotes, invoices, sales orders,
projects, tasks, tickets, signatures. Two distinct capabilities, don't conflate them:

1. **Grant portal access** — turn a contact (`res.partner`) into a login user with
   `share=True` in `base.group_portal`, and email them a set-password invite. They then
   sign in at `https://<tenant>.everjust.app/my` and browse everything linked to their
   partner. This is `portal.wizard` → `portal.wizard.user.action_grant_access`.
2. **Share one record** — send a specific partner a link to *one* backend record, gated by
   an `access_token` (bypasses their rights for that record only) or a signup token — with
   **no login required**. This is `portal.share` wizard, or directly
   `record.get_portal_url()` / `record._get_share_url(...)` on any `portal.mixin` model.

You drive all of this through the platform's Odoo MCP (`env[...]`, `search`, `create`,
`call`) — see [[everjust-agent-mcp]] for opening the session against the right tenant. For
the tenancy model and what a workspace is for, see [[everjust-platform]].

## When to use this skill

- **Invite a customer to the portal** — "give jane@acme.com portal access", "let this
  contact log in and see their invoices/projects", "onboard the client to their portal".
- **Re-invite / revoke** — resend the set-password mail, or archive a portal login.
- **Share a single record by link** — "send this invoice/quote/SO/task to the customer",
  "generate a shareable link for record X" — with or without them having a login.
- **Explain portal visibility** — "why can this portal user see the invoice but not the
  contact form", "what will they see when they log in".
- **Audit portal users** — list `res.users` with `share=True`, see who has access to what.

## When NOT to use this skill — stop if the task is really:

- **Provisioning an INTERNAL (staff) user** — an employee who works *in* `/odoo`, not a
  customer on `/my`. That is `base.group_user` (internal), not `group_portal`, and is
  platform/admin work. A portal user has `share=True`; an internal user has `share=False`.
- **The public marketing website** (`website_connectdomain`, `website_tcsw`, the `/`
  homepage) — that is anonymous QWeb pages, not the authenticated `/my` portal. See the
  website tools in [[everjust-agent-mcp]] / [[everjust-platform]].
- **The everjust.mail webmail** (`everjust.mail.*`) — a separate product; sending the
  invite email uses Odoo's own mail templates, not that stack. See [[everjust-mail-ops]].
- **e-signature request flow** — `sign.request` has its own signer-invite path; portal
  users *view* signed docs but requesting a signature is [[everjust-sign]].
- **Granting admin / secret config** — hard-blocked by the MCP anyway.

---

## Key models (real `_name` + fields, Odoo 19, verified live)

| Model | Kind | Role |
|---|---|---|
| `portal.mixin` | AbstractModel | Mixed into every "portal-shareable" business model (sale.order, account.move, project.task, project.project, etc.). Gives them `access_url`, `access_token`, `access_warning`, and the URL builders. **A model is shareable iff it inherits this.** |
| `portal.wizard` | TransientModel | The "Grant portal access" batch wizard. Holds `partner_ids` and an auto-computed `user_ids` (one `portal.wizard.user` per contact) + a `welcome_message`. |
| `portal.wizard.user` | TransientModel | **The per-contact access action lives here.** One row = one partner's portal-access decision. Methods: `action_grant_access`, `action_revoke_access`, `action_invite_again`. |
| `portal.share` | TransientModel | The "Share" wizard — email a signed link to a specific record to `partner_ids`. Computes `share_link` from the record's `_get_share_url`. |
| `res.users` | Model | The login. A **portal user = `share=True` + membership in `base.group_portal`**. Odoo 19 groups field is **`group_ids`** (m2m → `res.groups`) — **NOT `groups_id`** (that name was removed). |
| `res.partner` | Model | The contact behind the user. `_get_frontend_writable_fields()` defines what a portal user may edit on their own contact (name, phone, email, address, vat, company_name). |

### `portal.mixin` — the fields/methods you actually call
- `access_url` (Char, computed per model) — the record's own `/my/...` path, e.g.
  `/my/invoices/<id>`. Default `'#'`; each concrete model overrides `_compute_access_url`.
- `access_token` (Char) — the per-record security token. Lazily minted by
  `_portal_ensure_token()` (writes a `uuid4` on first use). Presence of a valid
  `?access_token=` in a URL **bypasses the recipient's ACLs for that one record**.
- `get_portal_url(suffix=, report_type=, download=, query_string=, anchor=)` → the full
  `access_url + '?access_token=<token>...'` string. **This is the simplest way to mint a
  shareable link.** Ensures the token exists as a side effect.
- `_get_share_url(redirect=False, signup_partner=False, pid=None, share_token=True)` →
  lower-level; with `redirect=True` returns a `/mail/view?model=..&res_id=..&access_token=..`
  URL (mail/view re-checks access and redirects to the portal page). `pid=<partner.id>`
  adds a signed `hash` so that partner is auto-authenticated in the record's chatter.
- `action_share()` → returns the `ir.actions.act_window` that opens the `portal.share`
  wizard for the current `active_id`/`active_model` (the backend "Share" button).

### `portal.wizard.user` — the grant/revoke engine (read this before granting)
- Fields: `partner_id` (the contact), `email`, `user_id` (existing login, if any),
  `is_portal` (bool: already a portal user), `is_internal` (bool: is a staff user — you
  must NOT downgrade these), `email_state` (`ok` | `ko` invalid | `exist` email already a
  user).
- `action_grant_access()` — the whole grant, idempotent-guarded:
  1. asserts `email_state != ko/exist`; raises if already `is_portal`/`is_internal`;
  2. creates a `res.users` from template if the partner has none (`_create_user`, login =
     normalized email);
  3. `user.write({'active': True, 'group_ids': [(4, group_portal.id), (3, group_public.id)]})`
     — **note `group_ids`** (adds portal group, removes public group);
  4. `partner.signup_prepare()` (mints a signup token) and sends the
     `auth_signup.portal_set_password_email` template with `force_send=True`.
- `action_revoke_access()` — archives the login (`active=False`) and clears the signup
  token. Keeps them in `group_portal` (never re-adds public). Only touches users where
  `_is_portal()` is true.
- `action_invite_again()` — just re-sends the set-password email (requires `is_portal`).

---

## Recipes

Route each through the Odoo MCP (open `env` on the tenant DB — see [[everjust-agent-mcp]]).
The connected user needs the rights to create users / send the invite (typically an
admin/Settings role); a plain user's key will `AccessError`.

### 1. Grant a contact portal access (the invite) — the canonical path

**Do NOT hand-roll a `res.users`.** Go through `portal.wizard` so the group swap, signup
token, and invite email all fire correctly. Steps: create the wizard seeded with the
partner → find the auto-created `portal.wizard.user` row → call `action_grant_access` on it.

```python
partner = env["res.partner"].search([("email", "=", "jane@acme.com")], limit=1)

# Create the wizard; user_ids is auto-computed (one portal.wizard.user per contact).
wiz = env["portal.wizard"].create({
    "partner_ids": [(6, 0, partner.ids)],
    "welcome_message": "Welcome to your Acme portal — your invoices and projects live here.",
})
pwu = wiz.user_ids.filtered(lambda u: u.partner_id.id == partner.id)

# Guard rails the wizard checks for you:
pwu.read(["email_state", "is_portal", "is_internal"])
#   email_state == "ko"    -> invalid email, fix partner.email first
#   email_state == "exist" -> that email is already a login (see pitfall 4)
#   is_internal == True    -> STAFF user; do not grant portal, stop
#   is_portal   == True    -> already has access; use action_invite_again instead

pwu.action_grant_access()   # via MCP `call`, confirm:true (mutating)
```
Over MCP: `create(model="portal.wizard", values={...})`, then
`call(model="portal.wizard.user", method="action_grant_access", ids=[<pwu_id>], confirm=true)`.
The customer gets a set-password email and, after choosing a password, logs in at
`https://<tenant>.everjust.app/my`. The return value is a wizard-refresh action — ignore it;
verify success by reading the user (recipe 4), not by the return.

### 2. Re-invite or revoke

```python
# Resend the set-password email (they never clicked, token expired, etc.)
pwu.action_invite_again()      # requires is_portal == True

# Revoke: archive the login (active=False). Reversible via grant again.
pwu.action_revoke_access()     # requires is_portal == True; leaves them in group_portal
```
Both are mutating → `confirm:true` over MCP. Revoke does NOT delete the user or the partner;
it archives the login and voids the signup token. To re-enable, run recipe 1 again (it
flips `active` back to True).

### 3. Share ONE record by link — no login required

The fastest mint is `get_portal_url()` on any record whose model inherits `portal.mixin`
(sale.order, account.move, project.task, project.project, purchase.order, …). It ensures the
token and returns the token'd path; prepend the base URL for an absolute link.

```python
inv = env["account.move"].browse(8891)            # a shareable record
path = inv.get_portal_url()                         # '/my/invoices/8891?access_token=<uuid>'
full = inv.get_base_url() + path                    # absolute, https://<tenant>.everjust.app/...
# Variants: inv.get_portal_url(report_type="pdf", download=True) for a direct PDF download.
```
Over MCP: `call(model="account.move", method="get_portal_url", ids=[8891], confirm=true)`
(it *writes* the access_token on first call, hence confirm). Anyone with this URL can view
that one record without logging in — treat the link as a bearer secret.

To also **email** it (with a proper invite body + chatter authentication), use the
`portal.share` wizard instead of pasting the raw link:

```python
share = env["portal.share"].create({
    "res_model": "account.move",
    "res_id": 8891,
    "partner_ids": [(6, 0, partner.ids)],
    "note": "Here is invoice INV/2026/0042 — click to view and pay.",
})
share.action_send_mail()      # confirm:true — posts the portal.portal_share_template mail
```
`action_send_mail` is smart: partners who are already users (or when the record already has
an `access_token`) get the common public link; partners with no login get an individualized
**signup** link (`_get_signup_url_for_action`) so they can self-register on click. It never
creates a login itself — that's recipe 1.

### 4. Audit / find portal users (who has access?)

```python
# All portal logins on this tenant:
env["res.users"].search_read(
    [("share", "=", True), ("active", "=", True)],
    ["login", "partner_id", "group_ids", "login_date"])

# Is THIS partner a portal user? (the reliable check — via the user, not the wizard)
u = partner.with_context(active_test=False).user_ids
u.read(["login", "active", "share"])            # share==True & active==True & group_portal in group_ids
group_portal = env.ref("base.group_portal")
u._is_portal()                                   # True iff a portal (not internal/public) user
```
`share=True` is the definitive marker of a portal (external) user. Filtering on
`group_ids` uses the **Odoo-19 name** (`[("group_ids", "in", group_portal.id)]`), not
`groups_id`.

### 5. Understand what a portal user will see

A logged-in portal user (`share=True`) sees only `/my/*` — never `/odoo`. On `/my/home`
they see counters for the document types linked to *their* partner. Visibility is enforced
by each business model's **portal record rule** (e.g. "portal users see account.move where
`partner_id` = their commercial partner"), NOT by anything you set here. So:
- Granting access ≠ choosing what they see. They see whatever the installed apps'
  portal rules expose for their partner — invoices if Accounting is installed, tasks/
  projects if Project is, etc. There is no per-record allow-list on the grant.
- To let them see a record their rule would NOT normally expose, **share it individually**
  (recipe 3) — the `access_token` bypasses the rule for that one record.
- Editable fields on their own contact are limited to
  `res.partner._get_frontend_writable_fields()` (name, phone, email, address, vat,
  company_name). They cannot edit arbitrary partner fields from `/my/account`.

### 6. Check whether a model is even shareable

```python
model = env["project.task"]
isinstance(model, env.registry["portal.mixin"])   # True -> has access_url/token, shareable
# or: "access_token" in env["project.task"]._fields
```
If a model does **not** inherit `portal.mixin`, it has no `access_url`/`get_portal_url`
and cannot be shared via a portal link — don't try; there's no portal page for it.

---

## Pitfalls

1. **Portal user vs internal user = `share`.** `share=True` → external/portal (billed as
   free portal user, sees only `/my`). `share=False` → internal staff (consumes a paid
   seat, works in `/odoo`). `portal.wizard.user.is_internal` guards this — **never run
   `action_grant_access` on a contact whose `is_internal` is True**; you'd be mishandling a
   staff account. Granting portal to a brand-new contact is the only clean path.

2. **Odoo 19 renamed the groups field to `group_ids`.** On `res.users` (and in
   `action_grant_access`) it is `group_ids`, a m2m to `res.groups`. The old `groups_id`
   name is **gone** — using it in a `search` domain, `write`, or `describe`-based code is a
   hard error. Same everywhere you touch user groups on this platform.

3. **Don't create the `res.users` by hand.** `create(model="res.users", {...share:True...})`
   skips `signup_prepare()`, the public→portal group swap `[(4,portal),(3,public)]`, and the
   set-password email — leaving a login the customer can't actually activate. Always go
   through `portal.wizard` → `action_grant_access`.

4. **`email_state == "exist"` blocks the grant.** If the contact's email already matches an
   existing `res.users.login`, the wizard refuses (a user with that email exists). Resolve
   the collision first: link the partner to that existing user, or fix the email — don't
   loop retrying `action_grant_access`.

5. **`access_token` is a bearer secret.** A `?access_token=<uuid>` link **bypasses the
   recipient's ACLs for that record** — anyone holding the URL can view it, logged in or
   not. Share deliberately; prefer `portal.share`'s emailed link (auditable in chatter)
   over pasting a raw `get_portal_url()` string into an untrusted channel. To invalidate,
   clear/rotate the record's `access_token`.

6. **Granting access is not choosing visibility.** What a portal user sees is decided by
   each app's portal **record rules** against their `partner_id`, not by the grant. If they
   "can't see" an expected record, the fix is the model's portal rule / the record's
   `partner_id`, or an individual share (recipe 3) — not re-granting portal access.

7. **The invite email rides Odoo's own mail, and needs a working mail server.**
   `_send_email` uses `auth_signup.portal_set_password_email` with `force_send=True`. If the
   tenant has no configured outgoing `ir.mail_server`, the grant still flips the user active
   but the customer never gets the link — check the mail queue / server, then
   `action_invite_again`. (This is Odoo mail, distinct from the [[everjust-mail-ops]]
   webmail stack.)

8. **`portal.share` sends signup links only when `auth_signup.invitation_scope == 'b2c'`.**
   `action_send_mail` gives non-users an individualized **signup** link only if free signup
   is enabled (this tenant: `b2c`, enabled). Otherwise even non-users just get the plain
   token link and cannot self-register — they'd need an explicit grant (recipe 1).

9. **Everything is per-tenant / per-company.** Portal users, partners, and record rules are
   scoped to the tenant DB and its company. Confirm you're on the right
   `https://<tenant>.everjust.app/mcp` and `env.company` before granting — see
   [[everjust-agent-mcp]].

10. **Branding is cosmetic, not functional.** `everjust_brand_portal` only rewrites the
    portal "Powered by" footer → EVERJUST.APP and repoints the API-keys docs link. It adds
    no fields or logic — don't look there for portal *behavior*; the mechanics are all in
    core `portal`.

## See also
- [[everjust-agent-mcp]] — how to open an `env`/`call` against the right tenant over MCP.
- [[everjust-platform]] — tenancy model, portal-vs-internal seat model, what a workspace is.
- [[everjust-mail-ops]] — the native webmail stack (separate from the invite email).
- [[everjust-sign]] — requesting signatures from portal/external signers.
- [[everjust-crm-sales]] — the sale.order/account.move records customers most often view in `/my`.
