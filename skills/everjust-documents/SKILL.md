---
name: everjust-documents
description: Operate the "Documents" app of an everjust.app Odoo 19 tenant (browse/create/move folders and files, upload, download, tag, migrate storage, point Documents at the tenant's private cloud) via the Odoo MCP/ORM. Use to read or mutate a tenant's documents — create a folder (dms.directory) or file (dms.file), fetch a file's bytes, move/archive/lock/tag a file, or wire the app to Nextcloud-over-WebDAV. This is the OCA dms stack (dms.file / dms.directory / dms.storage) plus the bespoke everjust_documents layer that stores every file PHYSICALLY in the tenant's Nextcloud over WebDAV (fs_storage + fs_attachment) — NOT Odoo Enterprise "documents.document" (that model does not exist here), NOT raw ir.attachment. Only some tenants have it installed (tcstartupweek + headsup as of 2026-07, NOT connectdomain) — check first. Files depend on live Nextcloud connectivity and a webdav4 monkeypatch. Cross-references [[everjust-platform]], [[everjust-agent-mcp]]; sibling of [[everjust-mail-ops]], [[everjust-sms]].
---

# EVERJUST Documents — Agent Skill

Operate the everjust.app **Documents** app as a running agent: browse a tenant's
folders, create/move/upload/download files, tag and archive them, and understand
where the bytes physically live. You reach the ORM through the platform's Odoo MCP
(open an `env` against the right tenant DB, then `search` / `read` / `create` /
`write` / `call` a method) — see [[everjust-agent-mcp]] for opening the session and
[[everjust-platform]] for the invariants (one-DB-per-tenant, sudo/ACL boundaries,
Odoo-19 API surface).

The addons are three OCA modules — **`dms`** (Document Management System:
`dms.file` / `dms.directory` / `dms.storage`), **`fs_storage`** (generic fsspec
storage backend: `fs.storage`), **`fs_attachment`** (routes `ir.attachment` bytes to
an fs.storage) — plus one bespoke EVERJUST glue module, **`everjust_documents`**,
that wires all three at Nextcloud over WebDAV. Custom source:
`/Users/cloudaistudio/Desktop/ww.everjust.app/addons/everjust_documents/`.

## When to use this skill

- **Browse / read** a tenant's documents — list root storages, folders, files;
  fetch a file's bytes; read tags, size, checksum, lock state.
- **Create / upload** — make a folder (`dms.directory`) or a file (`dms.file`,
  content is base64), place a file into a directory.
- **Organize** — move a file to another directory, archive (soft-delete), lock/unlock,
  tag/categorize, rename.
- **Storage / cloud plumbing** — inspect or configure where files physically land
  (database / filestore / **attachment→Nextcloud-over-WebDAV**), test the private-cloud
  connection, point Documents at the cloud, migrate existing files to the current
  save type.

**Do NOT use this skill for**, and stop if the task is really:
- **Odoo Enterprise "Documents"** (`documents.document`, `documents.folder`,
  workspaces/workflow rules) — that model **does not exist on this platform**. This
  is the OCA `dms` product. Don't reach for `documents.*`.
- **Raw `ir.attachment` juggling** for chatter/reports/binary fields — that's generic
  Odoo, not this app. (fs_attachment does re-route attachment bytes, but you drive it
  through `dms.file`, not by hand-writing attachments.)
- **Provisioning the Nextcloud tenant/account** (creating the service user, app
  password, WebDAV root) — that's control-plane / infra work; this skill assumes the
  Nextcloud identity exists and only reads/sets the per-tenant connection params.
- **DNS/registrar or mail** — see [[everjust-mail-ops]] for the mail stack.

## Is it even installed here? Check first

`everjust_documents` (+ `fs_storage`/`fs_attachment`) is **installed on only some
tenants**. Verified 2026-07: **installed on `tcstartupweek` and `headsup`; NOT on
`connectdomain`** (there `dms` is present as a transitive dependency but the WebDAV
layer and app are uninstalled). The base `dms` module is broadly installed, but
without `everjust_documents` there is no cloud storage and no "Cloud Files" launcher.
Before any file operation, confirm:

```python
env["ir.module.module"].sudo().search_read(
    [("name", "in", ["everjust_documents", "dms", "fs_storage", "fs_attachment"])],
    ["name", "state"])
# state == "installed" for all four ⇒ full cloud-backed Documents.
# Only "dms" installed ⇒ plain DMS (files in DB/filestore), no Nextcloud.
```

## Architecture — where a file actually lives

Everything is per-`company_id` (tenant). The model layering, bottom-up:

| Model | Role | Key fields (live-verified) |
|---|---|---|
| `dms.storage` | A **storage root**: how files under it are saved. One "Default Storage" per tenant here. | `name`, `save_type` (`database`\|`file`\|`attachment`; **`attachment` is the everjust setting** → bytes flow through `ir.attachment` → fs_attachment → Nextcloud), `company_id`, `inherit_access_from_parent_record`, `include_message_attachments`, `model_ids`, `root_directory_ids` |
| `dms.directory` | A **folder** (tree). A *root* directory belongs to a storage; children inherit. | `name`, `complete_name` (computed path), `is_root_directory`, `parent_id`, `root_directory_id`, `storage_id` (related, from root), `child_directory_ids`, `file_ids`, `group_ids` (DMS access groups), `tag_ids`, `category_id`, `res_model`/`res_id`/`model_id` (**required when `save_type=='attachment'`** — see Pitfalls), `count_files`, `size` |
| `dms.file` | A **file**. Metadata in Postgres; **content lives wherever `storage_id.save_type` says**. | `name` (req), `directory_id` (req), `content` (Binary, **base64**, computed+inverse — write this to upload), `mimetype`/`extension` (computed), `size`/`human_size`/`checksum` (readonly), `tag_ids`, `category_id`, `attachment_id` (→ `ir.attachment` when attachment-stored), `content_file`/`content_binary` (internal stores), `active` (archive flag), `locked_by`/`is_locked`, `save_type`/`migration`/`require_migration` (computed) |
| `fs.storage` | The **physical filesystem backend** (fsspec). Here: one WebDAV backend → Nextcloud. | `name`, `code` (unique; the everjust one is **`everjust_nextcloud`**), `protocol` (`webdav`), `options` (JSON: `base_url` + `auth [user, pass]`), `directory_path` (per-tenant subdir, e.g. `"tcstartupweek"`), `use_as_default_for_attachments` (**True** = destination for new attachments; **only one per company**), `check_connection_method` (`ls` here — probes on every use, drops stale conns), `is_cacheable`, `model_ids`/`field_ids` (per-model/field routing) |

**The everjust wiring (why files land in Nextcloud):** `everjust_documents` flips the
tenant's `dms.storage.save_type` to `attachment`, so every `dms.file` becomes an
`ir.attachment`; `fs_attachment` then routes new attachment bytes to the `fs.storage`
flagged `use_as_default_for_attachments=True`; that storage is the `webdav` backend
(`code='everjust_nextcloud'`) pointing at the tenant's Nextcloud. Net effect: **drop a
file into Documents → it physically lands in Nextcloud over WebDAV, the DB keeps only
metadata.** No second tab, no sync cron — the cloud *is* the filestore. (`res.config.settings`
adds the `everjust_nc_*` panel + the `action_everjust_*` buttons; per-tenant creds live
in `ir.config_parameter` under `everjust_documents.*`, mirroring `everjust_phone` / `everjust_ringover`.)

Live state on tcstartupweek (illustrative): `dms.storage` "Default Storage"
`save_type=attachment`; `fs.storage` id=1 `code=everjust_nextcloud` `protocol=webdav`
`use_as_default_for_attachments=True` `check=ls` `directory_path='tcstartupweek'`;
config params `everjust_documents.nc_url=https://files.everjust.app/remote.php/dav/files/svc_tcstartupweek…`,
`nc_user=svc_tcstartupweek`, `nc_password=***`, `nc_directory=tcstartupweek`,
`files_url=https://files.everjust.app/apps/files`.

## Recipes

Route each through the Odoo MCP against the tenant DB (see [[everjust-agent-mcp]]).

### Browse: storages → root folders → files

```python
# Storage roots and their save_type (is this tenant cloud-backed?):
env["dms.storage"].search_read(
    [], ["name", "save_type", "inherit_access_from_parent_record", "root_directory_ids"])

# Root folders, then drill into one:
roots = env["dms.directory"].search_read(
    [("is_root_directory", "=", True)],
    ["name", "complete_name", "storage_id", "count_files", "count_directories"])
d = env["dms.directory"].search([("complete_name", "=", "Default Storage")], limit=1)
d.child_directory_ids.read(["name", "complete_name"])
env["dms.file"].search_read(
    [("directory_id", "=", d.id)],
    ["name", "mimetype", "human_size", "checksum", "tag_ids", "active"],
    order="name")
```

### Create a folder (root vs child)

```python
storage = env["dms.storage"].search([], limit=1)          # the tenant's storage
# ROOT folder — needs a storage; if storage.save_type == "attachment" it ALSO needs a model:
root = env["dms.directory"].create({
    "name": "Client Contracts",
    "is_root_directory": True,
    "storage_id": storage.id,
    # REQUIRED under attachment storage (constraint _check_storage_id_attachment_model_id):
    "model_id": env["ir.model"]._get("res.partner").id,   # or set res_model="res.partner"
})
# CHILD folder — inherits storage from parent; do NOT set storage_id:
sub = env["dms.directory"].create({"name": "2026", "parent_id": root.id})
```
A root directory MUST have a `storage_id`; a non-root MUST have a `parent_id` and
inherits its storage (you cannot re-parent across storages — it raises `UserError`).
Under `save_type='attachment'`, a directory needs a `model_id`/`res_model`, and any
non-root also needs `res_id` (it binds files to a business record).

### Upload a file (content is base64)

```python
import base64
data = base64.b64encode(open("/path/contract.pdf", "rb").read()).decode()
f = env["dms.file"].create({
    "name": "contract.pdf",           # unique within the directory (constraint)
    "directory_id": sub.id,
    "content": data,                  # base64 str; inverse writes it to the storage
})
f.read(["name", "mimetype", "extension", "human_size", "checksum", "save_type"])
# When the directory's storage is attachment-backed, create() auto-spawns an
# ir.attachment (f.attachment_id) whose bytes fs_attachment routes to Nextcloud.
```
Guardrails enforced on create/write: name must be valid + unique in the directory;
extension not in `dms.forbidden_extensions`; size ≤ `dms.binary_max_size` MB
(default 25). Write to `content` (base64) to replace bytes; never poke
`content_file`/`content_binary` directly — those are the internal stores the `content`
inverse manages.

### Download a file's bytes

```python
f = env["dms.file"].browse(file_id)
raw = base64.b64decode(f.content or b"")     # reads THROUGH the storage backend
open("/tmp/out.pdf", "wb").write(raw)
# For attachment-stored files you may also go via f.attachment_id.datas, but reading
# f.content is the storage-agnostic path and is what the app uses.
```
For an attachment-backed tenant this read hits Nextcloud over WebDAV live — it will
raise if the cloud is unreachable (see Pitfalls), and it relies on the webdav4 patch.

### Move, tag, archive, lock

```python
# Move to another folder (same root storage only):
f.write({"directory_id": other_dir.id})
# Tag / categorize (tags are filtered by the file's category):
tag = env["dms.tag"].search([("name", "=", "Signed")], limit=1)
f.write({"category_id": cat.id, "tag_ids": [(6, 0, tag.ids)]})
# Archive (soft delete — hidden but kept; UNARCHIVE with active=True):
f.write({"active": False})
# Lock / unlock (prevents concurrent edits):
f.lock()      # sets locked_by = current user
f.unlock()
```

### Configure / verify the private cloud (Nextcloud over WebDAV)

```python
# 1) See the WebDAV backend and whether Documents is pointed at it:
env["fs.storage"].sudo().search_read(
    [("code", "=", "everjust_nextcloud")],
    ["protocol", "directory_path", "use_as_default_for_attachments", "check_connection_method"])
# 2) Test connectivity (idempotently ensures the fs.storage from config params, then ls root):
env["fs.storage"].sudo().test_everjust_nc_connection()      # True, or UserError with the reason
# 3) (Re)create the backend from the everjust_documents.* config params:
env["fs.storage"].sudo().ensure_everjust_nc_storage()       # looked up by code — idempotent
# 4) Point every dms.storage at the cloud (flip save_type→attachment; tests conn first):
env["res.config.settings"].create({}).action_everjust_point_documents_at_nc()
```
Per-tenant creds are in `ir.config_parameter` (`everjust_documents.nc_url` / `nc_user` /
`nc_password` / `nc_directory`, plus `files_url` for the "Cloud Files" launcher). Set
them via the Settings panel or by writing the params, then call
`ensure_everjust_nc_storage()`. **Never paste real cloud passwords into a tracked file,
commit, PR, or log** (see [[everjust-platform]]).

### Migrate existing files to the current save type

```python
# Files created BEFORE a save_type flip stay where they were. Relocate them:
storage = env["dms.storage"].search([], limit=1)
storage.action_storage_migrate()          # migrates files with require_migration=True
# Inspect what needs moving first:
env["dms.file"].search_read(
    [("require_migration", "=", True)], ["name", "migration", "save_type"])
```

## Pitfalls (everjust-specific)

1. **This is NOT Odoo Enterprise Documents.** `documents.document` /
   `documents.folder` do not exist on this platform (`'documents.document' in env`
   is `False`). The models are `dms.file` / `dms.directory` / `dms.storage`. Don't
   write code against `documents.*`.

2. **Files can physically live in Nextcloud — reads/writes need live connectivity.**
   When `dms.storage.save_type == 'attachment'` and the default fs.storage is the
   `webdav` backend, a file's bytes are on Nextcloud, not in Postgres. Reading
   `f.content` (or `f.attachment_id.datas`) makes a live WebDAV round-trip; if
   Nextcloud is down / the app password rotated / the folder was moved, the read
   **raises** and the file appears "broken" even though its metadata row is fine.
   `check_connection_method='ls'` means the backend probes on every use and drops a
   stale connection from cache. Diagnose with
   `env["fs.storage"].sudo().test_everjust_nc_connection()` before assuming data loss.

3. **The webdav4 monkeypatch is load-bearing.** `everjust_documents/models/webdav4_patch.py`
   coerces `WebdavFile.read(None)` → `read(-1)`; without it fsspec's "read everything"
   call raises `TypeError` and **every** attachment read from Nextcloud fails. It's
   applied at import and is idempotent. If reads fail with that TypeError, the module
   didn't load (wrong tenant / not installed / import error) — don't try to reimplement
   the read.

4. **Attachment storage imposes hard constraints on folders.** A directory on an
   attachment-backed storage MUST have a `model_id`/`res_model` (and a non-root also a
   `res_id`), and a `dms.file` there must resolve `res_model`+`res_id` — otherwise
   `ValidationError`. So you can't just make a free-floating folder on a cloud-backed
   tenant; bind it to a model/record. (On database/filestore storages this doesn't apply.)

5. **You cannot change a directory's storage, and can't re-parent across storages.**
   `dms.directory.write` raises `UserError` if a move would cross storages. Create in
   the right root, or migrate files explicitly (`action_storage_migrate`).

6. **Only one `fs.storage` per company may be `use_as_default_for_attachments`.**
   There's a constraint. Don't flip a second backend's flag on; use the everjust helper
   `ensure_everjust_nc_storage()` (keyed by `code='everjust_nextcloud'`, idempotent)
   rather than hand-creating storages.

7. **Write `content` (base64), never the raw stores.** `dms.file.content` is a
   computed+inverse Binary that dispatches to `content_file` / `content_binary` /
   `attachment_id` per the storage save type. Writing `content_binary`/`content_file`
   yourself bypasses that and desyncs the file. Upload/replace bytes via `content`.

8. **Flipping save_type does NOT move existing files.** `action_everjust_point_documents_at_nc`
   only changes where *new* files go; old files keep their old storage until you run the
   per-storage migration. Don't assume a freshly-cloud-pointed tenant has its history in
   Nextcloud.

9. **Everything is per-`company_id`/tenant.** Storage, folders, files, DMS access
   groups, and the WebDAV creds are all tenant-scoped. Confirm you're on the right
   tenant DB and `env.company` before searching or creating (see [[everjust-agent-mcp]]).
   And confirm the app is actually installed on *this* tenant (the check above) — it is
   not universal (e.g. not on `connectdomain`).

10. **DMS has its own permission layer.** Access is governed by `dms.access.group` on
    directories (inherited down the tree), plus — under attachment storage with
    `inherit_access_from_parent_record` — the ACL of the *linked business record*.
    A `sudo()` search can see files an end user cannot; if you're acting *as* a user,
    respect `permission_read/write/create/unlink` on the records rather than sudo-ing
    around them.
