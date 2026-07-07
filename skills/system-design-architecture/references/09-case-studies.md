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
