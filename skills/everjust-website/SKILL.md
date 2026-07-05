---
name: everjust-website
description: Manage the public marketing site of an everjust.app (Odoo 19) tenant through the everjust_agent_mcp WEBSITE tools — list/create/edit pages (copy-on-write QWeb arch), nav menus, 301/302 redirects, per-page SEO metadata, publish/schedule/index state, and page visibility. Use when the task is to edit a marketing page's content, add or reorder a nav menu item, create a redirect, set a page's title/description/OG image for SEO, publish/unpublish/schedule a page, or understand the /-vs-/odoo debrand and the public-website gate. The everjust marketing pages (website_connectdomain, website_tcsw) are VERBATIM Tailwind-utility QWeb wrapped in <t t-call="website.layout">, NOT drag-drop snippets — you edit the QWeb arch and reuse the existing Tailwind classes. Requires an admin / website-designer Odoo role. NOT for backend business data and NOT for DNS/SSL of a customer's OWN domain (the Connect Domain product). Cross-references [[everjust-platform]] and [[everjust-agent-mcp]].
---

# EVERJUST Website — Agent Skill

Manage the **public marketing website** of a live everjust.app tenant: its pages,
nav menus, redirects, per-page SEO, and publishing state. You do it through the
**`everjust_agent_mcp`** server's dedicated **WEBSITE tools** (`website_pages`,
`website_new_page`, `website_edit_page`, `website_publish`, `website_menu`,
`website_redirect`) plus the generic ORM tools (`search`/`get`/`update`/`call`)
for the parts those don't cover (SEO fields, page visibility, menu re-order,
redirect edits). Everything runs **as the connected Odoo user**, so you need an
**admin or website-designer** role — Odoo raises `AccessError` otherwise.

This skill is for an **operating agent** driving one tenant's site. For how to
open a session against the right tenant DB and what each tool returns, see
[[everjust-agent-mcp]]. For the platform's non-standard shape and the invariants
you must not break (one-DB-per-tenant, the `/odoo` debrand, per-tenant secrets),
read [[everjust-platform]] first.

## When to use this skill

- **Edit a marketing page's content** — change copy, a section, a CTA, add a
  block. On everjust the pages are hand-written Tailwind QWeb, so you rewrite the
  page's QWeb `arch` and reuse the existing Tailwind class vocabulary.
- **Create a new page** from a template, published or as a draft.
- **Nav menus** — add a top-nav item, list the menu tree, reorder, nest, or point
  a menu at an external URL.
- **Redirects** — 301/302/308/404 a moved or retired URL (`website.rewrite`).
- **Per-page SEO** — set the `<title>`, meta description, keywords, OG image, and
  the SEO URL slug (`seo_name`) for a page.
- **Publishing** — publish/unpublish, toggle sitemap indexing, schedule a
  future go-live, or gate a page behind sign-in / a password.
- **Understand the debrand** — why `/` serves the marketing site only when the
  public gate is on, and why the backend lives at `/odoo`.

**Do NOT use this skill for**, and stop if the task is really:
- **Backend business data** (CRM, contacts, invoices, events, products) — that's
  the generic MCP tools; see [[everjust-agent-mcp]] and the domain skills.
- **The Connect Domain PRODUCT** (auto-configuring DNS + issuing SSL + reverse-
  proxying a CUSTOMER's own domain). That is the app under `Customdomain/app/`,
  a separate control-plane — nothing to do with this Odoo website module.
- **Registrar DNS writes** for `connectdomain.app` itself — GoDaddy API / Route 53,
  not this model. See [[godaddy-api]].
- **Theme / global palette / fonts** — those are SCSS assets in the theme addons
  (`everjust_theme`, `everjust_brand_website`), shipped in code and deployed, not
  editable from the MCP.
- **Drag-drop snippet building** — Odoo 19's `html_builder` snippet OPTIONS are
  OWL Plugin classes; you cannot script the builder over MCP. You edit the `arch`.

## Architecture — the model map

One tenant DB = one site (usually exactly one `website` record). A page is a URL
bound to a QWeb view; the view holds the actual markup. Everything is scoped by
`website_id` (a value, or `False` = "applies to every website").

| Model | Role | Key fields (live-verified) |
|---|---|---|
| `website` | The site itself (one per tenant here: id 1, `name`="Connect Domain", `domain`="https://connectdomain.app"). | `name`, `domain`, `menu_id` (root menu), `default_lang_id`, `homepage_url` |
| `website.page` | **A URL ↔ view binding + publish/SEO/visibility state.** `_inherits` `ir.ui.view` via `view_id` — so `arch`, `key`, `name`, `active` you read on a page actually live on its **view**, and writing them writes the view. | `url`, `name`, `view_id`, `website_id`, `website_published`, `website_indexed`, `date_publish`, `is_in_menu`, `is_homepage`, `visibility`, `visibility_password`, `arch`, `key`, `is_seo_optimized`, `website_meta_title`, `website_meta_description`, `website_meta_keywords`, `website_meta_og_img`, `seo_name` |
| `ir.ui.view` | **The QWeb markup.** A page's real content. Editing it **with `website_id` in context copy-on-writes** a module view into a website-specific fork (see COW below). | `arch`/`arch_db`, `key` (e.g. `website.homepage`), `type`='qweb', `website_id` (False = module view; set = site-specific fork), `inherit_id`, `active`, `priority` |
| `website.menu` | **Nav tree** (top menu + children). | `name`, `url`, `parent_id`, `sequence` (order), `website_id`, `new_window`, `page_id`, `is_mega_menu`, `mega_menu_content` |
| `website.rewrite` | **A redirect / rewrite rule.** | `name`, `url_from`, `url_to`, `redirect_type` (`301`/`302`/`308`/`404`), `website_id`, `sequence`, `active` |
| `website.seo.metadata` | The **SEO mixin** whose fields are delegated onto `website.page` (and other seo-optimizable records). You almost never touch this model directly — you set the `website_meta_*` / `seo_name` fields **on the page**. | `website_meta_title`, `website_meta_description`, `website_meta_keywords`, `website_meta_og_img`, `seo_name`, `is_seo_optimized` |

### Copy-on-write (COW) — the single most important mechanic

Odoo ships pages as **module views** (`ir.ui.view` with `website_id = False`),
installed and re-installed on every module upgrade. If you edited a module view
in place, the next upgrade would clobber your edit — and you'd be mutating the
shipped template for *every* site.

Instead, when you **write a view's `arch` with the site in context**
(`with_context(website_id=web.id)`), Odoo **forks a website-specific copy**
(`website_id = web.id`) and applies your change to the fork. The original module
view ships intact; the fork wins at render time for this site; upgrades never
touch it. **`website_edit_page` does exactly this for you** — it writes
`page.view_id.with_context(website_id=web.id)` — so prefer it over a raw
`ir.ui.view` write. (On this tenant the homepage `website.homepage` view is
*already* a site-specific fork, because the `website_connectdomain` addon's
inherited templates forked it at install.)

### The everjust QWeb idiom (NOT snippets) — READ THIS BEFORE EDITING

Stock Odoo pages are built from **snippets** — 190-ish `s_*` QWeb templates you'd
normally drag in the `html_builder`. **The everjust marketing pages are NOT built
that way.** `website_connectdomain` and `website_tcsw` port the live Next.js /
Tailwind sites **verbatim**: each page is hand-written QWeb, `className → class`,
wrapped in `<t t-call="website.layout">`, using the compiled Tailwind CSS the
addon ships (`connectdomain.css` / `tcsw.css`). So:

- **Edit the QWeb `arch` directly and reuse the EXISTING Tailwind classes** you
  find on the page (e.g. `mx-auto w-full max-w-6xl px-6`, `text-stone-900`,
  `rounded-md bg-stone-900 …`). Match the surrounding vocabulary; don't invent a
  class the compiled CSS doesn't define — it won't be styled.
- These are **not** `s_*` snippets, so don't try to "add a snippet." Add a
  `<section>`/`<div>` with the same class idiom as its siblings.
- The chrome (header `#top`, footer `#bottom`) and the homepage `#wrap` are set
  by `inherit_id` templates in code; page bodies live inside `#wrap` / a page
  view. Interactive bits (mobile nav, cross-fading demo) are driven by the
  addon's vanilla JS on class hooks (`.cd-*`), not OWL — don't add React/OWL.
- Links to authenticated app surfaces point at the live standalone app
  (`https://platform.connectdomain.app/...`); on-page anchors stay relative
  (`/#how`, `/compare/entri`). Keep that split.

### The `/`-vs-`/odoo` debrand and the public gate

everjust debrands aggressively (see [[everjust-platform]]):
- The **backend webclient** is served at **`/odoo`** (address bar also shows
  `/everjust`); `/web` and `/scoped_app` still resolve.
- The **public marketing site** is served at **`/`** — but only when the tenant's
  gate is ON: `ir.config_parameter` **`everjust.public_website` == `'1'`**. When
  it's on, `EverjustHome.index` delegates `/` to the website controller (renders
  the homepage). When it's OFF, `/` 301-redirects to `/odoo` (app-only tenant).
  On the connectdomain tenant the gate is **`'1'`** (public site live).
- Signed-in **non-internal** users at `/` bounce to `/web/login_successful`.
- The footer "Powered by" and the `<meta name="generator">` are rebranded to
  EVERJUST.APP; the login card is stripped of website chrome. All of that is code
  (`everjust_brand_website`), not page content — don't try to "fix branding" by
  editing a page.

`everjust.public_website` **is not a secret**, so in principle it's writable via
the generic `update` MCP tool — but it's an `ir.config_parameter`, a **structural
model**, so writing it needs **`confirm:true`**. Only flip it on/off deliberately:
turning it OFF takes the whole public site down (`/` → `/odoo`); turning it ON on
an unconfigured DB exposes the default "My Website" chrome. This is a
platform-ops decision, not routine page work.

## The tool surface (what's dedicated vs. generic)

| Need | Tool | Notes |
|---|---|---|
| List pages | `website_pages` | Start here. Returns url, view_id, published/indexed, in_menu, and `website_specific` (is the view a COW fork). |
| Create a page | `website_new_page` | `name` (req), `template` (default `website.default_page`), `add_menu` (default true), `published` (default false → **draft**). |
| Edit page content | `website_edit_page` | `arch` (req, the **complete** QWeb template), + `url` or `page_id`. **COW-safe.** |
| Publish / index | `website_publish` | `published` (default true), optional `indexed`. |
| Nav menus | `website_menu` | `list:true` to read the tree; else `name`+`url` to add one. |
| Redirects | `website_redirect` | `url_from`+`url_to`, optional `redirect_type` (default `301`). |
| **Per-page SEO** | generic `update` on `website.page` | No dedicated tool — set `website_meta_*` / `seo_name` on the page. |
| **Schedule / visibility** | generic `update` on `website.page` | `date_publish`, `visibility`, `visibility_password`. |
| **Reorder / nest / edit a menu** | generic `update` on `website.menu` | Change `sequence` / `parent_id` / `url`. |
| **Edit / disable a redirect** | generic `update` on `website.rewrite` | Change `redirect_type` / `url_to` / `active`. |

The dedicated `website_*` tools run their own COW-correct ORM calls and are NOT
confirm-gated. The generic tools ARE gated where it matters: **`delete` always
needs `confirm:true`**; `update`/`create` on `ir.config_parameter` (the public
gate) needs `confirm:true`. `website.page` / `website.menu` / `website.rewrite` /
`ir.ui.view` are **not** confirm-structural for create/update (editing views is
the core workflow) — but a *delete* of any of them still needs confirm. Granting
admin and writing secret config params are hard-blocked regardless.

## Recipes

Route each through the `everjust_agent_mcp` MCP against the tenant. Prefer the
dedicated `website_*` tool; drop to generic ORM only for the columns it doesn't
expose.

### 1. Survey the site before touching anything

```jsonc
// tool: website_pages   (no args needed → uses the tenant's one website)
{}
// → { website:{id,name,domain}, pages:[{id,url,name,view_id,published,indexed,
//     in_menu, website_specific}], _count }
```
`website_specific:false` = the page still renders the **shipped module view** (your
first edit will COW-fork it). `website_specific:true` = already forked. Read the
page's CURRENT arch before editing so you keep the Tailwind idiom:
```jsonc
// tool: get  (generic)
{ "model": "website.page", "ids": [<page_id>],
  "fields": ["url","name","key","arch","website_published","website_indexed",
             "website_meta_title","website_meta_description","seo_name","visibility"] }
```

### 2. Edit a page's content (COW-safe, keep the Tailwind idiom)

Fetch the current `arch`, modify the section you need **inside** the existing
class vocabulary, then write the **complete** template back:
```jsonc
// tool: website_edit_page
{ "url": "/",                       // or "page_id": <id>
  "arch": "<t name=\"Connect Domain Homepage\" ...> ... full QWeb ... </t>" }
// → { page_id, url, view_id, website_specific:true, _count:1 }
```
`arch` must be the FULL template, not a fragment (`website_edit_page` overwrites
the whole view arch). It writes with the website in context → **copy-on-write**;
`website_specific` comes back `true`. Reuse classes already on the page
(`max-w-6xl`, `text-stone-900`, `rounded-md bg-stone-900 …`); don't invent
Tailwind the compiled CSS doesn't ship. Don't add OWL/React — interactivity is
the addon's vanilla JS on `.cd-*` hooks. If you must inherit a shipped template
instead of overwriting a page (e.g. tweak the header), that's an `ir.ui.view`
with `inherit_id` + an XPath — but that belongs in the ADDON code, not an MCP
edit; for MCP work stay on `website_edit_page`.

### 3. Create a new page (draft, then publish)

```jsonc
// tool: website_new_page   → creates a page from a template, unpublished
{ "name": "Pricing", "template": "website.default_page",
  "add_menu": true, "published": false }
// → { created:{...}, _count:1 }   (url derives from name → /pricing)
```
Then rewrite its body with `website_edit_page` (recipe 2) in the Tailwind idiom,
and publish with recipe 5 when ready. `add_menu:true` drops a top-nav item; set
`false` if you'll place it yourself (recipe 4).

### 4. Nav menus — list, add, reorder, nest

```jsonc
// list the tree
{ "list": true }                                    // tool: website_menu
// → { menus:[{id,name,url,parent_id,sequence}], _count }

// add a top-nav item (parent defaults to the site's root menu)
{ "name": "Pricing", "url": "/pricing", "sequence": 30 }   // tool: website_menu
```
`website_menu` only lists or ADDS. To **reorder**, **nest**, **rename**, or point
a menu at a **new URL / external site**, `update` the `website.menu` row:
```jsonc
// tool: update
{ "model": "website.menu", "ids": [<menu_id>],
  "values": { "sequence": 15, "parent_id": <parent_menu_id>,
              "url": "https://platform.connectdomain.app/docs", "new_window": true } }
```
Lower `sequence` = further left/higher. `parent_id` = the site root (`website.menu_id`)
for a top-level item, or another menu id to nest. Removing a menu is a `delete`
(needs `confirm:true`) — but deleting the page's menu doesn't delete the page.

### 5. Publish, unpublish, index, and SCHEDULE

```jsonc
// publish + include in sitemap                       // tool: website_publish
{ "url": "/pricing", "published": true, "indexed": true }
// unpublish (take it offline)
{ "url": "/pricing", "published": false }
```
`website_published` = live vs. draft; `website_indexed` = in the sitemap /
crawlable. To **schedule** a future go-live, set `date_publish` (a datetime) on
the page — the page shows only from that time:
```jsonc
// tool: update
{ "model": "website.page", "ids": [<page_id>],
  "values": { "date_publish": "2026-08-01 13:00:00", "website_published": true } }
```
To **gate a page** behind sign-in or a password, set `visibility` (`""`=Public,
`"connected"`=Signed In, `"restricted_group"`=Restricted Group, `"password"`=With
Password; with `"password"` also set `visibility_password`):
```jsonc
{ "model": "website.page", "ids": [<page_id>],
  "values": { "visibility": "connected" } }
```

### 6. Per-page SEO (title, description, OG image, slug)

No dedicated tool — set the delegated `website.seo.metadata` fields **on the page**:
```jsonc
// tool: update
{ "model": "website.page", "ids": [<page_id>],
  "values": {
    "website_meta_title": "Pricing — Connect Domain",
    "website_meta_description": "Bring-your-own-domain onboarding from $0. Automatic DNS, SSL and edge.",
    "website_meta_keywords": "custom domain, DNS, SSL, Entri alternative",
    "seo_name": "pricing"          // the SEO URL slug (clean canonical)
  } }
// og image: website_meta_og_img expects an image URL/path (e.g. /web/image/... or a static asset)
```
`is_seo_optimized` is computed (title+description present) — read it to confirm.
The page `<title>` and metas come from these fields, overriding any `<title>` in
the arch; set them here rather than hand-editing `<head>`.

### 7. Redirect a moved / retired URL

```jsonc
// tool: website_redirect   → creates a website.rewrite
{ "url_from": "/old-pricing", "url_to": "/pricing", "redirect_type": "301" }
// → { rewrite_id, url_from, url_to, type, _count:1 }
```
`redirect_type`: `301` (permanent, default — passes SEO), `302` (temporary), `308`
(redirect/rewrite), `404` (gone). To **change or disable** a rule, `update` the
`website.rewrite` row (`redirect_type`, `url_to`, or `active:false`); to remove it,
`delete` with `confirm:true`. Redirects are matched before pages, so a bad
`url_from` can shadow a live page — verify `url_from` is truly retired.

## Pitfalls

1. **Never raw-write an `ir.ui.view` `arch` without the website in context.** That
   edits the SHIPPED module view — no COW fork — so the next module upgrade
   clobbers your change, and you've mutated the template for every site.
   **Use `website_edit_page`** (it forks correctly). If you must go through generic
   `update`, you'd have to pass the website context yourself, which the generic
   tool doesn't — so just use `website_edit_page`.

2. **`website_edit_page` overwrites the WHOLE view arch.** Its `arch` is not a
   patch — pass the *complete* template. Always `get` the current `arch` first,
   modify in place, and send it all back. A fragment truncates the page.

3. **These pages are hand-written Tailwind QWeb, not snippets.** Don't try to add
   an `s_*` snippet or invoke the builder over MCP (Odoo-19 `html_builder` options
   are OWL Plugin classes — unscriptable here). Add plain `<section>`/`<div>`
   markup in the SAME Tailwind class vocabulary as the surrounding page. A class
   the compiled CSS (`connectdomain.css`) doesn't define renders unstyled.

4. **Set SEO on the PAGE, not by editing `<head>`.** `website_meta_title` /
   `website_meta_description` / `seo_name` on `website.page` drive the rendered
   `<title>`/metas/canonical and override arch `<title>`. There's no `website_seo`
   tool — use generic `update`. Don't hand-roll `<meta>` tags in the arch.

5. **`is_in_menu` / `add_menu` and publishing are independent.** A page can be
   published but not in the nav, or in the nav while unpublished (a dead link).
   After creating a page, decide *both*: publish (recipe 5) AND menu (recipe 4).

6. **Redirects are evaluated before pages and can shadow a live URL.** A
   `website.rewrite` whose `url_from` matches a real page will intercept it. Check
   `url_from` is genuinely retired; a `404` type hard-hides the target.

7. **Don't touch the public gate casually.** `everjust.public_website` is an
   `ir.config_parameter` (structural → `confirm:true` to write). Setting it to
   `'0'` takes the ENTIRE public site offline (`/` → `/odoo`); on an unconfigured
   DB `'1'` exposes default "My Website" chrome. This is platform-ops, not page
   work — see [[everjust-platform]].

8. **Debranding is code, not content.** The "Powered by EVERJUST.APP" footer,
   the `generator` meta, the login card, the palette/fonts live in
   `everjust_brand_website` / `everjust_theme` addon templates + SCSS. You can't
   fix or change them from the MCP; edit the addon and redeploy.

9. **You act with YOUR role.** Every website op runs as the connected user and is
   audit-logged. Without **website-designer / admin** rights, `website_edit_page`
   and friends raise `AccessError`. Confirm your role before a session of edits
   (see [[everjust-agent-mcp]]).

10. **One website per tenant, everything scoped by `website_id`.** These tools
    default to the tenant's single `website` (id 1 = "Connect Domain" here). A
    `website_id=False` view/menu/redirect applies to *all* sites; a set `website_id`
    is site-specific (COW forks are). Confirm you're on the right tenant DB before
    editing (see [[everjust-platform]]).
