---
name: everjust-mass-mailing
description: Operate the "Email Marketing" (mass_mailing) app of an everjust.app Odoo tenant via the MCP/ORM — build a mailing list, add/import contacts, draft a campaign, send a test, schedule/launch a blast, and read per-recipient results (opens/clicks/bounces). Use when the task is bulk/campaign email on an everjust tenant (mailing.mailing / mailing.list / mailing.contact / mailing.trace, UTM campaigns, link tracking), NOT a one-off transactional send (that is [[everjust-mail-ops]] compose_send). CRITICAL: mass mailing rides the SAME per-tenant SES verified-domain transport, suppression (mail.blacklist), and ACCOUNT-WIDE SES reputation as everjust_mail — the bulk-send safety gates (warmup, complaint auto-pause, dispatcher) are UNBUILT, so real blasts are gated: draft/list/test freely, but confirm with a human before action_send on a live list. Cross-references [[everjust-mail-ops]], [[everjust-platform]], [[everjust-agent-mcp]].
---

# EVERJUST Mass Mailing — Agent Skill

Operate the **Email Marketing** application (`mass_mailing` + `mass_mailing_crm`,
`link_tracker`, `utm`) of an everjust.app Odoo tenant as a running agent: manage
mailing lists and contacts, compose and A/B a campaign, send a test, schedule or
launch a blast, and read per-recipient delivery/engagement traces — all through
the Odoo MCP (`search`, `get`, `create`, `update`, `find`, `call`,
`describe_model`; see [[everjust-agent-mcp]] for the toolset and how to open a
session against the right tenant DB).

This app is **stock Odoo 19 `mass_mailing`** — there is no `everjust_mail_mass`
addon (it deliberately does not exist yet). What is everjust-specific is the
**transport underneath it**: bulk uses the same per-tenant SES `ir.mail_server`,
the same `mail.blacklist` suppression, and the same **account-wide** SES
reputation as the native webmail. So the models are vanilla, but the operating
rules are not. Canonical infra reference:
`/Users/cloudaistudio/Desktop/ww.everjust.app/docs/EMAIL_INFRASTRUCTURE.md` §6
and `docs/MAIL_MASS_MAILING_REVIEW.md`.

## When to use this skill

- **Bulk / campaign email** to a list of recipients on an everjust tenant:
  build a `mailing.list`, add/import `mailing.contact`s, draft a `mailing.mailing`,
  send a **test**, then schedule or launch.
- **Read campaign results** — per-recipient `mailing.trace` (delivered / opened /
  clicked / bounced / replied), aggregate ratios, `link.tracker` click counts.
- **Group campaigns under a UTM** — create/attach a `utm.campaign`, source, medium.
- **Target a CRM segment** (`mass_mailing_crm`) — a mailing whose recipient model
  is `crm.lead` instead of `mailing.list`/`mailing.contact`.
- **Manage opt-out / blacklist hygiene** on a list before a send.

**Do NOT use this skill for**, and switch to the sibling if the task is really:
- A **single or low-volume transactional send** as a mailbox address (e.g. reply
  to a customer, send an invite) — that is `everjust.mail.account.compose_send`,
  see **[[everjust-mail-ops]]**. Do not build a one-recipient `mailing.mailing`.
- **Odoo Discuss / chatter / `message_post`** — unrelated (see [[everjust-mail-ops]]).
- **Sending-domain verification, DKIM/DNS, or provisioning a new identity** — that
  is the transport layer ([[everjust-mail-ops]] + EMAIL_INFRASTRUCTURE.md §7),
  not this app. This skill assumes the tenant's sending domain is already
  `verified` and its `ir.mail_server` exists.
- **Firing a real blast when the human hasn't approved it.** See the gate below.

## The one gate you must respect (read before any send)

Mass mailing on everjust rides shared, reputation-sensitive infrastructure and
the **bulk safety layer is not built yet** (EMAIL_INFRASTRUCTURE.md §6,
MAIL_MASS_MAILING_REVIEW.md). Specifically:

1. **SES reputation is ACCOUNT-WIDE.** One bad list (bounces/complaints) can pause
   sending for **every** everjust tenant — customagents.io, tcstartupweek.com,
   everjust.app all share the one SES account (us-east-2). A blast to a dirty
   list is not a local mistake; it is a platform-wide outage risk.
2. **SES production access was granted for TRANSACTIONAL mail** (`MailType=TRANSACTIONAL`),
   not bulk. The five bulk gates — dispatcher `/send`, `everjust.email.warmup`
   ceiling, complaint auto-pause circuit-breaker, the `everjust_mail_mass` glue,
   and per-tenant SES config-set event destinations — are **UNBUILT**.
3. So: **draft, list-manage, import, and send TESTS freely.** But treat
   `action_send_mail` / `action_launch` / `action_put_in_queue` on a real list as
   a **human-gated** action — confirm explicitly with the operator, verify the
   list is clean (opt-out/blacklist scrubbed) and small, before you launch. The
   MCP `call` tool already requires `confirm: true` for non-read methods; do not
   set it on a launch without human sign-off.

This does not block you from operating the app — you can do everything up to the
actual blast, and you can read results all day. It blocks you from turning a
draft into account-wide reputation damage.

## Where it's installed (as of 2026-07-05)

Full stack (`mass_mailing`, `mass_mailing_crm`, `link_tracker`, `utm`) installed
on: **connectdomain**, **tcstartupweek**, **headsup**, **riftline-labs**.
`weldon` has only `utm` (a transitive dep). `burekraft-llc` and
`trust-works-company` have **none** — do not assume the models exist; check
`ir.module.module` state first. Always confirm you are on the intended tenant DB
and `env.company` before acting (see [[everjust-platform]] — one Postgres DB per
tenant, everything per-`company_id`).

## Key models (real fields, from the live `connectdomain` tenant)

Everything is stock Odoo `mass_mailing`; these are the fields an operating agent
actually touches. (Introspect any of them live with the MCP `describe_model`.)

| Model | Role | Key fields |
|---|---|---|
| `mailing.mailing` | **A campaign** — one email blast (subject/body → a recipient set). | `subject` (**required**), `body_arch`/`body_html`, `email_from`, `reply_to`, `reply_to_mode` (`update`\|`new`), `mailing_type` (only `mail`), `state` (`draft`\|`in_queue`\|`sending`\|`done`), `schedule_type` (`now`\|`scheduled`), `schedule_date`, `mailing_model_id`/`mailing_model_name` (recipient model: `mailing.list`, `mailing.contact`, or `crm.lead`), `contact_list_ids` (m2m → `mailing.list`, when list-based), `mailing_domain` (extra recipient filter), `use_exclusion_list`, `campaign_id`/`source_id`/`medium_id` (UTM), `mail_server_id` (**leave NULL** — see pitfalls), `ab_testing_enabled`/`ab_testing_pc`, plus computed counters `total`/`sent`/`delivered`/`opened`/`clicked`/`bounced`/`failed` and `*_ratio`, `mailing_trace_ids`. `use_leads`/`crm_lead_count` from `mass_mailing_crm`. |
| `mailing.list` | **An audience** — a named set of contacts. | `name` (**required**), `contact_ids` (m2m → `mailing.contact`), `subscription_ids` (→ `mailing.subscription`), `is_public`, and computed hygiene: `contact_count`, `contact_count_email`, `contact_count_opt_out`, `contact_count_blacklisted`, `contact_pct_opt_out`/`_blacklisted`/`_bounce`. |
| `mailing.contact` | **A recipient row** (list-scoped, distinct from `res.partner`). | `name`, `first_name`, `last_name`, `email`, `email_normalized`, `company_name`, `country_id`, `list_ids` (m2m → `mailing.list`), `subscription_ids`, `opt_out` (per-contact global), `is_blacklisted` (computed from `mail.blacklist`), `message_bounce`, `tag_ids`. |
| `mailing.subscription` | The list↔contact join **with opt-out state** (this is the real M2M model; the old name `mailing.contact.subscription` does NOT exist). | `contact_id`, `list_id`, `opt_out`, `opt_out_reason_id` (→ `mailing.subscription.optout`), `opt_out_datetime`, `is_blacklisted`, `message_bounce`. |
| `mailing.trace` | **Per-recipient result** of one mailing (the analytics spine). | `mass_mailing_id`, `email`, `model`/`res_id` (the recipient record), `trace_type` (`mail`), `trace_status` (`outgoing`\|`process`\|`pending`(=queued/sent-to-SMTP)\|`sent`(=delivered)\|`open`\|`reply`\|`bounce`\|`error`\|`cancel`), `failure_type` (e.g. `mail_bounce`, `mail_bl`, `mail_optout`, `mail_smtp`), `failure_reason`, `sent_datetime`/`open_datetime`/`reply_datetime`, `mail_mail_id`, `links_click_ids`. |
| `link.tracker` (+`.click`, `.code`) | A tracked link inside a mailing → click analytics; UTM-tagged. | `url`, `short_url`, `code`, `count` (clicks), `mass_mailing_id`, `campaign_id`/`source_id`/`medium_id`. |
| `utm.campaign` / `utm.source` / `utm.medium` | Grouping + attribution for mailings and links. | `utm.campaign`: `name`, `title` (**required**), `user_id`, `stage_id`, `tag_ids`, aggregate ratios. `utm.source`/`utm.medium`: `name`. |

Note the trace-status vocabulary trap: `pending` means **handed to SMTP**, `sent`
means **delivered** (SES accepted for delivery). They are not intuitive — read
them off the selection above, not from the English label.

## Recipes

Route each through the Odoo MCP (`search`/`get`/`create`/`update`/`find`/`call`).
Domains are Odoo triple-lists. See [[everjust-agent-mcp]] for opening the session.

### 1. Build a list and add contacts

```jsonc
// Create the audience:
create("mailing.list", { "name": "Connect Domain — waitlist" })
// → returns list_id, e.g. 7

// Add contacts (one call each, or loop). email is the identity; list_ids links it:
create("mailing.contact", {
  "name": "Ada Lovelace", "email": "ada@example.com",
  "company_name": "Analytical Co", "list_ids": [[6, 0, [7]]]   // 6,0,[ids] = replace links
})
// Bulk import: create many contacts with the same list_ids one-liner, OR add
// existing contacts to a list via the list side:
update("mailing.list", [7], { "contact_ids": [[4, <contact_id>]] })  // 4,id = link one
```

Before you send to a list, **inspect its hygiene** — do not blast a dirty list:

```jsonc
get("mailing.list", [7], [
  "name","contact_count","contact_count_email",
  "contact_count_opt_out","contact_count_blacklisted",
  "contact_pct_opt_out","contact_pct_blacklisted","contact_pct_bounce"])
```

High `contact_pct_bounce`/`_blacklisted` is a reputation red flag (see the gate) —
clean it before launching. Contacts already on `mail.blacklist` or `opt_out=True`
are dropped at send automatically, but a list *full* of them still signals a bad
source. Cross-check suppression the same way [[everjust-mail-ops]] does
(`mail.blacklist` is the shared list both apps enforce).

### 2. Draft a campaign (list-based) — do NOT send yet

```jsonc
// mailing_model_id must reference the ir.model for the recipient model.
find("ir.model", "mailing.list")   // → [[id, "Mailing List"]]  resolve once
create("mailing.mailing", {
  "subject": "Bring your own domain — automatically",
  "email_from": "Connect Domain <hello@connectdomain.app>",  // MUST be on the verified sending domain
  "reply_to_mode": "new",
  "reply_to": "hello@connectdomain.app",
  "mailing_model_id": <id of mailing.list>,
  "contact_list_ids": [[6, 0, [7]]],
  "body_arch": "<p>Hello %(first_name)s, ...</p>",   // body_arch is the editable source; body_html is rendered
  "schedule_type": "now"
  // mail_server_id: OMIT — default selection picks the tenant SES server by from_filter
})
```

`email_from` **must** match the tenant's verified sending domain (its
`ir.mail_server.from_filter`, e.g. `connectdomain.app`) or SES rewrites/rejects it
(EMAIL_INFRASTRUCTURE.md §6: gmail-From authors get rewritten toward
`noreply@<domain>` — deliverable but not the From they expect; dry-run one first).
Read the tenant's server before drafting:
`search("ir.mail_server", [], ["name","from_filter","active"])`.

To target a **CRM segment** instead (`mass_mailing_crm`): set
`mailing_model_id` → the `crm.lead` model, leave `contact_list_ids` empty, and use
`mailing_domain` as the lead filter, e.g.
`"mailing_domain": "[('stage_id.name','=','New')]"`, `"use_leads": true`.

### 3. Send a TEST, then read the render

Always test before a real send — this mails only the addresses you pass, and files
a test `mailing.trace` (`is_test_trace=True`), not a blast:

```jsonc
call("mailing.mailing", "action_test",
     ids=[<mailing_id>],
     kwargs={ "context": { "default_email_to": "you@connectdomain.app" } },
     confirm=true)
// Odoo 19 test wizard is mailing.mailing.test; the simplest path is the action
// above with default_email_to in context. Then confirm what actually happened:
get("mailing.mailing", [<mailing_id>], ["state","total","warning_message"])
```

Inspect the resulting `mail.mail` state exactly as [[everjust-mail-ops]] teaches —
a filed trace is not proof SES accepted it. If the test bounces or errors, fix
before you touch the real send.

### 4. Schedule or launch a blast — HUMAN-GATED

Only after (a) the human approved, (b) the list is clean, (c) the test rendered and
delivered. Two paths:

```jsonc
// (a) Schedule for later — sets schedule_date and puts it in the queue:
update("mailing.mailing", [<mailing_id>],
       { "schedule_type": "scheduled", "schedule_date": "2026-07-10 14:00:00" })
call("mailing.mailing", "action_schedule", ids=[<mailing_id>], confirm=true)

// (b) Send now — enqueue; the mass_mailing queue cron (active) processes it:
call("mailing.mailing", "action_put_in_queue", ids=[<mailing_id>], confirm=true)
// action_launch / action_send_mail are the "send immediately" variants.
```

After launch, poll the campaign state and counters rather than assuming it sent:

```jsonc
get("mailing.mailing", [<mailing_id>], [
  "state","sent","delivered","opened","clicked","bounced","failed",
  "received_ratio","opened_ratio","bounced_ratio","next_departure"])
```

`state` walks `draft → in_queue → sending → done`. Sending is asynchronous via the
queue cron; `done` with `bounced`/`failed` > 0 needs follow-up (recipes below).

### 5. Read per-recipient results and click analytics

```jsonc
// Every recipient's outcome for a mailing:
search("mailing.trace",
       [["mass_mailing_id","=",<mailing_id>]],
       ["email","trace_status","failure_type","failure_reason",
        "sent_datetime","open_datetime","reply_datetime"],
       order="sent_datetime desc")

// Just the failures/bounces to investigate (and feed suppression):
search("mailing.trace",
       [["mass_mailing_id","=",<mailing_id>],
        ["trace_status","in",["bounce","error"]]],
       ["email","failure_type","failure_reason"])

// Link click analytics for the campaign:
search("link.tracker",
       [["mass_mailing_id","=",<mailing_id>]],
       ["url","short_url","count"], order="count desc")
```

To **retry** just the failed recipients after fixing the cause:
`call("mailing.mailing", "action_retry_failed", ids=[<mailing_id>], confirm=true)`.
To **cancel** a queued/sending mailing:
`call("mailing.mailing", "action_cancel", ids=[<mailing_id>], confirm=true)`.

### 6. Group under a UTM campaign (attribution)

```jsonc
create("utm.campaign", { "name": "Launch Q3", "title": "Launch Q3" })  // title required
update("mailing.mailing", [<mailing_id>], {
  "campaign_id": <campaign_id>,
  "source_id": <utm.source id>,   // find/create utm.source by name
  "medium_id": <utm.medium id>    // usually "Email"
})
// Links inside the body inherit these; convert_links() (called at send) tracks them.
```

## Pitfalls (everjust-specific)

1. **The account-wide reputation gate is the whole ballgame.** A blast to a dirty
   or large list can pause SES for **every** everjust tenant (§6). Bulk safety
   (warmup, complaint auto-pause, dispatcher) is UNBUILT. Never fire
   `action_send_mail`/`action_launch`/`action_put_in_queue` on a real list without
   explicit human approval and a clean, small list. Drafting, list-management,
   imports, and **tests** are always fine.

2. **This is not the tool for a one-off send.** A single-recipient `mailing.mailing`
   is the wrong shape — use `everjust.mail.account.compose_send` ([[everjust-mail-ops]]).
   Mass mailing is for lists/segments; the webmail is for interactive/transactional.

3. **`email_from` must be on the verified sending domain.** It has to satisfy the
   tenant `ir.mail_server.from_filter` (e.g. `connectdomain.app`). A gmail/other
   From gets rewritten toward `noreply@<domain>` at send (deliverable, wrong From)
   — the three admins who log in with gmail addresses trip this by default (§6).
   Set `email_from` to a real `hello@`/`sam@`/`weldon@<domain>` address explicitly,
   and dry-run one gmail-authored mailing before relying on the rewrite.

4. **Leave `mail_server_id` NULL.** All live mailings have it unset, and
   `mass_mailing.mail_server_id` is unset, so default selection picks the tenant's
   SES server by `from_filter` — the correct, IAM-scoped identity. Pinning a wrong
   `mail_server_id` can send from an identity SES won't authorize (see the
   2026-07-04 incident in EMAIL_INFRASTRUCTURE.md §8: a mismatched IAM key → 554).

5. **Suppression is shared and mirror-driven.** `mailing.mailing` enforces native
   `mail.blacklist` pre-send; bounces/complaints flow in automatically via the
   everjust suppression loop (`everjust.mail.suppression._ingest` → write-through to
   `mail.blacklist`). To suppress an address by hand, go through `_ingest`
   ([[everjust-mail-ops]]), **not** a raw `mail.blacklist` create and **not** a raw
   `mailing.contact.opt_out` toggle — those don't do the atomic mirror.

6. **Trace-status wording lies.** `pending` = handed to SMTP, `sent` = *delivered*.
   Judge success by `trace_status='sent'` (or `open`/`reply`), and treat `pending`
   as "left the queue, not confirmed delivered." `bounce`/`error` need action.

7. **Sending is async — `state` and counters are the truth, not the return value.**
   `action_put_in_queue`/`action_schedule` only enqueue; the `mass_mailing` queue
   cron (active on connectdomain) processes later. Poll `state`
   (`draft→in_queue→sending→done`) and the `sent`/`delivered`/`bounced` counters;
   don't assume the launch call means it went out.

8. **Not installed everywhere.** Only connectdomain/tcstartupweek/headsup/riftline-labs
   have the full app; some tenants have none. Check `ir.module.module` state before
   assuming `mailing.mailing` exists, and confirm the tenant DB + `env.company`
   first (per-tenant isolation — [[everjust-platform]]).

9. **`web.base.url` may be off-domain for tracking/unsubscribe links.** On
   connectdomain it is `https://connectdomain.everjust.app`, so unsubscribe and
   click-tracking links render on that host, not a `connectdomain.app` surface
   (EMAIL_INFRASTRUCTURE.md §3). One-click List-Unsubscribe is provided by native
   `mass_mailing` — do not strip it; the SES re-route must forward full MIME.

10. **`mailing.subscription` is the real join model** (opt-out lives there), not the
    nonexistent `mailing.contact.subscription`. Global opt-out is
    `mailing.contact.opt_out`; per-list opt-out is `mailing.subscription.opt_out`.
