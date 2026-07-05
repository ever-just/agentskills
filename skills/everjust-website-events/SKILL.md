---
name: everjust-website-events
description: Build/publish the PUBLIC EVENT SITE of a live everjust.app tenant — expose an event minisite at /event/<slug>, toggle its sub-pages (Register/Agenda/Talks/Exhibitors/Propose-a-talk), publish the agenda (event.track sessions + speakers), publish the sponsor/exhibitor wall (event.sponsor by tier), and expose the registration page. Use to publish/unpublish an event minisite, choose which pages show, add/publish a track/speaker/sponsor, set cover/SEO/visibility, or diagnose why a tab/track/sponsor won't show. Stock Odoo 19 website_event(+_track/_exhibitor) via the everjust_agent_mcp ORM + WEBSITE TOOLS (edits need website-designer). Key facts: the minisite is GENERATED from these records + per-event menu toggles, not hand-authored QWeb (the TCSW /tickets & /sponsor marketing pages are separate hardcoded Tailwind QWeb); event.track/event.sponsor exist on tcstartupweek only (KeyError elsewhere); the registration lifecycle is backend [[everjust-events]]. Cross-refs [[everjust-platform]], [[everjust-agent-mcp]].
---

# EVERJUST Website Events — Agent Skill

Build and publish the **public event site** of a live everjust.app tenant as an agent: turn an
`event.event` into a browsable minisite at `/event/<slug>` (with its Home / Practical / Register /
Agenda / Talks / Exhibitors / Propose-a-talk sub-pages), publish the **agenda** (`event.track`
sessions — speakers, times, rooms), publish the **sponsor / exhibitor** wall (`event.sponsor` by
tier), and drive **online registration** (`event.registration`) through the website register route —
all through the Odoo MCP / ORM (`search`, `get`, `create`, `update`, `call`, `describe_model`) plus
the MCP **WEBSITE TOOLS** where site-chrome is involved. See [[everjust-agent-mcp]] for opening the
session against the right tenant DB.

The crucial everjust facts:

- **This is STOCK Odoo 19** — `website_event` (the minisite + register route), `website_event_track`
  (`event.track` agenda + speakers + `track_proposal` form), `website_event_exhibitor`
  (`event.sponsor` = the sponsor/exhibitor wall), `website_event_crm` (registrations → `crm.lead`).
  There is **no custom everjust event addon.** Read fields from the live model (`describe_model` /
  `fields_get`), not from memory of an older Odoo.
- **The event minisite is GENERATED, not authored.** The `website_event` controller renders
  `/event/<slug>` and its sub-pages **from the event's records + per-event menu toggles** — you do
  NOT create a `website.page` per event or per track. The WEBSITE TOOLS
  (`website_new_page`/`website_edit_page`) are for the STATIC `/event` list chrome and marketing
  pages, **not** for the generated minisite (Pitfall 1). You "build the site" by writing records
  (`event.event` toggles, `event.track`, `event.sponsor`) and flipping `is_published`.
- **Per-event MENU TOGGLES decide which sub-pages exist.** Boolean fields on `event.event`
  (`website_menu` master, plus `register_menu`, `website_track`, `website_track_proposal`,
  `exhibitor_menu`, `community_menu`, `introduction_menu`) each auto-create/remove a
  `website.event.menu` row (a `website.menu` entry under the event) — that is how the "Agenda",
  "Talks", "Exhibitors", "Register", "Propose a talk" tabs appear. Flip the boolean; don't hand-make
  the menu rows (Pitfall 4).
- **`event.track` / `event.sponsor` exist on ONLY SOME tenants.** `website_event_track` and
  `website_event_exhibitor` are installed on **`tcstartupweek`** but **uninstalled on
  `connectdomain` / `headsup` / `weldon`** — there, `env["event.track"]` / `env["event.sponsor"]`
  raise `KeyError`. Check install state first (recipe 0). This mirrors [[everjust-events]]'s matrix.
- **Track visibility has a THREE-part gate, not one flag** (recipe 2 / Pitfall 5): the track's
  `stage_id` must be a public/agenda stage, AND `is_published` True, AND the event's `website_track`
  menu on. Publishing a track is NOT just `is_published`.
- **The TCSW MARKETING pages are a SEPARATE hand-authored Tailwind QWeb layer.** `/tickets` and
  `/sponsor` on tcstartupweek are pixel-faithful Tailwind `website.page` QWeb (module `website_tcsw`)
  with **hardcoded** tier cards that merely link to `/event/<slug>/register` — they are NOT rendered
  from `event.sponsor` / ticket records. Editing them is the site-chrome path
  ([[everjust-platform]] / `website_edit_page`), NOT this skill; this skill is the generated event
  minisite + its content records (Pitfall 2).
- **Registration on these tenants is FREE RSVP.** `event_sale` / `website_event_sale` are
  uninstalled everywhere — the website register form creates a free `event.registration`; there is
  no paid checkout / `sale.order`. Ticket *types* (`event.event.ticket`) are free segmentation only.

You reach the ORM + WEBSITE TOOLS through the platform's Odoo MCP — see [[everjust-agent-mcp]] for
opening the session against the right tenant DB and the tool signatures / `confirm` + ACL gates.
Every recipe below is expressed through that toolset. **Website edits (publishing, menu toggles,
editing chrome) require the connected user to have website-designer / admin rights** — check
`can_publish` first (recipe 0).

## When to use this skill

- **Publish / unpublish an event minisite** — flip an `event.event`'s `is_published` (+ set
  `website_visibility`) so it appears at `/event`, and choose which sub-pages exist via the menu
  toggles (`website_menu`, `register_menu`, `website_track`, `exhibitor_menu`, …).
- **Build / publish the agenda** — create or publish `event.track` sessions (name, `date`,
  `duration`, `location_id`/room, `stage_id`, speaker `partner_*` fields, `tag_ids`), so the
  Agenda/Talks pages render them.
- **Manage the sponsor / exhibitor wall** — create or publish `event.sponsor` records (a `partner_id`
  at a `sponsor_type_id` tier, `exhibitor_type` sponsor/exhibitor/online, logo, `url`,
  `website_description`), so the Exhibitors page and sponsor footer render them by tier.
- **Enable / read online registration** — turn on the Register page, point people at the website
  register route, and read the `event.registration`s it produced (registration mechanics, CRM leads,
  confirmation/reminder comms are the BACKEND — [[everjust-events]]).
- **Tune an event page's presentation** — cover image (`cover_properties`), `subtitle`,
  SEO/OpenGraph (`website_meta_*`, `seo_name`), `website_visibility` (public / link-only / logged-in).
- **Diagnose** — an event not on `/event` (unpublished / visibility / wrong `website_id`), an Agenda
  or Exhibitors tab missing (menu toggle off, or the add-on not installed), a track not showing
  (stage/`is_published`), a sponsor not on the wall (`is_published`).

**Do NOT use this skill for**, and stop if the task is really:

- **The registration/CRM/reminder BACKEND.** Creating/confirming/cancelling an `event.registration`
  by hand, wiring `event.lead.rule` (registrations → `crm.lead`), scheduling `event.mail` /
  `event_sms` confirmations & reminders, seats logic — all that is [[everjust-events]]. THIS skill is
  the public *site*: exposing the event, agenda, sponsors, and the register *page*; it reads
  registrations but does not run the registration lifecycle.
- **The static `/event` LIST chrome or a MARKETING page.** The `/event` index styling and the TCSW
  `/tickets` / `/sponsor` Tailwind pages are `website.page` / `ir.ui.view` QWeb — edit them with the
  WEBSITE TOOLS keeping the existing Tailwind idiom; that's the site-chrome path in
  [[everjust-platform]], NOT the generated minisite. Don't confuse hardcoded marketing tier cards
  with `event.sponsor` records.
- **Blog posts** — `blog.post` / `website_blog`; see [[everjust-website-blog]]. An event is not a
  blog post (different publish gate).
- **Installing `website_event_track` / `website_event_exhibitor` on a tenant that lacks them** — that
  is platform-ops (module install), not this skill. On a tenant without the add-on the agenda /
  exhibitor models simply don't exist; stop.
- **Booths / paid tickets / live streaming / meet** — `event_booth*`, `event_sale` /
  `website_event_sale`, `website_event_track_live`, `website_event_meet` are **uninstalled on every
  everjust tenant** at last check. There is no booth booking, paid checkout, or live-stream page.

## Where it's installed (verified live, 2026-07)

One tenant DB per customer; the event-website add-ons install with the tenant's public-website theme.
Verified live via `ir_module_module.state` (and consistent with [[everjust-events]]):

| Tenant DB | website_event (minisite + register) | website_event_track (`event.track`) | website_event_exhibitor (`event.sponsor`) | website_event_crm |
|---|---|---|---|---|
| `tcstartupweek` | ✅ | **✅** | **✅** | ✅ |
| `connectdomain` | ✅ | **uninstalled** | **uninstalled** | ✅ |
| `headsup` | ✅ | uninstalled | uninstalled | (event) |
| `weldon` | ✅ | uninstalled | uninstalled | (event) |

`event_sale`, `website_event_sale`, `event_booth*`, `website_event_booth*`,
`website_event_track_live`, `website_event_meet` were **uninstalled on all** at last check. So the
**agenda + sponsor wall only exist on `tcstartupweek`**; the other tenants get the event minisite +
register page only. **Always confirm on your target DB (recipe 0)** — `env["event.track"]` /
`env["event.sponsor"]` `KeyError` where the add-on isn't installed. On `tcstartupweek` at last check:
**7 events** (2015-2026), and only the **2026 event (id 1)** is published (`is_published=True`,
`website_visibility='public'`) — it carries ~12 published `event.track` sessions and its `track` +
`register` + `track_proposal` menus on, against **~1066 total tracks + ~52 sponsors** (most on the
older, unpublished archive events, and most sponsors not yet published on the 2026 event). Treat
these counts as volatile — read them live, don't hard-code them.

## Architecture (the model map)

Everything is per-tenant DB, per-`company_id`, and per-`website_id`. Real fields below are from
`fields_get` on the live `tcstartupweek` DB (Odoo 19). Read fields live — don't assume older shapes.

| Model | Role | Key fields (real, confirmed live) |
|---|---|---|
| `event.event` | **The event = one minisite.** Its booleans decide which sub-pages exist; `is_published` puts it on `/event`. | `name`*, `subtitle`, `date_begin`*/`date_end`* (**Datetime, UTC-naive**), `date_tz`* (display tz — required), `seats_limited`*/`seats_max`/`seats_available`/`seats_taken` (computed), `organizer_id`/`address_id` (→`res.partner`), `stage_id` (→`event.stage`), **`is_published`** (bool — on `/event` list), `website_published` (**computed mirror — read, don't write**), `can_publish` (**computed — may YOU publish**), `is_visible_on_website` (computed), **`website_visibility`*** (`public`\|`link`\|`logged_users`), `website_id` (→`website`; `False`=all sites), `website_url` (`/event/<slug>`), `event_register_url` (computed register link), `menu_id` (→`website.menu`, the event's root menu), **menu toggles** → `website_menu` (master), `register_menu`, `community_menu`, `introduction_menu`, `website_track`, `website_track_proposal`, `exhibitor_menu` (booleans; each spawns a `website.event.menu`), the matching `*_menu_ids` (→`website.event.menu`, read-only), `cover_properties` (**JSON text cover, same shape as blog**), `ticket_instructions` (Html on register page), `question_ids`/`general_question_ids`/`specific_question_ids` (→`event.question`, register-form questions), `event_ticket_ids` (→`event.event.ticket`, free ticket types), `track_ids`/`track_count` (→`event.track`), `sponsor_ids`/`sponsor_count` (→`event.sponsor`), `tag_ids` (→`event.tag`), `allowed_track_tag_ids`/`tracks_tag_ids` (agenda tag filter), `seo_name`, `website_meta_title`/`website_meta_description`/`website_meta_keywords`/`website_meta_og_img` |
| `website.event.menu` | **One sub-page/tab of the minisite**, auto-created by a menu toggle. Don't create by hand. | `event_id`, `menu_id` (→`website.menu`), **`menu_type`*** (`community`\|`introduction`\|`register`\|`other`\|`exhibitor`\|`track`\|`track_proposal`), `view_id` (→`ir.ui.view`), `seo_name`, `website_meta_*`. (Labels are relabeled in the UI: `introduction`="Home", `register`="Practical", `track`="Talks"/"Agenda".) |
| `event.track` | **One agenda session / talk** (⚠️ `website_event_track` only). Has the speaker inline. | `name`*, `event_id`*, **`stage_id`*** (→`event.track.stage` — **the publish/agenda gate**), **`is_published`** (bool), `website_published` (computed), `can_publish` (computed), `date` (Datetime, session start), `date_end`/`duration` (float hours), `location_id` (→`event.track.location`, the room/venue), `tag_ids` (→`event.track.tag`), `color`, `priority`, `description` (Html), **speaker inline:** `partner_id` (→`res.partner`), `partner_name`, `partner_email`, `partner_phone`, `partner_function` (job title), `partner_company_name`, `partner_biography` (Html), `contact_email`/`contact_phone`, `website_cta`/`website_cta_title`/`website_cta_url` (a call-to-action button on the track page), `wishlisted_by_default`, `website_url` (`/event/<slug>/track/<track-slug>`), `seo_name`, `website_meta_*`. (TCSW adds a studio field `x_venue_partner_id`.) |
| `event.track.stage` | **Kanban stage that ALSO gates public agenda visibility.** | `name`*, `sequence`, `fold`, **`is_visible_in_agenda`** (bool — stage shows on the Agenda), **`is_fully_accessible`** (bool — track page fully public), `is_cancel`, `mail_template_id`. Live TCSW stages: `Proposal`(1)→`Confirmed`(2)→`Announced`(3, agenda✓)→`Published`(4, agenda✓ + fully-accessible✓)→`Refused`(5)/`Cancelled`(6). |
| `event.track.tag` | Agenda filter tag. | `name`*, `category_id` (→`event.track.tag.category`), `color`, `sequence`, `track_ids`. Live TCSW: `Founders`/`Innovation`/`Investors` under category "Pillar". |
| `event.track.location` | A room / venue for tracks. | `name`*, `sequence`. Live TCSW: `Minneapolis`, `St. Paul`. |
| `event.sponsor` | **One sponsor / exhibitor on the wall** (⚠️ `website_event_exhibitor` only). | `partner_id`* (→`res.partner`, the org — logo/name come from here), **`sponsor_type_id`*** (→`event.sponsor.type`, the TIER), `event_id`*, **`exhibitor_type`** (`sponsor`\|`exhibitor`\|`online`), **`is_published`** (bool — on the wall), `website_published`/`can_publish` (computed), `name` (defaults from partner), `subtitle`, `url` (their website), `email`/`phone`, `website_description` (Html, the exhibitor blurb), `website_image_url` (computed logo url), `show_on_ticket` (bool — also list on the register/ticket page), `hour_from`/`hour_to` (online-exhibitor "open hours"), `sequence`, `website_url` (`/event/<slug>/exhibitor/<slug>`). |
| `event.sponsor.type` | **A sponsor TIER** — orders + ribbons the wall. | `name`*, `sequence` (ranks tiers; lower = higher tier), **`display_ribbon_style`** (`no_ribbon`\|`Gold`\|`Silver`\|`Bronze`). Live TCSW: `Premier`(Gold)→`Presenter`(Silver)→`Supporting`(Bronze)→`Builder`(no ribbon). |
| `event.registration` | **One website RSVP.** Read here; drive its lifecycle in [[everjust-events]]. | `event_id`*, `partner_id`, `name`/`email`/`phone`, `state` (`draft`/`open`/`done`/`cancel` — **`open`=confirmed**), `visitor_id` (→`website.visitor`, the web session), `utm_*`, `lead_ids` (→`crm.lead`, via `website_event_crm`). |
| `event.event.ticket` | A **free** ticket *type* (segmentation, no price here). | `name`*, `event_id`*, `seats_max`, `seats_available`/`seats_used` (computed), `start_sale_datetime`/`end_sale_datetime` (register window). |

### The event minisite publish gate — read the codes, not the labels

An event's **minisite is publicly reachable** when:
1. **`is_published` is True** (`website_published` is the computed mirror the front-end reads), AND
2. **`website_visibility` allows the visitor** — `public` (anyone), `link` (only via direct URL, not
   listed), or `logged_users` (must be signed in). Default is `public`.

Then **which sub-pages/tabs exist** is decided by the per-event menu booleans, each of which
creates/removes a `website.event.menu`:
- `website_menu` = the **master** switch (the event has ANY of its own sub-menu). Off ⇒ no minisite
  nav at all, just the bare event page.
- `register_menu` → the **Register / Practical** page (the RSVP form + practical info).
- `website_track` → the **Agenda / Talks** pages (needs `website_event_track`; else no-op/absent).
- `website_track_proposal` → the **Propose a talk** submission form (public track proposals).
- `exhibitor_menu` → the **Exhibitors** page / sponsor wall (needs `website_event_exhibitor`).
- `community_menu` → the **Community** page; `introduction_menu` → the **Home** intro page.

So "build the event site" = publish the event + set `website_visibility` + flip the right menu
booleans. On live TCSW event 1 the `website.event.menu` rows are `introduction` (Home), `register`
(Practical), several `track` entries (Talks/Agenda), and `track_proposal` (Propose a talk) — the
exact set/count reflects which booleans are on, so read `website.event.menu` for the current tabs
rather than assuming a fixed list.

### The AGENDA (track) publish gate — THREE parts

A track shows on the public Agenda/Talks **only when all hold**:
1. The event's **`website_track` menu is on** (the Agenda pages exist at all), AND
2. The track's **`stage_id` is agenda-visible** — `stage_id.is_visible_in_agenda` True (TCSW:
   `Announced` or `Published`), and its own page is fully public only when
   `stage_id.is_fully_accessible` (TCSW: `Published`), AND
3. The track's **`is_published` is True** (and `can_publish` means you have the right).

So publishing a session is **move it to a public stage AND set `is_published`** — not one flag. A
track in `Proposal`/`Confirmed`/`Refused`/`Cancelled` stays off the agenda even if `is_published`.
Drive the stage via `stage_id` (or the track's stage-action); the model recomputes agenda flags.

### The SPONSOR wall

The Exhibitors page + the sponsor footer render `event.sponsor` records **grouped and ranked by
`sponsor_type_id.sequence`**, with the tier's `display_ribbon_style` ribbon, but **only those with
`is_published=True`** (and the event's `exhibitor_menu` on). Each sponsor is a `partner_id` at a tier;
the logo is the partner's image, the blurb is `website_description`, the outbound link is `url`.
`exhibitor_type` distinguishes a pure `sponsor` (logo/footer only) from an `exhibitor`/`online`
(gets its own exhibitor page). `show_on_ticket` also lists them on the register/ticket page.

### Registration is the site's job only up to the register PAGE

Turning on `register_menu` exposes the website RSVP form; a submit creates an `event.registration`
(state `open`, auto-confirmed in this build) and — via `website_event_crm` if a rule exists — a
`crm.lead`. **Everything past "the form exists" is [[everjust-events]]:** seats, confirm/cancel,
lead rules, confirmation/reminder `event.mail` / `event_sms`. This skill reads registrations and
turns the page on; it does not run the lifecycle.

## Recipes

Route each call through the Odoo MCP against the tenant DB (open the session per
[[everjust-agent-mcp]]; the event-heavy DB is `tcstartupweek`). Recipes use the MCP toolset
(`search`, `get`, `create`, `update`, `call`, `describe_model`, plus the WEBSITE TOOLS where noted);
ORM `env[...]` forms are shown where clearer.

### 0. First: confirm the add-ons exist on THIS tenant, and that you can publish

The single most important orientation. The agenda/exhibitor models exist on `tcstartupweek` only;
website edits need website-designer rights.

```
# Which event-website add-ons are installed here?
search('ir.module.module',
       [['name','in',['website_event','website_event_track','website_event_exhibitor',
                      'website_event_crm','event_sale','website_event_sale']]],
       ['name','state'])
# Or just probe the model you need — KeyError where the add-on is absent:
describe_model('event.track')     # -> error on connectdomain/headsup/weldon
describe_model('event.sponsor')   # -> error there too
# Can YOU publish (vs only draft)?  can_publish needs website-designer / admin:
get('event.event', [1], ['can_publish','is_published','website_published','website_visibility'])
```
If `event.track`/`event.sponsor` `KeyError`, this tenant has the register-only event site — you can
publish the event + register page but there is no agenda/sponsor wall; stop (installing the add-on is
platform-ops). If `can_publish` is False / `your_access.write` is False you lack website-designer
rights — **don't retry with `confirm:true`** (it's an ACL limit, not a confirm gate; see
[[everjust-agent-mcp]]).

### 1. Publish an event minisite and choose its sub-pages (the menu toggles)

"Building the event site" is records + toggles, NOT authoring a page. Set visibility, flip the menu
booleans, publish.

```
# Turn the event into a full minisite: publish + pick the tabs.
update('event.event', [1], {
    'is_published': True,             # <- puts it on /event and makes the minisite reachable
    'website_visibility': 'public',   # 'public' | 'link' (unlisted) | 'logged_users'
    'website_menu': True,             # MASTER: the event gets its own sub-menu at all
    'introduction_menu': True,        # -> "Home" tab
    'register_menu': True,            # -> "Register"/"Practical" page (the RSVP form)
    'website_track': True,            # -> "Agenda"/"Talks" pages   (needs website_event_track)
    'website_track_proposal': True,   # -> "Propose a talk" form
    'exhibitor_menu': True,           # -> "Exhibitors" wall        (needs website_event_exhibitor)
    'community_menu': False,
    'subtitle': 'Five days. Two cities. 200+ events.',
})
# Confirm what tabs now exist (auto-created website.event.menu rows):
search('website.event.menu', [['event_id','=',1]], ['menu_type','menu_id'])
get('event.event', [1], ['website_url','event_register_url','website_published','is_visible_on_website'])
```
`website_menu=False` ⇒ no minisite nav (just the bare event page). Turning `website_track` on where
`website_event_track` is **not** installed does nothing (no Agenda pages exist). The `*_menu_ids` are
read-only reflections — you flip the booleans, the framework builds/removes the `website.event.menu`
+ `website.menu` rows. To **unpublish** the whole minisite: `update('event.event',[1],{'is_published':
False})` (or set `website_visibility:'link'` to keep it reachable-by-URL but off the public list).

### 2. Add / publish an AGENDA track (session + speaker) — the 3-part gate

`event.track` only exists where `website_event_track` is installed (TCSW). A session shows on the
Agenda only when its **stage is agenda-visible AND `is_published` AND the event's `website_track` is
on**. So set the stage to a public one *and* publish.

```
# Find the public/agenda stages and rooms first:
search('event.track.stage', [], ['name','sequence','is_visible_in_agenda','is_fully_accessible'])
search('event.track.location', [], ['name'])          # TCSW: Minneapolis / St. Paul

# Create a session with its speaker inline (speaker lives ON the track):
tid = create('event.track', {
    'event_id': 1,
    'name': 'Fundraising in a Down Market',
    'date': '2026-09-15 15:00:00',        # Datetime, UTC-naive; rendered in event.date_tz
    'duration': 1.0,                       # hours (float)
    'location_id': <minneapolis_loc_id>,   # the room
    'stage_id': <published_stage_id>,      # <- MUST be agenda-visible (TCSW 'Announced'/'Published')
    'tag_ids': [[6, 0, [<founders_tag_id>]]],
    'description': '<p>A candid session on…</p>',
    # speaker (inline partner_* fields):
    'partner_name': 'Alex Rivera',
    'partner_function': 'General Partner',
    'partner_company_name': 'North Loop Ventures',
    'partner_email': 'alex@example.com',
    'partner_biography': '<p>Alex has backed 40+ seed-stage founders…</p>',
    'is_published': True,                  # <- AND publish it
})
get('event.track', [tid], ['website_url','is_published','website_published','stage_id','can_publish'])
```
If it still doesn't show: check the event's `website_track` menu is on (recipe 1), the stage's
`is_visible_in_agenda` (a `Proposal`/`Confirmed`/`Refused` stage hides it), and `is_published`. To
publish an EXISTING proposed track, move its stage AND publish:
`update('event.track',[tid],{'stage_id':<published_stage_id>,'is_published':True})`. To pull a
session off the agenda without deleting: `update('event.track',[tid],{'is_published':False})` (or move
it to a non-agenda stage). Use m2m tuples on `tag_ids` (`[[6,0,ids]]` replace, `[[4,id]]` add).

### 3. Add / publish a SPONSOR or exhibitor on the wall (by tier)

`event.sponsor` only exists where `website_event_exhibitor` is installed (TCSW). A sponsor is a
`partner_id` at a `sponsor_type_id` tier; the wall ranks by the tier's `sequence` + shows its ribbon,
but only `is_published` sponsors appear (and the event's `exhibitor_menu` must be on).

```
# Tiers already defined on TCSW: Premier(Gold) > Presenter(Silver) > Supporting(Bronze) > Builder(none)
search('event.sponsor.type', [], ['name','sequence','display_ribbon_style'])
# Resolve or create the org partner (logo/name come from the partner):
pid = search('res.partner', [['name','=ilike','JPMorgan Chase']], ['id'], 1)   # or create one

sid = create('event.sponsor', {
    'event_id': 1,
    'partner_id': pid,                       # required — the org
    'sponsor_type_id': <premier_type_id>,    # required — the TIER (ribbon + rank)
    'exhibitor_type': 'sponsor',             # 'sponsor' (logo/footer) | 'exhibitor' | 'online'
    'url': 'https://jpmorganchase.com',
    'subtitle': 'Presenting sponsor',
    'website_description': '<p>Proud to back the Twin Cities startup community.</p>',
    'show_on_ticket': True,                  # also list on the register/ticket page
    'is_published': True,                    # <- required to appear on the wall
})
get('event.sponsor', [sid], ['website_url','is_published','sponsor_type_id','website_image_url'])
```
The **logo** is the `partner_id`'s image — set the partner's `image_1920` if it has none. To add a NEW
tier: `create('event.sponsor.type', {'name':'Community','sequence':5,'display_ribbon_style':'no_ribbon'})`.
To pull a sponsor off the wall: `update('event.sponsor',[sid],{'is_published':False})`. A pure
`exhibitor`/`online` also gets its own `/event/<slug>/exhibitor/<slug>` page; a `sponsor` shows as a
logo in the wall/footer only.

### 4. Give the event page a cover, subtitle and SEO/OpenGraph

Presentation of the minisite header. Cover is the same JSON `cover_properties` shape as the blog
([[everjust-website-blog]]) — the `background-image` key inside a JSON blob.

```
# a) stage a cover image as a servable attachment:
att = create('ir.attachment', {
    'name': 'tcsw-cover.jpg', 'datas': '<base64>',
    'res_model': 'event.event', 'res_id': 1, 'mimetype': 'image/jpeg', 'public': True})
url = '/web/image/%s' % att

# b) write the cover JSON + subtitle + SEO:
import json
update('event.event', [1], {
    'cover_properties': json.dumps({
        'background-image': "url('%s')" % url,
        'background_color_class': 'o_cc3', 'opacity': '0.2',
        'resize_class': 'o_half_screen_height'}),
    'subtitle': 'Five days. Two cities. One pass.',
    'website_meta_title': 'Twin Cities Startup Week 2026',
    'website_meta_description': '200+ events across Minneapolis & Saint Paul, Sept 14–18, 2026.',
    'website_meta_og_img': url,
    'seo_name': 'twin-cities-startup-week-2026',    # URL slug override
})
```
`background-image:"none"` = no cover; keep the value valid JSON (a bare URL string breaks rendering).
`event_register_url` / `website_url` are computed — don't set them. Times on the page render in
`date_tz` (required on the event); the stored `date_begin`/`date_end` stay UTC-naive.

### 5. Read the registrations the site produced (hand off to the backend)

Turning on `register_menu` exposes the RSVP form; each submit is an `event.registration`. Read them
here — but drive their lifecycle / CRM / reminders in [[everjust-events]].

```
# Registrations for the event (state open = confirmed):
search('event.registration', [['event_id','=',1]],
       ['name','email','state','visitor_id','create_date','lead_ids'], 200, 'id desc')
# Seat/capacity snapshot for the register page:
get('event.event', [1], ['seats_limited','seats_max','seats_available','seats_taken'])
# Did website_event_crm turn RSVPs into leads?  (needs an event.lead.rule — see [[everjust-events]])
search('crm.lead', [['id','in', <lead_ids>]], ['name','email_from','stage_id'])
```
To create/confirm/cancel a registration, wire lead rules, or schedule a confirmation/reminder
email/SMS, **switch to [[everjust-events]]** — those are backend mechanics, not site publishing. If
you need PAID tickets, note `event_sale` is uninstalled on every tenant (free RSVP only).

### 6. Diagnose "it's not showing on the site"

Walk the gates in order; each layer is a common cause.

```
# Event not on /event at all?  -> publish flag + visibility + right site:
get('event.event', [1], ['is_published','website_published','website_visibility','website_id','website_url'])
#   is_published False -> unpublished.  website_visibility 'link'/'logged_users' -> not on public list.
#   wrong website_id on a multi-site tenant -> shows on the other site only.

# Agenda/Exhibitors TAB missing? -> the menu toggle, and the add-on install:
get('event.event', [1], ['website_menu','website_track','exhibitor_menu','register_menu'])
search('website.event.menu', [['event_id','=',1]], ['menu_type'])   # which tabs actually exist
describe_model('event.track')     # KeyError => website_event_track not installed here

# A specific TRACK not on the agenda? -> the 3-part gate:
get('event.track', [<tid>], ['is_published','website_published','stage_id'])
get('event.track.stage', [<stage_id>], ['name','is_visible_in_agenda','is_fully_accessible'])
#   stage not is_visible_in_agenda (Proposal/Confirmed/Refused/Cancelled) OR is_published False -> hidden.

# A SPONSOR not on the wall? -> is_published + the exhibitor menu:
get('event.sponsor', [<sid>], ['is_published','sponsor_type_id','exhibitor_type'])
```
And confirm you're on the **right tenant DB** — the agenda/sponsor wall only exists on
`tcstartupweek` (recipe 0). If the whole `/event` list is missing, `website_event` itself or the
`everjust.public_website` gate is the issue (see [[everjust-platform]]).

## Pitfalls (everjust-specific)

1. **The event minisite is GENERATED from records — do NOT author it with the WEBSITE TOOLS.** The
   `website_event` controller renders `/event/<slug>` and every sub-page (Home/Agenda/Talks/
   Exhibitors/Register) from the `event.event` + its `event.track`/`event.sponsor` records + menu
   toggles. **Never** `website_new_page`/`website_edit_page`/`website_publish` an event or track — you
   publish with `is_published` on the record. The WEBSITE TOOLS are only for the STATIC `/event` list
   chrome and marketing pages (Pitfall 2). Calling `website_publish` on an event does nothing to
   expose it.

2. **The TCSW `/tickets` and `/sponsor` MARKETING pages are hardcoded Tailwind QWeb, NOT
   `event.sponsor`/ticket records.** Module `website_tcsw` ports those pages pixel-faithfully with
   Tailwind classes and **static** tier/sponsor cards that merely link to `/event/<slug>/register`.
   Editing a tier card, adding a sponsor logo there, or changing copy is `website_edit_page` on that
   `ir.ui.view` (the site-chrome path in [[everjust-platform]]) — it does **not** touch
   `event.sponsor`. Conversely, publishing an `event.sponsor` updates the GENERATED Exhibitors wall,
   NOT the hand-authored `/sponsor` page. Know which surface the task means before you act.

3. **`event.track` (agenda/speakers) and `event.sponsor` (exhibitor wall) exist on ONLY SOME
   tenants.** `website_event_track` + `website_event_exhibitor` are installed on **`tcstartupweek`
   only**; on `connectdomain`/`headsup`/`weldon` those models `KeyError`. Check install state (recipe
   0) before touching the agenda or sponsor wall — those tenants have the event minisite + register
   page but no agenda/wall. Turning on `website_track`/`exhibitor_menu` where the add-on is absent is
   a no-op.

4. **Menu toggles are the source of truth for which sub-pages exist — don't hand-create
   `website.event.menu`.** The booleans (`website_menu` master, `register_menu`, `website_track`,
   `website_track_proposal`, `exhibitor_menu`, `community_menu`, `introduction_menu`) auto-create and
   auto-remove the `website.event.menu` (+ `website.menu`) rows. Flip the boolean; the `*_menu_ids`
   are read-only reflections. Hand-inserting menu rows desyncs from the toggle and breaks on the next
   recompute.

5. **Publishing a track is a THREE-part gate, not just `is_published`.** A session appears on the
   Agenda only when the event's **`website_track` menu is on** AND the track's **`stage_id` is
   agenda-visible** (`is_visible_in_agenda`; its own page is fully public only at an
   `is_fully_accessible` stage) AND **`is_published`** is True. A published track in a
   `Proposal`/`Confirmed`/`Refused`/`Cancelled` stage still won't show. Move the stage AND set
   `is_published`.

6. **The event publish gate is `is_published` + `website_visibility`.** `is_published=True` alone
   isn't enough to be publicly *listed* if `website_visibility` is `link` (unlisted) or
   `logged_users` (sign-in required). `website_published`/`can_publish`/`is_visible_on_website` are
   **computed — read them, don't write them.** Write `is_published` and `website_visibility`.

7. **Registration here is FREE RSVP — no paid checkout.** `event_sale`/`website_event_sale` are
   uninstalled on every tenant, so the website register form creates a free `event.registration` and
   `event.event.ticket` is a free segmentation type only — no `sale.order`, no price, no payment page.
   Don't promise a paid ticket flow or reason about invoicing on these tenants.

8. **The registration LIFECYCLE, CRM leads, and reminder comms are the BACKEND — [[everjust-events]],
   not here.** This skill exposes the register *page* and reads the resulting `event.registration`s.
   Confirming/cancelling, `event.lead.rule` (RSVP→`crm.lead` via `website_event_crm`), and
   `event.mail`/`event_sms` confirmations & reminders all live in [[everjust-events]]. Don't run the
   lifecycle from here; don't route event mail through [[everjust-mail-ops]] (it's stock
   `mail.template`).

9. **Sponsor logo + name come from the `partner_id`; the wall ranks/ribbons by
   `sponsor_type_id`.** A blank logo means the partner has no `image_1920` — set it on the partner,
   not the sponsor. Tier order is the type's `sequence` (lower = higher on the wall); the ribbon is
   `display_ribbon_style` (Gold/Silver/Bronze/none). Only `is_published` sponsors render.

10. **Everything is per-tenant DB, per-`company_id`, per-`website_id`.** Events, tracks, sponsors, and
    the register form are tenant-scoped; on a multi-site tenant an event with the wrong `website_id`
    shows on the other site only. On any multi-tenant task confirm you are on the right DB (the
    event-heavy one is `tcstartupweek`) and the correct `website_id` before publishing (see
    [[everjust-platform]], [[everjust-agent-mcp]]).

## See also

- [[everjust-events]] — the **registration/CRM/reminder BACKEND** (`event.registration` lifecycle,
  `event.lead.rule`, `event.mail`/`event_sms`, seats). This skill publishes the *site* + register
  *page*; that skill runs what happens after someone RSVPs. Read it whenever the task leaves "expose
  the event/agenda/sponsors" and enters "confirm/cancel/lead/reminder."
- [[everjust-platform]] — tenancy model, `/odoo` debrand, the `everjust.public_website` gate, forced
  light mode, per-tenant website/theme installs, and the QWeb **site-chrome / marketing-page path**
  (WEBSITE TOOLS, Tailwind-utility QWeb under `<t t-call="website.layout">`, COW-into-a-site-view).
  Read it to edit the `/event` list chrome or the TCSW `/tickets` / `/sponsor` marketing pages — those
  are NOT the generated minisite.
- [[everjust-agent-mcp]] — how to connect to the tenant MCP and the generic
  `search`/`get`/`create`/`update`/`call`/`describe_model` toolset + the WEBSITE TOOLS' signatures and
  the `confirm` / ACL (website-designer) gates every recipe above relies on.
- [[everjust-website-blog]] — the sibling public-website CONTENT type (`blog.post`). Same
  `cover_properties` JSON cover + `website_meta_*` SEO, but a different publish gate
  (`is_published`+`post_date`) and a follower-email side effect. Don't cross events with blog posts.
