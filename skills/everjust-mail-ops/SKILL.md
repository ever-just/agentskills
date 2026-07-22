---
name: everjust-mail-ops
description: Operate the everjust.app NATIVE mail platform (send/receive as a mailbox, inspect a domain's verification, read a mailbox's entries, check suppression) via the Odoo MCP/ORM. Use when the task is to send an email as an everjust.app tenant address, read/triage a mailbox, diagnose why a send is blocked, check a sending domain's DKIM/verification state, or verify a bounce/complaint suppression. This is the everjust.mail.* stack (custom webmail), NOT Odoo Discuss and NOT raw mail.mail — do not reach for mail.thread/Discuss/message_post, and do not hand-roll mail.mail even via a raw Odoo API key that bypasses the MCP (it can deliver while staying invisible in the mailbox UI). Send through compose_send or the MCP's mail_send tool only. Always read the returned delivery result; a filed Sent entry is not proof of delivery. Cross-references [[everjust-platform]] and [[everjust-agent-mcp]].
---

# EVERJUST Mail Ops — Agent Skill

Operate the **everjust.app native mail platform** as a running agent: send mail as a
tenant mailbox, read and triage a mailbox, check a sending domain's verification, and
inspect suppression — all through the Odoo MCP / ORM (`env["..."]`, `search`, `read`,
`call` an exposed method). Canonical infrastructure reference:
`/Users/cloudaistudio/Desktop/ww.everjust.app/docs/EMAIL_INFRASTRUCTURE.md`. The addons
are `everjust_mail` (data + transport) and `everjust_mail_ui` (webmail JSON-RPC).

## When to use this skill

- **Send an email** as an everjust.app tenant address (e.g. `hello@connectdomain.app`)
  and correctly interpret whether it was actually accepted for delivery.
- **Read / triage a mailbox** — list Inbox/Sent entries, unread counts, flag read/star/trash.
- **Diagnose a blocked or non-delivered send** (unverified identity, hourly cap, all
  recipients suppressed, no transport).
- **Check a sending domain's state** — verification / DKIM / DNS-record status before sending.
- **Check suppression** — is an address on the bounce/complaint list (and thus never mailable).

**Do NOT use this skill for**, and stop if the task is really:
- Odoo **Discuss** / chatter / `message_post` / `mail.thread` — this platform is a
  separate webmail stack; those are different products (see Pitfalls).
- **DNS record writes** at the registrar — that is [[godaddy-api]] / Route 53, not this model.
- **Provisioning a new sending domain** end-to-end (IAM SMTP user, SES identity, receipt
  rules) — that is the manual runbook in EMAIL_INFRASTRUCTURE.md §7 and is platform-ops
  work; see [[everjust-platform]]. This skill assumes the identity already exists.
- **Bulk / mass-mailing blasts** — gated and unbuilt (EMAIL_INFRASTRUCTURE.md §6). Do not
  trigger `mass_mailing` campaigns from here.

You reach the ORM through the platform's Odoo MCP tools — see [[everjust-agent-mcp]] for
how to open an `env` against the right tenant DB, run a shell, or call a model method.
Every recipe below is expressed as ORM/method calls you route through that MCP.

## Architecture (the model map)

One tenant DB per customer. Everything is per-`company_id`. The mail stack layers on TOP
of native Odoo `mail.message` / `mail.blacklist` — it does not replace them.

| Model | Role | Key fields |
|---|---|---|
| `everjust.mail.domain` | A **sending+receiving identity** (a domain). Gates the whole send path. | `name`, `domain_type` (`platform_default`\|`customer`), `provider` (`ses`\|`resend`\|`postal`), `verification_state` (`pending`\|`verifying`\|`verified`\|`failed`\|`suspended`), `is_sendable` (computed: **True only when `verification_state=='verified'`**), `dkim_selector`, `record_ids` |
| `everjust.mail.domain.record` | One DNS record the domain needs published (mirror of DNS truth). | `record_type` (MX/TXT/CNAME), `host`, `value`, `purpose` (`dkim`\|`spf`\|`dmarc`\|`mx`\|`mailfrom`), `status` (`pending`\|`ok`\|`mismatch`), `observed_value`, `last_checked` |
| `everjust.mail.account` | **The mailbox / identity spine.** A person, a role, or an agent sends+receives as this. | `name`, `email` (unique per company), `account_type` (`human`\|`shared`\|`agent`), `user_id` (owner, for human), `member_ids` (for shared), `domain_id` (**required — the sending identity**), `signature`, `folder_ids` |
| `everjust.mail.folder` | System folders auto-created per account. | `folder_type` (`inbox`\|`sent`\|`drafts`\|`spam`\|`archive`\|`trash`\|`custom`) |
| `everjust.mail.entry` | **Per-mailbox state** for a `mail.message` (read/star/trash + threading). Keeps webmail state OFF business chatter. | `account_id`, `folder_id`, `message_id` (→ `mail.message`), `thread_root` (References-root; the conversation key — **NOT** `mail.message.parent_id`), `is_read`, `is_starred`, `is_trashed`, `received_at` |
| `everjust.mail.suppression` | Addresses we must NOT send to (SES bounce/complaint ingest). | `email`, `reason` (`permanent_bounce`\|`complaint`\|`manual`), `scope`, `active`. Mirrored on write into native `mail.blacklist` (what mass_mailing enforces). |
| `everjust.mail.inbound.seen` | Atomic inbound dedupe on the AWS-immutable message id. **Internal — never touch.** | `aws_id` (unique) |

Three account types, one meaning each:
- **human** — owned by exactly one `user_id`.
- **shared** — role mailbox; has `member_ids`.
- **agent** — bound to a bot user. The mailbox row (`account_type='agent'`) is CONSUMED
  here; the canonical agent actor (its `res.users`, `everjust.agent` config) is owned by
  the merge/agent program — see [[everjust-agent-mcp]]. This module creates nothing
  canonical for an agent.

### The SEND path (and its hard gates)

Composing is `everjust.mail.account.compose_send(account_id, to, subject, body)` (an
`@api.model` method on the `everjust_mail_ui` extension). It persists a `mail.message`,
files a **Sent** `everjust.mail.entry`, then hands off to `_ui_transport_send`, which
enforces IN ORDER:

1. **Verified identity** — `account.domain_id.is_sendable` must be True (i.e.
   `verification_state=='verified'`). Else `{"queued": False, "delivery": "blocked"}`.
2. **300 sends / hour / account** — counts Sent entries in the last hour. Over cap →
   `{"queued": False, "delivery": "rate_limited"}`.
3. **Suppression + blacklist** — every recipient is checked against
   `everjust.mail.suppression` (this company) AND active `mail.blacklist`; suppressed
   recipients are DROPPED. If none survive → `{"queued": False, "delivery": "suppressed"}`.
4. **Transport** — native `ir.mail_server._find_mail_server(from_filter)` selects the
   tenant's SES SMTP server by `from_filter`; if none matches →
   `{"queued": False, "delivery": "no_transport"}`.
5. Creates a `mail.mail` (`state='outgoing'`, `mail_server_id=server`), calls
   `mail.send(raise_exception=False)`, returns `{"queued": True, "delivery": <mail.state>,
   "recipients": N, "suppressed": M?}`.

The `compose_send` return is `{"ok": True, "entry_id", "message_id", **<transport result>}`
on success, or `{"ok": False, "error": "..."}` on an access/parse failure BEFORE
anything is persisted. **You must read the transport keys** (`queued`, `delivery`) — see
Pitfalls. SES creds never live in this method; they're in the `ir.mail_server` row,
IAM-scoped to that one identity.

**If you're connected via `everjust_agent_mcp`, call the dedicated `mail_send` tool** —
`{name: "mail_send", arguments: {account_id, to, subject, body|body_html, cc?, bcc?,
in_reply_to?, confirm: true}}` — it's a thin wrapper over `compose_send` with the exact
same contract. `in_reply_to` there is an `everjust.mail.entry` id (from `search` on that
model), not a `mail.message` id. As of MCP server v1.4.0, `mail.mail` and `mail.message`
are **hard-blocked** from the generic `create`/`update`/`call` tools for exactly the
reason in Pitfall 1 below — `mail_send` is the only path left, by design.

Also present: `_cron_canary_roundtrip` on `everjust.mail.account` — a scheduled
send→SES→SNS→backend→deliver health check. Ships DISABLED; a no-op unless
`everjust_mail.canary_account` names a real mailbox. Do not repurpose it as a send API.

### INBOUND is an HMAC bridge (don't touch)

Inbound is NOT something you drive from the ORM. External flow:
`MX → SES receipt rule → SNS → everjust-mail FastAPI backend → HMAC-SHA256 POST →
tenant /everjust_mail/inbound → everjust.mail.account._deliver_inbound`. That handler
matches To/Cc/Delivered-To/X-Original-To/X-Forwarded-To against account emails, creates
one `mail.message` (`author_id=False`) + Inbox `everjust.mail.entry` per match, and
pushes an `everjust_mail/new` bus event. `everjust.mail.inbound.seen._seen(aws_id)`
arbitrates at-least-once dedupe atomically.

As an operating agent: **read** the Inbox entries `_deliver_inbound` produced; do NOT
call `_deliver_inbound`/`_seen` yourself and do NOT fabricate inbound by inserting
`mail.message`/entries. To test the loop end-to-end, send a mail to the address and let
the real bridge file it (that is exactly what the canary does).

## Recipes

Route each of these through the Odoo MCP (open an `env` on the tenant DB, then run the
call). See [[everjust-agent-mcp]] for opening the session.

### Check a domain's verification state (is it safe to send?)

```python
d = env["everjust.mail.domain"].search([("name", "=", "connectdomain.app")], limit=1)
d.read(["name", "domain_type", "provider", "verification_state", "dkim_selector"])
# is_sendable is the single gate the send path reads:
d.is_sendable            # True  ⇢ verification_state == "verified"
# Per-record DNS truth (why it isn't verified, if it isn't):
env["everjust.mail.domain.record"].search_read(
    [("domain_id", "=", d.id)],
    ["record_type", "host", "purpose", "status", "observed_value", "last_checked"])
```
If `verification_state != "verified"`, sending is blocked at gate 1 — do NOT try to
force-send. Publishing/fixing the DNS records is registrar work ([[godaddy-api]] / Route 53)
plus the provisioning runbook, not this model. Setting `verification_state='verified'`
manually is the last step of that runbook (EMAIL_INFRASTRUCTURE.md §7 step 9) and opens
the gate — only do it when the identity genuinely verified in SES.

### List a mailbox's entries (Inbox / Sent / unread)

```python
acct = env["everjust.mail.account"].search([("email", "=", "hello@connectdomain.app")], limit=1)
inbox = acct.folder_ids.filtered(lambda f: f.folder_type == "inbox")
# Entries are the per-mailbox state; join to mail.message for subject/from/body:
entries = env["everjust.mail.entry"].search_read(
    [("account_id", "=", acct.id), ("folder_id", "=", inbox.id), ("is_trashed", "=", False)],
    ["message_id", "is_read", "is_starred", "received_at", "thread_root"],
    order="received_at desc", limit=50)
# Subjects/authors live on the linked mail.message:
mids = [e["message_id"][0] for e in entries]
env["mail.message"].browse(mids).read(["subject", "email_from", "date"])
# Unread count:
env["everjust.mail.entry"].search_count(
    [("account_id", "=", acct.id), ("folder_id", "=", inbox.id), ("is_read", "=", False)])
```
The UI-friendly shortcut (owner/member context) is
`acct.get_mailbox_state()` and `acct.get_entries(folder_id, search=, offset=, limit=)`
on the `everjust_mail_ui` extension. Sent lives in the folder with
`folder_type == "sent"`. **A row in Sent means "we filed a copy," not "SES accepted it"**
(see Pitfalls). Flag entries with `acct.set_flags(entry_ids, {"is_read": True})` (also
supports `is_starred`, `is_trashed`).

### Compose / send safely and interpret the gate result

```python
res = env["everjust.mail.account"].compose_send(
    account_id=acct.id,
    to="alice@example.com, bob@example.com",   # cleaned + capped at 100 recipients
    subject="Hello from EVERJUST",
    body="Plain text or HTML; the mailbox signature is appended automatically.")

# ALWAYS interpret the result — do not assume success from ok=True alone:
if not res.get("ok"):
    fail(res["error"])                          # access/parse failure; nothing persisted
elif res.get("queued"):
    ok(f"sent to {res['recipients']} recipient(s); "
       f"{res.get('suppressed', 0)} suppressed; mail.state={res['delivery']}")
else:
    # queued is False -> a gate blocked it. res['delivery'] tells you which:
    #   "blocked"      -> sending identity not verified (fix the domain, don't retry)
    #   "rate_limited" -> 300/hr cap hit; wait and retry
    #   "suppressed"   -> every recipient is on suppression/blacklist
    #   "no_transport" -> no ir.mail_server matches the from_filter (identity misconfigured)
    handle(res["delivery"], res["error"])
```
`res["delivery"]` when queued is the `mail.mail.state` (`sent` / `outgoing` / `exception`).
`exception` means SES rejected it — inspect the `mail.mail` row (`failure_reason`) and,
if you must requeue, set its `state='outgoing'` and re-send (do NOT just re-file a Sent
entry). Prefer sending through `compose_send`; only fall back to a raw `mail.mail` when
mirroring the canary's self-send test, and even then select the server via
`ir.mail_server._find_mail_server(account.email)[0]` and read `mail.state` after send.

### Check suppression (is an address mailable?)

```python
addr = "bounced@example.com"
from_norm = addr.strip().lower()   # both stores are email_normalize'd
# The classified system-of-record (keeps SES reason + diagnostic):
env["everjust.mail.suppression"].search_read(
    [("company_id", "=", env.company.id), ("email", "=", from_norm)],
    ["email", "reason", "diagnostic_code", "scope", "active", "create_date"])
# The list mass_mailing / the send gate actually enforce (mirror):
env["mail.blacklist"].search_count([("email", "=", from_norm), ("active", "=", True)])
```
If either hits, the send path drops that recipient. To suppress manually, use the ingest
seam (it upserts AND mirrors to `mail.blacklist` atomically) rather than writing the row
raw:
```python
env["everjust.mail.suppression"]._ingest([{"email": addr, "reason": "manual"}])
```
Bounces/complaints arrive automatically via the backend's HMAC `/everjust_mail/bounce`
→ `_ingest` — you generally only add `reason="manual"` entries by hand.

## Pitfalls

1. **Never write `mail.mail` (or `mail.message`) directly to "send."** Sending goes through
   `compose_send` → `_ui_transport_send`, which enforces the verified-identity / 300-hr /
   suppression gates and selects the IAM-scoped SES server by `from_filter`. A hand-rolled
   `mail.mail` bypasses every gate — it can mail a suppressed address, send from an
   unverified identity, or pick the wrong (or no) transport. It can also **actually
   deliver and still be permanently invisible in the mailbox UI**: the webmail Sent/Inbox
   view is driven by `everjust.mail.entry` rows (per-mailbox: `account_id`, `folder_id`,
   `message_id`), not by `mail.message.model`/`res_id`. A raw `mail.mail` create typically
   sets neither — real send, zero trace in the UI, and the operator has no way to tell
   from the mailbox whether anything went out. Use `compose_send` (or the MCP `mail_send`
   tool) — it does both the send AND the entry-filing atomically. **This applies even if
   you're operating through a raw Odoo API key / direct JSON-RPC that bypasses the MCP
   entirely** (e.g. because some other guarded model needed it — `mail.template`,
   `ir.ui.view`, `appointment.type`) — that channel has none of `everjust_agent_mcp`'s
   guardrails or hard-blocks, so the discipline has to come from you, not the transport.
   Reach for `compose_send` specifically for mail, every time, regardless of which channel
   you're otherwise using for the rest of the task.

2. **A filed Sent entry is NOT proof of delivery.** `compose_send` files the Sent
   `everjust.mail.entry` BEFORE transport, so a Sent row exists even when the send was
   `blocked` / `rate_limited` / `suppressed`, or when SES returned `mail.state=exception`.
   Delivery is only asserted by the transport result (`queued: True` **and**
   `delivery in {"sent"}`) — and truly end-to-end only by the round-trip canary. Judge
   success from the returned dict, never from "there's a row in Sent."

3. **This is NOT Odoo Discuss / chatter.** Do not use `message_post`, `mail.thread`,
   `mail.channel`/Discuss, or `mail.message.parent_id` for threading. Webmail state is
   `everjust.mail.entry`; conversation grouping is `thread_root` (the RFC References root),
   not `parent_id`. Business chatter and webmail are deliberately separate.

4. **`is_sendable` is the only send gate for a domain — and it's `verified`-only.**
   `pending`/`verifying`/`failed`/`suspended` all block. Don't infer sendability from DNS
   records looking `ok`; read `domain.is_sendable` / `verification_state`.

5. **Everything is per-`company_id`.** Account email uniqueness, suppression, and blacklist
   are scoped to the tenant/company. When operating multi-tenant, confirm you're on the
   right tenant DB and `env.company` before searching (see [[everjust-agent-mcp]]).

6. **Don't touch the inbound machinery.** `_deliver_inbound`, `everjust.mail.inbound.seen`,
   `_seen`, and the `/everjust_mail/inbound` HMAC endpoint are the bridge's internals.
   Reading the entries they produce is fine; calling them or fabricating inbound rows is not.

7. **Attachments >~150 KB on inbound currently bounce** (SNS-inline, no S3Action —
   EMAIL_INFRASTRUCTURE.md §9-1). Don't assume large inbound attachments arrived; verify
   the entry exists.

8. **Suppress via `_ingest`, not a raw create.** A raw `everjust.mail.suppression` row
   won't be mirrored into `mail.blacklist`, so mass_mailing won't honor it. `_ingest`
   does the upsert + mirror atomically and is idempotent.

9. **Don't blast bulk from here.** Mass mailing is gated and its bulk-send infrastructure
   is unbuilt (EMAIL_INFRASTRUCTURE.md §6). Single/low-volume sends via `compose_send`
   only.
