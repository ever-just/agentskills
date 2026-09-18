# Jev shipping checklist

Run before any Jev feature goes live. Each item maps to a reference section.

## Design

- [ ] The decision is written as a branch/threshold/ranking in code: not "Jev decides what to do" (SKILL.md §method)
- [ ] One narrow judgment per question; no question weighs two properties (03)
- [ ] Primitive matches what code consumes: noul for yes/no signal, choice for a set, score for a degree (03)
- [ ] Every Choice that may have an incomplete option set includes `none`/`other` (02 §2)
- [ ] State contains the EVIDENCE (the actual text/candidates/diff), not assertions about it (03)
- [ ] Code computes everything computable (dates, counts, orderings, buckets) before state is built (01, 03)
- [ ] All questions sharing the state fan out in ONE call; second calls only for dependent evidence (03)
- [ ] Score levels describe concrete situations, not intensities, and stand alone (03)

## Safety

- [ ] Feature behind its own env flag, default OFF; missing key = inert (04)
- [ ] Fail-open vs fail-closed vs abstain chosen per call site, documented (04). Field data: 59% of public impls specify NO failure path; choosing one puts you ahead of most (07)
- [ ] Untrusted-content line appended to every question over user/external text (03, 04)
- [ ] PII + secrets redacted BEFORE the call; raw state never logged (04)
- [ ] Keys server-side only; dedicated gateway key per surface (04)
- [ ] Jev cannot execute side effects: its `action` answers are advisory inputs to code (02 §13)
- [ ] TOCTOU: inputs re-validated after the call when the judged object can move (04)
- [ ] Timeout set and honored (inline ~800ms-2s, offline ~45s); inline calls don't retry (04)

## Evidence it works

- [ ] Frozen eval set exists (real + edge + adversarial cases) and is versioned with the questions (05)
- [ ] Shadow mode ran; eval fails if Jev never ran (04, 05)
- [ ] Thresholds fitted on YOUR distribution, per action, holdout verified (05)
- [ ] Verification doc written: agreement rate, per-disagreement analysis, thresholds, gaps (05)
- [ ] Resolved `model` version logged, not the alias (01, 04)

## Operations

- [ ] Telemetry stamped per call: provider, model, question ids, answers, probabilities, latency, fallback flag (04)
- [ ] Alert on fallback rate / confidence drift, not individual answers (05)
- [ ] Review queue emits uncertain cases with raw probabilities attached (05)
- [ ] One-env-unset rollback tested: byte-identical pre-Jev behavior (04)
- [ ] Cost checked: state tokens × call volume × $0.042/M (01)
- [ ] Latency budget set for the call site; Jev is off the path if it busts (04)

## When NOT to ship it

- [ ] Not being used for generation (prose, code, summaries): that needs an LLM (SKILL.md)
- [ ] Not replacing authorization, schema validation, or hard policy: Jev advises, code enforces (SKILL.md)
- [ ] Not a single high-stakes judgment with zero calibration data: fit thresholds or add a human (05)
