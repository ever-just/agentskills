# System design: Jev as a computational operator

Read this before writing questions. It covers the layer the rest of the skill
assumes but never spells out: how to shape a problem into a structure of calls
whose outputs code can use directly.

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
4. **Score levels need semantic anchors** in the rubric (what 1 means, what 5
   means) so numbers compare across calls and across time.
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

**Design-time (ship this)**: `assets/design-questions.json` is a question bank
that takes a problem description as state and returns a structure spec:
family, topology, which primitives, whether the problem needs chaining, a map,
or a loop, plus risk and granularity. Run it:

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

Fan-out questions inside a call are free; serialized calls are the cost to
watch. If a chain threatens an interactive budget, collapse it: ask the
chain's first question plus all branches' questions in one T1 call and read
the relevant leg (speculative fan-out replaces a 2-hop chain).
