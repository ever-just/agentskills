# Field data: how the ecosystem actually uses Jev (Jev-mined)

Measured, not surveyed: 91 substantive repos × 20 extraction questions =
1,820 Jev judgments over real README + source content (jev-1.13.0, run
2026-09-18 via `scripts/jev_batch.py`). Repo docs were fetched from GitHub and
fed verbatim as state; every figure below is a Jev-labeled count, not a guess.
Repos were filtered to real applications/infra (SDK ports, awesome lists, and
test repos excluded: they carry no usage pattern).

## Primitive usage

| Primitive | Repos using it | Share |
|---|---|---|
| Choice | 60/91 | 66% |
| Noul | 48/91 | 53% |
| Score | 41/91 | 45% |
| All three together | 27/91 | 30% |

Choice-only is the most common single-primitive usage (19%), then noul-only
(12%). Mixed banks (2+ primitives over shared state) are the norm, not the
exception: matching the "several narrow questions per call" pattern.

## Call structure

| Shape | Share | Reading |
|---|---|---|
| one call per decision | 53% | the default |
| per candidate (map over a list) | 12% | rerank/eval patterns |
| per tick in a loop | 9% | games, UI automation, trading |
| batch per record | 7% | corpus analysis |
| two-stage dependent | 2% | rare: most implementations are single-shot |

Questions per call: 2 to 5 fan-out is the norm (27% determinable), 6+ wide
fan-out in 13%. Single-question calls in 13%.

## State shape

| Shape | Share | Where it dominates |
|---|---|---|
| json_records | 30% | general default |
| raw_text | 12% | triage/moderation |
| candidates_list | 10% | selection/rerank |
| code_patch | 10% | review/audit tools |
| indexed_list | 8% | **the UI-automation signature** |
| extracted_facts | 5% | games/robots (code-computed state) |
| thread_tail | 5% | messaging/triage |

## Composition (how code consumes answers)

| Policy | Share | Note |
|---|---|---|
| threshold_gate | 32% | dominant where determinable: probability/confidence gates the action |
| direct_branch | 13% | branch on winning answer |
| two_stage_verify | 5% | verify pass before acting |
| abstain_capable | 2% | explicit none/abstain outcome |
| weighted_composite / human_review_queue | 1% each | rare in the wild |
| unclear | 45% | thin repos: pattern not visible |

## Failure handling: the ecosystem's biggest gap

| On Jev error/timeout | Share |
|---|---|
| **unspecified (nothing visible)** | **59%** |
| fail_closed (hold/block) | 19% |
| fail_open (incumbent path) | 13% |
| retry_only | 9% |

Three in five public implementations do not say what happens when Jev errors.
Ship yours with an explicit `on_failure`: this is a checklist item precisely
because the field skips it.

## Engineering signals

| Signal | Share | Who (sample) |
|---|---|---|
| telemetry (logs/stores judgments) | 37% | typesafe-mario, jev-trader, jev-ultrafast, litellm, computer-use |
| explicit numeric threshold | 30% | computer-use, jev-ultrafast, composio, agentgateway, adblock |
| redaction / bounded state | **7%** | openwork, adblock, jevlogs, foreman, fighthealthinsurance, macos-loop |
| novel_structure (beyond classify-and-branch) | 46% | see fingerprints below |

Only 6 of 91 repos visibly bound what enters state. If you redact PII/secrets
before the call you are ahead of 93% of the field.

## The 7 techniques observed in the wild

| Technique | Repos | What it is | Canonical example |
|---|---|---|---|
| evidence_selection | 37 | code pre-finds candidates/evidence, Jev selects | citation-verifier, openwork, typesafe-mario |
| adjudication | 32 | Jev adjudicates stored items (keep/drop, merge/separate, true/stale) | remember-stack, fast-jev-compaction, jev-audit |
| two_stage | 28 | coarse pass → verify/refine pass | computer-use, litellm, composio |
| speculative_fanout | 21 | branch-specific questions in one call, read only relevant answers | jev-ultrafast, openwork, eve |
| verbatim | 13 | kept content copied verbatim; model never retypes | fast-jev-compaction, litellm, skillbox |
| noul_rerank | 13 | per-candidate noul as absolute thresholdable score | lancedb pattern, adblock, JevLint |
| beam | 2 | expand only top-k branches | vexjoy-agent, neo4jev |

`evidence_selection` + `adjudication` + `two_stage` is the real-world power
combo: the pattern behind most production-shaped uses.

## Per-repo technique fingerprints (novel_structure > 0.5)

```
browser-use/jev-ultrafast        fanout,two_stage,evidence_sel,adjudication
awlevin/typesafe-computer-use    two_stage,evidence_sel,adjudication
notque/vexjoy-agent              fanout,two_stage,evidence_sel,beam,adjudication
Jiiiin/codex-jev-compaction      two_stage,evidence_sel,verbatim,noul_rerank,adjudication
tamaratran/fast-jev-compaction   evidence_sel,verbatim,noul_rerank,adjudication
willfish/pi-observational-memory evidence_sel,verbatim,noul_rerank,adjudication
AkashPriyadarshii/jev-curate     fanout,two_stage,verbatim,adjudication
droidrun/mobile-jev              fanout,two_stage,evidence_sel,verbatim,adjudication
Kevthetech143/super-jev          two_stage,evidence_sel,adjudication
anessbelbati/jev-rerank-bench    two_stage,evidence_sel,noul_rerank,adjudication
MarissaFamularo/citation-verifier two_stage,evidence_sel,verbatim
max1874/jev-computer-use         fanout,evidence_sel,verbatim
abeatrix/cline-plugin-jev-browser two_stage,evidence_sel,adjudication
lahfir/agent-desktop             fanout,two_stage,evidence_sel
jcpsimmons/jev-macos-loop        two_stage,evidence_sel
mahavirn/jev-cli                 two_stage,evidence_sel,adjudication
CelestoAI/celesto                fanout,evidence_sel,adjudication
jexp/neo4jev                     fanout,evidence_sel,beam
frostney/clean-code-review       fanout,verbatim
superagents-lab/jev-search       two_stage,adjudication
dabit3/jev-experiments           evidence_sel,adjudication
writeitai/remember-stack         adjudication
andrelandgraf/rate-my-pricing    adjudication
thruwire/foreman                 fanout,two_stage
rubichandrap/hermes-jev-guard    two_stage
uezo/aiavatarkit                 two_stage
Brainwires/jevwire               two_stage
BerriAI/litellm                  two_stage,verbatim
ekzhang/openjev-sglang           fanout
vercel/eve                       adjudication
bastani-inc/atomic               adjudication
different-ai/openwork            fanout,two_stage,evidence_sel
brainstormity/Jev-Moderation-Bot adjudication
onehopeA10/jev-x-spam-filter     adjudication
fhshaik/typesafe-mario           evidence_sel
sorrycc/typesafe-snake           evidence_sel
RomanSlack/jev-drone             evidence_sel
TarunTomar122/jev-askable-arm    evidence_sel
anxkhn/jev-plays-pokemon         evidence_sel
phuthuycoding/jev-audit          fanout,adjudication
```

## Maturity on the substantive set

mean 2.92/4 · 47 repos ≥3 (usable+) · top scores: fighthealthinsurance (3.79),
notque/vexjoy-agent (3.72), can1357/oh-my-pi (3.44), Brainwires/jevwire (3.41),
superagents-lab/jev-search (3.39), frostney/clean-code-review (3.36),
openchamber (3.33), langchain (3.31).

## What this data changes in practice

1. **Default your first design to**: mixed question bank (2 to 5 questions,
   mostly choice+noul), one call per decision, JSON state, threshold-gated
   composition, explicit `on_failure`. That is the modal production shape.
2. **Reach for evidence_selection first**: it is the most common real
   technique: enumerate candidates in code, let Jev pick, copy verbatim.
3. **two_stage and adjudication separate demos from systems**: the
   production-shaped repos skew heavily to them; toy demos are one-shot
   classify-and-branch.
4. **You will be ahead of most of the field if you** add a failure path
   (59% have none), redact state (7% do), and stamp telemetry (37% do).
5. **noul_rerank and beam are underused**: noul-as-absolute-score (LanceDB's
   trick) appears in only 13 repos despite being the cleanest rerank primitive;
   beam is nearly unused (2 repos) and is an opportunity for deep-label work.
