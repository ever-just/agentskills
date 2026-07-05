---
name: everjust-website-forms
description: Wire a public website form on an everjust.app (Odoo 19) tenant to a backend model — enable a model as a form target, place the form on a marketing page, and route submissions (Contact-Us → CRM lead, with medium=Website attribution + team/salesperson assignment). Use when the task is to add or fix a Contact-Us / lead-capture / newsletter / task-request form, make a NEW model accept form submissions, understand the POST /website/form/<model> contract and its field whitelist, or set where website leads land (default team / salesperson). Plumbing is stock Odoo website + website_crm (Odoo 19 has NO separate website_form module — the /website/form controller lives in the website addon); drive it via the everjust_agent_mcp WEBSITE tools (the <form> is QWeb in a page arch) plus generic ORM (ir.model.website_form_access, formbuilder_whitelist on ir.model.fields, website.crm_default_team_id). Cross-references [[everjust-website]], [[everjust-crm-sales]], [[everjust-agent-mcp]], [[everjust-platform]].
---

# EVERJUST Website Forms — Agent Skill

Wire a **public website form** to a backend model on a live everjust.app tenant, and
route where its submissions land. Two halves: (1) the **form target** — a model must be
opted in (`ir.model.website_form_access = True`) before the framework will accept a POST
to it; (2) the **placement** — an HTML `<form action="/website/form/<model>">` living in a
marketing page's QWeb `arch`. The default and most common target is **`crm.lead`**
("Contact Us" → a CRM lead), which the `website_crm` addon further routes with
`medium=Website` attribution and a default sales **team**/**salesperson**.

This is **stock Odoo `website` (`website_form`) + `website_crm`** under the everjust
white-label brand — the everjust addons don't change the form pipeline; they change the
*page chrome* it lives in (the pages are hand-written Tailwind QWeb, not drag-drop
snippets — see [[everjust-website]]). You drive it through the **`everjust_agent_mcp`**
server: the **WEBSITE tools** (`website_edit_page` / `website_pages`) to put the `<form>`
on a page, plus the **generic ORM tools** (`search`/`get`/`update`/`describe_model`/`find`)
to flip the model flags and set the routing config. See [[everjust-agent-mcp]] for opening
a session and the tool signatures; read [[everjust-platform]] for the tenancy invariants.

Note: on Odoo 19 there is **no standalone `website_form` module** — the form controller
ships inside the `website` addon (`website/controllers/form.py`); `website_crm` is what
adds the `crm.lead` routing. On the live `connectdomain` tenant `website_crm` **is**
installed (`website_form` as a separate module is not — it doesn't exist).

## When to use this skill

- **Add / fix a Contact-Us or lead-capture form** on a marketing page that creates a
  `crm.lead` on submit (the canonical case).
- **Enable a NEW model as a form target** — flip `website_form_access`, set the human
  label, and choose the field that catches free-text / unmapped inputs.
- **Control the field whitelist** — allow a field to be submittable (whitelist it via
  `ir.model.fields.formbuilder_whitelist`) or block one from being writable by a public form.
- **Route where website leads land** — set the default sales **team**
  (`website.crm_default_team_id`) and **salesperson** (`website.crm_default_user_id`),
  and understand the `medium=Website` attribution that gets stamped automatically.
- **Understand / debug the `POST /website/form/<model>` contract** — why a field silently
  dropped, why "The form's specified model does not exist", where custom fields go.

## When NOT to use this skill

- **Building the marketing page itself, nav, SEO, publish state, the COW arch mechanic** —
  that is [[everjust-website]]. This skill assumes you already know how to `website_edit_page`
  a page's arch; it only covers the `<form>` you put *inside* it.
- **Reading, triaging, or replying to the submitted leads** — that is [[everjust-crm-sales]]
  (pipeline stages, assignment, won/lost). A form CREATES a lead; working it is CRM.
- **Sending email / the `mail.mail` "Send an E-mail" form target as real outbound mail** —
  `mail.mail` is a valid form target (label "Send an E-mail", default field `body_html`),
  but the everjust NATIVE outbound stack is `everjust.mail.*`; see [[everjust-mail-ops]].
  A website "email me" form still funnels through this same `/website/form/mail.mail`
  path, but for real mailbox send/receive use mail-ops.
- **Newsletter signup** as a subscription flow — the target `mailing.contact`
  ("Subscribe to Newsletter") is here, but the list/segment/consent logic is
  [[everjust-website-newsletter]] / mass_mailing.
- **On-brand drag-drop blocks** — the `s_cd_*` snippet library is
  [[everjust-website-snippets]]; a website form is NOT one of those. You hand-write the
  `<form>` markup in the page arch, matching the page's Tailwind vocabulary.

---

## Architecture — how a form submission flows (grounded on the live `connectdomain` tenant)

```
public visitor submits <form action="/website/form/crm.lead" method="post"> (Tailwind QWeb on a page)
        │  POST  (auth="public", csrf=False, captcha='website_form')
        ▼
  WebsiteForm.website_form(model_name)   [odoo/addons/website/controllers/form.py]
        │  1. ir.model.search([model=model_name, website_form_access=True])  ← GATE
        │       none → {"error":"The form's specified model does not exist"}
        │  2. extract_data(): keep only _get_form_writable_fields() (the WHITELIST);
        │       unknown/blacklisted inputs become "custom" text; optional metadata
        │  3. website_form_input_filter(request, values)  ← per-model hook
        │       (crm.lead: stamps medium_id=Website, team_id/user_id, sets lead vs opp)
        │  4. insert_record(): create AS SUPERUSER; custom+meta text lands in
        │       website_form_default_field_id (crm.lead → description)
        ▼
   new crm.lead   →   worked in the pipeline via [[everjust-crm-sales]]
```

### Key models & real fields (live-verified)

| Model | Role | Fields that matter here (real) |
|---|---|---|
| `ir.model` | **The form-target registry.** A model is a legal form target ONLY if its row here has `website_form_access=True`. | `model`, `website_form_access` (bool — the gate), `website_form_label` (the human "Action" name shown in the builder), `website_form_key` (a short server-action key), `website_form_default_field_id`→`ir.model.fields` (the field that catches custom/unmapped inputs + metadata) |
| `ir.model.fields` | **Per-field whitelist.** Which of a target model's fields a PUBLIC form may write. | `model`, `name`, `website_form_blacklisted` (bool — **defaults to `True`**, so it's a whitelist: a field is submittable ONLY when explicitly set `False`). Do NOT raw-write this on a standard field — flip it with the `formbuilder_whitelist(model, fields)` method (raw SQL, no registry reload; needs `website.group_website_designer`). The effective allow-list is computed by `ir.model._get_form_writable_fields`. |
| `crm.lead` | **The default target** — a website lead/opportunity. | writable-by-form set (live): `name`, `contact_name`, `partner_name` (Company Name), `email_from`, `phone`, `description`, `team_id`, `user_id`, `lead_properties`. Plus `medium_id`/`campaign_id`/`source_id` set by the input filter, not the form. See [[everjust-crm-sales]] for the full model. |
| `website` | **Holds the CRM routing defaults** for forms (these are FIELDS on `website`, added by `website_crm`). | `crm_default_team_id`→`crm.team` (Default Sales Team; live = **"Sales"** id 1), `crm_default_user_id`→`res.users` (Default Salesperson; live = **empty/unassigned**). |
| `utm.medium` | Attribution dimension. The website form stamps the **"Website"** medium (id 1 here). | `name` (`"Website"`) — resolved via `utm.medium._fetch_or_create_utm_medium('website')`. |

**Live-tenant facts (connectdomain), verified — resolve at runtime, don't hardcode ids:**
- Form-target models with `website_form_access=True`: `crm.lead` (label "Create an
  Opportunity", key `create_lead`, default field **`description`**), `mailing.contact`
  ("Subscribe to Newsletter", key `create_mailing_contact`, **no** default field),
  `project.task` ("Create a Task", key `create_task`, default `description`), `mail.mail`
  ("Send an E-mail", key `send_mail`, default `body_html`).
- `crm.lead` public-form-writable fields (the 9 non-blacklisted): `name`, `contact_name`,
  `partner_name`, `email_from`, `phone`, `description`, `team_id`, `user_id`,
  `lead_properties`. Everything else (stage, revenue, probability, tags…) is blacklisted —
  a public form CANNOT set them.
- `website.crm_default_team_id` = **Sales** (id 1); `website.crm_default_user_id` =
  **False** (no default owner → lead is unassigned unless rule-based assignment picks it up).
- `medium=Website` (utm.medium id 1) is stamped automatically by
  `crm.lead.website_form_input_filter` on every form-created lead.

### The `POST /website/form/<model>` contract (what the `<form>` must contain)

The route is `@http.route('/website/form/<string:model_name>', type='http',
auth="public", methods=['POST'], website=True, csrf=False, captcha='website_form')`.
Your `<form>` markup must therefore:

- `action="/website/form/<model>"` and `method="post"` — `<model>` is the dotted model
  name, e.g. `crm.lead`. It **must** be a `website_form_access=True` model or you get
  `{"error":"The form's specified model does not exist"}`.
- Give each field an `name="<odoo_field_or_custom>"`. A `name` that matches an authorized
  (non-blacklisted) field of the model is written to the record; **any other `name`
  becomes a "custom" line** appended (as text) to the model's `website_form_default_field_id`
  (for `crm.lead` that's the `description` — this is why stray inputs show up in the lead's
  Notes, not lost).
- Special reserved inputs the controller consumes: `csrf_token` (partial CSRF — only
  enforced for *authenticated* sessions; anonymous submits skip it), `website_form_signature`
  (an HMAC used only by the `mail.mail` email_cc path), `context`. Don't repurpose these
  names for your own fields.
- Odoo's website JS submits it via AJAX and expects a JSON reply: `{"id": <new_id>}` on
  success, `{"error": "..."}` or `{"error_fields": [...]}` on failure. If you hand-roll
  markup, mimic the standard `s_website_form` structure (a `.s_website_form` form) so the
  shipped JS binds to it; the simplest safe path is to copy the arch of an existing working
  Contact-Us form.
- **CAPTCHA**: the route is `captcha='website_form'`. If the tenant has a captcha provider
  configured, the form must render the widget; without a provider it's a no-op. Don't
  assume a bare hand-built form passes captcha if one is enabled.

Because everjust marketing pages are **hand-written Tailwind QWeb** (not `s_*` snippets —
[[everjust-website]]), you place the form by editing the page arch and giving the form
elements the **same Tailwind classes** as the surrounding page. Keep the framework
form contract (`action`, field `name`s, the AJAX/JSON reply) intact.

---

## Recipes

Route each through the `everjust_agent_mcp` MCP against the tenant (see [[everjust-agent-mcp]]).
Website-page edits need an **admin / website-designer** role; the model-flag flips
(`ir.model` / `ir.model.fields` / `website`) need admin too. Always `describe_model` and
read `your_access` before a write.

### 1. Survey what's already wired (do this first)

```jsonc
// Which models can be form targets on this tenant?      tool: search
{ "model": "ir.model",
  "domain": [["website_form_access","=",true]],
  "fields": ["model","website_form_label","website_form_key","website_form_default_field_id"] }
// → crm.lead / mailing.contact / project.task / mail.mail (see live facts above)

// Which crm.lead fields may a public form submit?        tool: search
{ "model": "ir.model.fields",
  "domain": [["model","=","crm.lead"],["website_form_blacklisted","=",false]],
  "fields": ["name","field_description","ttype"] }
// → the 9-field allow-list; anything not here is dropped-to-custom, not written.

// Where do website leads currently route?                tool: get
{ "model": "website", "ids": [1],
  "fields": ["name","crm_default_team_id","crm_default_user_id"] }
```

Also list the pages (`website_pages`, see [[everjust-website]]) and `get` the arch of the
page you'll host the form on, so you keep its Tailwind idiom.

### 2. Place a Contact-Us form on a page (crm.lead target, COW-safe)

Fetch the page's current `arch`, insert a `<form>` block that posts to `/website/form/crm.lead`
using the page's Tailwind classes, then write the **complete** template back with
`website_edit_page` (it copy-on-writes into a website-specific view — see [[everjust-website]]):

```jsonc
// tool: website_edit_page   (arch must be the FULL template, not a fragment)
{ "url": "/contact",
  "arch": "<t name=\"Contact\" t-call=\"website.layout\"> … existing page …
    <form action=\"/website/form/crm.lead\" method=\"post\"
          class=\"s_website_form mx-auto w-full max-w-xl space-y-4\" data-mark=\"*\">
      <input type=\"hidden\" name=\"csrf_token\" t-att-value=\"request.csrf_token()\"/>
      <input name=\"contact_name\"  placeholder=\"Your name\"   class=\"w-full rounded-md …\"/>
      <input name=\"email_from\"    type=\"email\" required=\"1\" class=\"w-full rounded-md …\"/>
      <input name=\"partner_name\"  placeholder=\"Company\"      class=\"w-full rounded-md …\"/>
      <textarea name=\"description\" placeholder=\"How can we help?\" class=\"w-full rounded-md …\"/>
      <button type=\"submit\" class=\"rounded-md bg-stone-900 px-5 py-2.5 text-white\">Send</button>
    </form>
    … rest of page … </t>" }
```

- Use field **`name`s from the allow-list** (recipe 1): `contact_name`, `email_from`,
  `partner_name`, `phone`, `description`, `name` (the opportunity title). `email_from` is
  the sensible required field. Anything else (e.g. `name="budget"`) still works but lands
  in the lead's **`description`** as a "custom" line — intended, not a bug.
- Do **not** add `name="stage_id"`, `expected_revenue`, `tag_ids`, etc. — they're
  blacklisted; a public form can't set them (silently dropped-to-custom). Set those later
  in the pipeline via [[everjust-crm-sales]].
- Keep `class="s_website_form"` on the `<form>` (and the standard field-group structure if
  you want native validation styling) so Odoo's website JS binds AJAX submit + the JSON
  reply. Match every other class to the page's existing Tailwind vocabulary.
- The safest arch is a **copy of an existing working form** on this or a sibling tenant —
  clone its structure, swap the field `name`s, restyle with the page's classes.

### 3. Route website leads to a team / salesperson (and know the medium)

The routing defaults are **fields on the `website` record**, not raw config params:

```jsonc
// Set the default sales team + owner for all website-form leads.   tool: update
{ "model": "website", "ids": [1],
  "values": { "crm_default_team_id": <team_id>, "crm_default_user_id": <user_id> } }
// resolve ids first:  find(model="crm.team", name="Sales") ;  find(model="res.users", name="…")
```

- `crm.lead.website_form_input_filter` applies these at submit time: `team_id` ← the
  form's value **or** `website.crm_default_team_id`; `user_id` ← form value **or**
  `website.crm_default_user_id`; and if there's no user but a team and rule-based
  assignment is OFF, it falls back to the **team leader** (`team.user_id`).
- It ALSO decides **lead vs. opportunity**: if the chosen team has `use_leads=True` the
  record is a `lead`, else an `opportunity`. On connectdomain the Sales team is
  `use_opportunities` only, so website submissions land straight in the pipeline as
  **opportunities** — matching the tenant's leads-funnel-OFF config (see [[everjust-crm-sales]]).
- **`medium=Website`** is stamped automatically (`utm.medium._fetch_or_create_utm_medium('website')`)
  — you don't set it on the form. That's how you later filter "leads from the website"
  in CRM reporting (`medium_id.name = "Website"`). To also attribute a `campaign_id` /
  `source_id`, add hidden inputs — but those field `name`s must be whitelisted first
  (recipe 5; they're not in the default allow-list), so prefer setting campaign in CRM post-hoc.
- The `crm_default_user_id` many2one is domain-restricted to **internal** users
  (`share=False`); you can't route website leads to a portal/share user.

### 4. Enable a NEW model as a form target + set its catch-all field

To let a form post to a model that isn't yet a target (e.g. a custom model), flip the
gate on `ir.model` and choose the field that absorbs custom/unmapped inputs. **`ir.model`
is a structural model**, so `update` needs **`confirm:true`** (see [[everjust-agent-mcp]]):

```jsonc
// 1. resolve the ir.model row + the field you want as the catch-all
find(model="ir.model.fields", name="…")   // → id of e.g. the model's "description" field
// 2. enable it as a form target (structural → confirm)          tool: update
{ "model": "ir.model", "ids": [<ir_model_id>],
  "values": { "website_form_access": true,
              "website_form_label": "Request a demo",
              "website_form_default_field_id": <description_field_id> },
  "confirm": true }
```

- `website_form_default_field_id` is the field the controller dumps **custom fields +
  metadata** into (as text). Pick a long-text/`html` field (like `description`). If you
  leave it empty (as `mailing.contact` does), custom data is instead posted as a **chatter
  log message** on the new record — fine only if the model has chatter.
- `website_form_label` is the friendly action name; `website_form_key` is a short server
  key (auto-generated if omitted). Both are cosmetic to the POST contract but populate the
  builder UI.
- After enabling the model, its fields are still ALL blacklisted by default (the whitelist
  starts empty) — enabling the *model* doesn't auto-allow any field. Whitelist the ones the
  form submits with `formbuilder_whitelist` (recipe 5).

### 5. Allow (or block) a specific field on a form (use the method, not a raw write)

The controller only writes fields in `_get_form_writable_fields`, driven by
`ir.model.fields.website_form_blacklisted` — which **defaults to `True`** (it's a
whitelist, not a blacklist). **Do NOT `update` `website_form_blacklisted` directly on a
standard field**: the ORM only lets you write it on *custom* fields and a successful write
triggers a costly registry reload. The supported path is the model method
**`formbuilder_whitelist(model, fields)`** (raw SQL, no reload), called via the `call`
tool — it's a mutating method so needs **`confirm:true`** and the connected user must be in
`website.group_website_designer`:

```jsonc
// Whitelist fields so a public form MAY write them.        tool: call
{ "model": "ir.model.fields",
  "method": "formbuilder_whitelist",
  "args": ["crm.lead", ["mobile", "function"]],
  "confirm": true }
// → true   (both fields now submittable; the method validates they exist on the model)
```

- To **re-blacklist** (lock a field back down), set `website_form_blacklisted=true` — that
  direction is safe to do on standard fields via `update` because it doesn't add a custom
  field, but it still needs an admin role. Simpler: just remove the field's `name="…"`
  input from the form (recipe 2), since a blacklisted input drops-to-custom anyway.
- Only whitelist a field you genuinely want anonymous visitors to control. NEVER whitelist
  assignment/pricing/status fields you don't want spoofable from the public internet
  (`stage_id`, `probability`, `expected_revenue`, `priority`, `user_id` if you route by
  hand) — records are created as SUPERUSER, so the whitelist is the ONLY guard (Pitfall 5).
- Whitelisting alone doesn't add the field to any page — add a matching `name="<field>"`
  input to the form (recipe 2) afterward.

### 6. Debug "field didn't save" / "model does not exist"

```jsonc
// Is the target model actually enabled?
count(model="ir.model", domain=[["model","=","crm.lead"],["website_form_access","=",true]])
// → 0 means the /website/form/crm.lead POST returns {"error":"…model does not exist"}

// Is the field the form posts actually writable (not blacklisted)?
search(model="ir.model.fields",
       domain=[["model","=","crm.lead"],["name","=","<the_field>"]],
       fields=["name","website_form_blacklisted"])
// → website_form_blacklisted:true  ⇒ the value silently went into the lead's `description`
//    (the default field), it was NOT written to <the_field>.

// Did the lead land where expected? (medium, team, owner)
search(model="crm.lead", domain=[["medium_id.name","=","Website"]],
       fields=["name","email_from","team_id","user_id","description","create_date"],
       order="create_date desc", limit=10)
```

Most "the value disappeared" reports are a **blacklisted field name** → the input became a
custom line in `description`. Fix by un-blacklisting the field (recipe 5) + confirming the
form uses the exact field `name`.

---

## Pitfalls

1. **A model is NOT a form target until `ir.model.website_form_access=True`.** Posting to
   `/website/form/<model>` for any un-enabled model returns
   `{"error":"The form's specified model does not exist"}` — the model exists, it's just
   not opted in. Flip the flag (recipe 4, `confirm:true`); don't chase a "missing model".

2. **Only whitelisted (non-blacklisted) fields are written; everything else silently
   becomes text.** An input whose `name` matches a blacklisted field — or no field at all —
   is appended to the model's `website_form_default_field_id` (for `crm.lead`: `description`).
   Nothing errors. So `name="expected_revenue"` on a public form does NOT set the revenue;
   it dumps "expected_revenue : 5000" into the lead's Notes. Check the blacklist (recipe 6).

3. **`crm_default_team_id`/`crm_default_user_id` are FIELDS on `website`, not
   `ir.config_parameter`.** The param key `website.crm_default_team_id` reads False; the
   real values live on the `website` record. Set them with `update` on `website` (recipe 3),
   not on `ir.config_parameter`. (The metadata toggle IS a config param, but note its real
   key is **`website_form_enable_metadata`**, not `website.form_enable_metadata`.)

4. **`medium=Website` is stamped by the input filter, not the form — and the team decides
   lead-vs-opportunity.** You don't (and can't, by default) set `medium_id` from the form;
   `website_form_input_filter` sets it every time. That same filter picks `type` from the
   team's `use_leads`. On connectdomain (Sales = opportunities-only) website submissions
   become **opportunities**. Don't add a `name="type"` input expecting to force it.

5. **Records are created AS SUPERUSER, but the field WHITELIST is the security boundary.**
   `insert_record` creates with `SUPERUSER_ID`, so the public visitor's (nonexistent) ACLs
   don't apply — the whitelist is the ONLY thing stopping a visitor from setting a field.
   That's exactly why un-blacklisting a sensitive field (recipe 5) is dangerous: you're
   handing the anonymous internet write access to it. Un-blacklist only innocuous inputs.

6. **The pages are hand-written Tailwind QWeb, not snippets — but keep the framework form
   contract.** Don't try to drag an `s_website_form` snippet via the builder over MCP
   ([[everjust-website]] Pitfall 3). Hand-write the `<form action="/website/form/<model>">`
   in the page arch with the page's Tailwind classes, keep `class="s_website_form"` and the
   `csrf_token` input so the shipped website JS binds AJAX submit and reads the JSON reply.
   A form that doesn't match that structure may submit but not show success/error feedback.

7. **`website_edit_page` overwrites the WHOLE view arch and copy-on-writes.** As always
   ([[everjust-website]]), `get` the page's current arch, splice the `<form>` in, and send
   the **complete** template back — a fragment truncates the page. The edit forks a
   website-specific view; the shipped module view is untouched.

8. **Editing form config runs AS YOUR user and is audited.** Flipping `website_form_access`
   / un-blacklisting fields / setting `website.crm_default_*` needs an **admin** role;
   without it you get `AccessError`. `ir.model` writes are structural → `confirm:true`.
   Everything is logged to `everjust.mcp.log` and attributable to your key
   (see [[everjust-agent-mcp]], [[everjust-platform]]). Odoo 19: the user's groups field is
   `group_ids` (not `groups_id`) — relevant if you check a user's website-designer role.

9. **`mail.mail` and `mailing.contact` are form targets too — but for real work use the
   right skill.** A `/website/form/mail.mail` form ("Send an E-mail") files a `mail.mail`,
   but everjust's real outbound is `everjust.mail.*` ([[everjust-mail-ops]]).
   `mailing.contact` ("Subscribe to Newsletter") captures a subscriber, but list/consent
   logic is [[everjust-website-newsletter]]. Use this skill only to WIRE the form; hand off
   the downstream logic.

10. **CAPTCHA and CSRF behave differently for anonymous vs. signed-in.** CSRF is only
    enforced when the session is authenticated (embedded/anon forms skip it by design), and
    the route carries `captcha='website_form'` — if a captcha provider is configured, a
    hand-built form missing the widget can be rejected. Test the form as a logged-OUT
    visitor, which is who actually submits it.

## See also

- [[everjust-website]] — the page/arch/COW/publish mechanics you edit the `<form>` INTO.
  This skill is the form; that skill is the page.
- [[everjust-crm-sales]] — working the leads a form creates (stages, assignment, won/lost);
  the model map for `crm.lead`.
- [[everjust-agent-mcp]] — opening the MCP session, tool signatures, confirm-gating.
- [[everjust-platform]] — tenancy, the `/`-vs-`/odoo` debrand, per-tenant invariants.
- [[everjust-website-snippets]] — the on-brand `s_cd_*` block library (a form is NOT one).
- [[everjust-website-newsletter]] — the `mailing.contact` subscribe-form downstream.
