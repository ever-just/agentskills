---
name: everjust-appointments
description: Operate the everjust.app custom Appointments app (online booking → calendar event + optional CRM lead + confirmation email) via the Odoo MCP/ORM. Use when the task is to configure a bookable appointment type and its weekly slots, create/confirm/reschedule/cancel a booking as a tenant, inspect a customer's bookings, diagnose why a public /appointment slot isn't offered (min-advance / max-days / staff conflict), or wire a booking to CRM. This is the BESPOKE everjust_appointment stack (appointment.type / appointment.slot / appointment.booking) — NOT Odoo's stock Enterprise appointment.* models, and NOT calendar.event directly. Only some tenants have it installed. Cross-references [[everjust-platform]] and [[everjust-agent-mcp]]; CRM leads flow to native crm.lead; confirmation email goes through a stock mail.template (NOT [[everjust-mail-ops]]).
---

# EVERJUST Appointments — Agent Skill

Operate the **everjust.app custom Appointments app** as a running agent: define a bookable
appointment type + its weekly availability, take/confirm/reschedule/cancel bookings, and read
a customer's appointment history — all through the Odoo MCP / ORM (`env["..."]`, `search`,
`read`, `create`, `write`, and `call` an exposed method). The addon is `everjust_appointment`
(source under `/Users/cloudaistudio/Desktop/ww.everjust.app/addons/everjust_appointment/`).
It is a **bespoke, LGPL, community reimplementation of the Enterprise-only appointment
module** — the manifest says so ("Replaces the Enterprise-only appointment module"). Do not
reach for Odoo's stock `appointment.type`/`calendar.appointment.*` field set or its
`_get_appointment_slots` API; those methods do not exist here.

## When to use this skill

- **Configure a bookable service** — create/edit an `appointment.type` (duration, location,
  advance-booking window, staff, CRM-lead toggle, publish) and its weekly `appointment.slot`s.
- **Take or manage a booking** — create an `appointment.booking`, confirm it (which spins up
  the calendar event + optional CRM lead + confirmation email), mark done, cancel, or reset.
- **Reschedule** — move a booking's `start_datetime` and re-confirm, keeping the calendar in sync.
- **Inspect** — list a customer's bookings, a staff member's day, or all bookings in a state;
  find the linked `calendar.event` / `crm.lead`.
- **Diagnose a "no slots" complaint** — why the public `/appointment/<type>` page offers no
  times: not published, no slots for that weekday, inside the `min_schedule_hours` cutoff,
  past `max_schedule_days`, or every staff member is busy.

**Do NOT use this skill for**, and stop if the task is really:
- **Odoo stock/Enterprise Appointments** (`appointment.type` as shipped by Odoo, resource
  booking, `calendar.appointment`) — this tenant runs the custom module; its models share the
  `appointment.type`/`appointment.slot` **names** but not Odoo's schema. Read fields from the
  addon, not from memory.
- **Driving `calendar.event` directly** to "book" someone — a booking OWNS its event
  (`action_confirm` creates it, `action_cancel` unlinks it). Hand-creating a `calendar.event`
  produces an orphan the app never reconciles. Go through `appointment.booking`.
- **CRM pipeline work** beyond lead creation — moving the lead through stages, activities on
  the *lead*, conversion — that's native CRM. The app only *creates* one `crm.lead` (when the
  type opts in) and stashes its id in `booking.lead_id`.
- **Bulk/blast email or the native mail platform** — the confirmation email is a plain stock
  `mail.template.send_mail(force_send=True)`. It is NOT the everjust.app webmail stack; see
  [[everjust-mail-ops]] only if you need to reason about that separate product.

You reach the ORM through the platform's Odoo MCP tools — see [[everjust-agent-mcp]] for how
to open an `env` against the right tenant DB, run a shell, or call a model method. Every recipe
below is expressed as ORM/method calls you route through that MCP.

## Where it's installed (as of 2026-07)

One tenant DB per customer; the module is opt-in per tenant. Verified live via
`ir_module_module.state`:

| Tenant DB | everjust_appointment |
|---|---|
| `connectdomain` | **installed** (6 types, 35 slots, 3 bookings) |
| `headsup` | **installed** |
| `tcstartupweek` | **installed** |
| `weldon` | **installed** |
| `burekraft-llc`, `riftline-labs`, `trust-works-company` | uninstalled |
| `control` | module row absent (not in that tenant's addon set) |

Before operating, confirm the module is installed on your target DB — on a tenant without it,
`env["appointment.type"]` raises `KeyError`. See [[everjust-agent-mcp]] for selecting the DB.

## Architecture (the model map)

Three custom models, all per-`company_id` implicitly via the tenant DB. The app is a thin
orchestration layer over native `calendar.event`, `crm.lead`, `res.partner`, and `mail.template`.

| Model | Role | Key fields (real, from the addon) |
|---|---|---|
| `appointment.type` | A **bookable service**. Gates public visibility and the booking window. | `name`*, `duration` (**hours**, float, default 1.0)*, `sequence`, `description` (Html), `location` (Char), `staff_user_ids` (m2m `res.users`), `is_published` (**bool — must be True to show on `/appointment`**), `min_schedule_hours` (float, default 24 — earliest bookable = now + this), `max_schedule_days` (int, default 30 — furthest bookable), `create_lead` (bool — make a `crm.lead` on confirm), `color`, `slot_ids` (o2m → `appointment.slot`) |
| `appointment.slot` | A **weekly recurring availability window** on a type. NOT a concrete time — the controller expands these into 30-min-granularity offerings. | `appointment_type_id`* (m2o, `ondelete=cascade`), `weekday`* (**selection `'0'`..`'6'`, Monday=`'0'`** — Python `date.weekday()`), `start_hour`* / `end_hour`* (**float hours-of-day**, e.g. `9.0`, `17.5`; constraint: `start < end`, both in `[0,24]`) |
| `appointment.booking` | A **concrete booking**. Inherits `mail.thread` + `mail.activity.mixin` (has chatter + activities). Owns the derived calendar event & lead. | `name` (computed "Type — Customer", stored, editable), `appointment_type_id`* (m2o, `ondelete=restrict`), `partner_id` (m2o `res.partner`, the customer), `staff_user_id` (m2o `res.users`), `start_datetime`* (Datetime, **UTC-naive** like all Odoo datetimes), `end_datetime` (**computed** = start + type.duration, stored), `duration` (related, read-only), `state`* (`draft`/`confirmed`/`done`/`cancelled`, default `draft`), `calendar_event_id` (m2o, **read-only, set by the app**), `lead_id` (m2o `crm.lead`, read-only, set by the app), `notes` (Text), `phone`, `email`, `address` (service address), `location`/`color` (related from type) |

### The booking lifecycle (what the buttons actually do)

State machine on `appointment.booking`, driven by 4 methods (call these; don't set `state` raw):

- **`action_confirm()`** — the important one. For each booking still in `draft`: sets
  `state='confirmed'`, then **`_create_calendar_event()`** (creates a `calendar.event` with
  the customer + staff's partner as attendees, links it in `calendar_event_id`), then **if
  `appointment_type_id.create_lead`** → `_create_crm_lead()` (creates a `crm.lead`, links
  `lead_id`), then **`_send_confirmation_email()`** (renders template
  `everjust_appointment.mail_template_booking_confirmation` and `send_mail(force_send=True)`
  — **only if `partner_id.email` is set**). Re-calling on an already-confirmed booking is a
  no-op (the `if state != 'draft': continue` guard), so it will NOT create a second event/lead.
- **`action_done()`** — sets `state='done'`. (Leaves the calendar event in place.)
- **`action_cancel()`** — sets `state='cancelled'` and **unlinks the `calendar.event`** (so the
  slot frees up). The `crm.lead` is left intact.
- **`action_reset_draft()`** — back to `draft`. Does NOT recreate/undo the event or lead.

### The public booking path (auth="public", website)

Customers book without login via the controller (`controllers/main.py`):
`/appointment` (lists published types) → `/appointment/<type_id>` → JS POSTs
`/appointment/<type_id>/slots?date=YYYY-MM-DD` → `/appointment/<type_id>/book` →
`/appointment/confirmation`. The `/book` handler runs entirely `sudo()`: it finds-or-creates
the `res.partner` by email (`=ilike`), picks the **first staff member with no conflicting
`calendar.event` AND no conflicting draft/confirmed `appointment.booking`** in the window,
`create`s the booking, and **immediately `action_confirm()`s it**. So a public booking is born
already `confirmed`, with event + (optional) lead + email already fired. When you operate from
the ORM you skip the controller — you must call `action_confirm()` yourself.

### Availability / double-booking logic (mirror it, don't fight it)

Two places compute conflicts, both by overlap query `start < slot_end AND stop/end > slot_start`:
- The **slots endpoint** and **/book** check *both* `calendar.event` (any event for that user)
  and *other* `appointment.booking`s in state `draft`/`confirmed`. A time is offered only if
  ≥1 staff member is free.
- **`booking._check_staff_availability()`** does the same check for one booking and **raises
  `ValidationError`** on conflict. NOTE: it is defined but **NOT auto-called** by `create`,
  `write`, or `action_confirm` in this version — it's a helper. If you create bookings from the
  ORM and want the guard, `call` it explicitly before confirming (see recipes). Staff resolution:
  if `type.staff_user_ids` is empty, **all internal (non-share) users** are candidate staff
  (`appointment.type._get_available_staff`).

## Recipes

Route each through the Odoo MCP (open an `env` on the tenant DB, then run the call). See
[[everjust-agent-mcp]] for opening the session and picking the DB (e.g. `connectdomain`).

### Configure a bookable type + its weekly availability

```python
# One service, 1h, on-site, published, makes a CRM lead, bookable 48h..30d out:
appt_type = env["appointment.type"].create({
    "name": "On-Site Estimate",
    "duration": 1.0,                 # HOURS (float). 1.5 == 90 min.
    "location": "On-site",
    "is_published": True,            # <- required for it to appear on /appointment
    "min_schedule_hours": 48.0,      # earliest bookable = now + 48h
    "max_schedule_days": 30,
    "create_lead": True,             # confirm() will spawn a crm.lead
    "staff_user_ids": [(6, 0, [staff_user_id])],   # empty => ALL internal users are staff
})
# Weekly availability: Mon–Fri 09:00–17:00. weekday is a STRING, Monday == "0".
env["appointment.slot"].create([
    {"appointment_type_id": appt_type.id, "weekday": str(d),
     "start_hour": 9.0, "end_hour": 17.0}      # hours-of-day as float; 17.5 == 5:30pm
    for d in range(5)
])
```
A type with `is_published=False` or **zero slots for the requested weekday** offers no times.
The controller expands each slot into offerings at `max(duration, 30)`-minute steps and drops
any start before `now + min_schedule_hours`.

### Create a booking from the ORM and confirm it (event + lead + email)

```python
# Resolve/create the customer first (email match is how the public path dedupes):
partner = env["res.partner"].search([("email", "=ilike", "alice@example.com")], limit=1) \
       or env["res.partner"].create({"name": "Alice", "email": "alice@example.com", "phone": "+1..."})

booking = env["appointment.booking"].create({
    "appointment_type_id": appt_type.id,
    "partner_id": partner.id,
    "staff_user_id": staff_user_id,          # optional; leave off to let a human assign later
    "start_datetime": "2026-07-10 14:00:00", # UTC-naive; end_datetime auto-computes from duration
    "email": "alice@example.com",            # confirmation email needs partner_id.email set
    "phone": "+1...", "address": "123 Main St", "notes": "gate code 4821",
})
# OPTIONAL but recommended from the ORM: enforce the anti-double-book guard yourself,
# since create/confirm do NOT call it automatically. Raises ValidationError on conflict.
booking._check_staff_availability()

booking.action_confirm()   # -> state=confirmed, creates calendar_event_id,
                           #    creates lead_id IFF type.create_lead, sends confirmation email
booking.read(["state", "calendar_event_id", "lead_id", "start_datetime", "end_datetime"])
```
Do NOT set `state='confirmed'` by `write` — that skips the event/lead/email side effects.
Do NOT pre-set `calendar_event_id`/`lead_id`; they're app-owned read-only outputs.

### Reschedule a booking (keep the calendar in sync)

```python
# There is no dedicated reschedule method for an arbitrary time. Cleanest ORM sequence:
booking.action_cancel()                      # unlinks the old calendar.event, frees the slot
booking.write({"start_datetime": "2026-07-11 09:30:00"})  # end_datetime recomputes
booking.action_reset_draft()                 # back to draft so confirm's guard passes
booking._check_staff_availability()          # optional overlap guard at the new time
booking.action_confirm()                     # new calendar.event; lead already exists (won't dup)
```
Note the built-in `action_reschedule_my_next_*` methods (today/tomorrow/nextweek) are
convenience shortcuts for a *user's own next* booking, not a generic "move to datetime X" —
use the sequence above for arbitrary times. Confirming a booking that already has a `lead_id`
does **not** create a second lead only because the type's `create_lead` runs again on a fresh
confirm; from `draft` it *will* re-run `_create_crm_lead` — so if you truly re-confirm and the
type opts into leads, expect/clean a duplicate `crm.lead` (the app doesn't dedupe leads).

### Inspect: a customer's bookings, a staff day, or stuck drafts

```python
# All of a customer's bookings, newest first (default _order is start_datetime desc):
env["appointment.booking"].search_read(
    [("partner_id", "=", partner.id)],
    ["name", "appointment_type_id", "start_datetime", "end_datetime", "state",
     "staff_user_id", "calendar_event_id", "lead_id"])

# A staff member's confirmed day:
env["appointment.booking"].search_read(
    [("staff_user_id", "=", staff_user_id), ("state", "=", "confirmed"),
     ("start_datetime", ">=", "2026-07-10 00:00:00"),
     ("start_datetime", "<",  "2026-07-11 00:00:00")],
    ["name", "start_datetime", "end_datetime", "partner_id", "address"])

# The linked calendar event / CRM lead for a booking:
booking.calendar_event_id.read(["name", "start", "stop", "partner_ids", "location"])
booking.lead_id.read(["name", "stage_id", "email_from", "phone", "user_id"])
```

### Diagnose "the /appointment page shows no times for my type"

```python
t = env["appointment.type"].browse(type_id)
t.read(["is_published", "min_schedule_hours", "max_schedule_days", "duration"])
# 1) is_published must be True.
# 2) There must be a slot for the target WEEKDAY (Mon=="0"):
t.slot_ids.read(["weekday", "start_hour", "end_hour"])
# 3) The requested time must be >= now + min_schedule_hours and within max_schedule_days.
# 4) At least one staff member must be free (no overlapping calendar.event or draft/confirmed booking):
staff = t._get_available_staff()   # == staff_user_ids, or ALL internal users if that's empty
# Reproduce what the customer would see for a date via the public method-equivalent
# by checking each staff user's overlap in the window (see availability logic above).
```

## Pitfalls

1. **These are the BESPOKE `appointment.*` models, not Odoo's stock ones.** The manifest calls
   it a replacement for Enterprise Appointments. Same `_name`s, different schema and API. There
   is no `appointment.resource`, no `slots_generate`, no `_get_appointment_slots`. Read fields
   from `env[model].fields_get(...)` / the addon, never from Odoo-docs memory.

2. **A booking OWNS its calendar event — never create/edit `calendar.event` to "book."**
   `action_confirm` creates it; `action_cancel` unlinks it. `calendar_event_id`/`lead_id` are
   read-only app outputs. A hand-made event is an orphan the availability checks *do* see (so
   it blocks slots) but the booking model never manages.

3. **Confirm through `action_confirm()`, not `write({"state":"confirmed"})`.** The side effects
   (calendar event, optional CRM lead, confirmation email) fire only from the method. And the
   method's guard `if state != 'draft': continue` means it silently no-ops on a non-draft
   booking — to redo the flow you must `action_reset_draft()` first.

4. **`create` / `write` / `action_confirm` do NOT enforce double-booking.**
   `_check_staff_availability()` exists but is never auto-called in this version. The public
   controller does its own pre-check before creating, but a direct ORM `create` can overlap
   freely. If you book from the ORM, call `booking._check_staff_availability()` yourself, or you
   will happily double-book a staff member.

5. **Units and encodings bite:** `duration`, `start_hour`, `end_hour` are **float hours** (1.5 =
   90 min, 17.5 = 5:30 PM), not minutes and not Datetimes. `weekday` is a **string** selection
   with **Monday = `'0'`** (Python `date.weekday()`), not Odoo's usual Sunday-based calendar
   convention. `start_datetime` is **UTC-naive** — convert from the tenant/customer timezone
   before writing, or slots land at the wrong wall-clock time.

6. **Re-confirming can duplicate the CRM lead.** `_create_crm_lead` runs on every `draft →
   confirmed` transition when the type has `create_lead=True`, with no dedupe against an existing
   `lead_id`. If you reschedule via reset→confirm on a lead-generating type, expect a second
   `crm.lead`; clean it up or clear `lead_id` handling deliberately.

7. **The confirmation email is stock `mail.template`, not the everjust webmail stack.** It's
   `everjust_appointment.mail_template_booking_confirmation` sent via `send_mail(force_send=True)`
   and **only fires when `partner_id.email` is set** (a booking with just the `email` char field
   but no partner email sends nothing). Deliverability is whatever the tenant's outgoing
   `ir.mail_server` is — do NOT reason about it through [[everjust-mail-ops]] (that's a different
   product). No SMS/reminder is sent by this module at all.

8. **Per-tenant, and not everywhere.** Installed on `connectdomain`, `headsup`, `tcstartupweek`,
   `weldon` (as of 2026-07); absent/uninstalled elsewhere, where `env["appointment.type"]` raises
   `KeyError`. Confirm the DB and install state first ([[everjust-agent-mcp]], [[everjust-platform]]).

9. **`appointment_type_id` on a booking is `ondelete="restrict"`** — you can't delete a type that
   has bookings. Slots are `ondelete="cascade"` (deleting a type wipes its slots). Unpublish
   (`is_published=False`) to retire a type rather than deleting it.
