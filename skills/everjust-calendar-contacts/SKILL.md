---
name: everjust-calendar-contacts
description: Operate the Calendar + Contacts app of an everjust.app tenant over the Odoo MCP/ORM — the shared res.partner contact spine and calendar.event scheduling, with optional Google/Microsoft calendar sync. Use when the task is to create/find/update a contact (person or company), tag/segment contacts with res.partner.category, look up who a partner is before mailing or invoicing them, schedule/reschedule/cancel a calendar.event, add or read attendees and their RSVP state, check a user's free/busy for double-booking, or reason about how a booking became a calendar event. This is STOCK Odoo calendar + contacts with a thin everjust layer (res.partner.is_agent flag, phone/SMS action methods, and everjust_appointment writing events) — NOT a custom webmail or a bespoke scheduler. res.partner is the ONE contact record shared across CRM, mail, projects, invoicing and appointments; edits here ripple everywhere. Cross-references [[everjust-platform]], [[everjust-agent-mcp]], and [[everjust-mail-ops]].
---

# EVERJUST Calendar + Contacts — Agent Skill

Operate the **Calendar and Contacts** app of a live everjust.app tenant as an agent:
create/find/update contacts, segment them with tags, and schedule/read calendar
events (with attendees and RSVP state), all through the Odoo MCP / ORM. This is
**stock Odoo `calendar` + `contacts`** (Odoo 19 CE fork) with a **thin everjust layer** —
not a bespoke app. Ground truth for this skill was read from the addon source under
`/Users/cloudaistudio/Desktop/ww.everjust.app/addons/` and introspected live on the
`connectdomain` tenant.

You reach every model through the platform's Odoo MCP tools (`search`, `get`, `count`,
`find`, `create`, `update`, `delete`, `call`, `describe_model`). See [[everjust-agent-mcp]]
for opening the connection and the exact tool signatures; see [[everjust-platform]] for
the tenancy model and the invariants (one DB per tenant, everything per-`company_id`) you
must not break. This skill is the "how to operate calendar + contacts correctly HERE".

## When to use this skill

- **Contacts (`res.partner`)** — create a person or company, look one up by name/email,
  update details, set a company↔contact parent link, tag/segment with categories, or
  read a partner before you mail/invoice/schedule them.
- **Calendar (`calendar.event`)** — schedule a meeting, reschedule or cancel it, add/read
  attendees and their RSVP (`accepted`/`declined`/`tentative`/`needsAction`), set an event
  location / videocall link, or check a user's free/busy to avoid a double-booking.
- **Understanding a booking → event** — an `everjust_appointment` booking auto-creates a
  `calendar.event`; use this skill to read/adjust the resulting event.

**Do NOT use this skill for:**
- **Sending email** as a tenant mailbox, mailbox triage, or send-gating — that is the
  custom `everjust.mail.*` stack; use [[everjust-mail-ops]]. `res.partner` is only the
  *recipient/author* spine there.
- **Creating the appointment booking flow** end-to-end (types, slots, public page) —
  that is the `everjust_appointment` module's own surface; this skill covers the
  `calendar.event` it emits, and the `crm.lead` it can spawn.
- **Registrar DNS / product** work ([[godaddy-api]], the connectdomain app) — unrelated.

## Architecture — the model map

One tenant DB per customer. Everything is per-`company_id`. `res.partner` is the **single
shared contact record** used by CRM (`crm.lead.partner_id`), mail (author/recipient),
projects, invoicing (`account.move.partner_id`), telephony, and appointments — there is
no separate "calendar contact" or "CRM contact". **Editing a partner here changes it
everywhere.**

| Model | `_name` | Role | Notable real fields (introspected) |
|---|---|---|---|
| **Contact** | `res.partner` | The shared person/company spine. | `name` (REQ), `email`, `phone`, `is_company`, `company_type` (computed `person`/`company`), `parent_id` (→ the company), `child_ids`, `category_id` (**many2many → `res.partner.category`** — the tags), `function` (job title), `street`/`city`/`country_id`, `vat`, `ref`, `lang`, `tz`, `comment` (html), `company_id`, `type` (`contact`/`invoice`/`delivery`/`other`), `user_ids` (→ the login, if this partner is a user), **`is_agent`** (everjust) |
| **Tag** | `res.partner.category` | Contact segmentation tags (Odoo "Contact Tags"). Hierarchical. | `name` (REQ), `parent_id`, `child_ids`, `color`, `active`, `partner_ids` |
| **Event** | `calendar.event` | A calendar entry / meeting. | `name` (REQ), `start` (datetime REQ), `stop` (datetime REQ), `allday`, `start_date`/`stop_date` (used when `allday`), `duration` (float hours), `user_id` (organizer → `res.users`), **`partner_ids`** (many2many → `res.partner` — set this to invite; attendees are derived), `attendee_ids` (one2many → `calendar.attendee`, auto-managed), `location`, `videocall_location`, `description` (html), `privacy` (`public`/`private`/`confidential`), `show_as` (`free`/`busy`, REQ), `recurrency`+`rrule`+`recurrence_id`, `alarm_ids` (reminders), `categ_ids` (→ `calendar.event.type`), `res_model`/`res_id` (link back to a source record), `google_id`/`need_sync`/`active` (sync/soft-delete) |
| **Attendee** | `calendar.attendee` | One partner's participation + RSVP in an event. Auto-created from `partner_ids`. | `event_id` (REQ), `partner_id` (REQ), `email` (computed from partner), `common_name`, `state` (`accepted`/`declined`/`tentative`/`needsAction`), `availability` (`free`/`busy`), `access_token` |

### The everjust layer on this app (what's non-stock)

The core is stock Odoo. The everjust customizations that matter to an operating agent:

1. **`res.partner.is_agent`** (`everjust_mail`) — a boolean marking a partner as an AI
   agent actor (so it's badged, never mistaken for a teammate). Set only by the merge/agent
   program — see [[everjust-agent-mcp]]. Don't set it on human contacts.
2. **`res.partner` action methods** — `action_phone_call` / `action_phone_sms`
   (`everjust_phone`) and `action_ringover_call` (`everjust_ringover`) open a softphone/SMS
   composer from a contact. These are **UI client actions** (return an `ir.actions.client`);
   they do NOT place a call or send an SMS from the ORM, and both modules are **uninstalled
   on `connectdomain`** anyway. Don't `call` them expecting a message to go out.
3. **`everjust_appointment`** — a custom module (replacing the Enterprise appointment app)
   whose `appointment.booking.action_confirm()` **creates a `calendar.event` via `sudo()`**
   with the customer + staff as `partner_ids`, and optionally spawns a `crm.lead`. So some
   `calendar.event` rows originate from bookings; `booking.calendar_event_id` links them and
   `booking.action_cancel()` `unlink()`s the event.

### Calendar sync (Google / Microsoft)

Sync is **stock Odoo** and **per-user**, gated by two layers:

- **`google_calendar`** is INSTALLED on `connectdomain` and the platform OAuth app is
  configured (`ir.config_parameter` `google_calendar_client_id` / `_client_secret` are set).
  Sync tokens live **per user** on `res.users`: `google_calendar_rtoken`,
  `google_calendar_token`, `google_calendar_token_validity`, `google_calendar_sync_token`,
  `google_calendar_cal_id`. A user only syncs once they've clicked "Sync with Google" and
  authorized — the config params existing does NOT mean any user is connected.
- **`microsoft_calendar`** is **NOT installed** on `connectdomain`; there is no Outlook sync
  here. Do not assume it.
- On a synced event, `google_id` is the remote id and `need_sync=True` marks a local change
  the cron will push. Deleting/moving a synced event **propagates to the user's real Google
  calendar** — treat writes to synced events as writes to their live personal calendar.

---

## Recipes

Tool calls below use the MCP tool names from [[everjust-agent-mcp]] (`search`, `get`,
`find`, `create`, `update`, `call`, `describe_model`; in Claude Code they're namespaced
`mcp__everjust__<tool>`). Domains are Odoo triples; `true`/`false` are Odoo booleans.
**`describe_model` the model and check `your_access` before any write** — never guess field
names.

### 1. Find or read a contact (before you act on it)

```text
# Resolve a name → id (fuzzy, matches name/email/ref)
find(model="res.partner", name="Jane Doe")
  → [[412, "Jane Doe"], [897, "Jane Doe, Acme Corp"]]

# Read the useful fields
get(model="res.partner", ids=[412],
    fields=["name","email","phone","function","parent_id","company_type",
            "category_id","user_ids","is_agent","company_id"])

# Search a segment: all companies tagged "Custom-Domain ICP" with an email
search(model="res.partner",
       domain=[["is_company","=",true],
               ["category_id.name","=","Custom-Domain ICP"],
               ["email","!=",false]],
       fields=["name","email","category_id"], limit=50, order="name")
```
Always resolve to an id and read the partner **before** emailing ([[everjust-mail-ops]]),
invoicing, or scheduling — the same record backs all of them, so you want the right one.
Note the tenant has ~1,500 partners and ~24 category tags (e.g. Customer, Agency,
Cold Outreach, Custom-Domain ICP).

### 2. Create a contact, and link a person to their company

```text
# Company first (is_company=true → company_type computes to "company")
create(model="res.partner", values={
  "name": "Acme Corp", "is_company": true,
  "email": "hello@acme.com", "phone": "+1 612 555 0100",
  "street": "100 Main St", "city": "Minneapolis"})
  → { created_id: 1601 }

# Person linked to that company via parent_id (function = their job title)
create(model="res.partner", values={
  "name": "Jane Doe", "is_company": false, "parent_id": 1601,
  "email": "jane@acme.com", "function": "Head of Ops"})
  → { created_id: 1602 }
```
There is **no `mobile` and no `title` field** on this tenant's `res.partner` (Odoo 19
merged mobile into `phone`; salutation title isn't exposed). Use `phone` and `function`.
Set `parent_id` (not a free-text company name) so the person rolls up to the company across
CRM/invoicing. Do **not** set `is_agent` — that's reserved for AI-agent partners.

### 3. Tag / segment a contact with categories (`category_id`)

`category_id` is **many2many**, so use Odoo command tuples — not a bare id.

```text
# Resolve tag ids
find(model="res.partner.category", name="Customer")          → [[20, "Customer"]]
find(model="res.partner.category", name="Custom-Domain ICP") → [[22, "Custom-Domain ICP"]]

# ADD tags without clobbering existing ones: command (4, id)
update(model="res.partner", ids=[1602], values={"category_id": [[4, 20], [4, 22]]})

# REPLACE the whole tag set: command (6, 0, [ids])
update(model="res.partner", ids=[1602], values={"category_id": [[6, 0, [20]]]})

# Create a new tag if it doesn't exist
create(model="res.partner.category", values={"name": "Q3 Webinar", "color": 4})
```
Use `[[4, id]]` to add and `[[3, id]]` to remove a single tag; reserve `[[6,0,[...]]]`
(replace-all) for when you truly mean to overwrite every tag on the contact.

### 4. Schedule a calendar event with attendees

Set **`partner_ids`** to invite people — Odoo auto-creates the `calendar.attendee` rows
(each starting at `state="needsAction"`). Don't hand-craft `attendee_ids`.

```text
# Organizer = a res.users id; resolve attendees as res.partner ids first
find(model="res.users", name="Sam Staff")     → [[7, "Sam Staff"]]
find(model="res.partner", name="Jane Doe")     → [[1602, "Jane Doe"]]

create(model="calendar.event", values={
  "name": "Onboarding call — Acme",
  "start": "2026-07-10 15:00:00",     # UTC, 'YYYY-MM-DD HH:MM:SS'
  "stop":  "2026-07-10 15:30:00",
  "user_id": 7,                        # organizer (res.users)
  "partner_ids": [[6, 0, [1602, <sam_partner_id>]]],  # invitees → attendees auto-made
  "location": "Zoom",
  "videocall_location": "https://zoom.us/j/123",
  "show_as": "busy",
  "description": "<p>Kickoff.</p>"})
  → { created_id: 55 }

# All-day event: set allday + start_date/stop_date instead of start/stop times
create(model="calendar.event", values={
  "name": "Holiday", "allday": true,
  "start_date": "2026-07-04", "stop_date": "2026-07-04", "show_as": "free"})
```
Datetimes are stored **UTC**; a user sees them in their `tz`. If `user_id` (the organizer)
has authorized Google sync, this event will push to their real Google Calendar
(`need_sync`/`google_id`) — see Pitfall 5.

### 5. Read attendees / RSVP, and reschedule or cancel

```text
# Who's invited and did they respond?
search(model="calendar.attendee",
       domain=[["event_id","=",55]],
       fields=["partner_id","email","state","availability"])
  → state ∈ {accepted, declined, tentative, needsAction}

# Reschedule (moves it on any synced Google calendar too)
update(model="calendar.event", ids=[55],
       values={"start":"2026-07-10 16:00:00","stop":"2026-07-10 16:30:00"})

# Add another invitee later (command (4, partner_id) → new attendee auto-created)
update(model="calendar.event", ids=[55], values={"partner_ids": [[4, 1601]]})

# Cancel = archive (soft delete) so sync + history behave; prefer over hard unlink
update(model="calendar.event", ids=[55], values={"active": false})
```
Set an attendee's own RSVP through the event's response methods rather than writing
`state` raw when possible, e.g.
`call(model="calendar.event", method="action_open_composer" ...)` is UI-only —
for a plain status set, `update(model="calendar.attendee", ids=[id], values={"state":"accepted"})`
is acceptable but won't notify. Reserve hard `delete(confirm=true)` for events you truly
want gone; for synced events, deleting removes them from the user's Google calendar.

### 6. Check free/busy to avoid a double-booking

The `everjust_appointment` module already does this (`_check_staff_availability`); mirror
its query to check any organizer's calendar before you schedule:

```text
count(model="calendar.event",
      domain=[["user_id","=",7],
              ["start","<","2026-07-10 15:30:00"],
              ["stop", ">","2026-07-10 15:00:00"],
              ["active","=",true]])
  → 0  ⇢ the slot is free for that user
```
A non-zero count means an overlapping event exists — pick another time or organizer. If the
task is really "book an appointment through the customer-facing flow", drive
`appointment.booking` (create → `action_confirm`) instead, and it will create the
`calendar.event` (and optionally a `crm.lead`) for you.

---

## Pitfalls

1. **`res.partner` is shared — edits ripple everywhere.** The same row is the CRM contact,
   the mail recipient/author, the invoice partner, the project follower, and the calendar
   attendee. Renaming, re-emailing, merging, or archiving a partner changes it across every
   app. Confirm you have the *right* partner (`find` → `get`) before mutating, and prefer
   adding data over overwriting.

2. **`category_id` is many2many — use command tuples, not a bare id.** Writing
   `category_id: 20` fails or misbehaves; use `[[4,20]]` to add, `[[3,20]]` to remove,
   `[[6,0,[...]]]` to replace all. Same rule for `partner_ids` on events. (General x2many
   rule from [[everjust-agent-mcp]], but easy to trip on here.)

3. **Invite via `partner_ids`, never by writing `attendee_ids` directly.** Odoo derives and
   manages `calendar.attendee` from `partner_ids`. Hand-inserting attendee rows desyncs the
   two, breaks RSVP, and breaks Google sync. New attendees start at `state="needsAction"`,
   and attendee `state` uses the Google vocabulary (`needsAction`, not `pending`).

4. **No `mobile`, no `title` on this tenant's `res.partner`.** Odoo 19 merged mobile into
   `phone` and the salutation `title` field isn't exposed. Don't create/update those keys —
   it's a hard error. Use `phone` and `function` (job title).

5. **Writing a synced event writes the user's real Google calendar.** `google_calendar` is
   installed and OAuth is configured on `connectdomain`, and sync is **per-user** (tokens on
   `res.users`). If the organizer has connected Google, creating/moving/deleting the event
   propagates to their live personal calendar via `need_sync`/`google_id`. Treat such writes
   as live-calendar writes. `microsoft_calendar` is **not installed** — there is no Outlook
   sync here; don't assume it.

6. **Config params set ≠ a user is synced.** `google_calendar_client_id`/`_client_secret`
   being present is the *platform* OAuth app; a given user only syncs after authorizing (has
   `google_calendar_rtoken` on their `res.users`). Check the organizer's user record before
   assuming their events reach Google.

7. **`is_agent` is reserved.** It marks an AI-agent partner (badged, non-human) and is set by
   the merge/agent program — see [[everjust-agent-mcp]]. Never set it on a human contact, and
   don't infer "this is a bot" from anything else.

8. **The `res.partner` phone/SMS/Ringover action methods don't send anything.** `action_phone_call`,
   `action_phone_sms`, `action_ringover_call` return `ir.actions.client` for the web UI to
   open a dialer — they place no call and send no SMS from the ORM. Both `everjust_phone` and
   `everjust_ringover` are **uninstalled on `connectdomain`**, so those methods aren't even
   present here. For SMS, the tenant has `everjust_sms_gateway` installed (a separate
   send path), not these contact actions.

9. **Cancel by archiving, not (usually) hard delete.** Set `active=false` to cancel an event
   so history and sync reconcile cleanly; a hard `delete(confirm=true)` is irreversible and,
   for synced events, removes it from the user's Google calendar. For appointment-originated
   events, cancel the **booking** (`appointment.booking.action_cancel`) — it `unlink()`s its
   linked `calendar_event_id` for you.

10. **Everything is per-`company_id` / one tenant per connection.** Categories, partners, and
    events are tenant-scoped; the MCP Bearer key binds you to one workspace. Confirm you're on
    the right tenant before searching or writing (see [[everjust-platform]] / [[everjust-agent-mcp]]).

## See also

- [[everjust-platform]] — tenancy model, Odoo-19 shape, and the invariants (one DB per
  tenant, per-`company_id`) behind everything here.
- [[everjust-agent-mcp]] — how to connect and the exact `search`/`get`/`create`/`update`/
  `call` tool signatures and x2many command-tuple rules used in every recipe above.
- [[everjust-mail-ops]] — sending/reading mail as a tenant mailbox. `res.partner` is only the
  recipient/author spine there; the actual send stack is the custom `everjust.mail.*` app.
- `everjust_appointment` (module) — the booking → `calendar.event` (+ optional `crm.lead`)
  flow; drive `appointment.booking` when the task is a customer-facing booking.
