---
name: everjust-telephony
description: Operate the "telephony" (voice + call-logging) app of an everjust.app Odoo tenant over the MCP/ORM — inspect/log phone calls, read recordings & voicemail transcriptions, place or trigger an outbound call, send a call-related SMS, and reason about which provider a tenant is on. Use when the task is a contact's or lead's call history, triggering/logging a call, a recording/transcription, or diagnosing why call logging isn't happening. The voice provider is SWAPPED per tenant: voip_oca (phone engine) is the base, with everjust_ringover (WebRTC softphone + REST sync → ringover.call) OR everjust_phone (Twilio Voice SDK → everjust.phone.call/.sms) on top — separate model stacks, not one; confirm provider + config first because several tenants have it installed but UNCONFIGURED. SECURITY: the everjust_phone Twilio webhooks are auth=none and unsigned. For texting-as-a-product use [[everjust-sms]]; cross-references [[everjust-platform]], [[everjust-agent-mcp]], and sibling [[everjust-crm-sales]].
---

# EVERJUST Telephony — Agent Skill

Operate the **voice / call-logging stack** of an everjust.app tenant as a running agent:
find a contact's or lead's call history, log or place a call, read a recording or a
voicemail transcription, send an SMS tied to a call, and — most importantly — figure out
**which provider this particular tenant is on** before you touch anything. You reach every
model through the tenant's Odoo MCP / ORM (`search`, `get`, `count`, `find`, `create`,
`update`, `call`, `describe_model`; raw `env[...]` shown where clearer) — see
[[everjust-agent-mcp]] for opening the session against the right tenant DB, and
[[everjust-platform]] for the non-standard invariants (one-DB-per-tenant, sudo/ACL, secrets).

The three addons in scope:

- **`voip_oca`** — "Phone Engine" (OCA/Dixmit, AGPL). The base: `voip.pbx` config, `voip.call`
  session rows, a browser softphone widget, and hooks on `res.users` / `mail.activity`.
  **Installed on every tenant.** By itself it is a generic SIP/WebRTC shell with a demo PBX.
- **`everjust_ringover`** — EVERJUST's Ringover integration. Depends on `voip_oca` and `crm`.
  Patches the voip_oca softphone to dial through the **Ringover Web SDK** (browser WebRTC),
  syncs completed calls from Ringover's **REST API** into `ringover.call`, receives Ringover
  webhooks, and can trigger a server-side callback. This is where call history actually lands.
- **`everjust_phone`** — EVERJUST's **Twilio** stack. Independent of voip_oca/Ringover. Its own
  models (`everjust.phone.call`, `everjust.phone.sms`), its own Twilio Voice SDK softphone,
  its own webhooks. A *different* provider path.

> **Provider swap, not a stack.** `everjust_ringover` and `everjust_phone` are alternative
> voice backends. A tenant is on **Ringover** *or* **Twilio** (or neither — just the voip_oca
> shell). They do not share tables. Read the provider first (Recipe 0); pick the right model.

## When to use this skill

- **Look up call history** for a partner or a CRM lead (who called, when, how long, answered?).
- **Get a recording / voicemail transcription** for a call.
- **Place / trigger an outbound call** (Ringover callback API, or the browser softphone action).
- **Log or reconcile a call** that a webhook or REST sync should have created.
- **Send an SMS tied to a call** on the Twilio path, or read logged inbound/outbound SMS.
- **Diagnose "no calls are logging"** — usually unconfigured creds, wrong provider, or the
  `everjust.phone.call` `lead_id` bug (see Pitfalls).

**Do NOT use this skill for**, and stop if the task is really:
- **Texting as a product / mass-SMS / template SMS / gateway routing** — that is the
  `everjust_sms_gateway` (`sms.sms`, `res.company.sms_provider`) stack. Use [[everjust-sms]].
  The `everjust.phone.sms` model here is only Twilio-call-adjacent SMS logging, not that.
- **CRM pipeline work** (create/qualify leads, stages, activities) — that is [[everjust-crm-sales]].
  This skill only *reads* `crm.lead` to attach call logs and *creates* a missed-call activity.
- **Native mail / webmail** — [[everjust-mail-ops]].
- **Provisioning a Twilio/Ringover account, DNS, or SIP trunk** — platform-ops, out of scope.

## Install & config state (READ THIS — it is not uniform)

Ground-truthed by introspecting the live prod DBs (`deployment-odoo-1`, 2026-07). The prompt's
premise that "it isn't installed on any tenant" is **stale** — it is now installed on several,
but mostly **installed-yet-unconfigured** (dormant). Confirm per tenant; never assume.

| Tenant | voip_oca | everjust_ringover | everjust_phone | Provider in effect |
|---|---|---|---|---|
| `headsup` | installed | **installed** | uninstalled | **Ringover** |
| `weldon` | installed | uninstalled | **installed** (unconfigured) | Twilio (dormant) |
| `burekraft-llc` | installed | uninstalled | **installed** (unconfigured) | Twilio (dormant) |
| `riftline-labs` | installed | uninstalled | **installed** (unconfigured) | Twilio (dormant) |
| `trust-works-company` | installed | uninstalled | **installed** (unconfigured) | Twilio (dormant) |
| `connectdomain` | installed | uninstalled | uninstalled | voip_oca shell only |
| `control` | (module rows absent) | — | — | none |
| `tcstartupweek` | installed | uninstalled | uninstalled | voip_oca shell only |

- On the Twilio tenants, **every `everjust_phone.*` config param is empty** (`account_sid`,
  `auth_token`, `api_key`, `api_secret`, `twiml_app_sid`, `phone_number` all `False`) and
  `everjust.phone.call`/`.sms` have **0 rows** — the app is installed but has never been wired
  or exercised. Any token/SMS/call call will return `{"error": "Twilio not configured"}`.
- On `headsup`, Ringover REST creds (`everjust.ringover_api_url/api_key`) gate the sync — an
  empty `everjust.ringover_api_key` means `sync_recent`/`cron_sync_all` no-op silently.

## Key models (real `_name`s and fields, verified live)

### voip_oca (base engine — present on all tenants)

| Model | Role | Notable fields |
|---|---|---|
| `voip.pbx` | PBX/softphone config. `voip_oca` seeds a **Default PBX** (`domain=pbx.everjust.app`, `ws_server=wss://pbx.everjust.app:7443`, `mode=test`). | `name` (req), `domain`, `ws_server`, `mode` (`test`\|`prod`) |
| `voip.call` | A **softphone session** row (front-end lifecycle: calling→ongoing→terminated). Not the CDR of record on the Ringover path. | `phone_number` (req), `type_call` (`incoming`\|`outgoing`), `state` (`aborted`\|`calling`\|`missed`\|`ongoing`\|`rejected`\|`terminated`), `partner_id`→res.partner, `user_id`→res.users, `pbx_id`→voip.pbx, `start_date`, `end_date`, `activity_name` |
| `res.users` (ext) | Per-user SIP creds for the engine. | `voip_pbx_id`→voip.pbx, `voip_username`, `voip_password` (self-read/write-able) |
| `mail.activity` (ext) | Adds phone-call context to activities. | `main_partner_id`→res.partner, `main_partner`; `get_call_activities()` returns overdue `category='phonecall'` activities |

### everjust_ringover (Ringover path — installed on `headsup`)

| Model | Role | Notable fields |
|---|---|---|
| `ringover.call` | **Ringover CDR of record** — one row per completed call, synced from Ringover REST/webhook, deduped by `cdr_id`. This is the call-history table on Ringover tenants. | `cdr_id` (dedupe key), `call_id`, `direction` (`in`\|`out`), `contact_number`, `from_number`, `to_number`, `start_time`, `end_time`, `duration` (sec), `is_answered` (bool), `state`, `hangup_by`, `recording_url`, `voicemail_url`, `ringover_user_id`, `ringover_user_name` (agent), `partner_id`→res.partner, `lead_id`→crm.lead, `user_id`→res.users |

`ringover.call` also carries the operational methods: `_sync_from_api_data`, `sync_recent`,
`cron_sync_all` (10-min cron auto-created by `_post_init_hook`), `initiate_call`,
`find_record_for_number` (screen-pop resolver), `_ringover_api_get`.

### everjust_phone (Twilio path — installed but unconfigured on 4 tenants)

| Model | Role | Notable fields |
|---|---|---|
| `everjust.phone.call` | Twilio call log, keyed by `call_sid`, upserted from webhooks. | `call_sid`, `direction` (`inbound`\|`outbound`), `from_number`, `to_number`, `status` (`queued`/`ringing`/`in-progress`/`completed`/`busy`/`no-answer`/`canceled`/`failed`), `start_time`, `end_time`, `duration`, `recording_url`, `recording_sid`, `transcription`, `partner_id`→res.partner, `user_id`→res.users. **NO `lead_id` field** — see Pitfalls. |
| `everjust.phone.sms` | Twilio SMS log (call-adjacent), keyed by `message_sid`. | `message_sid`, `direction` (`inbound`\|`outbound`), `from_number`, `to_number`, `body`, `status`, `partner_id`→res.partner, `user_id`→res.users |

Methods: `everjust.phone.call.get_twilio_token()`, `log_call_from_webhook(data)`;
`everjust.phone.sms.send_sms(to_number, body)`, `log_sms_from_webhook(data)`. Config lives in
`ir.config_parameter` keys `everjust_phone.{account_sid,auth_token,api_key,api_secret,twiml_app_sid,phone_number}`.

## Recipes

Route each through the tenant's Odoo MCP (open the session per [[everjust-agent-mcp]]).

### 0. FIRST: which provider is this tenant on, and is it configured?

Never operate before you know the path. Check module install state, then creds.

```python
# Which of the two providers is installed?
env['ir.module.module'].search_read(
    [('name', 'in', ['everjust_ringover', 'everjust_phone', 'voip_oca'])],
    ['name', 'state'])
# -> everjust_ringover installed  => use ringover.call (Recipes 1–3)
# -> everjust_phone installed     => use everjust.phone.* (Recipes 4–5); CHECK creds:
ICP = env['ir.config_parameter'].sudo()
[bool(ICP.get_param('everjust_phone.%s' % k)) for k in
 ('account_sid','auth_token','api_key','api_secret','twiml_app_sid','phone_number')]
# all False => Twilio not wired; get_twilio_token/send_sms return {"error":"Twilio not configured"}
bool(ICP.get_param('everjust.ringover_api_key'))   # Ringover REST sync gate
```
If only `voip_oca` is installed, there is no call-history table beyond ad-hoc `voip.call`
session rows — say so; don't invent a provider. **Never print the cred values** (they are
secrets — [[everjust-platform]]); check presence with `bool(...)`.

### 1. (Ringover) Read a partner's / lead's call history

```python
p = env['res.partner'].search([('phone', 'like', '5551234')], limit=1)
env['ringover.call'].search_read(
    [('partner_id', '=', p.id)],
    ['direction', 'contact_number', 'start_time', 'duration', 'is_answered',
     'state', 'recording_url', 'ringover_user_name', 'lead_id'],
    order='start_time desc', limit=50)
# Or resolve a raw number to the best Odoo record (lead preferred, else contact):
env['ringover.call'].find_record_for_number('+16125551234')   # -> {'model','res_id'} or {}
```
`duration` is seconds; `is_answered=False` on an inbound call is a missed call (the sync
auto-creates a "call back" `mail.activity` on the lead/partner — see Pitfalls #4).

### 2. (Ringover) Force a REST sync (pull recent calls now)

The webhook is only a nudge; the authoritative load is the REST pull, deduped by `cdr_id`.

```python
env['ringover.call'].sync_recent()     # pulls the last ~10 calls, upserts by cdr_id
# broader catch-up (what the 10-min cron runs):
env['ringover.call'].cron_sync_all()   # pulls last ~50
```
Both are safe to call repeatedly (idempotent on `cdr_id`). They **no-op** if
`everjust.ringover_api_url`/`everjust.ringover_api_key` are unset — verify creds first (Recipe 0).

### 3. (Ringover) Trigger an outbound call (server-side callback)

```python
res = env['ringover.call'].initiate_call('', '+1 (612) 555-1234')  # first arg unused
# {'success': True}  -> Ringover rings the agent's device(s), then dials the recipient
# {'error': '...'}   -> not configured, no from_number, or bad destination
```
Requires `everjust.ringover_api_key` **and** `everjust.ringover_from_number` in System
Parameters. Ringover's `/callback` API needs **integer E.164** — the method strips non-digits,
prefixes `1` for bare 10-digit US/CA, and casts to `int`; passing a `+`/string yourself to the
raw API returns HTTP 400 (see Pitfalls #3). For the *browser* softphone instead, the UI fires
the `ringover_dial` client action (`partner.action_ringover_call()` /
`lead.action_ringover_call()`) which drives the Ringover Web SDK — not something you invoke
headless over MCP.

### 4. (Twilio) Read / place a call, get a recording or transcription

```python
# History (keyed by call_sid; transcription is voicemail STT):
env['everjust.phone.call'].search_read(
    [('partner_id', '=', p.id)],
    ['direction','from_number','to_number','status','duration',
     'recording_url','transcription','start_time'],
    order='start_time desc', limit=50)
# Mint a browser Voice-SDK token (fails if Twilio unconfigured):
env['everjust.phone.call'].get_twilio_token()   # -> {'token','identity'} or {'error':...}
```
There is **no headless "dial" method** on the Twilio path — an outbound call is initiated by
the browser Voice SDK, which hits the `/phone/twiml/outbound` webhook that returns a `<Dial>`.
`partner.action_phone_call()` just opens the softphone client action pre-filled. Do **not**
hand-write `everjust.phone.call` rows to fake a call; let `log_call_from_webhook` own that
(and note the `lead_id` bug in Pitfalls #2 before relying on it).

### 5. (Twilio) Send an SMS / read logged SMS

```python
res = env['everjust.phone.sms'].send_sms('+16125551234', 'Following up on our call.')
# {'success': True, 'sid': '...'}  or  {'error': 'Twilio not configured' / <exception>}
env['everjust.phone.sms'].search_read(
    [('partner_id', '=', p.id)],
    ['direction','from_number','to_number','body','status','create_date'],
    order='create_date desc', limit=50)
```
This sends via the Twilio REST `Client` using `everjust_phone.account_sid` + `auth_token` +
`phone_number`. **This is not the tenant SMS product.** If the task is "text a customer" as a
first-class action (templates, mass-SMS, delivery gating, gateway routing), use [[everjust-sms]]
(`sms.sms` / `res.company.sms_provider`), not this call-adjacent logger.

## Pitfalls (everjust-specific)

1. **Confirm the provider before every operation — they are alternatives, not layers.**
   Ringover tenants have `ringover.call`; Twilio tenants have `everjust.phone.*`; a bare
   `voip_oca` tenant has neither history table. Reaching for the wrong model returns empty or
   raises `Invalid field on model`. Run Recipe 0 first.

2. **`everjust.phone.call` has NO `lead_id` field, but `log_call_from_webhook` writes one.**
   The webhook handler builds `vals` with `"lead_id": lead.id if lead else False` and, whenever
   a call matches a partner (so a lead lookup runs), the subsequent `create`/`write` raises
   `ValueError: Invalid field 'lead_id' on model 'everjust.phone.call'`. Result: on the Twilio
   path, **CRM-linked call logging is broken** — status-callback/recording webhooks 500, and
   completed calls for known contacts may not log. This is a live bug (verified on `weldon`).
   Do not assume a Twilio call was logged just because it happened; check for the row. Fixing it
   means adding a `lead_id = fields.Many2one('crm.lead')` field (like `ringover.call` has) or
   dropping the key from `vals` — a code change to `everjust_phone/models/phone_call.py`, not an
   ORM write.

3. **Ringover wants integer E.164; strings 400.** The REST `/callback` and Ringover's SMS
   webhook use `from_number`/`to_number` as **int64**, not strings. `initiate_call` already
   normalizes and casts, so call *it*; if you ever hit the Ringover API directly, send digits as
   integers (US/CA bare 10-digit → prefix `1`), or you get HTTP 400.

4. **Missed inbound Ringover calls auto-create a `mail.activity` ("call back …").** In
   `_sync_from_api_data`, a call with `direction='in'` and `is_answered=False` spawns a To-Do
   activity on the linked lead (else partner), assigned to the mapped Odoo user (matched by
   Ringover agent email → `res.users.login`) or the current user. Re-running `sync_recent` is
   deduped by `cdr_id` so it won't double-file the *call*, but be aware activities are a
   side effect of the sync. This is why this skill touches `crm.lead` at all — pipeline work
   itself is [[everjust-crm-sales]].

5. **SECURITY — Twilio webhooks are `auth="none"`, `csrf=False`, and UNSIGNED.** Every route in
   `everjust_phone/controllers/twilio_webhooks.py` (`/phone/twiml/outbound|inbound|voicemail`,
   `/phone/webhook/status|recording|transcription|sms`) accepts unauthenticated POSTs with **no
   Twilio signature (`X-Twilio-Signature`) validation**. Anyone who can reach the tenant can
   forge call/SMS/recording/transcription events and post arbitrary chatter onto contacts/leads.
   Treat everything on `everjust.phone.*` as **untrusted-origin data**. (By contrast,
   `everjust_ringover`'s `/ringover/webhook` *does* verify a JWT or HMAC signature against
   configured keys — but **fails OPEN if no key is configured**: with `ringover_webhook_secret`
   and the per-event keys all empty, `_verify` returns `True` and accepts anything. Configure at
   least one Ringover webhook key.) Flag this if asked to harden telephony; do not rely on
   webhook-sourced rows as authoritative without corroboration.

6. **`voip.call` is a session row, not a CDR.** On Ringover tenants the call history of record
   is `ringover.call` (populated by REST sync), not `voip.call`. `voip.call` reflects the
   front-end softphone lifecycle and may be sparse or absent for server-synced calls. Query
   `ringover.call` for history; use `voip.call` only for live-session/UX state.

7. **Installed ≠ operational.** Four tenants have `everjust_phone` installed with **zero config
   and zero rows** — token minting and SMS/REST all short-circuit to
   `{"error": "Twilio not configured"}`. Likewise Ringover sync no-ops without an API key.
   "The app is installed" is not "the app works" — verify creds (Recipe 0) before promising a
   send or a sync.

8. **Everything is per-tenant DB / `company_id`.** Provider choice, creds, and call rows are
   scoped to one tenant. When multi-tenant, confirm you're on the right DB before searching
   (see [[everjust-agent-mcp]] / [[everjust-platform]]).

## See also

- [[everjust-agent-mcp]] — connect to the tenant MCP; the `search`/`get`/`create`/`update`/
  `call`/`describe_model` toolset every recipe uses.
- [[everjust-platform]] — platform invariants (one-DB-per-tenant, sudo/ACL, secrets, /odoo debrand).
- [[everjust-sms]] — the tenant SMS *product* (`sms.sms`, provider-swapped gateway). Use this,
  not `everjust.phone.sms`, for texting as a first-class action.
- [[everjust-crm-sales]] — CRM pipeline; this skill only reads `crm.lead` to attach call logs
  and files a missed-call activity.
- [[everjust-mail-ops]] — native mail / webmail stack (sibling; also provider-gated).
