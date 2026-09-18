# Frozen API reference: TypeSafe Jev / System One

Snapshot verified 2026-09-18 against the live API (`jev-1.13.0`). Live docs at
`https://docs.typesafe.ai/llms.txt` (append `.md` to page paths) supersede this
file when they disagree.

External sources: cookbooks listed at `docs.typesafe.ai/llms.txt` (~18 recipes,
mapped to families in `02`); workflow evals at `evals.typesafe.ai` (4 reference
workflows); deep question-craft skill `github.com/dbreunig/building-with-jev-skill`;
official agent skill `github.com/typesafe-ai/skills`.

## Endpoint

```
POST https://api.typesafe.ai/v1/systemone
Authorization: Bearer $TYPESAFE_API_KEY
Content-Type: application/json
```

`GET https://api.typesafe.ai/v1/models` lists aliases the account can send.
Live aliases (docs 2026-09-18): `jev-latest` (stable, SDK default) and
`jev-preview` (currently the same build; no preview ahead right now). Both
resolve to `jev-1.13.0`. The response's `model` field is the versioned ID:
log that, not the alias. Pin `jev-1.13.0` (not the alias) once thresholds
are fitted; aliases move when a release ships.

## Request

```json
{
  "model": "jev-latest",
  "state": <string | object | array>,
  "questions": {
    "<question_id>": <question>,
    ...
  }
}
```

- `state`: string, JSON object, or array of text. Prefer named JSON fields so
  questions can point into it with backticked paths like `` `ticket.messages[0].text` ``.
  A string is enough for one piece of text; an array is a sequence of records.
- `questions`: map of id → question. IDs are for your code only; the model never
  sees them. Put the full meaning inside the question.
- All questions evaluate independently and in parallel over the same state.
  They never see each other's answers: make a second request only when an
  answer is needed to fetch data or build the next state.

Mini-glossary: `state` = shared evidence; `questions` = the operator bank;
`instructions` = what the question asks; `criteria` = the option/level
definitions; `noul` = probability a statement is true; `choice` = argmax over
options + `confidence` (distribution concentration); `score` = rubric level +
`confidence`; `probabilities` = the full answer distribution (log it).

### Question shape

```json
{
  "type": "noul" | "choice" | "score",
  "instructions": <string | object | array>,
  "criteria": <string | object | array | null>   // required for choice (map; value may be null) and score (levels array)
}
```

- `instructions`: the judgment, in full. Object/array forms allow labeled parts:
  useful keys are `question`, `focus`, `inspect`, `note`, `compare` (list of
  state paths), `field` (a `name/type/unit/description` record shared across questions).
- `criteria` for **Choice**: map of option → description (or `null` when the
  key is self-explanatory). Descriptions should contrast near neighbors
  (`what` / `not_for` / `examples` object form works well). Max ~255 options.
- `criteria` for **Score**: ordered list of 2 to 10 level descriptions, low→high.
  Each level must describe a concrete situation and stand alone: the model sees
  no level numbers and no neighbors. The returned `score` is a
  **probability-weighted position that can land BETWEEN levels** (docs example:
  `1.035` on a 0/1/2 rubric). `legend` is a map of string keys `"0"`, `"1"`,
  `"2"` to the level text, not an array. Never write "1=worst...5=best" in
  instructions. Compare `score` to a threshold (`if score >= 1.5`); do not
  treat it as an int enum and do not interpolate it back into a physical
  quantity (jev-1.13 numerical calibration between levels is weak).
- `criteria` for **Noul**: optional `{true: ..., false: ...}` boundary hints.

## Response

```json
{
  "model": "jev-1.13.0",
  "answers": {
    "wants_refund": {"type": "noul", "noul": 0.97},
    "route": {"type": "choice", "choice": "billing",
              "probabilities": {"billing": 0.91, "support": 0.08, "sales": 0.01},
              "confidence": 0.87},
    "severity": {"type": "score", "score": 1.6,
                 "probabilities": {"0": 0.05, "1": 0.3, "2": 0.65},
                 "confidence": 0.78,
                 "legend": {"0": "Calm", "1": "Frustrated", "2": "Very angry"}}
  },
  "usage": {"input_tokens": 9598, "output_tokens": 3381}
}
```

- **noul answer**: `noul` = P(statement true), 0 to 1. No separate confidence: a value near 0.5 IS the uncertainty signal.
- **choice answer**: winning `choice`, full `probabilities` distribution,
  `confidence` = distribution concentration (not correctness).
- **score answer**: probability-weighted `score` (may fall between levels),
  per-level `probabilities` (string keys), `confidence`, and `legend` as a
  string-key map. Threshold it; do not interpolate.
- `usage`: input tokens billed ($0.042/M); output tokens free. A 32-question
  call over ~9.6k input tokens cost ~$0.0004 (measured).

## Limits & errors (as of jev-1.13)

| Limit | Value |
|---|---|
| state + all questions | 64k tokens |
| state + longest single question | 32k tokens |
| Choice options | 255 |
| Score levels | 2 to 10 |
| Latency | ~70 to 500ms typical; ~570ms for a 32-question call over 9.6k tokens (measured); docs also cite ~100ms for common queries |
| Rate limits (dynamic; 2026-09-18) | 1,200 req/min and 250,000 tokens/s; 429 when either trips; honor `retry-after` |
| Retryable errors | `429` (rate), `529` (overloaded): exponential backoff |
| Language | English is the primary training language. Other languages, including CJK, are accepted with lower accuracy: test on the actual corpus and lean harder on confidence. |
| Input | text only: string, JSON object, or array of text. No image, audio, video. |
| Customization | no customer fine-tune/LoRA; shape answers via state + instructions + criteria |

Non-2xx responses return a JSON error body. Retry only on 429/529; treat other
errors as input/shape bugs.

## SDKs and alternate paths

| Path | Shape | When |
|---|---|---|
| Raw HTTP | shown above | minimal deps; any language |
| PyPI `typesafe-sdk` (import `typesafe_sdk`) | `TypeSafeClient(); client.system_one(state=..., questions={...Choice/Noul/Score})`. Reads `TYPESAFE_API_KEY`. Python >=3.10. Default model `jev-latest`. Sync+async, retries honor `retry-after`. | Python services |
| npm `@typesafe-ai/sdk` | `import { TypeSafeClient, choice, noul, score } from "@typesafe-ai/sdk"` then `client.systemOne(...)`. | TS/JS services |
| Vercel AI SDK | `experimental_evaluate({model: gateway.evaluation('typesafe-ai/jev'), state, questions})` (ai ≥7.0.105); noul exposed as `boolean` question type | apps already on AI SDK / AI Gateway |
| LiteLLM | `systemone` passthrough + `complexity_router` strategy | existing LiteLLM deployments |
| MCP | `itsmostafa/typesafe-mcp`, `jkudish/jev-mcp`, `Brainwires/jevwire` | give a coding agent direct Jev access |
| `system-one-adapter-python` (official) | Drop-in TypeSafeClient backed by an ordinary LLM | offline dev/testing without a key, or LLM-fallback comparisons |

Community ports exist for Go, Rust, PHP/Laravel, Ruby/Rails, .NET, Scala (ZIO),
Elixir: see `06-ecosystem.md`.

## State design rules (summary: deep version in 03)

- Smallest state that answers every question. Unrelated detail lowers accuracy.
- Compute in code first: dates, durations, counts, sums, orderings, buckets.
  Send the result, not the raw data.
- Convert encodings to words (color name not hex, named bucket not raw figure).
- Retrieve/filter in code before sending; a relevance noul per candidate is the
  fallback when code cannot filter.
- Text in state can steer answers: Jev does not treat it as hostile. Mark
  untrusted content explicitly in instructions.

## Pricing & budgeting

$0.042 per million input tokens; output free. Rough numbers: a support-triage
state (~500 tokens) with 6 questions costs ~$0.00002/call; a 4,000-item batch
with 4 questions each ≈ $0.17 total. Fan-out questions over the same state add
tokens linearly but ~no latency (they run in parallel).
