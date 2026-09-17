# Pipeline spec (v1)

```
runtime SDK ──(redact L1)──> Sentry org everjust ──(scrub L2)──> bridge Worker (cron, every 5 min)
   │                                                               │ redact L3 + canary
   │ "Report this problem" (captureFeedback)                       ▼
   └──────────────────────────────────────────────> GitHub issue (App bot, label auto-reported)
                                                                   │
                                                  gate workflow in product repo (gitleaks + trufflehog, L4)
                                                                   │ adds devin:fix
                                                                   ▼
                                                  Devin Automation ─> draft PR "Fixes #N" ─> human merge
```

## Components

| Component | Where | Identity |
|---|---|---|
| SDK hooks | each runtime | Sentry DSN (public, not a secret) |
| Sentry | org `everjust`, Developer plan | n/a |
| Bridge | Cloudflare Worker `auto-issue-bridge`, repo `EVERJUST-DEV/auto-issue-bridge`, D1 database `auto_issue_bridge` | Sentry org auth token (Worker secret), GitHub App private key (Worker secret) |
| Gate | `.github/workflows/auto-issue-gate.yml` in each product repo | `GITHUB_TOKEN` (issues: write) |
| Fixer | Devin Automation in org EVERJUST | Devin GitHub App, org System User |

No GitHub write credential lives in a browser or on a product box. No Devin credential lives in GitHub.

## Project to repo map

Configured in the Worker as JSON (`PROJECT_MAP`). Unmapped projects are ignored.

| Sentry project | Repo | Surface |
|---|---|---|
| customagents-api | ever-just/app.customagents.io | api |
| customagents-dashboard | ever-just/app.customagents.io | dashboard |
| customagents-admin | ever-just/app.customagents.io | admin |
| customdomain-control-plane | CUSTOM-DOMAIN-APP/custom-domains | control-plane |
| customdomain-edge | CUSTOM-DOMAIN-APP/custom-domains | edge |
| customdomain-mcp | CUSTOM-DOMAIN-APP/custom-domains | mcp |
| customdomain-app | CUSTOM-DOMAIN-APP/custom-domains | app |
| everjust-odoo | ever-just/ww.everjust.app | odoo |
| everjust-control-plane | ever-just/ww.everjust.app | control-plane |
| everjust-mail | ever-just/ww.everjust.app | mail |

## Poll cycle (every 5 minutes)

1. If `ENABLED` is not `true`, exit. This is the kill switch.
2. For each mapped project, list issues with
   `GET /api/0/projects/everjust/{project}/issues/?query=is:unresolved lastSeen:-60m&statsPeriod=24h&limit=100`
   and follow `Link` pagination up to 5 pages. Log how many were skipped if the page cap is hit.
3. Drop anything that is not ours or not worth an issue (see "Filters").
4. Look up the Sentry issue id in D1 table `issues`.
   - **Not tracked, passes threshold:** build the issue (issue-format.md), run the canary, respect caps, create it, store the mapping.
   - **Not tracked, below threshold:** upsert into table `suppressed` with counts. Nothing is filed. `GET /suppressed` (authenticated) lists them so nothing is silently dropped.
   - **Tracked, GitHub issue open:** if the stats block was last updated more than 24 hours ago, or the event count doubled since, rewrite the stats block in place. Never comment per event.
   - **Tracked, GitHub issue closed as completed, Sentry substatus `regressed` (or lastSeen after the GitHub close time):** reopen, add label `regression`, comment once with the release it came back in. Clear `devin:fix` so the gate can re-evaluate.
   - **Tracked, GitHub issue closed as not planned:** do nothing. That is the mute.
5. Resolution sync, every 30 minutes:
   - GitHub issues closed as completed since the last run: resolve the Sentry issue with `{"status":"resolvedInNextRelease"}`. If the token cannot write, log it and continue.
   - Tracked Sentry issues now `resolved` whose GitHub issue is open and has no linked open PR: comment "Resolved in Sentry" and close as completed.
6. Feedback: list `issue.category:feedback` for mapped projects since the last run. For each feedback item with an associated event id that belongs to a tracked issue, add one comment with the neutralized, redacted note inside a text fence under the heading "User report (untrusted)", and add label `has-user-report`. Feedback never creates a new issue.

## Filters

Drop when any is true:

- `issueCategory` is not `error`, or `level` is not `error` or `fatal`.
- Title or type matches the project's ignore list (`IGNORE` JSON per project). Start with: `ResizeObserver loop`, `Script error.`, `Load failed`, `Failed to fetch` (browser surfaces only), `AbortError`, `NetworkError when attempting to fetch resource`, `ChunkLoadError` (label instead if count is high), `Failed to find Server Action`.
- The event comes from a non production environment.

Label `external` (file, but never send to Devin) when the exception or culprit points at a third party:
OpenAI or Anthropic quota and rate limits (`429`, `insufficient_quota`, `no credits`), Stripe API errors,
Twilio, Sendblue, Instagram or Meta `OAuthException`, SES throttling, Name.com, DNS provider API errors.
The regex list lives in `EXTERNAL` in the Worker config.

## Threshold

File when any is true within the last 24 hours:

- 3 or more events
- 2 or more distinct users or tenants
- level is `fatal`, or the exception is unhandled (`isUnhandled`)

## Caps

| Cap | Default | On hit |
|---|---|---|
| New issues per repo per hour | 5 | queue in D1 `pending`, retry next cycle |
| New issues per repo per day | 20 | same |
| GitHub content writes per cycle | 40 | stop the cycle, continue next time |
| Spam brake: open auto issues sharing one culprit | 3 | stop filing that culprit, count in `suppressed` |

GitHub's own limits are 80 content writes per minute and 500 per hour; stay far below them.

## Dry run

`DRY_RUN=true` sends every write to `EVERJUST-DEV/auto-issue-sandbox` instead of the mapped repo.
The title is prefixed `[dry-run][<repo short name>]` and label `dry-run` is added. Everything else,
including the gate and caps, behaves the same. Rollout starts here.

## Gate (in each product repo)

Runs on `issues: [opened, reopened, labeled]` when the issue author is the bridge App bot and the
issue has `auto-reported`.

1. Write title and body to a file. Run gitleaks with `spec/canary.gitleaks.toml`
   (`--ignore-gitleaks-allow`) and trufflehog (`--no-verification --fail`), both pinned by version.
2. Leak found: replace the body with "Redaction canary tripped for <Sentry short id>. Rule ids: ...",
   add `redaction-tripped`, remove `devin:fix`, and stop. Treat it as a redaction bug to fix in the
   SDK or bridge. The edit history on GitHub still holds the original body, so also notify the owner
   to delete the issue.
3. Clean, and none of `external`, `has-user-report`, `redaction-tripped`, `needs-human`, `dry-run`
   (unless the repo is the sandbox) are present, and repo variable `DEVIN_AUTOFIX` is `true`:
   add `devin:fix`.

## Devin

See devin.md. The automation fires only on `labeled` with `devin:fix` where the sender is
`github-actions[bot]`. Limits: 10 ACU per session, 10 runs per day, 1 concurrent, queue 10.

## State (D1)

```sql
create table issues (
  sentry_id text primary key, project text not null, repo text not null,
  gh_number integer not null, gh_state text not null default 'open', gh_state_reason text,
  fingerprint text not null, culprit text, created_at text not null,
  stats_updated_at text, last_count integer default 0, regression_count integer default 0
);
create table suppressed (
  sentry_id text primary key, project text not null, reason text not null,
  count_24h integer, users_24h integer, last_seen text, updated_at text not null
);
create table pending (sentry_id text primary key, project text not null, queued_at text not null);
create table cursors (name text primary key, value text not null);
```

## Secrets and config

| Name | Kind | Source |
|---|---|---|
| `SENTRY_TOKEN` | Worker secret | 1Password `EJ-Infra / Sentry - org everjust - prod` |
| `GITHUB_APP_ID` | var | the App's settings page |
| `GITHUB_APP_PRIVATE_KEY` | Worker secret (PKCS#8 PEM) | 1Password `EJ-Infra / GitHub App - auto-issue-reporter - prod` |
| `ADMIN_TOKEN` | Worker secret | random, for `GET /suppressed` and `POST /run` |
| `HASH_SALT` | Worker secret | random, for tenant and user hashes |
| `ENABLED`, `DRY_RUN`, `PROJECT_MAP`, `IGNORE`, `EXTERNAL`, caps | vars | wrangler.toml |

Move secrets with a pipe you never print, for example
`op read "op://EJ-Infra/Sentry - org everjust - prod/credential" | npx wrangler secret put SENTRY_TOKEN`.
