# Jev System One: reference index

Load the file for your problem. Do not read all of them.

| If you are… | Read |
|---|---|
| Choosing whether Jev fits at all | `SKILL.md` (mental model, when-not-to-use) |
| Looking for the right recipe for a concrete use case | `02-use-case-catalog.md`: 14 families with state/question/policy recipes and field examples |
| Writing or debugging questions, criteria, state | `03-question-design.md` |
| Coding the API call or picking SDK vs AI SDK vs gateway vs MCP | `01-api-reference.md`, then `06-ecosystem.md` for the stack landscape |
| Shipping a Jev feature to production | `04-production-embedding.md`, then `checklists/shipping-checklist.md` |
| Setting thresholds or proving accuracy | `05-evaluation-calibration.md` |
| Grounding a design in what the field actually does | `07-field-data.md`: Jev-mined stats from 91 repos (primitive mix, state shapes, composition, technique fingerprints, failure-handling gap) |
| Running Jev over a whole corpus (audit, backfill, dataset work) | `scripts/jev_batch.py` + §9 of the catalog |
| Building a frozen-case eval | `scripts/jev_eval.py` + `05-evaluation-calibration.md` |

## Reading order by task type

**Embed Jev into an existing product/workflow:**
`SKILL.md` → `02-use-case-catalog.md` (your section) → `03-question-design.md` →
`04-production-embedding.md` → `05-evaluation-calibration.md` → checklist.

**One-off analysis over a dataset:**
`01-api-reference.md` (limits) → `02-use-case-catalog.md` §9 → `scripts/jev_batch.py`.

**Brainstorm what Jev could do in an app:**
`02-use-case-catalog.md` top-to-bottom, then `06-ecosystem.md` for inspiration
from ~190 real implementations.

**Fix a Jev question answering wrong:**
`03-question-design.md` (debugging loop) → `05-evaluation-calibration.md`
(read probabilities on the misses).

## External sources

- Live docs (source of truth): `https://docs.typesafe.ai/llms.txt`: append `.md` to page paths.
- Cookbooks: `https://docs.typesafe.ai/llms.txt` lists ~18 recipes; §02 maps them to families.
- Workflow evals: `https://evals.typesafe.ai/`: 4 published reference workflows.
- Deep question-craft skill worth pairing: `github.com/dbreunig/building-with-jev-skill`.
- Official agent skill (conceptual model): `github.com/typesafe-ai/skills`.
