# Evaluation & calibration

How to prove a Jev feature works before trusting it, and how to set thresholds
on your data instead of copying cookbook numbers.

## The evaluation ladder (in order)

```
1. Frozen eval set ──► 2. Shadow mode ──► 3. Threshold fitting ──► 4. Live canary ──► 5. Telemetry loop
```

## 1. Frozen eval sets

- Collect REAL representative cases (production traffic, hand-picked edge cases,
  adversarial text, missing fields, out-of-domain inputs). 50 well-chosen cases
  beats 500 lazy ones. app.customagents.io froze 50 inbound cases.
- JSONL, one case per line:

```json
{"id": "case-017", "state": {...}, "expect": {"decision": "respond", "rider": true}}
```

- Freeze it the day you write the questions: version it with them. Question
  definitions, state schema, thresholds, and the eval set are ONE unit of change.
- `scripts/jev_eval.py` runs a case set and reports per-question accuracy,
  confidence stats, and every disagreement with expected labels.
- Governance: a question bank is a versioned code artifact, not config. Every
  change to instructions, criteria, or thresholds ships through the same review
  as code AND must re-pass the frozen eval before merge (eval-gated questions).

## 2. Shadow mode (record, don't act)

- Jev judges and logs alongside the incumbent path; incumbent still decides.
- The shadow eval must FAIL if Jev never ran: otherwise a dead key or flag
  silently "passes" the incumbent (the jev-shadow-eval `--live` check).
- Minimum useful shadow window: enough traffic to cover the question's real
  distribution, including the boring majority case.

## 3. Threshold fitting

Calibrated probabilities mean a noul of 0.7 is ~right 70% of the time across
similar cases: which makes threshold fitting a data problem, not a vibes one.

1. Run the eval set (or shadow logs) and collect `probabilities`/`confidence`.
2. For each action, pick the threshold that maximizes YOUR metric (precision at
   the risky branch usually; recall at the cheap branch).
3. Per-action thresholds, never one global number. Money/legal ≠ chitchat gate.
4. Reserve a holdout slice for the final check: thresholds fitted and verified
   on the same data are optimistic.

| Action risk | Starting band to evaluate |
|---|---|
| Harmless preference pick | act ≥0.5, ignore confidence |
| Normal routing/dispatch | act ≥0.6, review 0.3 to 0.6 (firstmate ships 0.6) |
| Output-blocking guardrail | block ≥0.8 OR escalate; review below |
| Irreversible side effect | two independent checks, or Jev + human sign-off |

## 4. Verification doc (publish it)

firstmate's dispatch work shipped the field's best example: live Jev run vs
hand labels: 20/25 matched, every disagreement explained, confidence floors
documented. Reproduce that shape:

```
## Verification: <feature> on <N> cases
- method: frozen set / shadow / live sample
- agreement: X/N (per-question table)
- disagreements: each case, Jev said X vs label Y, why (evidence/instruction/model)
- thresholds chosen: per action, with the distribution they were fit on
- known gaps: what's unmeasured (rare classes, out-of-domain, drift)
- recheck date: model version noted (resolved id, not alias)
```

## 5. Calibration reading

- Noul ≈0.5 = "unsure between yes/no", NOT "medium". Band it, don't binarize.
- Choice/Score `confidence` = distribution concentration, not correctness.
- Calibrated describes GROUPS of predictions. One judgment can still be wrong: that's what the review band and the eval set are for.
- Recheck calibration after model upgrades (`jev-preview` vs `jev-latest`) and
  after changing state shape: the same question on different evidence is a
  different question.

## 5b. The falsification battery: verify the judge itself

Frozen cases prove the bank agrees with labels. They do NOT prove the bank is
asking what you think it asks. Run these four probes on every load-bearing
question before trusting its numbers; each has caught a real bug the eval
report hid.

1. **Inverted-question falsification.** Ask the load-bearing noul in the
   opposite direction on the same corpus ("was silence wrong here?" vs "did
   this need a response?"). Symmetric questions should land near-complementary;
   a large asymmetry (one direction firing 94 vs 41 in a real run) means the
   wording carries a framing bias the accuracy number hides. Fix the wording
   until the inverted forms roughly mirror, or pick one canonical direction and
   document why.
2. **Blinded-state attribution.** Re-run the bank with one state field
   removed (the prompt, the retrieved docs, the draft). If a question's answer
   barely changes, it was not reading that evidence; it was pattern-matching
   something else. Conversely, if removing a field FLIPS a question you
   expected to ignore it, the question is reading the wrong field.
3. **Dead-question sweep.** A noul whose probability is near-constant across
   the whole corpus (fired ~99% on everything in a real run) is broken, not
   informative: usually a wording so broad it matches anything, or the field
   it inspects is empty everywhere. Check per-question probability variance on
   a batch before reading accuracy.
4. **Paraphrase stability.** Re-phrase the instruction (same condition,
   different words) and re-run. ~80%+ agreement between paraphrases is the
   observed acceptable bar; much lower means the question is riding its exact
   wording, not the underlying condition, and will drift under edits.

Rule of thumb: the eval measures agreement with labels; the battery measures
whether the labels could have meant something else. Both must pass.

## 6. Failure-mode triage on misses

| Symptom on eval misses | Cause | Fix |
|---|---|---|
| Near-tie probabilities, wrong pick | boundary/coverage | sharpen contrastive criteria; add `none` |
| Confident AND wrong | instruction or evidence | the words asked the wrong question; or the evidence needed isn't in state |
| Mid probabilities everywhere | missing evidence | put the data in state, not a description of it |
| All misses on one slice | unrepresentative state for that slice | slice-specific criteria or a second question |
| Eval passes but prod fails | frozen set ≠ real distribution | resample eval cases from prod |

## 7. The human-review queue is a deliverable

Uncertain cases aren't failures to hide: they're the routing product. Emit a
review queue (probability band + low-confidence filter) as a first-class output;
the self-consistency cookbooks route uncertain nouls to humans WITH the raw
probabilities attached so the human sees the model's actual uncertainty.

## 8. Continuous loop (auto-improve)

```
per-turn telemetry ──► nightly aggregation ──► threshold/rule PROPOSALS ──► human accept/reject
```

- Never let Jev telemetry auto-apply changes; proposals go through an owner
  gate (app.customagents.io's AgentConfigChange + Accept/Reject UI).
- Alert on fallback rate and confidence drift, not on individual answers.
