---
name: production-agent-audit
description: End-to-end methodology for auditing a production AI-agent platform from its REAL logs — census, total multi-source extraction, fan-out analysis, adversarial verification, and graded synthesis. Use when asked to review how deployed AI agents are performing across channels (SMS/email/voice/chat), judge tool-calling/adherence, or produce an objective good-vs-bad report from server logs + database + error tracker.
---

# Production Agent Audit

## Overview
A repeatable way to turn a live AI-agent product's exhaust (database, HTTP request logs, error tracker, container stdout) into an **objective, evidence-bound report card**: what the agents are doing, what works, what fails, and where. Built for systems where AI agents talk to real people over multiple channels and call tools.

The method's whole value is **discipline**: pull *everything*, triangulate every claim across ≥2 sources, read *every* record (don't sample), and adversarially verify before you commit a finding.

## When to use
- "Review how our agents have been doing — audit the logs for the last N weeks."
- "Are the agents doing what users ask? Using tools correctly? Where are they failing?"
- Any objective good/bad review of a deployed multi-channel agent system.

## Cardinal rules (these are the audit)
1. **Triangulate across ≥2 sources.** A claim from one source is "unconfirmed." DB activity ↔ HTTP request logs (with bodies) ↔ container stdout ↔ error tracker (Sentry) should agree. Conflicts are findings.
2. **Exhaustive, not sampled.** Small systems (tens of agents) are fully readable — read every conversation/thread end-to-end. Sampling hides the tail where the bugs live.
3. **Framing: dogfood vs customer.** Quantify what share of traffic is the founders/internal testing vs real external users. Weight severity by *real customer blast radius* — a scary defect that only ever hit an internal test agent is "latent landmine," not "customer incident."
4. **Hyper-aware of timestamps, all UTC.** Note ordering anomalies, scheduled-vs-fired drift, and timezone bugs. Commit times are usually in the committer's local zone — normalize before comparing (see `temporal-finding-validation`).
5. **Attribution: infra vs model.** A voice failure may be the realtime/ASR vendor, not the LLM. A 403/credit error is billing/infra. Separate "the agent reasoned badly" from "the platform failed the agent."
6. **Evidence mandatory.** Every finding needs a UTC timestamp + the agent's name (resolve ObjectIds via a name map) + a verbatim excerpt or exact count.

## Data-source map (find all of them — most audits miss half)
| Source | What it gives you | Gotcha |
|---|---|---|
| Mongo activity collection | the behavioral spine: typed events, SMS/voice content in `details`, tool_call `{toolName,input,result,latencyMs,allowed}` | conversation *metadata* collections often have NO embedded messages — content lives in the activity log |
| HTTP request logs (e.g. `apilogs`) | true latency, 5xx/4xx by route, **request/response bodies** (the user's actual typed messages) | huge; pull aggregates + error rows + content-bearing routes, not all rows |
| Error tracker (Sentry) | stack traces, frequency, firstSeen/lastSeen — a whole class of bugs the activity log never records | the issue list's statsPeriod is capped; per-issue `culprit` ≠ per-org attribution; check in-window vs pre-window per issue |
| Container logs (api/redis/mongo/nginx) | crashes, restarts, worker/queue state, raw transcripts | stdout only goes back to the last container recreation; earlier history is DB/Sentry only |
| Provider APIs (email/SMS/voice) | ground-truth delivery vs the platform's *recorded* status | optional; needs their keys |

## Phases
**0 — Access & census.** Confirm you're on the LIVE host (resolve DNS / health-check; infra docs are often stale and point at a decommissioned server). Get a read-only shell (see `ec2-instance-connect-data-pull`). Count every collection + the activity-type histogram + per-day volume to size the job and find the dominant channels/agents.

**1 — Total extraction.** Dump every relevant collection (full or windowed) to local JSONL; compute HTTP-log aggregates server-side; pull the error tracker (with stack traces) and all container logs. Build a `name_map` (agentId/orgId → readable name) so findings are legible.

**2 — Ground-truth reconstruction.** Merge sources into one UTC-ordered timeline per (agent, contact, thread, call). Profile every agent — including the *idle* ones (why no activity? never configured? broken?).

**3 — Dimension workstreams (exhaustive + triangulated).** One per: each channel (SMS/email/voice/Slack/IG), admin-relay & adherence, dashboard-chat performance, tool-calling, guardrails/safety, follow-ups/scheduling, infra/reliability, cost/model-routing, timezone forensics, config/prompt quality, and "what users ask → adherence rate per intent."

**4 — Adversarial verification.** Re-derive every finding from raw data independently; a skeptic pass refutes; audit the metrics (denominators, and dedup of double-counted log rows). A "completeness critic" asks what's still unexamined.

**5 — Synthesis.** Graded scorecard per area, ranked findings (customer-weighted) each with multi-source evidence + root cause (`path:line`), per-agent report cards, an incident timeline, and a **coverage/limitations matrix** (what each source could and couldn't show).

## The multi-agent engine
Run phases 3–5 as a workflow (see `adversarial-verification` pattern, embedded here): build a **yardstick** (reconstruct what the agents are *supposed* to do, from the prompt-assembly code + recent commits) → fan out one **finder** per dimension over the raw data + code → **adversarially verify** each finding (require a second corroborating source) → **completeness critic** → **synthesizer** writes the report. Scale the fan-out to the ask: a few finders for "any bugs?", 10–14 + verification for "comprehensive audit."

## Pitfalls
- **Auditing the wrong server.** DNS/health-check the live host first; the IP in the README is often the old box.
- **Reading a curated slice.** If you only pull the activity log you miss Sentry's broken-rate-limiter/queue-null/tz-crash class and the request bodies that show what users actually typed.
- **Counting log rows as facts.** Tools sometimes log twice; a "2/4 failure" may be a duplicate-row artifact (really 2/2). Dedup before you quote a rate.
- **One pass, no verification.** The first finder pass overstates and misquotes; the verifier pass is where the report becomes trustworthy.
- **Over/under-stating severity.** Always lead with the dogfood-vs-customer split so nothing is mis-weighted.

## Combining with other skills
- `ec2-instance-connect-data-pull` — get the shell + extract the data (phase 0–1).
- `agent-quality-grading` — the qualitative layer (grade each conversation/asset/prompt).
- `finding-forensic-remediation` — turn the findings into an engineer-ready fix backlog.
- `temporal-finding-validation` — confirm each finding is still live vs already fixed by a commit.
- `conversation-review`, `mongodb-schema-audit`, `sentry-instrumentation` — adjacent platform-ops skills in this repo.
