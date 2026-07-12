---
name: parallel-agent-refactor
description: Orchestrate many parallel subagents to run a large multi-file refactor, migration, or codemod sweep SAFELY and fast — partition by disjoint file ownership, fan out one write-agent per independent slice behind typecheck+build barriers, and synthesize their structured returns. Use when adopting a component library across routes, migrating design tokens / dark mode, running a rename or codemod sweep, modernizing per-route, or applying one rubric across a whole codebase — any breadth change that decomposes into independent file sets. Not for interdependent foundation work (shared config, a token layer, coupled modules) — do that inline.
---

# Parallel Agent Refactor

## Overview
A large refactor is fast **and** safe only when the work is sliced so that parallel write-agents never touch the same file. This skill is the orchestration discipline for that: **partition by file ownership** (not by topic), **fan out one write-agent per independent slice**, and put a **barrier** — a single typecheck + build + committed checkpoint — between every wave. The orchestrator owns the shared files, the spec, the verification, and the commits; the agents own disjoint file sets and return **structured results**, not conversation.

The whole value is a small set of invariants that make concurrency correct: **disjoint ownership** (no write race), **barriers between waves** (a consistent tree at every commit), and **one shared house-rules spec** (every agent produces the same house style). Break any one and you get corruption, red builds, or a stylistically incoherent diff. This method comes from a real Next.js/Tailwind redesign run with ~20 agents across five waves — all merged.

## When to use
- "Adopt `<component library>` across every route." / "Migrate all pages to the new primitives."
- "Do the dark-mode / design-token migration across the app."
- "Run this rename / codemod everywhere." / "Apply this rubric to every route/module."
- Per-route or per-module modernization where the app is roughly **one file (or one folder) per route** — the clean unit of ownership.
- Any breadth change that **decomposes into independent file sets** and is large enough that serial editing is the bottleneck.

## When NOT to use this skill
- **Interdependent foundation work** — a shared config, a design-token layer, the app shell, tightly-coupled modules. Parallelizing these creates write races and inconsistent assumptions. **Do them inline / single-agent, FIRST**, as wave A. Fan-out comes *after* the foundation is committed.
- **Trivial changes** — a handful of files. The orchestration overhead (spec, waves, barriers) costs more than just doing it. Just do it.
- **Work that can't be partitioned into disjoint file sets** — if every slice needs to edit the same three shared files, you don't have parallelism; you have a queue. Restructure, or serialize.

## Cardinal rules (these are the method)
1. **Partition by FILE OWNERSHIP, not by topic.** Parallel writes are safe **only** when the agents' file sets are **disjoint**. In a one-file-per-route app, **route-per-agent** is the clean unit. Assign each file to exactly one owner before any agent starts.
2. **Single owner for shared / high-conflict files.** `package.json`, `globals.css` / the theme file, the app shell/layout, a README or route manifest — these get **one** owner (the orchestrator, or exactly one named agent), **never two**. Two agents editing `package.json` concurrently corrupt it.
3. **Read-only fan-out for discovery; disjoint-ownership fan-out for writes.** Use cheap parallel read-only agents to map the codebase and draft the ownership plan. Only fan out writers once ownership is disjoint and the spec is frozen.
4. **Barriers BETWEEN waves, not within.** A wave's agents run concurrently; the wave **ends at a barrier** where the orchestrator runs **one** verification (typecheck + build) and commits a checkpoint — **then** the next wave starts. Do **not** pipeline agent→agent (context bloat + latency + serialization); the orchestrator consumes structured returns and gates.
5. **One shared house-rules spec for every write-agent.** Allowed classes/tokens, exact API-adaptation notes, forbidden patterns, and — for mechanical changes — a **mapping table**. Same spec in, same house style out. See `templates/house-rules-spec.md`.
6. **Structured returns, not transcripts.** Each agent returns `files-touched` + `what-changed` (old→new) + `anything-unsure`. The orchestrator synthesizes. This keeps each agent's exploration noise out of the orchestrator's context.
7. **Right-size model / effort / tools per agent.** Read-only agents get search+read only. Mechanical write-agents run cheaper / lower-effort with a turn cap. The hardest reasoning gets more budget. Don't pay Opus-at-max for a find-and-replace.
8. **Same-tree parallel is safe when ownership is disjoint** — and it's cheaper. Reserve **git worktrees** only for the rare case where agents must touch a shared file concurrently (usually you avoid that with rule 2 instead).

## Partition: the ownership model
Classify every file **before** you launch anything. Ownership determines who may write it and in which wave.

| File class | Example | Owner | Parallel-safe? |
|---|---|---|---|
| Per-route leaf | `app/pricing/page.tsx`, `app/settings/page.tsx` | one write-agent each | **Yes** — disjoint, fan out one agent/route |
| New primitive (new file) | `components/ui/select.tsx` (didn't exist) | one author per new file (or inline) | **Yes** — creating distinct new files can't collide |
| Shared / high-conflict | `package.json`, `app/globals.css`, `app/layout.tsx`, route manifest, `README.md` | **single owner** (orchestrator or one named agent) | **No** — never assign to two agents |
| Foundation / token layer | Tailwind theme, CSS-var definitions, shared config | orchestrator, inline, **wave A** | **No** — everything depends on it; do it first |

Two hard tests before you fan out:
- **Disjointness:** union every agent's file list. Any file appearing twice is a race — reassign it to a single owner or move it to the shared-file bucket the orchestrator handles.
- **Foundation-first:** anything the leaves *depend on* (tokens, primitives they import, shared types) must be **committed** before the wave that consumes it. If a leaf agent needs a token that doesn't exist yet, it will invent one — and the outputs diverge.

## Wave design (worked example)
Order waves by **dependency**: foundation → centralized value → parallel leaves → accelerators → parallel leaves. Each wave is behind a **typecheck + build barrier** and committed **and pushed** as a durable checkpoint. Real five-wave shape from the redesign (~20 agents total):

| Wave | Purpose | Shape | Parallelism |
|---|---|---|---|
| **A — Foundation** | Author new primitive files; **establish the token layer FIRST** | 1 agent per new file, or inline; token layer inline | Low — foundation must land before anything reads it |
| **B — Core value** | The centralized, high-value change everything else assumes | Inline / single-agent | None (deliberately serial) |
| **C — Per-route component migration** | Swap each route onto the new primitives | **1 agent per route**, concurrent | **High** |
| **D — Accelerators** | Shared helpers/hooks/utilities that make the leaf work easier | Small fan-out or inline | Medium |
| **E — Per-route token/color migration** | Tokenize colors/dark-mode per route | **1 agent per route**, concurrent | **High** |

Full copy-paste wave plan with ownership lists and barrier commands: `templates/wave-plan.md`.

**Per-wave barrier checklist** (the orchestrator copies this into its own working notes and ticks it every wave — this is what stops a red tree being committed):
```
[ ] All agents in wave returned (completion notifications received)
[ ] Merged structured returns; noted every `anything-unsure`
[ ] Ran ONE typecheck (whole tree) — clean
[ ] Ran ONE build — clean
[ ] Ran post-wave cleanup greps (forbidden classes, invisible pairings — see Pitfalls)
[ ] Committed checkpoint + PUSHED
[ ] Only now: launch next wave
```

## The shared house-rules spec
Write this once, before wave C, and hand the **same file** to every write-agent (plus a disjoint file list and one reference file to match house style). It is the difference between a coherent diff and twenty personal styles. It must contain:

- **Allowed classes / tokens** — the exact token names and utility classes agents may emit (`bg-primary`, `text-muted-foreground`, …). Agents copy stock library snippets otherwise, and stock snippets reference vars your app doesn't define.
- **Forbidden patterns** — classes/APIs that **silently do nothing** or break in your target (see the Tailwind-v4 pitfall below). List them explicitly; agents won't infer them.
- **Exact API-adaptation notes** — call-site signatures for the new primitives, so every migrator adapts them identically (Radix handlers are **not** the native DOM API). The one that bites every route is in Pitfalls below; the full table lives in `templates/house-rules-spec.md` §3.
- **Pairing rules** — foreground/background classes that must move together (a tokenized `bg-primary` needs a token foreground, not a hardcoded `text-white`).
- **A mapping table** for mechanical changes — old → new, exhaustive, so a codemod agent has zero discretion. `text-gray-500 → text-muted-foreground`, `onChange → onValueChange` (Select), etc.

Full annotated example: `templates/house-rules-spec.md`.

## Orchestration mechanics (Claude Code)
- **Fan out with the Agent tool, launching all of a wave's subagents in a SINGLE message** — that is what makes them run concurrently as background subagents. Then **wait for their completion notifications** before doing anything at the barrier.
- **The orchestrator runs the barrier**, not an agent: one whole-tree typecheck, one build, one commit, one push. **Never let two agents run typecheck/build concurrently** — run exactly one verification, at the barrier.
- **For deterministic multi-stage runs**, drive the fan-out → barrier → fan-out structure through an orchestration/workflow harness (pipeline + parallel + barrier stages) so the structure is enforced by the harness rather than by hand.
- **Custom subagents load `CLAUDE.md` / `AGENTS.md`** — tell every write-agent to **honor project rules**, and give it (1) a reference file to match house style, (2) its **disjoint** file list, and (3) the shared spec.
- **Right-size each agent:**

| Agent role | Model / effort | Tools | Turn cap |
|---|---|---|---|
| Discovery (read-only fan-out) | cheap / low | search + read only, **no write** | tight |
| Mechanical migrator (codemap-driven) | cheap / low–mid | read + edit on its file set | capped |
| Reasoning migrator (nontrivial per-route) | stronger / higher | read + edit on its file set | generous |
| Orchestrator (you) | strongest | full: edit shared files, run verify, git | — |

## Output
The **agent → orchestrator return** is structured (paste this shape into every write-agent's brief so returns are uniform and synthesizable):
```
FILES TOUCHED:
- path/to/a.tsx
- path/to/b.tsx
WHAT CHANGED (old → new):
- <file>: <concise before → after per change>
ANYTHING UNSURE:
- <ambiguity, deviation from spec, or thing the orchestrator must decide>
  (empty if none)
```
The **orchestrator's running artifact** is a checkpoint log — one row per wave: wave id · agents launched · files owned · typecheck/build result · commit SHA (pushed) · unresolved `anything-unsure` items carried forward. That log is the recovery point: a context reset resumes from the last pushed checkpoint, never from scratch.

## Pitfalls
- **Fanning out primitive authorship before the token layer exists.** Agents copy stock library code that references `bg-background`, `border-input`, etc. — CSS vars your target never defined — and you ship dead styles. **Establish the token layer FIRST** (wave A), commit it, then author primitives against it.
- **Tailwind v4 has no `tailwindcss-animate` by default.** `animate-in`, `fade-in-*`, `zoom-in-*`, `data-[state=…]:animate-*` classes **silently produce nothing — no error, no warning**. Agents copy them from stock shadcn snippets and think it worked. **Forbid them in the spec** and grep for them at the barrier.
- **Radix API mismatch at call-sites.** `Select` → `onValueChange(value)` (not `onChange(e)`); `Switch` → `onCheckedChange(boolean)`; empty-string `SelectItem` value is illegal (use `"all"`). One migrator gets it wrong per route unless the **spec** spells it out for all of them.
- **Paired-class invisibility after a mechanical swap.** A `text-white` sitting next to a newly-tokenized `bg-primary` becomes white-on-near-white — **invisible in dark mode**, and no test catches it. Add **pairing rules** to the spec **and** run a **cleanup grep** after the wave (`text-white`, hardcoded hex, `bg-white`).
- **Races on shared files.** Two agents editing `package.json` / `globals.css` / the layout corrupt it — enforce the **single-owner rule** (rule 2). The concurrent-verification race is the same failure: run **one** verification, at the barrier (rule 4).
- **Stranded work / context loss.** Un-pushed progress evaporates on a context reset. **Commit AND push each verified wave** as a durable checkpoint before starting the next.
- **Committing a red tree.** The barrier exists so the tree is consistent at every commit. If typecheck or build is red, **fix at the barrier before committing** — never start the next wave on a broken foundation.
- **Pipelining agents.** Chaining agent→agent balloons context and serializes what should be parallel. Agents return to the **orchestrator**; the orchestrator gates.

## Combining with other skills
- `production-agent-audit` — the **read-only** fan-out counterpart. This skill is its **write/implement** twin: same disjoint-fan-out + barrier discipline, applied to editing instead of analysis.
- `dark-mode-token-migration` and `shadcn-tailwind-v4-primitives` — the **concrete instances** of waves A/E and the house-rules spec; use them for the domain specifics (which tokens, which primitives, the v4 gotchas) while this skill supplies the orchestration.
- `empirical-responsive-audit` — **verify each wave** empirically (render + measure), not just typecheck+build, before you commit the checkpoint.
- `ux-decision-rubrics` — the rubric a "apply this everywhere" fan-out distributes to every leaf agent so their judgment calls are consistent.
- `ui-ux-audit` — run before (to source the backlog of routes/issues to fan out) and after (to confirm the sweep landed).
- `godaddy-api`, other platform-ops skills — orthogonal; this skill is about *how* to parallelize edits, not *what* the edits are.
