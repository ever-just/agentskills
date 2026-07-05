---
name: everjust-website-i18n
description: Publish the multi-language version of an everjust.app (Odoo 19) marketing site via the everjust_agent_mcp server — activate a res.lang, add it to the website's language_ids so it shows in the selector and gets its /<url_code>/ URLs, and translate a page's body + SEO. Use to make a page bilingual/multilingual, add a language to the public site, wire the language switcher, translate a marketing page or its meta title/description, or fix a page showing English under /fr/. Odoo 19 stores translations as per-field JSONB (translate=True, e.g. website_meta_title) or per-term JSONB (xml_translate, e.g. a view's arch_db) — you do NOT duplicate the page per language. The trap: the generic update/create/website_edit_page MCP tools write the en_US SOURCE only (no lang context), so a non-English value MUST go through call → update_field_translations({lang:{term:translated}}) with confirm:true. Copy-on-write applies. Needs admin/website-designer. Cross-refs [[everjust-website]], [[everjust-agent-mcp]].
---

# EVERJUST Website i18n — Agent Skill

Make an everjust.app tenant's **public marketing site multilingual**: turn on a
language, expose it in the site's language selector + `/<lang>/` URLs, and
translate a page's copy and SEO into it — all through the **`everjust_agent_mcp`**
server, running **as the connected Odoo user** (needs **admin / website-designer**).

This is the language layer ON TOP of [[everjust-website]]. That skill covers
editing a page's QWeb `arch`, menus, redirects, SEO, publishing, and the
copy-on-write (COW) mechanic — read it first; this skill does not repeat it. Here
you learn the three things i18n adds: **activating a `res.lang`**, **attaching it
to the website** (what actually drives the selector and the URL prefix), and
**writing the per-language translation of already-existing English content**
without duplicating the page. For opening the MCP session against the right
tenant and the tool contract (`search`/`get`/`update`/`create`/`call` +
`website_*`, confirm-gating), see [[everjust-agent-mcp]].

## When to use this skill

- **Add a language to the public site** — activate `fr_FR`/`es_ES`/… and make it
  live, so a `/fr/`, `/es/` copy of every page exists and the switcher shows it.
- **Wire up / fix the language selector** — it's a header sub-view driven by
  `website.language_ids`; a language you activated but didn't add to the site
  won't appear.
- **Translate a page's content** — the body copy of a marketing page into another
  language (per-term JSONB on the view's `arch_db`).
- **Translate a page's SEO** — its `website_meta_title` / `website_meta_description`
  per language (per-field JSONB).
- **Diagnose "`/fr/` shows English"** — the language is active but the term/field
  has no translation yet (falls back to the en_US source), or you only edited the
  English source via `website_edit_page`.
- **Understand the `/<lang>/` routing** — why the default language has NO prefix
  and every other language is served under `/<url_code>/`.

**Do NOT use this skill for**, and stop if the task is really:
- **Editing the English page itself** (copy, sections, CTAs, menus, redirects,
  publishing, SEO of the source) — that's [[everjust-website]]. Translation only
  happens AFTER the English source exists.
- **Theme, RTL layout, fonts, palette** — an RTL language flips direction via
  `res.lang.direction`, but the actual RTL CSS/logical-property styling is SCSS in
  the theme addons (`everjust_theme`, `everjust_brand_website`), shipped in code,
  not editable over MCP.
- **Backend business-data translation at scale** (product names, CRM stage labels,
  email templates) — those use the same JSONB translated-field mechanic but on a
  different surface; do them field-by-field with the same `update_field_translations`
  recipe, not the website tools.
- **Importing/exporting `.po` files or a translation-memory workflow** — that's the
  `base.language.export`/`import` wizards in the web UI (`/odoo`), not MCP.
- **The Connect Domain PRODUCT** (a customer's own domain DNS/SSL) — unrelated.

## Architecture — how Odoo 19 stores and serves translations

Odoo 19 does **NOT** keep one row per language (there is no `ir.translation`
table any more) and you do **NOT** duplicate a page per language. Instead every
*translatable field* is a **JSONB column keyed by language code**. There are two
kinds, and they are written differently (both live-verified on this tenant):

| Field kind | `translate` attr | Storage | Examples on the site | How you set a non-en value |
|---|---|---|---|---|
| **Whole-field translate** | `translate = True` | JSONB `{lang: value}` | `website.page.website_meta_title`, `website_meta_description`, `website.menu.name` | `update_field_translations(field, {lang: new_value})` |
| **Model-term translate** | `translate = xml_translate` (a callable) | JSONB `{lang: rendered_arch}`, addressed by **source term** | a view's `arch_db` (the page body) | `update_field_translations(field, {lang: {source_term: translated_term}})` |

The single source of truth per field is the **`en_US`** value; every other
language's JSONB entry is the translation and **falls back to en_US when missing**
(that's why an untranslated `/fr/` page renders in English, not blank).

### The language records — `res.lang` (live-verified fields)

| Field | Meaning | Note |
|---|---|---|
| `code` | Locale code, e.g. `en_US`, `fr_FR`, `es_ES`, `zh_CN` | The JSONB key. This is what `lang=` in a translation dict uses. |
| `url_code` | The URL prefix segment, e.g. `en`, `fr`, `es`, `pt_BR` | **What appears in `/<url_code>/…`.** Usually the short form; do not confuse with `code`. |
| `active` | Installed & usable | Inactive languages exist as rows (all ~90 ship pre-seeded) but must be activated. On this tenant only `en_US` is active. |
| `direction` | `ltr` / `rtl` | RTL langs (ar, he, fa) need theme SCSS to actually look right — code, not content. |
| `name` | Display name, e.g. `French / Français` | Shown in the selector. |
| `iso_code`, `flag_image`, `grouping`, `decimal_point` | Formatting / flag | Rarely touched by an agent. |

Activating a `res.lang` (setting `active=True`) makes it *available* — but it does
**not** by itself put it on the public site.

### `website.language_ids` — the switch that actually drives the frontend

The frontend language list is **`website.get_current_website().language_ids`** (a
`many2many` to `res.lang`), NOT simply "all active languages". Live-verified in
`website/models/res_lang.py::_get_frontend()`: on a frontend request it returns
exactly the current website's `language_ids`. Consequences you must internalize:

- A language must be in **`website.language_ids`** to appear in the **language
  selector** and to have its **`/<url_code>/` URLs** resolve. Activating the
  `res.lang` alone is not enough.
- **`website.default_lang_id`** is the language served at the **un-prefixed** URL.
  The default language's pages stay at `/`, `/pricing`; every OTHER language is
  served under `/<url_code>/` (`/fr/`, `/fr/pricing`). (Verified in
  `http_routing/models/ir_http.py`: the default lang's url_code is stripped from
  the path; others are inserted.)
- You **cannot deactivate a `res.lang` that a website still uses** — Odoo raises
  `UserError` (`website/models/res_lang.py::write`). Remove it from
  `language_ids` first, then deactivate.
- On this tenant: `website` id 1 ("Connect Domain"), `default_lang_id = en_US`,
  `language_ids = [en_US]` only. Adding a language is `language_ids` += that lang.

### The language selector + hreflang (already in the theme)

The selector is a shipped header sub-view, pulled into every page layout as
`<t t-call="website.placeholder_header_language_selector"/>` and gated by the
`website.header_language_selector` view being active AND `len(frontend_languages) > 1`.
So once you add a second language to `language_ids`, the switcher **appears
automatically** — you don't hand-build it. Odoo also auto-emits `<link
rel="alternate" hreflang=…>` per frontend language and an `x-default` for the
default lang, using each lang's short `hreflang` (derived from `url_code`). You
generally don't touch this; just get `language_ids` right.

### Copy-on-write still applies (same as [[everjust-website]])

A page's body is its **`ir.ui.view.arch_db`**. Writing/translating it **with the
website in context** copy-on-writes the shipped module view into a
**website-specific fork** (`website_id = <site>`); the fork's JSONB then carries
en_US **and** every translation. `website_edit_page` already forks on the English
edit. When you translate `arch_db` via `update_field_translations` you're writing
onto that same view record's JSONB — target the page's `view_id` (the fork if one
exists). See COW in [[everjust-website]].

## The MCP surface for i18n — and the one hard constraint

| Need | Tool | Why |
|---|---|---|
| Activate a language | generic `update` (or `create`) on `res.lang` → `active:true` | `res.lang` is **not** a confirm-structural model, so a plain `update` works — no `confirm` needed. |
| Add lang to the site / set default | generic `update` on `website` → `language_ids`, `default_lang_id` | This is the switch that lights up the selector + `/<lang>/`. |
| Read current translations of a field | `call` `get_field_translations(field, langs)` | Returns `[{lang, source, value}]` — see what's translated vs. falling back. Read-only. |
| **Write a translation** | `call` `update_field_translations(field, {…})` **with `confirm:true`** | **The ONLY MCP path to a non-en value** (see below). |

**THE CONSTRAINT (read this twice).** The generic `update` / `create` tools and
`website_edit_page` all run `.write()` **with no `lang` context** — verified in the
MCP controller (`_tool_update` = `browse(ids).write(vals)`; `_tool_website_edit_page`
writes `arch` under `website_id` context but **`lang=en_US`**). So every value you
set through those tools lands in the **`en_US`** JSONB slot — the **source**. There
is **no `context`/`lang` argument** on any generic tool. Therefore:

> To write a **French/Spanish/…** value you MUST use **`call
> update_field_translations`** (a public, MCP-callable method — verified via
> `odoo.service.model.get_public_method`, which accepts any non-underscore method
> not decorated `@api.private`). It is a non-read method, so it needs
> **`confirm:true`**. `write`/`create`/`copy`/`unlink` are hard-denied in `call`,
> but `update_field_translations` is not — it's the sanctioned seam.

Confirm-gating recap (from [[everjust-website]]): `delete` always needs `confirm`;
`ir.config_parameter` writes need `confirm`; a non-read `call` needs `confirm`.
`res.lang`/`website`/`ir.ui.view`/`website.page` create/update are **not**
confirm-structural. Granting admin (`group_ids` — Odoo 19 renamed `groups_id`) and
writing secret config are hard-blocked regardless.

## Recipes

Route each through `everjust_agent_mcp` against the tenant (tool names are
`mcp__everjust__<tool>` in Claude Code). Order matters: **English source →
activate lang → attach to site → translate → verify.**

### 1. Survey the language state before touching anything

```jsonc
// tool: search — which languages are active, and their url_code?
{ "model": "res.lang", "domain": [["active","=",true]],
  "fields": ["code","url_code","name","direction"] }
// → [{code:"en_US", url_code:"en", name:"English (US)", direction:"ltr"}]

// tool: get — what does the site currently expose?
{ "model": "website", "ids": [1],
  "fields": ["name","domain","default_lang_id","language_ids"] }
// → default_lang_id: en_US, language_ids: [en_US]  ⇒ site is English-only
```
If the target language isn't in `active` languages, do recipe 2. If it's active
but not in `language_ids`, do recipe 3 (that's the usual "`/fr/` doesn't work" fix).

### 2. Activate a language (`res.lang.active = True`)

The language rows already exist (inactive). Resolve the row, flip `active`:
```jsonc
// tool: search — find the row (inactive rows are visible)
{ "model": "res.lang", "domain": [["code","=","fr_FR"]],
  "fields": ["id","code","url_code","active"] }

// tool: update — activate it (NO confirm needed; res.lang isn't structural)
{ "model": "res.lang", "ids": [<fr_lang_id>], "values": { "active": true } }
```
Equivalently you can `call action_activate_langs` on a `res.lang` recordset
(CALLABLE, `confirm:true`) — but a plain `update active:true` is simpler and
un-gated. Do **not** try `_activate_lang` (leading underscore → hard-blocked).
Note `url_code`: `fr_FR` serves under **`/fr/`**, `pt_BR` under `/pt_BR/`, `zh_CN`
under `/zh_CN/` — that segment, not the full `code`, is the URL.

### 3. Put the language ON the site (this is what lights it up)

Add it to `language_ids`; this makes the selector show it and `/<url_code>/`
resolve. Use the m2m command tuple `[4, id]` to ADD without dropping en_US:
```jsonc
// tool: update — add French to the website's frontend languages
{ "model": "website", "ids": [1],
  "values": { "language_ids": [[4, <fr_lang_id>]] } }
// default stays en_US (served at "/"); French now served at "/fr/…"
```
To make a *different* language the default (the un-prefixed one), also set
`default_lang_id` — it must be in `language_ids` first, and changing it moves
which language lives at `/`:
```jsonc
{ "model": "website", "ids": [1],
  "values": { "default_lang_id": <fr_lang_id> } }   // now "/" is French, "/en/" is English
```
After this, `frontend_languages` has >1 entry, so the header language switcher
renders automatically and hreflang alternates emit — no template edit needed.

### 4. Read a page's current translation state (what's English-only?)

Translations live on the page's `arch_db` (body) and its `website_meta_*` (SEO).
Read them per field to see which terms still fall back to en_US:
```jsonc
// find the page + its view id first (see everjust-website recipe 1)
// tool: call — read the SEO title's translations (read-only, no confirm)
{ "model": "website.page", "ids": [<page_id>],
  "method": "get_field_translations",
  "args": ["website_meta_title", ["en_US","fr_FR"]] }
// → [ [ {lang:"en_US", source:"...", value:"Pricing — Connect Domain"},
//       {lang:"fr_FR", source:"...", value:"Pricing — Connect Domain"} ], {...} ]
//   value == source for fr_FR ⇒ NOT translated yet (falling back to English)

// tool: call — read the body's per-term state (xml_translate → list of terms)
{ "model": "ir.ui.view", "ids": [<page_view_id>],
  "method": "get_field_translations",
  "args": ["arch_db", ["en_US","fr_FR"]] }
// → the list enumerates each translatable TEXT TERM with its en_US `source` and
//   current fr `value`. Those `source` strings are the keys you translate in recipe 5.
```
Use it to build the exact map of source-term → translation you'll send back.

### 5. Translate a page (the core recipe — `update_field_translations`)

**5a. Whole-field translate (SEO metas, a menu label — `translate=True`).** The
dict is `{lang: new_value}`:
```jsonc
// tool: call  (non-read → confirm:true)
{ "model": "website.page", "ids": [<page_id>],
  "method": "update_field_translations",
  "args": ["website_meta_title", { "fr_FR": "Tarifs — Connect Domain" }],
  "confirm": true }
{ "model": "website.page", "ids": [<page_id>],
  "method": "update_field_translations",
  "args": ["website_meta_description",
           { "fr_FR": "Onboarding de domaine personnalisé, dès 0 €. DNS, SSL et edge automatiques." }],
  "confirm": true }
// a nav label is the same shape on website.menu.name:
{ "model": "website.menu", "ids": [<menu_id>],
  "method": "update_field_translations",
  "args": ["name", { "fr_FR": "Tarifs" }], "confirm": true }
```

**5b. Model-term translate (page body — `arch_db` / `xml_translate`).** The dict is
`{lang: {source_term: translated_term}}` — you translate **each visible text term**
(taken from recipe 4's `source` values), NOT the whole HTML:
```jsonc
// tool: call  (non-read → confirm:true). Target the page's VIEW record.
{ "model": "ir.ui.view", "ids": [<page_view_id>],
  "method": "update_field_translations",
  "args": ["arch_db",
    { "fr_FR": {
        "Connect your own domain": "Connectez votre propre domaine",
        "Automatic DNS, SSL and edge": "DNS, SSL et edge automatiques",
        "Get started": "Commencer"
    } } ],
  "confirm": true }
```
Rules for 5b:
- **Keys are the exact en_US source terms** (verbatim — punctuation, casing) — get
  them from recipe 4 so they match. A key that isn't a real term is silently ignored.
- You translate **only the text**; tags, Tailwind classes, `t-att-*`, and links stay
  as the source renders them — `xml_translate` swaps text nodes, not markup.
- This writes the **fr_FR JSONB** on the same view record — the en_US source and the
  page layout are untouched. Through the render path this is COW-safe; the fork
  carries both languages.
- To **remove** a translation (fall back to English) pass `false`:
  `{"fr_FR": {"Get started": false}}`.
- Optional `source_lang` third arg defaults to `"en_US"` — leave it unless the
  source terms are in another base language.

### 6. Verify the translated page renders

```jsonc
// confirm no fr term still equals its en source (i.e. all translated)
{ "model": "website.page", "ids": [<page_id>],
  "method": "get_field_translations", "args": ["website_meta_title", ["fr_FR"]] }
// value != source ⇒ translated.
```
Then load the live URL under the language prefix — the French page is at
`https://connectdomain.app/fr/…` (default en_US stays un-prefixed at `/…`).
`is_seo_optimized` is computed from title+description presence; a translated page
inherits SEO once its metas are set per language. If `/fr/` still shows English:
(a) is the lang in `website.language_ids`? (recipe 3); (b) did you translate the
term, or only re-edit the English source with `website_edit_page`? (recipe 5).

## Pitfalls

1. **The generic tools write ENGLISH only.** `update`, `create`, and
   `website_edit_page` pass no `lang` context, so every value lands in the `en_US`
   source JSONB. There is no `lang`/`context` arg on them. A non-English value can
   ONLY be written with **`call update_field_translations` + `confirm:true`**.
   Editing "the page in French" by calling `website_edit_page` with French text
   just **overwrites the English source** — the wrong outcome. Translate; don't
   re-author.

2. **Activating a `res.lang` is not the same as adding it to the site.** The
   selector and the `/<url_code>/` URLs read `website.language_ids`, not the global
   active-language set. If you flip `res.lang.active` but skip recipe 3, `/fr/`
   404s / falls through and the switcher won't show French. Always do both.

3. **`url_code` ≠ `code`, and the default language is un-prefixed.** The URL segment
   is `url_code` (`fr`, `pt_BR`), not the locale `code` (`fr_FR`). The
   `default_lang_id` is served at `/` with **no** prefix; only the *other*
   languages get `/<url_code>/`. Don't build links to `/en/…` when English is the
   default (there is no `/en/` — it's `/`).

4. **`arch_db` is TERM translation, not field translation.** Its dict is
   `{lang: {source_term: value}}`, keyed by the **exact** en_US text term (pull it
   from `get_field_translations`), and you translate **text only** — leaving tags,
   classes, and links alone. Sending a `{lang: value}` string (the 5a shape) to
   `arch_db`, or keys that don't match a real term, silently does nothing.

5. **Translate AFTER the English source exists, and re-check after each English
   edit.** Translations key off the current en_US terms. If you change the English
   copy later (via [[everjust-website]] `website_edit_page`), a changed term's
   translation goes stale / falls back — re-read with `get_field_translations` and
   re-translate the changed terms.

6. **You can't deactivate a language the site still uses.** `res.lang.write` blocks
   deactivating a lang that's in any `website.language_ids` (`UserError`). To remove
   a language: `update website.language_ids` with `[[3, id]]` (unlink from the m2m)
   first, then `update res.lang active:false`.

7. **COW is per-view, and translations live on the fork.** `arch_db` translations
   attach to the page's `ir.ui.view` record. If the page is still a shipped module
   view, the translating write forks a website-specific copy (as with any arch
   write); target the page's `view_id`. Don't translate the shipped module view for
   *all* sites by accident — one tenant, one site here (`website_id=1`), so in
   practice this is fine, but confirm you're on the right tenant DB
   ([[everjust-platform]]).

8. **RTL is layout, not content.** Setting `direction=rtl` on a `res.lang` (ar/he/fa)
   flips text direction, but making the page actually look right in RTL is theme
   SCSS (`everjust_theme`) shipped in code — you can't fix RTL styling over MCP.
   Translating the text is this skill; the RTL polish is a code+deploy change.

9. **Everything runs as YOUR role and is audited.** Language activation, website
   config, and `update_field_translations` all require **website-designer / admin**;
   without it you get `AccessError`. Every call is logged to `everjust.mcp.log`
   ([[everjust-agent-mcp]]).

## See also

- [[everjust-website]] — the base skill: edit a page's English `arch`, menus,
  redirects, SEO, publishing, and the COW mechanic. Do the English source there
  FIRST; translate here.
- [[everjust-website-seo]] — per-page SEO; its metas are translatable, so translate
  them per language with recipe 5a.
- [[everjust-website-snippets]] — the on-brand `s_cd_*` snippets; their text terms
  translate the same `arch_db` way.
- [[everjust-agent-mcp]] — opening the tenant session, the tool contract, confirm
  gating, `call` and its deny list.
- [[everjust-platform]] — tenancy, the `/`-vs-`/odoo` debrand, per-tenant
  invariants. Read for the "why".
