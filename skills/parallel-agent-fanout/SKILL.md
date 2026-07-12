---
name: parallel-agent-fanout
description: Battle-tested methodology for orchestrating many concurrent subagents to build or audit a large dataset — a 3-wave discovery→pull→synthesis pipeline with shared instruction templates, a strict no-delegation rule, file-on-disk completion checks, batching, incremental commits, and a recombine + row-integrity validation step. Use when a task is too large for one context (hundreds of companies/files/records), when you're fanning out research or extraction across batches, when subagents must write results to disk without clobbering each other, or when you need to detect and re-run subagents that stalled or self-delegated. Model-agnostic; complements task/agent tooling.
---

# Parallel Agent Fan-Out

## Overview

How to run **dozens of concurrent subagents** to produce one coherent, verified
dataset — reliably, without lost work, silent truncation, or agents that quietly
delegate and return nothing. This is the orchestration layer beneath any large
research/extraction job.

Use this skill when you need to:
- Process hundreds of items (companies, files, URLs, records) that won't fit one context
- Fan out research/extraction across batches and merge the results deterministically
- Have many agents write to disk in parallel without overwriting each other
- Detect and recover from subagents that stall, error, or self-delegate
- Keep intermediate work saved (committed) so nothing is lost mid-run

Developed and validated July 2026 orchestrating ~60 subagents across ~10 waves to
build a **621-company / 900+-contact** prospect dataset (see the
**`icp-prospect-list-builder`** skill for the payload methodology).

---

## The 3-wave pipeline

Decompose the job into dependent waves; run agents *within* a wave concurrently.

1. **Discovery** — a few agents build the entity list (who/what to process). Each
   returns a compact structured list, not prose.
2. **Pull / process** — fan out one agent per batch of entities. This is the bulk
   wave (often 8–16 concurrent). Each writes its own output file.
3. **Synthesis** — deterministic (not agent) code recombines, dedupes, validates
   row integrity, and produces the master output + index/dashboard.

Read each wave's results before launching the next — the entity list shapes the
batching, and synthesis shapes what (if anything) needs a re-run.

---

## Rules that make it reliable

### 1. One shared instruction template per wave
Write the full instructions to a file once (e.g. `pull_prompt.txt`) and give each
agent a *tiny* prompt: "Read your instructions from `<template>`; your INPUT =
`in_NN.csv`, OUTPUT = `out_NN.csv`." Keeps every batch identical and your launch
message small. Override per-batch specifics (paths) explicitly.

### 2. Forbid delegation — explicitly
General-purpose subagents can spawn their *own* subagents, then return before the
children write anything, leaving an empty/missing file. Put **"Do this YOURSELF —
do NOT spawn or delegate to sub-agents; write the output file before returning"** in
every prompt.

### 3. Verify by files on disk, not agent status
An agent reporting "done" is not proof its file exists (see rule 2). After each
wave, **check the actual output files** and their row counts. Re-run any batch whose
file is missing/empty/short — with the no-delegation instruction reinforced.

```bash
for f in out_*.csv; do echo "$f: $(($(wc -l < "$f")-1)) rows"; done
```

### 4. Batch evenly; don't pad
~15–20 items per agent is a good balance of depth vs. concurrency. Round-robin items
across batches so each agent gets a mix (avoids one agent drawing all the hard/obscure
items). Tell agents not to pad — a thin honest result beats invented rows.

### 5. Save intermediates immediately
Commit + push scaffolding and per-wave outputs promptly so nothing is lost if the
session ends. `.gitignore` the noisy intermediates (per-batch chunk files) and
commit only the recombined masters + a summary — unless provenance needs the raw
per-batch files, in which case keep them.

### 6. Recombine + validate deterministically
Never let an agent do the final merge. Use code (see `scripts/recombine_validate.py`)
to concatenate outputs, assert the row count equals the input count, flag off-vocab
values, and join grains on a stable id. When names don't match across files, keep a
small **alias map** (`"Square / Block" → "Square"`) rather than fuzzy-matching.

### 7. Handle API rate limits inside the agent/script
For API-backed pulls, read the rate-limit headers and sleep on reset; retry 429s
once after the `Retry-After`. Run long pulls in the background and write incrementally.

---

## Quality patterns (compose as the task warrants)

- **Adversarial verify** — after a find wave, spawn independent skeptic agents to
  refute each finding; keep only those that survive a majority.
- **Loop-until-dry** — for unknown-size discovery, keep spawning finders until N
  consecutive rounds return nothing new (dedupe against everything seen, not just
  what was kept, or rejected items reappear forever).
- **Completeness critic** — a final agent asks "what's missing — a source not run, a
  claim unverified?" Its answer becomes the next wave.
- **No silent caps** — if you bound coverage (top-N, sampling, no-retry), `log` what
  was dropped. Silent truncation reads as "covered everything" when it wasn't.

---

## Pitfalls

| Pitfall | Fix |
|---|---|
| Agent returns "done" but wrote nothing (self-delegated) | Verify files on disk + row counts; re-run with no-delegation reinforced |
| Final merge done by an agent → drift/hallucinated rows | Recombine with code; assert row-count integrity |
| Concurrent agents overwrite one shared output | One output file per agent (`out_NN.csv`); merge afterward |
| Stop-hook / lost work when session ends mid-run | Commit + push after every wave; gitignore only intermediates |
| Join silently drops rows (name mismatches) | Prefer id/domain keys; keep an explicit alias map; assert 0 unmatched |
| Rate-limited API pull dies halfway | Self-throttle on headers, retry 429 once, write incrementally, run in background |
| Launch message balloons with N full prompts | Shared template file + tiny per-agent prompts |

---

## Combining with other skills

- **`icp-prospect-list-builder`** — the canonical payload this orchestration was built for (discovery + size-routed contact pulls at scale).
- **`deep-research`** — use as the per-agent research routine inside a pull wave.
- **`production-agent-audit`** — the same fan-out → adversarial-verify → synthesis shape, applied to log auditing.
- **`intelligence-dossier`** / **`competitor-identification`** — parallelize the section-population and candidate-screening passes.
- **`github-repo-management`** — commit/push cadence + PR hygiene for saving intermediate and final outputs.
