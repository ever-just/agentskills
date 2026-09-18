# System design: Jev as a computational operator

This file is the compiler's reference. SKILL.md is the algorithm; this file
is the operators, the topologies, the contract, and three worked traces.

## The compiler (run this; do not skip to a recipe)

```
COMPILER(problem):
  1. Name the typed value code will consume. Cannot name it? Stop.
  2. META: jev(problem, assets/design-questions.json)
     -> family, topology, seq/map/loop, granularity, risk  (PRIORS)
  3. Count named consumers. If needs_decompose prior is high
     OR there is more than one independently consumed typed output
     (different time or different object):
       split into named flows
       for each flow: COMPILER(flow)   # skill looping on itself
       join the flow specs into a system spec
       return
     A single pipeline that asks several questions is NOT decompose.
  4. FLOW META: jev(flow, assets/compile-questions.json)
  5. Pick topology from dependency / cardinality / depth (below),
     using the priors as hints. Write the structure spec.
  6. CONTRACT GATE: every question names its consumer or is deleted.
  7. Write the bank matching the topology. Compose in code.
```

Stop condition: every remaining unit is one decision pipeline (one flow).
A narrow problem that stays narrow is correct, not a failure.

Three parallelisms, do not mix them up:

| Kind | What | Cost |
|---|---|---|
| Intra-call (T1) | Many questions, one `jev()`, shared state | ~free latency |
| Inter-call (T4) | Many independent `jev()` invocations | parallelizable ~70 to 500ms each |
| Sequential (T2) | call_2 needs call_1's typed answer | serial; latency adds |

Loop (T3) is the same call with fresh state per tick, not "retry until good"
unless a noul named `converged` is the stop and code caps iterations.

If a T2 chain blows an interactive budget, collapse it: ask call_1 plus every
branch's questions in one T1 call and read the relevant leg (speculative
fan-out replaces a 2-hop chain).

## Worked compiler traces

**Narrow: smart survey router.** Live META: T2_chain conf 0.92, seq 0.90,
map 0.14, `needs_decompose` 0.46. Stay one flow. Two consumers in ONE
pipeline (`next_question` -> `form.show`; `done` -> `form.finish`) is not
decompose. Chain: call_1 classifies the answer; call_2's bank is the
per-segment picker; state carries `{answer, segment, remaining_ids}`.
Lookup: catalog §1 / §2.

**Mapped composite: grading N submissions.** Live META: composite_scoring
conf 1.00, map 0.96, T7_diamond conf 0.51, `needs_decompose` 0.56. Stay one
flow: outer T4 map, inner T7 diamond (correctness / style / plagiarism),
code owns weights, letter grade is a threshold on the composite. Contract:
each score's consumer is a weight; composite's consumer is
`transcript.write`. Lookup: catalog §12 + §9.

**Wide: game generation from a prompt.** Live META: T3_loop conf 0.92,
loop 0.93, gran 4.0, `needs_decompose` 0.69 (review band). Consumer count
is 4 (screen, genre, tick, ship) at different times -> recurse:

| Flow | Live compile prior | Consumer |
|---|---|---|
| screen prompt | T0/T1, verify 0.65 | `if jailbreak>0.7: reject` |
| pick genre/mechanics | T1_fanout | `generator.set(genre, mechanics)` |
| playtest tick | loop 0.74 (T3 body, not a nested loop) | `sim.apply(move)` |
| ship-or-keep-playing | T0, verify 0.68 | `if fun_enough>0.8: publish` |

Four flows, not one call. Recurse until each row is one pipeline.

## Jev is a calculator, not an AI feature

`jev(state, question_bank) -> typed_answers` is a pure operator: typed inputs
in, typed outputs out, no prose, no parsing, no malformed results. Treat a call
like `min()` or `argmax()`, not like "calling the model":

| Operator | Signature | Code consumes it as |
|---|---|---|
| Noul | `predicate(state, claim) -> p in [0,1]` | a soft boolean: threshold or band |
| Choice | `select(state, set) -> argmax + confidence` | a branch or an index |
| Score | `measure(state, rubric) -> level + confidence` | a threshold, weight, or sort key |

A multi-question call is SIMD: N operators over one shared input in a single
invocation. The fan-out is free parallelism inside the operator, not N calls.

## The hierarchy: System > Flow > Call > Question

- **System**: the product feature ("smart survey", "grading service",
  "game generator"). A system is a graph of flows.
- **Flow**: one decision pipeline ("route this answer", "grade this
  submission"). A flow is a small DAG of calls.
- **Call**: one `jev()` invocation: shared state + a bank of questions.
- **Question**: one operator inside a call.

Scope every design at each level. "Game generation" is a system with many
flows (content screen, mechanic scoring, playtest adjudication); "survey
routing" is usually a single T2 flow; "grading" is a T4 map of T7 diamonds.
A narrow problem that stays narrow is a feature, not a failure.

## The output contract

An answer has utility only when code consumes it without interpretation.
Before writing any question, name its consumer:

1. **Every question maps to a code consumer**: a branch, a threshold, a sort
   key, a weight, a gate. Cannot name it -> delete the question.
2. **Option sets are exhaustive or have an exit.** Add `none`, `other`, or
   `review` whenever the set might be incomplete. A forced pick among bad
   options is a bug, not a judgment.
3. **Noul bands carry the meaning.** Design the question so `>0.7 act`,
   `0.3 to 0.7 review`, `<0.3 drop` reads as policy, not just a bit.
4. **Score levels need semantic anchors** in the rubric (situations, not
   intensities). The returned `score` is a probability-weighted position that
   can land BETWEEN levels. Threshold it; do not treat it as an int enum and
   do not interpolate it into a physical quantity. Never write "1=worst".
5. **Question IDs are API surface.** Name them `verb_noun`, keep them stable;
   telemetry and evals join on them.

## The eight topologies

Code skeletons use `jev(state, questions) -> answers` as the operator.
Latency: one call ~70 to 500ms; intra-call questions are parallel and free;
inter-call concurrency is code-owned (workers in `scripts/jev_batch.py`);
chained calls serialize and their latency adds.

### T0 POINT: one call, one decision

```python
ans = jev(state, {"intent": CHOICE_INTENT, "urgency": SCORE_URGENCY})
route(ans)  # 53% of the field: the default
```

### T1 FAN-OUT: parallel questions over shared state

```python
ans = jev(state, {  # all questions see the same state; answers independent
    "is_refund": NOUL_REFUND, "wants_human": NOUL_HUMAN,
    "sentiment": SCORE_SENTIMENT, "route": CHOICE_ROUTE})
# read only the answers the branch needs: speculative fan-out
```

Ask branch-specific questions in the same call even if only some answers get
read: cheaper than a second call.

### T2 CHAIN: outputs of call_1 are inputs of call_2

```python
a1 = jev(state, {"route": CHOICE_ROUTE})
if a1["route"]["confidence"] < 0.6:
    escalate()                      # uncertain is a first-class branch
else:
    qs = BRANCH_QUESTIONS[a1["route"]["choice"]]  # per-branch question banks
    a2 = jev({**state, "route": a1["route"]["choice"]}, qs)
    act(a2)
```

Sequential = dependent. Only 2% of the field chains; it is the most underused
structure. Variants: select-then-verify (call_2 can reject all -> abstain),
coarse-then-fine (bucket -> leaf), judge-then-condition (cheap screen gates an
expensive second pass). Always pass forward the typed answer plus the evidence
call_2 needs; never chain on raw confidence alone.

### T3 LOOP: same call, fresh state per tick

```python
while running:
    state = observe()               # code computes the snapshot
    ans = jev(state, TICK_QUESTIONS)  # one call per tick
    apply(ans)                      # e.g. move, click, trade
```

Games, UI automation, market loops. Keep the state extract cheap; the call is
the tick's budget (~200ms typical). Iterate-until-converge is a rarer form:
repeat while `ans["converged"]["noul"] < 0.8` and cap iterations in code.

### T4 MAP: same call over N independent items

```python
with ThreadPoolExecutor(WORKERS) as ex:      # inter-call parallelism
    results = list(ex.map(lambda item: jev(item, Q), items))
ranked = sorted(items, key=lambda it: score_of(results[it]), reverse=True)
```

Rerank, batch corpus, grading N submissions. `scripts/jev_batch.py` is this
topology as a CLI. Per-candidate nouls are absolute scores: threshold them
directly (the LanceDB rerank trick).

### T5 TREE/BEAM: expand top-k into deeper calls

```python
top = jev(state, {"bucket": CHOICE_BUCKET})["bucket"]["probabilities"]
for leaf_bucket in top_k(top, k=3):
    leaf = jev({**state, "bucket": leaf_bucket}, LEAF_Q[leaf_bucket])
    yield leaf                      # expand only the likely branches
```

Label spaces past 255 options, deep taxonomies. Rare in the field (2 repos):
opportunity, not a proven recipe.

### T6 TOURNAMENT/ADJUDICATE: items judged against each other or a set

```python
for candidate in stored_items:      # keep/drop, merge/separate, true/stale
    verdict = jev({"item": candidate, "context": ctx}, ADJUDICATE_Q)
    apply_verdict(candidate, verdict)
```

Memory adjudication, dedup, audit queues. 32 repos fingerprint this.

### T7 DIAMOND: fan out independent legs, fan in to a composite

```python
ans = jev(state, {"quality": SCORE_Q, "risk": SCORE_R, "fit": SCORE_F})
total = (0.5 * ans["quality"]["score"]
         - 0.3 * ans["risk"]["score"] + 0.2 * ans["fit"]["score"])
```

Independent sub-judgments in one call, weights owned by code (business policy,
not the model). Composite scoring, multi-signal gates.

### Nesting

Real systems nest topologies: a T3 loop whose tick body is a T1 fan-out
(mario, computer-use); a T4 map whose element is a T2 chain (rerank then
verify); a T1 fan-out where one leg gates a T2 verify (openwork). Name the
outer topology by how calls relate to each other, and nest freely inside.

## Choosing the structure

Decompose the decision into sub-decisions, then ask three questions:

1. **Dependency**: does sub-decision B need A's answer to know what to ask?
   Yes -> T2 chain. No -> share one call (T1).
2. **Cardinality**: decided once, per-item, or per-tick? Once -> T0/T1;
   per-item over a known set -> T4; per-tick on a stream -> T3.
3. **Depth**: is the answer one step from <=255 options? Yes -> Choice.
   No -> T5 beam or T6 tournament.

Then the edges: independent sub-judgments feeding one composite -> T7; a
high-stakes action -> add a T2 verify leg; incomplete option space -> exit
option + abstain branch.

Write the **structure spec** before questions:

```
system:    what the feature does
flows:     list of decision pipelines
per flow:  topology | calls-per-decision | state-flow (what each call sees)
           | primitives per question | composition policy | on_failure
```

## The meta-layer: the skill uses the skill

Two forms, both field-proven:

**Design-time (the compiler's META steps)**: two banks, two grains.

- `assets/design-questions.json`: system grain. State = `{problem}`. Returns
  family, topology, seq/map/loop, risk, granularity, `needs_decompose`.
  Decompose on named-consumer count (and the noul as a prior), not on
  granularity alone.
- `assets/compile-questions.json`: flow grain. State = `{flow}`. Returns
  topology, seq/map/loop, primitives, `needs_exit_option`, `needs_verify_leg`,
  `collapse_chain_to_fanout`.

System grain:

```bash
printf '{"id":1,"state":{"problem":"<describe the task>"}}\n' > problem.jsonl
TYPESAFE_API_KEY=... python3 scripts/jev_batch.py \
    problem.jsonl assets/design-questions.json design.jsonl
```

Read the recommendation as a prior, not a verdict: Jev proposes the family and
topology, code (and the agent reading `02`) still owns the structure spec.
Low confidence on `topology` means the problem is genuinely multi-structure:
decompose it into flows and re-run per flow.

**Runtime (router-Jev)**: a Jev call that decides which Jev flow runs: eve's
`auto` model routing, app.customagents.io's skill-choice shadow. The routing
call is a normal T0/T1 with the flow names as Choice options; the routed
flow is whatever structure its problem needs.

Official cookbooks that are STRUCTURE variants, not new families (read live):

| Cookbook | Structure to steal |
|---|---|
| function_calling | Choice over handler names + closed-set arg questions (T1 speculative) |
| entity_alignment | Score levels ARE the actions (merge / leave / curator). No threshold to fit |
| semantic_find | Choice over line/span ids already in state |
| classification_using_confidence | report leaf vs parent division by Choice confidence |
| date_extraction | Choice per date part + `none`; arithmetic in code |
| sde_cascade | T2: cheap extract then verify |

## Cost and latency model

| Structure | Calls per decision | Wall latency | When it matters |
|---|---|---|---|
| T0/T1 | 1 | ~70 to 500ms | default interactive |
| T2 (2 calls) | 2 serial | ~200ms to 1s | budget for interactive paths |
| T3 | 1 per tick | tick budget | games/UI: keep state extract cheap |
| T4 | N parallel | ~1 batch | throughput-bound, not latency |
| T5 | 1 + k serial | ~300ms to 1.5s | deep labels only |
| T6 | N (items) | batch | offline adjudication |
| T7 | 1 | ~70 to 500ms | composites |

Fan-out questions inside a call are free on latency; serialized calls are
the cost to watch. If a chain threatens an interactive budget, collapse it:
ask the chain's first question plus all branches' questions in one T1 call
and read the relevant leg (speculative fan-out replaces a 2-hop chain).

Token cost: `tokens_in ≈ tokens(state) + tokens(questions)`, billed at
$0.042/M input (output free). A 2k-token state judged 1,000 times costs
~$0.08. Fan-out is token-cheap (questions are small) but NOT free: a 30-
question bank over a 10k state still sends the 10k state once. Chains and
maps multiply state tokens by call count; a T4 map over N records costs
N × state tokens, so trim per-record state in maps.
