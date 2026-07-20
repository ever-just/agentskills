---
name: production-revert-discipline
description: Revert a deployed feature safely on a stateful platform (Odoo, Django,
  Rails — anything with DB-backed installs/migrations) and be honest about what a revert
  does NOT undo. Use when asked to "roll back", "revert the commit that broke X", or
  "undo yesterday's deploy". Covers finding the culprit commit (git log -S, --since,
  --stat), checking that no later commits depend on the reverted symbols, syntax-checking
  the reverted tree, writing the revert PR so the deploy risk is explicit, and the
  decay rule: an unmerged revert PR goes stale fast on an active repo — re-validate or
  close it rather than merging weeks later. Complements deploy-log-forensics (attribution
  first, revert second).
---

# Production Revert Discipline

## Overview

`git revert` is easy; a *safe production rollback* is not. On a stateful platform the
code is only half the deployment — databases have installed modules, applied
migrations, created records, and users have learned URLs. A revert PR that is
technically clean can still ship surprises. This skill is the checklist that turns
"revert that commit" into a correct, honestly-described rollback.

## Method

### 1. Identify the culprit precisely

Don't revert "yesterday's stuff" — bind the symptom to one commit:

```bash
git log --since="3 days ago" --oneline                 # candidates in the window
git log -S "string tied to the symptom" --oneline      # the introducing commit
git show <sha> --stat                                  # confirm it touches the surface
```

If server access is unavailable, attribute via the deploy pipeline's logs first
(see `deploy-log-forensics`). Confirm the commit *caused* the behavior rather than
*exposed* pre-existing core/vendor behavior — reverting an exposer removes the route
to the surface, not the surface itself.

### 2. Check what landed on top

A revert conflicts with history semantically before it conflicts textually:

```bash
git log <culprit>..HEAD --oneline -- <paths culprit touched>   # later commits, same files
git grep -l "<symbol added by culprit>" -- ':!<culprit paths>' # later code using its symbols
```

If later commits build on the culprit's models/fields/APIs, a plain revert breaks them
— you're now doing a partial revert or a fix-forward instead. Say so explicitly.

### 3. Execute and self-verify

```bash
git revert --no-edit <sha>
# syntax-only verification floor when you can't boot the app in-session:
python3 -m py_compile $(git diff --name-only HEAD~1 | grep '\.py$')
for f in $(git diff --name-only HEAD~1 | grep '\.xml$'); do xmllint --noout "$f"; done
```

Run whatever static validation the repo has (addon validators, linters, CI locally).
State plainly in the PR what was and wasn't verified ("syntax checks only; this sandbox
cannot boot the app").

### 4. Write the PR to carry the operational truth

A revert PR body must answer, for the person merging it:

- **What it rolls back**, surface by surface (menus, fields, templates, endpoints).
- **What merging does operationally** — if pushes deploy, merging IS a production event
  with its own downtime/restart profile; time it like one.
- **What the revert does NOT undo** (the section everyone forgets — see below).
- **Re-landing path** — what must be fixed before the feature returns; which plan
  docs survive the revert.

### 5. What a revert does NOT undo (stateful platforms)

- **Installed modules / applied migrations stay.** Removing module code from the tree
  does not uninstall it from tenant databases; columns, records, cron jobs, and menus
  registered in the DB persist until an explicit uninstall/migration runs.
- **Exposed core surfaces stay reachable.** If the feature routed users into stock
  framework screens (and, e.g., unbranded vendor UI leaked), the revert removes the
  route, not the screen — direct URLs and other routes may still reach it.
- **User-visible artifacts persist** — sent emails with now-dead links, calendar
  entries pointing at removed endpoints, cached PWA assets. List them.

### 6. The decay rule

An unmerged revert PR on an active repo rots in days: the base branch moves, adjacent
files evolve, and the org may de-facto decide to keep the feature (fix-forward) while
the revert sits open. Before merging a revert older than a few days: re-diff it against
current base, re-run step 2, and check whether later commits already fixed the symptom.
If the platform kept and built on the feature, **close the revert PR** — merging it
would now rip out newer work. Closing a stale revert is a success outcome, not a
failure; say why in a closing comment.

## Pitfalls

- Reverting the merge commit instead of the culprit (`-m 1` needed, different blast radius).
- "Applied cleanly" ≠ "semantically safe" — step 2 is the real check.
- Silent scope creep: a revert PR that also "fixes a small thing" is no longer a revert.
- Announcing success at merge time — on deploy-on-push repos, success is verified
  *after* the deploy completes, on the public URLs, not at merge.

## Combining with other skills

- `deploy-log-forensics` — attribute the culprit before reverting it.
- `web-deploy-verification` — verify the rollback actually reached production.
- `finding-forensic-remediation` — when the answer is fix-forward, not revert.
