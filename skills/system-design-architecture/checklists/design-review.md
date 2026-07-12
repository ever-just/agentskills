# Design Review Checklist

Walk a proposed system design through this before committing to it. Record one
line per item — even "N/A because…". Grounded in the AWS Well-Architected six
pillars plus archetype/scale fit.

## 0. Problem framing
- [ ] Functional requirements stated (what it must do).
- [ ] Non-functional requirements quantified: target users, RPS (avg + peak), data volume/day, read:write ratio, latency SLO (p50/p99), availability target.
- [ ] Constraints named: team size, deadline, budget, compliance, existing stack.
- [ ] Success metrics defined (business + technical).

## 1. Archetype & scale fit  (`references/06-architecture-archetypes.md`, `03-scaling-ladder.md`)
- [ ] The chosen archetype fits the product (not cargo-culted microservices/serverless).
- [ ] Current position on the scaling ladder identified; the *next* rung and its trigger named.
- [ ] Not over-engineered for scale you don't have yet (monolith-first considered).
- [ ] Stateless where possible; state localized and identified.

## 2. Operational excellence
- [ ] Deploys are automated, incremental, reversible (rollback path).
- [ ] Observability designed in: metrics/logs/traces, the Four Golden Signals, dashboards, alerts (`references/07-product-layers.md`).
- [ ] Runbooks / on-call ownership defined.

## 3. Security  (`references/02-security.md`, `checklists/security-review.md`)
- [ ] Threat model done (STRIDE or equivalent).
- [ ] AuthN/AuthZ model explicit; least privilege; no hand-rolled crypto/auth.
- [ ] Data classified; encryption at rest + in transit; secrets managed (not in git).
- [ ] Supply-chain and dependency risk considered.

## 4. Reliability  (`checklists/production-readiness.md`)
- [ ] Single points of failure identified and mitigated (redundancy, multi-AZ).
- [ ] Failure modes handled: timeouts, retries with backoff+jitter, circuit breakers, bulkheads, idempotency.
- [ ] Graceful degradation / load shedding under overload.
- [ ] Backup + tested restore; RPO/RTO stated. DR strategy matches criticality.

## 5. Performance efficiency  (`references/04-capacity-limits.md`)
- [ ] Back-of-envelope capacity estimate done; bottleneck identified.
- [ ] Caching strategy + invalidation defined.
- [ ] Data access patterns match the datastore choice (indexes, hot keys, N+1).
- [ ] Tail latency (p99/p99.9) considered, not just averages.

## 6. Cost optimization  (`references/05-cost-modeling.md`)
- [ ] Unit economics estimated: cost-per-request and cost-per-tenant/user.
- [ ] Big cost drivers checked (compute, storage class, **egress/transfer**, managed services).
- [ ] Elasticity/rightsizing plan; commitment/discount model considered.

## 7. Data & contracts  (`references/10-open-standards.md`)
- [ ] API contracts follow open standards (OpenAPI/AsyncAPI/gRPC/GraphQL).
- [ ] Schema evolution / versioning / backward compatibility planned.
- [ ] Data consistency model explicit (strong vs eventual, and where).

## 8. Precedent  (`references/09-case-studies.md`)
- [ ] For each high-scale component, a real-system precedent was consulted and cited.
- [ ] Named patterns cited for non-obvious choices (not "we handle failures").

## Output
Summarize: chosen archetype, ladder position + next move, top 3 risks, and the
one-line-per-pillar verdict.
