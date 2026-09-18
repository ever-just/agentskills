# Agentic systems: research, audit, embed

Jev does not make an agent "more autonomous." It makes an agent **more
dynamic at the judgment layer**: wait vs reply, which tool, whether the
draft is safe, what memory to keep. The LLM still generates. Code still
owns the loop. This file is how to *find* those judgments, *prove* them,
then *ship* them inside a SaaS agent.

Not a 15th family. An agent is a **system of families** (§1 + §2 + §3 +
§10 + §14). Compile it with `08`. Cross-ref sibling skills for log
forensics and qualitative grades; this skill is Jev as the instrument
and as the live decision layer.

Sibling skills (do not copy them):
`../../production-agent-audit/SKILL.md` (pull every log, triangulate),
`../../agent-quality-grading/SKILL.md` (per-conversation grades).

## The loop (never skip a phase)

```
RESEARCH  T4 map over real turns
          -> ranked opportunities (named consumers)
AUDIT     freeze misses as cases; shadow Jev vs incumbent
          -> jev_eval --live must beat or match the heuristic
EMBED     judgment plane in the SaaS (flag -> shadow -> live)
          -> stamp AgentTurn.judgment
TELEMETRY those stamps ARE the next research corpus
```

Research without embed is a slide deck. Embed without research cases is
guessing thresholds. Telemetry without a next research pass is a dead
stamp.

## RESEARCH: make the agent better by measuring it

Goal: a short list of **named consumers**, not a narrative report.

1. Pull a corpus of turns (inbound, tools offered, tools used, draft,
   retrieved snippets, memory hits, outcome if known). Redact before
   Jev (`04`). State is evidence, not a summary of the turn.
2. Map `assets/agent-research-questions.json` over the turns with
   `scripts/jev_batch.py` (T4 of T1).
3. Rank by noul / score. The top band (`>0.7`) is the embed queue.
   The mid band is review, not a skip and not an auto-embed.
4. Each surviving item becomes a **named consumer** for COMPILER:
   `should_wait`, `pick_tool`, `block_draft`, `drop_memory`. If you
   cannot name the code branch, it is not a Jev problem yet.

What to look for (the research bank already asks these):

| Opportunity | Typical embed |
|---|---|
| Agent replied when it should have waited | §1 wait/respond |
| Wrong or extra tool call | §2 pick + `none` + verify |
| Empty promise / email-shaped SMS | §3 output verify |
| Money/legal content treated as small talk | §1 + §13 gate |
| Context dump / stale memory | §10 keep/drop |
| Expensive model on a cheap turn | §2 model router |
| Ungrounded citation | §8 verify |
| Human needed, agent improvised | §1 escalate / §2 abstain |

## AUDIT: freeze, shadow, then argue with numbers

1. Promote research hits (and a matching set of clean turns) into a
   frozen JSONL. 20 to 50 cases beat 500 unlabeled ones (`05`).
2. Write expected labels from the research answers plus a human pass
   on the mid band. Version the bank with the cases.
3. `scripts/jev_eval.py --live`. Fail the eval if Jev never ran.
4. Shadow in prod: Jev judges, incumbent still acts, log both (`04`).
5. Flip live only where Jev ≥ incumbent on THIS set. Different
   consumers can ship on different flags.

`production-agent-audit` answers "what happened in the logs."
`agent-quality-grading` answers "how well did it talk."
This phase answers "would *this* Jev bank have judged the turn
correctly, and is that enough to take the wheel."

## EMBED: the agent spine inside the SaaS

Five flows, one wrapper, one constants file. Optional sixth if the
agent drives a UI.

```
inbound
  -> [1] wait | respond | escalate     T1  §1   fail-open to incumbent
       |
       v
  [2] pick tool/skill/model | none     T1+T2 §2  fail-abstain
       |
       v
  LLM generates (Jev does not write)
       |
       v
  [3] screen draft (empty promise,     T1  §3   fail-closed
      channel shape, jailbreak)
       |
       v
  send
       |
       v
  [4] memory keep/drop                 T4+T6 §10 fail-open (keep)
  [5] stamp judgment on the turn       §14  never blocks the user
```

Place the wrapper **before generate** (1, 2), **after draft** (3),
**on memory write** (4), **always** (5). Do not put Jev inside the
LLM prompt.

Live shape to steal: app.customagents.io inbound wait/respond + rider
+ money/legal, draft-shape nouls, `AgentTurn.judgment` telemetry,
shadow eval of 50 frozen cases, flag per consumer.

Computer-use / desktop agents add a T3 tick (catalog §4 / §5) as
flow 6. Multi-agent handoff is still §2 (Choice over agent profiles
+ `none`). Jev does not run a supervisor debate.

## Coding-agent session on an existing SaaS agent

1. Find traces. If none, you cannot research; ship stamp (flow 5)
   first, then come back.
2. Redact + map `assets/agent-research-questions.json`.
3. COMPILER each high-noul consumer (usually 1 to 3 flows, not all
   five on day one).
4. Copy `assets/wrappers/jev.py` or `jev.ts` if no client exists.
5. Shadow the new flow. Frozen eval in CI.
6. Live on one consumer. Telemetry becomes the next research batch.

## Anti-patterns

- Research forever, never name a consumer.
- Embed all five flows at once with cookbook thresholds.
- Ask Jev to plan the next agent step or write the reply.
- A second TypeSafe client next to an existing wrapper.
- Using this file as a substitute for `production-agent-audit` when
  the question is "what did we actually do in logs."
