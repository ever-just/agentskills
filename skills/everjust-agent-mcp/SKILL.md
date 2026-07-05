---
name: everjust-agent-mcp
description: Connect to and operate an EverJust.app (Odoo) tenant through its built-in Model Context Protocol server at https://<tenant>.everjust.app/mcp. Use when you need to read, create, update, or delete records in a customer's EverJust/Odoo workspace (CRM leads, contacts, invoices, projects, events, tasks, products, anything in Odoo) from Claude Code or Codex — authenticating as an Odoo user via their API key so every operation is role-bounded and audited. Also use when the user says "connect to my everjust workspace", "add the everjust MCP", "query my Odoo over MCP", or asks how to configure the everjust MCP server.
---

# EverJust Agent MCP — Agent Skill

Operate a live **EverJust.app** workspace (an Odoo instance) over the Model
Context Protocol. The `everjust_agent_mcp` Odoo addon exposes a small, generic
toolset (`search`, `get`, `count`, `find`, `create`, `update`, `delete`, `call`,
plus `list_models` / `describe_model`) that maps directly onto Odoo's ORM. You
authenticate with an **Odoo API key as a Bearer token**, and the server runs
**as that user** — so you can only do what that user's Odoo role permits, and
every call is written to an audit log.

This skill is for an **operating agent** driving a real tenant. For the business
rules, tenancy model, and what each EverJust workspace is for, cross-reference
[[everjust-platform]]. This skill does not duplicate that; it covers connecting
and using the MCP.

## When to use

- The user wants you to read or mutate data in their EverJust/Odoo workspace
  (leads, partners/contacts, invoices, sales orders, projects, tasks, events,
  products, employees, config parameters — any Odoo model).
- The user asks to add / configure the EverJust MCP server in Claude Code or
  Codex.
- You need to discover what a workspace contains (which models, which fields,
  what the connected user is allowed to touch) before acting.

## When NOT to use

- Managing DNS / the connectdomain product — that is unrelated.
- Odoo administration that requires the web UI (installing addons, editing
  views, server actions) — MCP only exposes ORM-level data operations bounded by
  the user's role. Escalate to a human with UI access.

---

## Architecture

```
Claude Code / Codex  ──HTTP + Bearer──▶  https://<tenant>.everjust.app/mcp
        (MCP client)                          (everjust_agent_mcp addon)
                                                      │  runs AS the API-key user
                                                      ▼
                                              Odoo ORM (env[model])
                                                      │  every call →
                                                      ▼
                                              everjust.mcp.log  (audit trail)
```

Key facts:

- **One endpoint per tenant.** The URL is `https://<tenant>.everjust.app/mcp`,
  where `<tenant>` is the workspace subdomain (e.g.
  `tcstartupweek.everjust.app`). One MCP connection = one tenant. To work across
  two tenants you register two MCP servers with two names.
- **Auth = Odoo API key as `Authorization: Bearer <key>`.** No separate OAuth.
  The key identifies a specific Odoo user; the MCP session inherits that user's
  identity and record rules.
- **Everything is role-bounded.** The server executes ORM calls in that user's
  context, so Odoo ACLs and record rules apply exactly as they would in the web
  client. An operation the user can't do in Odoo will fail over MCP too.
- **Everything is audited.** Every tool invocation is logged to the
  `everjust.mcp.log` model. Assume all your actions are attributable.

### Where the API key comes from

The Bearer token is an **Odoo API key** minted by the user themselves in the
EverJust/Odoo web client:

1. Log into `https://<tenant>.everjust.app`.
2. Top-right avatar → **My Preferences** (a.k.a. Preferences).
3. **Account Security** tab → **New API Key** → name it (e.g. "claude-mcp") →
   copy the generated key **once** (it is not shown again).

The key carries that user's full role. Treat it like a password: never commit it
to a repo, PR, or log. Ask the user to paste it; store it only in the MCP client
config or an env var.

### Tool reference

All tools take a `model` (Odoo dotted name, e.g. `res.partner`, `crm.lead`,
`account.move`, `project.task`) and mirror the Odoo ORM.

| Tool | Signature | What it does |
|---|---|---|
| `list_models` | `(filter?)` | List available models; `filter` is a substring match on model name/description. Start here to discover the workspace. |
| `describe_model` | `(model)` | Return the model's fields (name, type, relation, required, help) **and** `your_access` = `{read, create, write, unlink}` booleans for the connected user. Read this before any write. |
| `search` | `(model, domain?, fields?, limit?, order?)` | Odoo `search_read`. `domain` is an Odoo domain list; `fields` limits returned columns; `order` like `"create_date desc"`. |
| `get` | `(model, ids, fields?)` | Read specific record(s) by id. |
| `count` | `(model, domain?)` | `search_count` — how many records match. |
| `find` | `(model, name)` | `name_search` — fuzzy lookup by display name; returns `[id, display_name]` pairs. Use to resolve a name to an id. |
| `create` | `(model, values)` | Create a record from a `values` dict. Returns the new id. |
| `update` | `(model, ids, values)` | `write` — set `values` on the given ids. |
| `delete` | `(model, ids, confirm)` | `unlink`. **Requires `confirm: true`.** ACL-gated (`unlink` right). |
| `call` | `(model, method, ids?, args?, kwargs?, confirm?)` | Escape hatch — call any ORM/model method. Read-only methods run directly; **non-read methods require `confirm: true`.** |

Odoo **domain** syntax (used by `search` and `count`) is a list of triples and
logical operators, e.g.
`[["email", "!=", false], ["create_date", ">=", "2026-01-01"]]` (implicit AND),
or `["|", ["stage_id.name", "=", "Won"], ["expected_revenue", ">", 10000]]`.

---

## Connecting

### Claude Code (HTTP transport, user scope)

Paste this once — replace `<tenant>` and `<ODOO_API_KEY>`:

```bash
claude mcp add --transport http --scope user everjust \
  https://<tenant>.everjust.app/mcp \
  --header "Authorization: Bearer <ODOO_API_KEY>"
```

- `--scope user` makes it available across all your projects. Use
  `--scope project` (or `local`) to keep it to one repo.
- Verify with `claude mcp list` — the `everjust` server should show as
  connected. Its tools then appear as `mcp__everjust__search`,
  `mcp__everjust__describe_model`, etc.
- To remove: `claude mcp remove everjust`.

### Codex (`~/.codex/config.toml`)

Put the key in an env var (don't inline the secret), then reference it:

```toml
[mcp_servers.everjust]
url = "https://<tenant>.everjust.app/mcp"
bearer_token_env_var = "EVERJUST_API_KEY"
```

```bash
export EVERJUST_API_KEY="<ODOO_API_KEY>"   # in your shell profile, not the repo
```

Codex reads the token from `EVERJUST_API_KEY` at launch and sends it as the
Bearer header.

### Multiple tenants

Register one server per tenant under distinct names:

```bash
claude mcp add --transport http --scope user everjust-tcsw \
  https://tcstartupweek.everjust.app/mcp \
  --header "Authorization: Bearer <TCSW_KEY>"
```

In Codex, add another `[mcp_servers.everjust_<name>]` block with its own
`bearer_token_env_var`.

---

## Recipes

Tool calls below are shown as `tool(args)`. In Claude Code the actual tool names
are namespaced `mcp__everjust__<tool>`.

### 1. Discover the workspace (do this first on an unfamiliar tenant)

```text
list_models(filter="crm")
  → ["crm.lead", "crm.stage", "crm.team", ...]

describe_model(model="crm.lead")
  → { fields: { name:{type:"char",required:true},
                email_from:{type:"char"},
                stage_id:{type:"many2one", relation:"crm.stage"},
                expected_revenue:{type:"monetary"}, ... },
      your_access: { read:true, create:true, write:true, unlink:false } }
```

`list_models` with no filter lists everything (large); always filter by a
keyword (`"partner"`, `"account"`, `"project"`, `"event"`, `"sale"`).
`describe_model` is how you learn field names/types before reading or writing —
never guess field names.

### 2. Read data

```text
# How many open leads?
count(model="crm.lead", domain=[["stage_id.name","!=","Won"]])

# List the 20 newest leads with a few fields
search(model="crm.lead",
       domain=[["type","=","lead"]],
       fields=["name","email_from","stage_id","expected_revenue"],
       limit=20, order="create_date desc")

# Resolve a person's name to an id
find(model="res.partner", name="Jane Doe")
  → [[412, "Jane Doe"], [897, "Jane Doe (Acme)"]]

# Read specific records by id
get(model="res.partner", ids=[412], fields=["name","email","phone","company_id"])
```

Pattern: `find` to resolve a name → id, then `get`/`update` with that id.
Prefer `search` with an explicit `fields` list over pulling every column.

### 3. Create a record

```text
# Check you're allowed first
describe_model(model="crm.lead")   # confirm your_access.create == true

create(model="crm.lead", values={
  "name": "Website inquiry — Acme Corp",
  "contact_name": "Jane Doe",
  "email_from": "jane@acme.com",
  "expected_revenue": 25000
})
  → { created_id: 5123, display_name: "Website inquiry — Acme Corp" }
```

For many2one fields pass the related id (resolve it with `find` first, e.g.
`find(model="res.partner", name="Acme Corp")`). For one2many/many2many use Odoo
command tuples, e.g. `"tag_ids": [[6, 0, [3, 7]]]` to set tags 3 and 7.

### 4. Update a record

```text
find(model="crm.lead", name="Website inquiry — Acme Corp")  → [[5123, "..."]]

update(model="crm.lead", ids=[5123], values={
  "expected_revenue": 30000,
  "stage_id": 4          # id of the target stage (resolve via find/search on crm.stage)
})
  → true
```

`update` writes the same `values` to every id you pass — you can batch:
`update(model="crm.lead", ids=[5123,5124,5125], values={"priority":"1"})`.

### 5. Delete (confirm-gated)

`delete` will **refuse without `confirm: true`**, and even then Odoo blocks it if
the user lacks `unlink` rights.

```text
# 1. Verify you can delete at all
describe_model(model="crm.lead")   # your_access.unlink must be true

# 2. First call WITHOUT confirm returns a preview (not an error) — intended
delete(model="crm.lead", ids=[5123])
  → { confirm_required: true,
      message: "delete is irreversible — re-call with confirm:true to proceed.",
      would_delete: [{ id: 5123, name: "..." }] }

# 3. Explicit, deliberate delete
delete(model="crm.lead", ids=[5123], confirm=true)
  → true
```

Always confirm the exact `ids` (fetch them with `search`/`get`) before deleting.
Deletes are logged to `everjust.mcp.log` and are usually irreversible.

### 6. `call` — the escape hatch for ORM methods

When no CRUD tool fits (posting an invoice, sending a message, running an action
method), use `call`. **Non-read methods require `confirm: true`.**

```text
# Read-only method — runs directly, no confirm
call(model="account.move", method="fields_get", args=[["state"]])

# Mutating method — needs confirm=true (and the user's role must allow it)
call(model="account.move", method="action_post", ids=[8891], confirm=true)
  → true

# Method with positional + keyword args
call(model="res.partner", method="message_post", ids=[412],
     kwargs={"body": "Followed up by phone", "subject": "Note"},
     confirm=true)
```

Only reach for `call` after checking `describe_model` for the model and being
sure the method is safe. If a mutating `call` fails with an access error, the
user's role forbids it — see Pitfalls.

### 7. Read your own access before writing

The single most useful habit: check `your_access` before attempting a mutation,
so you fail fast with a clear reason instead of a raw Odoo `AccessError`.

```text
describe_model(model="account.move").your_access
  → { read:true, create:false, write:false, unlink:false }
# → This user can view invoices but not create/edit/delete them.
#   Don't attempt create/update/delete on account.move; tell the user their
#   role is read-only here and they need a higher Odoo role or a different key.
```

---

## Pitfalls

1. **`AccessError` means a role limit, not a missing record.** If a call fails
   with an access/permission error, the record almost certainly exists — the
   connected user's Odoo role just can't perform that operation. Check
   `describe_model(...).your_access`; don't retry blindly or assume the id is
   wrong. Fix = a key from a user with the right role, not a code change.

2. **`delete` and mutating `call` need `confirm: true`.** They are guarded on
   purpose. A first call without `confirm` returns a `confirm_required` result
   (a `would_delete` preview for `delete`; a `confirm_required` message for
   `call`) and changes nothing — not a hard error. Only pass `confirm=true`
   once you've verified the exact ids/method.

3. **Schema is broadly readable; data is role-bounded.** `list_models` /
   `describe_model` may show models and fields the user can't actually read rows
   from. Seeing a model in `list_models` does **not** guarantee `search`/`get`
   will return data — record rules can still hide or empty the result.

4. **One tenant per connection.** The Bearer key and URL bind you to a single
   workspace. There is no cross-tenant tool. Add a separate named server per
   tenant; never assume data from one tenant is visible in another.

5. **Never guess field names.** Odoo field names are model-specific and often
   unintuitive (`email_from` on `crm.lead`, `partner_id` vs `commercial_partner_id`).
   Always `describe_model` first; a wrong field name is a hard error on
   create/update.

6. **many2one wants an id; x2many wants command tuples.** Pass related-record
   ids for many2one (`stage_id: 4`), and Odoo command tuples for one2many/
   many2many (`[[6,0,[ids]]]` to replace, `[[4,id]]` to add). Resolve names to
   ids with `find` first.

7. **The key = the user's full role.** The MCP grants exactly the user's Odoo
   permissions — potentially write/delete across the whole workspace. Guard the
   key, prefer a least-privilege Odoo user for automation, and remember every
   action is attributed in `everjust.mcp.log`.

8. **Domains are lists of triples, not SQL.** `search`/`count` take Odoo domain
   syntax (`[["field","op","value"]]`), not free-text or SQL `WHERE`. Booleans
   use `true`/`false` (Odoo `False`), and dotted paths (`stage_id.name`) traverse
   relations.

## See also

- [[everjust-platform]] — tenancy model, business rules, and what an EverJust
  workspace is for. Read it for the "why"; this skill is the "how to connect and
  operate".
- [[odoo-mcp]] / TCSW Odoo notes — the `tcstartupweek.everjust.app` tenant is a
  concrete instance you can practice against.
