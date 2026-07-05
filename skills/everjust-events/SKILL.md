---
name: everjust-events
description: Operate the Events app of a live everjust.app tenant (create/publish an event, take & manage attendee registrations, wire registrations to CRM leads, schedule attendee email/SMS reminders, inspect seats/registration state) via the Odoo MCP/ORM. Use when the task is to set up or edit an event on an everjust.app workspace, register/confirm/cancel an attendee, turn registrations into crm.leads, add or diagnose a registration confirmation/reminder email or SMS, check seat availability, or reason about which event modules are installed on a tenant. This is STOCK Odoo event/website_event/event_crm/event_sms — NO custom everjust event addon — but website_event_track (event.track / speakers / agenda) is installed on ONLY some tenants, and event_sms reminders ride the per-company everjust SMS gateway swap. Cross-references [[everjust-platform]], [[everjust-agent-mcp]]; SMS via [[everjust-sms]], leads via native CRM, event mail is stock event.mail (NOT the [[everjust-mail-ops]] webmail stack).
---

# EVERJUST Events — Agent Skill

Operate the **Events app** of a live everjust.app tenant as an agent: create and publish an
event, take/confirm/cancel attendee registrations, turn registrations into CRM leads, schedule
attendee reminder emails/SMS, and read back seats/registration state — all through the Odoo
MCP / ORM (`search`, `get`, `create`, `update`, `call`, `describe_model`; see
[[everjust-agent-mcp]] for opening the session against the right tenant DB).

The crucial everjust fact: **there is NO custom everjust event addon.** This app is **stock
Odoo** — `event`, `website_event`, `event_crm`, `event_sms` — installed on tenants that host a
public website. So read the field set from the live model (`describe_model` /
`fields_get`), not from a custom addon. The everjust-specific things you must know are (1)
**which optional event sub-modules are installed varies per tenant** — most notably
`website_event_track` (speakers / agenda / `event.track`) is installed on **only some** tenants,
so `event.track` is a `KeyError` elsewhere; and (2) **`event_sms` reminders ride the per-company
everjust SMS gateway swap** — the reminder's `sms.sms` is routed by
`res.company._get_sms_api_class()` (TextBee / Ringover / Twilio / IAP), exactly as in
[[everjust-sms]], not by Odoo IAP by default.

## When to use this skill

- **Create / publish an event** — a new `event.event` (dates, timezone, seats cap, organizer,
  website menu), optionally from an `event.type` template, and publish it to the tenant website.
- **Take or manage a registration** — create an `event.registration`, confirm it, mark
  attended, or cancel; look up an attendee's registrations; read a registration's answers.
- **Wire registrations to CRM** — configure an `event.lead.rule` so registrations spawn
  `crm.lead`s (this is `event_crm`), or inspect the leads a registration produced.
- **Schedule attendee comms** — add/read `event.mail` rows (per-event) or `event.type.mail`
  (per-template) that send a confirmation/reminder as **email OR SMS** at an offset from
  sub/event-start (this is `event_sms` for the SMS variant).
- **Inspect seats / registration state** — is the event sold out, how many `open` vs `done` vs
  `draft`/`cancel`, is the scheduler firing.
- **Diagnose** — an event not showing on the website, a reminder that never sent, an
  `event.track`/speaker model that doesn't exist on this tenant.

**Do NOT use this skill for**, and stop if the task is really:
- **Talks / speakers / agenda (`event.track`, `event.track.stage`, `event.track.tag`) or
  exhibitor/booth/live features** — those come from `website_event_track` /
  `website_event_exhibitor` / `event_booth`, which are **installed only on some tenants**
  (see the install matrix). On a tenant without them, `env["event.track"]` raises `KeyError`.
  Check install state first; don't assume the agenda exists.
- **Paid tickets / e-commerce checkout** — `event_sale` / `website_event_sale` are
  **uninstalled** on the tenants below. Registration here is free RSVP only; there is no
  `sale.order` behind a ticket. Don't reach for `event.event.ticket` price logic.
- **The everjust webmail stack** — the event confirmation/reminder EMAIL is a stock
  `mail.template` fired by the `event.mail` scheduler, NOT the `everjust.mail.*` product. Do
  not route it through [[everjust-mail-ops]] or expect its send-gates/suppression to apply.
- **Hand-sending the reminder SMS** — the reminder's `sms.sms` is created by the `event.mail`
  scheduler and routed by the company's SMS provider swap. To reason about *whether/where* an
  event SMS actually goes, use [[everjust-sms]] (resolve `_get_sms_api_class`). Never POST the
  gateway yourself.
- **CRM pipeline work beyond lead creation** — moving a lead through stages, activities on the
  lead, conversion — that's native CRM. `event_crm` only *creates* the `crm.lead` (per rule);
  the registration keeps the link in `registration.lead_ids`.

You reach the ORM through the platform's Odoo MCP tools — see [[everjust-agent-mcp]] for how to
open an `env`/session against the right tenant DB and run `search`/`get`/`create`/`update`/`call`.
Every recipe below is expressed through that toolset.

## Where it's installed (verified live, 2026-07)

One tenant DB per customer; the event modules install with the tenant's public-website theme
(`website_connectdomain` / `website_tcsw` depend on `website_event`; see [[everjust-platform]]).
Verified live via `ir_module_module.state`:

| Tenant DB | event | website_event | event_crm | event_sms | website_event_track (⇒ `event.track`) |
|---|---|---|---|---|---|
| `connectdomain` | ✅ | ✅ | ✅ | ✅ | **uninstalled** (no `event.track`) |
| `tcstartupweek` | ✅ | ✅ | ✅ | ✅ | **✅ installed** (has `event.track`) |
| `headsup` | ✅ | ✅ | ✅ | ✅ | **uninstalled** |
| `weldon` | ✅ | ✅ | ✅ | ✅ | **uninstalled** |
| `control` | (not an event tenant) | — | — | — | — |

`event_sale`, `website_event_sale`, `event_booth*`, `website_event_exhibitor`,
`website_event_track_live`, `website_event_meet` were **uninstalled** on all of the above at
last check. Before operating, confirm on your target DB (see the first recipe) — on a tenant
without a module, `env["<model>"]` raises `KeyError`. `event.track` is the one that bites most.

## Architecture (the model map)

Everything is per-tenant DB and implicitly per-`company_id`. Real fields below are from
`fields_get` on the live `connectdomain` DB (Odoo 19). **Note the version-specific gaps** — this
build has NO `event.registration.mobile`, NO `date_open`, NO `event.event.auto_confirm`,
NO `seats_expected`; read fields live, don't assume older-Odoo shapes.

| Model | Role | Key fields (real, confirmed live) |
|---|---|---|
| `event.event` | **The event.** Dates + seats + website exposure. | `name`*, `event_type_id` (→`event.type`, a template that copies defaults on change), `date_begin`* / `date_end`* (**Datetime, UTC-naive**), `date_tz`* (**timezone the wall-clock is shown in — required**), `seats_limited` (bool, req), `seats_max` (cap, only enforced when `seats_limited`), `seats_available` / `seats_taken` / `seats_reserved` (**computed**), `stage_id` (→`event.stage`, kanban lifecycle: New→…→Ended), `kanban_state` (`normal`/`done`/`blocked`/`cancel`), `user_id` (responsible), `organizer_id` (→`res.partner`), `address_id` (→`res.partner`, venue), `is_published` (**bool — must be True to show on `/event`**), `website_menu` (bool — creates the per-event sub-menu/agenda pages), `website_id`, `tag_ids` (→`event.tag`), `question_ids` (→`event.question`, registration form questions), `event_mail_ids` (→`event.mail`, the comms schedule), `registration_ids` (→`event.registration`), `badge_image` |
| `event.registration` | **One attendee's RSVP.** Auto-confirmed on create in this build. | `event_id`* (→`event.event`), `partner_id` (→`res.partner`), `name`, `email`, `phone`, `company_name`, `state` (**`draft`/`open`/`done`/`cancel`** — see below; **default `open`**), `event_ticket_id` (→`event.event.ticket`), `date_closed` (attended-at), `barcode`, `registration_answer_ids` (→`event.registration.answer`, form answers), `lead_ids` (**→`crm.lead` m2m, set by `event_crm`**), `visitor_id` (→`website.visitor`), `utm_campaign_id`/`utm_source_id`/`utm_medium_id`, `company_id`. **No `mobile`, no `date_open` in this build.** |
| `event.type` | **A reusable event template.** Selecting it on an event copies its mail scheme, questions, tz, seat cap. | `name`*, `has_seats_limitation` (bool), `seats_max`, `default_timezone`, `event_type_mail_ids` (→`event.type.mail`, the reminder scheme copied onto new events), `question_ids`, `tag_ids`, `note` (Html) |
| `event.mail` | **A scheduled comm on ONE event** (confirmation / reminder), email OR SMS. The scheduler cron fires these. | `event_id`*, `interval_nbr` (int), `interval_unit`* (`now`/`hours`/`days`/`weeks`/`months`), `interval_type`* (`after_sub`/`before_event`/`after_event_start`/`after_event`/`before_event_end`), `notification_type` (**`mail`\|`sms`** — the `sms` option is what `event_sms` adds), `template_ref`* (**Reference: `mail.template,<id>` OR `sms.template,<id>`**), `mail_state` (`running`/`scheduled`/`sent`/`error`/`cancelled`), `scheduled_date`, `mail_registration_ids` (→`event.mail.registration`, per-attendee send log), `mail_count_done`, `mail_done` |
| `event.type.mail` | Same shape as `event.mail` but on the **type template** — copied onto each new event of that type. | `event_type_id`*, plus `interval_*`, `notification_type`, `template_ref` (as above) |
| `event.lead.rule` | **`event_crm` rule** — turns registrations into `crm.lead`s. | `name`*, `lead_type`* (`lead`\|`opportunity`), `lead_creation_basis`* (`attendee`\|`order`), `lead_creation_trigger`* (**`create`\|`confirm`\|`done`** — WHEN in the registration lifecycle the lead is made), `event_id` / `event_type_ids` (scope; empty = all events), `event_registration_filter` (a domain, as text, on the registration), `lead_sales_team_id` (→`crm.team`), `lead_user_id` (→`res.users`), `lead_tag_ids` (→`crm.tag`), `active`, `company_id` |
| `event.stage` | Kanban lifecycle column for events. | `name`*, `sequence`, `fold`, `pipe_end` (marks the terminal/"ended" stage) |
| `event.event.ticket` | A ticket *type* on an event (free here — no `event_sale`). | `name`*, `event_id`*, `event_type_id`, `seats_max`, `seats_available`/`seats_used` (computed), `start_sale_datetime`/`end_sale_datetime` (registration window) |
| `event.track` | **Talk / session (speakers, agenda).** ⚠️ Exists ONLY where `website_event_track` is installed (`tcstartupweek` only, above). `KeyError` elsewhere. | (stock `website_event_track`; introspect on a tenant that has it — do not assume on the others) |

### `event.registration.state` — read the codes, not the labels

Selection is **`draft` / `open` / `done` / `cancel`**. In this build a new registration is created
directly in **`open`** (i.e. **auto-confirmed** — there is no `auto_confirm` toggle on the event).
Meaning:
- `open` = **confirmed / registered** (the normal "attending" state; this is what counts against seats).
- `done` = **attended** (checked in; `date_closed` set).
- `draft` = unconfirmed (rare here since default is `open`).
- `cancel` = cancelled (frees the seat).

Drive transitions with the registration methods, not a raw `state` write, so side effects and
seat computes fire: `action_confirm()` (→`open`), `action_set_done()` (→`done`, check-in),
`action_cancel()` (→`cancel`), `action_set_draft()` (→`draft`). Seat counters
(`seats_taken`/`seats_available`) are computed from `open`+`done` registrations.

### How `event_crm` fires (leads from registrations)

`event_crm` adds `registration.lead_ids` and evaluates every active `event.lead.rule` at the
lifecycle point named by the rule's `lead_creation_trigger` (`create` / `confirm` / `done`). The
hook is `event.registration._apply_lead_generation_rules()` (called by the framework on
create/state-change), which for each matching rule builds lead values
(`_get_lead_values`) and creates the `crm.lead`, linking it into `lead_ids`.
`lead_creation_basis='attendee'` → one lead per registration; `'order'` groups per order
(irrelevant without `event_sale` here). **On `connectdomain` there are currently ZERO lead rules**
— so registrations there create **no leads** until you add a rule. Add the rule; don't hand-create
`crm.lead`s and try to backfill `lead_ids`.

### How `event_sms` / `event.mail` reminders fire (and the gateway swap)

`event.mail` is the per-event comms schedule. `event_sms` adds `notification_type='sms'` and lets
`template_ref` point at an `sms.template` (instead of a `mail.template`). The **`Event: Mail
Scheduler` cron** (`ir.cron`, model `event.mail`, **active** on connectdomain) periodically calls
`event.mail.execute()`, which for each due row renders the template per registration and:
- **`notification_type='mail'`** → sends via the stock `mail.template` / `mail.mail` path (the
  tenant's outgoing `ir.mail_server`). This is NOT the `everjust.mail.*` webmail product.
- **`notification_type='sms'`** → creates `sms.sms` rows and sends them — which means the send is
  **routed by `res.company._get_sms_api_class()`**, i.e. the everjust SMS gateway swap
  (TextBee / Ringover / Twilio / IAP). So an event reminder SMS follows every rule in
  [[everjust-sms]]: provider `iap` may silently be TextBee, `sms_server` failures mean the
  gateway URL/key is missing, etc. **On `connectdomain` the SMS gateway is currently dormant**
  (`sms_provider='iap'`, no gateway URL) — an SMS reminder there would resolve to stock IAP and
  likely fail without credits. Resolve the provider (recipe 0 in [[everjust-sms]]) before relying
  on event SMS.

Timing: `interval_type` anchors the offset — `after_sub` (after each registration; use `now` for
"immediately on register", the classic confirmation), `before_event` (N units before
`date_begin`), `after_event`, etc. `mail_state` tells you if a row is `scheduled`/`sent`/`error`.

## Recipes

Route each call through the Odoo MCP against the tenant DB (open the session per
[[everjust-agent-mcp]]; pick the DB, e.g. `connectdomain`). Recipes use the MCP toolset
(`search`, `get`, `create`, `update`, `call`, `describe_model`); ORM `env[...]` forms are shown
where clearer.

### 0. First: confirm which event modules this tenant actually has

Don't assume `event.track`/tickets/booths exist. Check install state before touching those models.

```
search('ir.module.module',
       [['name','in',['event','website_event','event_crm','event_sms',
                      'website_event_track','event_sale','event_booth']]],
       ['name','state'])
# Or just probe the model you need:
describe_model('event.track')     # -> error/KeyError on connectdomain, headsup, weldon
```
`event.track`, speakers, agenda, and exhibitor/booth models only exist where
`website_event_track` / `website_event_exhibitor` / `event_booth` are installed (per the matrix,
`event.track` is `tcstartupweek` only). If the model isn't there, stop — that feature isn't on this
tenant; installing a module is platform-ops, not this skill.

### 1. Create and publish an event

```
eid = create('event.event', {
    'name': 'Connect Domain Office Hours — Live Q&A',
    'date_begin': '2026-07-20 17:00:00',   # UTC-naive
    'date_end':   '2026-07-20 18:00:00',   # UTC-naive
    'date_tz': 'America/Chicago',          # REQUIRED — the wall-clock display tz
    'seats_limited': True, 'seats_max': 100,
    'user_id': <responsible_user_id>,
    'organizer_id': <company_partner_id>,
    'is_published': True,                  # <- REQUIRED to appear on /event
    'website_menu': True,                  # generates the per-event sub-pages/agenda menu
})
# Optionally seed the comms schedule from a type instead (copies event.type.mail rows):
update('event.event', [eid], {'event_type_id': <event_type_id>})   # triggers onchange copy
```
`is_published=False` (the default) hides it from the public `/event` list even though it exists in
the backend. `date_tz` is required and governs how times render on the site — set it to the
audience's timezone; the stored datetimes stay UTC-naive.

### 2. Register an attendee (and read the outcome)

```
# Resolve/create the attendee partner (optional — email is enough):
pid = search('res.partner', [['email','=ilike','alice@example.com']], ['id'], 1)  # or create one
rid = create('event.registration', {
    'event_id': eid,
    'partner_id': pid,            # optional
    'name': 'Alice Doe',
    'email': 'alice@example.com',
    'phone': '+16125550100',
})
# In THIS build the registration is created directly in state 'open' (auto-confirmed).
get('event.registration', [rid], ['state','event_id','partner_id','email','lead_ids'])
```
Seats recompute automatically. If you ever get a `draft` registration and need to confirm it,
`call('event.registration','action_confirm',[rid])` — don't `update(...,{'state':'open'})`
(that skips the confirmation side effects, incl. the `after_sub` confirmation mail/SMS and lead
rules with trigger `confirm`). To check someone in: `call('event.registration','action_set_done',[rid])`.
To cancel (frees the seat): `call('event.registration','action_cancel',[rid])`.

### 3. Wire registrations → CRM leads (event_crm)

There are **no lead rules on `connectdomain` by default** — registrations won't create leads until
you add one. Create the rule; the framework fires it on the chosen trigger.

```
rule_id = create('event.lead.rule', {
    'name': 'Office Hours attendees → Sales leads',
    'lead_type': 'lead',
    'lead_creation_basis': 'attendee',       # one crm.lead per registration
    'lead_creation_trigger': 'create',       # fire as soon as they register (or 'confirm'/'done')
    'event_id': eid,                         # scope to this event (or use event_type_ids, or leave both empty for all)
    'lead_user_id': <salesperson_user_id>,   # optional owner
    'lead_sales_team_id': <crm_team_id>,     # optional team
    'lead_tag_ids': [(6,0,[<crm_tag_id>])],  # optional
    'active': True,
})
# New registrations now spawn a crm.lead; inspect the link on a registration:
get('event.registration', [rid], ['lead_ids'])
# Read the leads it produced:
search('crm.lead', [['id','in', <lead_ids>]], ['name','stage_id','email_from','phone','user_id'])
```
Moving that lead through stages / logging activities / converting is **native CRM**, not this
skill — do it on `crm.lead` directly (e.g. `update('crm.lead',[lid],{'stage_id':<id>})`,
`call('crm.lead','activity_schedule',...)`). Don't try to manufacture leads by writing
`registration.lead_ids` yourself; add the rule and let it run.

### 4. Schedule an attendee reminder — email OR SMS (event_sms)

`event.mail` rows drive the `Event: Mail Scheduler` cron. Confirmation = `after_sub` + `now`;
reminder = `before_event` + N units.

```
# Email confirmation, sent immediately on registration:
create('event.mail', {
    'event_id': eid,
    'interval_unit': 'now', 'interval_type': 'after_sub',
    'notification_type': 'mail',
    'template_ref': 'mail.template,17',       # a mail.template for model event.registration
})
# SMS reminder, 1 hour before the event  (this is the event_sms path):
create('event.mail', {
    'event_id': eid,
    'interval_nbr': 1, 'interval_unit': 'hours', 'interval_type': 'before_event',
    'notification_type': 'sms',
    'template_ref': 'sms.template,<id>',      # an sms.template for model event.registration
})
# Find usable templates first:
search('mail.template', [['model','=','event.registration']], ['name'])   # e.g. 'Event: Registration Confirmation', 'Event: Reminder'
search('sms.template',  [['model','=','event.registration']], ['name'])   # e.g. 'Event: Registration', 'Event: Reminder'
```
**Before you rely on the SMS reminder actually sending, resolve the tenant's SMS transport** —
`event_sms` hands off to `sms.sms`, which the everjust gateway swap routes. On `connectdomain`
the gateway is dormant (`sms_provider='iap'`, no gateway URL), so an SMS reminder would resolve to
stock Odoo IAP and fail without credits. See [[everjust-sms]] recipe 0 (`_get_sms_api_class`). The
scheduler runs on a cron, not synchronously — don't expect an SMS/email the instant you create the
row; check `mail_state` and `mail_registration_ids`.

### 5. Inspect seats, registration state, and whether comms fired

```
# Seat / capacity snapshot:
get('event.event', [eid], ['name','seats_limited','seats_max','seats_available','seats_taken','stage_id'])

# Registration breakdown by state:
search('event.registration', [['event_id','=',eid]],
       ['name','email','state','date_closed','lead_ids'], 200, 'id desc')
# Sold-out check: seats_limited True AND seats_available == 0.

# Did the scheduled comms send?  (mail_state and per-attendee log)
search('event.mail', [['event_id','=',eid]],
       ['notification_type','interval_nbr','interval_unit','interval_type',
        'template_ref','mail_state','scheduled_date','mail_count_done','mail_done'])
# The scheduler cron itself:
search('ir.cron', [['name','=','Event: Mail Scheduler']], ['name','active','nextcall'])
```
A comm row stuck in `scheduled` with the cron inactive, or `mail_state='error'`, is why a
reminder never arrived. For `notification_type='sms'` errors, cross-check the SMS side per
[[everjust-sms]] (a `sms_server` failure = gateway URL/key missing, not IAP credits).

## Pitfalls (everjust-specific)

1. **This is STOCK Odoo, not a custom everjust addon.** There is no `everjust_event` module —
   `event`/`website_event`/`event_crm`/`event_sms` are vanilla. Read fields from the live model
   (`describe_model`/`fields_get`), and beware **version gaps in this build**: no
   `event.registration.mobile`, no `date_open`, no `event.event.auto_confirm`, no
   `seats_expected`. Don't code against an older Odoo's event schema from memory.

2. **`event.track` (and speakers/agenda/booths/exhibitors) exist on only SOME tenants.**
   `website_event_track` is installed on **`tcstartupweek` only** (of the tenants above);
   `event_booth*`/`website_event_exhibitor`/`event_sale` are uninstalled everywhere. On
   `connectdomain`/`headsup`/`weldon`, `env["event.track"]` raises `KeyError`. Check install state
   (recipe 0) before touching anything beyond core event/registration/lead/mail.

3. **Registrations here are FREE RSVPs — no ticket price / sale order.** `event_sale` /
   `website_event_sale` are uninstalled, so `event.event.ticket` is a free ticket *type* only;
   there's no `sale.order` behind a registration. Don't reason about payment, invoicing, or ticket
   pricing on these tenants.

4. **A new registration is `open` (auto-confirmed) in this build — and state codes ≠ labels.**
   Default state is `open` (= confirmed/attending), not `draft`. `done` means *attended*
   (checked in), not "finished registering". Drive transitions with
   `action_confirm`/`action_set_done`/`action_cancel`/`action_set_draft`, never a raw
   `write({'state':...})`, or you skip seat recompute, the `after_sub` confirmation comm, and the
   `confirm`/`done`-triggered lead rules.

5. **No lead rule ⇒ no leads.** `event_crm` only creates a `crm.lead` when a matching, active
   `event.lead.rule` exists. **`connectdomain` has none by default.** Registrations there produce
   zero leads until you add a rule (recipe 3). Don't hand-write `registration.lead_ids`; add the
   rule so the trigger (`create`/`confirm`/`done`) fires cleanly and idempotently.

6. **Event reminder SMS rides the everjust SMS gateway swap — not Odoo IAP by default.** An
   `event.mail` with `notification_type='sms'` creates `sms.sms`, which
   `res.company._get_sms_api_class()` routes (TextBee/Ringover/Twilio/IAP). On `connectdomain` the
   gateway is **dormant** (`sms_provider='iap'`, no `everjust.sms_gateway_url`), so an SMS reminder
   resolves to stock IAP and will fail without credits. Always resolve the transport per
   [[everjust-sms]] before promising an event SMS will send; diagnose SMS failures there, not here.

7. **Event EMAIL is stock `mail.template`, NOT the everjust webmail stack.** The scheduler sends
   through the tenant's outgoing `ir.mail_server` / stock `mail.mail`. Do NOT route it through
   [[everjust-mail-ops]] (`everjust.mail.*`) or expect that product's verified-identity /
   suppression / 300-hr gates to apply — different transport entirely.

8. **The scheduler is a cron, not synchronous.** `event.mail` rows send when the
   `Event: Mail Scheduler` cron runs (it's active on connectdomain). Creating a `now`/`after_sub`
   row does not fire the comm the instant you create it — check `mail_state`,
   `mail_registration_ids`, and the cron's `active`/`nextcall`. A dormant cron is a common "the
   reminder never sent" cause.

9. **`is_published` gates website visibility; `website_menu` generates the sub-pages.** An event
   exists in the backend regardless, but won't appear on public `/event` unless `is_published` is
   True. `date_tz` is **required** and drives the displayed wall-clock — set it to the audience tz;
   stored `date_begin`/`date_end` remain UTC-naive.

10. **Everything is per-`company_id` / per-tenant DB.** Seats, registrations, lead rules, the mail
    scheduler, and the SMS provider swap are all tenant-scoped. On a multi-tenant task confirm you
    are on the right DB and `env.company` (see [[everjust-platform]], [[everjust-agent-mcp]])
    before creating events or wiring rules — the wrong DB silently lacks `event.track`, has a
    different SMS transport, or a different set of lead rules.

## See also

- [[everjust-platform]] — tenancy model, per-tenant module/theme install, provider swaps, and the
  invariants you must not break. Read it for the "why" behind per-tenant differences.
- [[everjust-agent-mcp]] — how to connect to the tenant MCP and the
  `search`/`get`/`create`/`update`/`call`/`describe_model` toolset every recipe above uses.
- [[everjust-sms]] — the SMS transport that `event_sms` reminders ride. Resolve
  `res.company._get_sms_api_class()` there before relying on an event SMS, and diagnose SMS
  failures (`sms_server`, dormant gateway, provider `iap`≠IAP) there.
- [[everjust-mail-ops]] — the SEPARATE everjust webmail product (`everjust.mail.*`). Event email
  is stock `mail.template`, NOT this stack — use that skill only if you're reasoning about the
  webmail product itself, never to send an event reminder.
- [[everjust-appointments]] — the sibling booking app (`everjust_appointment`). Also creates
  `crm.lead`s and a confirmation email, but is a bespoke module — don't confuse its
  `appointment.*` models with events.
