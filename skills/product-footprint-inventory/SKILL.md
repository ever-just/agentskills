---
name: product-footprint-inventory
description: Itemize everything a product or company encompasses — code, running infrastructure, web/social presence, data, written IP, commercial rails, ecosystem position, and the development history — by fanning out read-only agents across ~12 dimensions and mining the agent-session transcripts. Use when preparing to sell or buy a product, planning a carve-out, building a data room, answering "what do we actually own", or onboarding to a sprawling estate nobody has mapped.
---

# Product Footprint Inventory

## Overview
A repeatable way to turn a whole product — or a whole company — into an **itemized inventory of everything it encompasses**, internal and external. The output is either an *asset register* (audit framing) or a *complete profile* (report framing); the underlying census is identical.

The method exists because the footprint is always bigger and more scattered than anyone remembers. A one-month-old SaaS product routinely spans a monorepo, six satellite repos, two cloud accounts, nine hostnames, a CRM tenant, an npm org, a payment processor shared with other products, a registrar reseller account, ~80 MB of prospect research, and 40 development sessions whose decisions live nowhere else. No single person holds that map.

The method's value is **coverage plus ownership**. Most inventories are exhaustive about what was *built* and silent about what is *owned* — which is the only question that matters when the thing changes hands.

## When to use
- "We want to sell X — itemize the whole company."
- "What do we actually own?" / "What's our total footprint?"
- Carve-out planning: separating one product from a multi-product estate.
- Buy-side diligence, data-room preparation, insurance or valuation input.
- Onboarding to an estate that grew faster than its documentation.

## Pick the framing FIRST — it changes every prompt

| | **Audit framing** | **Profile framing** |
|---|---|---|
| Deliverable | Asset register + gap register + liabilities | "What it encompasses" — macro→micro description |
| Voice | Evaluative: findings, severity, what to fix | Descriptive: what exists, stated neutrally |
| Reader | Buyer's counsel, your own diligence prep | Data room, CIM annex, internal onboarding, a buyer's first read |
| Sample line | "SCIM is a dangerous gap that must be fixed." | "SCIM v2 is implemented in code and is not mounted in the production binary; `/scim/v2/*` returns 404." |

Same census, different **voice contract**. If you want the profile framing you must state the contract explicitly in every drafting prompt, with banned words — agents default to audit voice and will drift back to it within two paragraphs. Ship both if the user is genuinely selling: the register drives the deal, the profile is what you hand a stranger.

**The banned list that works** (profile framing): *finding, risk, liability, gap, concern, red flag, buyer cares, due diligence, remediation, blocker, alarming, should be fixed, recommend*. Sweep the assembled document for them before delivery; expect a handful of legitimate survivors (real filenames like `REMEDIATION-MASTER-PLAN.md`, branch names like `fix/*-remediation`).

## Cardinal rules
1. **Read-only, everywhere, no exceptions.** Enumerate; never mutate. No deploys, no writes, no config changes, no mutating API calls. Cloud calls are `describe`/`list` only. Say this in every subagent prompt — a curious agent will otherwise "just check" by writing something.
2. **Never emit credential values.** Agents may *use* a key (read it from a config file, call an API) but must refer to it in output only by name and purpose: "Cloudflare token scoped to customdomain.ai exists." Regex-sweep the final deliverable for key prefixes before shipping.
3. **Separate BUILT from OWNED.** The classic failure mode is a magnificent engineering census that answers nothing about title. Every asset carries *where it lives* and *whose account holds it*.
4. **Absence is a finding.** "No X account, no LinkedIn page, no backlinks, no ad spend, zero paying customers" is as material as anything present. Instruct the presence agents to report absent channels explicitly, as their own asset class.
5. **Numbers or it didn't happen.** Every entry carries a count, path, version, hostname, LOC, or date. "Comprehensive documentation" is worthless; "95 markdown files, ~382,100 words" is an asset.
6. **Surface conflicts; don't silently resolve them.** Two agents *will* return different counts for the same thing (sitemap URLs, blog posts, merged templates). Report both and say they disagree. Picking one silently is how a wrong number reaches a buyer.
7. **Get the commercial reality early.** Pull actual subscription and revenue numbers from the payment processor in the first wave. A product with $2.99 lifetime revenue is a technology asset sale, and that reframes every other section. Discovering it last means rewriting everything.
8. **Shared infrastructure is the headline, not a footnote.** If the product bills through a shared payment account, runs in a shared cloud account, and depends at runtime on a sibling product's hostname, you are inventorying a **carve-out**, not a company. Detect this deliberately — it is the single most valuable output.

## The twelve dimensions
One agent per row. This partition is the reusable core of the skill; it was built to have no overlap and no hole.

| # | Dimension | What it enumerates | Notable trap |
|---|---|---|---|
| 1 | **Backend / services** | Every service module: files, LOC, test files, purpose, deployment state | LOC per service via `find … \| xargs wc -l`; distinguish binaries from libraries mounted into another binary |
| 2 | **Apps & client packages** | Frontends, SDKs, widgets; npm/PyPI publication state | `npm view <name> version` — published ≠ what's in the repo (drift is common) |
| 3 | **Docs & written IP** | Doc trees, ADRs, whitepapers, build specs, **the LICENSE** | Licensing is often self-contradictory across repos; record every statement verbatim, resolve nothing |
| 4 | **Infrastructure & IaC** | IaC tree + a live read-only cloud enumeration; run-rate | Tag every resource sale/no-sale; a shared account needs per-resource attribution |
| 5 | **Knowledge vault / research corpus** | Standalone research, blueprints, decision records | Often larger than the codebase and independently transferable |
| 6 | **GTM & lead data** | Prospect datasets, enrichment pipelines, CRM tenant, campaign stats | Note lawful-basis and *where it physically lives* — usually not in the product DB |
| 7 | **Live web presence** | Sitemap enumeration, every hostname, schema/llms.txt, live probes | Enumerate the sitemap in full; probe each subdomain for status + version |
| 8 | **Social & external footprint** | Accounts, directory listings, mentions, backlinks — **and absences** | The most-skipped dimension; absence is the deliverable |
| 9 | **VCS & code governance** | Org, repos, PR/issue history, branches, contributors | Contributor identities → IP-assignment exposure; count commits per author |
| 10 | **Local docs & institutional memory** | Planning docs on disk, agent memory files, legacy dirs | Memory files encode operational knowledge that exists nowhere else |
| 11 | **Commercial rails** | Payment processor catalogue/subscriptions/revenue, registrar/reseller accounts | Read-only GETs only; report aggregates, never customer PII |
| 12 | **DNS, domains & certificates** | Zone records, subdomains, CAA, email auth, TLS, registrar, expiry | The domain registration is usually *the* asset and usually undocumented |

Adjust the partition to the estate — a hardware product swaps dimension 12 for supply chain — but keep the **shape**: one agent per bounded surface, no two agents sharing a surface.

## Phases

**0 — Scout inline first (cheap).** Before spawning anything, list the candidate directories, repos, and session-project dirs yourself. Confirm the repo path, the remote, the session-transcript directories, and which tools exist (`jq`, `gh`, cloud CLIs). Fanning out blind means twelve agents independently rediscovering the same directory tree.

**1 — Fan out the twelve inventory agents.** A `parallel()` barrier is correct here: the completeness critic in phase 3 genuinely needs all of them at once. Give every agent the same preamble (read-only, no secrets, structured output, 1–2 sentence descriptions with numbers) and a `status` enum: `live | built-not-deployed | draft | in-progress | deprecated | unknown`.

**2 — Session archaeology.** Mine the agent-session transcripts for the work history — see `claude-session-archaeology`. This recovers what was built, what was blocked, what was decided, and what was done but never committed. Split by directory and filename range, one agent per slice.

**3 — Completeness critic.** One high-effort agent, briefed as **buyer's counsel**, fed the *compacted* asset list. Require it to probe, by name: trademark filings, the legal contracting entity, domain chain of title, the production database and its PII, partner/reseller account novation and anti-assignment clauses, IP assignment from outside contributors, legal pages (ToS/privacy/DPA/subprocessors) and whether they are placeholder-bearing, insurance/tax, analytics and ad accounts, usage telemetry, signed customer contracts, escrow and credential-transfer mechanics, and which asset classes have suspiciously thin coverage. This phase produces the findings the census structurally cannot.

**4 — Synthesis.** Dedupe, group into a reader's taxonomy (not the raw category strings — you will have ~100 of those and need ~10), then write. For the profile framing, fan out one writer per section against the raw asset records, each opening macro and then going micro; assemble and harmonize yourself so the voice stays single.

## Output shapes
Force structured output from inventory agents:

```json
{ "assets": [ { "category": "...", "name": "...", "description": "1-2 sentences with numbers",
                "location": "path or account", "status": "live|built-not-deployed|draft|in-progress|deprecated|unknown",
                "sale_relevance": "why it matters" } ],
  "highlights": "...", "gaps_or_risks": "..." }
```

**Compact before critique.** The full records run 150–200 KB. The critic gets one line per asset — `category :: name [status]` — which lands around 20 KB for 260 assets and produces a sharper critique than the full dump, because it can hold the whole estate at once.

## Workflow mechanics that will bite you
- **The journal is the source of truth.** `<transcriptDir>/journal.jsonl` holds one `{"type":"result"}` line per completed agent with its *full* return value. The task notification truncates. Always `jq -c 'select(.type=="result") | .result' journal.jsonl > results.jsonl` and query the file.
- **Resume caching is same-session only.** Resuming a killed run from a *new* process re-runs every agent from scratch. If a run dies, read the journal, work out precisely which agents are missing, and launch a **fresh workflow containing only those** — never a blind resume.
- **Usage limits kill agents mid-run.** Partial results survive in the journal. Harvest them before relaunching.
- **Never `echo "$line" | jq` in a shell loop over JSON.** Embedded control characters break it. Write `jq -c … > file.jsonl` and query the file by line.
- **Scratchpad directories can be cleared between sessions.** Persist anything you'll need for synthesis into the deliverable folder as you go.
- **Sub-agents can verify live numbers.** Section writers given repo access will re-derive and sharpen figures (exact LOC, commit counts, running version). Let them; it beats reusing an earlier agent's rounding.

## Pitfalls
- **Fanning out before scouting.** Twelve agents, one directory tree, twelve rediscoveries.
- **An engineering census with no ownership layer.** Exhaustive and useless for the actual question.
- **Trusting a single agent's count.** Cross-check anything headline-worthy; report disagreements.
- **Missing the absences.** A footprint map with no negative space reads as evasive.
- **Ignoring prod-vs-source drift.** The repo is not the business; only the deployed subset is. Capture deployed versions per service and diff against HEAD.
- **Audit voice in a profile deliverable.** Sweep for banned words; agents drift.
- **Secrets in output.** Regex-sweep for key prefixes (`sk_live_`, `rk_live_`, `ghp_`, `AKIA`, `cfut_`, `dop_v1_`, `sk-ant-`, …) before you ship anything.
- **Letting the critic see the raw dump.** It blows context and weakens the critique.

## Combining with other skills
- `claude-session-archaeology` — phase 2; the development history and the work that never reached git.
- `verification-audit` — cross-verify headline claims against independent sources before they reach a buyer.
- `company-legal-reputation-research` — the external legal/reputation layer on the selling entity.
- `production-agent-audit` — if the product *is* an AI-agent platform, that skill supplies the behavioral layer this one doesn't cover.
- `deep-research` — when external market/competitor context belongs in the same deliverable.
