---
name: everjust-projects
description: Operate the "Projects" app of an everjust.app Odoo 19 tenant (project.project / project.task) over the everjust_agent_mcp MCP — create/find projects and tasks, move a task across kanban stages, assign it, set deadlines, add tags, manage personal to-dos, and send/trigger a stage SMS. Use when the task is to read or mutate a tenant's projects, tasks, task stages, or tags; to move work through a kanban pipeline; to file or triage a personal to-do; or to understand why a stage-move SMS did or didn't go out. This is STOCK Odoo project + project_todo + project_sms — the everjust twist is only the SMS transport (swapped to TextBee/Ringover via everjust_sms_gateway) and Odoo-19 field renames (task.state, not kanban_state). Cross-references [[everjust-platform]], [[everjust-agent-mcp]], and [[everjust-mail-ops]].
---

# EVERJUST Projects — Agent Skill

Operate the **Projects** app of a live everjust.app tenant as an agent: create and find
projects/tasks, move a task across kanban **stages**, (re)assign it, set deadlines, tag
it, file and triage **personal to-dos**, and understand the **stage-move SMS**. Everything
runs through the platform's Odoo MCP (`search` / `get` / `find` / `count` / `create` /
`update` / `call` / `describe_model`) — see [[everjust-agent-mcp]] for opening the session
and [[everjust-platform]] for the invariants you must not break.

This app is **stock Odoo 19 CE**: `project`, `project_todo`, `project_sms` (plus
`project_hr_skills`, `project_mail_plugin`, `website_project` on some tenants). This skill
does **not** re-document vanilla project management — it captures only what an operating
agent gets wrong HERE: the **Odoo-19 field renames** (`task.state` replaced
`kanban_state`), the **personal-stage / to-do split** that pollutes stage searches, and
the **everjust-specific SMS gotcha** (project SMS rides the *swapped* transport, which is
often unconfigured on a tenant).

## When to use this skill

- **Create / find** a project or task; read a project's task list or a task's state.
- **Move a task through the pipeline** — change its kanban **stage** (`stage_id`) and/or
  its **state** dot (`state`: in-progress / done / cancelled / …).
- **Assign / reassign** a task (`user_ids`), set a **deadline** (`date_deadline`),
  **priority**, **tags**, subtasks, or blocking dependencies.
- **File / triage a personal to-do** — the `project_todo` "My Tasks" flow (a private task
  with a *personal* stage, distinct from the project's kanban column).
- **Diagnose a stage SMS** — a task moved into a stage that has an `sms_template_id`, and
  you need to know if/why the customer text went out (it rides the swapped gateway).

**Do NOT use this skill for**, and stop if the task is really:
- **Sending/reading email**, project chatter over email, or a project's mail alias — that
  is the native webmail stack, [[everjust-mail-ops]]. `message_post` chatter on a task is
  vanilla Odoo and fine, but genuine email send/receive is NOT `mail.mail` here.
- **Configuring the SMS provider / gateway** (setting `res.company.sms_provider`,
  `everjust.sms_gateway_url`, TextBee/Ringover creds) — that is platform-ops
  ([[everjust-platform]], addon `everjust_sms_gateway`), not project work. This skill only
  *observes* the transport and *triggers* a send.
- **Timesheets / sales / invoicing off tasks** (`project_timesheet_*`, `sale_project`) —
  usually not installed; `list_models(filter="project")` first.

## Architecture — the model map

Stock Odoo project, per `company_id` (one tenant = one DB — [[everjust-platform]]). The
one non-obvious layering: **`project_todo`** reuses `project.task` + `project.task.type`
to implement per-user private to-dos, so the *stage* table is shared between real project
kanban columns and every user's personal "Inbox / To Do / Done" lanes.

| Model | Role | Key fields (real, introspected on a live tenant) |
|---|---|---|
| `project.project` | A project — the container + its kanban board definition. | `name` (req), `partner_id` (Customer), `user_id` (Project **Manager**, `res.users`), `stage_id` (→ `project.project.stage`, the *project's own* pipeline — NOT the task board), `type_ids` (m2m → `project.task.type` = **the task stages/columns on this board**), `task_ids`, `tag_ids` (→ `project.tags`), `privacy_visibility` (req; see below), `label_tasks`, `allow_task_dependencies`, `allow_milestones`, `date_start`, `date` (Expiration), `active`, `description` (html) |
| `project.task` | A task / card. | `name` (req, "Title"), `project_id`, `stage_id` (→ `project.task.type` = **kanban column**), **`state`** (req selection — the **kanban dot**, see values below), `user_ids` (**m2m** "Assignees" — NOT `user_id`), `partner_id` (Customer, the SMS recipient), `priority` (`0`–`3`), `date_deadline` (**datetime**), `parent_id`/`child_ids` (subtasks), `depend_on_ids` (m2m "Blocked By"), `tag_ids`, `milestone_id`, `allocated_hours`, `personal_stage_type_id` (→ personal to-do stage — see project_todo), `display_in_project`, `sequence`, `active` |
| `project.task.type` | **A task stage / kanban column.** Shared by project boards AND personal to-dos. | `name` (req), `sequence`, `fold` (collapsed column), `project_ids` (m2m — which boards show it; **empty ⇒ a personal/global stage**), `user_id` (Stage Owner — set ⇒ it's a personal `project_todo` stage), `mail_template_id` (email on entering stage), **`sms_template_id`** (→ `sms.template`; **SMS on entering stage** — the project_sms hook), `auto_validation_state` |
| `project.tags` | Colored label on projects & tasks. | `name` (req), `color`, `project_ids` |

### The kanban model (read this before moving anything)

Two independent axes on a `project.task`, and it is easy to confuse them:

1. **`stage_id`** (→ `project.task.type`) = the **column** the card sits in on the board
   (e.g. "To Do", "In Progress", "Done"). Moving columns = `update(stage_id=<type id>)`.
2. **`state`** (selection) = the **status dot** on the card. In **Odoo 19 this replaced the
   old `kanban_state`** — do NOT look for `kanban_state`, it does not exist here. Values
   (introspected):

   | `state` value | Label | Meaning |
   |---|---|---|
   | `01_in_progress` | In Progress | default/open |
   | `02_changes_requested` | Changes Requested | the old "blocked" red dot |
   | `03_approved` | Approved | the old "ready" green dot |
   | `04_waiting_normal` | Waiting | blocked by a dependency |
   | `1_done` | Done | closed-won |
   | `1_canceled` | Cancelled | closed-lost |

   A task is "closed" when `state in ('1_done','1_canceled')`. Prefer setting `state`
   (`1_done`) to mark done rather than only dragging to a "Done" column — reporting and
   the closed flag key off `state`, and a "Done"-named stage is just a label.

`priority` is `'0'`Low / `'1'`Medium / `'2'`High / `'3'`Urgent (strings).
`privacy_visibility` on the project is `followers` (invited internal) / `invited_users`
(internal + portal) / `employees` (all internal) / `portal` (internal + invited portal) —
it gates who can even *see* the tasks, so an agent user with a limited role may get an
empty `task_ids` on a `followers`-visibility project (that's a record rule, not a bug).

### project_todo — the personal-stage split (the #1 gotcha)

`project_todo` implements "My Tasks" as **private `project.task` rows** (no `project_id`,
`display_in_project` off) organized by a **personal stage**: `personal_stage_type_id`
(→ `project.task.type` where `user_id` is set). Because personal stages live in the SAME
`project.task.type` table, that table is dominated by per-user lanes: on a live tenant we
saw **95 `project.task.type` rows** but only a handful attached to real projects — the
rest are per-user "Inbox / To Do / Done". Consequences:

- **Never `search('project.task.type', [])` and assume you got board columns.** Filter by
  `('project_ids','in',[<project id>])` for a project's real columns, or by
  `('user_id','=',<uid>)` for a user's personal lanes. A stage with `project_ids == []`
  **and** `user_id` set is a personal to-do lane, not a project column.
- A personal to-do's board column is `personal_stage_type_id`, not `stage_id`.

### project_sms — the everjust twist (the transport is swapped)

`project_sms` is stock: it adds `sms_template_id` on `project.task.type` and, on the
**stock `project.task._track_template` / stage-move hook**, sends that SMS **to the task's
`partner_id`** (via `sms.template.render` → `sms.sms`) whenever a task **enters** a stage
that has a template. Nothing about the *trigger* is everjust-specific.

The **everjust-specific part is the pipe it sends through.** `everjust_sms_gateway`
(`auto_install`, depends `sms`+`sms_twilio`) swaps `res.company._get_sms_api_class()` so
`sms.sms._send_with_api` transparently routes through **TextBee** (self-hosted) or
**Ringover** instead of Odoo's metered IAP — every SMS feature (composer, templates,
phone-field buttons, chatter, and *this project stage SMS*) keeps working, only the
transport changes. Selection is `res.company.sms_provider` ∈ `iap` / `textbee` /
`ringover`, with an **auto-fallback to TextBee when `sms_provider` is unset/`iap` AND
`everjust.sms_gateway_url` is configured**. Credentials live in `ir.config_parameter`
(`everjust.sms_gateway_url` / `everjust.sms_gateway_key`, or `everjust.ringover_*`) —
**never read or echo those** ([[everjust-platform]] rule 8).

> **Live-tenant gotcha (connectdomain, verified):** `sms_provider == 'iap'` **and
> `everjust.sms_gateway_url` is empty** → there is no working SMS pipe, so a stage-move
> SMS is created and then **fails at send** (marked failed, not silently dropped). Confirm
> the transport is actually configured before you rely on a stage SMS reaching a customer.
> This is per-tenant — check each one.

## Recipes

Route each through the Odoo MCP (see [[everjust-agent-mcp]]). Tool calls shown as
`tool(args)`; in Claude Code they are `mcp__everjust__<tool>`. **`describe_model` and read
your `your_access` before any write.** `call` (non-read) and `delete` need `confirm: true`.

### Orient on the Projects app (do this first)

```text
list_models(filter="project")
  → project.project, project.task, project.task.type, project.tags, project.milestone, ...
describe_model("project.task")          # confirm state/stage_id/user_ids + your_access
count("project.project", [])            # scope of the tenant's projects
```

### Create a project, then a task in it

```text
# 1. Resolve the customer (optional) and create the project
find("res.partner", "Acme Corp")                    → [[412, "Acme Corp"]]
create("project.project", {
  "name": "Acme onboarding",
  "partner_id": 412,
  "privacy_visibility": "employees"                 # all internal users can see the board
})                                                  → { created_id: 7 }

# 2. Create a task. NOTE user_ids is many2many -> use a command tuple, NOT user_id.
find("res.users", "Jordan")                         → [[6, "Jordan"]]
create("project.task", {
  "name": "Collect DNS records",
  "project_id": 7,
  "user_ids": [[6, 0, [6]]],                         # assignees = {6}
  "partner_id": 412,                                 # <- SMS recipient if a stage has a template
  "priority": "2",
  "date_deadline": "2026-07-15 17:00:00"             # datetime, not date
})                                                   → { created_id: 5123 }
```
A new task lands in the project's first stage with `state = '01_in_progress'`.

### Move a task across the pipeline (column AND status)

```text
# Find THIS project's real columns (never search stages unfiltered — personal lanes flood it)
search("project.task.type", [["project_ids","in",[7]]],
       fields=["name","sequence","fold","sms_template_id"], order="sequence")
  → [{id:30,name:"To Do"}, {id:31,name:"In Progress"}, {id:33,name:"Done", sms_template_id:[…]}]

# Move the card to the "In Progress" column:
update("project.task", [5123], {"stage_id": 31})

# Mark it actually done (sets the closed flag + reporting; a "Done" column alone doesn't):
update("project.task", [5123], {"state": "1_done"})

# Block/unblock via the status dot or a dependency:
update("project.task", [5123], {"state": "02_changes_requested"})     # changes requested
update("project.task", [5123], {"depend_on_ids": [[4, 5100]]})        # add "Blocked By" 5100
```
Moving into a stage whose `sms_template_id` is set (e.g. stage 33 above) **auto-texts the
task's `partner_id`** — verify the transport first (see below), and make sure
`partner_id` + its mobile are populated or the SMS has no recipient.

### File and triage a personal to-do (project_todo)

```text
# A personal to-do is a project.task with NO project_id, organized by personal stage.
# Resolve the user's personal stages (user_id set, project_ids empty):
search("project.task.type", [["user_id","=",6]], fields=["name","sequence"], order="sequence")
  → [{id:9,name:"Inbox"}, {id:12,name:"Today"}, {id:15,name:"Done"}]

create("project.task", {
  "name": "Review connectdomain PR",
  "user_ids": [[6, 0, [6]]],
  "personal_stage_type_id": 12                       # lands in Jordan's "Today" lane
})                                                   → { created_id: 5140 }

# Move it between personal lanes (personal_stage_type_id, NOT stage_id):
update("project.task", [5140], {"personal_stage_type_id": 15})   # -> personal "Done"
```

### Check whether a stage-move SMS can actually send (before relying on it)

```text
# 1. Which stages fire an SMS on this board?
search("project.task.type", [["project_ids","in",[7]], ["sms_template_id","!=",false]],
       fields=["name","sms_template_id"])
# 2. Is a transport configured on THIS tenant? (do NOT read the *_key params)
get("res.company", [1], fields=["sms_provider"])         # iap | textbee | ringover
count("ir.config_parameter", [["key","=","everjust.sms_gateway_url"],["value","!=",false]])
#   provider 'iap' AND no gateway url  -> SMS will FAIL at send. Fix is platform-ops.
# 3. To send a one-off SMS yourself (not via stage move), render+queue the template:
call("sms.template", "action_send_sms", ids=[<tmpl_id>], kwargs={"res_ids":[5123]}, confirm=true)
#   then read the sms.sms row's state ('sent'/'error') — a created sms.sms is not a delivered one.
```
A created `sms.sms` (or a "Sent" toast) is **not** proof of delivery — read
`sms.sms.state` / `failure_type`, exactly as you read the send result for email in
[[everjust-mail-ops]]. The gateway returns `server_error` when unconfigured.

## Pitfalls

1. **`kanban_state` is gone — use `state`.** Odoo 19 renamed the card status field to
   `state` (`01_in_progress` / `02_changes_requested` / `03_approved` /
   `04_waiting_normal` / `1_done` / `1_canceled`). Writing `kanban_state` is a hard error;
   reading it returns nothing. "Blocked"/"Ready" are now `02_changes_requested` /
   `03_approved`.

2. **`stage_id` (column) ≠ `state` (dot) ≠ `personal_stage_type_id` (to-do lane).** Three
   different axes. Dragging a card to a "Done" *column* does NOT close it — set
   `state='1_done'`. A personal to-do moves via `personal_stage_type_id`, not `stage_id`.

3. **Assignee is `user_ids` (many2many), not `user_id`.** `project.task` has no `user_id`;
   pass a command tuple (`[[6,0,[uid]]]` to set, `[[4,uid]]` to add). `user_id` DOES exist
   on `project.project` but means the **Project Manager**, not an assignee.

4. **Don't `search('project.task.type', [])` blind.** The table is flooded with per-user
   personal-to-do lanes (we saw 95 rows, mostly "Inbox"). Always filter by `project_ids`
   (real columns) or `user_id` (personal lanes). A row with empty `project_ids` + a
   `user_id` is somebody's private to-do stage.

5. **The stage SMS rides the SWAPPED gateway, and the pipe is often not configured.** The
   trigger (`sms_template_id` on the stage) is stock, but transport is TextBee/Ringover via
   `everjust_sms_gateway`. If `res.company.sms_provider=='iap'` and
   `everjust.sms_gateway_url` is empty (verified on `connectdomain`), the SMS is created
   and then **fails**. Check the transport before promising a customer got a text. Fixing
   the transport is platform-ops, not project work.

6. **The SMS goes to `task.partner_id`.** No customer on the task, or no mobile on the
   partner, means no recipient even when everything else is configured. Set `partner_id`
   deliberately before moving into an SMS stage.

7. **`privacy_visibility` can hide tasks from your agent user.** A `followers`-visibility
   project returns an empty/partial `task_ids` to a non-follower — that's an `ir.rule`, not
   a missing record. Use a key from a user with access rather than assuming the data is
   gone ([[everjust-agent-mcp]] pitfall 1).

8. **`date_deadline` is a datetime; `project.project.date` is the Expiration date, not a
   deadline.** Pass `"YYYY-MM-DD HH:MM:SS"` for the task deadline; don't confuse the
   project's `date_start`/`date` with a task due date.

9. **Prefer archive over delete.** `update(active=False)` to retire a project/task is
   reversible; `delete(confirm=true)` is not and cascades to subtasks
   ([[everjust-platform]] rule 13). Confirm ids with the user first.

10. **This is stock Odoo project — don't reach for `everjust.*` project models.** There is
    no everjust project model. The only everjust surface here is the SMS *transport* and
    the Odoo-19 field shape. Real email (not chatter) is [[everjust-mail-ops]].

## Related skills (cross-reference, don't duplicate)

- **[[everjust-platform]]** — tenancy, debrand, the numbered invariants (per-tenant
  provider swap, secrets, sudo/ACL, archive-not-delete). Read for the "why".
- **[[everjust-agent-mcp]]** — how to connect and drive the ORM tools (search/get/create/
  update/call, confirm gates, `your_access`).
- **[[everjust-mail-ops]]** — the native email stack; use it for any real email
  send/receive, and mirror its "read the delivery result, a filed copy ≠ delivered"
  discipline when you trigger a stage SMS here.
