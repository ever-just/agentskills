---
name: deploy-log-forensics
description: Reconstruct what changed on production — which commit, which module, which
  tenant, at what time — from CI/CD run logs when you have NO server access (no SSH, no
  cloud credentials). Use when asked "what broke production / when did X appear / which
  deploy carried this change" and the only evidence available is git history plus the
  deploy pipeline's own logs. Covers mapping workflow runs to commit ranges, mining job
  logs for change markers (changed-module lists, per-tenant update sections, restart
  timestamps), separating the commit that CAUSED a behavior from the commit that EXPOSED
  it, and the hygiene rules for dispatching diagnostic workflow runs (environment
  protection rules, temp-commit cleanup). Complements web-deploy-verification (which
  verifies a change IS live); this skill attributes what went live and when, after the fact.
---

# Deploy-Log Forensics

## Overview

When production misbehaves and you cannot shell into the server, the deploy pipeline's
own logs are a complete, timestamped record of what reached production. Every CI/CD run
binds together: a commit SHA, a set of changed files/modules, the deploy actions taken
per target (tenant, service, region), and wall-clock timestamps. Correlating that record
with git history answers "what changed, where, and when" without ever touching the box.

This is the inverse of deploy *verification*: `web-deploy-verification` proves a change
you just merged is live; this skill works backwards from a symptom to the deploy and
commit that shipped it.

## When to use

- A user reports something appeared/broke "in the last N days" and you must attribute it.
- SSH keys, cloud credentials, or VPN access are unavailable or expired in your session.
- You need to know whether a specific module/tenant/service was actually updated by a
  given deploy (not just whether the commit is on the default branch).

## Method

### 1. Establish the suspect window from the symptom

Ask (or infer) when the behavior first appeared. Convert to UTC. All later correlation
happens in UTC — mixed-timezone reasoning is the #1 source of false attribution
(cross-reference: `temporal-finding-validation`).

### 2. List deploy runs in the window

With the GitHub MCP tools or `gh`:

```bash
# GitHub MCP: actions_list (workflow runs for the deploy workflow, newest first)
# CLI equivalent:
gh run list --workflow deploy.yml --branch master --json databaseId,headSha,createdAt,conclusion
```

Each run's `headSha` bounds a commit range: `previous_run.headSha..this_run.headSha` is
exactly what this deploy carried. A commit being on `master` does NOT mean it deployed —
check for `paths-ignore` (docs-only pushes may skip deploys) and for failed runs.

### 3. Mine the job logs for change markers

Pull logs for the runs in the window (`get_job_logs` / `gh run view --log`). Deploy
scripts announce what they did — grep for the pipeline's own markers, e.g.:

- changed-module / changed-path computations (`CHANGED_MODULES=`, `rsync` file lists)
- per-target sections ("Updating tenant X", "-u module_a,module_b", service restart lines)
- classification decisions ("class=light/full", "skipping tenant", warnings)
- timestamps on each step — these give you the minute a change went live per target

This tells you, per deploy: which modules were updated on which tenants at what time.
A module merely present in the repo but never `-u`-updated on a tenant may still be
running old code there — the logs are the truth, not the tree.

### 4. Correlate with git history

```bash
git log --since=<window-start> --until=<window-end> --oneline master
git log -S "<literal string from the symptom>" --oneline   # find the introducing commit
git show <sha> --stat                                       # what surface it touched
```

Match candidate commits to the deploy run that carried them (step 2's ranges), then
confirm the module they touch was actually updated on the affected target (step 3).

### 5. Distinguish CAUSED from EXPOSED

The commit that made a symptom visible often did not create the offending code. A
change can *expose* pre-existing (stock/framework/vendor) behavior by routing users to
a screen, menu, or code path they never reached before. Test: search the entire history
for the offending string/element —

```bash
git log -S "offending string" --all --oneline
```

If it never appears, the symptom lives in vendor/core code and your commit merely
exposed it. The fix is then an override/branding/guard layer, and — critically — **a
revert will not remove the underlying surface** (see `production-revert-discipline`).

### 6. If logs aren't enough: dispatch a read-only diagnostic run — carefully

If the pipeline has a read-only ops workflow (status dump, module listing), you can
dispatch it for fresh evidence. Two hard-won rules:

- **Environment protection rules block prod-scoped workflows from non-default
  branches.** A `workflow_dispatch` pinned to a protected environment will be rejected
  when dispatched from your feature branch ("Branch not allowed"). Don't fight it —
  fall back to mining existing run logs (step 3), which usually suffice.
- **Temp-commit hygiene:** if you must push a temporary workflow tweak to test a
  dispatch, drop it afterwards (`git reset --hard <before> && git push --force-with-lease`)
  so the diagnostic never lands in the PR. Never leave diagnostic commits in history.

## Output form

Report attribution as a chain, each link cited:

> Symptom S first reachable after **deploy run R** (started `<UTC time>`, workflow log:
> "Updating tenant T: -u module_m"), which carried **commit C** (`<sha> <subject>`),
> the only commit in R's range touching that surface. C exposed/caused S because …

## Pitfalls

- **"It's on master" ≠ "it's deployed."** Failed runs, `paths-ignore`, and scoped
  per-module updates all break that equivalence.
- **Retro-fitted assumptions.** Verify the log actually says the module updated on the
  *specific* tenant/target that shows the symptom — pipelines skip unhealthy targets.
- **Local-time drift.** Deploy logs are UTC; user reports rarely are.
- **One deploy, many commits.** A run can carry dozens of commits — narrow with
  `git log -S`/`--stat` inside the run's range, don't blame the merge commit.

## Combining with other skills

- `web-deploy-verification` — forward-looking twin (confirm a fix IS live after you ship it).
- `production-revert-discipline` — what to do once you've attributed the culprit.
- `temporal-finding-validation` — UTC-normalized timeline discipline for findings.
- `github-actions-ec2-deploy` — builds the kind of pipeline whose logs this skill mines.
