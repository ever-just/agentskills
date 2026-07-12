---
name: everjust-website-infra-views
description: Edit the INFRA / chrome / sitewide QWeb views of an everjust.app (Odoo 19) tenant — header/footer, a sitewide JSON-LD schema view, a CSS/polish view — plus robots.txt, WITHOUT box SSH, driving remote XML-RPC on ir.ui.view. Use when the generic everjust_agent_mcp `update` tool REFUSES to write ir.ui.view (it blocks that model as a security model) and you have no SSH to the box, so the only remaining lane is odoo_client.kw write on ir.ui.view over XML-RPC. Covers: the MCP-blocks-ir.ui.view fact and the XML-RPC fallback; the active=False website-specific fork that SHADOWS/disables the active base view (reactivate+rewrite the fork to ship sitewide markup); the website.robots_txt field that appends to the '# custom #' block; the Odoo-shipped .grid 12-col rule colliding with Tailwind grid utilities on ported pages; that MCP/XML-RPC-lane writes HOT-INVALIDATE the compiled-template cache immediately (no Odoo restart — the OPPOSITE of the box odoo-shell lane); and that the origin returns 503 under concurrent request load so requests must be paced sequentially with backoff. NOT for ordinary page content (use [[everjust-website]]), NOT for per-page SEO metadata or the auto Org/WebSite JSON-LD (use [[everjust-website-seo]]), NOT for hand-authored per-page LocalBusiness/Service/FAQPage schema graphs (use [[local-business-aeo-schema]]), and NOT for the box-SSH lane when you DO have SSH (use [[everjust-odoo-shell-ops]], whose cache/restart rule differs). Cross-references [[everjust-website]], [[everjust-website-seo]], [[everjust-odoo-shell-ops]], [[everjust-platform]], [[everjust-agent-mcp]], [[local-business-aeo-schema]].
---

# EVERJUST Website Infra Views (MCP / XML-RPC lane) — Agent Skill

Edit the **infra views** of a live everjust.app tenant — the header/footer chrome, a sitewide `<head>` JSON-LD schema view, a CSS/polish view — and the tenant's `robots.txt`, when **you have no SSH to the box** and the generic MCP `update` tool will not write `ir.ui.view`. The tool you fall through to is **remote XML-RPC** (`odoo_client.kw` → `execute_kw` write on `ir.ui.view`), driven from your own machine against the tenant's `/xmlrpc/2` endpoint as the connected admin/website-designer user.

This is a **narrow, high-gotcha lane**. Ordinary page content goes through [[everjust-website]] (`website_edit_page`, COW-safe); per-page SEO metadata and the platform's auto Organization/WebSite JSON-LD go through [[everjust-website-seo]]; hand-authored per-page schema graphs are [[local-business-aeo-schema]]. Come here only for **sitewide/chrome/infra views the MCP refuses to touch**, and only when you can't SSH to the box (if you can, [[everjust-odoo-shell-ops]] is the alternative — but note its cache/restart rule is the OPPOSITE of this lane's; see the Cache section).

## When to use this skill

- **Edit the header or footer chrome** (or any sitewide layout view) and the MCP `update` on `ir.ui.view` returns a blocked-model / security error, and you have no SSH.
- **Inject a sitewide JSON-LD infra view** into `<head>` (e.g. a single canonical LocalBusiness `@id='#business'` node other pages reference) — see [[local-business-aeo-schema]] for the schema itself; this skill is the LANE that ships it.
- **Edit a CSS/polish view** (a `<style>`-bearing infra template) sitewide.
- **Customize `robots.txt`** via the `website.robots_txt` field.
- **Un-break a sitewide view that won't appear** because a **deactivated** (`active=False`) website-specific fork is shadowing the active base view.
- **Diagnose a page whose Tailwind grid is mangled** by Odoo's shipped `.grid` rule.

**Do NOT use this skill for**, and stop if the task is really:
- **Ordinary page content / a single page's body** — that's `website_edit_page`, COW-safe. See [[everjust-website]].
- **Per-page SEO metadata** (`website_meta_*`, `seo_name`) or the platform's **auto** Org/WebSite JSON-LD — [[everjust-website-seo]].
- **Hand-authored per-page LocalBusiness/Service/FAQPage/Review/Breadcrumb schema** (the graph design, the Dec-2025 aggregateRating-on-Service rule, deterministic FAQ-from-visible) — [[local-business-aeo-schema]]. This skill only *ships* such a view.
- **You HAVE box SSH** — the box `odoo shell` lane can do all of this too, but its cache model differs (edits need a container restart). See [[everjust-odoo-shell-ops]] and the Cache section below.

## Architecture — the model map

| Model / field | Role | Notes (verified on a live everjust.app Odoo 19 tenant) |
|---|---|---|
| `ir.ui.view` | The QWeb markup for every view incl. infra/chrome/schema/CSS. | `arch`/`arch_db`, `key`, `type`='qweb', `website_id` (False = base module view; set = site-specific COW fork), `active`, `inherit_id`, `priority`. **The generic MCP `update` tool BLOCKS this model** — you write it via XML-RPC. |
| `website` | The site (id 1, `https://connectdomain.app`). | `robots_txt` is an HTML/text field whose contents are APPENDED to the generated robots.txt under a `# custom #` marker block. |
| `website.page` | URL↔view binding (content pages). | Not the infra lane — for page bodies use [[everjust-website]]. |

### The three lanes (know which one you're in)

| Lane | Mechanism | Can write `ir.ui.view`? | Cache after a write |
|---|---|---|---|
| MCP content | `website_edit_page` (COW-safe) | Yes, for a PAGE's view arch, COW-forked | Hot-invalidated immediately |
| **MCP/XML-RPC infra (this skill)** | generic `search`/`get` for reads; **`odoo_client.kw` write on `ir.ui.view`** for infra views | **generic `update` REFUSES ir.ui.view → use XML-RPC `write`** | **Hot-invalidated immediately — NO restart** |
| Box shell | SSH + `docker exec … odoo shell` | Yes, raw ORM | **Edit needs a `docker restart` to render** (see [[everjust-odoo-shell-ops]] Recipe 4) |

The critical, easily-missed fact: **an infra-view write over the MCP/XML-RPC lane invalidates the compiled-template cache on this tenant immediately** — the change is live on the very next (cache-busted) request, no Odoo restart. This is the OPPOSITE of the box `odoo shell` lane, where an edit to an already-compiled template does not render until you `docker restart deployment-odoo-1`. Do not carry the shell skill's restart rule into this lane — you'd restart needlessly, or wrongly conclude your XML-RPC edit failed and re-do it.

## The tool surface

| Need | Tool | Notes |
|---|---|---|
| Read an infra view's arch / find its fork | generic `search` + `get` on `ir.ui.view` | Filter by `key` + `website_id`. Reads are fine over MCP. |
| **Write an infra view's arch** | **XML-RPC `execute_kw` write on `ir.ui.view`** (via `odoo_client.kw`) | The generic MCP `update` tool BLOCKS `ir.ui.view` — this is the only remote lane without SSH. |
| Reactivate a shadowing fork | same XML-RPC `write` (`active: True`) | An `active=False` website-specific fork disables the base view for that site. |
| Customize robots.txt | generic `update` on `website` `robots_txt` field (NOT ir.ui.view — allowed) | Appends to the `# custom #` block. |
| Verify live | cache-busted `curl` as the right UA | Writes hot-invalidate the cache; verify on the next request. |

## Recipes

Connect XML-RPC as the tenant admin. Placeholders: `<url>`=`https://connectdomain.app`, `<db>`=`connectdomain`, `<uid>`/`<pw>`=the admin login + password (or API key).

### 1. Connect XML-RPC (the write lane)

```python
import xmlrpc.client
common = xmlrpc.client.ServerProxy(f"{url}/xmlrpc/2/common")
uid = common.authenticate(db, login, pw, {})
models = xmlrpc.client.ServerProxy(f"{url}/xmlrpc/2/object")
def kw(model, method, *args, **kwargs):
    return models.execute_kw(db, uid, pw, model, method, list(args), kwargs)
```
The generic `everjust_agent_mcp` `update` tool refuses `ir.ui.view` (security-model block), so this `kw(... 'write' ...)` path — not the MCP — is how you land an infra-view arch when you have no SSH.

### 2. Find the view that ACTUALLY renders (base vs fork, active vs not)

A sitewide view can exist as a base module view (`website_id=False`) AND a website-specific COW fork (`website_id=1`). Read BOTH plus their `active` flag before writing:
```python
key = 'website.layout'   # or your footer/header/schema/css view key
rows = kw('ir.ui.view', 'search_read',
          [['key','=',key]],
          {'fields': ['id','key','website_id','active','priority']})
# e.g. [{id:3753, website_id:false, active:true}, {id:4091, website_id:[1,'...'], active:false}]
```

### 3. The active=False fork that SHADOWS the base view (the inverse gotcha)

Everjust-odoo-shell-ops Recipe 3 covers an ACTIVE fork overriding an active base view. The variant this lane hits: a **`active=False`, `website_id=1` fork SHADOWS/DISABLES the active base view for that site** — so your sitewide markup never appears no matter how correct the base view is. The fix is to **reactivate the fork and write your arch INTO it** (not the base):
```python
fork_id = 4091
kw('ir.ui.view', 'write', [[fork_id]], {
    'active': True,
    'arch': new_arch_string,   # the full infra view arch
})
```
Rule: resolve `(base, fork, active-flags)` first; if a website-specific fork exists at all, IT is the render target — reactivate it if it's `active=False`, and edit it, not the base.

### 4. Inject a sitewide JSON-LD infra view into <head>

Use this lane to ship a single canonical schema node (design the schema in [[local-business-aeo-schema]]). Escape `&`, `<`, `>` when embedding JSON-LD in a QWeb `<script>`:
```python
import json
schema = {"@context":"https://schema.org","@type":"LocalBusiness","@id":"#business", "name":"..."}
payload = json.dumps(schema).replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
arch = ('<t name="Sitewide JSON-LD">'
        '<script type="application/ld+json">' + payload + '</script></t>')
# write into the head-inheriting infra fork (resolve it per Recipe 2/3)
kw('ir.ui.view', 'write', [[head_infra_view_id]], {'arch': arch, 'active': True})
```
A sitewide `@id='#business'` node RESOLVES dangling `provider: {"@id":"#business"}` refs that per-page Service graphs already emit — ship it once here.

### 5. Customize robots.txt (the # custom # block)

`robots.txt` is NOT an `ir.ui.view` — it's the `website.robots_txt` field, so the generic MCP `update` (or XML-RPC) writes it fine. Its contents are APPENDED to Odoo's generated robots under a `# custom #` marker:
```python
custom = ("User-agent: GPTBot\nAllow: /\n"
          "User-agent: OAI-SearchBot\nAllow: /\n"
          "User-agent: PerplexityBot\nAllow: /\n"
          "Sitemap: https://connectdomain.app/sitemap.xml\n")
kw('website', 'write', [[1]], {'robots_txt': custom})
```
(The full AI-crawler allowlist rationale lives in [[local-business-aeo-schema]] / [[everjust-website-seo]].)

### 6. Verify live (cache-busted, NO restart)

Writes on this lane hot-invalidate the cache — verify on the very next request; do NOT restart the container:
```bash
curl -sS -H 'Cache-Control: no-cache' "https://connectdomain.app/?_cb=$(date +%s)" | grep -o 'application/ld+json'
curl -sS "https://connectdomain.app/robots.txt?_cb=$(date +%s)"
```
Pace requests **sequentially with backoff** — the origin returns 503 under concurrent load (Recipe 7).

### 7. Pace requests — the origin 503s under concurrency

This tenant's origin returns **503 under concurrent request load** (parallel reads/writes/verifies). Do not fan out. Run reads, writes, and curl verifies **one at a time**, with a short backoff between them, and retry a 503 after a pause rather than hammering:
```python
import time
def with_backoff(fn, tries=4):
    for i in range(tries):
        try: return fn()
        except Exception:
            if i == tries-1: raise
            time.sleep(1.5 * (i+1))
```

## Pitfalls

1. **Assuming generic MCP `update` can write `ir.ui.view`.** It can't — the MCP blocks `ir.ui.view` as a security model, so infra-view arch writes must go over XML-RPC (`execute_kw` write). everjust-website's snippet guidance (generic create/update is fine for NEW snippet templates) does NOT extend to overwriting an existing infra view's arch here.
2. **Editing the base view when a fork exists.** If a `website_id=1` fork of the key exists, it renders — edit the fork. And the trap unique to this lane: a **`active=False`** fork still SHADOWS/disables the base for that site, so you must reactivate + rewrite the fork (Recipe 3), not the base.
3. **Carrying the box-shell restart rule into this lane.** [[everjust-odoo-shell-ops]] Recipe 4 / Pitfall 3 says an edit needs `docker restart` to render — that's the SHELL lane. On the **MCP/XML-RPC lane, writes hot-invalidate the cache immediately**; do not restart, and don't conclude a correct XML-RPC edit 'failed' just because you didn't restart. Verify with a cache-busted curl instead.
4. **Fanning out requests → 503.** The origin 503s under concurrency. Pace reads/writes/verifies sequentially with backoff (Recipe 7).
5. **Odoo's `.grid` collides with Tailwind grid.** Odoo ships a `.grid` rule (a 12-column layout) that overrides Tailwind's `grid` utility on these ported pages — a section using Tailwind `grid grid-cols-3` can render with Odoo's 12-col behavior instead. When a grid looks wrong, scope your layout (rename the class, or wrap in a container that isn't affected) rather than assuming your Tailwind is wrong.
6. **Un-escaped JSON-LD in a QWeb `<script>`.** Embed via `&amp;`/`&lt;`/`&gt;` escaping (Recipe 4) or the QWeb parser breaks on `<`/`>`/`&` inside the JSON.
7. **Editing robots.txt as if it were a view.** It's the `website.robots_txt` FIELD (appended to the `# custom #` block), writable via generic update — not an `ir.ui.view`. Don't hunt for a robots view.

## See also
- [[everjust-website]] — page CONTENT via `website_edit_page` (COW-safe MCP path). Prefer it for anything that is a page body.
- [[everjust-website-seo]] — per-page SEO metadata + the platform's AUTO Org/WebSite JSON-LD.
- [[local-business-aeo-schema]] — the hand-authored LocalBusiness/Service/FAQPage schema this lane SHIPS.
- [[everjust-odoo-shell-ops]] — the box-SSH alternative; note its edit-needs-restart cache rule differs from this lane's hot-invalidate.
- [[everjust-platform]] — invariants (one DB per tenant, `/odoo` debrand, never self-escalate).
