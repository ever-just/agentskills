# Core Sources — Curricula, Distributed Systems, Networking

The canonical corpus to learn (and ground designs in). Format: **source — role**.

## 1. System design curricula (start here)

| Source | Role |
|---|---|
| [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) | The canonical curriculum (~300k★): CAP, caching, load balancing, DB scaling, async, worked large-scale designs. **The spine.** |
| [karanpratapsingh/system-design](https://github.com/karanpratapsingh/system-design) | Best single networking→full-stack narrative: IP/DNS/proxies → databases, messaging, microservices → complete WhatsApp/Uber-scale designs. |
| [ByteByteGoHq/system-design-101](https://github.com/ByteByteGoHq/system-design-101) | Visual quick-reference: protocols, API design, CI/CD, patterns. |
| [binhnguyennus/awesome-scalability](https://github.com/binhnguyennus/awesome-scalability) | **Millions-of-users precedent corpus** — patterns of scalable/reliable/performant systems, each claim sourced to engineering-blog case studies from systems serving millions–billions. |
| [InterviewReady/system-design-resources](https://github.com/InterviewReady/system-design-resources) | Case studies: cluster management, messaging antipatterns, service mesh, rate limiting. |
| [madd86/awesome-system-design](https://github.com/madd86/awesome-system-design) | Curated meta-index to backfill gaps. |

## 2. Distributed systems & data foundations

| Source | Role |
|---|---|
| [MIT 6.824/6.5840](https://pdos.csail.mit.edu/6.824/) | The graduate course — MapReduce, GFS, Raft, sharding, Spanner, with Go labs where you *build* them. |
| *Designing Data-Intensive Applications* (Kleppmann) + [ept/ddia-references](https://github.com/ept/ddia-references) | The single best text on replication, partitioning, transactions, consistency, consensus. Its reference list is a curriculum on its own. |
| [aphyr/distsys-class](https://github.com/aphyr/distsys-class) · [Jepsen analyses](https://jepsen.io/analyses) | Class notes + how real databases *actually* violate their consistency claims — the empirical truth. |
| [theanalyst/awesome-distributed-systems](https://github.com/theanalyst/awesome-distributed-systems) | Curated papers/lectures incl. Kleppmann's Cambridge lectures. |
| [papers-we-love/papers-we-love](https://github.com/papers-we-love/papers-we-love) | The primary-source papers (Lamport, Dynamo, Raft, Spanner, Bigtable). |

## 3. Networking (the layer under everything)

| Source | Role |
|---|---|
| [Beej's Guides](https://beej.us/guide/) | Sockets/TCP/UDP from first principles. |
| [High Performance Browser Networking](https://hpbn.co/) (Grigorik, free O'Reilly) | Latency/bandwidth physics, TCP/TLS tuning, HTTP/2, WebRTC — the canonical performance-networking text. |
| [http2-explained](https://daniel.haxx.se/http2/) · [bagder/http3-explained](https://github.com/bagder/http3-explained) | HTTP/2 (RFC 9113) and HTTP/3+QUIC (RFC 9114/9000), by curl's author. |
| [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (HTTP semantics) · [RFC 9111](https://www.rfc-editor.org/rfc/rfc9111) (caching) · [RFC 9000](https://www.rfc-editor.org/rfc/rfc9000) (QUIC) | The normative texts — cite these when behavior is disputed. |

## 4. Cloud doctrine & pattern catalogs

| Source | Role |
|---|---|
| [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/the-pillars-of-the-framework.html) | Six pillars (operational excellence, security, reliability, performance efficiency, cost optimization, sustainability) — **the production-grade rubric**. See `checklists/design-review.md`. |
| [Amazon Builders' Library](https://aws.amazon.com/builders-library/) | Amazon's production lessons: timeouts/retries/backoff+jitter, shuffle sharding, load shedding, cache stampedes. The best "how it breaks at scale" corpus. |
| [Azure Cloud Design Patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/) + [mspnp/cloud-design-patterns](https://github.com/mspnp/cloud-design-patterns) | Technology-agnostic pattern catalog (retry, circuit breaker, bulkhead, CQRS, saga, throttling) with sample code. |
| [microservices.io](https://microservices.io/patterns/) (Chris Richardson) | The 44-pattern microservices language. |
| [Google SRE books](https://sre.google/books/) (3, free) | SLOs/error budgets, postmortems, launch checklist, production best practices. |

> Deeper provider service maps: `references/08-cloud-providers.md`. Reliability
> practice and production readiness: `checklists/production-readiness.md`.
