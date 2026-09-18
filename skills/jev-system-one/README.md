# jev-system-one

Embed TypeSafe's **Jev** (System One decision model) into any workflow or product.
Jev is a non-generative judgment model: `state` + typed `questions` in, calibrated
`noul`/`choice`/`score` probabilities out, ~70 to 500ms, $0.042/M input tokens.
Code owns control flow; Jev owns judgment.

## What's inside

```
SKILL.md                       Agent entrypoint: calculator mental model,
                               COMPILER(problem) algorithm, pattern-map lookup,
                               anti-patterns, navigation
references/
  01-api-reference.md          Frozen API surface: request/response, limits,
                               errors, SDKs, pricing (verified vs live 2026-09-18)
  02-use-case-catalog.md       14 use-case families → state/question/policy
                               recipes + worked example, field-data lines,
                               from ~190 real implementations
  03-question-design.md        Question craft, confidence semantics, debugging loop
  04-production-embedding.md   Flags, fail-open vs fail-closed vs abstain,
                               redaction, untrusted-content, TOCTOU, telemetry,
                               shadow mode, rollback, reference architecture
  05-evaluation-calibration.md Frozen evals, shadow mode, threshold fitting,
                               verification doc, calibration reading
  06-ecosystem.md              Integrations, language ports, MCP servers,
                               open-source reimplementations
  07-field-data.md             Jev-mined stats from 91 repos: primitive mix,
                               state shapes, composition, technique
                               fingerprints, failure-handling gap
  08-system-design.md          Compiler reference: algorithm, sequential/loop/
                               parallel, T0 to T7 skeletons, output contracts,
                               three worked traces, cost model, cookbook
                               structure pointers
  09-living-log.md             Append-only new use cases. Compiler and the
                               14 families stay frozen; this file grows.
  10-agentic-systems.md        Research->audit->embed loop + the 5-flow agent
                               spine (wait, pick, guard, memory, stamp) for
                               SaaS agents. Sibling cross-refs to
                               production-agent-audit / agent-quality-grading.
assets/
  design-questions.json        System-grain META: problem -> family, topology,
                               seq/map/loop, granularity, risk, needs_decompose
  agent-research-questions.json T1 fanout over ONE agent turn: wait both
                               directions, tool wrong/missed, empty promise,
                               money/legal, human, injection, context bloat,
                               ungrounded, model overkill, wasted turn,
                               dominant miss. `_meta` carries the turn state
                               schema (scripts skip _-prefixed keys)
  agent-smoke-cases.jsonl      5 frozen agent-turn cases for jev_eval --live
                               (stall, empty promise, missed tool, injection,
                               clean turn)
  compile-questions.json       Flow-grain META (after decompose): flow ->
                               topology, primitives, exit option, verify leg,
                               collapse-chain-to-fanout
  triage-questions.json        The §0 worked-example bank as a runnable file:
                               jev_batch.py <records> assets/triage-questions.json
  smoke-cases.jsonl            6 frozen eval cases for jev_eval.py --live
                               (expect format: noul bool/band, choice key,
                               score number/range)
  skill-review-questions.json  Holistic grader: vertical (artifact design) +
                               horizontal (intended-use) scores, gap nouls
  file-review-questions.json   Per-file map grader: actionability, depth,
                               signal density, gap/error/redundancy nouls
  wrappers/jev.py              Copy-into-repo Python wrapper (typesafe-sdk)
  wrappers/jev.ts              Copy-into-repo TypeScript wrapper (@typesafe-ai/sdk)
checklists/
  shipping-checklist.md        Pre-prod gate (design/safety/evidence/ops)
scripts/
  jev_batch.py                 Resumable concurrent batch judgment over JSONL
  jev_eval.py                  Frozen-case eval harness (per-question accuracy,
                               confidence stats, disagreement dump)
```

## Built from

A 2026-09-18 research sweep: ever-just's own 14-use production judgment plane
(PR #130) + a 4,460-record production audit (each record judged with a
multi-question bank), ~190 public usages across ~150 repos, the official
docs/cookbooks/evals, and Jev itself used to synthesize the inventory
(271 repos classified, verified, and ranked in 8 seconds).

## Live docs

`https://docs.typesafe.ai/llms.txt` is the source of truth for API changes;
append `.md` to page paths. The frozen reference here covers jev-1.13.
