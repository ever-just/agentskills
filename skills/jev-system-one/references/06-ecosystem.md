# Ecosystem — integrations, ports, reimplementations

The public landscape 3 days post-launch (research sweep 2026-09-18, ~190 usages
across ~150 repos). Use it to pick a stack, find a reference implementation, or
avoid rebuilding what exists. Stars are a freshness signal, not a quality verdict.

## Official TypeSafe artifacts

| Repo | What |
|---|---|
| `typesafe-ai/typesafe-sdk-python` (61★) | Python SDK — sync+async, retry built in |
| `typesafe-ai/typesafe-sdk-js` (94★) | `@typesafe-ai/sdk` — TS/JS |
| `typesafe-ai/system-one-adapter-python` (92★) | LLM-backed drop-in TypeSafeClient (offline dev, LLM-fallback comparison) |
| `typesafe-ai/skills` (135★) | official agent skill (conceptual model) |
| `evals.typesafe.ai` | 4 published workflows: security incident triage, agent trace observability, invoice 3-way match, customer-service next-action |
| `console.typesafe.ai` | playground with shareable queries |
| blog demos | Doom bot (~10 decisions/sec), Wikiracing (two-stage past 255 options) |

## Framework & platform integrations

| Where | Integration |
|---|---|
| `vercel/ai` | `@ai-sdk/typesafe-ai` — `experimental_evaluate` provider |
| `vercel/eve` (5.2K★) | `auto` model router (Jev picks the LLM) + standalone `evaluate` |
| `vercel-labs/ai-cli` (775★) | terminal agent evaluation |
| `langchain-ai/langchain` + `langchainjs` | official `TypeSafeClassifier` Runnable (py+js) |
| `pydantic/pydantic-ai` | `pydantic_ai/providers/typesafe.py` |
| `laravel/ai` | `TypeSafeGateway.php` |
| `ComposioHQ/composio` | `@composio/typesafe` — tool selection with call/partial/abstain |
| `ax-llm/ax` | provider + `ax-typesafe` skill; multi-language conformance suite |
| `elizaOS/eliza` | `TypeSafeDecisionClient` service adapter |
| `BerriAI/litellm` | `complexity_router` strategy + `/v1/systemone` passthrough |
| `agentgateway/agentgateway` | `llm-guardrail-jev` webhook example |
| `lancedb/lancedb` (11.4K★) | first-party `TypeSafeReranker` (noul → `_relevance_score`) |
| `braintrustdata/braintrust-sdk-javascript` | auto-instrumentation for Jev calls |
| `latitude-dev/latitude-llm` | `ai-jev` shadow-decision-provider |
| `vellum-ai/vellum-assistant` | provider + model catalog |
| `cloudflare/cloudflare-docs` | model catalog entry |
| `different-ai/openwork` (23.6K★) | hardened PR test-coverage advisory (best security example) |

## MCP servers

`itsmostafa/typesafe-mcp` (37★) · `jkudish/jev-mcp` (54★) · `blakestone-x/jev-mcp` ·
`dakdevs/decide-mcp` · `Brainwires/jevwire` (MCP + embeddable DecisionModel lib).

## Community language ports (~25)

Go: `SergeAx/typesafe-sdk-go`, `2389-research/typesafe-go`, `FelineStateMachine/typesafe-go`,
`Stumble/jev-go`, `Gaurav-Gosain/jev-go`, `phureewat29/got-jev` ·
Rust: `netf/typesafe-sdk-rs`, `gilljon/typesafe-ai-rs`, `AbdelStark/typesafe-rs`, `AbdelStark/s1-rs` ·
PHP/Laravel: `Butochnikov/typesafe-sdk-php`, `Butochnikov/laravel-typesafe-jev` ·
Ruby/Rails: `GenieRobot/typesafe-ai-rails`, `kieranklaassen/ruby_llm-typesafe`, `joshmn/typesafe-sdk` ·
.NET: `saibimajdi/typesafeai-dotnet-sdk` ·
Scala: `jamesward/zio-typesafe-ai` (ZIO), `cequence-io/openai-scala-client` ·
Elixir: `agentjido/req_llm`, `agentjido/llmdb`, `nshkrdotcom/typesafe_sdk`, `ash-project/ash_ai`, `jvsteiner/jevex` ·
misc: `typesend/typesafe_ai`, `jb2197/pydantic-jev`, `snellingio/system-one` (lite server).

## Open-source reimplementations (~15)

| Repo | Approach |
|---|---|
| `ekzhang/openjev-sglang` (81★) | Jev-compatible API on open models, prefill-only sglang, BoolQ/MMLU-Pro evals |
| `bnsd55/jevmlx` (15★) | Jev-style parallel constrained decoding for any MLX model (Apple Silicon) |
| `vinnylarouge/jevlike` | option-attention trainer + Doom/chess demos |
| `Heman10x-NGU/Verdict-open-jev` | non-autoregressive ModernBERT-151M, calibrated uncertainty |
| `stephanj/parallelConstraintDecoding` | constrained decoding research |
| ~10 more `open-jev`/`openjev`/`NanoJev`/`mini-jev` variants | assorted rebuilds |

Signal: the interface is being treated as the product. Pin against it if you
want portability across providers.

## Notable application references by pattern

| Pattern | Best public reference |
|---|---|
| Inbound/agent judgment | ever-just/app.customagents.io (internal) |
| CI guardrail advisory | different-ai/openwork (hardening gold standard) |
| Tool pick with abstain | ComposioHQ/composio |
| Verified dispatch | kunchenguid/firstmate (verification doc to copy) |
| Browser/UI automation | browser-use/jev-ultrafast, awlevin/typesafe-computer-use |
| Corpus audit | this skill's origin run (442 convos + 4,018 msgs) |
| Context compaction | tamaratran/fast-jev-compaction |
| Rerank | lancedb TypeSafeReranker, dabit3 turbo-rerank |
| Games/interactive | fhshaik/typesafe-mario, RomanSlack/jev-drone |
| Trading loops | jarrodwatts/jev-trader (+4 more) |
| Code review | devagrawal09/jev-review (+3 variants) |

## The `pi` coding-agent sub-ecosystem

~10 repos building a coherent Jev layer on the pi runtime: auth (pi-fabric),
judgment (oh-my-pi Judge), routing (pi-jev-router), compaction
(pi-fast-jev-compaction), memory (pi-observational-memory-jev), warden
(pi-warden), auto-mode (pi-jev-auto-mode). Worth watching as the reference for
"Jev as an agent's decision layer" pattern.

## Curation sources for staying current

`Anil-matcha/awesome-jev-by-typesafe` (433★, evidence-backed) · `yibie/awesome-jev`
(62★) · `AnotiaWang/awesome-jev` (33★) · `yzfly/awesome-jev-zh` (Chinese,
daily auto-collected) · `AbdelStark/awesome-typesafe` (94★) · `gorock007/jev-atlas`.
The ecosystem tripled in 3 days; re-search before assuming a gap persists.
