---
name: odoo-bluegreen-zero-downtime
description: Deploy code + module upgrades to a docker-compose Odoo (single box, one or many tenant DBs) with ZERO downtime via a blue/green cutover — and know when NOT to. Use when deploys stop Odoo and users see 502/503 ("deploys take the site down", "publish broke the app"), when asked to design zero-downtime/rolling deploys for Odoo or another registry-signaling monolith, or when automating -u module migrations against live traffic. Covers the verified live-`-u` behavior (registry signaling keeps the serving color 100% up; only the changed view can error until the flip), the per-color code-isolation trap (shared bind mounts silently break blue/green), asset flush + pre-warm, the abort-safe cutover state machine, cron pause semantics, and the schema-breaking escape hatch.
license: Complete terms in LICENSE.txt
---

# Zero-downtime blue/green deploys for docker-compose Odoo

The naive Odoo deploy is `stop → -u every module on every DB → start`: minutes
of all-tenant 502/503 per push. This skill is the verified recipe for shipping
addon changes with **zero non-200 seconds**, on a single docker-compose box —
no Kubernetes, no Odoo.sh. It generalizes a production pipeline built on Odoo
19 CE; the facts marked *verified* were established by instrumented experiments
against a live multiprocess instance, not theory.

## Verified facts to build on (don't re-derive; re-verify only if your Odoo version differs)

1. **A live `-u` does NOT take Odoo down.** Odoo instances sharing a DB
   coordinate through DB signaling: a module upgrade calls
   `Registry.signal_changes()` (insert into `orm_signaling_registry`), and
   every HTTP request on other instances runs `check_signaling()` →
   `Registry.new()` on mismatch. Measured: 100% availability on the serving
   instance during a migration run from a second install; worst request 0.76s
   vs 0.02s baseline; zero errors on unrelated pages.
2. **The only casualty is the changed surface itself.** After the migration
   commits, the serving color runs *old Python over new DB metadata/views*. A
   view **changed by that very migration** can throw a webclient error dialog
   ("old Python + new view" — e.g. the view now references a field the old
   code doesn't define). Everything else keeps working. So the danger window
   = migrate→flip; keep it to seconds and only that deploy's own screens are
   at risk.
3. **In-app website publishing never takes the site down.** Publishing/
   unpublishing pages and builder arch edits are DB writes (verified: dozens
   of public probes through repeated publish toggles, all 200). If users say
   "publishing broke the site", the real cause is a git deploy window or a
   cold asset recompile — fix the pipeline, not the website app.
4. **Flushing compiled asset bundles is necessary but brutal.** `-u` does not
   reliably regenerate stale `/web/assets/%` attachments (a stale minified
   bundle can keep serving broken JS), so pipelines delete them — and then
   the first visitor per DB pays a multi-second recompile that *feels* like
   continued downtime. Pre-warm instead (below).
5. **Sessions survive a cutover for free** if both colors share the Odoo data
   volume: sessions are files under `data_dir/sessions`. Same for the
   filestore (attachment binaries).

## Architecture (the pieces you need)

```
nginx ──(upstream file, ONE swappable conf)──► odoo   "blue"  code: /opt/app/platform/addons
                                        └────► odoo_green      code: /opt/app/green/addons  ← OWN DIR
db (postgres, shared)      odoo-data volume (filestore + sessions, shared)
```

- **`odoo_green` service** in the same compose file: same image/conf/DB/data
  volume, `profiles: ["bluegreen"]` (never starts on a plain `up -d`),
  reduced workers, **`--max-cron-threads=0`** (two colors must never both run
  crons), `restart: "no"` (must not resurrect on reboot).
- **THE TRAP — per-color code isolation.** Do NOT bind-mount the same host
  addons dir into both colors. If you do, "staging new code for green"
  rewrites the files under the SERVING color: its imported Python stays old
  while lazy imports, data files, and asset compiles read new files —
  mixed-version behavior on live traffic. Give green its **own directory**
  and stage the new code there first; sync blue's dir only after the flip.
  (Audit any existing "blue/green ready" setup for this — ours shipped with
  the shared mount and nobody noticed until an adversarial review.)
- **Swappable nginx upstream**: one tiny conf defining the `upstream` blocks
  (HTTP :8069 + websocket/gevent :8072), included before the main config.
  Cutover = `sed 's/server odoo:/server odoo_green:/'` + `nginx -t` +
  `nginx -s reload` (graceful: re-resolves, drains in-flight, zero drops).

## The cutover state machine (automate exactly this)

```
guards: MemAvailable ≥ ~2GB (two colors coexist) · blue running · upstream points at blue
stage:  extract tarball → rsync --delete into GREEN's code dir (never blue's)
start green → wait for HTTP 200 on its :8069
backup every tenant DB (pg_dump) — your rollback story
for each tenant DB:
    clear stuck module states ('to install'→uninstalled, 'to upgrade/remove'→installed)
    -u <changed modules only> via a green-service one-off container   ← blue keeps serving
    delete /web/assets/% attachments, then PRE-WARM (compile web.assets_frontend
      + web.assets_web via `odoo shell`: env['ir.qweb']._get_asset_bundle(name).css()/.js())
    ANY tenant failure → ABORT (unlike a maintenance-window deploy, green must
      never serve a tenant it failed to migrate)
health-check green per tenant (request with each tenant's Host header)
FLIP nginx upstream → green; verify every tenant through nginx (https://127.0.0.1 + Host)
sync blue's code dir from the same tarball → recreate blue (full workers + crons)
health-check blue per tenant → FLIP BACK → verify → remove green → advance deployed-SHA baseline
```

**Failure semantics (encode as a trap):**
- *Before the flip*: user no-op. Restore the upstream file to blue
  (idempotent sed), reload nginx, remove green. Blue was never stopped.
- *After the flip*: green is serving new code healthily — do **not**
  auto-flip back to a possibly-broken blue. Leave green live and fail LOUDLY:
  **crons are paused** (green runs none) until a human finalizes (recreate
  blue, flip back, remove green).
- Rolling back after the flip returns users to **old code over the migrated
  schema** — fine for additive changes, which is why the escape hatch below
  exists for everything else.

## The escape hatch (what must NOT cut over)

Refuse cutovers, in the automation itself, for changes to: the compose file,
odoo.conf, the reverse proxy config, non-Odoo services — and any
**schema-breaking** migration (column drops/renames, data rewrites old code
still reads). Those take the classic short maintenance window (serve a
branded auto-refreshing 503 page from nginx while the backend is down, so it
reads as maintenance, not breakage). Zero-downtime is the default; the
maintenance window is the explicit exception.

## Quick wins even without blue/green

- **Change-aware classification**: diff against the SHA actually deployed on
  the box; proxy/control-plane/docs-only changes should never touch Odoo, and
  addon changes should `-u` only the changed modules (Odoo cascades to
  dependents itself).
- **Kill redundant restarts**: after `stop → migrate → up -d`, an extra
  `restart` just adds a full boot to the outage window.
- **Pre-warm after every flush** (fact #4): ~7s per tenant in `odoo shell`
  beats a surprise recompile for the first visitor.
- **If you debrand `session_info`**, never clobber `server_version` without
  preserving the real series — Odoo's assets watchdog compares it against
  `bundle_changed` bus broadcasts and will nag every open tab with "the page
  appears to be out of date" toasts after every rebuild. Compare version
  *series* (e.g. `19.0`), not raw build-stamped strings; this also matters in
  blue/green, where two colors legitimately run two build stamps.

## Verifying a zero-downtime claim

Prove it, don't assert it: run a status probe loop (sub-second interval, log
code + latency) against a tenant login URL and the public site for the whole
run. Acceptance = zero non-200 samples. Watch one full cutover with `docker
stats` for the memory-overlap headroom on your box size before trusting the
automation unattended.
