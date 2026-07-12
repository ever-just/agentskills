---
name: everjust-tenant-domain-migration
description: Migrate a live everjust.app Odoo 19 tenant from one public domain to another (a rebrand / domain cutover) and purge the old brand from every user-facing surface. Use when the task is to move a tenant onto a new domain, rebrand a customer's site+mail, audit a "finished" rebrand, or when a user says "move everything to <new-domain>" / "I don't want to see <old-domain> anywhere" / emails and pages still show the old domain. Covers mail identity, the link + canonical bases (web.base.url / website.domain), user signatures, a DB-wide old-domain sweep, and the nginx add-new + 301-retire-old-domain step. This is a cross-cutting cutover, NOT single-page editing ([[everjust-website]]) nor SEO-field backfill ([[everjust-website-seo]]) nor sending one email ([[everjust-mail-ops]]). The internal *.everjust.app machine host STAYS (dbfilter Host-rewrite, the /mcp endpoint, the mail webhook) — do not repoint it. Cross-references [[everjust-platform]] and [[github-actions-ec2-deploy]].
---

# everjust.app tenant domain migration — cut a tenant over to a new public domain

Move a live everjust.app Odoo 19 tenant from an OLD public domain to a NEW one and scrub the old brand from every user-facing surface. A rebrand is not one edit: a single tenant's public identity is spread across ~9 places, and missing one means the old domain keeps surfacing in emails or on the site. This skill is the checklist, the exact ORM/SQL/nginx moves, and the one boundary you must not cross.

Assumes the [[everjust-platform]] shape (multi-tenant Odoo 19 CE fork, one Postgres DB per tenant, on a shared EC2 box behind nginx). Read [[everjust-platform]] first.

## When to use this skill

- **"Move everything to `<new-domain>`" / "I don't want to see `<old-domain>` anywhere"** — a rebrand where the tenant already runs on the new domain but the old one still leaks into emails and links, and the old domain may still serve the site.
- **Cut a tenant over to a newly registered domain** — mail + web + nginx together, not piecemeal.
- **Audit a "finished" rebrand** — prove nothing old-domain remains (the DB-wide sweep in recipe 3).
- Do NOT use for: editing one page's copy ([[everjust-website]]); backfilling SEO meta fields ([[everjust-website-seo]]); sending or triaging one mailbox ([[everjust-mail-ops]]); a customer connecting their OWN domain to a product (that is the Connect Domain product, unrelated).

## Architecture — the surfaces a domain lives in (map before you touch)

Every one of these must move, or the old brand resurfaces:

| Surface | Where | If missed |
|---|---|---|
| Alias domain | `mail.alias.domain.name` | inbound/outbound address domain |
| Outbound sender | `ir.mail_server` (SES) `from_filter` + `smtp_user` | mail sent from / rejected on old domain |
| Catchall / bounce / default-from | `mail.alias.domain.{catchall_alias,bounce_alias,default_from}` + `ir.config_parameter` `mail.default.from`, `mail.catchall.domain` | notification `From:` shows old domain |
| Link base | `ir.config_parameter` `web.base.url` (+ `web.base.url.freeze`) | every link INSIDE emails points at old host |
| SEO / canonical base | `website.domain` | sitemap / canonical / og:url emit old domain |
| User signatures | `res.users.signature` (HTML) | the thing a human actually SEES in their own mail |
| Page content + meta | `ir.ui.view.arch_db`, `website_meta_*`, blog / event content | old brand text + links on the site |
| Calendar video links | `calendar_event.videocall_location` | old host in existing meeting invites |
| Public nginx blocks | `deployment/nginx/everjust.conf` (repo `ww.everjust.app`) | the OLD domain literally still serves the site |

### The boundary you must NOT cross
The tenant's canonical **`*.everjust.app` machine host** (e.g. `connectdomain.everjust.app`) is internal plumbing, not a brand surface: nginx rewrites the public `Host:` to it so the Odoo `dbfilter ^%d$` resolves the DB, and it carries the `/mcp` endpoint ([[everjust-agent-mcp]]) and the everjust_mail `/everjust_mail/inbound` webhook. **Never redirect or repoint the `*.everjust.app` host.** Once `web.base.url` / `website.domain` / signatures / emails all point at the new domain, the machine host is invisible to users — those brand surfaces are independent of the internal Host-rewrite.

## Recipes

### 0. Get a shell on the tenant DB
The `everjust_agent_mcp` MCP covers most reads/writes, but a domain sweep needs raw SQL + `odoo shell`. Direct box access ([[everjust-platform]]):
```bash
# read-only SQL — peer/trust auth INSIDE the db container, no password:
ssh -i ~/.ssh/<key>.pem ubuntu@<box-ip> \
  "sudo docker exec -i deployment-db-1 psql -U everjust -d <db> -c \"SELECT ...\""

# ORM writes — odoo shell needs creds the config omits (entrypoint injects them from env):
ssh ... "PW=\$(sudo docker exec deployment-odoo-1 printenv PASSWORD); \
  echo '<python>' | sudo docker exec -i deployment-odoo-1 odoo shell -c /etc/odoo/odoo.conf \
  -d <db> --db_host=db --db_user=everjust --db_password=\"\$PW\" --no-http"
# odoo shell does NOT auto-commit — end scripts with env.cr.commit()
```

### 1. Cut over the mail identity
```python
d = env['mail.alias.domain'].search([('name', '=', 'OLD')], limit=1)
d.name = 'NEW'                                    # or create a NEW mail.alias.domain + repoint accounts
icp = env['ir.config_parameter'].sudo()
icp.set_param('mail.catchall.domain', 'NEW')
icp.set_param('mail.default.from', 'noreply@NEW')   # legacy fallback; on Odoo 17+ the primary is mail.alias.domain.default_from (on 'd' above) — keep both on NEW
env.cr.commit()
```
Confirm the SES `ir.mail_server` (`smtp_host` `email-smtp.*.amazonaws.com`) has `from_filter=NEW`, and that the SES IAM identity for NEW is verified AND authorized for `SendRawEmail` — a 554 on send means the IAM policy is missing the NEW identity (an AWS fix, not Odoo).

### 2. Move the link + canonical bases
```python
icp = env['ir.config_parameter'].sudo()
icp.set_param('web.base.url', 'https://NEW')
icp.set_param('web.base.url.freeze', 'True')      # else it flips to whatever host an admin logs in from
env['website'].browse(1).domain = 'https://NEW'   # fixes sitemap / canonical / og:url
env.cr.commit()
```

### 3. DB-wide sweep for the old domain (run BEFORE and AFTER)
Cast jsonb (translatable) columns to `::text` or `ILIKE` errors:
```sql
SELECT key, value FROM ir_config_parameter WHERE value ILIKE '%OLD%';
SELECT id, name, email FROM res_company WHERE email ILIKE '%OLD%';
SELECT login FROM res_users WHERE (signature)::text ILIKE '%OLD%' OR login ILIKE '%OLD%';
SELECT id, name FROM mail_template WHERE (body_html)::text ILIKE '%OLD%' OR (subject)::text ILIKE '%OLD%';
SELECT id FROM blog_post   WHERE (name)::text ILIKE '%OLD%' OR (content)::text ILIKE '%OLD%';
SELECT id FROM event_event WHERE (name)::text ILIKE '%OLD%' OR (description)::text ILIKE '%OLD%';
SELECT id, key FROM ir_ui_view WHERE (arch_db)::text ILIKE '%OLD%';
SELECT id, key FROM ir_ui_view WHERE (website_meta_title)::text ILIKE '%OLD%' OR (website_meta_description)::text ILIKE '%OLD%';
SELECT id, videocall_location FROM calendar_event WHERE videocall_location ILIKE '%OLD%';
SELECT count(*) FROM mail_message WHERE (body)::text ILIKE '%OLD%';   -- HISTORICAL: leave it, see pitfalls
```
Also check `digest.digest.name` and `res_company.name` — a digest subject like "OLD BRAND: Your Odoo Periodic Digest" comes from the company name at send time, not a hardcoded string.

### 4. Fix user signatures (the surface humans notice)
Signatures are HTML on `res.users.signature`, commonly holding the old wordmark + link — the #1 "it still says the old brand" a user sees in their own mailbox:
```python
for u in env['res.users'].search(['|', ('signature', 'ilike', 'OLD'), ('signature', 'ilike', 'Old Brand')]):
    s = u.signature or ''
    u.sudo().signature = (s.replace('https://OLD', 'https://NEW')
                            .replace('OLD', 'NEW').replace('Old Brand', 'New Brand'))
env.cr.commit()
```

### 5. nginx: add the new domain, retire the old one
`deployment/nginx/everjust.conf` in the `ww.everjust.app` repo ([[github-actions-ec2-deploy]]). New public domain → Host-rewrite to the machine host so dbfilter resolves; old public domain → 301:
```nginx
server {                                        # NEW public domain -> tenant
  listen 443 ssl http2; server_name NEW www.NEW;
  ssl_certificate .../NEW/fullchain.pem; ssl_certificate_key .../NEW/privkey.pem;
  location / { proxy_pass http://everjust_odoo;
    proxy_set_header Host <db>.everjust.app;               # <-- the dbfilter key
    proxy_set_header X-Forwarded-Host <db>.everjust.app;
    proxy_set_header X-Forwarded-Proto $scheme; proxy_redirect off; }
  location /websocket { proxy_pass http://everjust_odoo_longpolling; proxy_set_header Host <db>.everjust.app; }
}
server {                                        # RETIRE old public domain -> 301
  listen 443 ssl http2; server_name OLD www.OLD;
  ssl_certificate .../OLD/fullchain.pem; ssl_certificate_key .../OLD/privkey.pem;  # keep cert to terminate TLS
  return 301 https://NEW$request_uri;
}
server { listen 80; server_name OLD www.OLD; return 301 https://NEW$request_uri; }
```
Apply, then PERSIST (both, in order):
```bash
# 1) apply to the box — bind-mounted config, so a RESTART (inode changed), not reload:
#    edit /opt/everjust/platform/deployment/nginx/everjust.conf, then:
sudo docker exec deployment-nginx-1 nginx -t && sudo docker restart deployment-nginx-1
# 2) persist to origin/master — the box .git is STALE and the deploy OVERWRITES the box's
#    tracked files from origin/master, so a box-only edit is reverted next deploy. Commit from a FRESH
#    worktree off origin/master (never a diverged feature worktree — it would drop other blocks):
git -C <repo> worktree add -b infra/<name> /tmp/wt origin/master
#    copy the box's CURRENT everjust.conf into the worktree, `git diff` to confirm ONLY your
#    blocks changed, commit, push HEAD:master.
```

### 6. Verify
```bash
curl -so /dev/null -w '%{http_code} %{redirect_url}\n' https://OLD/         # -> 301 https://NEW/
for h in https://NEW https://<machine>.everjust.app/web/login; do
  curl -so /dev/null -w '%{http_code}\n' $h; done                          # both 200
curl -so /dev/null -w '%{http_code}\n' -X POST https://<machine>.everjust.app/mcp -d '{}'  # 401 = up, not 5xx
```

## Pitfalls

1. **Never repoint the `*.everjust.app` machine host.** It is the dbfilter Host-rewrite target plus the `/mcp` and `/everjust_mail/inbound` endpoints. Redirecting it breaks tenant resolution and the agent/mail plumbing. It is invisible to users once the brand surfaces move — they do not depend on it.
2. **Signatures are the surface humans notice.** The mail infra can be 100% cut over while `res.users.signature` still carries the old wordmark/link — and that is exactly what a user sees in their own mailbox. Always sweep + fix signatures.
3. **jsonb columns need `::text` before `ILIKE`.** `event_event.name/description`, `blog_post.name`, `ir_ui_view.website_meta_*` are translatable jsonb; a bare `ILIKE` errors with "operator does not exist: jsonb ~~*". Cast every one.
4. **`web.base.url.freeze` or it flips back.** Unfrozen, Odoo rewrites `web.base.url` to whatever host an admin last logged in from — set freeze=True after moving it.
5. **Do NOT rewrite historical `mail.message` bodies.** Old sent/received emails legitimately contain the old domain; they are a record of what was actually sent. The sweep will show dozens — leave them. Only fix what GENERATES new content (config, signatures, templates, page content, company/digest name).
6. **nginx bind-mount = restart, not reload.** Editing the mounted `everjust.conf` changes the inode; `nginx -s reload` keeps the old inode. `docker restart deployment-nginx-1` (or `docker compose restart nginx`) to pick it up.
7. **The box .git is stale — persist nginx to origin/master from a FRESH worktree.** The deploy overwrites the box's tracked files from origin/master, so a box-only edit is reverted next deploy. Diff the box's current file into a fresh worktree off `origin/master` so the commit is exactly your change and drops nothing (e.g. concurrently-added SEO blocks).
8. **odoo shell needs explicit db creds.** The container config omits `db_user`/`db_password` (entrypoint injects from env), so a bare `odoo shell -d <db>` fails "role odoo does not exist" — pass `--db_user=everjust --db_password=$(printenv PASSWORD)`. And it does not auto-commit: end with `env.cr.commit()`.
9. **Don't trust a green deploy or one live curl.** The multi-tenant deploy `-u`'s the module on tenants that lack it and red-badges even when your tenant is fine; and a stale compiled view can render old while the DB arch is already new. Verify the actual surface (DB `arch_db` / box file / a fresh curl of that exact page).

## See also

- [[everjust-platform]] — the tenant shape, box access, dbfilter, the /odoo debrand; read first.
- [[everjust-mail-ops]] — operating the native everjust.mail webmail (confirm the sending domain's verification/suppression state before and after a cutover).
- [[everjust-website-seo]] — `website.domain` + sitemap/canonical/IndexNow; the SEO half of the cutover.
- [[everjust-website]] — editing the COW QWeb page content you sweep for old-brand text.
- [[github-actions-ec2-deploy]] — the deploy pipeline that rsyncs origin/master over the box (why nginx must be committed there).
- [[everjust-agent-mcp]] — the /mcp surface on the machine host you must keep alive.
