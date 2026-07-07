---
name: system-design-architecture
description: Exhaustive, reference-backed toolkit for designing production-grade software systems end to end — networking through the full backend stack. Use when architecting or reviewing a backend/SaaS, scaling a service from low volume toward millions of users, hardening for security, determining capacity limits/thresholds, projecting cloud cost, choosing an architecture archetype (monolith, microservices, event-driven, serverless, multi-tenant SaaS, multi-agent/LLM), enumerating the product layers a system needs, picking API/network open standards (OpenAPI, gRPC, OAuth, OpenTelemetry), or selecting cloud provider services (AWS/GCP/Azure/Cloudflare). Bundles decision frameworks, review checklists, a worked example, and a deep link-rich reference library. Load the reference file that matches the sub-problem; do not answer high-stakes design questions from memory when a bundled reference covers it.
---

# Software System Design & Architecture

## What this is

A decision layer plus a deep reference library for designing real systems. The
body below is the **framework**; the heavy, link-rich material lives in
`references/*.md` and loads only when you open it (progressive disclosure — cheap
until needed). Start every non-trivial design from the frameworks here, then pull
the matching reference file.

**Navigation:** `references/INDEX.md` is the master map. Ten reference files,
three checklists, one worked example. When a bundled reference covers a
high-stakes question (security, capacity math, cost, archetype choice), consult
it rather than answering from memory — the links are the authority.

## When to use

Designing or reviewing a backend/SaaS · scaling low→high volume · security
hardening · capacity/threshold analysis · cost projection · choosing an
architecture style · listing what components a product needs · picking API/
network standards · choosing cloud services. If the task is "design/scale/secure/
cost/choose-architecture for a software system," this skill applies.

## The design method (use in order)

1. **Frame & quantify.** Requirements + numbers: users, RPS (avg *and* peak),
   data/day, read:write ratio, latency SLO (p50/p99), availability target,
   constraints (team, budget, compliance). No numbers → no design.
   → `checklists/design-review.md` §0.
2. **Pick the archetype.** Match product shape to a style; don't cargo-cult.
   → `references/06-architecture-archetypes.md`.
3. **Place it on the scaling ladder.** Where are you now; what's the *next* rung
   and its trigger. Don't build for scale you don't have.
   → `references/03-scaling-ladder.md`.
4. **Lay out the layers.** Enumerate every part the system needs and its choices.
   → `references/07-product-layers.md`.
5. **Size it.** Back-of-envelope capacity, bottleneck, limits/thresholds.
   → `references/04-capacity-limits.md`.
6. **Secure it.** Threat model + the security gate. Not a bolt-on.
   → `references/02-security.md`, `checklists/security-review.md`.
7. **Cost it.** Unit economics (cost per request/tenant), drivers, elasticity.
   → `references/05-cost-modeling.md`.
8. **Conform to standards & choose services.** API/network standards; managed
   services per capability.
   → `references/10-open-standards.md`, `references/08-cloud-providers.md`.
9. **Review & precedent.** Walk the pillars; cite a real system for each
   high-scale component.
   → `checklists/design-review.md`, `references/09-case-studies.md`.

`examples/worked-design-doc.md` shows all nine steps applied to one system.

## Core heuristics (the compressed wisdom)

- **Quantify or don't design.** Peak, not average, sizes the system; tail
  latency (p99/p99.9), not the mean, defines the experience.
- **Monolith-first.** A modular monolith is the right default; earn microservices
  with a real scaling or team-autonomy trigger. Premature distribution is the
  most common self-inflicted wound.
- **Stateless services, state at the edges.** Push state into datastores/caches
  so the app tier scales horizontally.
- **Climb the ladder on symptoms, not vibes.** Each rung (cache → replica → shard
  → queue → decompose → multi-region) is a response to a measured bottleneck and
  buys capacity at the price of complexity/consistency.
- **Async to smooth load.** A durable log/queue between producer and consumer
  absorbs spikes, decouples failure, and enables replay.
- **Design for failure.** Timeouts on every call; retries with backoff **+
  jitter**; circuit breakers; bulkheads; idempotency; graceful degradation and
  load shedding over hard failure.
- **Security and cost are requirements, not phases.** Threat-model early; state
  unit economics in the design.
- **Conform to open standards** (OpenAPI/AsyncAPI/OAuth/OTel) by default;
  deviation is a documented decision.
- **Reason from precedent.** Someone at scale has solved your component — find
  and cite how (`references/09`, awesome-scalability, Builders' Library).

## Reference library (load on demand)

| # | File | Covers |
|---|---|---|
| — | [references/INDEX.md](references/INDEX.md) | Master map of everything below |
| 01 | [core-sources](references/01-core-sources.md) | Curricula, distributed systems, networking, cloud doctrine |
| 02 | [security](references/02-security.md) | Threat modeling, OWASP/ASVS, authn/z, zero-trust, secrets, supply chain, compliance |
| 03 | [scaling-ladder](references/03-scaling-ladder.md) | Low→high volume evolution, rung by rung |
| 04 | [capacity-limits](references/04-capacity-limits.md) | Estimation, Little's Law, USE/RED, load testing, thresholds |
| 05 | [cost-modeling](references/05-cost-modeling.md) | Unit economics, cloud pricing, commitments, egress, FinOps |
| 06 | [architecture-archetypes](references/06-architecture-archetypes.md) | Monolith → microservices → event-driven → serverless → multi-tenant SaaS → multi-agent/LLM → data-intensive → real-time → edge |
| 07 | [product-layers](references/07-product-layers.md) | Client → edge → gateway → services → async → data → cache → search → observability → infra |
| 08 | [cloud-providers](references/08-cloud-providers.md) | AWS/GCP/Azure/Cloudflare capability→service maps + docs |
| 09 | [case-studies](references/09-case-studies.md) | Real sourced systems: Netflix, Uber, Discord, Stripe, Figma, Shopify… |
| 10 | [open-standards](references/10-open-standards.md) | OpenAPI, AsyncAPI, JSON Schema, gRPC, GraphQL, CloudEvents, OAuth/OIDC, OTel, 12-factor |

**Checklists:** [design-review](checklists/design-review.md) ·
[production-readiness](checklists/production-readiness.md) ·
[security-review](checklists/security-review.md).

## Related skills

- `github-search` — the discovery playbook used to build and refresh this corpus.
- `everjust-platform` — platform-specific invariants when designing *for* everjust.app.
