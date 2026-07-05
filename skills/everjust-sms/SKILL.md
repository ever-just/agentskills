---
name: everjust-sms
description: Operate the SMS app of an everjust.app tenant (send an SMS to a number, send SMS as chatter on a partner/lead, use an SMS template, mass-SMS a set of records, inspect delivery state, and reason about which gateway a send actually took) via the Odoo MCP/ORM. Use when the task is to text someone from an everjust.app workspace, diagnose why an SMS failed, check an sms.sms row's status, or confirm which provider (TextBee / Ringover / Twilio / Odoo IAP) the tenant is on. This is the everjust_sms_gateway stack — the transport under sms.sms is provider-SWAPPED per company via res.company.sms_provider, NOT necessarily Odoo IAP. Do NOT hand-POST TextBee/Ringover; drive sms.sms/sms.composer and let _get_sms_api_class route it. Cross-references [[everjust-platform]] and [[everjust-agent-mcp]]; sibling of [[everjust-mail-ops]].
---

# EVERJUST SMS — Agent Skill

Operate the **SMS app** of a live everjust.app tenant as an agent: send an SMS to a raw
number, send SMS as chatter on a contact/lead, apply an SMS template, mass-text a set of
records, and read back delivery state — all through the Odoo MCP / ORM (`search`, `get`,
`create`, `update`, `call`, `describe_model`; see [[everjust-agent-mcp]] for opening the
session against the right tenant DB). The everjust-specific addon is **`everjust_sms_gateway`**
(source: `/Users/cloudaistudio/Desktop/ww.everjust.app/addons/everjust_sms_gateway/`).

The crucial everjust fact: **the SMS data models are stock Odoo (`sms.sms`, `sms.composer`,
`sms.template`), but the TRANSPORT is swapped per company.** `everjust_sms_gateway` overrides
`res.company._get_sms_api_class()` so a send can go out over **TextBee** (self-hosted, zero
per-message cost), **Ringover**, **Twilio** (`sms_twilio`), or **Odoo IAP** — depending on
`res.company.sms_provider` + config params. You drive the *same* stock objects; the addon
decides the wire.

## When to use this skill

- **Send an SMS** to a phone number, or **as SMS chatter** on a `res.partner` / CRM lead /
  any record with a phone field, from an everjust.app tenant.
- **Send with an SMS template** (`sms.template`) rendered against a record.
- **Mass-SMS** a recordset (SMS Marketing / bulk composer).
- **Diagnose a failed / stuck SMS** — read `sms.sms.state` + `failure_type`, and figure out
  whether the tenant's gateway is even configured.
- **Confirm which provider a tenant is on** and which transport a send would actually use
  (this is non-obvious — see the resolution rule below).

**Do NOT use this skill for:**
- **Voice / calls / softphone** — that's `voip_oca` / `everjust_ringover` (Ringover) or
  Twilio voice, a different app. This is SMS only.
- **Email / mailbox ops** — use [[everjust-mail-ops]] (`everjust.mail.*`). SMS marketing and
  email marketing are separate; don't cross them.
- **Hand-calling TextBee/Ringover HTTP APIs directly.** Never POST `…/api/messages/send` or
  `…/push/sms` yourself. Create an `sms.sms` (or drive `sms.composer`) and let
  `_send_with_api` → `_get_sms_api_class()` route it. A hand POST bypasses chatter logging,
  the blacklist/opt-out gate, tracker state, and provider selection.
- **Provisioning the gateway** (deploying TextBee, minting the API key, setting the config
  params) — that's platform-ops / the control-plane provisioning script, not this skill.

## Architecture — how the transport gets swapped

Per tenant = per `res.company` (one DB per tenant, everything `company_id`-scoped; see
[[everjust-platform]]). The send path is stock Odoo:

`sms.sms._send()` → `_send_with_api()` → `self.env.company._get_sms_api_class()(env)._send_sms_batch(...)`.

`everjust_sms_gateway` inherits `res.company` and overrides `_get_sms_api_class()`. **The
resolution order (read this carefully — it has a surprising fallback):**

1. `sms_provider == "ringover"` → `SmsApiRingover` (POSTs `…/push/sms`, creds in the
   `everjust.ringover_*` params — shared with the call integration).
2. `sms_provider == "textbee"` → `SmsApiTextBee` (POSTs `{gateway_url}/api/messages/send`).
3. `sms_provider` is **empty OR `"iap"`** *and* the param `everjust.sms_gateway_url` is
   set → **silently uses `SmsApiTextBee` anyway** ("works out of the box"). ⚠️ So a company
   showing provider `iap` is NOT necessarily on Odoo IAP.
4. Otherwise → `super()` → whatever `sms`/`sms_twilio` resolve (`SmsApi` = Odoo IAP, or the
   Twilio class if `sms_provider == "twilio"`).

`res.company.sms_provider` selection on an everjust tenant (confirmed live):
`iap` (Send via Odoo) · `twilio` · `textbee` (Send via TextBee, self-hosted) · `ringover`.

**Config params** (in `ir.config_parameter`, seeded empty by the addon — *never echo these
values*, they're secrets per [[everjust-platform]]):
- `everjust.sms_gateway_url` — TextBee base URL (e.g. `https://textbee.everjust.app`).
- `everjust.sms_gateway_key` — TextBee API key (sent as header `x-api-key`).
- `everjust.sms_webhook_key` — shared secret to verify **inbound** SMS webhooks.
- `everjust.ringover_api_url` / `everjust.ringover_api_key` / `everjust.ringover_from_number`
  — Ringover push (US default base `https://public-api-us.ringover.com/v2`).

**Inbound SMS** is an unauthenticated-route bridge you don't drive: TextBee POSTs
`{message, phoneNumber, receivedAt}` to **`/sms/incoming`** (`auth="none"`), the controller
verifies `X-Webhook-Key` against `everjust.sms_webhook_key` if set, reverse-looks-up a
`res.partner` by `phone`/`mobile`, and `message_post(message_type="sms",
subtype_xmlid="mail.mt_note")` onto that partner. Unknown numbers are logged and dropped
(no lead is created). As an operating agent, **read** the resulting chatter SMS notes; do
not fabricate inbound by posting them yourself.

## Key models

`sms.api` is **NOT an ORM model** — it's the `SmsApiBase`/`SmsApi` *class* in
`odoo/addons/sms/tools/sms_api.py` (which `SmsApiTextBee`/`SmsApiRingover` subclass). You
cannot `search`/`get` it. Don't look for it in `list_models`.

| Model | Role | Notable fields (real, confirmed live) |
|---|---|---|
| `sms.sms` | **The outbound message row.** One per recipient number. Created then `_send()`. | `number` (E.164-ish string), `body` (text), `partner_id` (→`res.partner`), `mail_message_id` (→`mail.message`, the chatter link), `state` (**selection below**), `failure_type` (**selection below**), `uuid`, `sms_tracker_id` (→`sms.tracker`), `record_company_id` (→`res.company`, which company's provider routes it), `to_delete`, `sms_twilio_sid` (Twilio SID, from `sms_twilio`) |
| `sms.composer` | **Transient wizard** to compose+send (single, on-document, or mass). What the UI buttons drive. | `composition_mode` (`numbers`\|`comment`\|`mass`), `body` (**required**), `recipient_single_number_itf` / `recipient_single_number`, `numbers` (comma list, `numbers` mode), `res_model`+`res_id` (`comment` mode target), `number_field_name`, `template_id` (→`sms.template`), `mass_keep_log`. Methods: `action_send_sms`, `action_send_sms_mass_now`, `_action_send_sms` |
| `sms.template` | **Reusable message body** rendered per record (QWeb/jinja on `body`). | `name`, `model_id` (→`ir.model`, **required**), `model` (tech name), `body` (**required**, char/template), `sidebar_action_id` |
| `res.company` (via `sms_provider`) | **The provider switch** for this tenant. `_get_sms_api_class()` reads it (overridden here). | `sms_provider` (selection above) |
| `sms.tracker` | Stock delivery-state tracker linking `sms.sms` ⇄ `mail.notification`/`mail.message`. Read-only telemetry. | (stock; you rarely touch it directly) |

**`sms.sms.state`** (required): `outgoing` ("In Queue") · `process` ("Processing") ·
`pending` ("Sent") · `sent` ("Delivered") · `error` ("Error") · `canceled` ("Cancelled").
⚠️ Note the labels are shifted from the codes — `pending` means *submitted to provider*,
`sent` means *delivered*. Judge success from **`state == "sent"`**, and treat `pending` as
"handed off, not yet confirmed."

**`sms.sms.failure_type`** (when `state == "error"`): `unknown` · `sms_number_missing` ·
`sms_number_format` · `sms_country_not_supported` · `sms_registration_needed` ·
`sms_credit` · `sms_server` · `sms_acc` · `sms_blacklist` · `sms_duplicate` · `sms_optout`
· plus Twilio-specific ones. The gateway maps **both** its `gateway_error` (TextBee) and
`ringover_error` (Ringover) to **`sms_server`** — so a `sms_server` failure on an everjust
tenant usually means "the TextBee/Ringover HTTP call failed or the gateway URL/key is
missing," not an Odoo-IAP credit problem.

## Recipes

Route each call through the Odoo MCP against the tenant DB (open the session per
[[everjust-agent-mcp]]). Recipes use the MCP toolset (`search`, `get`, `create`, `update`,
`call`, `describe_model`); the ORM equivalents are shown where a raw `env[...]` is clearer.

### 0. First: confirm which transport this tenant will actually use

Before sending, resolve the provider — don't assume. (This is the step people skip.)

```
get('res.company', [<company_id>], ['name', 'sms_provider'])
# Then read the params that flip the fallback (presence only — do NOT print values):
call('res.company', '_get_sms_api_class', [<company_id>], confirm=true)   # returns the class name
```
Interpretation: class `SmsApiTextBee` ⇒ TextBee, `SmsApiRingover` ⇒ Ringover, `SmsApi` ⇒
Odoo IAP, the Twilio class ⇒ Twilio. Remember the fallback: `sms_provider == 'iap'` **with**
`everjust.sms_gateway_url` set still routes to **TextBee**. If provider is `textbee`/`iap`
but no gateway URL is configured, `_send_sms_batch` marks every recipient `server_error`
(→ `state='error'`, `failure_type='sms_server'`) — the gateway isn't ready; stop and flag it.

### 1. Send an SMS to a raw phone number (as chatter on a partner)

The clean, gate-respecting path is the composer in `comment` mode (logs a note on the
record and respects blacklist/opt-out):

```
# Create the transient composer targeting a partner, then fire it:
cid = create('sms.composer', {
    'composition_mode': 'comment',
    'res_model': 'res.partner',
    'res_id': <partner_id>,
    'body': 'Hi Alice — your order is ready for pickup.',
})
call('sms.composer', 'action_send_sms', [cid], confirm=true)
```
This renders/sends and files an SMS chatter note on the partner. To read the outcome, find
the `sms.sms` it created:
```
search('sms.sms', [['partner_id','=',<partner_id>]], ['number','state','failure_type','create_date'], 10, 'id desc')
```

### 2. Send an SMS to arbitrary numbers not tied to a record

Use `numbers` mode (comma-separated), no record needed:

```
cid = create('sms.composer', {
    'composition_mode': 'numbers',
    'numbers': '+16505551234,+16505559876',
    'body': 'Reminder: demo tomorrow at 10am CT.',
})
call('sms.composer', 'action_send_sms', [cid], confirm=true)
```
Each number becomes one `sms.sms`. Prefer this over hand-creating `sms.sms` rows — the
composer normalizes numbers and honors gates. If you *must* go low-level (e.g. scripting),
create then send explicitly:
```python
# ORM form (via `call`/shell) — low level, use sparingly:
sms = env['sms.sms'].create([{'number': '+16505551234', 'body': 'Hi'}])
sms._send(unlink_failed=False, unlink_sent=False, raise_exception=False)  # routes through _get_sms_api_class
sms.read(['state', 'failure_type'])
```

### 3. Send SMS from a template, rendered against a record

```
# Find the template applicable to the record's model:
tpls = search('sms.template', [['model','=','res.partner']], ['name','model','body'])
# Attach it to the composer (it renders body per record):
cid = create('sms.composer', {
    'composition_mode': 'comment',
    'res_model': 'res.partner', 'res_id': <partner_id>,
    'template_id': <template_id>,
    'body': '',   # overwritten by the template render
})
call('sms.composer', 'action_send_sms', [cid], confirm=true)
```
Or use the record-side bridge directly (`res.partner._message_sms_with_template`), which
also exists on any `mail.thread` model — handy for CRM leads:
```python
partner._message_sms_with_template(template=tpl, template_xmlid=None)
```

### 4. Mass-SMS a recordset (bulk)

```
# From a recordset context, composer in mass mode; number_field_name says which field to text:
cid = create('sms.composer', {
    'composition_mode': 'mass',
    'res_model': 'res.partner',
    'res_ids': [<id1>, <id2>, <id3>],        # or active_domain via context
    'number_field_name': 'mobile',
    'body': 'Flash sale ends tonight. Reply STOP to opt out.',
    'mass_keep_log': True,
})
call('sms.composer', 'action_send_sms_mass_now', [cid], confirm=true)
```
Blacklisted / opted-out recipients are dropped by the stock gate before transport. Bulk over
TextBee/Ringover is one HTTP call **per recipient** (the gateway loops), so large blasts are
slow and rate-limited by the gateway, not by Odoo IAP credits — pace accordingly. SMS
Marketing (`mailing.mailing` with `mailing_type='sms'`) rides the same transport if that app
is installed.

### 5. Inspect / triage delivery state

```
# Recent sends for this company and why any failed:
search('sms.sms',
       [['record_company_id','=',<company_id>], ['state','in',['error','pending','process']]],
       ['number','state','failure_type','partner_id','create_date','sms_twilio_sid'],
       50, 'id desc')
```
`state='error'` + `failure_type='sms_server'` on an everjust tenant ⇒ the TextBee/Ringover
HTTP call failed or the gateway URL/key is unset (check recipe 0), **not** an IAP credit
issue. To retry a failed row, re-run its send rather than flipping `state` by hand:
```python
env['sms.sms'].browse(<id>).send(unlink_failed=False, unlink_sent=False, auto_commit=False)
```

## Pitfalls (everjust-specific)

1. **`sms.api` is not a model.** It's a Python class (`odoo/addons/sms/tools/sms_api.py`),
   subclassed by `SmsApiTextBee`/`SmsApiRingover` in `everjust_sms_gateway`. You can't
   `search`/`get`/`describe_model` it — reach it only via `res.company._get_sms_api_class()`.

2. **Provider `iap` does NOT mean Odoo IAP here.** The override in `_get_sms_api_class`
   silently routes `sms_provider ∈ {'', 'iap'}` to **TextBee** whenever
   `everjust.sms_gateway_url` is set. Always resolve the real class (recipe 0) before
   reasoning about cost, rate limits, or where a message physically went.

3. **Never hand-POST TextBee/Ringover.** Don't call `{gateway_url}/api/messages/send` or
   `{ringover}/push/sms` yourself. Go through `sms.sms`/`sms.composer` so blacklist/opt-out
   gating, chatter logging, `sms.tracker` state, and per-company provider selection all
   apply. A raw POST is invisible to the CRM record and the audit trail.

4. **State codes are label-shifted.** `pending` displays as "Sent" (handed to provider);
   `sent` displays as "Delivered." Success is **`state == 'sent'`**. `pending`/`process`
   mean "in flight, not confirmed" — don't report those as delivered.

5. **`sms_server` is the everjust catch-all failure.** The gateway maps its own
   `gateway_error`/`ringover_error` onto `sms_server`. On an everjust tenant, `sms_server`
   almost always means "gateway URL/key missing, or the HTTP call to TextBee/Ringover
   failed" — not credits. Diagnose the gateway config (recipe 0), not IAP balance.

6. **Ringover outbound needs a registered A2P 10DLC campaign** with the sender number
   assigned. Until that's approved, Ringover rejects every send and the row lands
   `error`/`sms_server` (never silently dropped, but never delivered either). If a tenant is
   on `ringover` and everything fails with `sms_server`, suspect 10DLC, not code.

7. **Everything is per-`company_id`.** `sms_provider`, the gateway params, and
   `record_company_id` are all company-scoped. On a multi-company/multi-tenant task, confirm
   you're on the right DB and `env.company` (see [[everjust-platform]]) before sending —
   the wrong company can silently pick a different (or unconfigured) transport.

8. **Don't echo the gateway/Ringover secrets.** `everjust.sms_gateway_key`,
   `everjust.sms_gateway_url`, `everjust.sms_webhook_key`, and the `everjust.ringover_*`
   params are secrets; every MCP call is audited. Check presence (`bool`), never print
   values (per [[everjust-platform]] pitfall #4).

9. **Inbound is a bridge, not something you author.** `/sms/incoming` posts inbound texts as
   SMS chatter on the matched partner; unknown numbers are dropped (no lead). Read those
   notes; don't fabricate inbound by `message_post`-ing SMS notes yourself.

10. **Install state varies per tenant.** `everjust_sms_gateway` is `auto_install: True`
    (installs whenever `sms` is present) and **is installed on the `connectdomain` tenant**,
    but the gateway there is currently **dormant**: `sms_provider = 'iap'` with no
    `everjust.sms_gateway_url`, so sends would resolve to stock `SmsApi` (Odoo IAP). Never
    assume the swap is active — check config (recipe 0). `everjust_ringover` is a separate
    module and was **uninstalled** on connectdomain at last check.

## See also

- [[everjust-platform]] — tenancy model, debrand, per-tenant provider swaps, secret
  namespaces, and the invariants you must not break. Read it for the "why."
- [[everjust-agent-mcp]] — how to connect to the tenant MCP and the `search`/`get`/`create`/
  `update`/`call`/`describe_model` toolset every recipe above uses.
- [[everjust-mail-ops]] — the sibling *email* stack (`everjust.mail.*`). SMS marketing and
  email marketing are separate transports; use that skill for anything mailbox/email.
