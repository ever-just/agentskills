---
name: system-design-architecture
description: Curated, verified corpus for designing production-grade software systems — networking through the full backend stack. Use when designing or reviewing system architecture, scaling a service toward millions of users, choosing API/network standards (OpenAPI, AsyncAPI, gRPC, OAuth, OpenTelemetry), hardening for reliability/SRE, reasoning about concurrency & async, or making cloud cost decisions. Maps each problem class to its authoritative source (repo, official doc, or spec) plus a consumption order and an apply-it playbook. Sourced 2026-07 via the github-search skill; re-verify links if a source seems stale.
---

# Software System Design & Architecture

## Overview

This skill is a knowledge map, not a tutorial: for every major system-design
problem class it names the *authoritative* source — the canonical learning repo,
the first-party cloud doctrine, or the normative spec — so an agent grounds its
design decisions in battle-tested material instead of vibes. Every entry was
verified live (maintained, widely cited) via the `github-search` playbook.

Use it when you are:
- designing a new backend/system or writing a design doc
- scaling an existing service (traffic, data, team)
- choosing wire formats, API styles, auth, or observability standards
- doing a production-readiness, reliability, or cost review

Full research provenance: `docs/SYSTEM_DESIGN_ARCHITECTURE_RESEARCH.md` and
`docs/ML_SYSTEM_DESIGN_AGENT_RESEARCH.md` in `ever-just/ww.everjust.app`
(ML-specific variant: templates + corpora for ML design docs).

---

## The corpus, by problem class

### 1. Core system design (start here)

| Source | Role |
|---|---|
| [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) | The canonical curriculum (~300k★): CAP, caching, load balancing, DB scaling, async, worked large-scale designs. **The spine.** |
| [karanpratapsingh/system-design](https://github.com/karanpratapsingh/system-design) | Best single networking→full-stack narrative: IP/DNS/proxies → databases, messaging, microservices → complete WhatsApp/Uber-scale designs. |
| [ByteByteGoHq/system-design-101](https://github.com/ByteByteGoHq/system-design-101) | Visual quick-reference: protocols, API design, CI/CD, patterns. |
| [binhnguyennus/awesome-scalability](https://github.com/binhnguyennus/awesome-scalability) | **Millions-of-users precedent corpus** — patterns of scalable/reliable/performant systems, each claim sourced to engineering-blog case studies from systems serving millions–billions. |
| [InterviewReady/system-design-resources](https://github.com/InterviewReady/system-design-resources) | Case studies: cluster management, messaging antipatterns, service mesh, rate limiting. |

### 2. Distributed systems & data foundations

| Source | Role |
|---|---|
| [MIT 6.824/6.5840](https://pdos.csail.mit.edu/6.824/) | The graduate course — MapReduce, GFS, Raft, sharding, Spanner, with Go labs. |
| *Designing Data-Intensive Applications* + [ept/ddia-references](https://github.com/ept/ddia-references) | The single best text on replication, partitioning, transactions, consistency, consensus. |
| [aphyr/distsys-class](https://github.com/aphyr/distsys-class) · [Jepsen analyses](https://jepsen.io/analyses) | Class notes + how real databases actually violate their consistency claims. |
| [theanalyst/awesome-distributed-systems](https://github.com/theanalyst/awesome-distributed-systems) · [papers-we-love](https://github.com/papers-we-love/papers-we-love) | Curated papers/lectures (Kleppmann's Cambridge lectures; Lamport, Dynamo, Raft). |

### 3. Networking (the layer under everything)

| Source | Role |
|---|---|
| [Beej's Guides](https://beej.us/guide/) | Sockets/TCP/UDP from first principles. |
| [High Performance Browser Networking](https://hpbn.co/) | Latency/bandwidth physics, TCP/TLS tuning, HTTP/2, WebRTC — free O'Reilly. |
| [http2-explained](https://daniel.haxx.se/http2/) · [http3-explained](https://github.com/bagder/http3-explained) | HTTP/2 (RFC 9113) and HTTP/3+QUIC (RFC 9114/9000), by curl's author. |
| [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (HTTP semantics) · [RFC 9111](https://www.rfc-editor.org/rfc/rfc9111) (caching) · [RFC 9000](https://www.rfc-editor.org/rfc/rfc9000) (QUIC) | The normative texts — cite these when behavior is disputed. |

### 4. Open standards — conform, don't invent

| Need | Standard (canonical source) |
|---|---|
| REST API contract | [OpenAPI 3.1](https://github.com/OAI/OpenAPI-Specification) |
| Event/message APIs (Kafka, MQTT, AMQP, WS) | [AsyncAPI 3.0](https://github.com/asyncapi/spec) |
| Shared type grammar (under both, and tool-calling) | [JSON Schema 2020-12](https://github.com/json-schema-org/json-schema-spec) |
| Service-to-service RPC | [gRPC](https://github.com/grpc/grpc) + [Protobuf](https://github.com/protocolbuffers/protobuf) |
| Client-shaped query graphs | [GraphQL spec](https://github.com/graphql/graphql-spec) |
| Common event envelope | [CloudEvents](https://github.com/cloudevents/spec) (CNCF) |
| AuthN/AuthZ — never hand-roll | [OAuth 2.0](https://www.rfc-editor.org/rfc/rfc6749)/[2.1](https://oauth.net/2.1/) + [OIDC](https://openid.net/developers/specs/) |
| Traces/metrics/logs | [OpenTelemetry spec](https://github.com/open-telemetry/opentelemetry-specification) + [W3C Trace Context](https://www.w3.org/TR/trace-context/) |
| Baseline app production hygiene | [The Twelve-Factor App](https://12factor.net/) |

Selection rule: REST → OpenAPI 3.1; events → AsyncAPI 3.0; internal RPC →
gRPC/Protobuf; frontend graphs → GraphQL; JSON Schema is the grammar under all.

### 5. Cloud doctrine (AWS-first, pattern catalogs agnostic)

| Source | Role |
|---|---|
| [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/the-pillars-of-the-framework.html) | Six pillars — operational excellence, security, reliability, performance efficiency, cost optimization, sustainability. **The production-grade rubric**; review designs pillar by pillar. |
| [Amazon Builders' Library](https://aws.amazon.com/builders-library/) | Amazon's production lessons: [timeouts/retries/backoff+jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/), shuffle sharding, load shedding, cache stampedes, ops readiness. The best "how it breaks at scale" corpus. |
| [AWS Architecture Center](https://aws.amazon.com/architecture/) · [awsdocs](https://github.com/awsdocs) · [aws-samples](https://github.com/aws-samples) | Reference architectures, official doc sources, runnable examples. |
| [open-guides/og-aws](https://github.com/open-guides/og-aws) | Community field guide — the practical traps the official docs omit. |
| [Azure Cloud Design Patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/) + [mspnp/cloud-design-patterns](https://github.com/mspnp/cloud-design-patterns) | Technology-agnostic pattern catalog (retry, circuit breaker, bulkhead, CQRS, saga, throttling) with sample code — useful on any cloud. |
| [microservices.io](https://microservices.io/patterns/) | Chris Richardson's 44-pattern language: decomposition, sagas, API composition, CQRS, messaging. |

### 6. Reliability & production readiness (SRE)

| Source | Role |
|---|---|
| [Google SRE books](https://sre.google/books/) (3, free) | SLOs/error budgets, postmortems, launch checklist, production best-practice appendices. |
| [dastergon/awesome-sre](https://github.com/dastergon/awesome-sre) | Curated index: on-call, capacity, chaos, incident management. |
| [bregman-arie/sre-checklist](https://github.com/bregman-arie/sre-checklist) | Concrete production-readiness checklist to run designs against. |

### 7. Concurrency & async

MIT 6.824 labs (build Raft — real races), DDIA ch. 5–9 (replication →
consensus), [The Little Book of Semaphores](https://greenteapress.com/wp/semaphores/)
(primitive drills), awesome-scalability's Performance/Stability sections
(backpressure, load shedding, queues-over-RPC in production), and the Builders'
Library retries/jitter article — the most-reused async-correctness doc in industry.

### 8. Cost efficiency (FinOps)

| Source | Role |
|---|---|
| [FinOps Foundation Framework](https://www.finops.org/framework/) + [FOCUS](https://focus.finops.org/) | The open cost-management discipline + open billing-data spec. |
| [AWS Cost Optimization pillar](https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html) | Right-sizing, pricing models (Savings Plans/Spot), elasticity-before-purchase. |
| [OptimNow/cloud-finops-skills](https://github.com/OptimNow/cloud-finops-skills) | FOCUS-aligned FinOps knowledge already packaged **as agent skills** (28 refs; AWS/Azure/GCP/OCI, K8s, AI inference economics) — importable directly. |
| [jmfontaine/awesome-finops](https://github.com/jmfontaine/awesome-finops) | Curated index. |

---

## How to apply this corpus when designing

1. **Frame with the spine.** Structure the design doc along system-design-primer's
   axes: requirements → estimates (traffic/storage/bandwidth) → high-level design
   → component deep-dives → bottlenecks.
2. **Name your patterns.** Every non-obvious choice should cite a named pattern
   (microservices.io / Azure catalog / mercari for ML) — "circuit breaker per
   the Azure pattern catalog," not "we handle failures."
3. **Conform to standards by default** (table §4). Deviating from OpenAPI/OAuth/
   OTel is a decision to justify in the doc, not a default.
4. **Mine precedent before inventing.** For any high-scale component, find how a
   millions-of-users system solved it in awesome-scalability or the Builders'
   Library, and cite it.
5. **Review against rubrics.** Walk the six Well-Architected pillars and the
   sre-checklist; record one line per pillar (even "N/A because…").
6. **Treat cost as a requirement.** State the cost model (unit economics per
   request/tenant) in the design; check against the AWS cost pillar.
7. **Cite normative sources in disputes.** Protocol behavior → the RFC;
   consistency claims → Jepsen; retry semantics → Builders' Library.

## Consumption order (for building durable expertise)

1. system-design-primer end-to-end → karanpratapsingh for the networking→stack narrative
2. DDIA + MIT 6.824 for distribution/concurrency depth
3. Well-Architected (all pillars) + Builders' Library article-by-article
4. Standards specs as needed per project (§4)
5. awesome-scalability as an ongoing precedent library
6. FinOps framework once, then per-design cost checks

## Related skills

- `github-search` — the discovery playbook used to build and refresh this corpus
- `everjust-platform` — platform-specific invariants when designing *for* everjust.app
