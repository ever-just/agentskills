# Capacity, Limits & Thresholds

How to determine what a system can take: estimate load before you build, measure where it breaks, and turn reliability targets into concrete numeric limits (rate caps, pool sizes, autoscaling triggers, alert thresholds).

---

## 1. The foundation: units, powers of two, and latency numbers

Every capacity estimate is arithmetic on approximate numbers. Memorize the powers of two and the latency table so you can do the math in your head and be "approximately right" — the goal of a [back-of-the-envelope estimate](https://github.com/donnemartin/system-design-primer#appendix) (system-design-primer appendix).

**Powers of two (data volume):**

| Power | Exact value | Approx | Name |
|---|---|---|---|
| 2^10 | 1,024 | 1 thousand | 1 KB |
| 2^20 | 1,048,576 | 1 million | 1 MB |
| 2^30 | 1,073,741,824 | 1 billion | 1 GB |
| 2^40 | ~1.1 × 10^12 | 1 trillion | 1 TB |
| 2^50 | ~1.1 × 10^15 | 1 quadrillion | 1 PB |

**Time budget of a day:** 86,400 s/day ≈ 10^5. Handy shortcut: **1 million requests/day ≈ 12 QPS average.** Seconds/month ≈ 2.6 × 10^6; seconds/year ≈ 3.15 × 10^7.

### Latency Numbers Every Programmer Should Know

Jeff Dean's numbers, as maintained in [jboner's gist](https://gist.github.com/jboner/2841832). An interactive, year-scaled version is at [Colin Scott's page](https://colin-scott.github.io/personal_website/research/interactive_latency.html).

| Operation | Latency | Notes |
|---|---:|---|
| L1 cache reference | 0.5 ns | |
| Branch mispredict | 5 ns | |
| L2 cache reference | 7 ns | 14× L1 |
| Mutex lock/unlock | 25 ns | |
| Main memory reference | 100 ns | 200× L1, 20× L2 |
| Compress 1 KB with Zippy | 3,000 ns = 3 µs | |
| Send 1 KB over 1 Gbps network | 10,000 ns = 10 µs | |
| Read 4 KB randomly from SSD | 150,000 ns = 150 µs | ~1 GB/s SSD |
| Read 1 MB sequentially from memory | 250,000 ns = 250 µs | |
| Round trip within same datacenter | 500,000 ns = 500 µs | |
| Read 1 MB sequentially from SSD | 1,000,000 ns = 1 ms | 4× memory |
| Disk seek | 10,000,000 ns = 10 ms | 20× datacenter RT |
| Read 1 MB sequentially from disk | 20,000,000 ns = 20 ms | 80× memory, 20× SSD |
| Packet round trip CA → Netherlands → CA | 150,000,000 ns = 150 ms | |

**Load-bearing takeaways:** memory is ~100× faster than SSD and ~2000× faster than a disk seek; a cross-region round trip (150 ms) dwarfs any local compute; reading 1 MB from SSD (1 ms) vs disk (20 ms) is why the working set must fit in RAM/SSD. These are **unloaded** numbers — under contention they get much worse (see §7).

---

## 2. Back-of-the-envelope capacity estimation

A repeatable method (per [ByteByteGo](https://bytebytego.com/courses/system-design-interview/back-of-the-envelope-estimation) and the [system-design-primer](https://github.com/donnemartin/system-design-primer#appendix)): start from users → derive QPS → derive storage/day → derive bandwidth → derive cache/memory. State every assumption; round to one significant figure.

### Worked example — a social feed service

**Assumptions:** 100 M DAU; each user opens the feed 10×/day (1 B feed reads/day); each user posts 0.1×/day (10 M writes/day); a post record is 1 KB; a feed page returns 20 posts (~20 KB); retention 5 years; replication factor 3.

**QPS (throughput).**

```
Avg read QPS = 1e9 reads / 86,400 s      ≈ 11,600 QPS
Avg write QPS = 1e7 writes / 86,400 s    ≈ 116 QPS
Peak QPS = avg × peak-to-average ratio
         = 11,600 × 3  (see §11)          ≈ 35,000 QPS  ← size for this
Read:write ratio ≈ 100:1  → read-optimized (cache + replicas)
```

**Storage per day and over retention.**

```
Post data/day   = 10e6 posts × 1 KB       = 10 GB/day (metadata)
Replicated      = 10 GB × 3               = 30 GB/day
5-year raw      = 10 GB × 365 × 5         ≈ 18.3 TB
5-year replicated = 18.3 TB × 3           ≈ 55 TB
```

(Media blobs are sized separately, e.g. 10 M posts/day × 20% with media × 200 KB ≈ 400 GB/day — an order of magnitude bigger, and why media goes to object storage + CDN, not the DB.)

**Bandwidth (egress at peak).**

```
Egress = peak read QPS × payload
       = 35,000 QPS × 20 KB            = 700 MB/s ≈ 5.6 Gbps
```

**Cache memory (80/20 rule).** Cache the ~20% of content serving ~80% of reads — here, roughly the last 24 h of posts:

```
Hot set   = 10e6 posts/day × 1 KB       = 10 GB
+ overhead (keys, pointers, fragmentation) ~50%
Cache RAM ≈ 15 GB  → provision a 16–32 GB Redis (headroom for growth)
```

Cross-check the cache hit target against §1: a memory hit (~100 ns–250 µs) vs an SSD/DB hit (~1 ms+) is a 10–100× latency win, so a 90–95% hit rate is usually the threshold that keeps p99 in budget.

---

## 3. Little's Law — the concurrency/throughput/latency triangle

[Little's Law](https://en.wikipedia.org/wiki/Little%27s_law) relates the three quantities you tune:

**L = λ × W**

- **L** = average number of requests *in the system* (concurrency / in-flight)
- **λ** = average arrival/throughput rate (requests per second)
- **W** = average time a request spends in the system (latency / response time)

It holds for any stable system (arrival rate ≤ service rate), independent of the arrival distribution. Rearranged, it sizes limits directly:

```
λ = L / W     (max throughput given a concurrency cap)
L = λ × W     (required concurrency given a throughput target)
W = L / λ     (implied latency)
```

**Worked example — sizing a thread/connection pool.** A service holds a request for W = 40 ms (0.040 s) end to end and must sustain λ = 5,000 QPS.

```
L = λ × W = 5,000 × 0.040 = 200 concurrent requests in flight
```

So you need ~200 workers/connections to serve 5,000 QPS at 40 ms — **plus headroom** for latency spikes. Conversely, if a pool is capped at L = 200 and p99 latency degrades to W = 400 ms under load, sustainable throughput collapses to λ = 200 / 0.4 = **500 QPS**. This is why a latency regression silently becomes a throughput cliff: the same pool serves 10× fewer requests. Apply the law **per tier** — gateway, app, DB pool, downstream each have their own L, λ, W, and the smallest λ is the system bottleneck.

---

## 4. Queueing theory & the Universal Scalability Law

Little's Law tells you the mean; queueing theory tells you why latency explodes as you approach capacity. As utilization ρ (= λ/μ, where μ is service rate) rises, waiting time grows non-linearly. For an M/M/1 queue, the mean number in system is **L = ρ/(1−ρ)** — at ρ = 0.8, L = 4; at ρ = 0.9, L = 9; at ρ = 0.99, L = 99. **This is the math behind the ~70–80% utilization ceiling: past it, queue length and tail latency go vertical.**

**Amdahl's Law** caps speedup from parallelism when a fraction (1−p) is serial: `S(N) = 1 / ((1−p) + p/N)`.

**[Universal Scalability Law (USL)](https://www.perfdynamics.com/Manifesto/USLscalability.pdf)** (Neil Gunther) goes further — real systems don't just plateau, they get *worse* past a point ([Gunther, Wikipedia](https://en.wikipedia.org/wiki/Neil_J._Gunther)):

**C(N) = N / (1 + α(N−1) + βN(N−1))**

- **N** = concurrency (nodes, threads, users)
- **α (contention)** = serialization / queueing for shared resources (linear term)
- **β (coherency)** = cost of keeping copies consistent — crosstalk, cache coherence, locks (quadratic term, since it grows with pairwise coordination)

With β = 0 you recover Amdahl (a ceiling). With β > 0 there is a **knee — a peak throughput past which adding capacity reduces it**:

**N_max = √((1−α)/β)**

Practical use: run load tests at several concurrency levels, fit α and β (e.g., the R [`usl`](https://cran.r-project.org/web/packages/usl/usl.pdf) package), and you get the retrograde point — the hard limit no amount of horizontal scaling fixes without removing the coherency cost (shard, cache, drop the chatty lock).

---

## 5. Performance-analysis methods: what to measure

Three complementary lenses. Use all three: RED/Golden for the request path, USE for the resources under it.

| Method | Signals | Best for | Source |
|---|---|---|---|
| **USE** | **U**tilization, **S**aturation, **E**rrors — *per resource* (CPU, memory, disk, NIC, pools) | Infrastructure / finding the saturated resource | [Brendan Gregg, USE Method](https://www.brendangregg.com/usemethod.html) |
| **RED** | **R**ate, **E**rrors, **D**uration — *per service/endpoint* | Request-driven microservices (user-facing) | [Tom Wilkie, Grafana](https://grafana.com/blog/the-red-method-how-to-instrument-your-services/) |
| **Four Golden Signals** | **L**atency, **T**raffic, **E**rrors, **S**aturation | Any user-facing system (superset of RED) | [Google SRE Ch. 6](https://sre.google/sre-book/monitoring-distributed-systems/) |

- **USE** ([checklist](https://www.brendangregg.com/USEmethod/use-linux.html), [ACM Queue paper](https://queue.acm.org/detail.cfm?id=2413037)): for *every* resource, ask "is it busy (utilization %), does work queue up (saturation, e.g. run-queue length), does it throw errors?" Solves ~80% of server issues with ~5% of the effort. Utilization is a % over an interval; **saturation** is the leading indicator of a threshold breach.
- **RED**: rate (req/s), errors (failed req/s or %), duration (latency distribution). Instrument every service identically; alert on error ratio and duration percentiles.
- **Golden Signals**: RED + **saturation** (how "full" the system is, and the metric most constrained resources hit first). Distinguish latency of *successful* vs *failed* requests — errors can be fast and hide real slowness.

---

## 6. Load testing: finding the knee and the breaking point

You cannot *derive* the breaking point from first principles — you must measure it. Design a test that ramps load while watching Golden Signals; the **knee** is where latency/error curves bend upward while throughput flattens; the **breaking point** is where throughput drops or errors spike.

**Test types:**

| Type | Load profile | Finds |
|---|---|---|
| **Load** | Ramp to expected peak, hold | Does it meet SLO at target QPS? |
| **Stress** | Ramp past peak until it breaks | The breaking point / max capacity |
| **Spike** | Jump low→extreme in seconds | Whether autoscaling & buffers catch up |
| **Soak / endurance** | Moderate load for hours/days | Memory leaks, resource/FD/connection exhaustion, disk fill |
| **Capacity** | Step through concurrency levels | USL curve (α, β), the knee |

**Tools** (see [Grafana's open-source tool review](https://grafana.com/blog/2020/03/03/open-source-load-testing-tool-review/)):

| Tool | Scripting | Notes | Link |
|---|---|---|---|
| **k6** | JavaScript | Go engine; ~10s of K VUs/instance; low memory; "testing as code" | [k6.io](https://k6.io/) · [grafana/k6](https://github.com/grafana/k6) |
| **Gatling** | Scala/Java/Kotlin/JS | Async, non-blocking; strong HTML reports | [gatling.io](https://gatling.io/) · [gatling/gatling](https://github.com/gatling/gatling) |
| **Locust** | Python | gevent event-driven; scales via workers | [locust.io](https://locust.io/) · [locustio/locust](https://github.com/locustio/locust) |
| **JMeter** | GUI/XML | 20+ protocols (JDBC, JMS, LDAP…); heavier, `.jmx` hard to diff | [jmeter.apache.org](https://jmeter.apache.org/) · [apache/jmeter](https://github.com/apache/jmeter) |
| **Vegeta** | CLI/Go lib | Constant-**rate** attacker (open model) — good for RPS validation | [tsenart/vegeta](https://github.com/tsenart/vegeta) |
| **wrk** | Lua | Extremely fast microbenchmark; single-box HTTP throughput | (see Grafana review above) |

**Design checklist:** test against a production-like environment and dataset (cache-cold vs warm matters, per §1); use a **constant-arrival-rate (open) model** so a slow server can't throttle your offered load (see §7); ramp in steps and hold each long enough to reach steady state; measure percentiles not averages; drive load from outside the system under test; and record the resource saturating first (USE) at the knee.

---

## 7. Benchmarking pitfalls: coordinated omission & tail latency

**Coordinated omission** (coined by Gil Tene) is the most common way load tests *lie*. A closed-loop tester sends the next request only after the previous one returns; when the server stalls for 500 ms, the tester also stalls and simply *doesn't send* the requests it would have — so the worst samples are missing from the histogram, and p99 looks great while real users saw 500 ms. See [ScyllaDB, "On Coordinated Omission"](https://www.scylladb.com/2021/04/22/on-coordinated-omission/), [P99 CONF](https://p99conf.io/2023/09/14/if-p99-latency-is-bs-whats-the-alternative/), and Gil Tene's [mechanical-sympathy thread](https://groups.google.com/g/mechanical-sympathy/c/icNZJejUHfE/m/BfDekfBEs_sJ).

**Defenses:** use an **open-model / constant-rate** generator (Vegeta, k6 arrival-rate executor) so offered load is independent of response time; record against an *expected interval* and back-fill missed samples — **HdrHistogram** has a built-in coordinated-omission correction for exactly this.

**Tail latency matters more than the mean.** Report **p50, p90, p99, p99.9** (and max), never averages — averages hide the tail that dominates user experience. In fan-out systems, a request that touches N services waits on the slowest of N, so a 1-in-100 (p99) backend stall becomes common at the edge: with 100 parallel calls, the probability all are under p99 is 0.99^100 ≈ 37% — i.e. ~63% of requests hit at least one p99 tail. **Latency numbers change under load:** the §1 table is unloaded; at 80–90% utilization queueing (§4) inflates every operation, so always quote percentiles *at the target load*, not at idle.

---

## 8. SLI / SLO / SLA & error budgets → thresholds

Reliability targets convert directly into numeric thresholds ([Google SRE, Service Level Objectives](https://sre.google/sre-book/service-level-objectives/); [SRE Workbook, Implementing SLOs](https://sre.google/workbook/implementing-slos/)).

- **SLI** — the measurement (e.g., % of requests < 300 ms; % non-5xx). Good SLIs are ratios of good events / valid events.
- **SLO** — the target for the SLI (e.g., 99.9% of requests succeed over 28 days). Internal.
- **SLA** — the externally contracted promise, usually looser than the SLO, with financial penalties.
- **Error budget = 100% − SLO.** It quantifies how much unreliability you may "spend."

**The "nines" — budget and downtime:**

| SLO | Error budget | Downtime/year | Downtime/30 days | Errors per 1 M requests |
|---|---|---|---|---|
| 99% | 1% | ~3.65 days | ~7.2 h | 10,000 |
| 99.9% | 0.1% | ~8.77 h | ~43.8 min | 1,000 |
| 99.95% | 0.05% | ~4.38 h | ~21.9 min | 500 |
| 99.99% | 0.01% | ~52.6 min | ~4.38 min | 100 |
| 99.999% | 0.001% | ~5.26 min | ~26 s | 10 |

Turn budgets into alerts with **burn-rate thresholds** ([SRE Workbook, Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)): burn rate = (error rate) / (1 − SLO). A burn rate of 1 exactly exhausts the budget over the window; page on fast burn (e.g. 14.4× over 1 h ≈ 2% of a 30-day budget) and ticket on slow burn (e.g. 3× over 6 h). The [error-budget policy](https://sre.google/workbook/error-budget-policy/) then dictates action: budget spent → freeze feature launches, redirect to reliability.

---

## 9. Setting limits & thresholds in practice

### Rate limiting

| Algorithm | Memory | Burst behavior | Best for | Ref |
|---|---|---|---|---|
| **Token bucket** | O(1) | Allows controlled bursts up to bucket size; steady long-run rate | General public API default | [Arcjet](https://blog.arcjet.com/rate-limiting-algorithms-token-bucket-vs-sliding-window-vs-fixed-window/) |
| **Leaky bucket** | O(1) | Smooths to constant output; no bursts | Traffic shaping / steady egress | Arcjet |
| **Fixed window** | O(1) | Boundary spikes (up to 2× at edges) | Simple internal caps | Arcjet |
| **Sliding window log** | O(n) per key | Exact, no boundary spike | Low-volume, precision-critical | Arcjet |
| **Sliding window counter** | O(1) | ~6% drift, smooths boundaries | High-scale distributed limiting | Arcjet |

Set the sustained rate from Little's Law / capacity (§2–3) and the burst size from how much slack the downstream buffers can absorb.

### Connection / thread pool limits

Size pools with Little's Law (`L = λ × W`), then cap the DB pool by what the database can actually run in parallel. The [HikariCP formula](https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing):

```
connections ≈ (core_count × 2) + effective_spindle_count
```

(cores of the DB server, excluding HT; effective_spindle_count ≈ 0 when the working set is fully cached, ~1 for SSD.) A 4-core SSD Postgres peaks near **9** connections; 8-core near **17**. Adding connections *past* this **lowers** total TPS — a small pool that queues beats a large pool that thrashes. Front many app servers with a pooler (PgBouncer) rather than raising this.

### Autoscaling triggers

[Kubernetes HPA](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/) desired replicas:

```
desiredReplicas = ceil( currentReplicas × currentMetric / desiredMetric )
```

Target utilization (on *requested* CPU, not the limit) is typically **50–70%** — low enough to leave headroom for the spike before new pods are Ready, high enough to avoid premature scaling. Add stabilization windows to prevent flapping, and scale on the metric that saturates first (often a custom QPS or queue-depth metric, not CPU).

### Circuit-breaker thresholds

Per [Resilience4j](https://reflectoring.io/circuitbreaker-with-resilience4j/): open the breaker when `failureRateThreshold` (e.g. **50%**) or `slowCallRateThreshold` is exceeded over a `slidingWindowSize` (COUNT- or TIME-based), but only after `minimumNumberOfCalls` (avoid tripping on tiny samples). After `waitDurationInOpenState`, go HALF_OPEN and allow `permittedNumberOfCallsInHalfOpenState` probes; close if they succeed, re-open if not. Set `slowCallDurationThreshold` from your SLO latency (§8), not an arbitrary value.

---

## 10. Capacity planning: headroom & peak-to-average

You provision for **peak plus headroom**, never for the average ([SRE School, Headroom](https://sreschool.com/blog/headroom/); [OneUptime, Peak Capacity](https://oneuptime.com/blog/post/2026-01-30-peak-capacity-planning/view)).

- **Peak-to-average ratio** = peak load / average load. Measure it from real traffic (diurnal, weekly, seasonal). Typical web PAR is ~1.5–3×; event-driven or flash-sale traffic can be 10×+. Size for peak: `required = average × PAR`.
- **Statistical peak:** `expected_peak ≈ mean + 2σ` (covers ~95% assuming normality), then multiply by a safety buffer.
- **Headroom / utilization target:** keep steady-state utilization at **~70%** (leaves room to absorb spikes and single-instance failure; §4 explains why past ~80% latency degrades). Manufacturing-style rule of thumb: 10–20% cushion minimum.
- **Provision for peak + N** (redundancy): capacity must survive N instance/zone failures *at peak*. For N+1 across k identical units each at utilization u, you need `k` such that `(k−1)` units still cover peak: size so peak load ÷ (k−1) ≤ per-unit safe capacity. N+2 or spanning 3 AZs for critical tiers.
- **Growth runway:** headroom also buys **lead time** to provision more before you hit the wall — track the trend and set a threshold (e.g. alert at 60% of max sustained capacity) that fires before you're out of runway.

---

## Apply it — capacity/threshold analysis checklist

1. **State the load.** Users → requests/day → **average QPS** → **peak QPS** (× measured peak-to-average, §2, §10). Show the arithmetic and every assumption.
2. **Estimate the four dimensions:** QPS, **storage/day** (× replication × retention), **bandwidth** (payload × peak QPS), **cache/memory** (working set + overhead, 80/20). Round to one significant figure (§2).
3. **Apply Little's Law** to size every pool/concurrency limit: `L = λ × W`, per tier; find the smallest λ (the bottleneck) (§3).
4. **Locate the ceiling** with queueing intuition (~70–80% utilization) and, if you have data, fit the **USL** knee `N_max = √((1−α)/β)` (§4).
5. **Instrument** with USE (resources) + RED / Four Golden Signals (requests) before load testing (§5).
6. **Load, stress, spike, and soak test** against a production-like env; find the **knee and breaking point**; use an **open/constant-rate** model to avoid **coordinated omission**; report **p50/p99/p99.9 at load**, never averages (§6, §7).
7. **Set SLIs/SLOs**, compute the **error budget** and **burn-rate alert thresholds** from the nines table (§8).
8. **Derive concrete limits** from the above: rate-limit (sustained + burst), pool sizes (HikariCP formula), autoscale target (50–70%, scale on the first-saturating metric), circuit-breaker rates/durations tied to the SLO (§9).
9. **Provision for peak + N** with ~70% steady-state utilization, verify the system still meets SLO with N instances down at peak, and set a **runway alert** well before max capacity (§10).
10. **Re-measure after every change** — latency numbers, α/β, and peak-to-average all drift; thresholds are living values, not one-time constants.
