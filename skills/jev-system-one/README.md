# jev-system-one

Embed TypeSafe's **Jev** (System One decision model) into any workflow or product.
Jev is a non-generative judgment model: `state` + typed `questions` in, calibrated
`noul`/`choice`/`score` probabilities out, ~70 to 500ms, $0.042/M input tokens.
Code owns control flow; Jev owns judgment.

## What's inside

```
SKILL.md                       Agent entrypoint: mental model, 7-step method,
                               pattern map, anti-patterns, navigation
references/
  INDEX.md                     Load-the-file-for-problem-X map + reading orders
  01-api-reference.md          Frozen API surface: request/response, limits,
                               errors, SDKs, pricing (verified vs live 2026-09-18)
  02-use-case-catalog.md       14 use-case families → state/question/policy
                               recipes, from ~190 real implementations
  03-question-design.md        Question craft, confidence semantics, debugging loop
  04-production-embedding.md   Flags, fail-open vs fail-closed vs abstain,
                               redaction, untrusted-content, TOCTOU, telemetry,
                               shadow mode, rollback, reference architecture
  05-evaluation-calibration.md Frozen evals, shadow mode, threshold fitting,
                               verification doc, calibration reading
  06-ecosystem.md              Integrations, language ports, MCP servers,
                               open-source reimplementations
checklists/
  shipping-checklist.md        Pre-prod gate (design/safety/evidence/ops)
scripts/
  jev_batch.py                 Resumable concurrent batch judgment over JSONL
  jev_eval.py                  Frozen-case eval harness (per-question accuracy,
                               confidence stats, disagreement dump)
```

## Built from

A 2026-09-18 research sweep: ever-just's own 14-use production judgment plane
(PR #130) + a 4,460-judgment production audit, ~190 public usages across ~150
repos, the official docs/cookbooks/evals, and Jev itself used to synthesize the
inventory (271 repos classified, verified, and ranked in 8 seconds).

## Live docs

`https://docs.typesafe.ai/llms.txt` is the source of truth for API changes;
append `.md` to page paths. The frozen reference here covers jev-1.13.
