---
name: everjust-odoo-shell-ops
description: Operate an everjust.app (Odoo 19) tenant from the BOX SHELL (SSH + docker), the deploy-pipeline and box-ops layer. Use when the task needs bulk DB writes, DB-only page publishing, clearing the sitemap ir.attachment cache, creating an ir.cron, recovering a CI deploy whose rsync silently did not land, avoiding deploy-collisions across concurrent agents (gh run idle check, scoped git add), restarting Odoo to compile a QWeb edit, or fixing an nginx stale-inode after a config redeploy. Covers the odoo shell invocation, the COW-fork-overrides-generic gotcha, and the Deploy to Production pipeline. The deploy/ops layer around [[everjust-website-customization]] (which owns durable view/CSS/behavior customization from the shell). Prefer the MCP ([[everjust-agent-mcp]], [[everjust-website]]) for ordinary edits; drop to the shell when it cannot. Cross-references [[everjust-platform]], [[github-actions-ec2-deploy]].
---

# EVERJUST Odoo Shell Ops (Agent Skill)

Drive a live everjust.app tenant (Odoo 19 CE fork, one Postgres DB per tenant) from the **box shell**: SSH to the tenant's EC2 instance, then `docker exec` into the `deployment-odoo-1` container. This is the **infra and fallback lane**, the things the `everjust_agent_mcp` MCP deliberately cannot do: bulk ORM writes, editing infra and layout views (header/footer), clearing the QWeb and attachment caches, creating `ir.cron` records DB-only, and landing addon **file** changes. The MCP path is preferred for ordinary content and SEO (see the boundary below); reach for the shell only when you have SSH and need raw ORM or file and deploy control.

This skill is about **mechanics on the box**, not the platform rules. The invariants (one DB per tenant, `/odoo` debrand, never self-escalate, `group_ids` not `groups_id`, custom `everjust.mail.*` stack, re-sweep on `-u`) live in [[everjust-platform]] and still apply here. A shell does not exempt you from them. On the `connectdomain` tenant the site is `website` **id 1**, domain `https://connectdomain.app`, container `deployment-odoo-1`, DB `connectdomain`.

## When to use this skill

- **Run a bulk or scripted DB write** the MCP can't express in one call, e.g. rewrite every published page's `website_meta_*`, backfill hundreds of rows, run an ORM migration. Pipe a Python script into `odoo shell`.
- **Edit an infra or layout view**: header, footer, `website.layout` xpaths, `custom_code_head`. These are structural QWeb the MCP does not surface as content.
- **Publish a page DB-only**: create the `ir.ui.view` plus `website.page` pair directly (no git, no deploy) when you want it live on the next request.
- **Fix a header or footer that "won't change"**: a `website_id=1` copy-on-write fork is overriding the generic view; you must find and edit the fork (see Recipe 3).
- **Clear a cache the ORM won't clear on its own**: the compiled QWeb template cache (needs a container restart) or the `/sitemap.xml` `ir.attachment` (needs an unlink).
- **Create an `ir.cron`** DB-only for a pure-ORM recurring job (Odoo 19 shape; no `numbercall`; `safe_eval` code only).
- **Deploy an addon FILE change** and, especially, **recover a green-but-stale CI deploy** where the rsync silently didn't land the file.
- **Fix an nginx config** on the box (config replaced by CI but the running container is pinned to the stale inode).

**Do NOT use this skill for**, and stop if the task is really:
- **Ordinary content or SEO writes the MCP handles cleanly**: set a page's copy, publish/menu/redirect, or per-page SEO metadata. Use [[everjust-website]] and [[everjust-website-seo]] through [[everjust-agent-mcp]]. The MCP is COW-safe, audited, and role-bounded; the shell is not. Only drop to it when the MCP genuinely can't.
- **The platform rules or model shape**: what `everjust.mail.*` is, send gating, secret namespaces, ACL boundaries. That's [[everjust-platform]]; read it first.
- **The full GEO and AI-discoverability content program**: llms.txt, JSON-LD, IndexNow, the sitemap content strategy. That's [[everjust-website-seo]]; this skill only covers the shell-level cache mechanics those depend on.
- **Authoring the CI pipeline itself** (the workflow YAML, secrets, health checks). That's [[github-actions-ec2-deploy]]; here we only *use* and *recover* the existing "Deploy to Production" run.

---

## The box map (real, non-secret facts)

| Thing | Value on connectdomain | Notes |
|---|---|---|
| Odoo container | `deployment-odoo-1` | `docker exec -i` into it to run `odoo shell`; `docker restart` it to flush the compiled-QWeb cache. |
| Nginx container | `deployment-nginx-1` | Reverse proxy; config bind-mounted from the box. |
| Compose dir on box | `/opt/everjust/platform/deployment` | `docker compose` runs from here; nginx configs under `nginx/*.conf`. |
| Shared git checkout | `/opt/everjust/platform` | Multiple agents share it, scope `git add`, prefer a worktree (Pitfall 5). |
| Odoo conf | `/etc/odoo/odoo.conf` (in container) | Present, but **does not carry working DB creds on this box**, pass `--db_*` inline (Recipe 1). |
| Tenant DB | `connectdomain` | One DB per tenant; `db_host=db` (the compose Postgres service). |
| Website | `website` id **1**, `https://connectdomain.app` | One `website` per tenant. |
| Deploy workflow | GitHub Actions **"Deploy to Production"**, concurrency group `deploy-production` | Push to `master` triggers it; `cancel-in-progress:false` so runs queue, not cancel. |

Model and record types you touch from the shell: `ir.ui.view` (QWeb templates, incl. COW forks), `website.page` (URL-to-view binding plus publish/index), `ir.attachment` (the cached `/sitemap.xml`), `ir.cron` (scheduled ORM jobs), `ir.config_parameter`, `ir.model` (to resolve `model_id` for a cron).

---

## Recipes

Placeholders: `<box-ip>` (tenant EC2 IP), `~/.ssh/<deploy-key>.pem` (SSH key), `<db-user>` (Postgres role), `$ODOO_DB_PW` (export the DB password in your local env, never inline the literal). Everything runs as `ubuntu@<box-ip>`.

### 1. Open an Odoo shell and WRITE (the commit is on you)

Pipe a local Python file straight into `odoo shell` inside the container. **Conf-only does not connect on this box**, you must pass `--db_host` / `--db_user` / `--db_password` inline even though you also pass `-c`:

```bash
cat script.py | ssh -i ~/.ssh/<deploy-key>.pem ubuntu@<box-ip> \
  'docker exec -i deployment-odoo-1 odoo shell -d connectdomain --no-http \
     -c /etc/odoo/odoo.conf \
     --db_host=db --db_user=<db-user> --db_password="$ODOO_DB_PW"'
```

Inside the shell you get `env` (an Odoo `Environment`). **The shell does NOT auto-commit**, nothing you write persists until you call `env.cr.commit()`:

```python
# script.py, piped into odoo shell
pages = env['website.page'].search([('website_published', '=', True)])
for p in pages:
    if not p.website_meta_title:
        p.website_meta_title = f"{p.name} | Connect Domain"
env.cr.commit()          # REQUIRED, or the whole write is silently rolled back
print("updated", len(pages))
```

For **large arch or multi-line scripts**, transfer as base64 to dodge shell-quoting hell (nested single and double quotes across `ssh` to `docker exec` to Python will otherwise mangle your `<`, `>`, `"`, `$`):

```bash
# encode locally
B64=$(base64 -i big_arch_script.py)
# decode and run on the box (single-quoted heredoc keeps it intact through both hops)
ssh -i ~/.ssh/<deploy-key>.pem ubuntu@<box-ip> \
  "echo $B64 | base64 -d | docker exec -i deployment-odoo-1 odoo shell -d connectdomain \
     --no-http -c /etc/odoo/odoo.conf --db_host=db --db_user=<db-user> --db_password=\"\$ODOO_DB_PW\""
```

Inside a script, when you build an `arch` string that contains quotes or newlines, base64 the arch itself and `base64.b64decode(...).decode()` it in Python rather than embedding the raw XML in the command line.

### 2. Publish a page DB-only (view plus page, live on next request)

Create the QWeb view, then the `website.page` that binds a URL to it. A **brand-new** view or page compiles and renders on the next HTTP request, no restart needed:

```python
view = env['ir.ui.view'].create({
    'name': 'Pricing Page',
    'type': 'qweb',
    'key': 'website_cd_pricing.pricing',        # website_<addon>.<key>
    'website_id': 1,                            # scope to this site (see Pitfall 2 / COW)
    'arch': '<t name="Pricing" t-name="website_cd_pricing.pricing">'
            '<t t-call="website.layout"><div id="wrap" class="oe_structure">'
            '<section class="s_text_block"><h1>Pricing</h1></section>'
            '</div></t></t>',
})
env['website.page'].create({
    'url': '/pricing',
    'view_id': view.id,
    'website_id': 1,
    'website_published': True,
    'is_published': True,
    'website_meta_title': 'Pricing | Connect Domain',
    'website_meta_description': 'Bring-your-own-domain onboarding. Automatic DNS, SSL and edge.',
})
env.cr.commit()
```

Fetch `https://connectdomain.app/pricing` to confirm. **New render is immediate; EDITS are not**, see Recipe 4.

### 3. Fix a header or footer that "won't change", the COW-fork gotcha

A view can exist **twice under the same `key`**: a generic one (`website_id = False`) AND a website-specific **copy-on-write fork** (`website_id = 1`). The fork **overrides** the generic and is what actually renders. **Editing the generic view changes nothing on the live site.** Before editing ANY layout view, search for the `website_id=1` fork of that key and edit THAT:

```python
key = 'website_cd_footer.cd_footer'
generic = env['ir.ui.view'].search([('key','=',key),('website_id','=',False)])
fork    = env['ir.ui.view'].search([('key','=',key),('website_id','=',1)])
print('generic', generic.ids, 'fork', fork.ids)
target = fork or generic          # the fork wins if it exists, edit the fork
target.write({'arch': '<the new arch>'})
env.cr.commit()
```

Real case on connectdomain: the footer existed as generic view **3753** AND COW fork view **4091**; the live footer only changed once **4091** was edited. Hours were lost editing 3753 and seeing no change. Always resolve the fork first.

### 4. Make an EDIT actually render, restart the container

A brand-new view renders on next request, but an **edit to an already-compiled template does NOT render** until the compiled-QWeb cache is dropped. Cache-clear calls and registry signals are **unreliable** here; the reliable fix is a container restart:

```bash
ssh -i ~/.ssh/<deploy-key>.pem ubuntu@<box-ip> 'docker restart deployment-odoo-1'
```

Rule of thumb: **created a view, fetch it; edited a view's arch, restart, then fetch.** If you edited and the page looks unchanged, restart before you debug anything else.

### 5. Clear the /sitemap.xml cache (it's a cached ir.attachment)

`/sitemap.xml` is served from a cached `ir.attachment` (its `url` matches `sitemap`, TTL about 12h). Pages you just created do NOT appear in it until that attachment is cleared:

```python
env['ir.attachment'].search([('url','ilike','sitemap')]).unlink()
env.cr.commit()
# then re-fetch https://connectdomain.app/sitemap.xml to regenerate it
```

If new pages keep needing this, schedule it as an `ir.cron` (Recipe 6). The full sitemap and GEO content strategy is [[everjust-website-seo]]; this is just the cache-eviction mechanic it relies on.

### 6. Create an ir.cron DB-only (Odoo 19 shape)

Resolve `model_id` via `ir.model._get(...)`. The `code` runs under `safe_eval`: **no imports, no outbound HTTP**, keep it to pure ORM:

```python
cron = env['ir.cron'].create({
    'name': 'Clear sitemap cache',
    'model_id': env['ir.model']._get('ir.attachment').id,
    'state': 'code',
    'code': "env['ir.attachment'].search([('url','ilike','sitemap')]).unlink()",
    'interval_number': 12,
    'interval_type': 'hours',
    'active': True,
    'nextcall': fields.Datetime.now(),
    # NOTE: do NOT set 'numbercall', the field was removed in Odoo 19.
})
env.cr.commit()
```

Odoo 19: `ir.cron` **no longer has `numbercall`**, setting it raises. Because `code` is `safe_eval` (no `import`, no network), an **outbound-HTTP job (e.g. an IndexNow POST) cannot live in an `ir.cron`**, put that in a **system cron on the box** (a shell script plus `crontab`) instead, not here.

### 7. Deploy an addon FILE change, and recover a green-but-stale CI run

Normal path: push to `master`, GitHub Actions **"Deploy to Production"** ([[github-actions-ec2-deploy]]) rsyncs to the box and runs a scoped module upgrade. **GOTCHA: the CI rsync sometimes silently does not land the file**, the run is green and the module "loads," but the on-box file is still the old one. **ALWAYS verify the actual on-box file after an addon deploy:**

```bash
ssh -i ~/.ssh/<deploy-key>.pem ubuntu@<box-ip> \
  'docker exec deployment-odoo-1 grep -n "MY_MARKER" /path/to/addon/views/foo.xml || echo STALE'
```

Manual recovery (rsync the addon up, scoped upgrade, restart to flush QWeb):

```bash
# 1) push the addon dir to the box (sudo on the far side so it can write into /opt/everjust)
rsync -az --rsync-path="sudo rsync" -e "ssh -i ~/.ssh/<deploy-key>.pem" \
  ./addons/website_cd_footer/ \
  ubuntu@<box-ip>:/opt/everjust/platform/addons/website_cd_footer/

# 2) scoped upgrade of just that module, no other services
ssh -i ~/.ssh/<deploy-key>.pem ubuntu@<box-ip> '
  cd /opt/everjust/platform/deployment &&
  sudo docker compose run --rm --no-deps odoo \
    odoo -d connectdomain -u website_cd_footer --stop-after-init --no-http'

# 3) restart the live container so the compiled cache picks up the new arch
ssh -i ~/.ssh/<deploy-key>.pem ubuntu@<box-ip> 'docker restart deployment-odoo-1'
```

Then re-`grep` the on-box file (step above) to confirm the change actually landed before you call it done.

### 8. Avoid a deploy collision (multiple agents share this box)

Concurrent "Deploy to Production" runs **race and can revert each other's changes and reset module state.** BEFORE any DB or nginx mutation, check for an in-flight deploy and wait for idle:

```bash
gh run list --workflow "Deploy to Production" --limit 5
# proceed only when none are status=in_progress or status=queued
```

On the **shared** `/opt/everjust/platform` checkout, **scope `git add` to specific files**, never `git add -A` or `git add <dir>` (you will stage other sessions' uncommitted work). Prefer an isolated worktree off `origin/master`:

```bash
git -C /opt/everjust/platform fetch origin
git -C /opt/everjust/platform worktree add /tmp/wt-$$ origin/master
# work in /tmp/wt-$$, add only your files, then remove the worktree when done
```

### 9. Reload nginx after a config change (restart, don't just reload)

Nginx configs live at `/opt/everjust/platform/deployment/nginx/*.conf`, bind-mounted into `deployment-nginx-1`. **GOTCHA:** after a CI deploy replaces the config file (new inode), the running container stays **pinned to the stale inode**, an `nginx -s reload` reads the old file. Test then **restart**:

```bash
ssh -i ~/.ssh/<deploy-key>.pem ubuntu@<box-ip> '
  docker exec deployment-nginx-1 nginx -t &&
  docker restart deployment-nginx-1'
```

`nginx -t` first so you never restart into a broken config.

---

## Pitfalls

1. **Forgetting `env.cr.commit()`.** The `odoo shell` does NOT auto-commit. Your writes look applied inside the script (you can even read them back), then vanish when the shell exits, the transaction rolls back. Every mutating shell script must end with `env.cr.commit()`. This is the single most common shell-ops mistake.

2. **Editing the generic view instead of the COW fork.** A layout view often exists twice: generic (`website_id=False`) and a copy-on-write fork (`website_id=1`) that OVERRIDES it and is what renders. Editing the generic one changes nothing live (the footer 3753-vs-4091 case cost real hours). Before editing any header, footer, or layout view, search both and edit the `website_id=1` fork if it exists (Recipe 3).

3. **Expecting an EDIT to render without a restart.** A brand-new view renders on the next request; an edit to an already-compiled template does NOT until the compiled-QWeb cache is dropped, and cache-clear or signals are unreliable here. Fix: `docker restart deployment-odoo-1`, then re-fetch (Recipe 4).

4. **Trusting a green CI deploy without verifying the box file.** The "Deploy to Production" rsync sometimes silently doesn't land the file, the run is green, the module "loads," and the box file is still stale. Always `docker exec ... grep` the on-box file for your change before declaring the deploy done (Recipe 7).

5. **Running a DB or nginx op during a concurrent deploy.** Multiple agents share this box; concurrent "Deploy to Production" runs race, revert each other's changes, and reset module state. Check `gh run list` for `in_progress` or `queued` first and wait for idle. On the shared checkout, never `git add -A` or `git add <dir>` (you'll stage other sessions' work), scope to your files or use a `git worktree` (Recipe 8).

6. **Setting `numbercall` on an Odoo 19 `ir.cron`.** The field was removed in Odoo 19; including it in `create({...})` raises. Omit it. Use `interval_number` / `interval_type` / `nextcall` / `active` only (Recipe 6).

7. **Trying outbound HTTP (or any import) from an `ir.cron` code block.** Cron `code` runs under `safe_eval`, no `import`, no network. An IndexNow POST or any HTTP call cannot run there; it silently isn't allowed. Put outbound-HTTP jobs in a **system cron on the box** (shell script plus `crontab`), and keep `ir.cron` code to pure ORM.

8. **Conf-only invocation that never connects.** On this box, `odoo shell -c /etc/odoo/odoo.conf` alone does not reach Postgres, you must pass `--db_host=db --db_user=<db-user> --db_password="$ODOO_DB_PW"` inline as well (Recipe 1). If the shell hangs or errors on connect, this is almost always why.

9. **Quoting hell across ssh to docker exec to Python.** Nested quotes and `<`, `>`, `$` in an inline arch get mangled across the hops. Transfer scripts or arch as base64 and decode on the far side or in Python (Recipe 1). Don't try to escape a multi-line XML arch by hand on the command line.

10. **`nginx -s reload` after a CI config swap.** The running `deployment-nginx-1` is pinned to the replaced file's old inode; a reload reads stale config. `nginx -t` then `docker restart deployment-nginx-1` (Recipe 9).

11. **Dropping to the shell for something the MCP does cleanly.** The shell is unaudited, not COW-safe by default, and easy to get wrong (see every pitfall above). For page content, publish/menu/redirect, and per-page SEO, prefer [[everjust-agent-mcp]] via [[everjust-website]] / [[everjust-website-seo]]. Use the shell only for what the MCP truly can't do: bulk writes, infra and layout views, cache eviction, cron creation, and addon file deploys.

12. **Editing a branded or swept record by hand and expecting it to stick.** Some `mail.template` bodies and branded views are re-swept on the next module `-u` ([[everjust-platform]] invariant). A live shell edit to a swept record is not durable, put the change in the module data and deploy it (Recipe 7), don't fight the sweep.

## See also

- [[everjust-agent-mcp]]: the PREFERRED path: the `search`/`get`/`create`/`update`/`call` plus `website_*` MCP tool surface, confirm gates, role-bounding. Use this first; drop to the shell only when it can't.
- [[everjust-platform]]: the invariants that still bind you on the shell: one-DB-per-tenant, `/odoo` debrand, `group_ids` not `groups_id`, `everjust.mail.*`, re-sweep on `-u`, never self-escalate.
- [[everjust-website]]: page CONTENT and layout via the MCP (Tailwind-QWeb arch, COW, publish/menu/redirect). Same COW concept as Recipe 3, done the COW-safe MCP way.
- [[everjust-website-seo]]: per-page SEO metadata, sitemap membership, social and JSON-LD, IndexNow, plus the GEO and AI-discoverability content program (llms.txt), all via the MCP. Prefer it over shell-writing `website_meta_*`, and it owns the sitemap-cache strategy behind Recipe 5.
- [[everjust-website-snippets]]: the on-brand `s_cd_*` content snippets used inside page arch; reach for these before hand-writing raw QWeb sections in Recipe 2.
- [[github-actions-ec2-deploy]]: the "Deploy to Production" pipeline this skill uses and recovers; go there to author or debug the workflow itself.
- [[everjust-website-geo-content]]: what to BUILD with the shell publishing recipes here, GEO content clusters and per-page schema, and the sitemap-freshness cron this skill installs.
- [[everjust-website-customization]] — durable view/CSS/behavior customization FROM the shell (COW inherit views, website.custom_code_head and its Markup trap, base_automation). THIS skill is the DEPLOY-PIPELINE and BOX-OPS layer around it: the CI deploy plus manual-rsync recovery, deploy-collision avoidance, the nginx stale-inode restart, ir.cron creation, the sitemap cache. Use that for WHAT to change in a view, this for HOW to deploy and operate safely.
