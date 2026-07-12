# Product & System Layers — What a Full Stack Needs

Purpose: a top-to-bottom map of every layer a modern production software product is built from — so you can decide which components your system actually needs, pick a technology for each, and check that nothing load-bearing is missing.

## How to read this file

Follow a request from the user's screen down to durable storage and back. Each layer below is a horizontal slice you must consciously *include or consciously skip* — skipping by accident is how outages and rewrites happen. For every layer you get: **what it does**, the **technology choices**, the **decisions you own**, and **canonical links**. Not every product needs every layer (a CRUD app may collapse layers 3–5 into one process; a data platform may have three variants of layer 9) — but you should be able to say *why* for each one.

## Reference architecture (how the layers connect)

```
                                 ┌─────────────────────────────────────────┐
                                 │  1. CLIENTS                               │
                                 │  web SPA / SSR · mobile · desktop · CLI   │
                                 │  3rd-party API consumers · bots/agents    │
                                 └───────────────────┬───────────────────────┘
                                                     │  HTTPS / gRPC / WS
                                 ┌───────────────────▼───────────────────────┐
                                 │  2. EDGE  — DNS · TLS termination · CDN    │
                                 │     WAF / DDoS · edge compute (workers)    │
                                 └───────────────────┬───────────────────────┘
                                                     │
                                 ┌───────────────────▼───────────────────────┐
                                 │  3. GATEWAY / INGRESS / LOAD BALANCER      │
                                 │     L4 LB · L7 reverse proxy · API gateway │
                                 │     authN · rate-limit · routing (+ BFF)   │
                                 └───────────────────┬───────────────────────┘
                                                     │  4. API CONTRACT
                                                     │  (REST/OpenAPI · GraphQL · gRPC)
                       ┌─────────────────────────────┼─────────────────────────────┐
                       │                             │                             │
          ┌────────────▼───────────┐   ┌─────────────▼──────────┐   ┌──────────────▼─────────┐
          │ 5. APPLICATION / SVC   │   │ 5. APPLICATION / SVC   │   │ 5. APPLICATION / SVC   │
          │  stateless business    │◄─►│  stateless business    │◄─►│  stateless business    │
          │  logic (service mesh   │   │  logic                 │   │  logic                 │
          │  handles svc-to-svc)   │   └───────────┬────────────┘   └──────────┬─────────────┘
          └───────┬─────────┬──────┘               │                           │
                  │         │                      │ emit events / enqueue jobs │
                  │         │            ┌──────────▼───────────────────────────▼──────────┐
                  │         │            │ 6. ASYNC / MESSAGING                            │
                  │         │            │  queues (SQS/RabbitMQ) · streams (Kafka)        │
                  │         │            │  task queues (Celery) · workflows (Temporal)    │
                  │         │            └──────────┬──────────────────────────────────────┘
                  │         │                       │  (workers consume → write back)
     ┌────────────▼──┐  ┌───▼────────────┐   ┌──────▼─────────┐  ┌───────────────┐  ┌───────────────┐
     │ 8. CACHE      │  │ 7. DATA (OLTP) │   │ 9. SEARCH /    │  │ 10. OBJECT /  │  │ 9. ANALYTICS /│
     │ Redis /       │  │ Postgres/MySQL │   │    VECTOR      │  │     BLOB      │  │    WAREHOUSE  │
     │ Memcached     │  │ NoSQL · NewSQL │   │ Elastic/OpenS. │  │ S3 / GCS      │  │ Snowflake/    │
     └───────────────┘  └────────────────┘   └────────────────┘  └───────────────┘  │ BigQuery/CH   │
                                                                                     └───────▲───────┘
                                                                                 ETL/CDC ────┘
   ┌──────────────────────────────────────────────────────────────────────────────────────────────┐
   │ CROSS-CUTTING (spans every layer above)                                                        │
   │ 11. Identity / AuthN-AuthZ   12. Observability (metrics·logs·traces)   13. Infra & delivery     │
   │ 14. Resilience · config · i18n · background jobs · notifications (email/SMS/push)               │
   └──────────────────────────────────────────────────────────────────────────────────────────────┘
```

Request path (happy path): **Client → DNS → CDN/edge → LB → gateway → service → (cache hit? return) → DB/search/blob → response back up**. Writes often fan out sideways into **async/messaging**, whose workers update the data, cache, search index, and warehouse. Layers 11–14 are not a row in the stack — they wrap all of it.

---

## Layer 1 — Client / Frontend

**What it does:** Renders the UI and holds the user's session context. This is the only layer most users ever see; its rendering strategy dictates latency, SEO, and how much logic lives at the edge vs. the server.

| Choice | Options | Best when |
|---|---|---|
| Web rendering | SPA (client-render), SSR (server-render), SSG (static), streaming/RSC hybrid | SPA for app-like dashboards behind login; SSR/SSG when SEO + first-paint matter |
| Native surfaces | iOS/Android native, React Native/Flutter (cross-platform), PWA | Native for deep device APIs; cross-platform to share one codebase |
| Desktop | Electron/Tauri (web tech), native | Reuse web UI as a desktop app |
| Client↔server seam | Direct API calls, or a **Backend-for-Frontend (BFF)** per client type | BFF when each client (web/mobile/TV) needs a differently-shaped, aggregated API |

**The BFF pattern:** instead of one general-purpose backend serving every client, give each frontend its own thin backend that aggregates downstream calls and returns exactly the shape that UI needs. It keeps client-specific logic out of shared services and lets frontend teams ship independently.

**Decide:** rendering strategy (SPA vs SSR vs SSG) · one API for all clients vs a BFF per client · where session/auth tokens live (cookie vs storage) · offline/PWA support · which logic is safe to run client-side.

**References:** [Sam Newman — Backends For Frontends](https://samnewman.io/patterns/architectural/bff/) · [Azure Architecture Center — BFF pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/backends-for-frontends) · [AWS — Backends for Frontends pattern](https://aws.amazon.com/blogs/mobile/backends-for-frontends-pattern/)

---

## Layer 2 — Edge / CDN / DNS

**What it does:** The public front door. Resolves your name (DNS), terminates TLS, caches and serves static assets near users (CDN), absorbs attacks (WAF/DDoS), and can run logic at the edge before requests ever reach your origin.

| Concern | What it handles | Options |
|---|---|---|
| DNS | Name → IP; geo/latency routing, failover | Route 53, Cloudflare DNS, NS1, Google Cloud DNS |
| CDN cache | Static assets, cacheable API responses near users | CloudFront, Cloudflare, Fastly, Akamai |
| TLS termination | HTTPS handshake, cert management | At CDN/edge, at LB, or both |
| Security | WAF, bot management, DDoS absorption, rate limiting | Cloudflare, AWS Shield/WAF, Fastly |
| Edge compute | Rewrites, auth checks, A/B, personalization at the POP | CloudFront Functions / Lambda@Edge, Cloudflare Workers, Fastly Compute |

**Decide:** who owns DNS vs registrar · where TLS terminates and how certs auto-renew · cache TTLs and cache keys (see Layer 8) · which logic runs at the edge vs origin · DDoS/WAF posture.

**References:** [Amazon CloudFront](https://aws.amazon.com/cloudfront/) · [CloudFront features (edge compute, S3 integration)](https://aws.amazon.com/cloudfront/features/) · [Cloudflare — edge network performance benchmark (CDN comparison)](https://blog.cloudflare.com/benchmarking-edge-network-performance/)

---

## Layer 3 — API Gateway / Load Balancer / Ingress

**What it does:** The single entry point into your application. Balances load across instances, routes to the right service, and enforces cross-cutting concerns (auth, rate limiting, request/response transformation) so individual services don't each reimplement them.

| Component | Layer | Responsibilities |
|---|---|---|
| L4 load balancer | Transport (TCP/UDP) | Fast connection-level distribution; no HTTP awareness |
| L7 reverse proxy | Application (HTTP) | Path/host routing, TLS, header manipulation, retries — Nginx, Envoy, HAProxy |
| API gateway | Application | AuthN/Z, rate limit, quota, request routing, API composition/aggregation, protocol translation, per-client BFF |
| Kubernetes ingress | Application | Ingress/Gateway API controller (often Envoy/Nginx-backed) routes external traffic to pods |

**Key distinction:** an **L4 LB** moves packets by IP/port and is cheap and fast; an **L7 gateway** understands HTTP, so it can route by path, authenticate, and aggregate — at more cost per request. Most stacks use both: L4 in front for raw distribution, L7 for smarts. The API gateway is also the natural home for the **BFF** variant (one gateway config per client type).

**Decide:** L4 vs L7 vs both · gateway product (managed API GW vs self-hosted Envoy/Nginx) · what the gateway enforces vs what services enforce (avoid a "smart gateway, dumb service" trap) · one gateway vs per-client BFFs · ingress controller in Kubernetes.

**References:** [microservices.io — API Gateway / BFF pattern](https://microservices.io/patterns/apigateway.html) · [Envoy proxy](https://www.envoyproxy.io/) · [Envoy Gateway](https://gateway.envoyproxy.io/)

---

## Layer 4 — API Layer / Contracts

**What it does:** Defines the *contract* between clients and services — the shapes, verbs, and error semantics. The contract is the product's most durable interface; changing it breaks callers, so it deserves an explicit, versioned specification. (See `references/10-open-standards.md`.)

| Style | Shape | Use when | Spec |
|---|---|---|---|
| REST + OpenAPI | Resources over HTTP verbs; JSON | Broad public/partner APIs, cacheable reads | OpenAPI Specification |
| GraphQL | Single endpoint, client-specified query graph | Many client shapes, avoid over/under-fetching | GraphQL spec |
| gRPC | Binary Protobuf over HTTP/2, codegen stubs | Low-latency internal service-to-service | Protobuf/gRPC |
| Webhooks / events | Server→client HTTP callbacks on events | Async notifications to third parties | CloudEvents / webhooks.fyi |

**Decide:** which style per surface (public REST + internal gRPC is common) · versioning strategy (URI, header, or schema evolution) · spec-first vs code-first · pagination, filtering, error format conventions · webhook delivery guarantees, retries, and signature verification (see Layer 6 and Layer 11).

**References:** [OpenAPI Initiative](https://www.openapis.org/) · [OpenAPI Specification v3.1](https://spec.openapis.org/oas/v3.1.0.html) · [Learn OpenAPI](https://learn.openapis.org/) · [GraphQL Specification](https://spec.graphql.org/) · [gRPC docs](https://grpc.io/docs/) · [CloudEvents](https://cloudevents.io/) · [CloudEvents HTTP webhook spec](https://github.com/cloudevents/spec/blob/main/cloudevents/http-webhook.md) · [webhooks.fyi — standards](https://webhooks.fyi/learn-more/standards)

---

## Layer 5 — Application / Service Tier

**What it does:** Where business logic lives. The core rule for scalability: keep processes **stateless** and share-nothing — any state that must survive a request goes to a backing service (DB, cache, queue), never to process memory or local disk. Stateless processes scale out, restart, and move freely.

| Decision | Options |
|---|---|
| Granularity | Monolith · modular monolith · microservices |
| State | Stateless services + external stores (never sticky sessions) |
| Service-to-service | Direct calls, or a **service mesh** (sidecar proxy) for mTLS, retries, traffic-shifting, tracing |
| Runtime | Long-running containers · serverless functions · both |

**Service mesh:** a data-plane of sidecar proxies (Envoy in Istio; a Rust micro-proxy in Linkerd) that transparently adds mTLS, retries, timeouts, load balancing, and observability to every service-to-service call — without changing app code. Adopt it when you have enough services that reimplementing these per-service becomes the bottleneck; skip it for a handful of services.

**Decide:** monolith vs microservices (start simpler than you think you need) · stateless enforcement · mesh vs library-based resilience · sync calls vs events between services · serverless vs always-on.

**References:** [The Twelve-Factor App — stateless processes](https://12factor.net/processes) · [microservices.io — Microservice architecture](https://microservices.io/patterns/microservices.html) · [Linkerd (service mesh)](https://linkerd.io/) · [Linkerd vs Istio comparison](https://www.buoyant.io/linkerd-vs-istio) · [Envoy (mesh data plane)](https://www.envoyproxy.io/)

---

## Layer 6 — Async / Messaging

**What it does:** Decouples work in time. Instead of doing everything inside the request, services emit events or enqueue jobs; workers process them independently. This is how you get resilience (retry on failure), scalability (absorb spikes), and decoupling (producers don't know consumers).

| Primitive | Purpose | Technologies |
|---|---|---|
| Message queue | Point-to-point work distribution, decoupling | Amazon SQS, RabbitMQ |
| Event stream | High-throughput, replayable, multi-consumer log | Apache Kafka, Amazon Kinesis, Apache Pulsar |
| Pub/sub | Fan-out one event to many subscribers | SNS, Google Pub/Sub, NATS |
| Task queue | Background jobs from app code | Celery (Python), Sidekiq (Ruby), BullMQ (Node) |
| Workflow / orchestration | Durable, multi-step, long-running processes with retries & compensation | Temporal, AWS Step Functions, the Saga pattern |

**Queue vs stream (the key fork):** a **queue** delivers each message to one consumer and drops it once acked (work distribution). A **stream** is an append-only log many consumers read independently and can replay (event sourcing, analytics, multiple downstream reactions). **Workflow engines** (Temporal, Step Functions) sit above both when you need durable state, idempotency, and compensation across many steps — a code-first alternative to hand-rolled Sagas.

**Decide:** queue vs stream vs pub/sub per use case · delivery guarantee (at-least-once is normal → make consumers idempotent) · ordering needs · dead-letter handling · orchestration vs choreography for multi-service transactions · managed vs self-hosted broker.

**References:** [Amazon SQS docs](https://docs.aws.amazon.com/sqs/) · [RabbitMQ docs](https://www.rabbitmq.com/docs) · [Apache Kafka docs](https://kafka.apache.org/documentation/) · [AWS — Kafka vs RabbitMQ](https://aws.amazon.com/compare/the-difference-between-rabbitmq-and-kafka/) · [Temporal — self-hosted guide](https://docs.temporal.io/self-hosted-guide) · [AWS Step Functions](https://aws.amazon.com/step-functions/) · [Saga pattern (Azure)](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga) · [CloudEvents (event format)](https://cloudevents.io/)

---

## Layer 7 — Data Layer

**What it does:** The system of record — durable, consistent, queryable state. Pick storage by *how the data is accessed*, not by habit. **Polyglot persistence** is the modern default: use multiple stores, each matched to a data shape and access pattern, rather than forcing everything into one relational database.

| Family | Examples | Strengths / when |
|---|---|---|
| OLTP relational | PostgreSQL, MySQL | ACID transactions, joins, strong consistency — the default system of record |
| Document | MongoDB, DynamoDB (doc mode) | Schemaless JSON, flexible shape, key-based access |
| Key-value / wide-column | DynamoDB, Cassandra | Massive horizontal scale, predictable single-key latency |
| NewSQL / distributed SQL | CockroachDB, Google Spanner | SQL + ACID *and* horizontal scale / multi-region |
| Graph | Neo4j, Neptune | Relationship-heavy traversals |

**Cross-cutting data concerns you must design, not inherit:** **transactions & consistency** (strong vs eventual — DynamoDB is eventually consistent by default; Postgres/Spanner offer strong), **schema migrations** (version every schema change; Flyway/Liquibase/framework migrations run in CI/CD), **backups & PITR**, **multi-tenancy** (shared schema vs DB-per-tenant), and **indexing**.

**Decide:** one primary store or polyglot · SQL vs NoSQL per workload · consistency model · sharding/partitioning key · migration tooling and rollout process · tenancy isolation · backup/restore SLA.

**References:** [Martin Fowler — NoSQL & Polyglot Persistence](https://martinfowler.com/articles/nosql-intro-original.pdf) · [PostgreSQL documentation](https://www.postgresql.org/docs/) · [Amazon DynamoDB resources](https://aws.amazon.com/dynamodb/resources/) · [CockroachDB vs Google Spanner](https://www.cockroachlabs.com/compare/cockroachdb-vs-google-spanner/) · [ClickHouse — OLTP vs OLAP](https://clickhouse.com/resources/engineering/oltp-vs-olap) · migrations: [Flyway (CockroachDB guide)](https://www.cockroachlabs.com/blog/flyway/), [Atlas vs Flyway/Liquibase](https://atlasgo.io/atlas-vs-others)

---

## Layer 8 — Caching Layer

**What it does:** Trades freshness for speed and load reduction by keeping hot data closer to the reader. Caching exists at several tiers, and each needs an *invalidation* answer — the hard part.

| Tier | Where | Tech |
|---|---|---|
| CDN / edge cache | At POPs, before origin | CloudFront/Cloudflare/Fastly (Layer 2) |
| In-memory / distributed | Between app and DB | Redis, Memcached |
| Application / local | In-process | Caffeine, local LRU, HTTP client cache |
| Database / query cache | Inside or beside DB | Materialized views, read replicas |

**Invalidation strategies:** **TTL/expiry** (simple, passive — data can be stale until it expires); **write-through / write-behind** (update cache on write); **event-driven invalidation** (evict exactly the affected keys when source data changes); **tag/group invalidation** (evict related sets together). Redis is the usual default (rich types, persistence, pub/sub, key-tracking invalidation); Memcached only for pure simple key-value at extreme simplicity.

**Decide:** which tiers you cache at · Redis vs Memcached · TTL vs event-driven invalidation (or both) · cache key design · handling thundering-herd/stampede on miss · read-replica vs cache for read scaling.

**References:** [Redis — cache invalidation](https://redis.io/glossary/cache-invalidation/)

---

## Layer 9 — Search & Analytics

**What it does:** Answers questions the OLTP store answers slowly or not at all — full-text/faceted search, semantic (vector) search for AI, and heavy analytical aggregations. Almost always a *separate* store fed from the system of record via a pipeline.

| Need | Store | Fed by |
|---|---|---|
| Full-text / faceted search | Elasticsearch, OpenSearch | Index sync / CDC |
| Vector / semantic (AI, RAG) | pgvector, OpenSearch k-NN, Pinecone, Qdrant, Weaviate, Milvus | Embedding pipeline |
| OLAP / warehouse | Snowflake, BigQuery, ClickHouse, Redshift, Druid | ETL/ELT batch or streaming |
| Pipelines / ETL / CDC | dbt, Airflow, Fivetran, Debezium, Kafka Connect | Sources → warehouse/search |

**Split to reason about:** **OLTP** (Layer 7) is row-oriented, optimized for many small transactions; **OLAP** here is columnar, optimized for wide aggregations over billions of rows. Don't run analytics on the primary DB. For AI features, **vector search** is now a first-class member — start with `pgvector` if you're already on Postgres and volumes are moderate; move to OpenSearch/dedicated vector DBs at scale.

**Decide:** do you need search, analytics, vectors, or all three (each is its own store) · how each is kept in sync (CDC vs batch ETL vs dual-write) · warehouse vs real-time OLAP · where embeddings are generated and stored · data freshness SLA.

**References:** [OpenSearch — vector search](https://docs.opensearch.org/latest/vector-search/) · [pgvector](https://github.com/pgvector/pgvector) · [Amazon OpenSearch — vector DB capabilities](https://aws.amazon.com/blogs/big-data/amazon-opensearch-services-vector-database-capabilities-explained/) · [Elastic (ELK) Stack](https://www.elastic.co/elastic-stack) · [ClickHouse — what is OLAP](https://clickhouse.com/resources/engineering/olap-database)

---

## Layer 10 — Object / Blob Storage & File Handling

**What it does:** Stores unstructured binary data — uploads, images, video, documents, backups, ML artifacts, static site assets — cheaply and durably, outside the database. Databases store *pointers* to blobs, not the blobs.

| Concern | Options |
|---|---|
| Object store | Amazon S3, Google Cloud Storage, Azure Blob, MinIO (self-host), Cloudflare R2 |
| Upload path | Presigned URLs (client → store direct), server proxy |
| Media processing | Image resize/transcode (Lambda, Sharp, ffmpeg), thumbnails, virus scan |
| Delivery | Front the bucket with a CDN (Layer 2); signed URLs for private assets |
| Lifecycle | Storage classes / tiering, expiration, versioning |

**Decide:** which provider (or S3-compatible on-prem) · direct-to-store presigned uploads vs proxying through your API · what processing runs on upload vs on-read · private (signed) vs public assets · CDN in front · lifecycle/retention rules.

**References:** [Amazon S3 documentation](https://docs.aws.amazon.com/s3/) · [What is Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html)

---

## Layer 11 — AuthN / AuthZ & Identity

**What it does:** Answers two separate questions — *who is this?* (authentication) and *what may they do?* (authorization) — across users, services, and machines. This is a cross-cutting layer; see `references/02-security.md` for depth. Do not build primitives (password hashing, token issuance) yourself when a standard covers it.

| Concern | Standard / tech |
|---|---|
| Authorization framework | **OAuth 2.0** (RFC 6749) — delegated access, "what can this app do?" |
| Authentication (identity) | **OpenID Connect (OIDC)** — identity layer on top of OAuth 2.0, "who is the user?" |
| Identity providers (IdP) | Auth0, AWS Cognito, Keycloak (self-host), Okta, Entra ID |
| Service/machine identity | mTLS (service mesh, Layer 5), workload identity, signed JWTs |
| Authorization models | RBAC, ABAC, ReBAC (relationship-based, e.g. Zanzibar-style) |
| Token/secret handling | Short-lived JWTs, refresh tokens, rotation, secrets manager (Layer 13) |

**Decide:** buy vs self-host the IdP (Auth0/Cognito vs Keycloak) · OIDC for login, OAuth for API access · session cookies vs bearer tokens · RBAC vs ABAC vs ReBAC · how services authenticate to each other · webhook/inbound signature verification (Layer 4/6).

**References:** [OAuth 2.0 (oauth.net)](https://oauth.net/2/) · [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html) · [Auth0 — OIDC protocol](https://auth0.com/docs/authenticate/protocols/openid-connect-protocol) · [AWS Cognito — OIDC IdP](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-oidc-idp.html) · [Keycloak](https://www.keycloak.org/)

---

## Layer 12 — Observability

**What it does:** Lets you answer *what broke, why, and where* in production. Built on the **three pillars — metrics, logs, traces** — plus dashboards and alerting on top. Instrument from day one; retrofitting observability during an incident is too late.

| Pillar | Answers | Tools |
|---|---|---|
| Metrics | "What is the rate/error/latency?" (numeric time-series) | Prometheus, Grafana, Datadog, CloudWatch |
| Logs | "What happened at this moment?" (event records) | ELK/Elastic, Loki, OpenSearch, Datadog |
| Traces | "Where did the request spend time across services?" | OpenTelemetry, Jaeger, Tempo, Datadog APM |
| Instrumentation standard | Vendor-neutral collection of all three | **OpenTelemetry (OTel)** |
| Dashboards & alerting | Visualize + page on SLO breach | Grafana, Alertmanager, PagerDuty |

**The unifying move:** instrument with **OpenTelemetry** (vendor-neutral) so you can export to Prometheus/Grafana today or Datadog tomorrow without re-instrumenting. Define **SLOs** and alert on symptoms (error rate, latency) not just causes (CPU). (See `references/04-capacity-limits.md` for the Four Golden Signals and SLO thresholds.)

**Decide:** OTel-first instrumentation vs vendor SDK lock-in · self-hosted (Prometheus/Grafana/Loki/Jaeger) vs managed (Datadog/Grafana Cloud) · metric cardinality budget · log retention/sampling · which SLOs page a human vs file a ticket.

**References:** [OpenTelemetry docs](https://opentelemetry.io/docs/) · [Prometheus](https://prometheus.io/) · [Grafana — OpenTelemetry](https://grafana.com/docs/opentelemetry/) · [Elastic (ELK) docs](https://www.elastic.co/docs) · [Datadog — OpenTelemetry](https://docs.datadoghq.com/opentelemetry/)

---

## Layer 13 — Infrastructure & Delivery

**What it does:** Packages, provisions, ships, and configures everything above — reproducibly. This is how code becomes running infrastructure without manual clicks, and how you roll changes out (and back) safely.

| Concern | Options |
|---|---|
| Containers | Docker/OCI images |
| Orchestration | Kubernetes, ECS, Nomad, serverless platforms |
| Infrastructure as Code (IaC) | Terraform, Pulumi, AWS CDK, CloudFormation |
| CI/CD | GitHub Actions, GitLab CI, Argo CD, Jenkins |
| Environments | dev / staging / prod parity; ephemeral preview envs |
| Feature flags | OpenFeature (standard), LaunchDarkly, Unleash, Flagsmith |
| Secrets & config | Vault, AWS Secrets Manager, SSM, sealed secrets — env vars, never in code |

**Two anchors:** (1) **IaC** — declare infra in version control; Terraform (cloud-agnostic, HCL) vs Pulumi/CDK (real programming languages) vs CloudFormation (AWS-native). (2) **Config discipline** — per Twelve-Factor, config that varies by environment lives in the environment (env vars / secrets manager), not in the build; the same artifact promotes across dev→staging→prod. **Feature flags** decouple deploy from release and enable safe rollouts; the **OpenFeature** standard keeps you vendor-portable.

**Decide:** orchestration platform (do you need Kubernetes, or is ECS/serverless enough?) · IaC tool · CI/CD flow and gates · environment strategy and parity · feature-flag provider · secret storage and rotation.

**References:** [Kubernetes docs](https://kubernetes.io/docs/home/) · [CNCF Landscape](https://landscape.cncf.io/) · [Terraform docs](https://developer.hashicorp.com/terraform/docs) · [Pulumi](https://www.pulumi.com/) · [Pulumi vs AWS CDK](https://www.pulumi.com/docs/iac/comparisons/aws-cdk/) · [AWS CDK (Prescriptive Guidance)](https://docs.aws.amazon.com/prescriptive-guidance/latest/choose-iac-tool/aws-cdk.html) · [OpenFeature](https://openfeature.dev/) · [Twelve-Factor — config](https://12factor.net/config)

---

## Layer 14 — Cross-Cutting Concerns

**What it does:** Capabilities that don't live in one layer but must be designed across all of them. Easy to forget in an architecture diagram; painful to add later.

| Concern | What it means | Patterns / tech |
|---|---|---|
| Resilience | Survive partial failure without cascading | **Circuit breaker**, retry (with backoff + jitter), timeout, **bulkhead** (isolate resources), fallback, idempotency |
| Config management | Environment-varying settings, feature toggles | Env vars, config service, flags (Layer 13) |
| Background jobs | Scheduled + deferred work | Cron/scheduled tasks, task queues (Layer 6) |
| Notifications | Reach users out-of-band | Email (SendGrid/SES), SMS/voice (Twilio), push (FCM/APNs), in-app |
| Internationalization (i18n/l10n) | Multi-language, locale, currency, timezone, RTL | ICU / Unicode CLDR message formatting, locale-aware formatting |
| Rate limiting & quotas | Protect services, enforce fair use | At gateway (Layer 3) + per-service |

**Resilience is the big one:** remote calls fail or hang, and a slow dependency can exhaust your threads and cascade into total outage. A **circuit breaker** trips after a failure threshold so callers fail fast instead of piling up; **bulkheads** isolate resource pools so one sick dependency can't sink the ship; **retries with backoff + idempotent handlers** absorb transient faults. A **service mesh** (Layer 5) can provide much of this without app code.

**Decide:** which calls get circuit breakers/timeouts/bulkheads · retry + idempotency strategy · notification channels and providers · i18n scope (which locales, from day one or later) · where rate limits live.

**References:** [Martin Fowler — Circuit Breaker](https://martinfowler.com/bliki/CircuitBreaker.html) · [Saga pattern (distributed transactions)](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga) · [Twilio docs](https://www.twilio.com/docs) · resilience patterns overview: [microservices.io](https://microservices.io/patterns/microservices.html)

---

## Checklist: does your design address every layer?

- [ ] **1. Client** — Rendering strategy chosen (SPA/SSR/SSG)? One backend for all clients, or a BFF per client type? Where do auth tokens live?
- [ ] **2. Edge** — DNS, TLS termination, and cert renewal defined? CDN + WAF/DDoS in place? Any edge compute?
- [ ] **3. Gateway/LB** — L4, L7, or both? What does the gateway enforce (auth, rate limit, routing) vs the services? Ingress controller picked?
- [ ] **4. API contract** — REST/GraphQL/gRPC chosen per surface and specified (OpenAPI/schema/proto)? Versioning + error format defined? Webhooks signed and retried?
- [ ] **5. Service tier** — Services stateless (no sticky sessions)? Monolith vs microservices deliberate? Service mesh or library resilience?
- [ ] **6. Async** — Queue vs stream vs pub/sub per use case? Consumers idempotent (at-least-once)? Dead-letter + orchestration/Saga for multi-step flows?
- [ ] **7. Data** — Right store per access pattern (polyglot where justified)? Consistency model explicit? Migrations versioned in CI/CD? Backups + tenancy isolation?
- [ ] **8. Cache** — Which tiers? Invalidation strategy chosen (TTL vs event-driven)? Stampede protection on miss?
- [ ] **9. Search/analytics** — Need search, vectors, or OLAP? Each in its own store, kept in sync (CDC/ETL)? Freshness SLA?
- [ ] **10. Object storage** — Blobs out of the DB? Presigned uploads? Media processing + CDN delivery + lifecycle rules?
- [ ] **11. Identity** — OAuth 2.0 / OIDC via a real IdP (not hand-rolled)? RBAC/ABAC/ReBAC model? Service-to-service auth (mTLS/JWT)?
- [ ] **12. Observability** — Metrics, logs, AND traces instrumented (OpenTelemetry)? Dashboards + SLO-based alerting? Retention/sampling set?
- [ ] **13. Infra & delivery** — Containerized? IaC (Terraform/Pulumi/CDK)? CI/CD with environment parity? Feature flags? Secrets in a manager, not code?
- [ ] **14. Cross-cutting** — Circuit breakers/timeouts/bulkheads on risky calls? Background jobs + notifications (email/SMS/push)? i18n scope? Rate limits placed?

If a layer is intentionally skipped, write down *why* — an omission you can justify is a design decision; an omission you can't is a future incident.
