---
name: everjust-website-newsletter
description: Operate the newsletter SUBSCRIBE surface on an everjust.app tenant's public website via the everjust_agent_mcp MCP — drop/edit a Newsletter subscribe block (stock s_newsletter_* snippet, or js_subscribe wiring inside an on-brand s_cd_* Tailwind section) bound to a mailing.list, read who subscribed, manage opt-out. Use to add a "Subscribe to our newsletter" box/form/popup, point it at the right list, make a list self-manageable, inspect web signups, or diagnose a dead subscribe box. STOCK Odoo 19 website_mass_mailing (snippets + /website_mass_mailing/subscribe & /is_subscriber jsonrpc routes) over the SAME mailing.list/contact/subscription models as a campaign — the front-end INTAKE half of [[everjust-mass-mailing]] (the SEND half): a signup just creates a mailing.subscription and sends nothing. Editing the block is a website_edit_page QWeb edit (COW); is_public governs /mailing/my, not subscribing. Cross-refs [[everjust-mass-mailing]], [[everjust-website]], [[everjust-website-snippets]].
---

# EVERJUST Website Newsletter — Agent Skill

Wire up and operate the **newsletter subscribe surface** on a live everjust.app tenant's
public website: drop or edit a "Subscribe to our newsletter" block, bind it to a
`mailing.list`, understand the `/website_mass_mailing/subscribe` jsonrpc route it fires,
read who signed up, and manage opt-out — all through the `everjust_agent_mcp` server (the
WEBSITE TOOLS for the block's QWeb + the generic `search`/`get`/`create`/`update`/`call`/
`describe_model` for the records; see [[everjust-agent-mcp]] for connecting and opening a
session against the right tenant DB).

You connect the MCP at `https://<tenant>.everjust.app/mcp` with an Odoo API-key bearer and
**act as that user** — so record reads/writes run with your ACL, and dropping/editing the
block needs an **admin or website-designer** role (`website.group_website_designer`). A plain
key can subscribe from the front-end but can't place or restyle the box.

The crucial everjust fact: **this is STOCK Odoo 19 `website_mass_mailing`** — there is no
custom everjust newsletter addon. It layers a handful of **snippets** (`s_newsletter_*`) and
**two public jsonrpc routes** (`/website_mass_mailing/subscribe`,
`/website_mass_mailing/is_subscriber`) on top of the *same* `mailing.list` /
`mailing.contact` / `mailing.subscription` models a campaign uses. So this skill is the
**front-end intake half** of the mailing stack; the **send half** (`mailing.mailing`, blasts,
traces) is **[[everjust-mass-mailing]]**. What you must know that is everjust/version-specific:

- **A subscribe block is a SNIPPET (QWeb), not a record.** The Newsletter block lives in a
  page's `ir.ui.view` arch as a `<section class="s_newsletter_block s_newsletter_list …"
  data-list-id="N">`. You **add/edit it with `website_edit_page`** (which copy-on-writes the
  edit into a site-specific `ir.ui.view`), not with a `create` on some model. The binding to a
  list is the **`data-list-id` attribute** — an integer that must be a real `mailing.list.id`.
- **The everjust marketing pages are Tailwind-utility QWeb, NOT the html_builder snippet
  canvas.** `website_connectdomain` / `website_tcsw` pages are hand-authored Tailwind QWeb
  wrapped in `<t t-call="website.layout">`, with header/footer as separate views. There is a
  set of **on-brand `s_cd_*` snippets** (`everjust_website_snippets`: `s_cd_hero`,
  `s_cd_heading`, `s_cd_features`, `s_cd_cta`) that ship the site's compiled Tailwind idiom
  (`cd-root`, `mx-auto w-full max-w-6xl px-6`, `eyebrow`, `font-display`, `text-stone-*`,
  `rounded-md bg-stone-900 …`). **There is NO `s_cd_newsletter` / subscribe snippet** — so a
  *branded* subscribe box = the `s_cd_*` Tailwind wrapper idiom **+** the stock `js_subscribe`
  wiring pasted inside. See [[everjust-website-snippets]] for the `s_cd_*` vocabulary.
- **Submitting the block hits `POST /website_mass_mailing/subscribe`** (a `jsonrpc`,
  `website=True`, `auth='public'` route on `MassMailController`). Its handler runs **sudo** and:
  parses the email, finds-or-creates a `mailing.contact` by that email, then **creates a
  `mailing.subscription`** (contact↔list join) — or, if one already exists and is opted-out,
  **flips `opt_out=False`**. That is the *entire* effect of a signup: **one subscription row.
  It sends no email, adds no `mail.mail`, starts no campaign.** (It first verifies a
  reCAPTCHA/Turnstile token server-side if the tenant configured one.)
- **`mailing.list.is_public` is "Show In Preferences" — NOT "is this subscribable from the
  site".** `is_public=True` only makes the list appear on the recipient's own `/mailing/my`
  subscription-preferences page so they can self-manage it. **The subscribe block writes to ANY
  list id** regardless of `is_public` (the route sudo's). So making a list "public" is about the
  *preferences UX*; pointing a block at a list is a *separate* `data-list-id` edit. Don't
  conflate them.

You reach both surfaces through the `everjust_agent_mcp` tools — see [[everjust-agent-mcp]] for
connecting, the WEBSITE TOOLS' signatures, and the `confirm`/ACL gates. For the debrand
(`/`-vs-`/odoo`, the `everjust.public_website` gate) and the COW-into-a-site-view mechanic, see
[[everjust-website]] and [[everjust-platform]].

## When to use this skill

- **Add a subscribe surface to a page** — drop a Newsletter block/box/centered/grid/form or a
  popup onto a page, or paste one into a Tailwind `s_cd_*` marketing page, and bind it to a list.
- **Point an existing block at the right list** — change/set its `data-list-id`.
- **Make a list self-manageable** — set `mailing.list.is_public=True` so subscribers see it on
  `/mailing/my` and can opt in/out of it there.
- **Read who subscribed from the website** — list the `mailing.contact` / `mailing.subscription`
  rows a list accumulated, spot new signups, check opt-out state.
- **Manage opt-out** — opt a contact out of a list (per-list) or globally, with a reason.
- **Diagnose a broken subscribe box** — wrong/zero `data-list-id`, missing `js_subscribe`
  class, silent reCAPTCHA failure, list doesn't exist, contact created but not linked.

**Do NOT use this skill for**, and switch to the sibling if the task is really:

- **Sending a newsletter / campaign to the collected contacts.** Composing a `mailing.mailing`,
  sending a test, launching a blast, reading `mailing.trace` opens/clicks/bounces — that is
  **[[everjust-mass-mailing]]** (the send half). A subscribe block only *collects* addresses;
  it never sends. (And bulk sending is human-gated on everjust — see that skill's gate.)
- **A one-off transactional send** as a mailbox address — that's
  `everjust.mail.account.compose_send` ([[everjust-mail-ops]]).
- **Editing the marketing pages' general layout / hero / footer** (not the subscribe box) —
  that's the general QWeb page-edit path in **[[everjust-website]]** (and the `s_cd_*` snippet
  library in [[everjust-website-snippets]]). This skill only owns the newsletter block within
  those pages.
- **Building a generic contact/lead form** (name+message → `crm.lead`) — that's a website Form
  snippet (`s_website_form`), a different mechanism ([[everjust-website-forms]]). The Newsletter
  block is email→list only. (The `s_newsletter_block` full-form variant *is* an `s_website_form`
  posting to `mailing.contact` — but the common case is the inline `js_subscribe` input, below.)

## Architecture (the two surfaces + the model map)

### Surface 1 — the SNIPPET (QWeb in a page view)

`website_mass_mailing` ships these `s_*` snippet templates (all carry the `js_subscribe`
wiring on the input wrapper and a **`data-list-id`** on the outer section, default `"0"` =
unbound). None is everjust-custom — they're stock, and there is NO `s_cd_*` newsletter variant,
so for a branded page you re-use the stock wiring inside a Tailwind wrapper (recipe 2):

| Snippet template (`ir.ui.view` key) | What it is |
|---|---|
| `website_mass_mailing.s_newsletter_subscribe_form` | The bare inline **email + Subscribe button** (`js_subscribe` wrapper). Reused by all the others. |
| `website_mass_mailing.s_newsletter_block` | A full-width **"Subscribe to our newsletter"** section (heading + copy + the form). `data-list-id` on this `<section>`. |
| `website_mass_mailing.s_newsletter_box` | Boxed/carded variant. |
| `website_mass_mailing.s_newsletter_centered` | Centered card variant. |
| `website_mass_mailing.s_newsletter_grid` | Grid-with-images variant. |
| `website_mass_mailing.s_newsletter_subscribe_popup` | A **popup** (`s_popup`) newsletter — `data-list-id` on the inner form. |
| `website_mass_mailing.s_newsletter_benefits_popup` | Popup with a benefits list. |

The **binding** is the `data-list-id` integer. At runtime the front-end `Subscribe` interaction
(`selector = '.js_subscribe'`) resolves it as **`el.closest('section[data-list-id]')?.dataset.listId
|| el.dataset.listId`** — i.e. it prefers the list-id on the enclosing `<section>`, else the one
on the `.js_subscribe` element itself. (This closest-section-first rule is why the block variants
put `data-list-id` on the section and the popup puts it on the inner form — mirror whichever you
edit.) On load it calls `/website_mass_mailing/is_subscriber` to pre-fill/greet a known
subscriber; on the Subscribe click it POSTs `/website_mass_mailing/subscribe`.

In the html_builder editor these are configured by OWL **Plugin options** (the "Newsletter" list
`<BuilderSelect>` that writes `data-list-id`, a layout option, a "Display Thanks Message" toggle,
the input placeholder) — Odoo 19's `html_builder` replaced `web_editor`, and those OWL options are
**not scriptable over MCP**. **Over the MCP you edit the arch directly** (set `data-list-id`, keep
the `js_subscribe*` classes), which is exactly what the editor persists.

### Surface 2 — the ROUTES (public jsonrpc, sudo)

Both live on `MassMailController` (`website_mass_mailing/controllers/main.py`),
`type='jsonrpc'`, `website=True`, `auth='public'` (verified against the live core source):

- **`/website_mass_mailing/is_subscriber`** `(list_id, subscription_type='email')` — read-only;
  returns `{is_subscriber, value}`. It counts `mailing.subscription` rows on
  `(list_id, contact_id.email == value, opt_out == False)` — so a person who opted out is
  reported **not** a subscriber (won't get the "already subscribed" greeting). `value` is the
  logged-in user's email or the session-remembered one. Used to pre-fill the box.
- **`/website_mass_mailing/subscribe`** `(list_id, value, subscription_type='email')` — the
  intake. First `_verify_request_recaptcha_token('website_mass_mailing_subscribe')`; on failure
  it returns `{'toast_type':'danger', ...}` and creates nothing (**an unset/misconfigured captcha
  is the #1 silent failure**). Then `subscribe_to_newsletter`, **sudo**:
  1. `tools.parse_contact_from_email(value)` → `(name, email)`.
  2. Search an existing `mailing.subscription` on `(list_id, contact_id.email == email)`.
  3. **If none:** find a `mailing.contact` by email, or **create** one (`{name, email}`), then
     **create** the `mailing.subscription` `{contact_id, list_id}` (default `opt_out=False`).
  4. **If one exists and `opt_out`:** set `opt_out = False` (re-subscribe).
  5. Remember the email in `request.session['mass_mailing_email']`.
  Returns a **success toast** — it does **not** send a confirmation email (single opt-in). No
  `mail.mail`, no campaign.

So a website signup = **one `mailing.subscription` row (+ maybe a new `mailing.contact`)**, and
that's it. A *future* `mailing.mailing` to that list is a separate, human-gated action in
[[everjust-mass-mailing]].

### The record models (real fields — shared with the campaign side)

Everything is per-tenant DB and per-`company_id`. Stock Odoo `mass_mailing` models (introspect
any with `describe_model`):

| Model | Role in the subscribe flow | Key fields |
|---|---|---|
| `mailing.list` | **The audience a block writes into.** `data-list-id` points here. | `name`* (required), `is_public` (**"Show In Preferences"**, default False — governs `/mailing/my`, **not** subscribability), `contact_ids` (m2m → `mailing.contact`), `subscription_ids` (→ `mailing.subscription`), and computed hygiene `contact_count`, `contact_count_email`, `contact_count_opt_out`, `contact_count_blacklisted`. |
| `mailing.contact` | **A recipient row** — the subscribe route finds-or-creates one by email. | `name`, `email`, `email_normalized`, `list_ids` (m2m), `subscription_ids`, `opt_out` (**global** opt-out across all lists), `is_blacklisted` (computed from `mail.blacklist`), `message_bounce`. |
| `mailing.subscription` | **The list↔contact join with per-list opt-out** — *this* is the row a signup creates. (The old name `mailing.contact.subscription` does NOT exist.) | `contact_id`* , `list_id`* , `opt_out` (**per-list**), `opt_out_reason_id` (→ `mailing.subscription.optout`), `opt_out_datetime` (auto-stamped when `opt_out` flips true), `is_blacklisted`/`message_bounce` (related from contact). **Unique `(contact_id, list_id)`.** |
| `mailing.subscription.optout` | The opt-out reason vocabulary shown on `/mailing/my`. | `name`. (Default set: "I never subscribed to this list", "I changed my mind", "…too many emails…", "…not relevant…", "Other".) |

Per-list opt-out (`mailing.subscription.opt_out`) removes them from THAT list; global opt-out
(`mailing.contact.opt_out`) suppresses them everywhere. Both are honored at send time by
[[everjust-mass-mailing]]; `mail.blacklist` (the shared suppression list, see [[everjust-mail-ops]])
trumps both.

## Recipes

Route each through the `everjust_agent_mcp` MCP (open the session per [[everjust-agent-mcp]]; pick
the DB, e.g. `connectdomain`). Snippet edits use the **WEBSITE TOOLS**
(`website_pages`/`website_edit_page`/`website_publish`/`website_menu`/`website_redirect`); record
work uses the generic `search`/`get`/`create`/`update`/`call`. Odoo domains are triple-lists; m2m
writes use command tuples (`[[6,0,ids]]` replace, `[[4,id]]` add). On `connectdomain` at last
check: `website`+`mass_mailing`+`website_mass_mailing`+`everjust_website_snippets` all
**installed**; the `s_newsletter_subscribe_form` snippet view is present; `everjust_website_snippets`
ships only `s_cd_hero/heading/features/cta` (**no** newsletter variant).

### 0. First: pick the target LIST, and confirm it's the intake path (not the send path)

Adding a subscribe box is meaningless without a real list id to bind. Resolve it first, and
sanity-check you're editing intake, not launching a campaign.

```jsonc
// Which lists exist, and which are self-manageable on /mailing/my?
search("mailing.list", [], ["id","name","is_public","contact_count"])
// -> e.g. [{id:1,name:"Newsletter",is_public:true,contact_count:1}, {id:2,name:"Launch — All opt-in",...}, ...]
```

Choose (or create) the list the block should feed — usually a dedicated public "Newsletter"
list, **not** a private prospect/GTM list you built for outreach. If none fits, create one:

```jsonc
create("mailing.list", { "name": "Website — Newsletter", "is_public": true })  // is_public => shows on /mailing/my
```

If the real task is "email these subscribers", **stop — that's [[everjust-mass-mailing]]** (and
it's human-gated). This skill only *collects*.

### 1. Add a Newsletter block to an editable page (WEBSITE TOOLS, COW)

For a normal html_builder page, read the page's arch, insert the `s_newsletter_block` section
with `data-list-id` set to your list, and write the **whole** arch back — `website_edit_page`
**copy-on-writes** the edit into a site-specific `ir.ui.view` so a module upgrade never clobbers
it (see [[everjust-website]] on COW).

```jsonc
website_pages()                                // find the page + its view (id, url, view_id, website_specific)
website_edit_page(url="/features")             // returns the current QWeb arch to edit
// Insert this section where you want it (keep the classes EXACTLY; set data-list-id=1):
```
```html
<section class="s_newsletter_block s_newsletter_list o_cc o_cc2 pt64 pb64" data-list-id="1" data-name="Newsletter">
  <div class="container">
    <div class="row">
      <div class="col-lg-6">
        <h2 class="h4-fs">Subscribe to our newsletter</h2>
        <p class="text-muted">DNS auto-config + automatic SSL updates, in your inbox.</p>
      </div>
      <div class="col-lg-5 offset-lg-1">
        <div class="s_newsletter_subscribe_form s_newsletter_list js_subscribe" data-list-id="1" data-name="Newsletter Form">
          <div class="js_subscribed_wrap d-none">
            <p class="h4-fs text-center text-success"><i class="fa fa-check-circle-o" role="img"/> Thanks for registering!</p>
          </div>
          <div class="js_subscribe_wrap">
            <div class="input-group">
              <input type="email" name="email" class="s_newsletter_subscribe_form_input js_subscribe_value form-control" placeholder="Email Address"/>
              <a role="button" href="#" class="js_subscribe_btn o_submit btn btn-primary">Subscribe</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```
```jsonc
// then persist the FULL arch back through website_edit_page (it overwrites the whole view arch → COW).
```

The `Subscribe` interaction resolves the list from **`closest('section[data-list-id]')` first**
— so the value on the outer `<section>` is what actually binds; keep the inner form's
`data-list-id` in sync. The `js_subscribe` / `js_subscribe_value` / `js_subscribe_btn` /
`js_subscribed_wrap` classes are load-bearing — the JS keys off them; don't rename them.

### 2. Add an on-brand subscribe box to a Tailwind `s_cd_*` MARKETING page

The `website_connectdomain` / `website_tcsw` pages are verbatim **Tailwind-utility QWeb**
(wrapped in `<t t-call="website.layout">`), and the branded snippet library is `s_cd_*`. There
is **no `s_cd_newsletter`**, so build the box as an `s_cd_cta`-style Tailwind section and paste
the stock `js_subscribe` wiring inside. The only non-negotiables are the four `js_subscribe*`
classes and a valid `data-list-id`; everything visual re-uses the page's Tailwind vocabulary
(`cd-root`, `mx-auto w-full max-w-6xl px-6`, `eyebrow`, `font-display`, `text-stone-*`,
`rounded-md bg-stone-900 …` — see [[everjust-website-snippets]]).

```jsonc
website_pages()                                  // locate the marketing page's ir.ui.view
website_edit_page(url="/")                        // read the Tailwind arch
```
```html
<!-- On-brand wrapper (s_cd_* idiom) + stock js_subscribe wiring: -->
<section class="s_cd_cta cd-root border-b border-stone-200 bg-stone-50">
  <div class="mx-auto w-full max-w-6xl px-6 py-16 text-center">
    <p class="eyebrow">Stay in the loop</p>
    <h2 class="font-display mt-3 text-4xl text-stone-900 sm:text-5xl">Subscribe to our newsletter</h2>
    <p class="mx-auto mt-4 max-w-xl text-lg leading-8 text-stone-600">DNS auto-config + automatic SSL updates, in your inbox.</p>
    <div class="s_newsletter_list js_subscribe mx-auto mt-9 flex max-w-md gap-3" data-list-id="1">
      <div class="js_subscribed_wrap d-none w-full text-green-700">Thanks for subscribing!</div>
      <div class="js_subscribe_wrap flex w-full gap-3">
        <input type="email" name="email" class="js_subscribe_value flex-1 rounded-md border border-stone-300 px-4 py-3" placeholder="you@company.com"/>
        <a role="button" href="#" class="js_subscribe_btn o_submit rounded-md bg-stone-900 px-6 py-3 font-medium text-stone-50 transition-colors hover:bg-stone-700">Subscribe</a>
      </div>
    </div>
  </div>
</section>
```
```jsonc
// write the whole arch back (COW into the connectdomain site view).
```

Here there is no enclosing `section[data-list-id]` around the `.js_subscribe` div, so the
interaction falls back to `el.dataset.listId` — **put `data-list-id` on the `.js_subscribe`
div.** Keep the four `js_subscribe*` classes verbatim; a Tailwind class the compiled
`connectdomain.css` doesn't define won't be styled.

### 3. Re-point an existing block at a different list

If a page already has a subscribe box aimed at the wrong (or a `0`) list, just change the
`data-list-id`. Find the pages first:

```jsonc
// Which views carry a subscribe block?
search("ir.ui.view", [["arch_db","like","js_subscribe"]], ["id","key","name","website_id"])
website_edit_page(url="<that page url>")   // read the arch
// change data-list-id="0" (or the old id) -> data-list-id="1" on BOTH the section and the
// inner form (closest-section-first rule), keep everything else, write the FULL arch back (COW).
```

`data-list-id="0"` is the "unbound" sentinel a freshly-dropped snippet ships with — a box left
at `0` posts to list 0 (nonexistent) and silently no-ops. Always set a real id.

### 4. Make a list self-manageable on /mailing/my (is_public)

`is_public` is orthogonal to the block — it controls whether subscribers see the list on their
own preferences page (`/mailing/my`) and can opt in/out of it there. Turn it on for lists you
want recipients to manage themselves:

```jsonc
update("mailing.list", [1], { "is_public": true })     // "Show In Preferences"
```

This does **not** change what any subscribe block does, and it does **not** publish a page.
Leave your private outreach lists (`is_public=False`) hidden so recipients can't see/join them.

### 5. Read who subscribed from the website (and their opt-out state)

A signup is a `mailing.subscription` row; join to `mailing.contact` for the address/name.

```jsonc
// Everyone on the list, with per-list opt-out:
search("mailing.subscription",
       [["list_id","=",1]],
       ["contact_id","opt_out","opt_out_datetime","opt_out_reason_id","create_date"],
       order="create_date desc")
// Resolve the contact emails:
search("mailing.contact", [["list_ids","in",[1]]],
       ["name","email","email_normalized","opt_out","is_blacklisted","message_bounce"])
// New signups in the last week (subscription rows created recently):
search("mailing.subscription",
       [["list_id","=",1],["create_date",">=","2026-06-28 00:00:00"]],
       ["contact_id","create_date"])
// Hygiene at a glance (feeds the campaign-side send decision):
get("mailing.list", [1],
    ["name","contact_count","contact_count_email","contact_count_opt_out","contact_count_blacklisted"])
```

Web signups are single opt-in (no confirmation email), so treat the list as self-declared —
before any blast, hand it to [[everjust-mass-mailing]] and respect that skill's account-wide
reputation gate. `is_blacklisted`/`message_bounce` flag addresses that will be dropped at send.

### 6. Opt a contact out (per-list or global), with a reason

Mirror what `/mailing/my` does — set opt-out on the *subscription* (this list only) or on the
*contact* (all lists). Don't delete the row (you'd lose the audit + they could re-subscribe
silently). A `create`-free `update` on `mailing.subscription`/`mailing.contact` is a read-write
generic call; it does not need `confirm:true` (only `delete`, non-read `call`, and structural
models do).

```jsonc
// Per-LIST opt-out (leaves them on other lists). opt_out_datetime auto-stamps:
find("mailing.subscription.optout", "I changed my mind")   // -> reason id
update("mailing.subscription",
       search("mailing.subscription", [["list_id","=",1],["contact_id","=",<cid>]], ["id"]),
       { "opt_out": true, "opt_out_reason_id": <reason_id> })

// GLOBAL opt-out (every list):
update("mailing.contact", [<cid>], { "opt_out": true })
```

To hard-suppress an address across the *whole tenant* (bounces/complaints, legal removal), that
is `mail.blacklist` via `everjust.mail.suppression._ingest` — see [[everjust-mail-ops]] /
[[everjust-mass-mailing]] on the atomic mirror; a raw `mail.blacklist` create skips it. A
subscribe box re-subscribes an opted-out subscription (flips `opt_out=False`) but does NOT
override the global `mailing.contact.opt_out` or a blacklist entry.

## Pitfalls (everjust-specific)

1. **Subscribing collects; it does NOT send.** `/website_mass_mailing/subscribe` only creates a
   `mailing.subscription` (and maybe a `mailing.contact`). It fires **no** email, **no**
   `mail.mail`, **no** campaign, and there is **no double opt-in confirmation** on this build.
   To email the collected people you build and (human-gated) launch a `mailing.mailing` — that's
   **[[everjust-mass-mailing]]**. Don't promise a "welcome email" from adding a box.

2. **A subscribe block is a SNIPPET (QWeb arch), not a record — edit it with `website_edit_page`.**
   There is no "newsletter subscription" record you `create` to place a box. You edit the page's
   `ir.ui.view` arch (`website_edit_page`, which COWs into a site-specific view and **overwrites
   the whole arch** — always send the complete template, not a fragment). The binding is the
   **`data-list-id` attribute**; the wiring is the **`js_subscribe` / `js_subscribe_value` /
   `js_subscribe_btn` / `js_subscribed_wrap` classes** — keep them verbatim or the front-end JS
   won't attach.

3. **`data-list-id` must be a REAL list id, and resolution is closest-section-first.** A
   freshly-dropped snippet ships `data-list-id="0"` (unbound → silent no-op). The `Subscribe`
   interaction reads `closest('section[data-list-id]')` **before** the element's own attribute —
   so for the block variants set it on the `<section>` (keep the inner form in sync), and for a
   bare `js_subscribe` block (recipe 2) set it on the `.js_subscribe` element itself. Wrong/zero
   id = box does nothing with no error.

4. **`is_public` ≠ "subscribable from the site".** `mailing.list.is_public` ("Show In
   Preferences") only controls whether the list appears on a recipient's `/mailing/my` page. The
   subscribe route runs **sudo** and writes to whatever `data-list-id` you give it, public or
   not. Making a list public and pointing a block at a list are two independent actions; don't
   assume one implies the other.

5. **reCAPTCHA/Turnstile mis-config is the #1 silent breakage.** `/subscribe` calls
   `_verify_request_recaptcha_token('website_mass_mailing_subscribe')` first; on a
   partial/invalid captcha config the route returns a `danger` toast and creates **no**
   subscription — the box "does nothing" for the visitor. When a subscribe box fails, check the
   captcha config before blaming the list binding.

6. **It's the SAME models as a campaign — you're sharing an audience.** `mailing.list` /
   `mailing.contact` / `mailing.subscription` here are literally the records
   [[everjust-mass-mailing]] sends to. Pointing a public subscribe box at a **private outreach
   list** silently mixes cold-outreach contacts with self-serve signups (and vice-versa). Use a
   dedicated public "Newsletter" list for the website box; keep prospect lists off the site.

7. **`mailing.subscription` is the real join model** (not the nonexistent
   `mailing.contact.subscription`), and opt-out lives at two levels: **per-list**
   (`mailing.subscription.opt_out`) vs **global** (`mailing.contact.opt_out`). Toggle the right
   one. `opt_out_datetime` auto-stamps; `is_subscriber` reports an opted-out contact as NOT a
   subscriber (no greeting). Don't delete a subscription to "unsubscribe" — opt it out (keeps the
   audit and blocks a silent re-add).

8. **Editing the block needs website-designer rights, and it's COW.** `website_edit_page` /
   publishing require `website.group_website_designer`; the MCP acts as YOUR user, so a plain key
   can subscribe from the front-end but can't drop or restyle the box (`AccessError`). That's an
   ACL limit, not a `confirm` gate — get a designer/admin key ([[everjust-agent-mcp]]). Note
   Odoo 19: user group membership is **`group_ids`**, not `groups_id`, if you inspect
   `res.users`. Granting admin and writing secret config are **hard-blocked** regardless of key.

9. **No branded newsletter snippet exists — you compose one.** `everjust_website_snippets` ships
   `s_cd_hero/heading/features/cta` only; there is no `s_cd_newsletter`. For an on-brand box,
   wrap the stock `js_subscribe` wiring in the `s_cd_*` Tailwind idiom (recipe 2). Don't invent a
   Tailwind class the compiled `connectdomain.css` doesn't define, and don't add OWL/React — the
   subscribe behavior is the addon's front-end interaction on the `.js_subscribe` hook.

10. **Everything is per-tenant DB, per-`company_id`, and per-`website_id`.** List ids, contacts,
    and page views are tenant-scoped; on a multi-site tenant a page (and its subscribe block) is
    bound to one `website_id`. Confirm the tenant DB, `env.company`, and the site before editing
    (per-tenant isolation — [[everjust-platform]]).

## See also

- **[[everjust-mass-mailing]]** — the **send half** of the exact same models. This skill
  *collects* addresses into a `mailing.list`; that skill *composes and (human-gated) sends*
  `mailing.mailing` blasts and reads `mailing.trace` results. Cross the boundary deliberately:
  never "send to subscribers" from here.
- **[[everjust-website]]** — the general page-edit surface these blocks live in: `website_pages`/
  `website_edit_page`/`website_publish`/`website_menu`/`website_redirect`, the copy-on-write
  mechanic, per-page SEO/visibility, and the Tailwind-QWeb-vs-html_builder distinction.
- **[[everjust-website-snippets]]** — the on-brand `s_cd_*` snippet vocabulary
  (`s_cd_hero/heading/features/cta`, `cd-root`, `eyebrow`, `font-display`, `text-stone-*`) you
  re-use to make a branded subscribe box.
- **[[everjust-platform]]** — tenancy, `/odoo` debrand, the `everjust.public_website` gate, and
  the platform invariants (one-DB-per-tenant, per-tenant secrets, hard-blocked admin-grant).
- **[[everjust-agent-mcp]]** — connecting to `https://<tenant>.everjust.app/mcp`, the generic
  `search`/`get`/`create`/`update`/`delete`/`call`/`describe_model`/`list_models` toolset, the
  WEBSITE TOOLS' signatures, and the `confirm`/ACL gates every recipe rides on.
- **[[everjust-mail-ops]]** — the separate everjust webmail product (`everjust.mail.*`) and the
  shared `mail.blacklist` suppression (via `everjust.mail.suppression._ingest`). A newsletter
  signup does not touch the webmail stack; hard suppression does go through that mirror.
