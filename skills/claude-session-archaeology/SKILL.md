---
name: claude-session-archaeology
description: Reconstruct what work was actually done on a project by mining Claude Code session transcripts (~/.claude/projects/**/*.jsonl) — streaming grep/jq recipes for files up to 150MB, the CLAUDE.md boilerplate false-positive trap, core/partial/incidental classification, and fork detection. Use when asked "what have we done on X?", when rebuilding a project history, when recovering decisions or work that never reached git, or as the history phase of a footprint inventory.
---

# Claude Session Archaeology

## Overview
Claude Code writes every session to `~/.claude/projects/<mangled-cwd>/<session-uuid>.jsonl`. Those transcripts are the **only** record of a large class of work: decisions taken and their reasoning, things built but never committed, incidents found and left open, research that produced a conclusion but no file, and blockers handed back to a human who then forgot. Git shows what landed. The transcripts show what *happened*.

This skill is the streaming toolkit for reading them — because they routinely reach 130–150 MB and cannot be opened.

## When to use
- "What work have we done on X?" across weeks of sessions.
- Rebuilding a project history, changelog, or handoff doc after the fact.
- Recovering a decision, a blocked item, or an incident nobody wrote down.
- Finding work that was completed but never pushed.
- Phase 2 of `product-footprint-inventory`.

## Where the transcripts live
```
~/.claude/projects/<cwd-with-slashes-replaced-by-dashes>/<session-uuid>.jsonl
```
`/Users/me/Desktop/proj` → `-Users-me-Desktop-proj`. One directory per working directory, so **the same project can appear under several directories** (repo dir, parent dir, a renamed path). Sweep them all:

```bash
cd ~/.claude/projects
for d in ./*/; do
  c=$(grep -ril "KEYWORD" "$d" 2>/dev/null | wc -l | tr -d ' ')
  t=$(find "$d" -maxdepth 1 -name '*.jsonl' | wc -l | tr -d ' ')
  [ "$c" -gt 0 ] && echo "$c matches / $t transcripts :: $d"
done | sort -rn
```
Quote `"$d"` — these directory names begin with `-` and unquoted they are parsed as `ls` options.

## The one trap that ruins this: embedded boilerplate
**Every session embeds the user's global context in its transcript — and there are at least TWO such files, not one.** The global `CLAUDE.md` is the obvious one. The auto-memory index (`~/.claude/projects/<dir>/memory/MEMORY.md`) is the one that catches people out: it is injected into every session in its project, and it is a *summary of past work*, so it disproportionately contains exactly the project nouns you are searching for. If your term appears in either file, *every session on the machine* scores 30–40 hits while containing no actual work on the subject.

**Never assume a term is clean — verify it.** Before trusting any keyword, grep the boilerplate itself:

```bash
grep -ic 'KEYWORD' ~/CLAUDE.md ~/.claude/CLAUDE.md 2>/dev/null
grep -ric 'KEYWORD' ~/.claude/projects/*/memory/MEMORY.md 2>/dev/null
```

This is not optional. On a real run the operator asserted that a predecessor brand name was absent from the boilerplate and therefore high-precision; it was in fact present in `MEMORY.md`, and treating every hit as signal would have produced **1,412 false positives**.

**Then calibrate.** Count occurrences per file and read the distribution:

```bash
for f in *.jsonl; do printf '%7d %s\n' "$(grep -oi 'KEYWORD' "$f" | wc -l)" "$f"; done | sort -rn
```

Typical shape: a cluster at 30–45 (boilerplate only), then a gap, then the real sessions at hundreds or thousands. In one run the real ones ran 471 → 19,358 hits while the noise floor sat near 40. Treat anything under ~50 as boilerplate until a title check says otherwise, and never deep-dive it.

**Count events, not occurrences,** when a term repeats heavily inside single messages: `rg -c` counts matching lines/events and gives a far more stable floor than `grep -o | wc -l`.

## Most of the corpus is not where you are looking
`~/.claude/projects/<dir>/*.jsonl` holds the **main** session transcripts. Subagent and workflow transcripts live *nested deeper* — and they vastly outnumber the main ones. Measure both before you scope:

```bash
find ~/.claude/projects -maxdepth 2 -name '*.jsonl' | wc -l   # main sessions
find ~/.claude/projects -mindepth 3 -name '*.jsonl' | wc -l   # subagent / workflow
```

On one machine that was **45 main against 3,678 nested** — the nested corpus was 98% of the files and had never been swept. Also note that most project directories contain **no transcripts at all** (only `memory/`, `workflows/scripts/`, `file-history/`), so "30 project dirs" does not mean 30 dirs worth searching. Decide explicitly whether the nested corpus is in scope; for "what work was done" it usually is, because that is where fan-out agents did the actual work.

## The streaming recipe
Never `Read` these files. Never run `jq` over a whole 140 MB file when a tail will do. Always append `2>/dev/null` — some lines fail to parse and will abort an unguarded `jq`.

```bash
f=SESSION.jsonl

# Session titles (fast, most informative single signal)
jq -r 'select(.type=="summary") | .summary' "$f" 2>/dev/null | sort -u | head -8

# Date range
head -30 "$f" | jq -r '.timestamp // empty' 2>/dev/null | head -1
tail -10 "$f" | jq -r '.timestamp // empty' 2>/dev/null | tail -1

# What the human actually asked for
jq -r 'select(.type=="user") | .message.content
       | if type=="array" then (map(.text? // empty)|join(" ")) else . end' "$f" 2>/dev/null \
  | grep -v '^$' | head -3 | cut -c1-1200

# What got built — markers
grep -o 'PR #[0-9]*' "$f" | sort | uniq -c | sort -rn | head
grep -oiE 'deployed|shipped|merged|LIVE in prod|verified' "$f" | sort | uniq -c | sort -rn | head

# How it ended — late assistant messages only (tail the bytes first!)
tail -c 3000000 "$f" | jq -r 'select(.type=="assistant") | .message.content
       | if type=="array" then (map(.text? // empty)|join(" ")) else . end' 2>/dev/null \
  | grep -v '^$' | tail -6 | cut -c1-900
```

The last one matters most. **The end of a session is where the truth is**: what shipped, what was left blocked, what the agent handed back. A session that opens "audit this" and closes "…terminated on usage limits mid-Wave-1, ledger unfinished" tells you the work is *incomplete*, which no commit will ever say.

## Classification
Tag every file:

| Tag | Meaning | Treatment |
|---|---|---|
| **core** | The session's main subject is the target | Full reconstruction |
| **partial** | A meaningful thread on the target inside another project's session | Extract just that thread |
| **incidental** | Boilerplate hits only | One line, no deep-dive |

Partials are where the value hides — cross-project sessions record dependencies and shared-infrastructure facts that no dedicated session states, precisely because they surfaced as someone else's problem.

## Fork detection
Sessions fork. You will find four 130–143 MB files with near-identical hit counts, overlapping date ranges, and thousands of shared events — one lineage, not four projects. Detect by comparing date range + hit count + shared early content, then report **one thread** and note the forks, rather than four near-duplicate entries. In a recent run, three of thirteen files in one directory were forks of a single lineage and contributed one distinct slice of work between them.

## Output shape
Force structure per session:

```json
{ "file": "...", "date_range": "YYYY-MM-DD to YYYY-MM-DD",
  "relevance": "core|partial|incidental", "title": "...",
  "summary": "2-3 sentences on the ACTUAL WORK DONE",
  "workstreams": ["product","infrastructure","marketing","operations","data","docs","security"],
  "key_outputs": "PRs, files, deploys, datasets, decisions, blockers" }
```

Ask each agent for a `highlights` field synthesizing the arc of its slice — what was built, when, and what state it ended in. Those synthesize into the project narrative.

## Fanning out
One agent per directory; split a large directory by filename range (hex UUIDs split cleanly at `0-9` vs `a-f`). Give each agent the whole recipe, the boilerplate warning with a calibrated threshold, and an explicit instruction to **occurrence-count first and deep-dive only the high scorers** — otherwise an agent will spend its budget on a 143 MB file that turns out to be noise.

Tell agents to skip the *current* session file by name; it contains the meta-work and will otherwise be reported as a major workstream.

## Pitfalls
- **Reading whole files.** 143 MB into context is a dead agent. `grep`/`jq`/`tail -c` only.
- **Believing raw hit counts.** Without the boilerplate calibration everything looks relevant.
- **Unquoted directory names.** They start with `-`; shells read them as flags.
- **Unguarded `jq`.** One malformed line aborts the run; always `2>/dev/null`, and fall back to `grep -o` when `jq` fails outright.
- **Counting forks as separate work.** Inflates the history and double-counts outputs.
- **Reading only the beginning.** The opening is the request; the ending is the outcome.
- **Ignoring the other project directories.** A renamed repo scatters one project's history across three directory names.

## Combining with other skills
- `product-footprint-inventory` — this is its history phase.
- `web-crawl-intelligence-extraction` — same streaming discipline applied to saved captures and transcripts.
- `conversation-review` — grading conversation *quality*, where this reconstructs *what happened*.
