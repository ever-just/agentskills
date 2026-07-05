---
name: everjust-website-snippets
description: Author and edit website content on an everjust.app (Odoo 19, html_builder era) tenant — the s_* snippet triad (QWeb template + t-snippet registration in website.snippets + OWL option Plugin), oe_structure drop-zones vs editable zones, and the "wrap-don't-rewrite" method for making Tailwind-QWeb marketing ports (website_connectdomain / website_tcsw) both agent- and human-editable via s_cd_* blocks. Use when the task is to add/edit a page, drop or build a reusable content block, expose builder options for a block, or safely modify a ported marketing site — via the MCP website_* tools (website_pages / website_new_page / website_edit_page / website_publish / website_menu / website_redirect), which copy-on-write into a site-specific ir.ui.view so module upgrades never clobber the edit. This is html_builder (Odoo 19), NOT the old web_editor/snippet-options.js — options are OWL Plugin classes, not data-attributes. Cross-references [[everjust-platform]] and [[everjust-agent-mcp]].
---

# EVERJUST Website Snippets — Agent Skill

Author and edit the **public website** of an everjust.app tenant as an operating
agent: create/publish pages, drop and build reusable content blocks, expose
builder options for those blocks, and safely edit the two Tailwind-QWeb marketing
ports (`website_connectdomain`, `website_tcsw`) — all through the platform's Odoo
MCP. This is **Odoo 19 / `html_builder`**, not the pre-19 `web_editor`: snippet
*options* are OWL **`Plugin`** classes keyed by a CSS selector, not
`data-*`-driven `snippet-option` widgets.

You reach the tenant through `everjust_agent_mcp` — see [[everjust-agent-mcp]] to
connect and [[everjust-platform]] for the invariants you must not break. Website
edits need the connected user to hold **Administrator / Website Designer** (Odoo
raises `AccessError` otherwise). Every recipe below is an MCP tool call or an ORM
call routed through that server.

## When to use this skill

- **Create / publish a page** or wire it into the nav (`website_new_page`,
  `website_publish`, `website_menu`, `website_redirect`).
- **Edit a page's body** — rewrite its QWeb arch **COW-safely** with
  `website_edit_page` (never a raw `ir.ui.view` write on a module view).
- **Build a reusable content block** ("snippet") the human builder can drag,
  duplicate and edit: an `s_*` QWeb template + its `<t t-snippet>` registration in
  `website.snippets` + optional SCSS + an option `Plugin`.
- **Expose builder options** (a color/size/icon toggle, a text field, a class
  switch) on a block via the `html_builder` `Plugin` / `BuilderAction` pattern.
- **Safely modify the ported marketing sites** — the connectdomain / TCSW pages
  are **verbatim Tailwind-utility QWeb**, NOT snippets. Edit the QWeb arch
  directly and reuse the existing Tailwind classes ("wrap-don't-rewrite").

**Do NOT use this skill for**, and stop if the task is really:
- **Non-page ORM data** (CRM, contacts, events records, products) — that's plain
  [[everjust-agent-mcp]] CRUD, not website authoring.
- **Registrar DNS / domain verification** — [[godaddy-api]] / `everjust.mail.*`,
  unrelated to `ir.ui.view`.
- **Sending mail from a page's form** — the form posts to Odoo; delivery is the
  `everjust.mail.*` stack ([[everjust-mail-ops]]).
- **Installing a new module / theme, or adding a *new* option `Plugin` .js asset**
  — that ships in an addon and needs a module upgrade (`-u`) on the server; the
  MCP can't hot-load JS. You can author the **QWeb `s_*` template + `website.snippets`
  registration** through `ir.ui.view`, but a *new* OWL Plugin file must land in an
  addon and be deployed (flag it; see Pitfalls #7).

---

## The model map

Everything the website is made of lives in **`ir.ui.view`** (QWeb templates) plus
a thin `website.page` URL layer. There is no separate "snippet" table — a snippet
is just a QWeb template whose root carries an `s_*` class, plus a one-line
registration inside a well-known view. Real `_name`s and the fields that matter:

| Model | Role | Key fields |
|---|---|---|
| `ir.ui.view` | **Every QWeb template** — layouts, pages, snippet bodies, and the snippet menu itself. | `key` (dotted xmlid-style, e.g. `website.s_alert`), `arch` (the XML you read/write), `arch_db`, `type` (`qweb` for web templates), `mode` (`primary`\|`extension`), `inherit_id` (set for `extension`/inherit views), `website_id` (**empty = module/global; set = a site-specific COW fork**), `active`, `name` |
| `website.page` | A **URL bound to a view** — the page layer over `ir.ui.view`. | `url`, `view_id` (→ `ir.ui.view`), `website_published`, `website_indexed` (sitemap), `date_publish` (schedule), `is_in_menu`, `website_id` |
| `website.snippets` | **The snippet MENU** — itself an `ir.ui.view` (`key='website.snippets'`, `type='qweb'`, module-global). Its arch holds `<snippets>` groups and one `<t t-snippet=...>` per block. Editing a page never touches this; registering a NEW draggable block does. | (it IS an `ir.ui.view`) |
| `website.menu` | Nav menu item. | `name`, `url`, `parent_id`, `sequence`, `new_window`, `website_id` |
| `website.rewrite` | A 301/302 redirect. | `url_from`, `url_to`, `redirect_type`, `website_id` |
| `website` | The site record. | `id`, `name`, `domain`, `menu_id` |

The core `website` module ships **~155 `s_*` templates** (more once
`website_event`/`website_forum`/etc. are installed — a real tenant shows ~190).
Never invent a snippet name; `search`/read the existing arch first.

### COW — the one invariant that makes edits durable

Writing a view's `arch` **with the website in context** forks a **site-specific
copy** (`copy-on-write`) instead of mutating the shipped module view:

```python
page.view_id.with_context(website_id=web.id).write({"arch": new_arch})
```

After this, `page.view_id.website_id` is set — a new `ir.ui.view` row with the
same `key` but bound to the site. The **original module view stays intact**, so a
module upgrade (`-u`) re-applies cleanly and **never clobbers your edit**. This is
exactly what the MCP `website_edit_page` tool does for you. (Verified live: the
homepage exists as *both* a module-global `website.homepage` primary view AND a
`website_id`-set COW fork.) **Corollary:** a raw generic `update('ir.ui.view', …)`
on a module view mutates the shipped record directly — not COW-safe, and a future
`-u` may fight it. Always go through `website_edit_page` for page bodies.

### The three surfaces on a page

1. **`oe_structure`** = a **drop zone**. `<div id="wrap" class="oe_structure">`
   (or any `.oe_structure`) is where the builder lets a human drag snippets *in*.
   `oe_structure oe_empty` = an empty drop zone. `.oe_structure_solo` and
   `.oe_structure[t-ignore="true"]` (the header/footer variants) are structural,
   not free drop zones.
2. **Editable inline zones** — text/attrs the builder can edit in place, marked by
   `t-field` / `data-oe-field` / `contenteditable`-derived attributes on a bound
   record field. These edit a *record value*, not the arch.
3. **Everything else** — plain QWeb the builder treats as fixed markup (what our
   Tailwind ports are almost entirely made of).

Keeping the page body inside a single `oe_structure` is what preserves the
human's ability to drop snippets later; stripping it (or replacing `#wrap`
wholesale with non-`oe_structure` markup) makes the page agent-only.

---

## The snippet triad (build a draggable block)

A reusable, draggable "snippet" is **three things** (option Plugin is a 4th,
optional). Here is the canonical shape, distilled from core `s_alert`:

**1. The `s_*` QWeb template** (`ir.ui.view`, `type='qweb'`). Its root element
**must carry the `s_<name>` class** — that class is the block's identity and the
selector every option/drop-zone keys off:

```xml
<template id="s_cd_callout" name="CD Callout">
  <section class="s_cd_callout oe_structure_solo"><!-- root carries s_cd_callout -->
    <div class="mx-auto max-w-6xl px-6 py-16 text-center">
      <p class="eyebrow">Eyebrow</p>
      <h2 class="font-display mt-4 text-4xl text-stone-900">Callout title</h2>
      <a href="/signup" class="mt-8 inline-block rounded-md bg-stone-900 px-7 py-3 text-stone-50">Get started</a>
    </div>
  </section>
</template>
```

**2. The registration inside `website.snippets`** — one `<t t-snippet>` line makes
it appear in the builder's "Add block" panel, filed under a `group`:

```xml
<!-- appended into the website.snippets view arch, inside <snippets id="snippet_structure"> -->
<t t-snippet="website_connectdomain.s_cd_callout" string="CD Callout" group="content">
  <keywords>cta, callout, banner, action</keywords>
</t>
```
`t-snippet` = the template `key`; `string` = its builder label; `group` = which
category tab (`intro`/`columns`/`content`/`images`/`people`/`text`/
`contact_and_forms`/`social`/`custom`/…); optional `t-thumbnail="/…svg"` and
`<keywords>` power the panel preview + search.

**3. Optional SCSS** — bundle per-snippet styles into the frontend assets via an
`<asset>` record (core `s_alert` does this). For our Tailwind ports this is
usually unnecessary — the compiled Tailwind CSS already ships as a static asset
and the block reuses those utility classes.

```xml
<asset id="s_cd_callout_scss" name="CD Callout SCSS">
  <bundle>web.assets_frontend</bundle>
  <path>website_connectdomain/static/src/snippets/s_cd_callout/000.scss</path>
</asset>
```

**4. Optional option Plugin** — see next section.

### Option Plugin = OWL `Plugin` keyed by selector (Odoo 19, NOT web_editor)

In Odoo 19 a snippet's **options panel** is an OWL `Plugin` registered in the
`builder-plugins` registry; the `Plugin` declares `builder_options`,
`builder_actions`, and the **`static selector`** on the option component binds it
to the `s_*` class. This is the exact core `alert_option_plugin.js` shape:

```js
import { Plugin } from "@html_editor/plugin";
import { registry } from "@web/core/registry";
import { withSequence } from "@html_editor/utils/resource";
import { before, WIDTH } from "@html_builder/utils/option_sequence";
import { BuilderAction } from "@html_builder/core/builder_action";
import { BaseOptionComponent } from "@html_builder/core/utils";

class CdCalloutOptionPlugin extends Plugin {
    static id = "cdCalloutOption";
    resources = {
        builder_actions: { CdCalloutStyleAction },
        builder_options: [withSequence(before(WIDTH), CdCalloutOption)],
        so_content_addition_selector: [".s_cd_callout"], // where it may be dropped
    };
}
export class CdCalloutOption extends BaseOptionComponent {
    static template = "website_connectdomain.CdCalloutOption"; // a QWeb <BuilderRow> tmpl
    static selector = ".s_cd_callout";        // <-- binds the panel to the block
}
export class CdCalloutStyleAction extends BuilderAction {
    static id = "cdCalloutStyle";
    apply({ editingElement, params: { mainParam: cls } })   { editingElement.classList.add(cls); }
    clean({ editingElement, params: { mainParam: cls } })   { editingElement.classList.remove(cls); }
    isApplied({ editingElement, params: { mainParam: cls } }) { return editingElement.classList.contains(cls); }
}
registry.category("builder-plugins").add(CdCalloutOptionPlugin.id, CdCalloutOptionPlugin);
```

Key facts: options are **`.js` in an addon** (deployed via `-u`, not writable over
MCP — Pitfall #7); a `BuilderAction`'s `apply`/`clean`/`isApplied` toggle
classes/attrs on `editingElement`; drop targeting is `so_content_addition_selector`
(content blocks) / `so_snippet_addition_selector` (top-level sections); and the
builder's drop-zone plugin already treats `:not(p).oe_structure:not(.oe_structure_solo)`
and `[data-oe-type=html]` as valid drop containers — you rarely add drop selectors.

---

## The everjust reality: "wrap-don't-rewrite"

**The connectdomain and TCSW marketing sites are NOT snippets.** They are
**verbatim Tailwind-utility QWeb**, ported 1:1 from the live Next.js/Tailwind sites
(class strings copied unchanged, `className`→`class`), wrapped in
`<t t-call="website.layout">` (or, in practice, an `inherit_id="website.homepage"`
view that `position="replace"`s `#wrap`). The compiled live Tailwind CSS ships as
a single static asset so those utility classes resolve identically; Preflight's
`@layer base` is stripped so it never fights Odoo's Bootstrap chrome. There are
**deliberately no `html_builder` snippets, no `publicWidget`, no OWL** in these
modules — only vanilla JS for the interactive bits.

Consequences for you as an operating agent:

- **To edit a marketing page, edit the QWeb arch directly** and **reuse the
  existing Tailwind classes** — do not "snippetize" it, do not reach for the
  builder options panel, do not swap in Bootstrap/`s_*` markup. Match the
  surrounding idiom (e.g. `class="mx-auto max-w-6xl px-6 py-16"`, `font-display`,
  `text-stone-900`, `eyebrow`).
- The page body is kept inside `<div id="wrap" class="oe_structure oe_empty">` and
  wrapped in the site's root scope class (`.cd-root` for connectdomain,
  `.tcsw-root` for TCSW) so the compiled CSS + chrome apply. **Preserve that
  wrapper.**
- **`s_cd_*` blocks** are the bridge: if a section of a Tailwind port needs to be
  both agent- and human-editable, extract it into an `s_cd_<name>` QWeb template
  (root class `s_cd_<name>`, body = the same verbatim Tailwind markup), register
  it in `website.snippets`, and drop it inside the page's `oe_structure`. Now a
  human can drag/duplicate/remove it in the builder **and** an agent can edit its
  template arch — without touching the surrounding hand-ported page. This is the
  "wrap-don't-rewrite" method: **wrap a Tailwind section in an `s_cd_*` shell;
  never rewrite the section into generic builder markup.**

Debrand facts you operate under (see [[everjust-platform]]): the public site at
`/` is gated by `ir.config_parameter` **`everjust.public_website == '1'`** (else
`/` bounces to the `/odoo` backend and the builder iframe can't load); the backend
lives at `/odoo`; the site is **forced light mode** (no dark-mode variant — author
for light only). Do not read/echo config-param secrets.

---

## Recipes

Tool calls are shown as `tool(args)`; in Claude Code they are namespaced
`mcp__everjust__<tool>`. All website tools run **as the connected user** and need
**Website Designer / Administrator**.

### 1. Orient: list the site's pages (do this first)

```text
website_pages()
  → { website: {id, name, domain},
      pages: [ { id, url:"/", name:"Home", view_id, published:true,
                 indexed:true, in_menu:false,
                 website_specific:false },   # false = still the module view (not yet COW'd)
               { url:"/careers", ... }, ... ] }
```
`website_specific:false` means the page still points at the shipped module view —
your first `website_edit_page` will COW-fork it (then it flips to `true`). To scope
to one site on a multi-site tenant, pass `website_id`.

### 2. Read a page's current arch before editing (never edit blind)

The website tools don't return arch, so read it via the ORM using the `view_id`
from step 1:

```text
# from website_pages(): the "/" page's view_id, e.g. 1994
get(model="ir.ui.view", ids=[1994], fields=["key","arch","website_id","mode"])
```
Read the whole arch, note the wrapper (`<div id="wrap" class="oe_structure …">`,
`.cd-root`/`.tcsw-root`) and the Tailwind idiom, then edit **within** it.

### 3. Edit a page COW-safely (the core workflow)

```text
website_edit_page(
  url="/",                        # or page_id=…
  arch="<t name='Home Page' t-name='website.homepage'> … full template … </t>")
  → { page_id, url:"/", view_id, website_specific:true, _count:1 }
```
`arch` is the **complete** QWeb template (you rewrite the whole view body, so
paste back everything you read in step 2 with your change applied — keep the
`oe_structure` wrapper and the verbatim Tailwind classes). The write forks a
site-specific `ir.ui.view`, so the upgrade path is safe. **Do not** use generic
`update('ir.ui.view', …)` for page bodies — it isn't COW and can be re-swept
(Pitfall #2 and [[everjust-platform]] rule 11).

### 4. Create + publish a new page, add it to the nav

```text
website_new_page(name="Pricing", template="website.default_page",
                 add_menu=true, published=false)
  → { created: { url:"/pricing", view_id, page_id, … }, _count:1 }

# fill the body (reuse the port's Tailwind idiom, keep it inside #wrap.oe_structure)
website_edit_page(url="/pricing", arch="… full QWeb …")

# go live (and control sitemap indexing)
website_publish(url="/pricing", published=true, indexed=true)

# ensure it's in the primary menu (if add_menu didn't place it where you want)
website_menu(name="Pricing", url="/pricing", sequence=25)
```
For connectdomain/TCSW, prefer starting from an existing ported page's arch over
`website.default_page` so you inherit the right root scope + Tailwind classes.
To **schedule** publication instead of going live now, set `date_publish` on the
`website.page` via `update` and leave `website_published=false`.

### 5. Register a reusable `s_cd_*` block (agent- + human-editable)

Two `ir.ui.view` writes: (a) create the `s_*` template, (b) append its
`<t t-snippet>` into `website.snippets`. Since these are new/global views, use the
generic ORM (`create`/`update`) — they are **not** page bodies, so COW doesn't
apply; but a *new option Plugin* (.js) still needs an addon deploy (Pitfall #7).

```text
# (a) the block template — root MUST carry the s_cd_* class
create(model="ir.ui.view", values={
  "name": "CD Callout", "type": "qweb", "key": "website_connectdomain.s_cd_callout",
  "arch": "<template id='s_cd_callout' name='CD Callout'>"
          "<section class='s_cd_callout'>"
          "<div class='mx-auto max-w-6xl px-6 py-16 text-center'>"
          "<h2 class='font-display text-4xl text-stone-900'>Callout title</h2>"
          "</div></section></template>"})

# (b) surface it in the builder panel: read website.snippets arch, add one <t t-snippet>
find(model="ir.ui.view", name="website.snippets")   # → the id of key='website.snippets'
get(model="ir.ui.view", ids=[<snippets_id>], fields=["arch"])
# then update its arch inserting inside <snippets id="snippet_structure">:
#   <t t-snippet="website_connectdomain.s_cd_callout" string="CD Callout" group="content"/>
update(model="ir.ui.view", ids=[<snippets_id>], values={"arch": "<full edited arch>"})
```
Now the block is draggable in the builder and its body is a plain template an
agent can re-edit. Drop it onto a page by placing
`<t t-snippet-call="website_connectdomain.s_cd_callout"/>`
(or the rendered markup) inside that page's `oe_structure` via `website_edit_page`.

### 6. Redirect / rename a URL

```text
website_redirect(url_from="/old-pricing", url_to="/pricing", redirect_type="301")
  → { rewrite_id, url_from, url_to, type:"301", _count:1 }
```
Use a 301 when you rename a page so existing links + SEO carry over; 302 for
temporary. Add the redirect *before* unpublishing the old URL.

---

## Pitfalls

1. **This is `html_builder` (Odoo 19), NOT `web_editor`.** There is no
   `web_editor` module here, no `snippet-options.js`, no `data-js`/`data-selector`
   option widgets. Options are OWL **`Plugin`** classes in the `builder-plugins`
   registry, bound by a `static selector` on a `BaseOptionComponent`, with
   `BuilderAction.apply/clean/isApplied`. Porting a pre-19 snippet-option verbatim
   will silently do nothing.

2. **Edit page bodies with `website_edit_page`, not raw `ir.ui.view` writes.**
   `website_edit_page` writes with `website_id` in context → **COW fork**, so a
   `-u` never clobbers it and the shipped view survives. A generic
   `update('ir.ui.view', …)` on a module page view mutates the shipped record and
   can be re-swept on the next upgrade ([[everjust-platform]] rule 11). (Generic
   `create`/`update` on `ir.ui.view` is fine for *new* snippet templates and the
   `website.snippets` menu — those aren't COW page bodies.)

3. **The `s_*` root class is load-bearing — put it on the root element.** The
   registration (`t-snippet`), the option Plugin `selector`, and drop targeting all
   key off `.s_<name>`. A block whose root lacks its `s_*` class won't get options
   and may not be recognized as a snippet.

4. **`website.snippets` is a *global* `ir.ui.view`, not per-page.** Registering a
   new draggable block edits that one menu view; it changes what's *available* on
   every page, and is orthogonal to editing any single page's arch. Don't confuse
   "add a block to the panel" (edit `website.snippets`) with "put a block on this
   page" (`website_edit_page`).

5. **The marketing ports are verbatim Tailwind-QWeb — edit, don't snippetize.**
   `website_connectdomain` / `website_tcsw` have no snippets by design. Reuse the
   existing Tailwind utility classes, keep the `#wrap.oe_structure` wrapper and the
   `.cd-root`/`.tcsw-root` scope, and don't inject Bootstrap `s_*` core snippets
   into a Tailwind page (the compiled CSS + light-mode + Preflight-stripping assume
   the ported idiom).

6. **Preserve `oe_structure` (the drop zone) and the root scope wrapper.** If you
   replace `#wrap` with markup that isn't inside an `oe_structure`, the human
   builder loses the ability to drop/rearrange snippets and the page becomes
   agent-only. Keep the body inside `<div id="wrap" class="oe_structure …">`.

7. **You can author QWeb over MCP, but you CANNOT hot-load a new option `Plugin`
   (.js).** `ir.ui.view` templates (the `s_*` body + `website.snippets`
   registration) are ORM records you can write. A *new* OWL `Plugin`/`BuilderAction`
   is a `.js` asset in an addon that only loads after the module is deployed and
   upgraded (`-u`) on the server. If a task needs a new options panel, author the
   template + registration and **flag the .js + deploy as a code change**, don't
   pretend it's live.

8. **Website tools need Website Designer / Administrator; `AccessError` = role,
   not a bug.** If `website_edit_page`/`website_new_page` fails with access, the
   connected user lacks the role — get a key from a designer/admin user. Do **not**
   grant `base.group_system` to a bot to work around it ([[everjust-platform]]
   rule 3: on this fork Administrator implies *every* app).

9. **`/` only serves the site when `everjust.public_website == '1'`.** If pages
   404 or `/` bounces to `/odoo` (and the builder iframe won't load), the tenant
   isn't flagged as a public-website tenant. That flag is a platform-ops toggle —
   read it if diagnosing, but don't flip integration secrets, and remember the
   backend is permanently at `/odoo`.

10. **Author for light mode only.** The public site is force light-mode
    ([[everjust-platform]]); there is no dark variant. Don't add
    `prefers-color-scheme`/dark-mode classes expecting them to switch.

## See also

- [[everjust-agent-mcp]] — how to connect to the tenant and the generic
  `search`/`get`/`create`/`update`/`call` + website_* tool surface.
- [[everjust-platform]] — the platform invariants (COW, `/odoo` debrand,
  `everjust.public_website`, re-sweep on `-u`, never self-escalate) that gate every
  edit here.
- [[everjust-mail-ops]] — if a page's contact form needs to actually *send*.
- [[godaddy-api]] — registrar DNS for the site's domain (separate system).
- [[frontend-design]] / [[ui-ux-audit]] — visual/UX judgement when composing a
  page's Tailwind markup.
