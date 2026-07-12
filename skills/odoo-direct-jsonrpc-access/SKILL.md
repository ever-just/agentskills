---
name: odoo-direct-jsonrpc-access
description: Drive an Odoo 19 tenant's classic /jsonrpc HTTP endpoint (execute_kw) directly with a login+password when you do NOT have MCP tool access or a Bearer API key — e.g. credentials were shared as a plain username/password rather than provisioned as an agent session. Use when calling everjust.app (or any Odoo 19) programmatically from outside the harness: raw curl/Python scripts, background subagents, or CI. Covers auth quirks (password goes in the api-key slot), context passing, batch create/write for bulk imports, idempotent dedup-before-create, and the "private methods cannot be called remotely" boundary. Complementary to [[everjust-platform]] (which assumes MCP/Bearer access and is the source of truth for platform rules like group_ids) — read that first for the rules, use this for the wire protocol when MCP isn't available.
---

# Odoo Direct JSON-RPC Access

Call Odoo 19's classic `/jsonrpc` endpoint directly over HTTP when you have a **login + password**
(not an MCP session, not a Bearer API key). This is the fallback wire protocol for scripts,
background subagents, or CI jobs that need to read/write Odoo data without going through an
MCP-connected harness.

**Prefer `everjust_agent_mcp` / Bearer `/json/2/` when either is available** — see
[[everjust-platform]] rule 14: the legacy JSON-RPC/XML-RPC surface is deprecated (removal
targeted in Odoo 22). This skill exists for the common case where neither is available yet a
task requires programmatic access — e.g. a human shared a login/password directly, or a
subagent is running outside the MCP-connected session. Tested against a live Odoo 19 CE tenant
(hundreds of reads/creates/writes across a full session); still fully functional as of Odoo 19.

## When to use this skill

- You have an Odoo **login + password** (not an API key, not an MCP tool) and need to read or
  write tenant data from a plain script (curl, Python, a background subagent).
- You're orchestrating **many subagents** that each need independent Odoo access without going
  through a shared MCP session.
- You're bulk-importing a CSV/dataset into Odoo (contacts, companies, CRM records) and need a
  batching + idempotency pattern that won't time out or duplicate on re-run.

**Do NOT use this skill for**: platform rules and invariants (mail sending gates, tenant
isolation, ACL/role boundaries, which model to use for what) — that's [[everjust-platform]].
This skill is *only* the wire protocol: how to shape the HTTP call correctly.

## Connection recipe (Python)

```python
import json, urllib.request

BASE = "https://<tenant>.everjust.app"   # or any Odoo 19 base URL
DB = "<database_name>"

def rpc(service, method, args):
    payload = {"jsonrpc": "2.0", "method": "call",
               "params": {"service": service, "method": method, "args": args}}
    req = urllib.request.Request(BASE + "/jsonrpc",
                                  data=json.dumps(payload).encode(),
                                  headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        body = json.load(r)
    if "error" in body:
        raise RuntimeError(body["error"].get("data", {}).get("message")
                            or body["error"].get("message") or json.dumps(body["error"]))
    return body["result"]

def authenticate(login, password):
    return rpc("common", "authenticate", [DB, login, password, {}])

def execute_kw(uid, password, model, method, args, kwargs=None):
    # NOTE: the 4th positional arg to execute_kw is normally an API key in
    # Odoo's docs, but a plain user PASSWORD works identically here — Odoo
    # accepts either in that slot. No separate API-key provisioning needed.
    return rpc("object", "execute_kw", [DB, uid, password, model, method, args, kwargs or {}])
```

Two calls to get moving:
```python
uid = authenticate("weldon@connectdomain.app", PASSWORD)   # returns an int uid, or False on bad creds
count = execute_kw(uid, PASSWORD, "res.partner", "search_count", [[]])
```

In practice `execute_kw`'s uid/password pair is stable across calls — most scripts skip a
separate `authenticate` round-trip and just pass a known uid (e.g. `2` for the primary admin)
straight into `execute_kw`, since a bad uid/password combination fails the same way on first
use as it would on a dedicated auth call.

## Pitfalls

**1. `context` must be nested inside `kwargs`, not passed positionally.**
Wrong: `execute_kw(uid, pw, "res.users", "create", [vals], {"no_reset_password": True})` — this
puts `no_reset_password` as a *field on the record*, not a context flag, and Odoo rejects it as
an unexpected kwarg. Right:
```python
execute_kw(uid, pw, "res.users", "create", [vals], {"context": {"no_reset_password": True}})
```

**2. Field names drift between Odoo versions — verify, don't assume from memory.**
On Odoo 19, `res.users`' groups field is `group_ids`, not the older `groups_id` (see
[[everjust-platform]] rule 14 for why). When a write against an unfamiliar model fails with an
"unexpected keyword" or "invalid field" error, call `fields_get` first instead of guessing:
```python
execute_kw(uid, pw, "res.partner", "fields_get", [[], ["string", "type", "relation", "selection"]])
```

**3. Batch `create`/`write` — don't do one record per round-trip.**
`create` accepts a **list** of vals dicts and creates them all in one call, returning a list of
new ids in the same order. For a few hundred to a few thousand records, batch in chunks of
~50–100 (large enough to cut round-trips dramatically, small enough that one failed batch is
cheap to retry and diagnose):
```python
ids = []
for i in range(0, len(all_vals), 80):
    chunk = all_vals[i:i+80]
    ids.extend(execute_kw(uid, pw, "res.partner", "create", [chunk]))
```
Doing this one-by-one for ~1,400 records (a real case) would be ~1,400 sequential HTTP
round-trips; batched in 80s it's ~18.

**4. Idempotent dedup-before-create for bulk imports.**
Re-running an import script must not duplicate records. Search for an existing match on a
stable natural key (domain, email, or exact name) before creating, and `write` instead of
`create` on a hit:
```python
existing = execute_kw(uid, pw, "res.partner", "search",
                       [[["website", "=", f"https://{domain}"]]])
if existing:
    execute_kw(uid, pw, "res.partner", "write", [existing, vals])
else:
    new_id = execute_kw(uid, pw, "res.partner", "create", [vals])
```
For a large batch import, do the search in one call per batch (`search_read` with an `in`
domain on the natural key) rather than one search per record, then split the batch into
create-list and write-list before issuing the two batched calls.

**5. Not every method is callable remotely.**
Private/internal methods (leading underscore, or methods not meant as an API surface) fail with
`"Private methods ... cannot be called remotely"` — e.g. `calendar.attendee._send_mail_to_attendees`.
This isn't a permissions problem; there's no remote path to that method at all. Look for a public
wrapper method, or trigger the side effect a different way (e.g. writing a state field that a
public method or an automation reacts to) rather than fighting the private one.

**6. Timeouts on bulk operations.**
Batched `create`/`write` calls with 80+ records can take 30–90s depending on server load and
computed fields. Set `timeout=60` to `120` on the `urlopen` call for bulk operations; the default
Python `urllib` timeout (no timeout at all) will hang indefinitely on a stalled connection instead
of failing fast and letting you retry.

## Credential handling

Never write the password to disk, a tracked file, or a log line. Read it once (from an
environment variable, a secrets file outside the repo, or directly from what the user shared in
conversation) and keep it in memory in the script only. Don't `print()` or `echo` the credential
even partially — treat "leaks the first few characters" the same as leaking the whole thing.

## Related skills

- **[[everjust-platform]]** — the operating rules for everjust.app tenants (mail-sending gates,
  tenant isolation, which model to use for what, the `group_ids` field-name gotcha). Read that
  first; this skill only covers the wire protocol.
- **[[everjust-appointments]]**, **[[everjust-crm-sales]]**, **[[everjust-mail-ops]]** — the
  per-app business-object skills for what to actually call once you're connected.
