---
name: finding-forensic-remediation
description: Turn audit findings into an engineer-ready remediation backlog via per-finding code + git forensics — confirm the root cause at path:line in CURRENT code, git-blame when it broke, git-log whether any commit fixed it, check uncommitted work, assign a status, and write the exact before→after fix + test + effort + priority. Use after an audit to make findings actionable instead of just descriptive.
---

# Finding → Fix: Forensic Remediation

## Overview
An audit that says "X is broken" isn't actionable until it also says **why (code), when it broke (git), whether it's still live, and exactly what to change.** This skill is the forensic pass that produces a prioritized, diff-level backlog an engineer can start from cold.

## When to use
- After a `production-agent-audit` (or any review) that produced a findings list.
- "Make the report actionable." / "What's outstanding and how do I fix it?"

## The deploy-timing insight (do this first)
Establish the baseline so "still live" has meaning:
```bash
git rev-parse HEAD; git log -1 --format='%h %cI %s'      # current HEAD + time
git rev-list --left-right --count origin/main...HEAD       # ahead/behind origin
git status --short                                         # uncommitted work
git log --since=<window-start> --date=iso-strict --pretty='%h %cI %s'  # the deploy timeline
```
Deploy model is usually **push-to-main auto-deploys**. So: code in `origin/main` is deployed; an **uncommitted** "fix" in the working tree is **not** deployed; if HEAD is older than the last observed bug, that bug ran on current code (still live). State this baseline once; every finding references it.

## Forensic method per finding
1. **Confirm in current code.** Open the cited file and locate the *real* construct — line numbers in the audit may have drifted, so re-find by symbol/content and cite the **current** `path:line`. Explain the mechanism plainly.
2. **When introduced** — `git blame -L <a>,<b> -- <file>` and/or `git log -S'<symbol>' --oneline -- <file>`. Report the introducing commit hash + date + message.
3. **Changed since** — `git log --since=<date> -- <file>`; read messages and `git show <hash> -- <file>` diffs. Did any commit touch / partially fix / regress it? A commit *message* is not proof — read the diff.
4. **Uncommitted** — `git diff -- <file>`. Is there a local fix that isn't deployed? (And does it actually help — or make things worse? See pitfalls.)
5. **Status** — one of `outstanding | partially_fixed | fixed_undeployed | fixed_deployed | not_reproducible`, justified with the git evidence + the baseline.
6. **Exact fix** — the specific change as **before → after** (or a tight patch sketch), minimal and safe; a regression **test** to add; **effort** (S<1h / M half-day / L multi-day); **risk**; dependencies/ordering.
7. **Priority** — P0 (data-loss/safety/customer-facing now), P1 (will hurt at scale/GA), P2 (quality), P3 (hygiene). Weight by real blast radius, but treat irreversible-send / fabrication / silent-drop classes as high regardless.

## Output
- **Status rollup**: how many findings are outstanding vs partially vs fixed, anchored on HEAD.
- **Prioritized backlog (P0→P3)**: id · title · status · introduced-by (commit+date) · exact fix · effort.
- **Quick wins** (S-effort one-liners: an allowlist entry, an enum value, registering a handler).
- **Needs design** (L-effort/architectural).
- **Per-finding detail** with before→after, test, risk.
- **Fix sequencing** (e.g. "correct the allowlist *before* relying on the guard that reads it").

## Pitfalls
- **Trusting the audit's line numbers** — re-locate by symbol; code moves.
- **Commit message ≠ fix** — "fix: empty PDF pages" may not actually fix the footer-overflow line; read the diff and the current code, and prefer a live repro.
- **An uncommitted "fix" can be a landmine** — review it before recommending a deploy; a broad guard-bypass can *worsen* the very class it claims to address. Flag "do NOT ship as-is" explicitly when true.
- **Fixes that aren't minimal/safe** — propose the smallest change that addresses the mechanism; note blast radius and shared dependencies (e.g. a shared retry singleton used by multiple channels).

## Combining with other skills
- `production-agent-audit` — produces the findings this skill remediates.
- `temporal-finding-validation` — the rigorous timeline check feeding the "status" field.
