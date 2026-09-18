# Frozen API reference — TypeSafe Jev / System One

Snapshot verified 2026-09-18 against the live API (`jev-1.13.0`). Live docs at
`https://docs.typesafe.ai/llms.txt` supersede this file when they disagree.

## Endpoint

```
POST https://api.typesafe.ai/v1/systemone
Authorization: Bearer $TYPESAFE_API_KEY
Content-Type: application/json
```

`GET https://api.typesafe.ai/v1/models` lists available models. Live aliases
(observed): `jev-latest` (stable) and `jev-preview` (newer, "should be better in
most ways"), both currently resolving to `jev-1.13.0`. The response echoes the
resolved version in `model` — log that, not the alias, for reproducibility.

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

- `state`: the shared context every question sees. Prefer named JSON fields so
  questions can point into it with backticked paths like `` `ticket.messages[0].text` ``.
- `questions`: map of id → question. IDs are for your code only; the model never
  sees them. Put the full meaning inside the question.
- All questions evaluate independently and in parallel over the same state.
  They never see each other's answers — make a second request only when an
  answer is needed to fetch data or build the next state.

### Question shape

```json
{
  "type": "noul" | "choice" | "score",
  "instructions": <string | object | array>,
  "criteria": <string | object>   // required for choice; required for score (levels)
}
```

- `instructions`: the judgment, in full. Object/array forms allow labeled parts:
  useful keys are `question`, `focus`, `inspect`, `note`, `compare` (list of
  state paths), `field` (a `name/type/unit/description` record shared across questions).
- `criteria` for **Choice**: map of option → description. Descriptions should
  contrast near neighbors (`what` / `not_for` / `examples` object form works well).
  Max ~255 options.
- `criteria` for **Score**: ordered list of 2 to 10 level descriptions, low→high.
  Each level must describe a concrete situation and stand alone — the model sees
  no level numbers and no neighbors.
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
    "severity": {"type": "score", "score": 2.4,
                 "probabilities": {...}, "confidence": 0.71,
                 "legend": [...]}
  },
  "usage": {"input_tokens": 9598, "output_tokens": 3381}
}
```

- **noul answer**: `noul` = P(statement true), 0 to 1. No separate confidence —
  a value near 0.5 IS the uncertainty signal.
- **choice answer**: winning `choice`, full `probabilities` distribution,
  `confidence` = distribution concentration (not correctness).
- **score answer**: probability-weighted `score` position, per-level
  `probabilities`, `confidence`, and the `legend` echo.
- `usage`: input tokens billed ($0.042/M); output tokens free. A 32-question
  call over ~9.6k input tokens cost ~$0.0004 (measured).

## Limits & errors (as of jev-1.13)

| Limit | Value |
|---|---|
| state + all questions | 64k tokens |
| state + longest single question | 32k tokens |
| Choice options | 255 |
| Score levels | 2 to 10 |
| Latency | ~70–500ms typical; ~570ms for a 32-question call over 9.6k tokens (measured) |
| Retryable errors | `429` (rate), `529` (overloaded) — exponential backoff |

Non-2xx responses return a JSON error body. Retry only on 429/529; treat other
errors as input/shape bugs.

## SDKs and alternate paths

| Path | Shape | When |
|---|---|---|
| Raw HTTP | shown above | minimal deps; any language |
| `typesafe` PyPI (`typesafe-sdk-python`) | `TypeSafeClient(api_key=...).evaluate(model=..., state=..., questions=...)` — sync+async, auto-retry | Python services |
| `@typesafe-ai/sdk` npm (`typesafe-sdk-js`) | `new TypeSafe({apiKey}).evaluate({model, state, questions})` | TS/JS services |
| Vercel AI SDK | `experimental_evaluate({model: gateway.evaluation('typesafe-ai/jev'), state, questions})` (ai ≥7.0.105); noul exposed as `boolean` question type | apps already on AI SDK / AI Gateway |
| LiteLLM | `systemone` passthrough + `complexity_router` strategy | existing LiteLLM deployments |
| MCP | `itsmostafa/typesafe-mcp`, `jkudish/jev-mcp`, `Brainwires/jevwire` | give a coding agent direct Jev access |
| `system-one-adapter-python` (official) | Drop-in TypeSafeClient backed by an ordinary LLM | offline dev/testing without a key, or LLM-fallback comparisons |

Community ports exist for Go, Rust, PHP/Laravel, Ruby/Rails, .NET, Scala (ZIO),
Elixir — see `06-ecosystem.md`.

## State design rules (summary — deep version in 03)

- Smallest state that answers every question. Unrelated detail lowers accuracy.
- Compute in code first: dates, durations, counts, sums, orderings, buckets.
  Send the result, not the raw data.
- Convert encodings to words (color name not hex, named bucket not raw figure).
- Retrieve/filter in code before sending; a relevance noul per candidate is the
  fallback when code cannot filter.
- Text in state can steer answers — Jev does not treat it as hostile. Mark
  untrusted content explicitly in instructions.

## Pricing & budgeting

$0.042 per million input tokens; output free. Rough numbers: a support-triage
state (~500 tokens) with 6 questions costs ~$0.00002/call; a 4,000-item batch
with 4 questions each ≈ $0.17 total. Fan-out questions over the same state add
tokens linearly but ~no latency (they run in parallel).
