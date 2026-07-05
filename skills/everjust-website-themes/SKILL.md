---
name: everjust-website-themes
description: Odoo 19 website THEMES on an everjust.app tenant given the always-on EVERJUST brand. Use when borrowing a design-themes block, learning the theme.* staging models, diagnosing why brand fonts/colors are always-on, or deciding whether to run button_choose_theme. Key facts: the everjust brand is a Technical ALWAYS-ON layer (everjust_theme/everjust_brand_website, auto-install), NOT a selectable theme, so website.theme_id stays False; the safe move is LIFTING one design-themes block (copy a theme.ir.ui.view arch, re-skin, COW via website_edit_page), NOT button_choose_theme; theme.* (theme.ir.ui.view/theme.website.page/theme.ir.attachment) are staging copied into live ir.ui.view/website.page on activation; a full theme swap is safe only on a fresh empty site (it clobbers the connectdomain/tcsw ports). Block source is odoo/design-themes@19.0; the on-brand alternative is s_cd_* snippets. Via everjust_agent_mcp (admin/website-designer). Cross-refs [[everjust-platform]], [[everjust-agent-mcp]], [[everjust-website]].
---

# EVERJUST Website Themes — Agent Skill

Reason about **Odoo website themes** on a live everjust.app (Odoo 19) tenant given
the EVERJUST brand: what a "theme" actually is in Odoo (a staging→live copy
mechanism, not a stylesheet), why the everjust brand deliberately is **not** one of
those themes, how to **lift an individual on-brand block from `odoo/design-themes`**
instead of activating a whole theme, and the narrow case where a full theme swap is
safe. You operate through **`everjust_agent_mcp`** (generic ORM tools + the dedicated
`website_*` tools). Everything runs **as the connected Odoo user**, so you need an
**admin / website-designer** role — Odoo raises `AccessError` otherwise.

For how to open a session against the right tenant DB and what each tool returns, see
[[everjust-agent-mcp]]. For the invariants you must not break (one-DB-per-tenant, COW,
the `/odoo` debrand, per-tenant secrets, never self-escalate), read [[everjust-platform]]
first. To actually **edit a live page's arch**, use [[everjust-website]] /
[[everjust-website-snippets]] — this skill is about themes and where blocks come from.

## When to use this skill

- **"Pick / apply / preview a theme"** on a tenant site — and decide whether that's
  even the right move (usually it is not; see the always-on section).
- **Borrow one section from a design theme** — lift a single `theme.ir.ui.view` block
  (a hero, a feature grid, a pricing table) from `odoo/design-themes` into a page.
- **Diagnose "why are the brand fonts / monochrome colors always on"** even though no
  theme is selected — because the brand is a **Technical always-on asset layer**, not
  a selectable theme (`website.theme_id = False` and it stays that way).
- **Understand the `theme.*` staging models** — `theme.ir.ui.view`,
  `theme.website.page`, `theme.ir.attachment`, `theme.website.menu` — and how
  `button_choose_theme` **copies** them into live `ir.ui.view` / `website.page` rows.
- **Decide whether a full theme swap is safe** (only on a fresh, empty per-tenant site
  — never on the connectdomain/TCSW marketing tenants).
- **Prefer the on-brand alternative** — reach for the `s_cd_*` snippets
  (`everjust_website_snippets`) rather than a design-theme block whenever an on-brand
  block already exists.

**Do NOT use this skill for**, and stop if the task is really:
- **Editing a live page body / adding a section to an existing page** — that's the QWeb
  arch, COW-forked via `website_edit_page`; see [[everjust-website]] /
  [[everjust-website-snippets]]. Themes are about where a *new* block/site comes from.
- **Backend theme, fonts, tokens, palette** (`everjust_theme`, `everjust_brand_website`
  SCSS) — those are **compiled addon assets** shipped in code and deployed with a
  module upgrade (`-u`). They are **not** `theme.*` staging rows and **not** MCP-editable.
- **Registrar DNS / SSL / the Connect Domain PRODUCT** — unrelated ([[godaddy-api]],
  and the app under `Customdomain/app/`).
- **Installing / upgrading a module** — `button_choose_theme` installs a theme module,
  which is a heavyweight registry operation; that's platform-ops, not routine content
  work (see Pitfalls).

## The core mental model: an Odoo theme is a COPY mechanism, not a stylesheet

An Odoo "website theme" is a module in category **`Theme`** (category id 42 on this
tenant — that's exactly what `ir.module.module.get_themes_domain()` filters on). It
ships its design as **staging records** in `theme.*` models. When a theme is
**activated for a website** (`website` → `ir.module.module.button_choose_theme` →
`_theme_load`), Odoo **copies** each staging record into a **live** record bound to
that `website_id`:

```
theme.ir.ui.view    --_theme_load-->   ir.ui.view      (the live QWeb templates/pages)
theme.website.page  --_theme_load-->   website.page    (the live URL↔view bindings)
theme.website.menu  --_theme_load-->   website.menu    (the live nav)
theme.ir.attachment --_theme_load-->   ir.attachment   (images / compiled assets)
```

The link between a live record and the staging record it was copied from is
**`theme_template_id`** (live→staging, live-verified: `ir.ui.view.theme_template_id`
→ `theme.ir.ui.view`; `website.page.theme_template_id` → `theme.website.page`), and the
reverse **`copy_ids`** (staging→live: `theme.ir.ui.view.copy_ids` → `ir.ui.view`;
`theme.website.page.copy_ids` → `website.page`). `_theme_unload` (via
`button_remove_theme`) deletes those `copy_ids`. So a theme is a **library of blocks
that get copied in**, not a CSS file that gets swapped.

**Consequence you must internalize:** you almost never want to run
`button_choose_theme` on a live everjust tenant. You want to **copy ONE
`theme.ir.ui.view.arch`** out of a design theme and drop it into a page — a surgical
lift, no theme activation, no registry churn.

## Why the EVERJUST brand is NOT a selectable theme (it's an always-on layer)

Look at the live tenant: `website.theme_id = False` (no theme active), yet the brand
fonts, monochrome palette, sidebar backend, and login styling are all present. That's
by design. The brand ships as **auto-installing modules in category `Technical`**, not
`Theme`:

| Module | Category | Role | Why not "Theme" |
|---|---|---|---|
| `everjust_theme` | **Technical**, `auto_install=True` | Backend + login facelift: brand fonts (Space Grotesk/Geist), monochrome tokens, sidebar nav, `web._assets_primary_variables` seed. | A `Theme`-category module's `web.assets_frontend` is **DROPPED from a website's bundle unless that theme is the active site theme** — which silently stripped the brand fonts/tokens/login from every public page. `Technical` keeps the layer **always-on** across backend AND website frontend. |
| `everjust_brand_website` | **Technical**, `auto_install=True` | Public-site monochrome palette (overrides Odoo purple in `web._assets_primary_variables`), footer/generator rebrand. | Same reason: as a `Theme` its palette would only apply when active, leaving the public primary color Odoo purple. `Technical` = always applied. |
| `everjust_brand` | **Technical**, `auto_install=True` | Base white-label (`/odoo` debrand, "Powered by EVERJUST"). | Platform layer, not a pickable look. |

The manifests say this out loud. From `everjust_theme/__manifest__.py`:

> `# NOT "Theme": Odoo's website treats Theme-category modules as selectable site
> # themes and EXCLUDES their web.assets_frontend from a website's bundle unless that
> # theme is active … "Technical" keeps the brand layer always-on across backend AND
> # website frontend.`

So: **the brand is code (SCSS + QWeb assets), always-on, not a `theme.*` row and not
MCP-editable.** `website.theme_id` is (and should stay) `False`. Do not "apply the
everjust theme" — there is no such selectable theme, and picking a *different* design
theme would fight the always-on brand layer, not replace it. To change the brand you
edit the addon SCSS and redeploy (`-u`) — a code change, not a website op.

## Where blocks come from: `odoo/design-themes@19.0`

The block **source** is Odoo's design-themes repo (`odoo/design-themes`, branch `19.0`).
On this tenant those modules are **present on disk** at
`/usr/lib/python3/dist-packages/odoo/addons/theme_*` — ~30 of them
(`theme_default`, `theme_clean`, `theme_graphene`, `theme_cobalt`, `theme_paptic`,
`theme_aviato`, `theme_bistro`, `theme_orchid`, …) — and **all `uninstalled`** (only
`mass_mailing_themes` is installed, and that's for email, not the site). Because none is
installed, **`theme.ir.ui.view` and `theme.website.page` currently have ZERO rows** on
this DB. Their staging records only materialize when the theme module is *installed*.

The on-brand alternative (**prefer this**) is the **`s_cd_*` snippets** from
`everjust_website_snippets` — live-verified module-global views
(`everjust_website_snippets.s_cd_hero`, `s_cd_features`, `s_cd_cta`, `s_cd_heading`,
plus the `cd_snippets` registration; all `website_id=False`, `theme_template_id=False`).
These are built from the exact Connect Domain Tailwind classes, so a block dropped from
here already matches the site. **Reach for an `s_cd_*` block before a design-theme block**
— see [[everjust-website-snippets]] for the snippet triad and how to add more.

## Key models (real fields, live-verified on the connectdomain DB)

| Model | Role | Key fields (verified) |
|---|---|---|
| `theme.ir.ui.view` | **Staging QWeb** for a theme's templates/pages/snippets. Copied → `ir.ui.view` on activation. **Currently 0 rows** (no theme installed). | `name`, `key`, `type` (`qweb`), `mode` (`primary`\|`extension`), `arch` (the XML you lift), `inherit_id` (**a `reference` field — a `model,id` string, not a plain m2o**), `priority`, `customize_show`, `active`, `arch_fs`, `copy_ids` (→ live `ir.ui.view`) |
| `theme.website.page` | **Staging page** (URL + header/footer chrome + publish/index intent). Copied → `website.page`. | `url`, `view_id` (→ `theme.ir.ui.view`), `is_published`, `website_indexed`, `is_new_page_template`, `header_visible`, `footer_visible`, `header_overlay`, `header_color`, `header_text_color`, `copy_ids` (→ live `website.page`) |
| `theme.website.menu` | Staging nav item. Copied → `website.menu`. | `name`, `url`, `parent_id`, `sequence`, `page_id`, `new_window`, `use_main_menu_as_parent`, `mega_menu_content`, `mega_menu_classes`, `copy_ids` |
| `theme.ir.attachment` | Staging image/asset. Copied → `ir.attachment` (keyed, dedup by `key`). | `name`, `key`, `url`, `copy_ids` |
| `ir.ui.view` | **The live QWeb.** A copied theme view carries `theme_template_id` (→ its `theme.ir.ui.view`); a COW site fork carries `website_id`. | `key`, `arch`, `type`, `mode`, `inherit_id`, `website_id` (**empty = module/global; set = site COW fork**), `theme_template_id` (**→ `theme.ir.ui.view`; the "I came from a theme" back-link, `False` on non-theme views**), `active`, `priority` |
| `website.page` | **The live URL↔view binding** (+publish/SEO/visibility). | `url`, `view_id`, `website_published`, `website_indexed`, `theme_template_id` (→ `theme.website.page`), `header_visible`, `footer_visible`, `is_new_page_template`, `website_id` |
| `ir.module.module` | A theme is a module in category **`Theme`** (id 42). | `name`, `state` (`uninstalled`\|`installed`\|…), `category_id`, `is_installed_on_current_website`; methods `button_choose_theme`, `button_remove_theme`, `_theme_load`, `_theme_unload`, `get_themes_domain` |
| `website` | The site. `theme_id` names the active theme (**`False` here — brand is always-on, no theme active**). | `id`, `name`, `domain`, `theme_id`, `menu_id` |

**Note (Odoo 19):** `web_editor` is replaced by `html_builder`; on views/pages the
group field is **`group_ids`**, and on `res.users` it is **`group_ids`** (not the
legacy `groups_id`). Themes are copied by `html_builder`/`website` machinery; you don't
edit theme *options* over MCP (those are OWL Plugin classes — [[everjust-website-snippets]]).

## Recipes

Route each through `everjust_agent_mcp` against the tenant (in Claude Code the tools are
namespaced `mcp__everjust__<tool>`). All run **as the connected user** and need
**Website Designer / Administrator**. Confirm gating (from the MCP controller):
`delete` and **non-read `call`** need **`confirm:true`**; `create`/`update` on
`theme.ir.ui.view` / `ir.ui.view` / `website.page` are **not** confirm-gated (that's the
website workflow) but **theme activation via `call button_choose_theme` / installing a
theme module IS a non-read call → needs `confirm:true`**. Granting Administrator and
writing secret config are **hard-blocked** regardless of role ([[everjust-platform]]).

### 1. Orient: is any theme active, and what design themes are available?

```jsonc
// tool: get  — the site's active theme (expect theme_id:false on everjust tenants)
{ "model": "website", "ids": [1], "fields": ["name","domain","theme_id"] }
// → theme_id:false  ⇒ NO selectable theme active; the brand is the always-on layer.

// tool: list_installed_modules  (or search ir.module.module) — see what themes exist
{ "model": "ir.module.module",
  "domain": [["category_id.name","=","Theme"]],
  "fields": ["name","shortdesc","state"], "limit": 200 }
// → the design-themes: theme_default/theme_clean/theme_graphene/… all "uninstalled".
```
If `theme_id` is set to something non-`False` on an everjust tenant, treat that as a
misconfiguration to investigate, not a feature — the intended state is `False` +
always-on brand. `theme.ir.ui.view`/`theme.website.page` having **0 rows** simply means
no theme module is installed (the normal state here).

### 2. PREFER an on-brand `s_cd_*` block over a design-theme block

Before touching any theme, check whether an on-brand block already covers the need:
```jsonc
// tool: search  — the on-brand snippet library (module-global, already brand-styled)
{ "model": "ir.ui.view", "domain": [["key","like","s_cd_"]],
  "fields": ["key","name","website_id","theme_template_id"] }
// → everjust_website_snippets.s_cd_hero / s_cd_features / s_cd_cta / s_cd_heading …
```
If one fits, use it — read its `arch`, drop it inside the target page's `oe_structure`
via `website_edit_page`, and you're on-brand with zero theme involvement. Adding a *new*
`s_cd_*` block is [[everjust-website-snippets]] recipe 5. Only fall through to a
design-theme block (recipe 3) when no `s_cd_*` and no existing page section gives you the
layout you need.

### 3. LIFT a single block from a design theme (the surgical, no-activation path)

You want one section's markup from, say, `theme_graphene` — **without** activating the
theme. The staging rows only exist while the theme module is installed, and installing a
theme is heavyweight (Pitfall #1). Two grounded options:

**(a) Read the block from the theme's source on disk (preferred — zero registry risk).**
The theme modules live at `/usr/lib/python3/dist-packages/odoo/addons/theme_<name>/`.
Open the theme's view XML, copy the one `<template>`/`<section>` arch you want, then
**re-skin it to the everjust idiom** — strip Bootstrap/theme utility classes and replace
with the site's Tailwind vocabulary (`mx-auto max-w-6xl px-6`, `font-display`,
`text-stone-900`) so it matches. Drop the reworked markup into the page with
`website_edit_page` (keep the `oe_structure` wrapper + `.cd-root` scope). This lifts the
*layout idea*, not the theme's styling — which is what you actually want, since the brand
layer already supplies the look.

**(b) If (and only if) the theme is already installed on the tenant**, its blocks are
live in `theme.ir.ui.view`, and you can read the arch over MCP:
```jsonc
// tool: search  — a specific staged block (only returns rows if a theme is installed)
{ "model": "theme.ir.ui.view",
  "domain": [["key","like","theme_graphene."],["type","=","qweb"]],
  "fields": ["name","key","mode","arch"], "limit": 20 }
// → copy the ONE block's `arch`, re-skin to the everjust Tailwind idiom, then:
// tool: website_edit_page  (COW-safe; see [[everjust-website]] recipe 2)
{ "url": "/landing", "arch": "<t …> …existing page with the re-skinned block… </t>" }
```
Either way: **you copy an arch, you do not activate a theme.** Never write the block into
the *shipped* module view — `website_edit_page` COW-forks it (Pitfall #4).

### 4. Preview a theme WITHOUT committing (read-only inspection)

To evaluate a theme's look before deciding, **do not** install it on a live tenant. Read
its intent read-only:
```jsonc
// tool: get  — the module's description/screenshots metadata
{ "model": "ir.module.module",
  "domain": [["name","=","theme_orchid"]],
  "fields": ["name","shortdesc","description_html","state","category_id"] }
```
Then inspect the actual block markup from disk under
`/usr/lib/python3/dist-packages/odoo/addons/theme_orchid/` (via [[everjust-platform]]
shell access), or spin the theme up on a **throwaway sandbox DB**, never the customer
tenant. Presenting a theme choice is a decision to surface to a human, not to auto-apply.

### 5. Activate a FULL theme — only on a fresh, empty per-tenant site

A whole-theme swap is **safe only when the site has no content to lose**: a brand-new
tenant DB whose website is still the default "My Website" (no ported marketing pages, no
custom `website.page` rows, `theme_id=False`, nothing built yet). In that narrow case:
```jsonc
// 1) install the theme module (heavyweight — non-read call → confirm required)
// tool: call
{ "model": "ir.module.module", "method": "button_immediate_install",
  "ids": [<theme_module_id>], "confirm": true }
// 2) bind it to the website (this runs _theme_load, copying theme.* → live records)
// tool: call
{ "model": "ir.module.module", "method": "button_choose_theme",
  "ids": [<theme_module_id>], "confirm": true }
```
`button_choose_theme` copies every `theme.ir.ui.view` / `theme.website.page` /
`theme.website.menu` / `theme.ir.attachment` into live `website_id`-bound records and
sets `website.theme_id`. **Reverse with `button_remove_theme` (`confirm:true`)** — it
runs `_theme_unload`, deleting the `copy_ids` it created. **Do NOT do this on
connectdomain / TCSW or any tenant with real content:** it would fight the always-on
brand layer, clobber the hand-ported Tailwind pages, and re-point the nav. On those
tenants the answer is always recipe 2/3 (lift a block), never recipe 5.

### 6. Check whether a page came from a theme (and thus is safe to reset)

```jsonc
// tool: search  — live views/pages that were copied from a theme carry theme_template_id
{ "model": "ir.ui.view", "domain": [["theme_template_id","!=",false]],
  "fields": ["key","name","website_id","theme_template_id"] }
// On this tenant → 0 rows: nothing here came from a theme; every page is
// hand-authored (website_connectdomain) or an s_cd_* block. So there is no theme
// state to "reset to" — removing a theme is a no-op and editing pages is normal COW work.
```
`theme_template_id != False` on a live record means "this was copied from a theme and
`button_remove_theme` would remove it." `False` (the case here) means it's genuinely
yours — edit it via [[everjust-website]] / [[everjust-website-snippets]], don't treat it
as theme output.

## Pitfalls

1. **`button_choose_theme` is a module INSTALL + bulk copy, not a stylesheet switch.**
   It installs the theme module (registry reload) and copies every `theme.*` staging row
   into live `website_id`-bound records. That's a heavyweight, content-mutating operation
   — never routine content work, and never on a tenant with real pages. It's a non-read
   `call` → **`confirm:true`** required. Prefer lifting one block (recipe 3).

2. **The everjust brand is NOT a theme — never try to "apply" or "switch to" it.** It's
   `everjust_theme` / `everjust_brand_website` in category **`Technical`**,
   `auto_install=True`, always-on. `website.theme_id` is `False` and must stay `False`.
   Picking a design theme does not *replace* the brand; it *fights* the always-on asset
   layer. To change the brand you edit the addon SCSS and redeploy (`-u`) — a code change,
   not an MCP/website op.

3. **`theme.ir.ui.view` / `theme.website.page` are STAGING, and are empty until a theme
   is installed.** On this tenant they have **0 rows** because no design theme is
   installed. Don't expect to read a theme's blocks from `theme.ir.ui.view` unless that
   theme module is actually installed — for uninstalled themes, read the arch from the
   module's XML on disk (`/usr/lib/python3/dist-packages/odoo/addons/theme_*`).

4. **Lift the ARCH, then re-skin — don't paste theme markup raw, and don't raw-write a
   module view.** A design-theme block carries the theme's Bootstrap/utility classes;
   pasted as-is it renders off-brand (the block's own CSS isn't loaded unless the theme
   is active). Copy the *layout*, re-express it in the site's Tailwind idiom
   (`font-display`, `text-stone-900`, `max-w-6xl`), and write it back with
   **`website_edit_page`** (COW-forks a site-specific `ir.ui.view`). A raw
   `update('ir.ui.view', …)` on a shipped module view is not COW-safe and gets re-swept
   on `-u` ([[everjust-platform]]).

5. **Prefer `s_cd_*` over any design-theme block.** `everjust_website_snippets` ships
   `s_cd_hero/features/cta/heading` built from the real Connect Domain Tailwind classes —
   already on-brand, already draggable. Reach for a design-theme block only when no
   `s_cd_*` and no existing section covers the layout, and even then re-skin it.

6. **`theme_template_id` tells you provenance; `copy_ids` is the reverse.** A live
   `ir.ui.view`/`website.page` with `theme_template_id` set came from a theme (and
   `button_remove_theme` would delete it); `False` means it's hand-authored/`s_cd_*` and
   is normal COW-editable content. On this tenant **0** live views carry
   `theme_template_id` — nothing is theme-derived, so there's no theme state to reset.

7. **`inherit_id` on `theme.ir.ui.view` is a `reference` field, not a plain m2o.** It
   stores a `model,id` string (theme staging can inherit across theme models). Don't
   treat it like a normal integer FK when reading/filtering staging rows.

8. **A full theme swap wipes/re-points content — safe ONLY on a fresh, empty site.** On
   connectdomain / TCSW the pages are verbatim Tailwind-QWeb ports and the nav is
   hand-built; `button_choose_theme` would copy in the theme's pages/menu and collide
   with all of it while the brand layer stays on. Full activation belongs only to a
   never-configured tenant. For everything else: lift a block.

9. **You act with YOUR role; theme ops are Administrator-level.** Installing a theme
   module and `button_choose_theme` require admin; `AccessError`/refusal is a role
   signal, not a bug. **Never** grant `base.group_system` to a bot to work around it —
   it's hard-blocked and, on this fork, Administrator implies *every* app
   ([[everjust-platform]] rule 5). `res.users` groups are **`group_ids`** in Odoo 19,
   not `groups_id`.

10. **This is `html_builder` (Odoo 19), not `web_editor`.** Theme block *options* (the
    builder panel) are OWL `Plugin` classes you can't hot-load over MCP; you can author
    QWeb (`ir.ui.view`) but a new options `.js` needs an addon deploy. For block/option
    authoring see [[everjust-website-snippets]].

## See also

- [[everjust-platform]] — the invariants (COW, `/odoo` debrand,
  `everjust.public_website` gate, re-sweep on `-u`, never self-escalate, admin =
  every app) that gate every theme/website op here.
- [[everjust-agent-mcp]] — connecting to the tenant + the generic
  `search`/`get`/`create`/`update`/`call`/`list_installed_modules` + `website_*` tools
  and their confirm gating.
- [[everjust-website]] — editing a live page's arch, nav, redirects, SEO, publish state
  (where a lifted block actually lands).
- [[everjust-website-snippets]] — the `s_*`/`s_cd_*` snippet triad, `oe_structure` drop
  zones, and "wrap-don't-rewrite" for the Tailwind marketing ports (the on-brand
  alternative to design-theme blocks).
- `odoo/design-themes@19.0` — the upstream block source (on-disk at
  `/usr/lib/python3/dist-packages/odoo/addons/theme_*`).
