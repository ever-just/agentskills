---
name: everjust-platform
description: Operating rules for an agent working inside ANY everjust.app tenant — a heavily-customized multi-tenant Odoo 19 CE fork (NOT stock Odoo), one Postgres DB per tenant. Load this whenever you are connected to a *.everjust.app instance (usually via the everjust_agent_mcp MCP server at https://<tenant>.everjust.app/mcp) and about to read or mutate business data: mail, contacts, users, telephony/SMS, QuickBooks, documents, appointments. It tells you the platform's non-standard shape and the invariants you must not break (one-DB-per-tenant isolation, /odoo debrand, custom everjust.mail.* stack, send gating, per-tenant secrets, sudo/ACL boundaries, Odoo-19 API surface). Read BEFORE your first non-trivial call, not after something breaks.
---

# everjust.app platform — operating rules

## Overview / when to use

You are operating inside a live **everjust.app** tenant. This is **not stock Odoo** — it is a heavily-customized multi-tenant **Odoo 19 CE** fork with a from-scratch mail platform, per-tenant provider swaps, and aggressive debranding. If you treat it like vanilla Odoo you will call models that don't exist, write to the wrong tables, leak secrets, or silently fail to send mail.

**Use this skill the moment you connect to `*.everjust.app`** — before your first read that matters and *always* before any create/update/delete/call. It is the rules layer: the platform's non-standard shape + a numbered checklist of invariants with the *why*. It does not duplicate deep how-tos that belong in provider-specific skills (see cross-references at the end).

Almost every everjust.app op you run goes through **`everjust_agent_mcp`** — an Odoo addon that serves MCP at `https://<tenant>.everjust.app/mcp`. Auth is an Odoo **API key as Bearer**, and the server **runs AS that user**, so *every* operation is bounded by that user's Odoo role and ACLs. There is no "god mode" from the MCP side.

## Architecture — the non-standard shape

The four things that make this platform surprising:

1. **One Postgres DB == one tenant.** The DB you are connected to *is* the entire world you can see. There is no cross-tenant query, no shared table, no "other company's data." This is the hard isolation boundary. Installed modules, models, and capabilities **differ per tenant** — never assume a feature exists.
2. **Fully debranded.** Backend is at **`/odoo`** (not `/everjust`, not `/web` branding). Product name and version strings are faked. Do not infer "this is Odoo X.Y" from the UI — it's Odoo 19 under the hood.
3. **Native custom mail platform.** Email is a from-scratch stack on **`everjust.mail.*`** models — NOT Odoo Discuss, NOT `mail.mail`/IMAP. Drafts, threading, domains, sending, suppression all live in `everjust.mail.*`.
4. **Per-tenant provider swaps.** SMS, voice, accounting, documents, appointments are each backed by whichever integration that tenant installed (TextBee/Ringover/Twilio/QuickBooks/Nextcloud). Same "capability," different model and different secrets per tenant.

### The MCP toolset you actually have

All ops are role-bounded (run AS your Odoo user) and **every call is audited to `everjust.mcp.log`**.

| Tool | Signature | Notes |
|---|---|---|
| `list_models` | `(filter)` | Discover installed models. Start here on a new tenant. |
| `describe_model` | `(model)` | Returns fields **+ `your_access`** = `{read, create, write, unlink}` booleans for *your* user. Check this before assuming you can write. |
| `search` | `(model, domain, fields, limit, order)` | Odoo domain syntax. |
| `get` | `(model, ids, fields)` | Read by id. |
| `count` | `(model, domain)` | |
| `find` | `(model, name)` | `name_search` — fuzzy by display name. |
| `create` | `(model, values)` | ACL-gated. |
| `update` | `(model, ids, values)` | ACL-gated. |
| `delete` | `(model, ids, confirm)` | **`confirm: true` REQUIRED**, ACL-gated. |
| `call` | `(model, method, ids, args, kwargs, confirm)` | Escape hatch. Any **non-read** method needs **`confirm: true`**. |

**Two hard gates:** `delete` and `call` (non-read) require `confirm: true`. And Odoo ACLs still block anything your user's role can't do — *even when you set `confirm: true`*. Confirmation is not elevation.

## The rules — numbered checklist (the WHY matters)

**1. One DB = one tenant. Never assume cross-tenant data or that a capability exists.**
Before relying on a feature, `list_models(filter=...)` or read `ir_module_module` (`search('ir.module.module', [['state','=','installed']])`). Installed modules differ per tenant — the model you want may not be here. *Why: the DB is the isolation boundary; a missing module isn't an error, it's a different tenant.*

**2. The backend is `/odoo`, product identity is faked. Don't hardcode Odoo assumptions from the UI.**
It's Odoo 19 CE underneath regardless of what the branding says. *Why: debranding hides the engine; guessing version/paths from branding will be wrong.*

**3. Never grant `base.group_system` (Administrator) to a bot/agent user — and never assume you have it.**
On this fork, `everjust_admin_role` rewires `implied_ids` so **Administrator implies EVERY installed app**. Granting it to an automation user hands over the whole tenant. *Why: one checkbox = total access here; that blast radius is unacceptable for a bot.*

**4. Mail lives in `everjust.mail.*`, not `mail.mail`. Never write `mail.mail` directly.**
Drafts are `everjust.mail.entry` (not `mail.mail`). Threading is by **`thread_root`**, not Odoo's `message_id`/`parent_id` chains. Compose/read/reply through the `everjust.mail.*` models. *Why: `mail.mail` is bypassed by the native platform; writing it does nothing useful and corrupts nothing you can see.*

**5. Sending is hard-gated — read the `{queued, delivery}` result every time.**
To send, the `everjust.mail.domain` must be `verification_state='verified'` (`is_sendable`). Sends come back as one of:
- `blocked` — domain unverified (verify the domain first),
- `rate_limited` — >300 sends/account/hour,
- `suppressed` — recipient in `everjust.mail.suppression` or `mail.blacklist`,
- otherwise `queued`/delivered.
*Why: SES reputation is **shared fate across the whole account** — one careless blast degrades deliverability for every tenant. Always inspect the result; don't fire-and-forget.*

**6. Inbound mail is an HMAC bridge; the secret is server-held. Do not go looking for it.**
The per-tenant inbound secret is **not** an `ir.config_parameter` in prod. Don't try to read, reconstruct, or set it. *Why: it authenticates the inbound webhook; exposing it lets anyone inject mail.*

**7. Bot/automation users are tagged; never impersonate system or the human admin.**
An agent user has `is_everjust_agent=True` on `res.users` **and** `is_agent=True` on `res.partner` (this excludes it from billable seats). **Never** act as **uid 1 (`__system__`)** or **uid 2 (the human admin)**. *Why: those uids skip guardrails and pollute the audit trail; billing and attribution depend on the agent tags.*

**8. Integration secrets are per-tenant `ir.config_parameter`. Never read, echo, or log them.**
Namespaces: `everjust_phone.*`, `everjust.ringover_*`, `everjust_quickbooks.*`, `everjust_documents.*`, `everjust.sms_*`. *Why: these are live provider credentials; the MCP audits every call, and a leaked key compromises that tenant's Twilio/QuickBooks/Nextcloud/SES.*

**9. Telephony/SMS provider is swapped per tenant — detect which is installed first.**
SMS goes via **TextBee or Ringover** (`company.sms_provider` / `res.company`); voice via **Twilio** (`everjust_phone`) and/or **Ringover**. Check `ir.module.module` / `list_models` to see which is present before composing a call/SMS action. Ringover phone numbers are **integer E.164** (not strings). *Why: the "send SMS" you want lives in a different model per tenant; wrong model = failed op.*

**10. Never touch QuickBooks (`qbo.*`) refresh tokens outside `qbo.client` helpers.**
Refresh tokens **rotate under a Postgres advisory lock and commit immediately**. If you refresh or mutate them by hand (or via a raw `call`), you desync the token and force a full QuickBooks **reconnect**. Go through the `qbo.client` methods. Default environment is **sandbox**. *Why: the rotate-and-commit protocol is the only safe path; anything else breaks the OAuth chain irrecoverably.*

**11. Branding/onboarding hooks re-run on install AND every `-u`. Don't hand-edit swept records.**
`everjust_brand` debrand functions and onboarding data hooks fire on install and on every module update. Hand-edited `mail.template` bodies and mail views may be **re-swept** (overwritten). *Why: your manual edit is not durable; if a value must stick, it belongs in the module data, not a live edit — flag it rather than fight the sweep.*

**12. Optional subsystems have bespoke shapes.**
Where `everjust_documents` is installed, documents **physically live in Nextcloud over WebDAV** (the Odoo record is a pointer). Appointments use **`everjust_appointment` models, not Odoo `appointment.*`**. Dark mode is force-disabled. *Why: assuming `appointment.*` or a local attachment blob will miss the real data.*

**13. `ir.rule` does NOT constrain `sudo()`. Record rules only scope *person* visibility.**
Do not treat record rules as a safety net for automated writes; `sudo()` (and some `call` paths) bypass them. **Self-limit:** prefer **archive (`active=False`) over delete**, and **confirm irreversible actions** with the user before executing. *Why: the platform won't stop a destructive sudo op — your restraint is the guardrail.*

**14. This is Odoo 19 — use the current field names and API surface.**
`res.users` groups field is **`group_ids`** (NOT `groups_id`). The native external API is **`/json/2/<model>/<method>` with Bearer** auth. XML-RPC / JSON-RPC are **deprecated (removal targeted in Odoo 22)** — don't build on them. *Why: `groups_id` and the legacy RPC endpoints silently fail or are gone here.*

**15. Don't depend on `everjust.agent.*` models — the policy/runtime layer is designed, not built.**
There is no `everjust.agent.*` enforcement today. Your actual boundary is **your Odoo user's role + the MCP guardrails** (confirm gates + ACLs + audit log). *Why: coding against unbuilt models fails; the role/ACL boundary is what's real right now.*

## Recipes

### Orient on an unfamiliar tenant (do this first)
```
list_models(filter="everjust")          # see the custom stack that's installed
count('ir.module.module', [['state','=','installed']])
search('ir.module.module',
       [['state','=','installed']], fields=['name','shortdesc'], limit=200)
```
Then `describe_model('<model>')` on anything you plan to touch and read its `your_access` before writing.

### Check whether YOU can write before you try
```
describe_model('res.partner')   # inspect .your_access -> {read,create,write,unlink}
```
If `your_access.write` is false, the op will be ACL-blocked no matter what `confirm` you pass — stop and tell the user, don't retry with `confirm:true`.

### Send an email safely
```
# 1. Confirm the sending domain is verified / sendable
search('everjust.mail.domain', [['verification_state','=','verified']],
       fields=['name','is_sendable'])
# 2. Compose/send through everjust.mail.* (NOT mail.mail); drafts = everjust.mail.entry
# 3. ALWAYS read the returned {queued, delivery} status.
#    blocked -> verify domain; rate_limited -> back off (300/acct/hr);
#    suppressed -> recipient on everjust.mail.suppression or mail.blacklist.
```

### Find the SMS/voice capability for THIS tenant
```
list_models(filter="sms")        # which provider models exist?
get('res.company', [1], fields=['sms_provider'])   # TextBee vs Ringover
list_models(filter="phone")      # everjust_phone (Twilio) present?
```
Compose the send against whichever model is installed. Ringover numbers are integer E.164.

### Anything QuickBooks
Route through `qbo.client` helper methods via `call(...)`. **Never** `update` a `qbo.*` token field or hand-roll a refresh — you'll force a reconnect. Assume **sandbox** unless the tenant config says otherwise.

### An irreversible-looking change
Prefer archive over delete:
```
update('<model>', [id], {'active': False})     # reversible
# vs delete('<model>', [id], confirm=True)     # confirm the intent with the user first
```

## Pitfalls (common mistakes)

1. **Assuming stock Odoo.** Calling `mail.mail`, `appointment.*`, or `groups_id` — all wrong here. Use `everjust.mail.*`, `everjust_appointment.*`, `group_ids`.
2. **Fire-and-forget email.** Not reading the send result and never noticing `blocked`/`rate_limited`/`suppressed`. The account shares SES reputation — a silent failed blast still hurts every tenant.
3. **`confirm: true` == permission.** It's not. ACLs still apply; if your role can't do it, confirming won't help. Fix the role or stop.
4. **Reading/echoing secrets.** Dumping `ir.config_parameter` for `everjust_phone.*`, `everjust_quickbooks.*`, etc. into output or logs. Every MCP call is audited — treat those namespaces as untouchable.
5. **Hand-editing branded templates/views.** They get re-swept on the next `-u`. Your edit won't persist; flag the need for a data-level change instead.
6. **Granting or assuming Administrator.** `base.group_system` implies *every* app on this fork. Never on a bot user.
7. **Impersonating uid 1 or uid 2.** Skips guardrails, corrupts the audit trail, breaks billing/attribution. Act as the tagged agent user.
8. **Trusting `ir.rule` to stop automated writes.** It doesn't gate `sudo()`. Your own caution (archive-not-delete, confirm-first) is the real safety net.
9. **Refreshing QuickBooks tokens manually.** Rotates-and-commits under a lock; touching it out-of-band forces a full reconnect.
10. **Depending on `everjust.agent.*`.** Not built yet — your boundary is role + MCP guardrails.

## Related skills (don't duplicate — cross-reference)

- **`intelligence-dossier`**, **`client-discovery-osint`** — for research *about* the businesses in a tenant, once you've read their CRM data here.
- **`godaddy-api`** — DNS/domain records for everjust.app-hosted domains (separate system from `everjust.mail.domain` verification).
- **`mongodb-schema-audit`**, **`admin-dashboard-verification`** — sibling data-integrity workflows if you're auditing a tenant's data.
- **`deep-research`** — the fan-out research pipeline, when a tenant task expands into external investigation.
