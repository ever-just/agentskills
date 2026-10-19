# Living log: new use cases found in the field

Append-only. The compiler (`08`) and the 14-family catalog (`02`) stay stable.
When a session discovers a real Jev use that is not already a family or
topology, add one entry here so the skill evolves without bloating SKILL.md.

Do not promote an entry into `02` until it has been seen twice in independent
repos or shipped in production. Multipurpose stays in the compiler; this file
is evidence.

## Template (copy)

```
### YYYY-MM-DD: short name
- problem:
- consumers (typed values code actually used):
- topology (T0 to T7, nested if any):
- primitives:
- bank path or inline qids:
- evidence (repo / PR / eval):
- promote to 02?: no
```

## Entries

### 2026-09-20: margin-gated adjudication of an incumbent LLM classifier
- problem: a production agent already has an LLM classifier deciding respond/wait/escalate
  per inbound (CustomAgents `classifyEmail` → `requiresResponse`/`shouldEscalate`). Replacing
  it wholesale loses its prompt-tuned categories; keeping it untouched leaves a 16% wrong
  rate and a 37%-silence email channel.
- consumers (typed values code actually used): `adjudication` Choice{accept,
  override→category, escalate_review} fired only when the classifier's own top-2 margin is
  under a fitted threshold; plus `disposition` Choice{reply, wait, clarify, decline_route,
  escalate} that may override `wait` but may only veto `reply` under the margin.
- topology (T0 to T7, nested if any): T2 chain — incumbent classify → margin gate → Jev
  adjudication → code precedence rules actuate.
- primitives: choice (+ probability mass used for the margin).
- bank path or inline qids: inline (`adjudication`, `disposition`, `money_legal`, `urgency`).
- evidence (repo / PR / eval): app.customagents.io docs-internal/agent-architecture-research/
  JEV-NEXT-LEVEL-EMBED-MAP.md P1.1/P2.2 + fixtures/jev-email-disposition.jsonl (40
  outcome-labeled cases from a 442-conversation production pull).
- promote to 02?: no — recombination of §1 inbound_triage + §14 eval_observability; one repo.
  Note the asymmetry worth remembering: the adjudicator may *add* replies freely but may
  *remove* them only under margin — anti-silence bias lives in the precedence rule, not the
  model.

### 2026-10-08: batch search query triage and page coverage into an SEO action list
- problem: Search Console and Bing Webmaster exports for a small site (904 judged queries) need
  a ranked list of what to do (create a page, strengthen a page, rewrite a snippet, review,
  ignore) without a person reading every query. Code computes impressions, position and click
  gaps; it cannot tell whether a query is off topic, whether a page already answers it, or
  whether it names a competitor.
- consumers (typed values code actually used): `action` (10 values from a decision order),
  `opportunity` (arithmetic over measured numbers, gated by the judgments), cluster and page
  roll ups, a human review queue, a competitor discovery queue.
- topology (T0 to T7, nested if any): T4 map over queries. Flow A: one T1 fan out of 5
  questions per query. Flow B: T2 chain (code gate on Flow A, then T4 map; one T1 call of 6 fit
  scores plus a best_page choice over a lexical top 6). Flow C: T4 map of one T0 score.
- primitives: noul (is_irrelevant, names_competitor), choice (intent, topic_cluster,
  best_page), score (icp_fit, page fit, snippet_promise).
- bank path or inline qids: one bank file with every threshold (`src/bank.ts` in the jev-seo
  project), thresholds pre-registered and compared with the fitted ones on a holdout.
- evidence (repo / PR / eval): 58 frozen cases labeled blind to Jev by an assistant (not human
  reviewed); 10 of 12 floors held, 2 left advisory; falsification battery 24 of 24; 299 offline
  tests; total spend $0.126. SYSTEM.md and VERIFICATION.md in the project.
- promote to 02?: no, recombination of §9 batch analysis, §6 reranking and §12 composite
  scoring; one repo. Worth remembering: a noul with no positives in the sample (0 of 7 labeled
  irrelevant reached the 0.7 line) works as a ranking, not a filter; scores for near topic pages
  cluster at 2.0 to 2.8 so served/partial cutoffs flip on small differences, so verify coverage on
  the page text; `in` accepts inherited object keys, so validate choices with `Object.hasOwn`.

(none yet above this line: start of log, 2026-09-18)
