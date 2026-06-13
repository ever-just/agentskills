---
name: temporal-finding-validation
description: Cross-check each audit finding's REAL observation timestamp against the commit/deploy timeline (with timezone normalization) to decide whether it is STILL LIVE or already fixed by a commit — so you never report a resolved issue as open (or a still-broken one as fixed). Use to validate a findings list against git history before finalizing an audit.
---

# Temporal Finding Validation

## Overview
A finding observed on May 26 might have been fixed by a May 28 commit — making the observation **stale**, not an open bug. The only way to know is to line up each finding's *observation timestamp* against the *commit/deploy timeline*. The subtle, verdict-flipping part is **timezone**: data is UTC, git commit times are in the committer's local zone. Skip the conversion and you will mis-rule issues in both directions.

## When to use
- Before finalizing any audit: "make sure things I flagged weren't already fixed."
- "Time-analyze the findings — are these still relevant given recent commits?"

## The cardinal timezone rule
- Data `createdAt` / log timestamps are **UTC** (`...Z`).
- `git log --date=iso-strict` prints the **committer's** offset (e.g. `-05:00`). **Convert to UTC** (add the offset) before any comparison. Example: `2026-06-04T13:06:14-05:00` == `2026-06-04T18:06:14Z`.
- **Deploy model**: push-to-main auto-deploys, so a fix is live in prod ~minutes after its commit-to-main time (use commit-time + a few minutes as a deploy-time proxy; note it's a proxy).
- **Anchor on HEAD**: anything observed *after* current HEAD's UTC time provably ran on current code → cannot have been fixed → `STILL_LIVE`.

## Method per finding
1. **Observations** — pull the **first and last** observation UTC from the raw data (the activity/log/asset/Sentry-firstSeen records that evidence the issue).
2. **Fix commits** — `git log --date=iso-strict -S'<symbol>' -- <file>` and `git show <hash> -- <file>`; UTC-convert each candidate's time. Read the diff — a commit *message* claiming a fix is not proof.
3. **Mechanism check** — read the **current** code: is the buggy construct still present (`path:line`)?
4. **Verdict** — with explicit temporal logic (lastObs vs fixUTC vs HEAD):

| Verdict | Means |
|---|---|
| `STILL_LIVE` | mechanism present in HEAD, or observed after HEAD's time |
| `RESOLVED_DEPLOYED` | fix UTC precedes the last observation, current code clean, no observation after the fix |
| `RESOLVED_MID_WINDOW` | fixed during the window; observations exist ONLY before the fix → stale, not currently relevant |
| `PARTIAL` | a commit fixed part; residual remains in current code |
| `STALE_OBSERVATION_ONLY` | the only evidence predates an already-existing fix |

## Danger zones (where verdicts flip — scrutinize hardest)
- **Clusters of fix-commits near an observation window** — e.g. several "send_bulk_email"/"PDF quality" commits landing days after the matching observations. That's exactly where a finding may be fully/partially resolved.
- **A single observation minutes before its fix commit** — almost certainly `STALE_OBSERVATION_ONLY` (real example: an emoji-mojibake PDF generated ~12 min before its emoji-strip fix commit).

## Output
- **Rollup** by verdict (how many survive as `STILL_LIVE`).
- **Master status table**: id · title · firstObs(UTC) · lastObs(UTC) · fixCommit(UTC or none) · final verdict.
- **Corrections to prior reports** — explicitly list any finding whose status changed, with the temporal reason, so the audit/backlog can be amended.

## Pitfalls
- **Forgetting the UTC conversion** silently flips verdicts — it is the #1 error.
- **Trusting commit messages** — always read the diff and confirm the current code.
- **An observation after HEAD is definitively live** — don't let a plausible-looking earlier commit talk you out of it.
- **Deploy ≠ commit exactly** — local commits can be pushed later; if precision matters, check the server's deployed git SHA or the container build/restart time.

## Combining with other skills
- `production-agent-audit` / `agent-quality-grading` — produce the findings to validate.
- `finding-forensic-remediation` — consumes these verdicts as the authoritative "status" per finding.
