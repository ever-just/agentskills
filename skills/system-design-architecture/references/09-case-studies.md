# Real-System Case Studies

A sourced library of how real, live systems at scale are actually designed — read these to reason from precedent instead of first principles. Each entry gives approximate scale, the load-bearing architectural decisions, the central tradeoff, and primary-source links (engineering blogs, conference talks, papers). Prefer the primary source over any summary; where a specific post URL couldn't be verified, the company's engineering-blog root is linked instead.

---

## Feeds & social graph

### Twitter / X — timeline fanout
- **Scale:** hundreds of millions of users; home timelines served from Redis holding ~800 tweet IDs per user, replicated 3× across data centers; tweets persisted in Manhattan (custom KV store) with media in Blobstore.
- **Key decisions:** **fanout-on-write** — when you tweet, the fanout service looks up your followers and pushes the tweet ID into each follower's Redis timeline, so reads are O(1). Celebrity accounts with millions of followers are the exception: their tweets are **fanned out on read** (merged in at read time) to avoid write amplification — a **hybrid push/pull** model.
- **Tradeoff:** optimizes reads at the cost of expensive writes (a write is O(followers)); wastes work fanning out to inactive users; the hybrid path exists purely to cap the tail cost of high-follower accounts.
- **Sources:** [The Infrastructure Behind Twitter: Scale](https://blog.twitter.com/engineering/en_us/topics/infrastructure/2017/the-infrastructure-behind-twitter-scale) · [Twitter Engineering blog](https://blog.twitter.com/engineering)

### Instagram — Django + sharded Postgres
- **Scale:** grew to 14M users on ~3 engineers; later 500M+ on Postgres; sharded when ingest hit tens of photos/likes per second.
- **Key decisions:** **many logical shards mapped to few physical databases** — each logical shard is a Postgres *schema*, so shards can be moved between machines without re-bucketing data. Custom **64-bit time-sortable IDs** generated *in the database* (41 bits ms timestamp + shard/user ID + 10-bit per-shard sequence) so IDs sort by time and encode their own shard. PgBouncer for connection pooling.
- **Tradeoff:** logical-shard indirection buys painless capacity growth but bakes the shard key into IDs; cross-shard queries are avoided by design rather than solved.
- **Sources:** [Sharding & IDs at Instagram](https://instagram-engineering.com/sharding-ids-at-instagram-1cf5a71e5a5c) · [Handling Growth with Postgres: 5 Tips](https://instagram-engineering.com/handling-growth-with-postgres-5-tips-from-instagram-d5d7e7ffdfcb)

### Pinterest — sharding a MySQL fleet
- **Scale:** billions of pins/boards; sharding launched early 2012 and still the backbone; after NoSQL experiments "broke catastrophically," they chose boring, sharded MySQL.
- **Key decisions:** data mapped by primary key to a shard; **shard config lives in ZooKeeper**; relationships stored in mapping tables keyed `(from, to, sequence)` co-located on the "from" ID's shard. **No cross-shard joins, no auto-increment** — a Unix-timestamp sequence ID gives global-ish ordering since IDs can't be compared across shards.
- **Tradeoff:** deliberately gives up relational features (joins, foreign keys, distributed transactions) for operational predictability; adding capacity means splitting shards, not re-sharding rows.
- **Sources:** [Sharding Pinterest: How we scaled our MySQL fleet](https://medium.com/pinterest-engineering/sharding-pinterest-how-we-scaled-our-mysql-fleet-3f341e96ca6f)

### Meta / Facebook — TAO (social graph store)
- **Scale:** 1B+ MAU (2013); ~1 billion reads and millions of writes per second; a read-optimized cache over sharded MySQL.
- **Key decisions:** an **objects-and-associations** graph model (nodes + typed edges) exposed through a purpose-built read-through cache in front of MySQL. **Master/slave geo-replication**, eventual consistency, read-after-write in most cases. Optimizes for the read-heavy, fan-out-heavy access pattern of the social graph.
- **Tradeoff:** accepts a weak (eventually consistent) model to hit throughput, latency, and fault-tolerance targets — the graph abstraction hides sharded MySQL underneath.
- **Sources:** [TAO: Facebook's Distributed Data Store for the Social Graph (USENIX ATC '13, PDF)](https://www.usenix.org/system/files/conference/atc13/atc13-bronson.pdf)

### LinkedIn — Kafka & the log abstraction
- **Scale:** origin of Apache Kafka (2010, Kreps/Narkhede/Rao); 60B+ message writes/day at LinkedIn; original use case was activity tracking feeding both Hadoop batch and real-time services.
- **Key decisions:** treat the **append-only, ordered, replayable log** as the unifying primitive for data integration and stream processing — one durable, high-throughput pipe replacing point-to-point integrations between systems. Kafka is that log, made distributed and partitioned.
- **Tradeoff:** the log decouples producers from consumers and enables replay, but consumers must track offsets and tolerate eventual, ordered-per-partition (not globally ordered) delivery.
- **Sources:** [The Log: What every software engineer should know about real-time data's unifying abstraction](https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying) · [LinkedIn Engineering blog](https://engineering.linkedin.com/blog)

---

## Messaging & real-time

### WhatsApp — Erlang, tiny team, huge scale
- **Scale:** ~500M users, 11,000 cores, ~70M messages/second, and later 2B users — famously run by ~50 engineers, a dozen on core infra. Built on FreeBSD + a customized ejabberd, ~2M connections per server.
- **Key decisions:** **one lightweight Erlang/BEAM process per connection** (no connection pooling/multiplexing) so a slow client can't block others; Mnesia for in-memory distributed state; a "just enough engineering" culture that resists premature complexity.
- **Tradeoff:** bets everything on the Erlang concurrency model and on keeping the system small and legible instead of horizontally elaborate — extraordinary leverage per engineer, but a niche runtime and deep in-house tuning.
- **Sources:** [Rick Reed, "That's 'Billion' with a 'B'" (Erlang Factory 2012 talk)](http://www.erlang-factory.com/conference/SFBay2012/speakers/RickReed) · [How WhatsApp Grew to ~500M Users, 11,000 Cores (High Scalability)](https://highscalability.com/how-whatsapp-grew-to-nearly-500-million-users-11000-cores-an/)

### Discord — Elixir + the Cassandra→ScyllaDB migration
- **Scale:** millions of concurrent users; **trillions of messages** stored; Cassandra grew to 177 nodes before the move.
- **Key decisions:** real-time backbone in **Elixir/BEAM** — a GenServer session process per user connection, guild processes coordinating fan-out; a `FastGlobal` port and a `Semaphore` library added to survive contention (millions of sessions hitting a handful of guild-registry processes). For storage, migrated off Cassandra (GC pauses, tail-latency, on-call pain) to **ScyllaDB** (C++, shard-per-core, GC-free), fronted by Rust "data services" over gRPC; a Rust migrator moved trillions of rows in ~9 days.
- **Tradeoff:** Cassandra→ScyllaDB kept the data model but traded a mature JVM ecosystem for a C++ engine to escape garbage-collection tail latency and reclaim workload isolation.
- **Sources:** [How Discord Stores Trillions of Messages](https://discord.com/blog/how-discord-stores-trillions-of-messages) · [How Discord Scaled Elixir to 5,000,000 Concurrent Users](https://discord.com/blog/how-discord-scaled-elixir-to-5-000-000-concurrent-users)

### Slack — real-time messaging & Flannel edge cache
- **Scale:** millions of concurrent WebSocket clients; **stateful Channel Servers** map channels via consistent hashing (~16M channels/host at peak); messages delivered worldwide in ~500ms.
- **Key decisions:** persistent WebSocket per client to a gateway; **Flannel**, a geo-distributed **application-level edge cache** of team/workspace metadata that listens to the real-time event stream and serves session data locally — turning session startup for huge enterprise workspaces from a compute-heavy assembly into a cache read.
- **Tradeoff:** Flannel adds a stateful, event-fed caching tier to fix the "boot a giant workspace" bottleneck; Slack's stance is that *bounded, predictable complexity beats simplicity that collapses under load* (they also handle client-retry message duplication explicitly).
- **Sources:** [Real-time Messaging (Slack Engineering)](https://slack.engineering/real-time-messaging/) · [Flannel: An Application-Level Edge Cache to Make Slack Scale](https://slack.engineering/flannel-an-application-level-edge-cache-to-make-slack-scale-b8a6400e2f6b)

---

## Ride-hailing & marketplaces

### Uber — Schemaless, DOMA, Michelangelo
- **Scale:** ~2,200 critical microservices at peak; core trip data outgrew a single Postgres in 2014.
- **Key decisions:** (1) **Schemaless** — an append-only, sharded datastore built *on top of MySQL* storing schema-less JSON cells with secondary indexes and triggers, when trip growth would have exhausted Postgres. (2) **DOMA (Domain-Oriented Microservice Architecture)** — group thousands of microservices into a handful of **domains** behind gateways, organized in layers (infra / business / product / presentation), to tame microservice sprawl without returning to a monolith. (3) **Michelangelo** — end-to-end ML platform (~5K+ models in prod, ~10M real-time predictions/sec at peak).
- **Tradeoff:** DOMA explicitly trades some microservice autonomy for coarser domain boundaries and clearer dependencies — a mid-course correction after "microservices for everything" slowed teams down. Schemaless trades relational richness for horizontal scale on proven MySQL.
- **Sources:** [Designing Schemaless, Uber's Scalable Datastore Using MySQL](https://www.uber.com/us/en/blog/schemaless-part-one-mysql-datastore/) · [Introducing Domain-Oriented Microservice Architecture](https://www.uber.com/us/en/blog/microservice-architecture/) · [Meet Michelangelo: Uber's ML Platform](https://www.uber.com/us/en/blog/michelangelo-machine-learning-platform/)

### DoorDash — monolith → microservices
- **Scale:** hypergrowth in 2019 exposed a Django/Python monolith: long ramp-up, slow tests, brittle deploys.
- **Key decisions:** decompose into microservices on **Kotlin + gRPC**; gain independent scaling/deploys and a smaller blast radius per deploy. Explicitly names the failure modes to guard against: **distributed monolith** (bad dependency patterns), tech-stack proliferation, and inconsistent behavior from lost shared code.
- **Tradeoff:** microservices bought organizational scaling and deploy independence at the cost of new distributed-systems complexity — mitigated with guardrails, a standard stack, and service-mesh discipline rather than unbounded team freedom.
- **Sources:** [How DoorDash Transitioned from a Monolith to Microservices](https://careersatdoordash.com/blog/how-doordash-transitioned-from-a-monolith-to-microservices/) · [Reducing the Migration's Pain Points](https://careersatdoordash.com/blog/reducing-the-migrations-pain-points/)

### Airbnb — the "Great Migration" to SOA (and back toward macroservices)
- **Scale:** ~500 engineers, ~2,000 services; migrated off a Ruby-on-Rails "monorail" starting ~2017–2018; deploys went from hours to minutes.
- **Key decisions:** company-wide monolith→**service-oriented architecture** with a strict IDL/schema framework (250+ services, 1000+ endpoints) and a **data-oriented service mesh**. Later evolution: consolidate toward **macroservices** (aggregations of microservices) after discovering microservice sprawl had its own tax — mirroring Uber's DOMA correction.
- **Tradeoff:** SOA restored deploy speed and team ownership but pushed complexity into service-to-service data access and consistency; the macroservice swing-back is an admission that finest-grained isn't always right.
- **Sources:** [The Great Migration: Monolith to Service-Oriented (Jessica Tai, InfoQ)](https://www.infoq.com/presentations/airbnb-soa-migration/) · [Airbnb Engineering blog](https://medium.com/airbnb-engineering)

---

## Payments

### Stripe — idempotency, versioning, rate limiting, online migrations
- **Scale:** payments API used by millions of businesses; correctness under network failure is the product.
- **Key decisions:** (1) **Idempotency keys** — clients send a unique `Idempotency-Key` on mutating POSTs; the server records the key and returns the stored response on retry, giving effectively exactly-once semantics over an unreliable network. (2) **API versioning** — every account pinned to a version, with per-version transformation layers, so the API can evolve without breaking integrations for years. (3) **Rate limiters** — four limiter types in production, prioritizing critical requests. (4) **Online migrations at scale** — a disciplined four-phase pattern (dual-write, backfill, dual-read/verify, then cut over) for changing hundreds of millions of live objects with no downtime.
- **Tradeoff:** idempotency and dual-write migrations add real bookkeeping (key storage/TTL, temporary double-writes, verification) — deliberately accepted because in payments, silent duplicate or lost mutations are unacceptable.
- **Sources:** [Designing robust and predictable APIs with idempotency](https://stripe.com/blog/idempotency) · [Online migrations at scale](https://stripe.com/blog/online-migrations) · [Scaling your API with rate limiters](https://stripe.com/blog/rate-limiters) · [APIs as infrastructure: future-proofing Stripe with versioning](https://stripe.com/blog/api-versioning)

---

## Streaming & video

### Netflix — microservices, resilience engineering, chaos
- **Scale:** ~200M+ subscribers; thousands of independently deployable microservices on AWS plus **Open Connect**, Netflix's own CDN, for video delivery.
- **Key decisions:** split into a **control plane (AWS)** for everything pre-play and a **data plane (Open Connect)** for streaming; wrap every cross-service dependency in **Hystrix** (circuit breaker + bulkhead + fallback) to stop cascading failure; discover with Eureka, route at the edge with Zuul; **Chaos Monkey / chaos engineering** to prove resilience by killing production instances continuously (which is why Netflix rode out the April 2011 AWS outage). Video pipeline rebuilt from monolithic encoding into chunked, microservice-based processing.
- **Tradeoff:** each tool was a *byproduct* of pain from the monolith→microservices migration, not a prerequisite; the architecture buys extreme resilience and independent deploys at the cost of deep operational tooling and distributed-systems complexity.
- **Sources:** [Fault Tolerance in a High Volume, Distributed System](https://netflixtechblog.com/fault-tolerance-in-a-high-volume-distributed-system-91ab4faae74a) · [Introducing Hystrix for Resilience Engineering](https://netflixtechblog.com/introducing-hystrix-for-resilience-engineering-13531c1ab362) · [Rebuilding the Netflix Video Processing Pipeline with Microservices](https://netflixtechblog.com/rebuilding-netflix-video-processing-pipeline-with-microservices-4e5e6310e359) · [Netflix/Hystrix (GitHub)](https://github.com/Netflix/Hystrix)

---

## Collaboration & productivity

### Figma — multiplayer, LiveGraph, and sharding Postgres
- **Scale:** grew ~100× on a single Postgres before sharding; multiplayer editing at millisecond latency.
- **Key decisions:** (1) **LiveGraph** — a real-time data layer over Postgres where clients subscribe to GraphQL queries and get live updates by **reading the Postgres replication stream**. (2) Scale storage first **vertically then horizontally**: split tables to their own databases, then build **DBProxy** — a proxy that parses SQL, extracts logical shard IDs, plans against physical shards, and rewrites/routes queries — to horizontally shard without an app rewrite. Workload chosen so most queries carry a shard key; missing-key queries fall back to expensive **scatter-gather**.
- **Tradeoff:** they deliberately *didn't* adopt a new distributed database — DBProxy keeps Postgres semantics and tooling while paying with a bespoke query engine and hard-to-support cross-shard joins/aggregations.
- **Sources:** [How Figma's Databases Team Lived to Tell the Scale](https://www.figma.com/blog/how-figmas-databases-team-lived-to-tell-the-scale/) · [The growing pains of database architecture](https://www.figma.com/blog/how-figma-scaled-to-multiple-databases/) · [LiveGraph: real-time data fetching at Figma](https://www.figma.com/blog/livegraph-real-time-data-fetching-at-figma/)

### Notion — the block model & sharding Postgres
- **Scale:** by 2020 a single Postgres served five years and four orders of magnitude of growth before sharding; later hundreds of billions of blocks, feeding a data lake.
- **Key decisions:** everything (text, pages, images) is a recursive **block** entity, each belonging to exactly one workspace → **shard by workspace ID**, so a user's queries stay within one shard and cross-shard joins are rare. Settled on **480 logical shards over 32 physical databases** (480 is highly divisible, so re-balancing stays even). Migrated with an **audit-log + catch-up** strategy (chosen over logical replication, which couldn't keep up with block-table write volume), later re-sharding again with zero downtime, then built a data lake for the analytical workload.
- **Tradeoff:** workspace partitioning gives clean locality but makes the rare cross-workspace query awkward; the audit-log migration trades operational bookkeeping for control over an otherwise-unmanageable write stream.
- **Sources:** [Herding elephants: lessons learned from sharding Postgres at Notion](https://www.notion.com/blog/sharding-postgres-at-notion) · [The Great Re-shard: adding Postgres capacity with zero downtime](https://www.notion.com/blog/the-great-re-shard) · [Building and scaling Notion's data lake](https://www.notion.com/blog/building-and-scaling-notions-data-lake)

### Canva — scaling media and event ingestion
- **Scale:** 100M+ MAU; 25B+ stored user media, +50M uploads/day; 25B analytics events/day; 5+ PB in Snowflake.
- **Key decisions:** most services were thin layers over **MySQL on RDS**, scaled vertically then via read replicas; when media approached ~1B objects they **migrated incrementally to DynamoDB** rather than betting on one unproven store. Event pipeline separates **ingestion from delivery** with a router, strict schema governance, batch compression, and fallback queues; analytics moved from snapshot replication to **CDC** into a service-aligned data platform.
- **Tradeoff:** a strong bias for **incremental, reversible** migrations over big-bang re-platforming — slower, but avoids staking the business on a single technology choice.
- **Sources:** [From Zero to 50 Million Uploads per Day: Scaling Media at Canva](https://www.canva.dev/blog/engineering/from-zero-to-50-million-uploads-per-day-scaling-media-at-canva/) · [Scaling to Count Billions](https://www.canva.dev/blog/engineering/scaling-to-count-billions/)

---

## Commerce

### Shopify — the modular monolith & pods
- **Scale:** Rails monolith of ~2.8M LOC / 4,000+ components / hundreds of concurrent contributors; peak ~30 TB/minute during Black Friday/Cyber Monday; hundreds of millions of requests/minute at peak.
- **Key decisions:** keep the **"majestic monolith"** but enforce internal modularity — Rails Engines as components with tooling that polices API boundaries between domains. Scale runtime with **pods**: isolated, self-contained clusters (each with its own database) that shard *stores*, with a routing layer ("Sorting Hat") sending each request to the correct pod. Failures are contained to a pod.
- **Tradeoff:** rejects microservices for simpler operations and one deployable codebase, paying instead with constant discipline (fitness functions, boundary enforcement) to stop the monolith from becoming a big ball of mud, plus a sharding/routing layer to get horizontal scale.
- **Sources:** [Under Deconstruction: The State of Shopify's Monolith](https://shopify.engineering/shopify-monolith) · [Shopify Engineering blog](https://shopify.engineering/)

---

## Storage & infrastructure

### Dropbox — Magic Pocket (moving off S3)
- **Scale:** exabyte-scale blob storage; migrated ~500 PB (the majority of customer data) off Amazon S3 onto custom hardware, completing in 2016; millions of QPS.
- **Key decisions:** build a purpose-built, horizontally scalable **software-defined blob store** running primarily on **SMR (shingled) disks**; validate for six months by mirroring a third of all data alongside S3 as a torture test before cutover.
- **Tradeoff:** leaving the cloud trades elastic, someone-else's-problem storage for enormous capex, physical logistics, and the burden of building durability/repair yourself — worth it only at Dropbox's single-workload scale and margins.
- **Sources:** [Magic Pocket: Scaling to exabytes and beyond](https://dropbox.tech/infrastructure/magic-pocket-infrastructure) · [Inside the Magic Pocket](https://dropbox.tech/infrastructure/inside-the-magic-pocket)

### Amazon — Dynamo (foundational paper)
- **Scale:** the always-available store behind Amazon's shopping cart and other core services; the blueprint for Cassandra, Riak, DynamoDB, Cosmos DB.
- **Key decisions:** **consistent hashing** for partition+replication, **vector-clock object versioning** with client-side reconciliation, **quorum (N/R/W)** tunable consistency, gossip-based decentralized membership, hinted handoff and read-repair. Chooses **availability over consistency** (AP) — always accept writes, resolve conflicts later.
- **Tradeoff:** the canonical statement of eventual consistency: you get an always-writable, partition-tolerant store, but applications must handle divergent versions and conflict resolution.
- **Sources:** [Dynamo: Amazon's Highly Available Key-value Store (SOSP '07, PDF)](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf)

### Google — Spanner (foundational paper)
- **Scale:** globally distributed, synchronously replicated, multi-version database with distributed transactions across data centers.
- **Key decisions:** **TrueTime** — expose clock uncertainty as a bounded interval (kept under ~10ms with GPS + atomic clocks) and *wait out* that uncertainty to assign globally meaningful commit timestamps. This makes **externally consistent (linearizable) distributed transactions and lock-free snapshot reads** possible at global scale.
- **Tradeoff:** the counterpoint to Dynamo — Spanner keeps strong consistency globally, but pays with commit-wait latency tied to clock uncertainty and a dependency on specialized time infrastructure.
- **Sources:** [Spanner: Google's Globally-Distributed Database (OSDI '12, PDF)](https://research.google.com/archive/spanner-osdi2012.pdf)

---

## Edge & serverless

### Cloudflare — Workers on V8 isolates + anycast
- **Scale:** 300+ data centers in 100+ countries; millions of requests/second; edge network fronting a large share of the web.
- **Key decisions:** run customer code in **V8 isolates**, not containers/VMs — one process hosts thousands of isolates (~3 MB each) with **sub-millisecond cold starts**, so the runtime cost is paid once and amortized across all scripts. **Anycast** routes each request to the nearest PoP that runs the same code everywhere; billing is CPU-time only (I/O wait isn't billed).
- **Tradeoff:** isolates eliminate cold starts and slash per-tenant memory, but constrain you to a V8/WASM sandbox (no arbitrary native binaries, no full OS) and demand a hard multi-tenant security boundary in shared memory.
- **Sources:** [Cloud Computing without Containers](https://blog.cloudflare.com/cloud-computing-without-containers/) · [Eliminating cold starts with Cloudflare Workers](https://blog.cloudflare.com/eliminating-cold-starts-with-cloudflare-workers/)

---

## AI / LLM products

### Anthropic — multi-agent research system
- **Scale:** production "Research" feature; a lead agent (Claude Opus) decomposes a query and spawns parallel subagents (Claude Sonnet) that search concurrently; the multi-agent setup beat a strong single-agent baseline by >90% on their internal research eval.
- **Key decisions:** **orchestrator-worker** pattern — a lead agent plans and delegates; each subagent gets an explicit objective, output format, tool/source guidance, and task boundaries. Parallelism (multiple subagents, parallel tool calls) is the main latency and coverage lever. Heavy investment in **tool design, prompt/context engineering, evaluation, and production reliability** (stateful agents, error recovery, tracing) — the hard part is productionizing, not the demo.
- **Tradeoff:** multi-agent parallelism dramatically improves breadth-first research but burns far more tokens and adds coordination/consistency complexity; it's worth it only for tasks that genuinely parallelize.
- **Sources:** [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) · [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) · [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

### OpenAI / ChatGPT — scaling an LLM product
- **Scale:** hundreds of millions of users; kept a largely **single-writer PostgreSQL** cluster viable at enormous scale through read replicas, aggressive offloading, and operational discipline; Deep Research productionizes **RAG-style** multi-search-and-synthesize as a built-in tool.
- **Key decisions:** the interesting engineering is less "novel database" and more relentless operational scaling of conventional pieces — read-replica fan-out, connection management, avoiding new writer bottlenecks — plus GPU/inference capacity as the true constraint.
- **Tradeoff:** squeezing a single-writer Postgres to that scale is elite operationally but is, by the team's own framing, a patchwork held together by constant firefighting — a reminder that "boring database, pushed hard" is a real strategy with a real ceiling.
- **Sources:** [Scaling ChatGPT: Five Real-World Engineering Challenges (Pragmatic Engineer, interview-based)](https://newsletter.pragmaticengineer.com/p/scaling-chatgpt)

---

## More: architecture corrections (walking back from microservices / serverless)

### Segment — 140+ microservices back to a monolith ("Centrifuge")
- **Scale:** a per-destination integration platform; the fan-out layer had grown to **140+ microservices**, each with its own queue and repo, maintained by ~3 engineers who spent most of their time just keeping it alive.
- **Key decisions:** collapse the per-destination microservices into a **single monolithic service** ("Centrifuge") with one shared codebase and one queueing system. The forcing function was operational, not architectural: a shared-library change meant redeploying 140+ services, tests were unmanageable, and per-service queues fragmented visibility. Post-consolidation, one engineer deploys in minutes and shared-library improvements jumped (32 → 46 in a year).
- **Tradeoff:** gives up per-destination fault/version isolation (a noisy destination can now affect neighbors) in exchange for a legible codebase and sane operations — the explicit lesson is that microservices' autonomy isn't free, and below a certain team size the coordination tax dominates.
- **Sources:** [Goodbye Microservices: From 100s of problem children to 1 superstar (Twilio Segment)](https://www.twilio.com/en-us/blog/developers/best-practices/goodbye-microservices)

### Prime Video — serverless (Step Functions + S3) back to a monolith on ECS
- **Scale:** the Video Quality Analysis (VQA) audio/video-defect monitoring service; original serverless design hit AWS account limits well before target scale and cost too much per stream-second.
- **Key decisions:** the bottleneck was **orchestration overhead** — AWS Step Functions performed multiple state transitions per second of stream, and passing video frames between Lambda functions required **S3 as intermediate storage** (expensive Tier-1 calls + network transfer). They repacked the media converter and defect detector into **one process on ECS/EC2**, so frame data moves **in memory** instead of through S3. Result: **>90% lower infrastructure cost** and higher scaling ceiling.
- **Tradeoff:** the monolith loses independent per-component scaling and the "glue-free" serverless ops model, but eliminates the orchestration and data-transfer tax that dominated this specific high-throughput, tightly-coupled pipeline. Werner Vogels' framing — "building evolvable software systems is a strategy, not a religion" — is the takeaway: serverless-*first*, not serverless-*only*.
- **Sources:** [Prime Video Switched from Serverless to EC2 and ECS to Save Costs (InfoQ, summarizing the original Prime Video Tech post)](https://www.infoq.com/news/2023/05/prime-ec2-ecs-saves-costs/)

---

## More: fintech & cloud-native banking

### Monzo — a bank on 1,600+ microservices
- **Scale:** UK digital bank; **~1,600 Go microservices** on Kubernetes/AWS backed by **Cassandra**, serving millions of customers.
- **Key decisions:** everything is a small Go service in a Docker container sharing a **common core library** (marshalling, RPC, observability) so teams don't re-implement primitives; a bespoke deploy tool (**Shipper**) handles rolling K8s deploys + Cassandra migrations; because banking security demands it, they built **network isolation for 1,500 services** (default-deny service-to-service policy) rather than trusting a flat network. Chose Cassandra specifically for **horizontal scale by adding nodes** vs. migrating to bigger hardware.
- **Tradeoff:** thousands of services buy fine-grained team ownership and blast-radius control, but only survive because of heavy platform investment (shared libs, Shipper, service-graph tooling); their 2017 outage — a K8s/etcd/linkerd bug interaction — is the standing reminder that the platform itself becomes the risk.
- **Sources:** [We built network isolation for 1,500 services to make Monzo more secure](https://monzo.com/blog/we-built-network-isolation-for-1-500-services) · [Modern Banking in 1500 Microservices (Matt Heath & Suhail Patel, InfoQ)](https://www.infoq.com/presentations/monzo-microservices/)

### Nubank — immutability at scale (Clojure + Datomic + Kafka)
- **Scale:** largest independent digital bank in LatAm; **120M+ customers**, **~4,000 microservices**, **3,000+ Datomic databases**, **70B+ Kafka events/day**.
- **Key decisions:** build the whole stack to **minimize mutable state** — **Clojure** (functional), **Datomic** (an immutable, append-only database where the DB is a value you query as-of a point in time), and **Kafka** for async inter-service communication. Hexagonal architecture keeps business logic isolated from I/O. Immutability + time-travel queries make financial auditing and reasoning about consistency dramatically simpler.
- **Tradeoff:** a niche stack (Clojure/Datomic) with a smaller hiring pool and Datomic's single-writer-per-database write-scaling model, accepted because immutability's payoff — reproducibility, auditability, fewer state-corruption bugs — is worth more in banking than raw write throughput per DB (which they scale by running thousands of DBs).
- **Sources:** [Working with Clojure at Nubank](https://medium.com/building-nubank/working-with-clojure-at-nubank-ef165b77bf08) · [10 years of engineering at Nubank: lessons from scaling to 122M+ customers](https://building.nubank.com/engineering-lessons-from-scaling-million-customers/)

---

## More: developer & infrastructure platforms

### GitHub — Spokes (formerly DGit): three-replica Git storage
- **Scale:** 38M+ Git repositories and 36M+ gists; every repo kept on **three independently-chosen file servers**.
- **Key decisions:** replace network-attached-storage + failover pairs with **application-level replication** ("DGit," renamed Spokes): each repo lives on three servers chosen from a large pool; **writes stream synchronously to all three and commit only if ≥2 confirm** (quorum), while reads are served from any replica and load-balanced to the best one. Because reads vastly outnumber writes, effective read capacity roughly triples.
- **Tradeoff:** synchronous three-way writes add write latency and a quorum dependency, bought in exchange for no single point of failure, horizontal scale-out on commodity servers, and the ability to rebalance repos across the fleet — chosen over the simpler active/passive NAS pairs it replaced.
- **Sources:** [Introducing DGit](https://github.blog/engineering/architecture-optimization/introducing-dgit/) · [Building resilience in Spokes](https://github.blog/engineering/infrastructure/building-resilience-in-spokes/)

### Lyft — Envoy, the universal data plane behind the service mesh
- **Scale:** born ~2015 at Lyft (then a monolithic PHP app + MongoDB); Envoy reached **100% of Lyft traffic** as an edge proxy by late 2015 and **all** service-to-service, DB, and external traffic by mid-2016; now the CNCF-standard mesh proxy.
- **Key decisions:** put a **single, uniform L4/L7 proxy next to every process** (sidecar) so the network — service discovery, retries, circuit breaking, timeouts, zone-aware load balancing, and *consistent* stats/logging/tracing — is abstracted away from application code in any language. The insight: in a polyglot microservices world, **observability and resilience belong in a shared data plane**, not re-implemented per language.
- **Tradeoff:** a proxy hop next to every service adds latency and a new operational component (and the mesh control-plane complexity that followed), accepted because uniform, language-agnostic networking + telemetry is otherwise impossible to retrofit across dozens of stacks.
- **Sources:** [5 years of Envoy OSS (Matt Klein)](https://mattklein123.dev/2021/09/14/5-years-envoy-oss/) · [Lyft's Envoy: Experiences Operating a Large Service Mesh (SREcon17, USENIX)](https://www.usenix.org/conference/srecon17americas/program/presentation/klein)

### Uber — H3, a hexagonal hierarchical geospatial index
- **Scale:** the grid system underpinning marketplace pricing, dispatch, and supply/demand analysis across every Uber city; open-sourced and widely adopted.
- **Key decisions:** tile the earth into **hexagonal cells at 16 resolutions**, each encoded as a compact **64-bit id**. Hexagons are chosen deliberately over squares: **all six neighbors are equidistant** (squares have two different neighbor distances), which makes gradient/flow, clustering, and smoothing over a city far more uniform. Hierarchy lets you roll cells up/down resolution cheaply.
- **Tradeoff:** hexagons **cannot perfectly, cleanly subdivide** into smaller hexagons (unlike quadtrees/geohash squares), so H3's hierarchy is approximate at boundaries — accepted because uniform adjacency matters more than exact nesting for the movement-and-density math Uber runs.
- **Sources:** [H3: Uber's Hexagonal Hierarchical Spatial Index](https://www.uber.com/blog/h3/) · [uber/h3 (GitHub)](https://github.com/uber/h3)

---

## More: data & analytics infrastructure

### Datadog — Husky: exactly-once, multi-tenant event store on object storage
- **Scale:** third-generation event store ingesting **100+ trillion events**; queried in real time; built on **S3 + FoundationDB**.
- **Key decisions:** an **unbundled** column store that **separates ingestion, compaction, and query** so each scales independently, all sharing a FoundationDB metadata store and S3 for blobs. Deterministic sharding (an event's `(timestamp, id)` always routes to the same shard) enables **exactly-once ingestion** despite retries, and per-shard tenant locality keeps multi-tenant file/namespace overhead bounded. Cost accounting is by **bytes ingested per tenant**, a better predictor than event count.
- **Tradeoff:** building on cheap, infinite object storage instead of local disk trades raw latency for elastic, independently-scalable, cost-attributable ingestion at high-cardinality scale — with a compaction tier added specifically to fight the small-file problem that schemaless, high-cardinality data creates on S3.
- **Sources:** [Introducing Husky, Datadog's third-generation event store](https://www.datadoghq.com/blog/engineering/introducing-husky/) · [Husky: Exactly-once ingestion and multi-tenancy at scale](https://www.datadoghq.com/blog/engineering/husky-deep-dive/)

### Spotify — event delivery, moving up the stack (Kafka → Cloud Pub/Sub)
- **Scale:** the pipeline carrying every client/user event into analytics; **~700K events/sec** peak at migration time, load-tested to **2M msgs/sec**.
- **Key decisions:** retire a self-operated **Kafka 0.7 + Hadoop** event-delivery system whose operational burden (broker management, ordering, at-least-once plumbing) was consuming the team, and adopt **Google Cloud Pub/Sub** as the transport — deliberately **moving up the stack** to a managed service instead of running the log themselves. The migration took ~a year, ran both systems in parallel, and only then cut Kafka off (Feb 2017).
- **Tradeoff:** hands control of the core pipe to a managed service (vendor dependency, less low-level tuning) in exchange for shedding the operational load of running Kafka at scale — the mirror image of Dropbox's "leave the cloud" call, made for the same reason (play to your actual scale and margins) with the opposite conclusion.
- **Sources:** [Spotify's Event Delivery — The Road to the Cloud (Part II)](https://engineering.atspotify.com/2016/03/spotifys-event-delivery-the-road-to-the-cloud-part-ii) · [Why Spotify migrated its event delivery system from Kafka to Cloud Pub/Sub (Google Cloud)](https://cloud.google.com/blog/products/gcp/spotifys-journey-to-cloud-why-spotify-migrated-its-event-delivery-system-from-kafka-to-google-cloud-pubsub)

---

## More: consumer scale & real-time experiments

### Reddit — r/place: a shared million-pixel canvas under global write load
- **Scale:** a 1000×1000 collaborative canvas; **~16M pixels placed** by 1M+ users; peak millions of tile changes/hour; built by 3–4 engineers.
- **Key decisions:** store the whole board as a **bitmap of 4-bit color values (~500 KB)** in **Redis**, fetchable by a single key op in ~10ms — chosen over Cassandra because the data model was a natural fit. **Reads are absorbed by Fastly's CDN with a 1-second TTL** (`Cache-Control: max-age=1`), decoupling read scale from the datastore, while **writes fan out over a WebSocket cluster** for real-time updates and to Kafka for analysis. Per-user rate limiting (one pixel every 5 min) caps write volume.
- **Tradeoff:** the 1-second CDN cache accepts up-to-1s staleness for reads (patched by the websocket live stream) to make globally-distributed heavy read traffic survivable on a tiny datastore — a clean example of splitting a read path (cacheable, eventually consistent) from a write path (real-time, authoritative).
- **Sources:** [Reddit on building & scaling r/place (Fastly, from Daniel Ellis's Altitude talk)](https://www.fastly.com/blog/reddit-on-building-scaling-rplace)

### Etsy — continuous deployment & the birth of StatsD
- **Scale:** e-commerce marketplace deploying **50+ times/day** to a PHP monolith; the origin of **StatsD** and the "Code as Craft" ops culture.
- **Key decisions:** make deploys boring and frequent — a one-button web deployer (**Deployinator**) pushes to production in ~2 minutes, backed by a "test on trunk / keep trunk deployable" discipline. Underpinning it: **measure everything.** StatsD is a tiny UDP daemon that lets any engineer instrument any counter/timer in ~30 minutes so every deploy's effect is visible on a graph within seconds. The thesis: high deploy frequency is *safer*, not riskier, because each change is small and instantly observable.
- **Tradeoff:** UDP metrics are **fire-and-forget** (a dropped packet loses a data point) — deliberately chosen so instrumentation can never slow down or break the app, trading perfect metric fidelity for near-zero-cost, always-on measurement that makes continuous deployment trustworthy.
- **Sources:** [Measure Anything, Measure Everything (Code as Craft, 2011 — introduces StatsD)](https://codeascraft.com/2011/02/15/measure-anything-measure-everything/) · [How Etsy Ships Apps](https://www.etsy.com/codeascraft/how-etsy-ships-apps)

### TikTok / ByteDance — Monolith, a real-time recommender with collisionless embeddings
- **Scale:** the recommendation engine behind TikTok's For You feed; sparse feature space in the **billions**; online training that updates serving models in near-real-time.
- **Key decisions:** two ideas make it work. (1) A **collisionless embedding table** using cuckoo hashing — most recommender systems hash sparse IDs into a fixed-size table and tolerate collisions (two users/videos sharing a vector); Monolith refuses the collisions, adding **probabilistic filtering + expirable embeddings** to bound memory instead. (2) **Online training**: user interactions stream through **Kafka → Flink**, parameters update on the fly and sync to serving in near-real-time, so the model reflects behavior from minutes ago.
- **Tradeoff:** explicitly **trades system reliability for real-time learning** — the near-real-time parameter sync and streaming pipeline accept more failure surface and eventual-consistency between training and serving in exchange for freshness, which for engagement-driven recommendation is the dominant metric.
- **Sources:** [Monolith: Real Time Recommendation System With Collisionless Embedding Table (arXiv 2209.07663)](https://arxiv.org/abs/2209.07663) · [bytedance/monolith (GitHub)](https://github.com/bytedance/monolith)

---

## More: foundational databases & storage papers

### Google — the infrastructure canon (GFS, MapReduce, Bigtable, Borg)
- **Scale:** the papers that defined the "big data" and cluster-computing era and seeded Hadoop, HBase, and Kubernetes.
- **Key decisions:** **GFS** — a distributed file system built for *commodity hardware that fails constantly*, with a single logical master for metadata + huge 64MB chunks replicated 3×, optimized for large sequential reads and append-heavy writes. **MapReduce** — restrict distributed computation to two pure functions (map, reduce) so the framework can handle parallelism, data locality, and fault-tolerant re-execution automatically. **Bigtable** — a sparse, distributed, sorted-map (row/column/timestamp) over GFS, the template for the NoSQL wide-column store. **Borg** — cluster management packing many workloads onto shared machines by declared resource needs, the direct ancestor of Kubernetes.
- **Tradeoff:** each trades a general-purpose abstraction for a constrained one that the system can operate at scale — MapReduce gives up expressiveness for automatic fault tolerance; GFS/Bigtable relax POSIX/relational semantics for throughput and horizontal scale on unreliable hardware.
- **Sources:** [The Google File System (SOSP '03, PDF)](https://research.google.com/archive/gfs-sosp2003.pdf) · [MapReduce: Simplified Data Processing on Large Clusters (OSDI '04, PDF)](https://research.google.com/archive/mapreduce-osdi04.pdf) · [Bigtable: A Distributed Storage System for Structured Data (OSDI '06)](https://research.google/pubs/bigtable-a-distributed-storage-system-for-structured-data-awarded-best-paper/) · [Large-scale cluster management at Google with Borg (EuroSys '15)](https://research.google/pubs/large-scale-cluster-management-at-google-with-borg/)

### Apache Cassandra — Facebook's decentralized store (origin paper)
- **Scale:** built at Facebook to power Inbox Search; designed for **billions of writes/day** across hundreds of nodes spanning data centers; later the open-source backbone of Discord, Netflix, Monzo, and more.
- **Key decisions:** a deliberate **synthesis of two prior systems** — take **Dynamo's** decentralized, consistent-hashing, gossip-based, always-writable ring (no single point of failure, tunable quorum) and combine it with a **Bigtable-style column-family data model** and log-structured (LSM-tree/SSTable) storage engine tuned for high write throughput.
- **Tradeoff:** inherits Dynamo's **eventual consistency** (apps must tolerate/reconcile divergence) and the operational subtleties of a leaderless ring, in exchange for linear write scalability, multi-datacenter replication, and no failover — the foundational "AP wide-column" design point.
- **Sources:** [Cassandra — A Decentralized Structured Storage System (Lakshman & Malik, LADIS '09, PDF)](https://www.cs.cornell.edu/projects/ladis2009/papers/lakshman-ladis2009.pdf)

### Snowflake — separating storage from compute (SIGMOD 2016 paper)
- **Scale:** a cloud-native data warehouse; multiple isolated compute clusters querying one shared copy of data in object storage.
- **Key decisions:** the thesis is that **true elasticity requires decoupling storage and compute** — shared-nothing warehouses can't scale or upgrade gracefully in the cloud because data and compute are bolted together. Snowflake stores data immutably in **micro-partitions on object storage (S3)** and runs **independent "virtual warehouses"** (compute clusters) that all read the same data and scale up/down/out on demand. A columnar, vectorized, push-based engine plus partition pruning, MVCC snapshot isolation, and time travel round it out.
- **Tradeoff:** every query reads from remote object storage rather than local disk (mitigated by caching), accepting higher baseline data-access latency in exchange for **independent, per-workload elastic compute**, isolation between teams, and pay-for-what-you-use scaling — the architecture that reset expectations for cloud analytics.
- **Sources:** [The Snowflake Elastic Data Warehouse (SIGMOD '16, PDF)](https://www.snowflake.com/wp-content/uploads/2019/06/Snowflake_SIGMOD.pdf) · [ACM DL entry](https://dl.acm.org/doi/10.1145/2882903.2903741)

---

## Aggregators & where to find more

When a system you need isn't above, go to these first — they index thousands of primary write-ups:

- **[binhnguyennus/awesome-scalability](https://github.com/binhnguyennus/awesome-scalability)** — the most complete curated index of scalability/reliability/performance case studies, organized by pattern and by company; each entry links the original engineering post.
- **[InterviewReady/system-design-resources](https://github.com/InterviewReady/system-design-resources)** — curated distributed-systems papers, videos, and case studies.
- **[ByteByteGo / system-design-101](https://github.com/ByteByteGoHq/system-design-101)** and **[bytebytego.com](https://bytebytego.com/)** — visual explainers and newsletter deep-dives on real architectures (Discord, Slack, Notion, Figma, Canva, etc.).
- **[InfoQ — Scalability track](https://www.infoq.com/scalability/)** — recorded QCon talks (Airbnb, Slack, Uber) and trend adoption curves.
- **[High Scalability](https://highscalability.com/)** — long-running archive of "how X is built" teardowns.
- **Company engineering blogs (go to the source):** [Netflix TechBlog](https://netflixtechblog.com/) · [Uber](https://www.uber.com/blog/engineering/) · [Cloudflare](https://blog.cloudflare.com/) · [Stripe](https://stripe.com/blog/engineering) · [Figma](https://www.figma.com/blog/engineering/) · [Notion](https://www.notion.com/blog/topic/tech) · [Canva](https://www.canva.dev/blog/engineering/) · [Slack](https://slack.engineering/) · [Dropbox](https://dropbox.tech/) · [Airbnb](https://medium.com/airbnb-engineering) · [LinkedIn](https://engineering.linkedin.com/blog) · [Discord](https://discord.com/category/engineering) · [Instagram](https://instagram-engineering.com/) · [Pinterest](https://medium.com/pinterest-engineering) · [Shopify](https://shopify.engineering/).

---

## How to use these

A case study is precedent, not a template. To turn one into your own design decision:

1. **Match the forcing function, not the logo.** What actually drove the design was a specific constraint — write amplification (Twitter fanout), GC tail latency (Discord), clock uncertainty (Spanner), a single-workload cost cliff (Dropbox). Adopt the pattern only if you share the constraint. You are almost never at their scale; borrowing their complexity without their forcing function is how you get a distributed monolith.
2. **Read the tradeoff, then decide which side you're on.** Every entry pairs a benefit with a cost (availability vs. consistency, read-optimized vs. write-cost, monolith simplicity vs. modularity discipline, isolates vs. runtime freedom). Name the axis, then pick deliberately for *your* read/write ratio, consistency needs, team size, and failure tolerance.
3. **Notice the corrections.** Uber's DOMA and Airbnb's macroservices are companies walking *back* from microservice sprawl; Figma, Notion, Instagram, and Shopify scaled boring databases (Postgres/MySQL) far further than "you must switch to NoSQL" folklore suggests. The strongest signal is what mature teams *stopped* doing.
4. **Prefer incremental, reversible moves.** The recurring migration pattern (Stripe, Notion, Canva, Dropbox) is dual-write → backfill → verify with a comparison harness → cut over → clean up, never a big bang. Copy the *migration method* as readily as the end-state architecture.
5. **Cite the primary source in your design doc.** Link the specific post/paper and pull the concrete numbers (shard counts, latency budgets, node counts). "Notion used 480 logical shards over 32 databases because 480 is highly divisible" is a defensible design input; "big companies shard, so we should" is not.
