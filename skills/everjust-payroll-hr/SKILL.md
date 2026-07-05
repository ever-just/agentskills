---
name: everjust-payroll-hr
description: Operate the "Payroll & HR" app of an everjust.app Odoo 19 tenant (hr.employee / hr.payslip / hr.attendance) over the everjust_agent_mcp MCP — read employees and their contracts (now hr.version), pull attendance, generate a payslip batch, compute/confirm/cancel a payslip, and reconcile worked-days against real clocked hours. Use when the task is to look up an employee or their pay/attendance, run or inspect a payroll run, compute or confirm a payslip, or explain why a payslip's "Worked Days" line shows the number it does. This is OCA `payroll` + core `hr`/`hr_attendance`; the everjust twist is `everjust_payroll_attendance`, an auto-installed bridge that OVERRIDES `hr.payslip._compute_worked_days` to source worked days from actual `hr.attendance` records instead of the resource calendar. IMPORTANT: NOT installed on most tenants — only `headsup` has the full stack live; verify install-state first. Cross-references [[everjust-platform]], [[everjust-agent-mcp]], and sibling [[everjust-projects]].
---

# EVERJUST Payroll & HR — Agent Skill

Operate the **Payroll & HR** app of a live everjust.app tenant as an agent: read
employees and their contract "versions", pull real attendance (clock in/out), generate
and compute payslips, move a payslip through its state machine, and reconcile the
payslip's **Worked Days** against actual hours. Everything runs through the platform's
Odoo MCP (`search` / `get` / `find` / `count` / `create` / `update` / `call` /
`describe_model`) — see [[everjust-agent-mcp]] for opening the session against the right
tenant DB, and [[everjust-platform]] for the platform invariants (one-DB-per-tenant,
sudo/ACL boundaries, Odoo-19 API surface) you must not break.

This is mostly **stock/OCA**: core `hr` + `hr_attendance` + `hr_holidays`, and the
**OCA `payroll`** module (`hr.payslip` / `hr.salary.rule` / `hr.payslip.run` — NOT the
Odoo Enterprise `hr_payroll`, which this fork does not have). The **everjust twist** is a
single small bridge, `everjust_payroll_attendance`.

## Install state — CHECK THIS FIRST (biggest gotcha)

The prompt-era assumption "not installed on either tenant" is stale. Reality (verified
live, 2026-07): install state is **uneven across tenants**, so before any recipe here,
confirm the module is actually installed on the DB you're on:

```
# via MCP: find on ir.module.module, or just describe_model('hr.payslip')
find("ir.module.module",
     [["name","in",["payroll","hr_attendance","everjust_payroll_attendance"]]],
     ["name","state"])
```

Observed:

| Tenant | `hr` | `payroll` | `hr_attendance` | `everjust_payroll_attendance` | Bridge active? |
|---|---|---|---|---|---|
| **headsup** | installed | installed | installed | **installed** | **YES** — full stack |
| burekraft-llc, riftline-labs, trust-works-company, weldon | installed | installed | *not* installed | not installed | no (no attendance) |
| connectdomain | installed | *not* installed | *not* installed | not installed | no payroll at all |
| tcstartupweek | *not* installed | not installed | not installed | not installed | no HR at all |

Consequences you must respect:
- **`everjust_payroll_attendance` is `auto_install=True`** and its `depends` include
  **`hr_attendance`** (plus `payroll`, `hr_work_entry`). It therefore installs itself
  ONLY once `hr_attendance` is also present. On the four "payroll-but-no-attendance"
  tenants the bridge is dormant — payslips there use the **stock calendar-based**
  `_compute_worked_days`, not attendance.
- On **headsup** the bridge IS in the live `hr.payslip` MRO (verified — the override's
  source is the one that runs). But headsup currently has **0 salary structures, 0 salary
  rules, 0 attendances, 0 payslips**: the app is installed but *unconfigured and
  un-operated*. Computing a payslip with no structure yields an empty payslip (see
  Pitfalls). Treat "installed" ≠ "ready to pay".
- If the task targets a tenant where payroll isn't installed, **stop** — installing a
  module is platform-ops (add to the deploy manifest + `-u`), not an ORM call you make
  from here. See [[everjust-platform]].

## Key models (real `_name`s and the fields that matter)

Odoo-19 renamed the contract model: **a "contract" is an `hr.version`**, not the old
`hr.contract`. Every payroll `contract_id` (on payslip, worked-days line, and elsewhere)
points to `hr.version`. This is the #1 field-name trap.

| Model | Role | Notable fields (introspected live) |
|---|---|---|
| `hr.employee` | The person. | `name`, `user_id`(→res.users), `company_id`(req), `department_id`, `job_id`, `resource_calendar_id`(→resource.calendar, "Working Hours"), `attendance_ids`(→hr.attendance), `hourly_cost`(monetary), `work_email`, `active`, **`version_id`(req, →hr.version = current contract)**, `current_version_id`, `version_ids` |
| `hr.version` | **The contract** (Odoo-19 name). Payroll reads `struct_id`, `schedule_pay`, `resource_calendar_id`, `date_start`. | `struct_id`(→hr.payroll.structure), `schedule_pay`(monthly/weekly/…), `resource_calendar_id`, `wage`, `date_start` |
| `hr.attendance` | One clock-in/out span. **The bridge's data source.** | `employee_id`(req), `check_in`(datetime, req), `check_out`(datetime), **`worked_hours`(float — computed span the bridge SUMS)**, `in_mode`/`out_mode`(selection: how they clocked), `company_id` |
| `hr.payslip` | One employee's slip for one period. | `name`, `number`(ref seq `salary.slip`), `employee_id`(req), `contract_id`(→hr.version), `struct_id`(→hr.payroll.structure), `date_from`/`date_to`(req), **`state`**(`draft`/`verify`/`done`/`cancel`), `worked_days_line_ids`, `line_ids`(→hr.payslip.line, computed), `input_line_ids`, `payslip_run_id`, `credit_note`, `refunded_id`, `compute_date`, `paid` |
| `hr.payslip.worked_days` | **The Worked-Days lines** — what the bridge writes. | `name`, `code`(req — bridge writes **`"ATTN"`**), `sequence`, `number_of_days`(float), `number_of_hours`(float), `contract_id`(→hr.version), `payslip_id` |
| `hr.payslip.line` | Computed money lines (one per salary rule). Read-only; produced by `compute_sheet`. | `salary_rule_id`, `code`, `amount`, `quantity`, `rate`, `total`, `slip_id`, `category_id` |
| `hr.payslip.run` | A **batch** of payslips for a period. | `name`, `slip_ids`(→hr.payslip), `date_start`/`date_end`, `struct_id`, `credit_note`, **`state`**(only `draft`/`close` — NOT the payslip's states) |
| `hr.payroll.structure` | Salary structure = a set of rules. Payslips need one or compute nothing. | `name`, `code`, `rule_ids`(→hr.salary.rule), `parent_id` |
| `hr.salary.rule` | One computation rule (Python/fixed/percentage). | `name`, `code`, `category_id`, `amount_select`, `amount_python_compute`, `condition_select` |
| `account.analytic.line` | **Timesheets / analytic entries** — NOT attendance. Shared with Projects. | `name`(req), `date`(req), `unit_amount`(float=hours), `employee_id`, `project_id`, `task_id`, `company_id`(req) |

**`hr.attendance` and `account.analytic.line` are independent here.** This tenant has no
`hr_attendance_timesheet`-style bridge, so clocking in does **not** create an analytic
line, and the payroll bridge reads **`hr.attendance`**, not timesheets. Analytic lines are
the Projects/timesheet world — see [[everjust-projects]]. Don't reconcile payroll worked
days against `account.analytic.line`; reconcile against `hr.attendance.worked_hours`.

## How the everjust bridge changes payroll (the one thing that's non-stock)

`everjust_payroll_attendance/models/hr_payslip.py` inherits `hr.payslip` and overrides
**`_compute_worked_days(contract, day_from, day_to)`**. During `compute_sheet` the OCA
flow calls `get_worked_day_lines` → `_compute_worked_days`; the override:

1. Searches `hr.attendance` for the employee where `check_in` is within `[day_from,
   day_to]` **and `check_out != False`** (open/un-clocked-out spans are ignored).
2. If **no** such attendances → `super()` → **stock calendar-based** worked days
   (so salaried employees without a clock are unaffected). This fall-through is why the
   four attendance-less tenants behave stock even though they run payroll.
3. If attendances exist → returns ONE worked-days dict:
   `name="Attendance"`, `code="ATTN"`, `sequence=1`,
   `number_of_days = count of DISTINCT check-in dates`,
   `number_of_hours = sum(worked_hours)`, `contract_id = contract.id`.

So on headsup a computed payslip's `worked_days_line_ids` will contain an **`ATTN`** line
whose hours equal real clocked hours and whose days equal distinct clock-in days — that is
the everjust behavior to expect and to explain. The *money* lines (`line_ids`) still come
from the salary structure's rules multiplying against these worked days.

## Recipes

Route each through the Odoo MCP against the tenant DB (see [[everjust-agent-mcp]]).
`create`/`update`/`call` are shown as MCP verbs; `call` invokes a model method.

### 1. Look up an employee, their contract, and clocked attendance for a period

```
# Find the employee
emp = find("hr.employee", [["name","ilike","Jordan"]],
           ["name","work_email","department_id","job_id","hourly_cost",
            "version_id","resource_calendar_id"], limit=5)
# The contract is the current hr.version (NOT hr.contract):
get("hr.version", emp[0]["version_id"][0],
    ["struct_id","schedule_pay","wage","resource_calendar_id","date_start"])
# Real clocked spans in July 2026 (closed spans only — the bridge ignores open ones):
find("hr.attendance",
     [["employee_id","=",emp[0]["id"]],
      ["check_in",">=","2026-07-01 00:00:00"],
      ["check_in","<=","2026-07-31 23:59:59"],
      ["check_out","!=",false]],
     ["check_in","check_out","worked_hours","in_mode"], order="check_in")
# What the payslip WILL show as worked days (mirror the bridge yourself):
#   number_of_hours = sum(worked_hours); number_of_days = distinct check_in dates.
```

### 2. Generate a payroll batch and compute everyone's slip (the correct path)

Do NOT hand-build payslips row by row. Create a **run**, then call the OCA
**by-employees wizard**, which builds each slip via `get_payslip_vals` (this is where the
attendance bridge fires) and computes them.

```
# Preconditions: a salary structure with rules must exist, else slips compute empty.
struct = find("hr.payroll.structure", [], ["name"], limit=1)     # must be non-empty!

run = create("hr.payslip.run", {
    "name": "July 2026 Payroll",
    "date_start": "2026-07-01",
    "date_end": "2026-07-31",
    "struct_id": struct[0]["id"],
})

# Build + compute slips for chosen employees, in the run's context (active_id = run):
emp_ids = [e["id"] for e in find("hr.employee", [["active","=",true]], ["id"])]
wiz = create("hr.payslip.employees", {"employee_ids": [[6,0,emp_ids]]})
call("hr.payslip.employees", "compute_sheet", [[wiz]], {"context": {"active_id": run["id"]}})

# Inspect results — each slip now has worked-days lines (ATTN if attendance existed):
slips = find("hr.payslip", [["payslip_run_id","=",run["id"]]],
             ["employee_id","state","number","date_from","date_to"])
get("hr.payslip", slips[0]["id"], ["worked_days_line_ids","line_ids"])
find("hr.payslip.worked_days", [["payslip_id","=",slips[0]["id"]]],
     ["code","name","number_of_days","number_of_hours"])   # look for code == "ATTN"
```

### 3. Compute / confirm / cancel a single payslip (its state machine)

`hr.payslip.state`: **`draft` → `verify` → `done`**, or → `cancel`. `compute_sheet` is
what moves `draft → verify` AND (re)builds all lines; `action_payslip_done` re-computes
(unless `prevent_compute_on_confirm`) then locks to `done`.

```
# From a draft slip: compute it (draft -> verify, fills worked_days + money lines)
call("hr.payslip", "compute_sheet", [[slip_id]])
get("hr.payslip", slip_id, ["state","number","line_ids"])       # state == "verify"

# Confirm (verify/draft -> done). Recomputes first unless prevent_compute_on_confirm.
call("hr.payslip", "action_payslip_done", [[slip_id]])          # state == "done"

# Reset a rejected slip back to draft (ONLY works from state == "cancel"):
call("hr.payslip", "action_payslip_draft", [[slip_id]])

# Cancel. A "done" slip can only be cancelled if the payroll.allow_cancel_payslips
# ir.config_parameter is set; otherwise this raises UserError.
call("hr.payslip", "action_payslip_cancel", [[slip_id]])
```
For bulk state changes across many slips, the OCA wizard `hr.payslip.change.state`
(`change_state_confirm`, `state` ∈ `draft`/`verify`/`done`/`cancel`, with `active_ids` in
context) applies the same guarded transitions to a selection.

### 4. Explain a payslip's Worked Days (attendance vs. calendar reconciliation)

```
# Pull the worked-days lines and compare to raw attendance for the same window:
wd = find("hr.payslip.worked_days", [["payslip_id","=",slip_id]],
          ["code","name","number_of_days","number_of_hours"])
slip = get("hr.payslip", slip_id, ["employee_id","date_from","date_to"])
att = find("hr.attendance",
     [["employee_id","=",slip["employee_id"][0]],
      ["check_in",">=", slip["date_from"]+" 00:00:00"],
      ["check_in","<=", slip["date_to"]+" 23:59:59"],
      ["check_out","!=",false]],
     ["check_in","worked_hours"])
# If wd has a code=="ATTN" line: number_of_hours == sum(att.worked_hours) and
#   number_of_days == count(distinct check_in dates). That's the bridge working.
# If wd has NO "ATTN" line (only calendar codes like WORK100): the employee had NO
#   closed attendance in the window, so the stock calendar fallback ran. That is
#   EXPECTED for salaried/un-clocked employees — not a bug.
```

### 5. Refund (credit-note) a confirmed payslip

```
# Creates a negative "credit note" copy of a done slip (for corrections):
call("hr.payslip", "refund_sheet", [[slip_id]])
# The new slip has credit_note=True and refunded_id pointing at the original.
```

## Pitfalls (everjust-specific and Odoo-19-specific)

1. **Check install state before you do anything.** Only **headsup** has the full stack
   live; several tenants have `payroll` but not `hr_attendance` (bridge dormant → stock
   calendar worked days), and some have no payroll/HR at all. Recipes here silently no-op
   or error on the wrong tenant. Verify via `ir.module.module` / `describe_model` first.

2. **"Contract" = `hr.version`, not `hr.contract`.** Odoo 19 replaced the contract model.
   Every payroll `contract_id` (payslip, worked-days line) and the employee's
   `version_id`/`current_version_id` point at `hr.version`. Searching `hr.contract` will
   fail or return nothing. The employee's *active* contract is `version_id`.

3. **No structure → empty payslip.** `compute_sheet` multiplies worked days by the salary
   structure's rules. headsup currently has **0 `hr.payroll.structure` / 0
   `hr.salary.rule`**, so computing there yields a slip with worked-days lines but **no
   money `line_ids`**. Ensure a `struct_id` with rules exists (on the run and/or employee
   contract) before expecting pay amounts.

4. **The bridge only counts CLOSED attendance.** `_compute_worked_days` requires
   `check_out != False`. An employee still clocked in (open span) contributes **zero**
   hours to the payslip. If worked hours look short, check for open `hr.attendance` rows.

5. **No attendance → stock calendar fallback, and that's intentional.** A missing `ATTN`
   line does NOT mean the bridge is broken; it means the employee had no closed attendance
   in the period, so OCA's calendar-based computation ran (salaried staff on a fixed
   `resource_calendar_id`). Don't "fix" this by forcing an ATTN line.

6. **`hr.attendance` ≠ `account.analytic.line`.** Attendance (clock) and analytic
   timesheets are separate systems on this fork — clocking in creates no analytic line.
   Payroll reads attendance; Projects/timesheets read analytic lines
   ([[everjust-projects]]). Reconcile payroll against `hr.attendance.worked_hours` only.

7. **`hr.payslip.run.state` is `draft`/`close` — different axis from the slip.** The run
   is a container; `close`/`draft` is just its own batch status. The pay workflow
   (`draft`→`verify`→`done`→`cancel`) lives on each `hr.payslip`. Don't confuse them, and
   don't look for `action_payslip_*` methods on the run (there are none) — generate slips
   via the `hr.payslip.employees` wizard.

8. **`line_ids` and `worked_days_line_ids` are read-only / computed.** Don't write pay
   lines by hand; they're rebuilt every `compute_sheet` (which first `unlink`s the old
   lines). To change pay, change inputs, the contract wage, or the structure — then
   recompute.

9. **`action_payslip_done` recomputes by default.** Unless `prevent_compute_on_confirm`
   is set, confirming re-runs `compute_sheet` — so late attendance edits made after the
   first compute WILL be picked up at confirm time. If you need a frozen snapshot, confirm
   with the `without_compute_sheet` context or set `prevent_compute_on_confirm`.

10. **Everything is per-`company_id` and role-bounded.** Payslips, attendance, and
    employees are scoped to the tenant company, and the MCP acts as a specific Odoo user —
    a limited role may not see payroll data at all (record rules, not a bug). Confirm the
    tenant DB and your acting user before mutating pay (see [[everjust-platform]] /
    [[everjust-agent-mcp]]).

11. **`everjust_brand_hr_attendance` is cosmetic only.** The sibling auto-install module
    just white-labels the attendance kiosk "Powered by" footer — it changes no data, no
    fields, no computation. Never treat it as part of the payroll logic.
