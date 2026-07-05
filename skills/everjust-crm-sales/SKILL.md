---
name: everjust-crm-sales
description: Operate the CRM / "crm-sales" app of an everjust.app Odoo tenant over the MCP/ORM — create and qualify leads, move opportunities through the pipeline stages, assign a salesperson/team, log activities and notes, mark won/lost, attribute to a UTM campaign, and (carefully) fire SMS. Use when the task is to add or triage a CRM lead/opportunity, advance or reorganize the pipeline, run pipeline reporting, or text a contact from a lead. This is stock Odoo `crm`/`sales_team`/`crm_sms`/`website_crm`/`event_crm` under the everjust white-label brand — there is NO Sales app: `sale.order`, `sale.order.line`, and `account.move` (invoices) are NOT installed, so do not reach for quotations/invoices here. SMS transport is the everjust-swapped gateway (TextBee/Ringover), which is gate-sensitive per tenant. Cross-references [[everjust-agent-mcp]], [[everjust-platform]], and [[everjust-mail-ops]].
---

# EVERJUST CRM-Sales — Agent Skill

Operate the **CRM app** of a live everjust.app Odoo tenant as an agent: create and
qualify **leads/opportunities**, walk them through the **pipeline stages**, assign a
**salesperson** and **sales team**, log **activities** and chatter notes, mark **won/lost**,
attribute to a **UTM campaign**, and text a contact via **SMS**. Everything is driven
through the Odoo MCP tools (`search`, `get`, `find`, `create`, `update`, `call`,
`describe_model`) — see **[[everjust-agent-mcp]]** for opening a session against the right
tenant and the exact tool signatures. This skill covers the CRM app specifically: its real
models, its everjust-specific gotchas, and concrete recipes.

This is **mostly stock Odoo CRM** with an everjust **white-label brand** layer on top
(the `everjust_brand` addon only rebrands UI/emails — it changes no CRM logic). Two things
are genuinely everjust-specific and load-bearing for an operating agent: **there is no
Sales app** (no `sale.order`/`account.move` on this tenant — see When-NOT), and **SMS
transport is swapped** to the everjust gateway (TextBee, or Ringover) which is *gate-sensitive
per tenant* (see Pitfalls).

## When to use this skill

- **Create / capture a lead or opportunity** and put it on the right team, stage, and owner.
- **Qualify and advance the pipeline** — move an opp from stage to stage, set probability,
  set priority, mark **won** or **lost** (with a lost reason).
- **Assign** a salesperson (`user_id`) and/or sales **team** (`team_id`).
- **Log an activity** (Call/Email/Meeting/To-Do) or a chatter note on a lead.
- **Attribute** a lead to a **UTM campaign / source / medium** and report on the pipeline
  (counts by stage, expected revenue, win rate).
- **Text a contact** from a lead via `crm_sms` — with a clear-eyed read of whether the
  tenant's SMS transport is actually wired (Pitfall 5).

## When NOT to use this skill

- **Quotations, sales orders, invoicing, payments.** The **Sales app is NOT installed** —
  `sale`, `sale_management`, and `account` are all `uninstalled` on this tenant. There is no
  `sale.order`, `sale.order.line`, or `account.move`. `crm.lead` has **no** `order_ids` /
  quotation flow. If the task needs a quote or invoice, stop: it requires installing modules
  (UI/platform-ops work — see [[everjust-platform]]), not an ORM call.
- **Sending regular email** (compose/reply as a mailbox, read an inbox) — that is the
  separate native webmail stack; use **[[everjust-mail-ops]]** (`everjust.mail.*`), not
  `crm.lead` chatter, for real outbound mail.
- **Bulk email blasts / mass-mailing campaigns** — `mass_mailing` is installed and
  `utm.campaign` ties into it, but blasting is gated; see [[everjust-mail-ops]] Pitfalls.
- **Odoo administration** that needs the web UI (installing the Sales app, editing stages'
  views, adding activity types) — MCP is ORM-only. Escalate to a human with UI access.

---

## Key models (real `_name`s + the fields that matter here)

Grounded against the live `connectdomain` tenant. `crm.lead` is a huge model; only the
operationally-relevant fields are listed — always `describe_model("crm.lead")` before a
write rather than trusting this list wholesale.

| Model | Role | Fields you actually use |
|---|---|---|
| `crm.lead` | **The lead/opportunity.** One row is BOTH a "lead" and an "opportunity" — the `type` field distinguishes them. | `name` (**required**, the "Opportunity" title), `type` (**required**, `lead`\|`opportunity` — **defaults to `opportunity`**, see Pitfall 1), `stage_id`→`crm.stage`, `team_id`→`crm.team`, `user_id`→`res.users` (salesperson), `partner_id`→`res.partner` (linked contact), `contact_name` / `partner_name` (Company Name) / `email_from` / `phone` / `mobile` (free-text when no partner), `expected_revenue` (monetary), `probability` (float 0-100, **auto-scored** — Pitfall 6), `priority` (`0` Low\|`1` Medium\|`2` High\|`3` Very High), `won_status` (`won`\|`lost`\|`pending`), `date_deadline` (Expected Closing), `tag_ids`→`crm.tag` (m2m), `campaign_id`→`utm.campaign`, `source_id`→`utm.source`, `medium_id`→`utm.medium`, `lost_reason_id`→`crm.lost.reason`, `description` (html Notes), `active` (False = archived/lost), `company_id` |
| `crm.stage` | **Pipeline column.** Ordered by `sequence`; one stage flagged `is_won`. | `name`, `sequence`, `is_won` (bool — the "Won" stage), `fold` (collapsed in kanban), `team_ids`→`crm.team` (m2m; empty = shared across all teams), `rotting_threshold_days` |
| `crm.team` | **Sales team.** Groups opps + owns the alias/assignment config. | `name`, `use_leads` (bool — team uses the lead→opp funnel), `use_opportunities` (bool — team has a pipeline), `user_id` (team leader), `member_ids`→`res.users` (m2m salespeople), `alias_id` / `alias_name` (inbound email→lead), `assignment_enabled` |
| `utm.campaign` | **Marketing campaign** for attribution + reporting. Ties leads and mass-mailings together. | `name` (**required**, the identifier), `title` (**required**, human name), `user_id` (**required**, responsible), `stage_id`→`utm.stage` (**required**), `crm_lead_count` (computed), `tag_ids`→`utm.tag` |
| `crm.tag` | Free labels on a lead. | `name` |
| `crm.lost.reason` | Reason picker when marking lost. | `name` |
| `utm.source` / `utm.medium` | Attribution dimensions alongside campaign. | `name` |
| `mail.activity` / `mail.activity.type` | **Scheduled to-dos on a lead** (Call/Email/Meeting/To-Do…). You create activities on `crm.lead`, not standalone. | `activity_type_id`, `summary`, `note`, `date_deadline`, `user_id`, `res_model`, `res_id` |

**Live-tenant specifics (connectdomain), verified:**
- Pipeline stages: **New**(1) → **Qualified**(2) → **Proposition**(3) → **Contacted**(5) →
  **Demo Booked**(6) → **Negotiation**(7) → **Won**(4, `is_won=True`). This is a *customized*
  stage set (stock ships New/Qualified/Proposition/Won only), so **resolve stage ids at
  runtime** — do not hardcode; `find("crm.stage", "Demo Booked")` etc.
- Exactly **one** team: **"Sales"** (id 1), `use_opportunities=True`, `use_leads=False`.
- `crm.use_leads` system param = **False** → the lead→opportunity funnel is OFF tenant-wide;
  new records default to `type='opportunity'` and go straight to the pipeline.
- Activity types available: To-Do, Email, Call, Meeting, Document, plus a bespoke
  **"Certifications"**.
- Company `sms_provider='iap'` and `everjust.sms_gateway_url` is **empty** — the everjust SMS
  swap is installed but **not wired on this tenant** (Pitfall 5).

Installed CRM modules on the tenant: `crm`, `sales_team`, `crm_sms`, `website_crm`,
`event_crm`, `utm`, `mass_mailing`, `everjust_brand`, `everjust_sms_gateway`. What each adds:
- **`sales_team`** — `crm.team`, salesperson/team assignment, per-team pipeline.
- **`crm_sms`** — SMS composer/templates/phone-field buttons bound to `crm.lead` (chatter-
  threaded). Transport is the everjust swap, not metered IAP *when wired* (Pitfall 5).
- **`website_crm`** — the public website "Contact Us" form creates `crm.lead` rows (usually
  `type='lead'`, tagged from the form). New inbound leads may appear from the site.
- **`event_crm`** — `event.lead.rule` auto-creates a `crm.lead` from event registrations
  (per-attendee or per-order). Leads can appear that no human typed; check `source_id`.

Note: `everjust_ringover` (which adds an `action_ringover_call` button + call logging to
`crm.lead`) is present in the addons tree but **uninstalled** on this tenant. Don't call
`action_ringover_call` here — it 's not on the model. On a tenant where it *is* installed,
that method dials the embedded Ringover softphone.

---

## Recipes

Route every call through the Odoo MCP against the tenant DB (see [[everjust-agent-mcp]];
in Claude Code the tools are namespaced `mcp__everjust__<tool>`). Shown as `tool(args)`.
**Always `describe_model` before your first write** to confirm `your_access.create/write`
and current field names.

### 1. Create a lead/opportunity (and put it in the pipeline correctly)

```text
# Confirm you can write, then resolve the m2o targets to ids at runtime.
describe_model(model="crm.lead")                       # your_access.create == true?
find(model="crm.stage", name="New")        → [[1, "New"]]
find(model="crm.team",  name="Sales")      → [[1, "Sales"]]
find(model="res.users", name="Jordan")     → [[7, "Jordan Ellis"]]   # salesperson

create(model="crm.lead", values={
  "name": "connectdomain.app — Acme wants custom-domain onboarding",  # required title
  "type": "opportunity",          # BE EXPLICIT — see Pitfall 1 (default is 'opportunity')
  "contact_name": "Jane Doe",
  "partner_name": "Acme Corp",    # Company Name (free text; no partner_id yet)
  "email_from": "jane@acme.com",
  "phone": "+1 555 010 2020",
  "expected_revenue": 1200,
  "priority": "2",                # High
  "stage_id": 1,                  # New
  "team_id": 1,                   # Sales
  "user_id": 7,
  "tag_ids": [[6, 0, [18, 5]]]    # replace tags with 'custom-domain'(18) + 'crm'(5)
})
  → { created_id: 84, display_name: "connectdomain.app — Acme wants…" }
```

To create a **lead** (unqualified, kept out of the pipeline) instead, pass `"type": "lead"`
— but note `use_leads=False` on this tenant means the UI won't surface a separate Leads
view; opportunities are the norm here. For x2many tags: `[[6,0,[ids]]]` replaces, `[[4,id]]`
adds one. Resolve tag ids with `find(model="crm.tag", name="…")`.

### 2. Advance an opportunity through a stage (and set probability)

```text
find(model="crm.lead", name="Acme wants custom-domain")  → [[84, "connectdomain.app — Acme…"]]
find(model="crm.stage", name="Demo Booked")              → [[6, "Demo Booked"]]

update(model="crm.lead", ids=[84], values={
  "stage_id": 6,          # move to "Demo Booked"
  "probability": 40       # optional manual override; otherwise auto-scored (Pitfall 6)
})
  → true
```

Batch-move: pass several ids to one `update`. **Never hardcode a stage id across tenants** —
the stage set is customized (Demo Booked / Contacted / Negotiation exist here but not in a
vanilla DB). Always `find`/`search` `crm.stage` first.

### 3. Mark won / lost (the correct methods, not a raw stage write)

```text
# WON — use the model method so probability→100, won_status='won', and the won stage apply:
call(model="crm.lead", method="action_set_won_rainbowman", ids=[84], confirm=true)
  → true
# (action_set_won also exists; the rainbowman variant is the standard "mark won" action.)

# LOST — pick a reason first, then call the lost action with it:
find(model="crm.lost.reason", name="Too expensive")   → [[1, "Too expensive"]]
call(model="crm.lead", method="action_set_lost", ids=[84],
     kwargs={"lost_reason_id": 1}, confirm=true)
  → true
```

`action_set_lost` sets `active=False` (archives the opp), `probability=0`, and
`won_status='lost'` — it does more than a stage write, so use the method. A lost opp
**disappears from default searches** (`active=False`); to find it later add
`["active","=",false]` to your domain or pass `context={"active_test": false}`. To reopen a
lost opp: `call(model="crm.lead", method="toggle_active", ids=[84], confirm=true)` then move
its stage.

### 4. Log an activity or a chatter note on a lead

```text
# A scheduled activity (a "Call" due tomorrow), assigned to a user:
find(model="mail.activity.type", name="Call")   → [[3, "Call"]]
call(model="crm.lead", method="activity_schedule", ids=[84],
     kwargs={"act_type_xmlid": "mail.mail_activity_data_call",
             "summary": "Confirm demo time",
             "date_deadline": "2026-07-08",
             "user_id": 7},
     confirm=true)
  → <activity id>

# Or a plain chatter note (logged internally, NOT emailed to the customer):
call(model="crm.lead", method="message_post", ids=[84],
     kwargs={"body": "Left voicemail; will retry Tuesday.",
             "message_type": "comment", "subtype_xmlid": "mail.mt_note"},
     confirm=true)
```

`message_post` with `subtype_xmlid="mail.mt_note"` is an **internal log** — it does not
email anyone. Use `mail.mt_comment` only if you *intend* followers to be notified. To email
the customer for real, use **[[everjust-mail-ops]]**, not chatter. To complete an activity:
`call(model="mail.activity", method="action_done", ids=[<activity id>], confirm=true)`.

### 5. Attribute to a campaign + report on the pipeline

```text
# Attach a lead to an existing campaign (create the campaign first if needed):
find(model="utm.campaign", name="ph-launch-2026")   → [[3, "ph-launch-2026"]]
update(model="crm.lead", ids=[84], values={"campaign_id": 3})

# Pipeline snapshot — open opps grouped/counted by stage:
count(model="crm.lead", domain=[["type","=","opportunity"],["active","=",true]])
search(model="crm.lead",
       domain=[["type","=","opportunity"],["active","=",true]],
       fields=["name","stage_id","user_id","expected_revenue","probability","won_status"],
       order="expected_revenue desc", limit=50)

# Won this quarter:
count(model="crm.lead",
      domain=[["won_status","=","won"],["date_closed",">=","2026-04-01"]])
```

Creating a `utm.campaign` requires `name`, `title`, `user_id`, **and** `stage_id`
(→`utm.stage`, required): `find(model="utm.stage", name="…")` first, or copy an existing
campaign's `stage_id`.

### 6. Text a contact from a lead (crm_sms) — only after verifying transport is wired

```text
# FIRST verify the tenant's SMS transport is actually configured (Pitfall 5):
get(model="res.company", ids=[1], fields=["name","sms_provider"])
search(model="ir.config_parameter",
       domain=[["key","in",["everjust.sms_gateway_url","everjust.ringover_from_number"]]],
       fields=["key","value"])
# If sms_provider='iap' AND everjust.sms_gateway_url is empty → the everjust swap is NOT
# wired; a send would hit metered Odoo IAP (or fail). Do NOT blast; flag to a human.

# When wired, send an SMS bound to the lead's chatter (crm_sms):
find(model="crm.lead", name="Acme wants custom-domain")   → [[84, "…"]]
call(model="crm.lead", method="message_post", ids=[84],
     kwargs={"body": "Hi Jane — confirming your connectdomain demo Tues 2pm.",
             "message_type": "sms"},
     confirm=true)
# (crm_sms threads the SMS into the lead; the SmsApi transport class the company resolves
#  to actually delivers it. Read the resulting sms.sms state to confirm delivery.)
```

Confirm delivery on the `sms.sms` row (`state` in `sent`/`error`), not on the fact that a
chatter line appeared — a filed SMS message is not proof it left the gateway.

---

## Pitfalls (everjust- and tenant-specific)

1. **`type` defaults to `opportunity`, and the lead funnel is OFF here.** On this tenant
   `crm.use_leads=False` and the sole team has `use_leads=False`, so a `crm.lead` created
   without `type` lands **directly in the pipeline as an opportunity** at the default stage —
   it skips any "lead qualification" step. If you meant an untriaged lead, set
   `"type": "lead"` explicitly (and know it won't show in a Leads view the tenant doesn't
   surface). Be deliberate about `type`.

2. **There is NO Sales app — no quotes, orders, or invoices.** `sale`, `sale_management`,
   and `account` are uninstalled. `sale.order` / `sale.order.line` / `account.move` **do not
   exist** on this tenant, and `crm.lead` has no quotation/order relation. Any task that
   needs a quote, order, or invoice is out of scope: it needs a module install (platform-ops,
   [[everjust-platform]]), not an ORM call. Don't hallucinate `order_ids`.

3. **Stage ids are customized — resolve them at runtime, never hardcode.** This tenant added
   Contacted / Demo Booked / Negotiation and reordered by `sequence`; "Won" is id 4, not the
   last id. Always `find`/`search` `crm.stage` by name before setting `stage_id`, and detect
   the won stage via `is_won=True` rather than a fixed id. Hardcoded ids will silently move an
   opp to the wrong column on another tenant.

4. **Mark won/lost via the model methods, not a bare `stage_id`/`active` write.** Use
   `action_set_won_rainbowman` (or `action_set_won`) and `action_set_lost(lost_reason_id=…)`.
   Writing `stage_id` to the Won stage by hand does **not** set `won_status`/`probability=100`;
   writing `active=False` by hand does not record a lost reason or `won_status='lost'`.
   The methods keep the derived fields consistent.

5. **SMS transport is the everjust swap — and it may not be wired on the tenant you're on.**
   `everjust_sms_gateway` replaces metered IAP with **TextBee** (`everjust.sms_gateway_url` +
   `…_key`) or **Ringover** (`everjust.ringover_*`), selected by `res.company.sms_provider`
   (`textbee`\|`ringover`\|`iap`). The fallback auto-picks TextBee **only if
   `everjust.sms_gateway_url` is set**; otherwise it falls through to `super()` = **metered
   Odoo IAP**. On `connectdomain` right now `sms_provider='iap'` and the gateway URL is
   **empty** — so SMS is *not* on the free self-hosted path. Before any SMS, check
   `sms_provider` + `everjust.sms_gateway_url`/`everjust.ringover_from_number`; if unwired,
   don't send (you'd burn IAP credits or fail) — flag it. Also: TextBee/Ringover return
   `server_error` on failure and mark the `sms.sms` failed (never silently dropped), and
   Ringover needs a registered A2P 10DLC campaign or it rejects. This mirrors the
   transport-swap pattern in [[everjust-mail-ops]] (that stack swaps *email* transport to SES).

6. **`probability` is auto-scored — a manual value can be overwritten.** Predictive lead
   scoring is active (`crm.pls_start_date` is set), so Odoo recomputes `probability` on
   `crm.lead`. If you write a manual `probability`, later scoring/stage changes may override
   it. Set it only when you need a one-off override, and don't treat it as authoritative for
   reporting — prefer `won_status` and stage for pipeline truth.

7. **Lost opps are archived (`active=False`) and vanish from default searches.** After
   `action_set_lost`, the opp won't appear in a plain `search`. Add `["active","=",false]`
   (or `context={"active_test": false}`) to see lost/archived leads, and `toggle_active` to
   reopen one. Win-rate reporting must account for archived losers.

8. **Leads can appear that no agent created** — `website_crm` (public Contact form →
   `crm.lead`) and `event_crm` (`event.lead.rule` → auto lead per registration) both
   manufacture leads. Don't assume every row was human-entered; check `source_id`/`medium_id`
   and `campaign_id` to understand provenance before acting.

9. **The brand layer is cosmetic — don't attribute CRM behavior to it.** `everjust_brand`
   only white-labels UI, emails, and dialogs (favicon, "powered by", OdooBot name). It adds
   **no** CRM fields, stages, or logic. If CRM behaves unexpectedly, it's stock Odoo config
   (stages, teams, scoring) or `crm_sms`/`event_crm`/`website_crm` — not the brand addon.

10. **Everything is per-`company_id` and role-bounded.** Leads, teams, campaigns, and tags
    are scoped to the tenant/company, and the MCP runs as your API-key user — an `AccessError`
    means a role limit, not a missing record (see [[everjust-agent-mcp]] Pitfalls). Confirm
    you're on the right tenant DB before searching.

## See also

- [[everjust-agent-mcp]] — how to connect the MCP, the exact `search`/`get`/`create`/
  `update`/`call` tool signatures, `confirm`-gating, and `describe_model.your_access`. Read
  it for the "how to call"; this skill is the "what to call in CRM."
- [[everjust-platform]] — tenancy model, per-company scoping, and what installing/uninstalling
  an app (e.g. adding the Sales app) entails.
- [[everjust-mail-ops]] — real outbound/inbound **email** as a tenant mailbox (`everjust.mail.*`),
  and the parallel email-transport swap (SES). Use it instead of `crm.lead` chatter whenever
  you must actually email a customer, and for mass-mailing gating.
