# Architecture Archetypes

A map of the major system-design styles — including LLM/multi-agent and multi-tenant SaaS shapes — so you can pick the right structure for a given product before writing code, and know when *not* to.

> How to read this file: each archetype gives a one-line definition, when to use / when NOT to, key patterns, canonical references, and a real example system. Archetypes compose — a real product is usually a modular monolith *plus* an event backbone *plus* a multi-tenant control plane, not one pure style. Start at the "How to choose" table at the bottom if you already know your product's characteristics.

---

## 1. Monolith / Modular Monolith

**Definition:** A single deployable unit containing all application modules in one codebase and (usually) one process, where a *modular* monolith additionally enforces logical boundaries between modules via dependency rules and static analysis.

**Why it's usually the right default:** Almost every successful microservices story started as a monolith that grew too big and got split up; systems built as microservices from scratch tend to end up in serious trouble. Microservices carry a "premium" (network calls, distributed data, ops complexity) that only pays off past a certain scale, so a monolith is the correct starting point unless you have strong evidence otherwise.

| When to use | When NOT to use |
|---|---|
| New product / unproven domain (boundaries still fluid) | 50+ engineers needing independent deploy cadence across clear domains |
| Small-to-mid team (roughly 1–50 engineers) | Parts of the system have wildly different scaling/latency profiles that must scale independently |
| You want one deploy, one debug session, one transaction | Regulatory/blast-radius reasons force physical isolation of a component |
| Latency-sensitive internal calls (in-process, no network hop) | Teams are already blocked on each other's release trains |

**Key patterns:** enforced module boundaries (Rails Engines, Java modules, packages) + a boundary linter (Shopify's Packwerk); one shared database with clear ownership per module; "modularize first, extract to a service only when a boundary proves stable and painful to keep in-process."

**Canonical references:**
- [Martin Fowler — MonolithFirst](https://martinfowler.com/bliki/MonolithFirst.html)
- [Stefan Tilkov — Don't start with a monolith](https://martinfowler.com/articles/dont-start-monolith.html) (the counter-argument — read both)
- [Shopify — Deconstructing the Monolith](https://shopify.engineering/deconstructing-monolith-designing-software-maximizes-developer-productivity) and [Under Deconstruction: The State of Shopify's Monolith](https://shopify.engineering/shopify-monolith)
- [InfoQ — How Shopify Migrated to a Modular Monolith](https://www.infoq.com/news/2019/07/shopify-modular-monolith/)

**Real example:** Shopify's core — 2.8M+ lines of Ruby in one Rails codebase, kept a *modular* monolith with enforced component boundaries rather than split into microservices.

---

## 2. Microservices

**Definition:** An application composed of small, independently deployable services, each owning its own data and communicating over the network, organized around business capabilities.

**When the tax is worth it:** microservices trade in-process simplicity for independent deployability and team autonomy. That trade only pays once organizational scale (many teams needing to ship without coordinating) or divergent scaling needs exceed what a modular monolith can absorb — commonly cited as ~50+ engineers with clear domain boundaries.

| When to use | When NOT to use |
|---|---|
| Many autonomous teams that must deploy independently | Small team (you'll pay distributed-systems cost with no autonomy benefit) |
| Components with very different scaling/tech needs | Domain boundaries still unknown/unstable — you'll build a distributed monolith |
| A subsystem needs isolated blast radius / independent SLAs | You need cross-entity transactions frequently (sagas are painful) |
| Existing monolith is a proven bottleneck at a known seam | You lack platform maturity (CI/CD, observability, on-call per service) |

**Key patterns (from the pattern language):** Database-per-service; API Gateway / Backend-for-Frontend; Saga (distributed transactions via choreography or orchestration); Service Discovery; Circuit Breaker; Strangler Fig (incremental extraction); Service Mesh (sidecar proxies handling retries, mTLS, traffic-shifting — decouples deployment from release). The single biggest mistake is a "distributed monolith": services that must be deployed together.

**Canonical references:**
- [microservices.io — Pattern Language](https://microservices.io/patterns/) and the [Microservice Architecture pattern](https://microservices.io/patterns/microservices.html) (Chris Richardson)
- [microservices.io — Service Mesh pattern](https://microservices.io/patterns/deployment/service-mesh.html)
- [Martin Fowler — Microservices Guide](https://martinfowler.com/microservices/)

**Real example:** Netflix, Uber, and Amazon's "two-pizza team" services — hundreds/thousands of independently deployed services behind gateways and a mesh.

---

## 3. Event-Driven / Event Sourcing / CQRS

**Definition:** A style where components communicate by producing, consuming, and reacting to *events* (immutable facts about something that happened) rather than by direct synchronous request/response.

Martin Fowler's key insight: "event-driven" is an umbrella covering four *distinct* patterns that people conflate — pick the one you mean:

| Pattern | What it is |
|---|---|
| **Event Notification** | Emit a thin "X happened" signal; consumers call back for details. Decouples, but logic gets scattered. |
| **Event-Carried State Transfer** | Event carries the full state, so consumers keep local read replicas and need no callback. |
| **Event Sourcing** | The append-only event log *is* the source of truth; current state is a fold/replay of events. Gives audit + time-travel. |
| **CQRS** | Separate write model from read model(s); often the write side is event-sourced and read models are projections. |

**When to use / when NOT:**

| When to use | When NOT to use |
|---|---|
| Async workflows, fan-out to many consumers, spiky load | Simple CRUD app — event sourcing is massive accidental complexity |
| Strong audit / temporal query / "how did we get here" needs | Team unfamiliar with eventual consistency (subtle bugs) |
| Decoupling producers from an unknown/growing set of consumers | You need strong read-your-writes consistency everywhere |
| Integrating many systems via a streaming backbone | Event schema will churn heavily (versioning/replay pain) |

**Key patterns:** append-only log as source of truth; projections / read models; snapshots (avoid replaying from event 0); schema registry + backward-compatible event evolution; outbox pattern for reliable publish; stream processing (Kafka Streams / Flink / ksqlDB). Known hazards: replay when results depend on external side effects, and event-schema migration over time.

**Canonical references:**
- [Martin Fowler — What do you mean by "Event-Driven"?](https://martinfowler.com/articles/201701-event-driven.html)
- [Confluent — Event-Driven Architecture: A Complete Introduction](https://www.confluent.io/learn/event-driven-architecture/) and [Designing Event-Driven Systems (ebook)](https://www.confluent.io/resources/ebook/designing-event-driven-systems/)
- [Azure Architecture Center — Event Sourcing pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing)
- [microservices.io — Pattern Language](https://microservices.io/patterns/) (Saga, CQRS, Event Sourcing patterns)

**Real example:** Apache Kafka-backed pipelines at LinkedIn/Uber; retail order systems where every state change is an event.

---

## 4. Serverless / FaaS

**Definition:** Event-triggered functions (and managed backing services) that run on demand with no server management, scaling to zero when idle and horizontally on load, billed per invocation/duration.

| When to use | When NOT to use |
|---|---|
| Bursty / unpredictable / low-average traffic (scale to zero) | Sustained high-throughput workloads (cost crosses over vs. containers) |
| Glue between managed services, webhooks, cron, event fan-out | Long-running or stateful compute (functions are short-lived) |
| Small teams wanting zero infra ops | Latency-critical paths sensitive to cold starts |
| Event-driven backends, mobile/API backends, stream processors | Heavy local state, big dependency bundles, or vendor-lock aversion |

**Key patterns:** API Gateway → Lambda (request/response backend); event-driven fan-out via EventBridge/SNS; **topic-queue-chaining** (put an SQS queue between the event bus and each subscriber for durability); Step Functions for orchestration; single-purpose functions over "Lambda monoliths." Anti-patterns to avoid: functions calling functions synchronously (latency + cost stacking), and treating Lambda as a long-running server.

**Canonical references:**
- [AWS — Building Applications with Serverless Architectures](https://aws.amazon.com/lambda/serverless-architectures-learn-more/)
- [Serverless Land — Serverless Patterns Collection](https://serverlessland.com/patterns)
- [AWS Whitepaper — Serverless multi-tier sample architecture patterns](https://docs.aws.amazon.com/whitepapers/latest/serverless-multi-tier-architectures-api-gateway-lambda/sample-architecture-patterns.html)
- [AWS — Mistakes to avoid when implementing serverless with Lambda](https://aws.amazon.com/blogs/architecture/mistakes-to-avoid-when-implementing-serverless-architecture-with-lambda/)

**Real example:** Image-processing pipelines (S3 upload → Lambda → thumbnail), webhook handlers, and event-driven APIs on API Gateway + Lambda + DynamoDB.

---

## 5. Multi-Tenant SaaS

**Definition:** A single application serving many customer organizations ("tenants") from shared operational infrastructure, where every request must be attributed to a tenant and isolated from other tenants' data and load. This is EVERJUST's own shape — worth deep understanding.

### The two planes

Multi-tenant SaaS splits into two distinct planes — conflating them is a common design error:

| Plane | Role | Multi-tenant? |
|---|---|---|
| **Control plane** | Tenant registry, onboarding/provisioning, authentication, tiering/plans, billing/metering, operations & analytics | No — global, shared services *about* tenants |
| **Application plane** | The actual product request path running tenant business logic and per-tenant data | Yes — isolation enforced on **every** request |

### Tenant isolation models (silo / pool / bridge)

The central design decision. AWS's SaaS Lens defines three:

| Model | What it is | Isolation / blast radius | Cost & efficiency | Noisy neighbor | Operations |
|---|---|---|---|---|---|
| **Silo** | Each tenant gets dedicated resources (own DB, own stack) | Strongest; failure/breach contained per tenant | Highest cost, weakest economies of scale | Eliminated by construction | Hardest to operate at scale (N stacks) |
| **Pool** | Tenants share resources (shared compute/DB with a tenant key) | Weakest; logical isolation only | Cheapest, best economies of scale, most agile | Real risk — must actively mitigate | Easiest — one stack, one deploy |
| **Bridge** | Mixed — silo the parts that need it, pool the rest | Per-component | Balanced | Managed per-component | Moderate |

Even a silo tenant still shares the control plane (onboarding, identity, ops) — that shared operational construct is what makes it SaaS rather than N separately managed installs. EVERJUST's own model is close to **silo-per-tenant data** (isolated Postgres DB per tenant) with a **shared Odoo binary + shared control plane** — i.e. a bridge leaning silo on data.

**Isolation is not just security — it's also the noisy-neighbor boundary.** In pooled components (shared compute, memory, APIs, and increasingly shared LLMs), one tenant's heavy usage degrades everyone's performance. Mitigate at every shared point: per-tenant rate limits (API-gateway usage plans + per-tenant keys, WAF rate rules, or token-bucket/sliding-window in Redis), per-tenant quotas, and tiering that maps premium tenants to more isolated (silo) resources.

| When to choose silo | When to choose pool | When to choose bridge |
|---|---|---|
| Compliance/regulatory data isolation required | Cost efficiency + scale of many small tenants | Realistic default — most systems are mixed |
| A few large, high-value, or sensitive tenants | Rapid onboarding, agility, one operational surface | Silo the regulated/noisy microservice, pool the rest |
| Per-tenant customization or version pinning | Uniform tenants, shared feature set | Offer isolation as a paid tier |

**When multi-tenant SaaS is the wrong shape:** single-customer/on-prem software; workloads where per-customer data can never share infrastructure at any layer (go full managed-service / dedicated deployments instead).

**Key patterns:** tenant context injected on every request (JWT claim / subdomain / header) and propagated to every data access; row-level security or schema-per-tenant or DB-per-tenant; tiering (basic=pool, premium=silo); per-tenant metering for usage-based billing; separate control-plane provisioning workflow; and enforcing isolation as close to the data as possible (an "isolation mindset," not an afterthought).

**Canonical references:**
- [AWS SaaS Lens — Silo, Pool, and Bridge Models](https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/silo-pool-and-bridge-models.html), [Silo isolation](https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/silo-isolation.html), [Pool isolation](https://docs.aws.amazon.com/whitepapers/latest/saas-tenant-isolation-strategies/pool-isolation.html), [Bridge model](https://docs.aws.amazon.com/whitepapers/latest/saas-tenant-isolation-strategies/the-bridge-model.html)
- [AWS Whitepaper — SaaS Tenant Isolation Strategies (PDF)](https://d1.awsstatic.com/whitepapers/saas-tenant-isolation-strategies.pdf) incl. [Isolation: security or noisy neighbor?](https://docs.aws.amazon.com/whitepapers/latest/saas-tenant-isolation-strategies/isolation-security-or-noisy-neighbor.html)
- [AWS SaaS Architecture Fundamentals — Tenant isolation](https://docs.aws.amazon.com/whitepapers/latest/saas-architecture-fundamentals/tenant-isolation.html)
- [AWS Architecture Blog — Cloud service considerations for multi-tenant SaaS](https://aws.amazon.com/blogs/architecture/aws-cloud-service-considerations-for-designing-multi-tenant-saas-solutions/)

**Real example:** Salesforce (classic pool), Slack (pooled with tenant sharding), and EVERJUST.APP itself (DB-per-tenant silo + shared control plane / app binary).

---

## 6. Multi-Agent / LLM-App Architectures

**Definition:** Systems where one or more LLMs — augmented with tools, retrieval, and memory — drive control flow, either along predefined paths ("workflows") or by dynamically directing their own steps ("agents"). This archetype is fundamentally different from traditional request/response systems and deserves the most care.

### How LLM systems differ from traditional systems

| Dimension | Traditional system | LLM/agent system |
|---|---|---|
| Determinism | Deterministic; same input → same output | **Nondeterministic**; must design for variance |
| Correctness check | Unit/integration tests | **Evals** (graded datasets, LLM-as-judge, human review) |
| Failure mode | Exceptions/crashes | Plausible-but-wrong output, hallucination, prompt injection |
| Safety | Input validation | **Guardrails** (input/output filters, tool allow-lists, confirmation gates) |
| Cost/latency | ~constant per request | Each model call costs tokens + seconds; loops multiply both |
| State | DB rows | Context window + external memory; context is finite and lossy |

### The building block: the augmented LLM

Before choosing a topology, note that every agent pattern is built from one primitive — an **augmented LLM**: a model that can *retrieve* (RAG), *use tools*, and *read/write memory*, selecting and invoking these itself.

### Anthropic's taxonomy — workflows vs. agents (start simple)

The core guidance: **find the simplest thing that works; add agency only when flexibility genuinely pays.** Workflows (LLMs orchestrated through predefined code paths) are predictable and cheap; agents (LLMs dynamically directing their own process and tool use) are flexible but costlier and harder to control.

| Pattern | Type | One-liner | When to use |
|---|---|---|---|
| **Prompt chaining** | Workflow | Decompose into a fixed sequence; each call feeds the next | Task cleanly splits into fixed subtasks; trade latency for accuracy |
| **Routing** | Workflow | Classify input, dispatch to a specialized handler | Distinct input categories benefiting from separate prompts |
| **Parallelization** | Workflow | Run subtasks concurrently (sectioning) or vote (multiple runs) | Independent subtasks for speed, or multiple perspectives for confidence |
| **Orchestrator-workers** | Workflow→agentic | Central LLM decomposes tasks dynamically, delegates to workers, synthesizes | Complex tasks where subtasks can't be predicted up front (e.g. multi-file code changes) |
| **Evaluator-optimizer** | Workflow | One LLM generates, another critiques in a loop | Clear eval criteria exist and iterative refinement measurably helps |
| **Autonomous agent** | Agent | LLM acts in a tool-use loop, guided by environment feedback, with human oversight | Open-ended problems with unpredictable step counts |

### Cross-cutting agentic patterns

- **Tool use / function calling** — the LLM invokes external actions; keep tools well-documented, least-privilege, and idempotent where possible.
- **RAG (retrieval-augmented generation)** — inject retrieved documents into context to ground answers in current/private knowledge, combining parametric memory (weights) with non-parametric memory (a vector/text index). Introduced by Lewis et al., 2020.
- **ReAct (reason + act)** — interleave reasoning traces with actions so the model plans, calls tools, and adapts; the basis of most tool-using agents.
- **Reflection** — the model critiques and revises its own output (a self-directed evaluator-optimizer loop).
- **Planner-executor** — separate a planning step (decompose the goal) from execution (carry out steps), a specialization of orchestrator-workers.
- **Memory** — short-term (context window) vs. long-term (external store, summaries, vector memory) to persist state across turns/sessions.
- **Multi-agent (orchestrator + sub-agents)** — a lead agent spawns sub-agents that work in parallel with isolated context windows, then synthesizes; costs more tokens but wins on breadth-first tasks.

### MCP (Model Context Protocol)

An open standard (Anthropic, Nov 2024) for connecting agents to tools and data via a client/server model, solving the "N×M" integration problem (every model × every tool needing a custom connector). Servers expose **prompts, resources, and tools**; clients (the agent host) call them over JSON-RPC. It has become the de-facto interface layer for agent tooling — EVERJUST's own `everjust_agent_mcp` addon exposes each tenant's Odoo at `/mcp`.

### Frameworks

| Framework | Model / strength | Link |
|---|---|---|
| **LangGraph** | Low-level graph of nodes/edges; durable execution, state, human-in-the-loop; largest production footprint | [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) |
| **CrewAI** | High-level "team of role-playing agents" (Crews) + event-driven Flows; fastest to prototype | [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI) |
| **AutoGen** | Conversational multi-agent / group-chat & debate; strong in research (now → Microsoft Agent Framework) | [microsoft/autogen](https://github.com/microsoft/autogen) |
| **OpenAI Agents SDK** (successor to Swarm) | Lightweight, few abstractions: agents + handoffs + guardrails + tracing; provider-agnostic | [openai/openai-agents-python](https://github.com/openai/openai-agents-python) · [docs](https://openai.github.io/openai-agents-python/) |

**When to use agents / when NOT:**

| Use an agent when | Do NOT use an agent (use a workflow or plain code) when |
|---|---|
| Task is open-ended and step count is unpredictable | The task is fixed and well-defined (chain or single call is enough) |
| Model-driven decisions add real value at scale | You need strict determinism, low latency, or tight cost bounds |
| Tools + environment feedback let it self-correct | A hard-coded pipeline is cheaper, faster, and equally good |

**Canonical references:**
- [Anthropic — Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) (the workflow/agent taxonomy above)
- [Anthropic — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Anthropic — Introducing the Model Context Protocol](https://www.anthropic.com/news/model-context-protocol) · [MCP Specification](https://modelcontextprotocol.io/) · [Code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp)
- [ReAct: Synergizing Reasoning and Acting in Language Models (arXiv:2210.03629)](https://arxiv.org/abs/2210.03629) · [ysymyth/ReAct](https://github.com/ysymyth/ReAct)
- [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks (arXiv:2005.11401)](https://arxiv.org/abs/2005.11401)
- [Confluent — Four design patterns for event-driven, multi-agent systems](https://www.confluent.io/blog/event-driven-multi-agent-systems/)
- [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) (runnable RAG/agent/multi-agent pattern library)

**Real example:** Anthropic's multi-agent Research feature (a lead agent spawning parallel sub-agents); coding agents (Claude Code) using orchestrator-workers over a file tree.

---

## 7. Data-Intensive / Streaming / Batch

**Definition:** Architectures whose primary challenge is the volume, velocity, and variety of data — ingesting, storing, and processing large datasets in batch, in real time, or both.

The classic tension is between **batch** (high-throughput, high-latency, reprocess-from-scratch) and **streaming** (low-latency, incremental). Three reference architectures resolve it differently:

| Architecture | Shape | Trade-off |
|---|---|---|
| **Lambda** | Dual path: a **batch layer** (accurate, complete, e.g. Hadoop/Spark) + a **speed layer** (low-latency, e.g. Flink), merged at query time | Correct + fast, but you maintain **two codebases** — double the dev/test, complex to keep in sync |
| **Kappa** | **Single streaming path**; reprocess history by replaying the log in batch mode | One codebase, lower latency; the modern default, but replay/history handling must be designed in |
| **Lakehouse** | Storage architecture: data-lake economics (cheap object storage) + warehouse guarantees (ACID, schema, transactions) via an open table format (Delta/Iceberg/Hudi) | Unifies BI + ML on one copy of data; increasingly the storage substrate under Kappa |

**When to use / when NOT:**

| When to use | When NOT to use |
|---|---|
| TB–PB scale, analytics/ML on large historical + live data | Small data that fits in one Postgres (don't build a lakehouse for 10 GB) |
| Need both real-time dashboards and accurate historical reprocessing | Simple app with transactional CRUD needs |
| Many downstream consumers of the same data (feature stores, BI, ML) | Latency/consistency needs are better served by an OLTP DB |

**Key patterns:** append-only ingestion log (Kafka) as the backbone; stream processing (Flink, Kafka Streams, Spark Structured Streaming); open table formats for ACID over object storage; medallion (bronze/silver/gold) refinement layers; replayability for reprocessing.

**Canonical references:**
- [Lakehouse: A New Generation of Open Platforms that Unify Data Warehousing and Advanced Analytics (CIDR 2021, PDF)](https://www.cidrdb.org/cidr2021/papers/cidr2021_paper17.pdf) · [Databricks — What is a Data Lakehouse?](https://www.databricks.com/blog/what-is-a-data-lakehouse)
- [Hazelcast — Kappa Architecture Overview (Kappa vs Lambda)](https://hazelcast.com/foundations/software-architecture/kappa-architecture/) · [Dremio — What is Kappa Architecture?](https://www.dremio.com/wiki/kappa-architecture/)
- [Confluent — Event-Driven Architecture: A Complete Introduction](https://www.confluent.io/learn/event-driven-architecture/) (stream processing foundations)

**Real example:** Uber and LinkedIn data platforms (Kafka + Flink + lakehouse); Databricks Delta Lake deployments.

---

## 8. Real-Time / Collaborative Systems

**Definition:** Systems where many clients maintain a persistent connection and see each other's state changes with sub-second latency — chat, presence, live dashboards, multiplayer/collaborative editing.

| When to use | When NOT to use |
|---|---|
| Live presence, chat, notifications, dashboards, gaming | Request/response CRUD where polling or plain HTTP suffices |
| Multiple users editing shared state concurrently | Occasional updates where users tolerate a refresh |
| Push-driven UX (server must initiate) | You can't operate long-lived connection infrastructure at scale |

**Key patterns:**
- **Transport:** WebSockets (persistent bidirectional), Server-Sent Events (one-way push), or WebTransport; pub/sub fan-out to route a change to all interested clients.
- **Presence & fan-out:** per-entity in-memory processes (actor model) that fan a single event out to many subscribers — the Erlang/Elixir BEAM approach.
- **Conflict resolution for collaborative editing** — three choices:
  - **OT (Operational Transformation):** transform concurrent ops against each other (Google Docs). Powerful but complex to implement correctly.
  - **CRDTs (Conflict-free Replicated Data Types):** data types that merge deterministically without a central coordinator (good for local-first/offline).
  - **Server-authoritative last-writer-wins per property:** Figma's pragmatic choice — most concurrent edits touch different objects/properties, so property-level LWW is both correct enough and far simpler than OT or full CRDTs.

**Canonical references:**
- [Figma — How Figma's multiplayer technology works](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/)
- [Discord — How Discord Scaled Elixir to 5,000,000 Concurrent Users](https://discord.com/blog/how-discord-scaled-elixir-to-5-000-000-concurrent-users) · [Elixir-lang — Real-time communication at scale at Discord](https://elixir-lang.org/blog/2020/10/08/real-time-communication-at-scale-with-elixir-at-discord/)
- CRDT libraries: [Yjs](https://github.com/yjs/yjs) · [Automerge](https://automerge.org/) · [crdt.tech implementations](https://crdt.tech/implementations)

**Real examples:** Figma (property-level LWW over WebSockets, engine in WASM); Discord (per-guild/per-session Elixir processes fanning out to millions).

---

## 9. Edge / Distributed Compute

**Definition:** Running application code and state at points of presence physically close to users (the network edge), rather than in one central region.

| When to use | When NOT to use |
|---|---|
| Global user base needing low latency everywhere | Single-region users / latency-insensitive workloads |
| Lightweight request handling, personalization, auth, A/B at the edge | Heavy compute, large dependencies, or long-running jobs |
| Real-time coordination near users (edge chat, presence) | Strong global consistency across all data required centrally |
| Cost-sensitive, scale-to-zero, sub-ms cold-start needs | Deep integration with region-locked databases/services |

**Key patterns:** V8 **isolates** instead of containers (sub-5ms — often sub-1ms — cold starts, <1 MB each) so per-request startup is effectively free; **stateful edge via single-instance addressable objects** — Cloudflare's Durable Objects give a globally unique, single-threaded instance per ID with transactional storage, so coordination (chat rooms, collaborative docs, WebSocket hubs) can run entirely at the edge with strong consistency and no central origin; edge caching + compute co-location.

**Canonical references:**
- [Cloudflare — Workers Durable Objects: A New Approach to Stateful Serverless](https://blog.cloudflare.com/introducing-workers-durable-objects/)

**Real example:** Cloudflare Workers + Durable Objects powering global APIs and edge-hosted real-time collaboration; edge personalization/auth at CDN PoPs.

---

## 10. Peer-to-Peer / Decentralized

**Definition:** An architecture with no central server — every node acts as both client and server, discovering peers and exchanging data directly, so there is no single point of failure or control.

| When to use | When NOT to use |
|---|---|
| Censorship resistance, no central authority, resilience by design | You need central control, moderation, or simple consistency |
| Content distribution / file sharing at scale without central hosting | Low-latency guarantees and predictable performance required |
| Local-first / offline-tolerant collaboration (pairs with CRDTs) | Regulatory/audit needs a single accountable operator |

**Key patterns:** Distributed Hash Tables (DHT) for peer/content discovery; content addressing (address data by hash, not location) with Merkle DAGs; modular transport-agnostic networking stacks (TCP/QUIC/WebSockets) with built-in encryption, peer discovery, and stream multiplexing; gossip protocols.

**Canonical references:**
- [IPFS Docs — libp2p (modular P2P networking stack)](https://docs.ipfs.tech/concepts/libp2p/)

**Real example:** IPFS/libp2p content-addressed storage; BitTorrent; blockchain peer networks; local-first apps syncing via CRDTs over libp2p.

---

## How to choose

Map your product's dominant characteristic to a starting archetype. These compose — most real systems are a modular monolith *and* an event backbone *and* (for SaaS) a control plane.

| If your product is primarily… | Start with | Notes / combine with |
|---|---|---|
| A new product with unproven boundaries | **Modular monolith** (§1) | Default. Extract services only at proven, painful seams. |
| Built by many teams needing independent deploys | **Microservices** (§2) | Only past ~50 eng / clear domains; else you get a distributed monolith. |
| Driven by async workflows, fan-out, audit trails | **Event-driven** (§3) | Layer onto a monolith; use event sourcing only where audit/time-travel justifies it. |
| Bursty, low-average, glue/event workloads | **Serverless** (§4) | Great for edges; watch cold starts + cost crossover at sustained load. |
| One app serving many customer orgs | **Multi-tenant SaaS** (§5) | Choose silo/pool/bridge per component; split control plane from app plane; design isolation + noisy-neighbor limits up front. |
| Powered by LLMs making decisions | **Multi-agent/LLM** (§6) | Start with the simplest workflow; add agency only when it pays. Budget for evals, guardrails, token cost/latency. Expose tools via MCP. |
| Dominated by large-scale data processing | **Data-intensive** (§7) | Prefer Kappa (one pipeline) over Lambda; lakehouse as storage substrate. |
| About many users seeing shared state live | **Real-time/collaborative** (§8) | WebSockets + pub/sub; pick OT vs CRDT vs property-LWW to match your domain. |
| Global and latency-critical everywhere | **Edge** (§9) | Isolates for compute; Durable-Objects-style single-instance state for coordination. |
| Anti-central: censorship-resistant / local-first | **P2P/decentralized** (§10) | Rare for typical SaaS; pairs with CRDTs for offline-tolerant sync. |

**Meta-rules:**
1. **Default to the modular monolith.** Every other archetype should be justified by a specific pressure (team scale, latency, isolation, data volume, decision-complexity) that the monolith demonstrably can't absorb.
2. **Archetypes compose; don't pick just one.** EVERJUST is a modular monolith (Odoo) + multi-tenant SaaS (DB-per-tenant silo) + control plane + optional agent/MCP layer.
3. **Match the conflict/consistency model to the domain** (Figma chose property-LWW over CRDTs because the domain allowed it) rather than reaching for the most sophisticated pattern.
4. **For LLM systems, complexity is a cost, not a badge** — the winning move is usually the simplest workflow that hits the eval bar, not the most autonomous agent.

---

**Related in this skill:** [`07-product-layers`](07-product-layers.md) — the layers each archetype needs · [`03-scaling-ladder`](03-scaling-ladder.md) — how each archetype scales once chosen · [`09-case-studies`](09-case-studies.md) — real systems per archetype · [`11-decision-records`](11-decision-records.md) — record the archetype choice as an ADR.
