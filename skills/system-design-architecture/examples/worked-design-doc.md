# Worked Example — Multi-Tenant Notification / Activity-Feed Service

A complete design doc produced by applying this skill, to show the shape. It
follows `checklists/design-review.md` and cites the reference files. The numbers
are illustrative but the *method* is the point.

---

## 0. Problem framing

Build a service that lets each tenant of our SaaS emit events ("Alice commented",
"invoice paid") and deliver them to that tenant's users as an in-app feed + email
digest + optional webhook.

**Non-functional targets (quantified):**
- Tenants: 5k today → 50k in 18 months. Users: ~2M total, ~200k DAU.
- Write: ~50 events/s average, ~500/s peak (product launches).
- Fanout: avg 20 recipients/event → ~1k feed-writes/s avg, ~10k/s peak.
- Read: feed opened ~5M times/day → ~60 reads/s avg, ~600/s peak.
- Latency SLO: event→feed visible p99 < 3s; feed read p99 < 200ms.
- Availability: 99.9%. Durability: no lost events.
- Constraints: 4-engineer team, on AWS, cost-conscious.

## 1. Archetype & scale fit  (`references/06`, `03`)

- **Archetype: multi-tenant SaaS + event-driven async.** Fanout and digests are
  classic async work — decouple ingestion from delivery with a queue.
- **Tenancy model: pooled** (shared tables, `tenant_id` partition key) — 50k
  tenants makes silo-per-tenant DBs uneconomic. Add a **row-level isolation**
  guard (every query scoped by `tenant_id`; enforced in a data-access layer).
- **Ladder position:** we're at the "add async workers" rung. We do *not* need
  microservices yet — start as a **modular monolith** with one async worker pool.
  Next rung trigger: when digest generation or fanout can't keep up with a single
  worker fleet, split the delivery worker into its own service.

## 2. High-level design

```
producers → [Ingest API] → [Kafka topic: events]
                                   │
                    ┌──────────────┼───────────────┐
              [Fanout worker]  [Email digest]   [Webhook worker]
                    │               │                  │
             feed store (Dynamo)  SES              tenant endpoints
                    │
              [Feed read API] ← Redis cache ← users
```

- **Ingest API**: validates, stamps `tenant_id`, appends to Kafka (durable log =
  no lost events; smooths the 10× peak — `references/03` async rung).
- **Fanout worker**: expands event → recipients, writes per-user feed items to
  DynamoDB (`PK=tenant#user`, `SK=timestamp`) — write-optimized, scales
  horizontally by hash. Fanout-on-write for normal users; **fanout-on-read for
  "celebrity" tenants/users** with huge audiences (the Twitter timeline lesson,
  `references/09`).
- **Feed read API**: reads latest N from DynamoDB, Redis cache-aside (`references/07`).
- **Digest + webhook workers**: consume the same log independently.

## 3. Capacity check  (`references/04`)

- Feed writes peak ~10k/s. DynamoDB handles this with on-demand or provisioned +
  autoscaling; partition by `tenant#user` avoids hot partitions (watch celebrity
  keys → fanout-on-read).
- Storage: 2M users × ~500 feed items × ~300 B ≈ **300 GB** active; cap feed
  length + TTL old items.
- Redis: cache ~200k DAU × 50 items × 300 B ≈ **3 GB** working set → one modest
  node with a replica.
- Kafka: 500 events/s peak × ~1 KB = 0.5 MB/s — trivial; retention 7 days for replay.
- Little's Law sanity: to hold p99<3s fanout at 10k writes/s, if each write ≈5ms,
  need ≈ `10000 × 0.005 = 50` concurrent writers → size the worker pool + DynamoDB
  accordingly.

## 4. Reliability  (`checklists/production-readiness.md`)

- Kafka = durable buffer; workers commit offsets only after successful write →
  at-least-once. Feed writes are **idempotent** (`PK+SK+event_id`) so replays are safe.
- Webhook delivery: retries with **exponential backoff + jitter**, max attempts,
  then dead-letter queue; per-tenant circuit breaker so one broken endpoint can't
  stall the pool (bulkhead — `references/01` Builders' Library).
- Multi-AZ for Kafka, DynamoDB (regional), Redis (replica). Load shedding on
  Ingest API if Kafka is unavailable (return 503, let producers retry).

## 5. Security  (`references/02`, `checklists/security-review.md`)

- **Tenant isolation is the #1 threat** (BOLA/IDOR): every read/write scoped by
  `tenant_id` from the authenticated token, enforced centrally — never from a
  client-supplied field. Add tests that assert cross-tenant reads fail.
- Webhooks signed (HMAC) so tenants can verify; SSRF guard on webhook URLs
  (block internal/link-local ranges). Secrets (SES, signing keys) in a secrets
  manager. TLS everywhere; feed data encrypted at rest (KMS).

## 6. Cost  (`references/05`)

- Rough monthly unit economics at 50k tenants: DynamoDB writes + storage +
  Redis + Kafka (MSK) + SES + compute. Estimate **cost-per-event** and
  **cost-per-tenant/month**; the dominant drivers here are DynamoDB write units
  and SES volume. Watch **cross-AZ data transfer** between workers and stores.
- Elasticity: workers scale to zero off-peak; DynamoDB on-demand until a steady
  baseline justifies provisioned + autoscaling (cheaper at predictable load).

## 7. Contracts  (`references/10`)

- Event ingestion + webhook payloads described with **AsyncAPI**; wrap events in
  a **CloudEvents** envelope so downstream consumers are portable. Feed read API
  described with **OpenAPI 3.1**. Auth via **OIDC**.

## 8. Precedent consulted  (`references/09`)

- Feed fanout hybrid (write vs read) — Twitter/Instagram timeline writeups.
- At-least-once + idempotency on a log — standard Kafka consumer pattern.
- Per-tenant isolation in pooled multi-tenancy — AWS SaaS Lens.

## Verdict
Modular monolith + Kafka + async workers + DynamoDB feed store + Redis cache.
Top risks: (1) cross-tenant data leakage → central isolation guard + tests;
(2) celebrity fanout hot keys → hybrid fanout; (3) webhook endpoint failures →
circuit breaker + DLQ. Revisit service-split at the next ladder rung.
