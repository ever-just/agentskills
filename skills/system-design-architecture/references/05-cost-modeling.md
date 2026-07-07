# Cost Modeling & Projection

Purpose: teach an agent to project, decompose, and control the cost of a system — building unit economics (cost-per-request, cost-per-tenant) from first principles, choosing pricing models and elasticity strategies, and running a FinOps-grade cost review of a design *before* it ships.

> All dollar figures below are illustrative, use AWS `us-east-1` on-demand list prices sampled mid-2026, and are meant for *relative* modeling. Always re-price against the live calculators ([AWS](https://calculator.aws/), [Google Cloud](https://cloud.google.com/products/calculator), [Azure](https://azure.microsoft.com/en-us/pricing/calculator/)) before committing to numbers.

---

## 1. Why cost is a design output, not a bill you discover later

For a SaaS system, infrastructure cost is **Cost of Goods Sold (COGS)** — it sits directly under revenue and sets the gross-margin ceiling of the whole business. Design decisions (compute model, egress topology, per-tenant isolation) are *margin decisions*.

- **What belongs in SaaS COGS:** production hosting (compute, storage, bandwidth, managed DB), third-party APIs metered per use, data pipeline/observability for the production service, and the people who keep it running (SRE/on-call, customer support). It generally does **not** include R&D, sales, or marketing. ([CloudZero — SaaS COGS](https://www.cloudzero.com/blog/saas-cogs/), [SaaS Capital — what to include in COGS](https://www.saas-capital.com/blog-posts/what-should-be-included-in-cogs-for-my-saas-business/))
- **Gross margin = (Revenue − COGS) / Revenue.** Public-SaaS benchmark median is ~**75–80%** gross margin; below ~70% investors mark the business down. Every dollar of infra you *don't* spend flows straight to gross profit. ([CloudZero — SaaS gross margin](https://www.cloudzero.com/blog/saas-gross-margin/))
- **Unit economics** re-expresses that margin per unit of business value: cost per request, per API call, per active user, per tenant, per feature — always tied to a *demand driver* the business already tracks. ([CloudZero — SaaS unit economics](https://www.cloudzero.com/blog/saas-unit-economics/))

The rest of this file is the machinery for producing those per-unit numbers and defending them as traffic grows.

### The core identities

| Quantity | Formula |
|---|---|
| Cost per request | `total variable infra cost / total requests` |
| Cost per tenant | `total infra cost / active tenants` (allocate shared cost by a driver) |
| Fully-loaded COGS per tenant | `infra/tenant + support/tenant + 3rd-party APIs/tenant` |
| Gross margin per tenant | `(price − COGS/tenant) / price` |
| Contribution margin | `price − variable cost/tenant` (excludes fixed platform cost) |

Rule of thumb: **fixed platform cost amortizes as you add tenants (cost/tenant falls); variable cost per request stays roughly flat (or worsens for egress-heavy workloads).** A cost model has to separate the two, or projections lie.

---

## 2. The FinOps discipline — the operating loop for cost

[FinOps](https://www.finops.org/framework/) is an operational framework and cultural practice that maximizes the business value of technology through collaboration between engineering, finance, and business teams. Its lifecycle is a repeating three-phase loop ([FinOps phases](https://www.finops.org/framework/phases/)):

| Phase | Question it answers | Design-time activities |
|---|---|---|
| **Inform** | *What does it cost and who owns it?* | Cost allocation/tagging, showback, budgeting, forecasting, unit-economics baselines |
| **Optimize** | *How do we make it cheaper for the same value?* | Rightsizing, rate optimization (commitments), architecture changes, killing waste |
| **Operate** | *How do we keep it that way?* | KPIs, anomaly alerts, governance policies, chargeback, automation |

Maturity is described as **Crawl → Walk → Run**. The load-bearing principles for architects are *"business value drives technology decisions,"* *"everyone takes ownership for their usage,"* and *"take advantage of the variable cost model of the cloud."* Its domains explicitly include **unit economics** under "Quantify Business Value."

### FOCUS — the billing-data standard

[FOCUS™ (FinOps Open Cost & Usage Specification)](https://focus.finops.org/) is an open spec defining **one common schema** for cost & usage data across cloud, SaaS, and on-prem so you can compare and combine bills from different providers. ([What is FOCUS](https://focus.finops.org/what-is-focus/), [spec](https://focus.finops.org/focus-specification/), [GitHub](https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec)). Learn these four cost columns — they are the vocabulary of every cost model:

| FOCUS column | Meaning |
|---|---|
| `ListCost` / `ListUnitPrice` | Public retail price, no discounts |
| `ContractedCost` | Price after negotiated/contractual discounts |
| `EffectiveCost` | Amortized cost including commitment discounts (the "true" per-period cost) |
| `BilledCost` | What actually landed on the invoice for the period |

When you forecast, forecast on `EffectiveCost`; when you reconcile, reconcile on `BilledCost`.

---

## 3. Cloud pricing fundamentals — the big cost drivers

Model every service as **fixed (per-hour/provisioned) + variable (per-unit) + hidden transfer** components. The recurring surprise is that the variable and transfer components dominate at scale.

### 3.1 Compute (sampled `us-east-1` on-demand)

| Resource | Approx. list price | Note |
|---|---|---|
| `m6g.large` (2 vCPU / 8 GB, Graviton) | ~$0.077 / hr (~$56/mo) | Best price/perf for general web tier |
| `t4g.nano` (burstable) | ~$0.0042 / hr (~$3.07/mo) | Dev / low-traffic; ~20% cheaper than `t3.nano` |
| AWS Lambda | **$0.20 / 1M requests + $0.0000166667 / GB-second** | Free tier: 1M req + 400k GB-s/mo, indefinite |
| API Gateway (HTTP) | $1.00 / 1M requests | REST API is $3.50/1M |

([EC2 on-demand pricing](https://aws.amazon.com/ec2/pricing/on-demand/), [Lambda pricing](https://aws.amazon.com/lambda/pricing/), [API Gateway pricing](https://aws.amazon.com/api-gateway/pricing/))

### 3.2 Storage classes (S3, tiered)

| Class | Price | Use |
|---|---|---|
| S3 Standard | $0.023/GB-mo (first 50 TB), $0.022 next 450 TB, $0.021 over 500 TB | Hot data |
| Cheaper classes (IA / Glacier tiers) | Multiples cheaper per GB | Cold data — but add retrieval + per-request fees |

Storage-class choice is a **23×** cost spread between hot and archival for the same byte. ([S3 pricing](https://aws.amazon.com/s3/pricing/))

### 3.3 Data egress & transfer — the silent line item (see §7)

### 3.4 Managed services & NAT — the "gotcha" tier

| Item | Charge | The trap |
|---|---|---|
| **NAT Gateway** | ~$0.045/hr **per AZ** + ~$0.045/GB processed | You pay hourly **and** per-GB — and it stacks *on top of* egress. Routing S3/DynamoDB traffic through it instead of a free VPC Gateway Endpoint is a classic bill spike. ([NAT Gateway pricing](https://cloudburn.io/blog/aws-nat-gateway-pricing), [VPC pricing](https://aws.amazon.com/vpc/pricing/)) |
| **Managed DB (RDS Multi-AZ)** | ~2× single-AZ instance + storage/IOPS | HA doubles the DB line; read replicas add more |
| **Load balancer (ALB)** | ~$0.0225/hr + LCU-hours | LCU (connections/bandwidth/rules) grows with traffic |
| **CloudWatch / logs** | per-GB ingest + per-metric | Verbose logging quietly becomes a top-5 line |

> Managed services are the point of the [AWS Well-Architected Cost Optimization pillar](https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html) principle *"stop spending money on undifferentiated heavy lifting"* — but every managed service trades ops toil for a per-unit rate you must model.

---

## 4. Pricing models & commitments — buy the rate down

Once the *shape* of usage is fixed, the *rate* is a purchasing decision. Match commitment to how predictable and how interruptible each workload is. ([On-demand vs Reserved](https://aws.amazon.com/compare/the-difference-between-on-demand-instances-and-reserved-instances/), [Reserved Instances overview](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-reserved-instances.html))

| Model | Discount vs on-demand | Commit | Best for |
|---|---|---|---|
| **On-Demand** | 0% (baseline) | none | Spiky/unpredictable, new workloads you're still benchmarking |
| **Savings Plans** (AWS) | up to ~72% | 1 or 3 yr, $/hr spend | Steady baseline where instance family/region may change; AWS's recommended default |
| **Reserved Instances** (AWS) | up to ~72–75% | 1 or 3 yr, specific config | Very stable, unchanging fleets/DBs |
| **Spot / Preemptible** | up to ~90% | none, ~2-min eviction warning | Stateless, fault-tolerant, interruptible: batch, ML training, CI, rendering. **Never** for stateful/customer-facing single points. |

Cross-cloud equivalents: **GCP Committed Use Discounts** (resource-based or flexible spend CUDs; plus automatic sustained-use discounts) ([GCP CUD docs](https://docs.cloud.google.com/compute/docs/instances/committed-use-discounts-overview)); **Azure Reservations** (up to ~72%) and **Azure Savings Plans** (up to ~65%), layered after Azure Hybrid Benefit.

**Blended strategy** most production shops land on: Savings Plans/CUDs to cover the steady baseline, On-Demand for the variable head, Spot for anything interruptible — typically **35–50% blended savings** without over-committing. Commit to the *floor* of your usage, not the peak.

---

## 5. Rightsizing & elasticity — pay for what you use

Over-provisioning is the single most common cloud waste. Two levers:

1. **Rightsizing** — match instance size to actual utilization. [AWS Compute Optimizer](https://aws.amazon.com/compute-optimizer/) uses utilization history to flag over-provisioned and **idle** resources (EC2, Auto Scaling groups, EBS, ECS, RDS/Aurora) and recommend cheaper configs/newer generations. ([rightsizing preferences](https://docs.aws.amazon.com/compute-optimizer/latest/ug/rightsizing-preferences.html)). GCP has Recommender/rightsizing; Azure has Advisor.
2. **Elasticity** — track demand with autoscaling so you're not paying for peak capacity 24/7. The ideal is **scale-to-zero** (serverless / Cloud Run / KEDA / scale-to-zero container platforms) so idle costs nothing.

The Well-Architected principle here is *"adopt consumption over provisioning"* and *"measure efficiency"* — a resource at 8% CPU is 92% waste no matter how cheap the sticker. ([Cost Optimization pillar](https://docs.aws.amazon.com/wellarchitected/latest/framework/cost-optimization.html))

Trade-off to model: elasticity's win (never pay idle) versus its cost (cold starts, more moving parts, and — see §6 — per-request pricing that overtakes flat capacity once utilization is high).

---

## 6. Compute-model cost crossover — serverless vs containers vs VMs

Serverless is cheapest at **low / spiky** utilization and gets expensive at **sustained high** throughput, because its cost is **linear with usage** while a provisioned container/VM is a flat rate regardless of load (up to capacity). The crossover is where the two lines meet.

Worked crossover from a real analysis of a load-balanced EC2 fleet (4× `m6g.xlarge` across 2 AZs) vs Lambda ([Ready, Set, Cloud — When is serverless more expensive?](https://www.readysetcloud.io/blog/allen.helton/when-is-serverless-more-expensive/)):

| Scenario | Monthly cost | Verdict |
|---|---|---|
| EC2 fleet (provisioned) | $487.53 | flat |
| Lambda @ 50 req/s | $370.65 | serverless wins |
| **Crossover ≈ 66 req/s** (~170M req/mo) | — | above this, Lambda > EC2 |
| App Runner container (2 vCPU/4 GB) | $112.32 | containers cheapest at steady mid-load |

Independent analyses put the container-vs-serverless crossover in the same neighborhood — roughly **tens of thousands of invocations/day or ~50–66 sustained req/s**, depending on duration and memory. ([The Cloud Standard — serverless vs containers](https://thecloudstandard.com/serverless-vs-containers/)). Watch the **hidden multiplier**: a 10M-request Lambda API costs ~$10 in raw compute but ~**$57** once API Gateway, CloudWatch Logs, and NAT are added — a 5–6× uplift over the headline number.

**Design heuristic:** serverless for spiky/low-duty and glue; containers for steady mid-to-high throughput; reserved VMs/Spot for very large, predictable, or interruptible fleets. Re-check the crossover whenever a workload's duty cycle changes.

---

## 7. Egress & data-transfer traps

Inbound is free; **moving data out and sideways is where bills detonate.** ([AWS data-transfer overview](https://aws.amazon.com/blogs/architecture/overview-of-data-transfer-costs-for-common-architectures/))

| Path | Approx. AWS rate | Trap |
|---|---|---|
| Internet egress (out) | ~$0.09/GB first 10 TB (first 100 GB/mo free), tiers down after | The headline egress line; scales with user traffic |
| **Cross-AZ** | ~$0.01/GB **each direction** | HA/replication chatter between AZs is billed both ways; multiplies with microservice fan-out |
| Cross-region | region-pair-dependent (~$0.02/GB typical) | Multi-region replication and DR copies |
| NAT Gateway processing | ~$0.045/GB | Stacks on top of egress; free **VPC Gateway Endpoints** eliminate it for S3/DynamoDB |

Egress is often the **largest single variable line at scale**, which is why the **zero-egress** model matters: [Cloudflare R2](https://www.cloudflare.com/products/r2/) charges **$0 egress** (storage ~$0.015/GB-mo + per-operation fees). ([R2 pricing](https://developers.cloudflare.com/r2/pricing/)). For an egress-heavy workload, 10 TB out costs ~$900 on S3 vs **$0** on R2 — a structural, not incremental, difference. Model egress topology (keep chatty services in one AZ, use private endpoints, put a CDN/zero-egress store in front of heavy download paths) as deliberately as you model compute.

---

## 8. Worked unit-economics example — cost-per-request and cost-per-tenant, projected up the ladder

**System:** multi-tenant B2B SaaS REST API on containers behind an ALB, Postgres on RDS, assets on S3, `us-east-1`. We build the monthly bill from components, divide into unit costs, then project along the scaling ladder.

### Tier A — 10M requests/mo, 100 tenants (HA pair, all on-demand)

| Component | Sizing | Monthly | Cost / request |
|---|---|---|---|
| Compute | 2× `m6g.large` 24/7 | $112 | $0.0000112 |
| Load balancer | 1 ALB + LCU | $22 | $0.0000022 |
| Managed DB | `db.m6g.large` + 100 GB gp3 | $137 | $0.0000137 |
| Object storage | 500 GB S3 Standard | $12 | $0.0000012 |
| Internet egress | ~300 GB (100 free) | $18 | $0.0000018 |
| NAT gateway | 2 AZ + ~100 GB | $70 | $0.0000070 |
| Observability | CloudWatch/logs | $30 | $0.0000030 |
| **Total** | | **≈ $401** | **$0.0000401** |

- **Cost per 1,000 requests ≈ $0.040**
- **Infra cost per tenant ≈ $4.01/mo**
- At a $99/tenant price: infra-only gross margin ≈ **96%**; blended with support/3rd-party COGS it lands near the 75–80% SaaS benchmark.

Note the shape: **NAT ($70) + DB ($137) are fixed** and independent of traffic; compute and egress are the variable head.

### Projection along the scaling ladder

As traffic and tenants grow 10× per rung, fixed platform costs amortize and commitments (Savings Plans, ~30% off compute; Spot for async) cut the rate, while egress rises roughly linearly and becomes the top variable line.

| Rung | Traffic / tenants | Compute | DB | Egress | NAT+net | S3 | Obs+LB | **Total/mo** | **$/1k req** | **$/tenant** |
|---|---|---|---|---|---|---|---|---|---|---|
| **A** — HA pair, on-demand | 10M / 100 | $112 | $137 | $18 | $70 | $12 | $52 | **~$401** | **$0.040** | **$4.01** |
| **B** — autoscaled + Savings Plan | 100M / 1,000 | $340 | $700 | $261 | $177 | $115 | $210 | **~$1,803** | **$0.018** | **$1.80** |
| **C** — committed fleet + multi-region | 1B / 10,000 | $2,800 | $4,500 | $2,800 | $600 | $1,100 | $1,100 | **~$12,900** | **$0.013** | **$1.29** |

**What the projection teaches:**

1. **Cost per tenant falls** $4.01 → $1.80 → $1.29 as fixed platform + commitment discounts amortize across more tenants — the SaaS margin-improvement flywheel.
2. **Cost per 1k requests falls** $0.040 → $0.018 → $0.013, but flattens — you can't discount the variable head to zero.
3. **Egress and DB overtake compute** as the biggest lines at Tier C. The optimization priority *reorders* as you scale; a cost review must be re-run at each rung, not once.
4. **The margin lever moves.** Early on, kill fixed waste (right-size the HA pair, drop the second NAT). At scale, attack egress topology and DB scaling, and buy the rate down with commitments.

---

## 9. Cost observability & allocation — you can't optimize what you can't attribute

**Foundation: tagging.** Consistent resource tags (`team`, `env`, `tenant`, `service`, `cost-center`) are what make per-tenant/per-team numbers possible. On AWS these become **cost allocation tags** consumed by Cost Explorer, Budgets, and Cost & Usage Reports.

| Practice | What it is |
|---|---|
| **Showback** | Report each team/tenant its consumption — visibility, no invoice |
| **Chargeback** | Actually bill costs back to team/department budgets |
| **Anomaly detection** | ML-based alerting on abnormal spend spikes |

**Tools:**

| Tool | Layer | Role |
|---|---|---|
| [AWS Cost Explorer / Budgets](https://docs.aws.amazon.com/cost-management/latest/userguide/getting-started-ad.html) | Cloud bill | Visualize, budget, forecast |
| [AWS Cost Anomaly Detection](https://aws.amazon.com/aws-cost-management/aws-cost-anomaly-detection/) | Cloud bill | ML alerts on service/account/tag/category monitors |
| [OpenCost](https://opencost.io/) ([docs](https://opencost.io/docs/), [GitHub](https://github.com/opencost/opencost)) | Kubernetes | Vendor-neutral, CNCF cost allocation per namespace/label/pod; powers showback/chargeback |
| Kubecost | Kubernetes | Commercial layer on OpenCost — retention, multi-cluster, alerting, governance |
| [Infracost](https://www.infracost.io/docs/) ([GitHub](https://github.com/infracost/infracost)) | IaC / pre-deploy | Posts the **cost diff of a Terraform change directly in the pull request** — "shift FinOps left" so cost is reviewed *before* merge, across AWS/Azure/GCP |

The strategic move is **Infracost in the PR (prevent) + OpenCost/Kubecost (measure) + anomaly detection (operate)** — cover the cost lifecycle before, during, and after deploy.

---

## 10. Repatriation & the "cloud cost" debate — know the counter-argument

At scale, cloud's variable, managed convenience can cost more than owned hardware — the **"cloud paradox."** a16z argues cloud is cheaper early but more expensive later, estimating that across 50 top public software companies, cloud spend represents ~$100B of foregone market value (and >$500B across a broader universe). ([a16z — The Cost of Cloud, a Trillion-Dollar Paradox](https://a16z.com/the-cost-of-cloud-a-trillion-dollar-paradox/))

Real repatriation cases:

- **37signals (Basecamp/HEY):** left AWS after a >$3.2M/yr bill; reports ~**$2M/yr** saved and **>$10M over five years**. ([The Register](https://www.theregister.com/2025/05/09/37signals_cloud_repatriation_storage_savings/), [DCD](https://www.datacenterdynamics.com/en/news/37signals-claims-it-saved-almost-2m-last-year-from-cloud-repatriation/))
- **Dropbox:** moved ~90% of storage off AWS; per its S-1, ~$53M invested against ~**$74.6M** operational savings over two years. ([Sunbird — 3 repatriation case studies](https://www.sunbirddcim.com/blog/3-companies-repatriated-workloads-cloud-and-their-results))

**Balance it:** repatriation only wins for *large, stable, predictable* workloads at high utilization; the counter-view is that most companies over-provision and under-optimize rather than genuinely outgrowing cloud economics ([Last Week in AWS — the paradoxical arguments](https://www.lastweekinaws.com/blog/the-trillion-dollar-paradoxical-arguments-of-a16z/)). The lesson for a *design* review is not "leave the cloud" — it's that **per-unit cost must be modeled**, because at some scale the curve can invert, and you should know your crossover before finance discovers it.

---

## Apply it — cost review checklist for a design

- [ ] **State the unit.** Pick the demand driver (request / API call / active user / tenant) and compute **cost per unit** and **cost per tenant** — not just a monthly total.
- [ ] **Build the bill bottom-up:** compute + storage (right class) + egress + cross-AZ/region transfer + NAT + managed DB + LB + observability. Price it on a real calculator.
- [ ] **Separate fixed from variable.** Confirm fixed cost amortizes and variable cost per unit is understood; flag any line that grows super-linearly.
- [ ] **Egress audit.** Map every data path that leaves an AZ/region/the cloud. Kill NAT for AWS-service traffic (Gateway Endpoints); consider CDN / zero-egress storage for heavy download paths.
- [ ] **Check the compute-model crossover.** Given the duty cycle, is serverless / container / VM the cheapest tier here? Re-check at each scale rung.
- [ ] **Rightsizing & elasticity.** Any resource projected under ~40% utilization? Can it autoscale or scale-to-zero? Run Compute Optimizer / equivalent.
- [ ] **Rate optimization.** Cover the steady baseline with Savings Plans/CUDs, push interruptible work to Spot, leave the spiky head on-demand. Commit to the floor, not the peak.
- [ ] **Project up the ladder.** Model cost/unit and cost/tenant at 1×, 10×, 100× traffic. Confirm cost/tenant *falls* (margin flywheel) and identify which line becomes dominant at scale.
- [ ] **Tie to margin.** Compute gross margin per tenant at target price; check it clears the ~70–80% SaaS bar with headroom for support and 3rd-party COGS.
- [ ] **Instrument before launch.** Tagging scheme defined; Infracost in the PR; anomaly detection + budget alerts wired; showback owner assigned per FinOps *Operate*.
- [ ] **Know your repatriation crossover.** For any very large, stable workload, sanity-check cloud vs owned/reserved economics so an inversion doesn't surprise you later.

---

**Sources:** [FinOps Framework](https://www.finops.org/framework/) · [FinOps Phases](https://www.finops.org/framework/phases/) · [FOCUS](https://focus.finops.org/) · [FOCUS spec](https://focus.finops.org/focus-specification/) · [AWS Well-Architected Cost Optimization pillar](https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html) · [AWS pricing calculator](https://calculator.aws/) · [GCP calculator](https://cloud.google.com/products/calculator) · [Azure calculator](https://azure.microsoft.com/en-us/pricing/calculator/) · [EC2](https://aws.amazon.com/ec2/pricing/on-demand/) / [S3](https://aws.amazon.com/s3/pricing/) / [Lambda](https://aws.amazon.com/lambda/pricing/) / [API Gateway](https://aws.amazon.com/api-gateway/pricing/) / [VPC](https://aws.amazon.com/vpc/pricing/) pricing · [AWS data-transfer overview](https://aws.amazon.com/blogs/architecture/overview-of-data-transfer-costs-for-common-architectures/) · [NAT Gateway pricing](https://cloudburn.io/blog/aws-nat-gateway-pricing) · [Compute Optimizer](https://aws.amazon.com/compute-optimizer/) · [Cost Anomaly Detection](https://aws.amazon.com/aws-cost-management/aws-cost-anomaly-detection/) · [GCP CUDs](https://docs.cloud.google.com/compute/docs/instances/committed-use-discounts-overview) · [OpenCost](https://opencost.io/) · [Infracost](https://www.infracost.io/docs/) · [Cloudflare R2](https://www.cloudflare.com/products/r2/) · [Serverless crossover](https://www.readysetcloud.io/blog/allen.helton/when-is-serverless-more-expensive/) · [a16z cloud paradox](https://a16z.com/the-cost-of-cloud-a-trillion-dollar-paradox/) · [CloudZero SaaS COGS](https://www.cloudzero.com/blog/saas-cogs/) / [unit economics](https://www.cloudzero.com/blog/saas-unit-economics/) / [gross margin](https://www.cloudzero.com/blog/saas-gross-margin/) · [37signals repatriation](https://www.theregister.com/2025/05/09/37signals_cloud_repatriation_storage_savings/)
