---
name: reverse-proxy-cms-indexing
description: Fix SEO and indexing for a CMS (Odoo, or any web app) served behind a Host-rewriting reverse proxy (nginx or Cloudflare), where the app sees a different internal host than the public domain and therefore emits the wrong robots.txt, sitemap, or canonical URLs. Use this skill whenever a site is not getting indexed, robots.txt says Disallow when it should not, the sitemap or canonical tags point at an internal host, an internal tenant host is itself a crawlable duplicate, or page/template edits do not render live, ESPECIALLY on the everjust.app / customdomain.ai Odoo platform. Covers the domain-mismatch robots+noindex bug, nginx sub_filter canonicalization, duplicate-host noindex, the compiled-template render cache, and a safe backup-validate-rollback config-edit process.
license: Complete terms in LICENSE.txt
---

# SEO/Indexing for a CMS Behind a Host-Rewriting Reverse Proxy

When nginx (or Cloudflare) serves a public domain but rewrites the `Host` header to an internal host before the app sees it — a common multi-tenant pattern, and exactly how **everjust.app tenants + customdomain.ai** work (nginx rewrites `customdomain.ai` -> `connectdomain.everjust.app` so Odoo's dbfilter matches) — a whole class of SEO bugs appears, because the app builds URLs from the host it sees, not the public one. This skill is the tested playbook.

## Symptom -> cause -> fix

### 1. robots.txt says `Disallow: /` (whole site blocked from AI + search)
On Odoo, the `website.robots` template emits `Disallow: /` inside `<t t-if="website.domain and not website._is_indexable_url(url_root)">`. Because the proxy rewrites the Host, `url_root` is the internal host, `_is_indexable_url` returns False, and the Disallow fires — silently blocking every crawler and LLM fetcher even though pages return 200.
**Fix:** a DB inherit view on `website.robots` that sets that `t-if` to `False` (xpath, `position="attributes"`), so robots always renders allow-all. This mirrors the same domain-mismatch patch usually already applied to the page-level `<meta noindex>` (`website.layout`); the robots template is a commonly-missed second spot.

### 2. Sitemap / canonical / robots `Sitemap:` line emit the INTERNAL host
Canonical `<link>` and `og:url` usually already use `website.get_base_url()` (correct if `website.domain` is set). But the **sitemap `<loc>`s and the robots `Sitemap:` directive use `url_root`** (the rewritten internal host), which the app can't fix because it never sees the public host. Do NOT bother flipping `website.domain` — verify it first; it is often already correct.
**Fix at the proxy** (the only layer that knows the real host): add locations on the public server block that `sub_filter` the internal host to the public one:
```nginx
location ~ ^/sitemap.*\.xml$ {
    proxy_pass http://app_upstream;
    proxy_set_header Host internal.host;            # so dbfilter still matches
    proxy_set_header Accept-Encoding "";            # so sub_filter sees uncompressed body
    sub_filter_once off;
    sub_filter_types application/xml text/xml;
    sub_filter 'internal.host' 'public.domain';
}
location = /robots.txt {
    proxy_pass http://app_upstream;
    proxy_set_header Host internal.host;
    proxy_set_header Accept-Encoding "";
    sub_filter_once off; sub_filter_types text/plain;
    sub_filter 'internal.host' 'public.domain';
}
```

### 3. The internal host is a public, crawlable DUPLICATE of the site
On a `*.everjust.app` wildcard, the internal host (e.g. `connectdomain.everjust.app`) is itself publicly reachable and crawlable — a full duplicate of the public domain. Canonical tags mitigate it, but it splits crawl budget and can get the internal host indexed.
**Fix:** a **dedicated nginx server block for that exact host** (a specific `server_name` beats the `~^(?<tenant>.+)\.everjust\.app$` regex wildcard, so only that host is affected) that adds `add_header X-Robots-Tag "noindex, nofollow" always;` and otherwise proxies identically. Use `X-Robots-Tag`, NOT a redirect — the internal host is `web.base.url`, so backend/OAuth/email links must keep resolving.

## The render-cache gotcha (this wastes hours if unknown)
Editing an Odoo **view/template** from `odoo shell` does NOT show up live — the running workers serve a cached compiled template, and `env.registry.clear_cache()` + bumping the `orm_signaling_templates`/`orm_signaling_registry` sequences do NOT propagate cross-process. What actually works:
- **A brand-new page/view renders immediately** (nothing is cached yet). No restart needed.
- **Editing an existing compiled template** needs either `docker restart <odoo-container>` (a ~30-60s maintenance blip; reload is unreliable due to a stale mounted-file inode), OR — better — **writing the view via XML-RPC or the MCP `website_edit_page` tools**, which run in a web worker and invalidate the cache immediately (no restart). Prefer the in-worker write path.
- **DATA/content changes** (a record field, `ir.attachment`, a website setting like `custom_code_head`) render immediately. Only VIEW/TEMPLATE changes hit the cache.
Corollary: to inject site-wide CSS without a restart, embed it in content (a `Html` field with `sanitize=False`) rather than a template `<style>` inherit that will not render until reload.

## Safe process for editing shared production config (nginx)
This config is multi-tenant — a mistake takes down every domain. Always:
1. **Back up** the live file first (`sudo cp everjust.conf everjust.conf.bak-<ts>`). It usually needs `sudo`.
2. Make additive edits (new `server`/`location` blocks — they never collide with other edits).
3. **`docker exec <nginx> nginx -t`** to validate.
4. If OK, `docker restart <nginx>`; **if not, restore the backup and do NOT restart** (the running config stays good until restart).
5. **Persist to git** so a deploy does not revert it: the box's git metadata is often stale/unreliable (the working file is the real live config), so commit to `origin/master` via an **isolated `git worktree`** off `origin/master` (never the shared dev checkout), as an additive change, then push.

## everjust/customdomain specifics
- Box: `deployment-odoo-1` (Odoo, all tenants) + `deployment-nginx-1` (nginx). Config: `deployment/nginx/everjust.conf`, git-tracked, mounted into the nginx container.
- Verify a fix across ALL tenant domains after an nginx restart (everjust.app, tcstartupweek.com, connectdomain.app, the customdomain, careers.*), not just the one you changed.

## Related skills
For the content/citation side of discoverability, see `generative-engine-optimization`. For agent/MCP discovery, see `mcp-server-discoverability`.
