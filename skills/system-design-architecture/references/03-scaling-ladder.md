# The Scaling Ladder — Low Volume to High Volume

A stage-by-stage playbook for evolving one system from a single box serving a handful of users to a globally-distributed platform serving millions — each rung defined by the symptom that forces it, the specific architectural move, and what that move costs you.

---

## How to read this file

Scaling is not a destination, it is a **ladder you climb one rung at a time, and only when a symptom forces you.** Every rung buys you throughput or availability and charges you in complexity and consistency. The canonical industry map for this journey is AWS's "Scaling up to your first 10 million users" ([slides/PDF](https://pages.awscloud.com/rs/112-TZM-766/images/DCD-T5-Scaling_up_to_your_first_10_million_users.pdf), and the startup-blog series: [>10K](https://aws.amazon.com/blogs/startups/scaling-on-aws-part-2-10k-users/), [>500K](https://aws.amazon.com/blogs/startups/scaling-on-aws-part-3-500k-users/), [>1M](https://aws.amazon.com/blogs/startups/scaling-on-aws-part-4-one-million-users/)) and High Scalability's [beginner's guide to scaling to 11M users](https://highscalability.com/a-beginners-guide-to-scaling-to-11-million-users-on-amazons/). For a deeper reading list of battle-tested patterns, [binhnguyennus/awesome-scalability](https://github.com/binhnguyennus/awesome-scalability) is the standard reference. For the data-layer fundamentals, Kleppmann's [*Designing Data-Intensive Applications*](https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/) (DDIA) is the bible.

**Two rules govern the whole ladder. Read these before touching any rung:**

### Rule 1 — Scale *up* before you scale *out*

There are only two ways to add capacity:

| | Vertical (scale-up) | Horizontal (scale-out) |
|---|---|---|
| **Move** | Bigger box: more CPU/RAM/IOPS | More boxes behind a distributor |
| **Ceiling** | Hard — the biggest instance you can rent | Effectively unbounded |
| **Complexity** | Almost none — resize and reboot | High — load balancing, coordination, state |
| **Failure mode** | Single point of failure remains | Redundancy comes for free |
| **Best for** | Databases early on, stateful/legacy tiers | Stateless web/app tiers, caches, workers |

Vertical scaling keeps things simple, but you will eventually hit a machine that cannot get any bigger; horizontal scaling gives redundancy and near-unlimited capacity at the price of coordination. **Do the cheap thing first: resize the box. Reach for horizontal only when a bigger box can't be bought or the single box is an unacceptable SPOF.** Most mature production stacks use both. Sources: [IBM: scale-up vs scale-out](https://www.ibm.com/think/topics/scale-up-vs-scale-out), [Cockroach Labs](https://www.cockroachlabs.com/blog/vertical-scaling-vs-horizontal-scaling/), [DataCamp](https://www.datacamp.com/blog/horizontal-vs-vertical-scaling).

### Rule 2 — Stateless-first design (the thing that makes the whole ladder possible)

Horizontal scaling of the app tier only works if any request can hit any node. That requires **statelessness**: the app process keeps no session, no user data, no workflow status in local memory or disk — any durable state lives in a backing service (DB, cache, object store). This is the [Twelve-Factor "Processes"](https://12factor.net/processes) and ["Concurrency"](https://12factor.net/concurrency) factors:

> "The share-nothing, horizontally partitionable nature of twelve-factor app processes means that adding more concurrency is a simple and reliable operation." — [12factor.net/concurrency](https://12factor.net/concurrency)

The concrete discipline:
- **No sticky sessions.** Caching session data in a process's memory and pinning users to that process is a violation of twelve-factor and should never be relied upon. Push session state to Redis/Memcached or signed cookies/JWTs.
- **No local disk as a source of truth.** Uploads go to object storage (S3), not the local filesystem.
- **Externalize everything shared** — sessions, locks, feature flags, rate-limit counters — into a backing service, so nodes are interchangeable and disposable.

Get this right at rung 0 and every subsequent rung (load balancing, autoscaling, multi-region) is a config change. Get it wrong and you re-architect under fire. Sources: [12factor.net/processes](https://12factor.net/processes), [Red Hat: illustrated guide to 12-factor](https://www.redhat.com/en/blog/12-factor-app).

---

## The ladder at a glance

| # | Rung | Approx. scale | Symptom that forces the next move | Architectural change | What it costs you |
|---|---|---|---|---|---|
| 0 | Single server (all-in-one) | 0–1K users · <10 RPS · <1 GB | App and DB fight for CPU/RAM; every deploy risks the data | Split the database onto its own (managed) host | Two systems to operate; a network hop |
| 1 | Separate DB host | 1K–10K users · tens of RPS | Same rows read over and over; DB CPU on repeat reads | Add a cache tier (cache-aside, Redis/Memcached) | Cache invalidation + staleness |
| 2 | Bigger box (vertical) | 10K users · ~100 RPS | One tier is CPU/RAM-bound but still a single node | Resize instance(s) before adding nodes | Hits a hard ceiling; SPOF remains |
| 3 | Load balancer + horizontal app tier | 10K–100K users · 100s RPS | App box is a SPOF; deploys cause downtime; CPU maxed | LB across ≥2 stateless app nodes, multi-AZ, + autoscaling | Must be truly stateless; session store dependency |
| 4 | Read replicas | Read-heavy · reads ≫ writes | Primary DB saturated on `SELECT`s (often 90%+ reads) | Async read replicas; route reads to replicas, writes to primary | Replication lag → eventual consistency / read-your-writes bugs |
| 5 | CDN / edge | Global users · asset-heavy | Static assets + media dominate bandwidth; far users slow | CDN edge caching; offload static + cacheable dynamic from origin | TTL tuning, cache purge/invalidation complexity |
| 6 | Async queues + workers | Spiky writes · slow tasks | Slow tasks inflate request latency; spikes overload the app | Move work off the request path into a queue + worker pool | Eventual completion; idempotency, retries, dead-letter handling |
| 7 | Sharding / partitioning | 10M+ rows · write-bound | One primary can't hold the writes/data; vertical DB maxed | Partition (one DB) → shard (many DBs) by a key | Cross-shard joins hard; rebalancing; distributed transactions |
| 8 | Service decomposition | Large org + codebase | Monolith deploys risky; teams block each other; tiers scale differently | Strangler-fig extraction of high-value seams into services | Full distributed-systems tax: network, versioning, observability |
| 9 | Multi-region / active-active | Global · HA/DR/compliance | Single region = latency floor + outage & data-residency risk | Multi-region (active-passive → active-active), geo-routing | CAP forces consistency-vs-availability; conflict resolution |

The rungs below add the *why* and the *how* for each.

---

## Rung 0 → 1: Single server → separate the database

- **Scale:** 0–1K users, single node running app + DB + web server.
- **Symptom:** the app process and the database compete for the same CPU, RAM, and disk; a traffic spike in one starves the other, and you cannot tune or restart one without the other.
- **Move:** pull the database onto its own host — ideally a **managed database** (RDS/Cloud SQL) so backups, patching, and failover aren't your job. AWS's guide is blunt here: start with a web tier on one host and the database on a managed service; you aren't going to break a SQL database with your first 10 million users, not even close.
- **Cost:** a network hop between app and DB, and a second system to operate. Cheap and worth it — this is the split that lets each tier scale independently later.

## Rung 1 → 2: Add a cache tier

- **Scale:** 1K–10K users; you notice the same rows fetched thousands of times.
- **Symptom:** DB CPU climbs and p95 latency rises even though the *working set* is small — you're re-reading data that rarely changes.
- **Move:** put an in-memory cache (Redis/Memcached) in front of the DB. Pick a write strategy deliberately:

| Strategy | How it works | Consistency | Best for | Source |
|---|---|---|---|---|
| **Cache-aside (lazy)** | App checks cache; on miss, reads DB, populates cache | Can serve stale until TTL/invalidation | Read-heavy: catalogs, feeds, profiles | [CodeAhoy](https://codeahoy.com/2017/08/11/caching-strategies-and-how-to-choose-the-right-one/) |
| **Read-through** | Cache library fetches from DB on miss | Same as cache-aside, centralized | Uniform read paths | [NCache](https://www.alachisoft.com/resources/articles/readthru-writethru-writebehind.html) |
| **Write-through** | Write hits cache **and** DB synchronously | Freshest; adds write latency | Real-time consistency: banking, inventory | [NCache](https://www.alachisoft.com/resources/articles/readthru-writethru-writebehind.html) |
| **Write-behind (write-back)** | Write hits cache now, DB later async | Fast writes; risk of loss on crash | Write-intensive: analytics, CMS | [Redis](https://redis.io/blog/why-your-caching-strategies-might-be-holding-you-back-and-what-to-consider-next/) |

- **Default:** **cache-aside for reads.** It's the most flexible and the workhorse of nearly every scaled system.
- **Cost:** cache invalidation (famously one of the two hard problems) and staleness. Every cache is a bet that slightly-old data is acceptable; know your TTLs and your invalidation triggers.

## Rung 2 → 3: Load balancer + horizontal, stateless app tier

- **Scale:** 10K–100K users, hundreds of RPS; you've already resized the box (Rule 1) and it's still a single point of failure.
- **Symptom:** the single app node is both a SPOF and CPU-bound; you can't deploy without downtime.
- **Move:** put a **load balancer** (ELB/ALB) in front of **≥2 identical, stateless app nodes spread across Availability Zones**, and turn on **autoscaling** so node count tracks load. AWS calls the LB a redundant, horizontally scaled service and pairs it with Multi-AZ redundancy in the DB tier. This rung is only possible because you designed stateless (Rule 2) — session state already lives in Redis or a signed token, so any node can serve any request.
- **Cost:** you are now a distributed system. The temptation to reach for sticky sessions is a trap — resist it; it re-couples users to nodes and breaks autoscaling and rolling deploys.

## Rung 3 → 4: Read replicas

- **Scale:** reads vastly outnumber writes (90%+ read is typical for social/content apps).
- **Symptom:** the primary DB is saturated, and profiling shows the load is `SELECT`s, not writes.
- **Move:** add **asynchronous read replicas**. Route reads to replicas, writes to the primary. Also add **connection pooling** (PgBouncer/ProxySQL) *before* replicas if connection count is the bottleneck — every Postgres connection spins up a backend process that eats memory (~1.3 MB each in Instagram's case), so a pooler often buys headroom more cheaply than a replica. Read paths on the [Postgres scaling ladder](https://www.velodb.io/glossary/ways-to-scale-postgresql): tune → pool → replicas → partition → shard.
- **Cost:** **replication lag.** Replicas are eventually consistent, so a user can write and then *not* see their own change on the next read. Your app must handle read-your-writes explicitly (route critical reads to the primary, or read from cache). This is the first rung where consistency stops being free. See DDIA Ch. 5 ([Replication](https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/ch05.html)).

## Rung 4 → 5: CDN / edge

- **Scale:** a geographically spread user base; static assets and media dominate bandwidth.
- **Symptom:** images, JS/CSS, and downloads eat origin bandwidth, and users far from your region wait on round trips.
- **Move:** front the system with a **CDN** — a globally distributed network of edge servers that cache content close to users. On a request, the edge serves from cache if fresh; on miss/expiry it fetches from origin, caches, and serves. Control freshness with `Cache-Control: max-age`. Push static assets (and cacheable dynamic responses) to the edge to offload the origin and cut latency. Sources: [Cloudflare: what is a CDN](https://www.cloudflare.com/learning/cdn/what-is-a-cdn/), [Cloudflare: edge server](https://www.cloudflare.com/learning/cdn/glossary/edge-server/), [AWS: what is a CDN](https://aws.amazon.com/what-is/cdn/), [Akamai](https://www.akamai.com/glossary/what-is-a-cdn).
- **Cost:** cache invalidation and TTL management move to the edge — a stale asset now lives in hundreds of locations, so purge/versioning strategy (fingerprinted filenames, cache-busting query strings) becomes load-bearing.

## Rung 5 → 6: Async queues + workers (smooth the load, then shed it)

- **Scale:** spiky traffic and slow synchronous tasks (email, image/video processing, invoice generation, third-party API calls).
- **Symptom:** slow work performed inside the request inflates p99 latency, and traffic surges overwhelm the app because arrival rate exceeds processing rate.
- **Move:** put a **message queue between producers and consumers** and process work in a **pool of workers** (competing-consumers). This is [**queue-based load leveling**](https://learn.microsoft.com/en-us/azure/architecture/patterns/queue-based-load-leveling): the queue is a shock absorber that buffers the difference between arrival rate and processing rate, turning *"handle 10,000 requests/sec right now"* into *"process 10,000 messages over the next few minutes."* Scale workers on queue depth ([competing consumers](https://learn.microsoft.com/en-us/azure/architecture/patterns/competing-consumers)).
- **When the queue itself can't keep up, add defenses** — this is where the AWS Builders' Library is essential:
  - **[Load shedding](https://aws.amazon.com/builders-library/using-load-shedding-to-avoid-overload/):** deliberately reject excess traffic to keep partial availability — it allows the service to maintain predictable, consistent performance for the accepted requests. Prefer **fast-fail (spillover)** over surge-queueing, because a request that sat in a queue may already be past its deadline (a "brownout").
  - **[Avoiding insurmountable queue backlogs](https://aws.amazon.com/builders-library/avoiding-insurmountable-queue-backlogs/):** use backpressure, delay/surge queues for stale work, and prioritize fresh messages so a backlog can't become permanent.
  - **[Put the smaller service in control](https://aws.amazon.com/builders-library/avoiding-overload-in-distributed-systems-by-putting-the-smaller-service-in-control/)** and enforce **[fairness in multi-tenant systems](https://aws.amazon.com/builders-library/fairness-in-multi-tenant-systems/)** so one tenant can't starve the rest.
- **Cost:** work completes *eventually*, not inline. You now need **idempotency** (at-least-once delivery means retries), dead-letter queues, and monitoring of queue depth as a first-class SLO.

## Rung 6 → 7: Sharding / partitioning

- **Scale:** data or write volume beyond what one primary can hold — tens of millions of rows and up, write-bound.
- **Symptom:** the single primary is maxed on writes or storage even after vertical scaling; replicas don't help because replicas don't absorb writes.
- **Move:** split the data. **Partition first** (split a big table into chunks *within one DB* — cheaper, no app changes), then **shard** (spread data across *many* DB instances) when one instance is the ceiling. The critical decision is the **shard key** — pick one that co-locates the data a query needs so you avoid cross-shard joins. DDIA's framing: **replication** = same data on many nodes; **partitioning/sharding** = different data on different nodes (Ch. 5–6). Real playbooks: [Postgres scaling ladder](https://www.velodb.io/glossary/ways-to-scale-postgresql), [Prisma data guide](https://www.prisma.io/dataguide/types/relational/infrastructure-architecture).
- **Cost:** the big one. Cross-shard queries and joins become application-level fan-out; distributed transactions are hard; and **rebalancing** shards as they grow is an ongoing operational project. Sharding trades resilience too — a naive shard failure takes down everyone whose data lives there (see Shopify below).

## Rung 7 → 8: Service decomposition (strangler-fig, not big-bang)

- **Scale:** a large enough org and codebase that the monolith is the bottleneck — organizationally, not just technically.
- **Symptom:** deploys are risky and coordinated across teams; teams block each other in one codebase; and subsystems have wildly different scaling and reliability profiles (a CPU-bound video encoder shouldn't share a deploy with the login page).
- **Move:** extract services incrementally with the **[Strangler Fig pattern](https://martinfowler.com/bliki/StranglerFigApplication.html)** (Martin Fowler): put a proxy/gateway in front, migrate one capability at a time behind it, and let the new services gradually draw behavior out of the host legacy application until the monolith is strangled — never a big-bang rewrite. Find seams, route migrated calls to the new service and everything else to the monolith, ship value incrementally, and keep the system running the whole time. Sources: [Fowler bliki](https://martinfowler.com/bliki/StranglerFigApplication.html), [Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/patterns/strangler-fig), [AWS Prescriptive Guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/strangler-fig.html).
- **Cost:** the full **distributed-systems tax** — network partitions and retries between services, API versioning, distributed tracing/observability, and hard questions about who owns which data. Microservices incur significant complexity and are only worth it for genuinely complex systems ([Fowler: Microservices](https://martinfowler.com/articles/microservices.html)).

## Rung 8 → 9: Multi-region / geo / active-active

- **Scale:** a global user base plus availability, disaster-recovery, or data-residency requirements a single region can't meet.
- **Symptom:** one region imposes a latency floor for distant users, is a single blast radius for a regional outage, and can't satisfy "data stays in the EU" rules.
- **Move:** go **multi-region.** Start **active-passive** (one region live, one warm for failover) and graduate to **active-active** (all regions serve traffic, geo-routed to the nearest). This demands cross-region data replication and a deliberate consistency posture. AWS's framing: by definition a multi-Region architecture includes network partitions between Regions, so you have to choose between availability and consistency ([AWS multi-region fundamentals](https://docs.aws.amazon.com/prescriptive-guidance/latest/aws-multi-region-fundamentals/fundamental-2.html)).
- **Cost:** **CAP made physical.** Optimizing for availability across regions means embracing **asynchronous replication and eventual consistency**, and solving **concurrent-write conflicts** (last-write-wins loses data; CRDTs merge automatically; app-level resolution asks the user). Plus the highest operational and dollar cost on the ladder — multiple live environments to keep in sync.

---

## The consistency tax: CAP and PACELC

Every rung from read-replicas up spends **consistency** to buy **scale or availability**. Two theorems name the trade:

- **[CAP](https://en.wikipedia.org/wiki/CAP_theorem):** during a **network partition (P)**, a distributed store must choose **Consistency** or **Availability** — you cannot have both. It says nothing about normal operation.
- **[PACELC](https://blog.bytebytego.com/p/cap-pacelc-acid-base-essential-concepts):** the more useful extension. **If Partition, trade Availability vs Consistency; Else (normal operation), trade Latency vs Consistency.** Distributed systems are *always* making a trade — even with no partition, stronger consistency costs latency. Choose your database and replication mode with PACELC in mind: a read-replica setup is "PA/EL" (favor availability and low latency, accept staleness); a synchronously-replicated ledger is "PC/EC" (pay latency for correctness).

Use this to reason about which rung is safe: caching, read replicas, sharding, queues, and multi-region are all deliberate consistency relaxations. Name the anomaly you're accepting (stale read, read-your-writes miss, lost update) *before* you ship the rung.

---

## Don't scale prematurely (YAGNI)

**The most common scaling mistake is climbing rungs you don't need yet.** Complexity added ahead of demand is pure cost — you pay the operational tax and get none of the throughput benefit, because you have no load to justify it.

- **A monolith is the right default, and stays right for a long time.** Martin Fowler's [**MonolithFirst**](https://martinfowler.com/bliki/MonolithFirst.html): *"Almost all the successful microservice stories have started with a monolith that got too big and was broken up. Almost all the cases where a system was built as a microservice system from scratch … ended up in serious trouble."* The reasoning is explicit **YAGNI** — you don't yet know the boundaries, and microservices slow cadence and bring unnecessary complexity on a simple app. (For balance, Fowler hosts the counter-argument too: [Don't start with a monolith](https://martinfowler.com/articles/dont-start-monolith.html) — the nuance is *build a well-modularized monolith so it's splittable later*, not "monolith forever.")
- **You will not break a SQL database with your first 10M users** (AWS's own words). Reach for NoSQL/sharding on evidence — >5 TB in year one, or a proven write-volume wall — not on reflex.
- **Proof that the ladder has a lot of runway before "web-scale" theater:** **[Stack Overflow](https://www.datacenterdynamics.com/en/news/stack-overflow-still-on-prem-runs-qa-platform-off-just-nine-servers/)** serves ~1.3 billion monthly pageviews from a **.NET monolith on nine on-prem web servers**, with SQL Server + a read-only replica, HAProxy, Redis, and Elasticsearch — no Kubernetes, no microservices, because it wasn't experiencing the problems those tools were designed to solve ([InfoQ: obsessing over performance](https://www.infoq.com/news/2015/06/scaling-stack-overflow/)). Careful performance work on a simple architecture beat a service fleet.

**The discipline:** stay on the lowest rung that meets your SLOs. Climb only when a *measured* symptom (not a hypothetical) forces it. The one thing worth doing early and for free is **stateless-first design (Rule 2)** — it's the cheap insurance that keeps every future rung a config change instead of a rewrite.

---

## Real systems climbing the ladder

| System | Rungs climbed | The lesson | Source |
|---|---|---|---|
| **Instagram** | Managed DB → cache-aside (Redis) → LB + horizontal Django on EC2 → connection pooling (PgBouncer) → sharding (thousands of logical shards on few physical DBs) → CDN (S3 + CloudFront) | Scaled to **14M users with 3 engineers** by climbing in order and keeping every choice simple and proven | [Engineer's Codex](https://read.engineerscodex.com/p/how-instagram-scaled-to-14-million) |
| **Notion** | Postgres monolith (5 yrs, 4 orders of magnitude) → **sharded to 32 physical DBs × 15 logical = 480 shards** keyed by `workspace_id` → data lake (S3 + Spark + Hudi) for update-heavy load | Sharded only after the monolith surpassed its abilities at ~20B blocks (now 200B+); chose 480 shards because it divides evenly for rebalancing | [Notion: sharding Postgres](https://www.notion.com/blog/sharding-postgres-at-notion), [Notion: data lake](https://www.notion.com/blog/building-and-scaling-notions-data-lake) |
| **Shopify** | Monolith → sharded MySQL (2015) → **"pods"** (fully isolated shard + Redis + Memcached, keyed by `shop_id`) → paired data centers per pod for DR | Sharding *lost* resilience (one shard down = platform-wide feature outage); **pods restored it** — an outage now hits one pod, not all of Shopify | [Shopify: pods architecture](https://shopify.engineering/a-pods-architecture-to-allow-shopify-to-scale), [Shard balancing](https://shopify.engineering/mysql-database-shard-balancing-terabyte-scale) |
| **Stack Overflow** | Vertical scaling + a read replica + Redis + HAProxy — **stayed a 9-server monolith on purpose** | The counter-example: relentless performance tuning kept them off the upper rungs entirely at 1.3B pageviews/mo | [DCD](https://www.datacenterdynamics.com/en/news/stack-overflow-still-on-prem-runs-qa-platform-off-just-nine-servers/) |

---

## Apply it — symptom → rung

Match the symptom you can *measure* to the next move. Do not skip rungs; do not climb without a symptom.

| If you observe… | Climb to… | Do this |
|---|---|---|
| App and DB fighting for CPU/RAM on one box | **Rung 0→1** | Move the DB to its own managed host |
| One tier CPU/RAM-bound, still one node | **Rung 2** | Resize the instance (vertical) — cheapest fix first |
| Same rows read repeatedly; DB CPU on reads | **Rung 1** | Add a cache-aside layer (Redis/Memcached) |
| App node is a SPOF; deploys cause downtime; CPU maxed | **Rung 3** | LB + ≥2 stateless nodes across AZs + autoscaling |
| DB primary saturated and it's ~90% `SELECT`s | **Rung 4** | Connection pooler first, then async read replicas |
| "Too many connections" errors before CPU is maxed | **Rung 4 (pool)** | Add PgBouncer/ProxySQL — before replicas |
| Static assets/media dominate bandwidth; far users slow | **Rung 5** | Put a CDN in front; version assets for cache-busting |
| Slow tasks inflate p99; spikes overwhelm the app | **Rung 6** | Queue + worker pool (load leveling); make handlers idempotent |
| Service still melting under a surge even with a queue | **Rung 6 (shed)** | Load shedding / fast-fail spillover; prioritize fresh work |
| One DB primary can't hold the writes or the data volume | **Rung 7** | Partition within one DB, then shard by a well-chosen key |
| Cross-team deploys are risky; tiers scale differently | **Rung 8** | Strangler-fig one capability out at a time behind a proxy |
| Global latency floor + single-region outage/residency risk | **Rung 9** | Multi-region (passive→active), pick your CAP/PACELC posture |
| You're doing any of the above *without a measured symptom* | **Stop** | YAGNI — stay on the lowest rung that meets your SLOs |

**The meta-rule:** measure the symptom, make the one move that relieves it, name the consistency you're giving up, then stop. Repeat only when the next symptom actually appears.

---

## References

**Canonical scaling maps**
- [AWS — Scaling up to your first 10 million users (PDF)](https://pages.awscloud.com/rs/112-TZM-766/images/DCD-T5-Scaling_up_to_your_first_10_million_users.pdf) · blog series: [>10K](https://aws.amazon.com/blogs/startups/scaling-on-aws-part-2-10k-users/) · [>500K](https://aws.amazon.com/blogs/startups/scaling-on-aws-part-3-500k-users/) · [>1M](https://aws.amazon.com/blogs/startups/scaling-on-aws-part-4-one-million-users/)
- [High Scalability — Beginner's guide to scaling to 11M users on AWS](https://highscalability.com/a-beginners-guide-to-scaling-to-11-million-users-on-amazons/)
- [binhnguyennus/awesome-scalability](https://github.com/binhnguyennus/awesome-scalability) ([site](https://binhnguyennus.github.io/awesome-scalability/))
- [Kleppmann — *Designing Data-Intensive Applications* (DDIA)](https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/) · [Ch. 5 Replication](https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/ch05.html)

**Scaling model & stateless design**
- [IBM — Scale-up vs scale-out](https://www.ibm.com/think/topics/scale-up-vs-scale-out) · [Cockroach Labs — Vertical vs horizontal](https://www.cockroachlabs.com/blog/vertical-scaling-vs-horizontal-scaling/) · [DataCamp](https://www.datacamp.com/blog/horizontal-vs-vertical-scaling)
- [12factor.net — Processes](https://12factor.net/processes) · [Concurrency](https://12factor.net/concurrency) · [Red Hat — illustrated 12-factor](https://www.redhat.com/en/blog/12-factor-app)

**Caching**
- [CodeAhoy — Caching strategies and how to choose](https://codeahoy.com/2017/08/11/caching-strategies-and-how-to-choose-the-right-one/) · [NCache — read/write-through & write-behind](https://www.alachisoft.com/resources/articles/readthru-writethru-writebehind.html) · [Redis — caching strategies](https://redis.io/blog/why-your-caching-strategies-might-be-holding-you-back-and-what-to-consider-next/)
- CDN/edge: [Cloudflare — what is a CDN](https://www.cloudflare.com/learning/cdn/what-is-a-cdn/) · [Cloudflare — edge server](https://www.cloudflare.com/learning/cdn/glossary/edge-server/) · [AWS — what is a CDN](https://aws.amazon.com/what-is/cdn/) · [Akamai](https://www.akamai.com/glossary/what-is-a-cdn)

**Database scaling**
- [VeloDB — 7 ways to scale PostgreSQL](https://www.velodb.io/glossary/ways-to-scale-postgresql) · [Prisma — DB infrastructure architecture](https://www.prisma.io/dataguide/types/relational/infrastructure-architecture)

**Consistency theory**
- [CAP theorem (Wikipedia)](https://en.wikipedia.org/wiki/CAP_theorem) · [ByteByteGo — CAP, PACELC, ACID, BASE](https://blog.bytebytego.com/p/cap-pacelc-acid-base-essential-concepts)

**Async, queues, backpressure, load shedding**
- [Azure — Queue-Based Load Leveling](https://learn.microsoft.com/en-us/azure/architecture/patterns/queue-based-load-leveling) · [Azure — Competing Consumers](https://learn.microsoft.com/en-us/azure/architecture/patterns/competing-consumers)
- [AWS Builders' Library — Using load shedding to avoid overload](https://aws.amazon.com/builders-library/using-load-shedding-to-avoid-overload/) · [Avoiding insurmountable queue backlogs](https://aws.amazon.com/builders-library/avoiding-insurmountable-queue-backlogs/) · [Putting the smaller service in control](https://aws.amazon.com/builders-library/avoiding-overload-in-distributed-systems-by-putting-the-smaller-service-in-control/) · [Fairness in multi-tenant systems](https://aws.amazon.com/builders-library/fairness-in-multi-tenant-systems/)

**Decomposition & premature scaling**
- [Fowler — Strangler Fig Application](https://martinfowler.com/bliki/StranglerFigApplication.html) · [Azure — Strangler Fig](https://learn.microsoft.com/en-us/azure/architecture/patterns/strangler-fig) · [AWS Prescriptive Guidance — Strangler Fig](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/strangler-fig.html)
- [Fowler — MonolithFirst](https://martinfowler.com/bliki/MonolithFirst.html) · [Fowler — Don't start with a monolith](https://martinfowler.com/articles/dont-start-monolith.html) · [Fowler — Microservices](https://martinfowler.com/articles/microservices.html)

**Multi-region**
- [AWS — Multi-Region fundamentals: understanding the data](https://docs.aws.amazon.com/prescriptive-guidance/latest/aws-multi-region-fundamentals/fundamental-2.html)

**Real-world case studies**
- [Instagram — 14M users, 3 engineers](https://read.engineerscodex.com/p/how-instagram-scaled-to-14-million)
- [Notion — Sharding Postgres](https://www.notion.com/blog/sharding-postgres-at-notion) · [Notion — Building & scaling the data lake](https://www.notion.com/blog/building-and-scaling-notions-data-lake)
- [Shopify — A pods architecture to scale](https://shopify.engineering/a-pods-architecture-to-allow-shopify-to-scale) · [Shopify — Shard balancing at terabyte scale](https://shopify.engineering/mysql-database-shard-balancing-terabyte-scale)
- [Stack Overflow — nine on-prem servers](https://www.datacenterdynamics.com/en/news/stack-overflow-still-on-prem-runs-qa-platform-off-just-nine-servers/) · [InfoQ — obsessing over performance](https://www.infoq.com/news/2015/06/scaling-stack-overflow/)
