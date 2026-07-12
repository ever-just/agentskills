---
name: everjust-website-customization
description: Deeply and durably customize an EverJust.app (Odoo) tenant website from the odoo shell — the layer below the MCP website_* tools. Use when a change needs QWeb view edits, site-wide CSS/JS, new server-side behavior, or model/config writes that the everjust MCP and website builder cannot do (editing views, server actions, custom_code_head, base automations). Covers COW inherit views (website_id=1) that survive addon redeploys, the website.custom_code_head Markup-escaping trap, base_automation for behavior, the "view edits need docker restart to render" rule, and the durable-vs-reverts-on-upgrade matrix. Use when the user says "edit the Odoo view/template", "inject CSS/JS site-wide", "add a server action / automation", "the change keeps getting reverted on deploy", or "customize the everjust/connectdomain website beyond the MCP tools".
---

# EverJust Website Customization (Odoo, durable, shell-level)

Customize an EverJust.app tenant (an Odoo instance) at a level the MCP tools and
website builder do not reach: **QWeb views, site-wide CSS/JS, server-side
behavior, and model data** — done so it **survives addon redeploys** and does
**not** conflict with other agents editing the addon's git checkout.

The everjust MCP surface ([[everjust-agent-mcp]], [[everjust-website]]) is ORM
data operations bounded by a user's role; it explicitly punts on "editing views,
server actions... escalate to a human with UI access." **This skill is that
escalation, done from the odoo shell** instead of the UI.

## When to use

- A change requires editing a **QWeb view / template** (layout, markup, xpath).
- You need **site-wide CSS or JS** on a tenant (`website.custom_code_head`).
- You need **server-side behavior** on a record event (create/confirm) — a
  server action / automation.
- A previous edit **keeps getting reverted** when the addon is redeployed or
  upgraded (`-u`), and you need a durable override.
- Multiple agents/sessions are churning the tenant's addon git checkout and you
  must change the live site **without touching those files**.

## When NOT to use

- Plain content/record edits (leads, posts, events, config) → use the MCP
  ([[everjust-agent-mcp]]) or the everjust-website family.
- Installing/upgrading addons, or edits that genuinely need the web Studio UI.
- Any change you cannot **render-verify** afterward — always verify with
  [[cdp-render-verification]] before declaring done.

---

## Access: the odoo shell (critical mechanics)

Reach the shell by SSH to the tenant's box, then exec into the Odoo container:

```bash
# password comes from the RUNNING server's compose command line, NOT /etc/odoo/odoo.conf
PW=$(sudo grep -rhoE "POSTGRES_PASSWORD=[A-Za-z0-9]+" <deployment-dir> | grep -v "=odoo$" | head -1 | cut -d= -f2)
cat script.py | sudo docker exec -i <odoo-container> odoo shell -d <db> \
  --db_host=db --db_user=<user> --db_password="$PW" --no-http
```

- The shell runs **inside the container** — host `/tmp` != container `/tmp`.
  To hand files in (video, images, b64), `docker cp` them into the container
  first, then read from the container path.
- Scripts are piped on stdin; end with `env.cr.commit()` (the shell does **not**
  auto-commit; an exception before commit rolls everything back).
- `website.browse(1)` is typically the tenant's primary website. Confirm the id.

Store the box address / SSH key / DB name in the caller's own notes — never in a
committed skill file.

---

## 1. COW inherit views — durable template/CSS overrides

Module-owned views (`website_id=False`) revert on `-u`. Create a **website-specific
inherit view** (`website_id=1`) instead: it applies on top for that website and
is **not** owned by the module, so it survives upgrades and addon redeploys.

```python
V = env['ir.ui.view']
key = 'website_<tenant>.my_override'
old = V.search([('key','=',key)])           # idempotent: unlink + recreate
if old: old.unlink()
V.create({
    'name': 'My Override', 'type': 'qweb',
    'inherit_id': <base_view_id>, 'mode': 'extension',
    'website_id': 1, 'key': key, 'active': True,
    'arch': """<data>
      <xpath expr="//div[hasclass('target-class')]" position="replace"> ... </xpath>
      <xpath expr="//ul[hasclass('list')]" position="after"> ... </xpath>
    </data>""",
})
```

- Target robustly: `hasclass('x')`, `contains(text(),'...')`, `contains(normalize-space(.),'...')`,
  or `//a[@href='/x' and hasclass('btn')]`. Position: `replace` / `after` / `before` / `inside`.
- A bad xpath makes the page **500** at render, so verify immediately (§Verify).
- If a base view already has a `website_id=1` COW copy (same `key`), edit **that**
  copy's `arch` directly — an inherit that targets the generic key may not reach it.

## 2. website.custom_code_head — site-wide CSS/JS (+ the Markup trap)

`website.custom_code_head` injects raw HTML into every page's `<head>`. It is the
best home for CSS and for JS that contains `<` / `&&` (which would break XML view
arch). **The trap:** the field returns a `Markup`; `Markup + str` **HTML-escapes**
the appended string, so your `<style>`/`<script>` renders as *visible escaped
text* on the page.

```python
W = env['website'].browse(1)
h = str(W.custom_code_head or '')             # <-- str() FIRST, then concat plain str
if 'my-block' not in h:                        # id-guard = idempotent
    W.write({'custom_code_head': h + '<style id="my-block">...</style>'})
```

- Guard JS to the right page: `if (location.pathname.startsWith('/x')) { ... }`,
  wrap in `DOMContentLoaded`, and null-check every element (head JS runs before body).
- CSS/JS here is **live immediately** (no restart). It degrades gracefully — if a
  selector changes, it no-ops rather than 500-ing (unlike a view xpath).

## 3. base_automation — durable server-side behavior

For behavior on a record event (e.g., generate a link when a booking's calendar
event is created), use a `base.automation`. It is DB-owned, so it survives addon
redeploys — unlike editing the addon's Python.

```python
# install the module once if absent:
m = env['ir.module.module'].search([('name','=','base_automation')])
if m.state != 'installed': m.button_immediate_install()

auto = env['base.automation'].create({'name':'X','model_id':<model_id>,'trigger':'on_create','active':True})
env['ir.actions.server'].create({
    'name':'X code','model_id':<model_id>,'base_automation_id':auto.id,
    'usage':'base_automation','state':'code',
    'code': "try:\n    ...do work on `records`...\nexcept Exception:\n    pass",  # NEVER let it raise
})
```

- Link is via `base.automation.action_server_ids` (One2many) / `ir.actions.server.base_automation_id`
  + `usage='base_automation'` (this build has no delegated `state`/`code` on `base.automation`).
- **Always** wrap the code body in `try/except` — a raise here breaks the
  triggering ORM write (and thus the user flow).
- Fires on **every** write to that model DB-wide; filter fast in code and swallow errors.

## 4. When view edits need a restart

DB **data** and `custom_code_head` changes render immediately. **`ir.ui.view`
arch changes often do not** — the workers cache the compiled template and
`clear_cache()` / registry signals do not reliably bust it. After editing/creating
a view, `docker restart <odoo-container>` and wait for the site to return 200.

## Durability matrix (what survives `-u` / addon redeploy)

| Change | Durable? |
|---|---|
| Shell-created records with **no** `xml_id` (e.g. an appointment type you created) | ✅ |
| COW inherit view (`website_id=1`) | ✅ |
| `website.custom_code_head` CSS/JS | ✅ |
| `base.automation` + its server action | ✅ |
| **Module-owned** view / `mail.template` / record (has an `xml_id`) | ❌ reverts on `-u` — re-apply, or fork via COW |

Check ownership: `env['ir.model.data'].search([('model','=','<m>'),('res_id','=',<id>)])`
→ if it returns an `xml_id`, the record is module-owned and your edits revert.

## Verify (mandatory)

Never ship a visual/behavioral change unverified — a bad xpath 500s the page and
a Markup slip prints code to users. Render-verify with [[cdp-render-verification]]:
check the page returns 200, the intended pixels/computed styles changed, no raw
`<style`/`<script`/`&lt;` leaked into `body.innerText`, and no mobile overflow.

## Related

- [[everjust-agent-mcp]] — the MCP data layer this skill sits below.
- [[everjust-website]] / [[everjust-appointments]] — higher-level operating skills.
- [[cdp-render-verification]] — prove the change before declaring done.
