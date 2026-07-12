# Core Sources — Curricula, Distributed Systems, Networking, Architecture

The definitive map of what to read and study to master system design and architecture — canonical curricula, foundational books, university courses, primary-source papers, networking texts, cloud doctrine, and the people to follow. Format per row: **linked source — what it is → why it matters / who it's for**. Prefer primary sources; every line earns its place.

## 1. System design curricula & interview corpora (start here)

| Source | What it is → why it matters |
|---|---|
| [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) | The canonical open curriculum (~300k★): CAP, caching, load balancing, DB scaling, async, worked large-scale designs → **the spine**. For everyone, beginner through interview prep. |
| [karanpratapsingh/system-design](https://github.com/karanpratapsingh/system-design) | Best single networking→full-stack narrative: IP/DNS/proxies → databases, messaging, microservices → complete WhatsApp/Uber-scale designs → read start-to-finish as a course. For self-learners who want one linear path. |
| [ByteByteGoHq/system-design-101](https://github.com/ByteByteGoHq/system-design-101) | Visual quick-reference: protocols, API design, CI/CD, cloud, patterns as diagrams → fast recall and mental models. For skimming and revision. |
| [ashishps1/awesome-system-design-resources](https://github.com/ashishps1/awesome-system-design-resources) | Free structured index of concepts + building blocks + case studies + interview problems → a clean modern alternative/complement to the primer. For interview prep and gap-filling. |
| [InterviewReady/system-design-resources](https://github.com/InterviewReady/system-design-resources) | Case studies: cluster management, messaging antipatterns, service mesh, rate limiting → deeper engineering war-stories. For intermediate readers. |
| [binhnguyennus/awesome-scalability](https://github.com/binhnguyennus/awesome-scalability) | **Millions-of-users precedent corpus** — patterns of scalable/reliable/performant systems, each claim sourced to real engineering-blog case studies → grounding for "how do the big players actually do it." For designers who need precedent. |
| [madd86/awesome-system-design](https://github.com/madd86/awesome-system-design) | Curated meta-index of talks, papers, and posts → backfill gaps in any topic. For breadth. |
| [Alex Xu — ByteByteGo / *System Design Interview* Vol. 1 & 2](https://bytebytego.com/) | The best-selling books, now the ByteByteGo platform: step-by-step frameworks + illustrated worked problems (rate limiter, URL shortener, news feed, chat, search, payments) → the interview lingua franca. For structured interview prep. |
| [Grokking the System Design Interview (DesignGurus)](https://www.designgurus.io/course/grokking-the-system-design-interview) · [Educative edition](https://www.educative.io/courses/grokking-the-system-design-interview) | The original pattern-based interview course (RESTfulness, sharding, consistent hashing, worked designs) → teaches how to *think* through a design under time pressure. Paid; for interview candidates. |
| [mtdvio/every-programmer-should-know](https://github.com/mtdvio/every-programmer-should-know) | High-level syllabus of the concepts underpinning software engineering, each linked to authoritative sources → a checklist for a well-rounded foundation. For orienting before you dive. |

## 2. Foundational books — distributed systems & data

| Source | What it is → why it matters |
|---|---|
| [*Designing Data-Intensive Applications*, Kleppmann](https://dataintensive.net/) · [refs](https://github.com/ept/ddia-references) | The single best text on replication, partitioning, transactions, consistency, consensus, batch/stream → **the one book to read if you read one**. Its reference list is a curriculum on its own. (2nd ed. with Riccomini in progress.) For every backend/infra engineer. |
| [*Database Internals*, Alex Petrov](https://www.databass.dev/) | Deep dive into storage engines (B-trees, LSM-trees) and distributed data systems (replication, consensus, transactions) → understand *how* databases actually work internally. For anyone who builds on or operates a database. |
| [*Understanding Distributed Systems*, Roberto Vitillo](https://understandingdistributed.systems/) | Accessible tour of communication, coordination, time, consistency, scalability, resiliency, and operations → bridges theory and practice with just enough depth. For an approachable first distributed-systems book. |
| [*Site Reliability Engineering* + *SRE Workbook* + *Building Secure and Reliable Systems* (Google, free online)](https://sre.google/books/) | Three free books: SLOs/error budgets, on-call, postmortems, launch checklists, and secure-by-design practice → **the production-operations canon**. For anyone who has to run what they build. |
| [*High Performance MySQL*, 4th ed. (O'Reilly)](https://www.oreilly.com/library/view/high-performance-mysql/9781492080503/) | Schema/index design, replication, sharding, and operating relational databases at scale → the archetype for reasoning about any RDBMS under load. For data-tier engineers. |

## 3. Foundational books — architecture, microservices, reliability, DDD

| Source | What it is → why it matters |
|---|---|
| [*Fundamentals of Software Architecture* & *Software Architecture: The Hard Parts*, Richards & Ford](https://developertoarchitect.com/books.html) | Architecture styles, characteristics ("-ilities"), trade-off analysis, and the soft skills of the role → **the modern architecture textbook pair**; the Hard Parts is all about the messy distributed trade-offs with no clean answer. For aspiring/practicing architects. |
| [*Building Microservices*, 2nd ed., Sam Newman](https://samnewman.io/books/building_microservices_2nd_edition/) | Modeling, integrating, testing, deploying, and operating fine-grained services → the standard reference on microservices done responsibly. For teams considering or running microservices. |
| [*Release It!*, 2nd ed., Michael Nygard](https://pragprog.com/titles/mnee2/release-it-second-edition/) | Stability & capacity patterns and antipatterns (circuit breaker, bulkhead, timeouts, cascading failure) from real production disasters → how systems actually break and how to survive it. For anyone shipping to production. |
| [*The Art of Scalability*, Abbott & Fisher (AKF Partners)](https://akfpartners.com/books/the-art-of-scalability) | Scalability across architecture, process, *and* organization; source of the AKF Scale Cube (x/y/z-axis scaling) → scaling is org+process, not just tech. For leads and architects. |
| [*Designing Distributed Systems*, Brendan Burns (O'Reilly)](https://www.oreilly.com/library/view/designing-distributed-systems/9781098156343/) · [free 1st-ed. ebook](https://info.microsoft.com/rs/157-GQE-382/images/EN-CNTNT-eBook-DesigningDistributedSystems.pdf) | Reusable patterns for container-based distributed systems: sidecar, ambassador, adapter, work-queue, scatter/gather → a pattern language for Kubernetes-era design. For platform/infra engineers. |
| [*Domain-Driven Design*, Eric Evans](https://www.domainlanguage.com/ddd/) · [free DDD Reference (PDF)](https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf) · [Fowler's DDD bliki](https://martinfowler.com/bliki/DomainDrivenDesign.html) | The original: bounded contexts, ubiquitous language, aggregates, context maps → how to structure software around the business domain. Essential for decomposing systems and drawing service boundaries. |
| [*Implementing Domain-Driven Design*, Vaughn Vernon](https://www.amazon.com/Implementing-Domain-Driven-Design-Vaughn-Vernon/dp/0321834577) | The practical "how": aggregates, domain events, and DDD with modern messaging/microservices → turns Evans' theory into code. Read after Evans. |

## 4. University courses (video lectures + notes + labs)

| Source | What it is → why it matters |
|---|---|
| [MIT 6.5840 / 6.824 — Distributed Systems](https://pdos.csail.mit.edu/6.824/) | The graduate course — MapReduce, GFS, Raft, sharded KV, Spanner — with Go labs where you *build* a fault-tolerant replicated system. **The single best hands-on distributed-systems course.** For serious learners willing to do the labs. |
| [Martin Kleppmann — Distributed Systems (Cambridge)](https://www.youtube.com/playlist?list=PLeKd45zvjcDFUEv_ohr_HdUFe97RItdiB) · [lecture notes (PDF)](https://www.cl.cam.ac.uk/teaching/2122/ConcDisSys/dist-sys-notes.pdf) · [course page](https://www.cl.cam.ac.uk/teaching/2425/ConcDisSys/) | ~7 hrs of lectures + ~90pp notes by the DDIA author: RPC, clocks, causality, broadcast, replication, consensus → the clearest lecture intro to the theory. For a rigorous but approachable video course. |
| [CMU 15-445/645 — Intro to Database Systems (Andy Pavlo)](https://15445.courses.cs.cmu.edu/) · [Pavlo's page](https://www.cs.cmu.edu/~pavlo/) | Storage, indexing, query execution/optimization, concurrency control, recovery, distributed DBs — with C++ storage-engine projects → understand databases from the inside. Free lectures on YouTube. |
| [UC Berkeley CS162 — Operating Systems & Systems Programming](https://cs162.org/) | Processes, concurrency, scheduling, memory, file systems, networking, transactions, distributed systems — with Pintos projects → the OS foundations under every distributed system. For filling systems-fundamentals gaps. |
| [MIT 6.033 — Computer System Engineering](https://ocw.mit.edu/courses/6-033-computer-system-engineering-spring-2018/) · [current site](https://web.mit.edu/6.033/www/) | Complexity control, modularity, client-server, OS, networking, distributed systems, fault tolerance, security → how to *engineer* a system and reason about it. Includes the classic reading list. |

## 5. Distributed-systems paper collections & empirical truth

| Source | What it is → why it matters |
|---|---|
| [papers-we-love/papers-we-love](https://github.com/papers-we-love/papers-we-love) | Curated, PDF-hosting repo of the primary-source classics (Lamport, Dynamo, Raft, Spanner, Bigtable, ZooKeeper) → the single place to find the papers themselves. For going to the source. |
| [theanalyst/awesome-distributed-systems](https://github.com/theanalyst/awesome-distributed-systems) | Curated papers, books, and lecture series (incl. Kleppmann's) organized by topic → a syllabus for self-study. |
| [the morning paper (Adrian Colyer)](https://blog.acolyer.org/) | Years of daily, readable summaries of CS papers → decide what to read deeply and grasp results fast. Archived but timeless. |
| [aphyr/distsys-class](https://github.com/aphyr/distsys-class) · [Jepsen analyses](https://jepsen.io/analyses) | Class notes + rigorous testing that shows how real databases *actually* violate their advertised consistency → the empirical reality check on every vendor claim. For skeptics and operators. |
| [Aleksey Charapko — Distributed Systems Reading Group](https://charap.co/category/reading-group/) | 200+ modern papers discussed with write-ups and video → a living, ongoing curriculum of current research. For staying current. |

## 6. Canonical papers — the primary sources

### Consensus, consistency & theory

| Source | What it is → why it matters |
|---|---|
| [Raft — *In Search of an Understandable Consensus Algorithm* (Ongaro & Ousterhout)](https://raft.github.io/) | The consensus algorithm designed to be teachable (leader election, log replication, safety) → the one to learn first; underpins etcd, Consul, CockroachDB. The site also has visualizations and implementations. |
| [*Paxos Made Simple* (Lamport)](https://lamport.azurewebsites.net/pubs/paxos-simple.pdf) | Lamport's own plain-language explanation of the foundational consensus protocol → the intellectual root of the whole field. Read alongside Raft to see what Raft simplified. |
| [FLP — *Impossibility of Distributed Consensus with One Faulty Process*](https://www.cs.princeton.edu/courses/archive/spr22/cos418/papers/flp.pdf) | Proof that no deterministic protocol guarantees consensus in an asynchronous network with even one crash → the hard limit that shapes all consensus design. For understanding *why* it's hard. |
| [CAP — *Perspectives on the CAP Theorem* (Gilbert & Lynch)](https://www.semanticscholar.org/paper/Perspectives-on-the-CAP-Theorem-Gilbert-Lynch/e7cf963e61e767f480a6e03300b0a4cd74686435) · [illustrated proof](https://mwhittaker.github.io/blog/an_illustrated_proof_of_the_cap_theorem/) | The formalization of Brewer's conjecture (consistency vs. availability under partition) + an accessible visual proof → the trade-off every distributed design must face. Read the illustrated proof first. |

### Storage & data systems

| Source | What it is → why it matters |
|---|---|
| [*MapReduce: Simplified Data Processing on Large Clusters* (Dean & Ghemawat)](https://research.google/pubs/mapreduce-simplified-data-processing-on-large-clusters/) | The programming model that made commodity-cluster batch processing mainstream → launched Hadoop and the big-data era. Foundational. |
| [*The Google File System* (Ghemawat et al.)](https://research.google.com/archive/gfs.html) | A fault-tolerant distributed file system on commodity hardware → the blueprint for HDFS and modern distributed storage. |
| [*Bigtable: A Distributed Storage System for Structured Data*](https://research.google.com/archive/bigtable-osdi06.pdf) | Google's wide-column store on GFS → catalyzed the NoSQL movement; direct ancestor of HBase and Cassandra's data model. |
| [*Dynamo: Amazon's Highly Available Key-value Store*](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf) | Consistent hashing, vector clocks, quorums, eventual consistency, always-writeable design → the blueprint for Cassandra, Riak, DynamoDB. **A must-read.** |
| [*Spanner: Google's Globally-Distributed Database*](https://research.google/pubs/spanner-googles-globally-distributed-database-2/) | Globally distributed, externally consistent transactions using TrueTime (bounded clock uncertainty) → proved global-scale strong consistency is possible. For understanding NewSQL/CockroachDB/YugabyteDB. |
| [*Cassandra: A Decentralized Structured Storage System* (Lakshman & Malik)](https://www.cs.cornell.edu/projects/ladis2009/papers/lakshman-ladis2009.pdf) | Dynamo's availability model + Bigtable's data model, decentralized → the reference for masterless, tunable-consistency stores. |
| [Calvin — *Fast Distributed Transactions for Partitioned Database Systems*](https://dl.acm.org/doi/abs/10.1145/2213836.2213838) · [summary](https://blog.acolyer.org/2019/03/29/calvin-fast-distributed-transactions-for-partitioned-database-systems/) | Deterministic transaction ordering to cut the cost of distributed commits → an alternative to 2PC; basis of FaunaDB. For advanced transaction design. |

### Coordination, messaging & lookup

| Source | What it is → why it matters |
|---|---|
| [*The Chubby Lock Service for Loosely-Coupled Distributed Systems* (Burrows)](https://research.google.com/archive/chubby-osdi06.pdf) | Paxos-backed distributed locks + small-file storage for coordination → the design ZooKeeper/etcd descend from; shows how consensus is packaged as a usable service. |
| [*ZooKeeper: Wait-free Coordination for Internet-scale Systems*](https://www.usenix.org/conference/usenix-atc-10/zookeeper-wait-free-coordination-internet-scale-systems) | A general coordination kernel (config, leader election, membership) with a simple API → the coordination backbone of Kafka, HBase, and many clusters. |
| [*Kafka: a Distributed Messaging System for Log Processing* (Kreps, Narkhede, Rao)](https://paperswelove.org/papers/kafka-a-distributed-messaging-system-for-log-proce-956be0fd/) | The original design: partitioned, replicated, append-only commit log with stateless brokers → the model behind modern event streaming and the "log as the source of truth" idea. |
| [*Chord: A Scalable Peer-to-peer Lookup Service* (Stoica et al.)](https://pdos.csail.mit.edu/papers/chord:sigcomm01/chord_sigcomm.pdf) | Distributed hash table with logarithmic lookup via consistent hashing → foundational for P2P and the consistent-hashing intuition used in every sharded system. |

## 7. Networking (the layer under everything)

| Source | What it is → why it matters |
|---|---|
| [Beej's Guides](https://beej.us/guide/) · [Network Programming](https://beej.us/guide/bgnet/) | Sockets, TCP/UDP, and IPv4/IPv6 from first principles → learn what a connection *is* by writing one. For hands-on fundamentals. |
| [*Computer Networking: A Top-Down Approach*, Kurose & Ross](https://gaia.cs.umass.edu/kurose_ross/index.php) | The standard university networking textbook — application → transport → network → link — with free lectures, slides, and interactive problems → the systematic full-stack networking foundation. |
| [*High Performance Browser Networking*, Ilya Grigorik (free)](https://hpbn.co/) | Latency/bandwidth physics, TCP/TLS/UDP tuning, HTTP/1-2, WebSocket, WebRTC → the canonical performance-networking text. For anyone optimizing real traffic. |
| [http2-explained](https://daniel.haxx.se/http2/) ([repo](https://github.com/bagder/http2-explained)) · [http3-explained](https://github.com/bagder/http3-explained) | Deep, plain-language docs on HTTP/2 and HTTP/3+QUIC by curl's author, Daniel Stenberg → understand the modern web transport that RFCs describe tersely. |
| [Cloudflare Learning Center](https://www.cloudflare.com/learning/) | Free, well-illustrated explainers on DNS, CDN, TLS, DDoS, BGP, and "how the Internet works" → fast, trustworthy grounding on any web-infra term. For quick, reliable reference. |
| [Julia Evans — jvns.ca](https://jvns.ca/) · [wizardzines](https://wizardzines.com/) | Approachable blog posts and illustrated zines on networking, DNS, HTTP, TCP, and debugging → demystifies the intimidating parts. For intuition and debugging skills. |
| HTTP/QUIC RFCs (normative): [9110 semantics](https://www.rfc-editor.org/rfc/rfc9110) · [9111 caching](https://www.rfc-editor.org/rfc/rfc9111) · [9112 HTTP/1.1](https://www.rfc-editor.org/rfc/rfc9112) · [9114 HTTP/3](https://www.rfc-editor.org/rfc/rfc9114) · [9000 QUIC](https://www.rfc-editor.org/rfc/rfc9000) | The authoritative specs → cite these when behavior is disputed. For the ground truth on protocol semantics. |

## 8. Cloud & architecture doctrine (brief pointers; deeper map in `08-cloud-providers.md`)

| Source | What it is → why it matters |
|---|---|
| [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/the-pillars-of-the-framework.html) | Six pillars (operational excellence, security, reliability, performance, cost, sustainability) → **the production-grade review rubric**. See `checklists/design-review.md`. |
| [The Amazon Builders' Library](https://aws.amazon.com/builders-library/) | Amazon's own articles on timeouts/retries/backoff+jitter, shuffle sharding, load shedding, caching pitfalls → the best "how it breaks at scale, and what we did" corpus. |
| [Google Cloud Architecture Center](https://cloud.google.com/architecture) · [Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/) | Reference architectures, well-architected frameworks, and decision guides → cross-check designs against vendor doctrine. |
| [Azure Cloud Design Patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/) · [mspnp/cloud-design-patterns](https://github.com/mspnp/cloud-design-patterns) | Technology-agnostic patterns (retry, circuit breaker, bulkhead, CQRS, saga, throttling) with sample code → a shared vocabulary for resilience. |
| [microservices.io (Chris Richardson)](https://microservices.io/patterns/) | The 44-pattern microservices language (decomposition, data, communication, deployment, observability) → the reference catalog for service-based architecture. |
| [martinfowler.com](https://martinfowler.com/) · [Architecture Guide](https://martinfowler.com/architecture/) | The bliki + long-form articles on microservices, event sourcing, CQRS, DDD, ADRs → foundational essays that named half the vocabulary. |

## 9. Blogs, newsletters & people to follow

| Source | What it is → why it matters |
|---|---|
| [High Scalability](https://highscalability.com/) | Long-running blog of real-world scaling case studies and "Stuff The Internet Says" roundups → precedent and breadth. |
| [ByteByteGo Newsletter (Alex Xu)](https://blog.bytebytego.com/) | Weekly illustrated deep dives on system design fundamentals → digestible reinforcement of core concepts. |
| [The Pragmatic Engineer (Gergely Orosz)](https://newsletter.pragmaticengineer.com/) | Inside looks at how big tech builds and operates, plus engineering-culture and career depth → the industry-practice lens. |
| [InfoQ — Architecture & Design](https://www.infoq.com/) | Conference talks, articles, and trend reports from practitioners → track where architecture practice is heading. |
| [Marc Brooker's Blog (AWS)](https://brooker.co.za/blog/) | Rigorous, first-principles posts on distributed systems, consistency, retries, and reliability from an AWS principal → the "why," done carefully. |
| [Brendan Gregg](https://www.brendangregg.com/) | The authority on systems performance, observability, and flame graphs → how to measure and reason about performance, not guess. |
| [Murat Demirbas — Metadata](https://muratbuffalo.blogspot.com/) | A distributed-systems researcher's paper reviews and commentary → connect academic results to practice. |
| [Martin Fowler](https://martinfowler.com/) | (Also above.) Follow for enduring architecture and design writing. |

## Suggested learning path

**Beginner — build vocabulary and intuition.**
1. Skim [system-design-101](https://github.com/ByteByteGoHq/system-design-101) and work through [karanpratapsingh/system-design](https://github.com/karanpratapsingh/system-design) end to end.
2. Shore up networking with [Beej's Guide](https://beej.us/guide/bgnet/), [Cloudflare Learning Center](https://www.cloudflare.com/learning/), and [Julia Evans' zines](https://wizardzines.com/).
3. Read the [system-design-primer](https://github.com/donnemartin/system-design-primer) and, if interviewing, [Alex Xu Vol. 1](https://bytebytego.com/) or [Grokking](https://www.designgurus.io/course/grokking-the-system-design-interview).

**Intermediate — theory + real-world design.**
4. Read [*Designing Data-Intensive Applications*](https://dataintensive.net/) cover to cover — this is the pivot from novice to competent.
5. Add the reliability/architecture layer: [*Release It!*](https://pragprog.com/titles/mnee2/release-it-second-edition/), [*Fundamentals of Software Architecture*](https://developertoarchitect.com/books.html), and the free [Google SRE books](https://sre.google/books/).
6. Study precedent via [awesome-scalability](https://github.com/binhnguyennus/awesome-scalability), the [Amazon Builders' Library](https://aws.amazon.com/builders-library/), and [AWS Well-Architected](https://docs.aws.amazon.com/wellarchitected/latest/framework/the-pillars-of-the-framework.html).
7. Watch [Kleppmann's lectures](https://www.youtube.com/playlist?list=PLeKd45zvjcDFUEv_ohr_HdUFe97RItdiB) to formalize consensus, clocks, and consistency.

**Advanced — go to the primary sources and build.**
8. Do the labs in [MIT 6.5840](https://pdos.csail.mit.edu/6.824/); take [CMU 15-445](https://15445.courses.cs.cmu.edu/) for the storage/query internals.
9. Read the canonical papers in §6 — start with [Raft](https://raft.github.io/), [Dynamo](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf), [Spanner](https://research.google/pubs/spanner-googles-globally-distributed-database-2/), then [CAP](https://mwhittaker.github.io/blog/an_illustrated_proof_of_the_cap_theorem/) and [FLP](https://www.cs.princeton.edu/courses/archive/spr22/cos418/papers/flp.pdf) for the limits — hosted at [papers-we-love](https://github.com/papers-we-love/papers-we-love).
10. Confront reality with [Jepsen](https://jepsen.io/analyses); go deep on data/architecture with [*Database Internals*](https://www.databass.dev/) and [*Software Architecture: The Hard Parts*](https://developertoarchitect.com/books.html); then stay current via [Charapko's reading group](https://charap.co/category/reading-group/), [Marc Brooker](https://brooker.co.za/blog/), and [Murat Demirbas](https://muratbuffalo.blogspot.com/).
