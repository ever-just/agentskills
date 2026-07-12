# Cloud Providers — Service Maps & How to Leverage Them

Purpose: a capability-organized map of the major clouds' managed services, with official docs links, so you can reach for the right managed service per need instead of rebuilding it — and know where each provider's authoritative guidance lives. All links verified against provider docs (mid-2026); service names change, so confirm before quoting.

> **How to use:** find the capability row, pick the provider column you're on, follow the link to its docs. Prefer a managed service over self-hosting unless you have a specific reason (cost at scale, portability, a feature gap) — see the decision guide at the bottom.

---

## Service map by capability

### Compute

| Capability | AWS | GCP | Azure | Cloudflare |
|---|---|---|---|---|
| VMs | [EC2](https://docs.aws.amazon.com/ec2/) | [Compute Engine](https://docs.cloud.google.com/compute/docs) | [Virtual Machines](https://learn.microsoft.com/en-us/azure/virtual-machines/overview) | — |
| Containers | [ECS + Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html) | [Cloud Run](https://docs.cloud.google.com/run/docs) | [Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/overview) | [Containers](https://developers.cloudflare.com/containers/) |
| Serverless / FaaS | [Lambda](https://docs.aws.amazon.com/lambda/) | [Cloud Run functions](https://docs.cloud.google.com/functions/docs) | [Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-overview) | [Workers](https://developers.cloudflare.com/workers/) |
| Managed Kubernetes | [EKS](https://docs.aws.amazon.com/eks/) | [GKE](https://docs.cloud.google.com/kubernetes-engine/docs) | [AKS](https://learn.microsoft.com/en-us/azure/aks/what-is-aks) | — |
| Edge compute | [Lambda@Edge / CloudFront Functions](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-functions.html) | [Media CDN / Cloud Run](https://docs.cloud.google.com/media-cdn/docs) | [Front Door](https://learn.microsoft.com/en-us/azure/frontdoor/front-door-overview) | [Workers](https://developers.cloudflare.com/workers/) |

### Storage

| Capability | AWS | GCP | Azure | Cloudflare |
|---|---|---|---|---|
| Object storage | [S3](https://docs.aws.amazon.com/s3/) | [Cloud Storage](https://docs.cloud.google.com/storage/docs) | [Blob Storage](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction) | [R2](https://developers.cloudflare.com/r2/) (zero-egress) |
| Block storage | [EBS](https://docs.aws.amazon.com/ebs/) | [Persistent Disk / Hyperdisk](https://docs.cloud.google.com/compute/docs/disks/persistent-disks) | [Managed Disks](https://learn.microsoft.com/en-us/azure/virtual-machines/managed-disks-overview) | — |
| File storage | [EFS / FSx](https://docs.aws.amazon.com/efs/) | [Filestore](https://docs.cloud.google.com/filestore/docs) | [Files](https://learn.microsoft.com/en-us/azure/storage/files/storage-files-introduction) | — |

### Databases

| Capability | AWS | GCP | Azure | Cloudflare |
|---|---|---|---|---|
| Relational (managed) | [RDS / Aurora](https://docs.aws.amazon.com/rds/) | [Cloud SQL / AlloyDB / Spanner](https://docs.cloud.google.com/sql/docs) | [SQL Database](https://learn.microsoft.com/en-us/azure/azure-sql/database/sql-database-paas-overview) / [PostgreSQL](https://learn.microsoft.com/en-us/azure/postgresql/overview) | [D1](https://developers.cloudflare.com/d1/) |
| NoSQL key-value | [DynamoDB](https://docs.aws.amazon.com/dynamodb/) | [Firestore / Bigtable](https://docs.cloud.google.com/firestore/native/docs) | [Cosmos DB](https://learn.microsoft.com/en-us/azure/cosmos-db/overview) | [Workers KV](https://developers.cloudflare.com/kv/) |
| Data warehouse / OLAP | [Redshift](https://docs.aws.amazon.com/redshift/) | [BigQuery](https://docs.cloud.google.com/bigquery/docs) | [Synapse Analytics](https://azure.microsoft.com/en-us/products/synapse-analytics/) | [Analytics Engine](https://developers.cloudflare.com/analytics/analytics-engine/) |
| In-memory cache | [ElastiCache / MemoryDB](https://docs.aws.amazon.com/elasticache/) | [Memorystore](https://docs.cloud.google.com/memorystore/docs) | [Cache for Redis](https://learn.microsoft.com/en-us/azure/azure-cache-for-redis/cache-overview) | ([Cache](https://developers.cloudflare.com/cache/) — HTTP only) |
| Durable/edge state | — | — | — | [Durable Objects](https://developers.cloudflare.com/durable-objects/) |

### Messaging & eventing

| Capability | AWS | GCP | Azure | Cloudflare |
|---|---|---|---|---|
| Message queue | [SQS](https://docs.aws.amazon.com/sqs/) | [Cloud Tasks](https://docs.cloud.google.com/tasks/docs) | [Queue Storage / Service Bus](https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-messaging-overview) | [Queues](https://developers.cloudflare.com/queues/) |
| Pub/sub & streaming | [SNS / Kinesis / MSK](https://docs.aws.amazon.com/kinesis/) | [Pub/Sub](https://docs.cloud.google.com/pubsub/docs) | [Event Hubs](https://learn.microsoft.com/en-us/azure/event-hubs/event-hubs-about) | [Pipelines](https://developers.cloudflare.com/pipelines/) |
| Event bus | [EventBridge](https://docs.aws.amazon.com/eventbridge/) | [Eventarc](https://docs.cloud.google.com/eventarc/docs) | [Event Grid](https://learn.microsoft.com/en-us/azure/event-grid/overview) | — |
| Workflow orchestration | [Step Functions](https://docs.aws.amazon.com/step-functions/) | [Workflows / Composer](https://docs.cloud.google.com/workflows/docs) | [Logic Apps / Durable Functions](https://learn.microsoft.com/en-us/azure/logic-apps/logic-apps-overview) | [Workflows](https://developers.cloudflare.com/workflows/) |

### Networking & edge

| Capability | AWS | GCP | Azure | Cloudflare |
|---|---|---|---|---|
| API gateway | [API Gateway](https://docs.aws.amazon.com/apigateway/) | [API Gateway / Apigee](https://docs.cloud.google.com/api-gateway/docs) | [API Management](https://learn.microsoft.com/en-us/azure/api-management/api-management-key-concepts) | [API Shield](https://developers.cloudflare.com/api-shield/) |
| Load balancer | [ELB (ALB/NLB)](https://docs.aws.amazon.com/elasticloadbalancing/) | [Cloud Load Balancing](https://docs.cloud.google.com/load-balancing/docs) | [Load Balancer / App Gateway](https://learn.microsoft.com/en-us/azure/load-balancer/load-balancer-overview) | [Load Balancing](https://developers.cloudflare.com/load-balancing/) |
| CDN | [CloudFront](https://docs.aws.amazon.com/cloudfront/) | [Cloud CDN](https://docs.cloud.google.com/cdn/docs) | [Front Door](https://learn.microsoft.com/en-us/azure/frontdoor/front-door-overview) | [Cache/CDN](https://developers.cloudflare.com/cache/) |
| DNS | [Route 53](https://docs.aws.amazon.com/route53/) | [Cloud DNS](https://docs.cloud.google.com/dns/docs) | [Azure DNS](https://learn.microsoft.com/en-us/azure/dns/dns-overview) | [DNS](https://developers.cloudflare.com/dns/) |
| WAF / DDoS | [WAF / Shield](https://docs.aws.amazon.com/waf/latest/developerguide/what-is-aws-waf.html) | [Cloud Armor](https://docs.cloud.google.com/armor/docs) | [WAF / DDoS Protection](https://learn.microsoft.com/en-us/azure/web-application-firewall/overview) | [WAF / DDoS](https://developers.cloudflare.com/waf/) |

### Identity, security & secrets

| Capability | AWS | GCP | Azure | Cloudflare |
|---|---|---|---|---|
| Identity / IAM | [IAM / Cognito](https://docs.aws.amazon.com/iam/) | [Cloud IAM / Identity Platform](https://docs.cloud.google.com/iam/docs) | [Entra ID / RBAC](https://learn.microsoft.com/en-us/entra/fundamentals/whatis) | [Access (Zero Trust)](https://developers.cloudflare.com/cloudflare-one/) |
| Secrets management | [Secrets Manager](https://docs.aws.amazon.com/secretsmanager/) | [Secret Manager](https://docs.cloud.google.com/secret-manager/docs) | [Key Vault](https://learn.microsoft.com/en-us/azure/key-vault/general/overview) | [Secrets Store](https://developers.cloudflare.com/secrets-store/) |

### Observability

| Capability | AWS | GCP | Azure | Cloudflare |
|---|---|---|---|---|
| Monitoring / metrics | [CloudWatch](https://docs.aws.amazon.com/cloudwatch/) | [Cloud Monitoring](https://docs.cloud.google.com/monitoring/docs) | [Azure Monitor](https://learn.microsoft.com/en-us/azure/azure-monitor/fundamentals/overview) | [Workers Observability](https://developers.cloudflare.com/workers/observability/) |
| Log analytics | [CloudWatch Logs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/WhatIsCloudWatchLogs.html) | [Cloud Logging](https://docs.cloud.google.com/logging/docs) | [Log Analytics](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/log-analytics-overview) | [Logpush](https://developers.cloudflare.com/logs/logpush/) |

### Data & AI

| Capability | AWS | GCP | Azure | Cloudflare |
|---|---|---|---|---|
| Data pipeline / ETL | [Glue](https://docs.aws.amazon.com/glue/) | [Dataflow / Data Fusion](https://cloud.google.com/dataflow/docs) | [Data Factory](https://learn.microsoft.com/en-us/azure/data-factory/introduction) | — |
| AI/ML platform | [SageMaker](https://docs.aws.amazon.com/sagemaker/) | [Vertex AI](https://docs.cloud.google.com/vertex-ai/docs) | [Machine Learning / Foundry](https://learn.microsoft.com/en-us/azure/machine-learning/overview-what-is-azure-machine-learning) | [Workers AI](https://developers.cloudflare.com/workers-ai/) |
| Vector DB / AI inference | [Bedrock / OpenSearch vector](https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html) | [Vertex Vector Search / AlloyDB pgvector](https://docs.cloud.google.com/vertex-ai/docs/vector-search/overview) | [AI Search / Azure OpenAI](https://learn.microsoft.com/en-us/azure/search/vector-search-overview) | [Vectorize / AI Gateway](https://developers.cloudflare.com/vectorize/) |
| Email / notifications | [SES / SNS](https://docs.aws.amazon.com/ses/) | ([no native email](https://docs.cloud.google.com/compute/docs/tutorials/sending-mail) — use 3rd-party) | [Communication Services / Notification Hubs](https://learn.microsoft.com/en-us/azure/communication-services/concepts/email/email-overview) | [Email Routing](https://developers.cloudflare.com/email-routing/email-workers/) |

**Notes on partial matches:** Cloudflare has no true managed in-memory cache (its "cache" is HTTP-layer) and no full columnar warehouse (Analytics Engine is time-series; the emerging warehouse path is Pipelines → R2 Iceberg). GCP has **no native managed email service** — use SendGrid/Mailgun or a Workspace SMTP relay. Azure Synapse is being steered toward Microsoft Fabric. Always confirm the current product name/status before committing.

---

## Per-provider "start here"

### AWS
- **Doctrine:** [Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/) · [Architecture Center](https://aws.amazon.com/architecture/) · [Amazon Builders' Library](https://aws.amazon.com/builders-library/) (the best "how it breaks at scale" corpus)
- **Community:** [donnemartin/awesome-aws](https://github.com/donnemartin/awesome-aws) (~14k★, canonical)
- **Free tier / pricing:** [Free Tier](https://aws.amazon.com/free/) · [Pricing Calculator](https://calculator.aws/)

### Google Cloud
- **Doctrine:** [Architecture Framework (Well-Architected)](https://cloud.google.com/architecture/framework) · [Architecture Center](https://cloud.google.com/architecture)
- **Community:** [GoogleCloudPlatform/awesome-google-cloud](https://github.com/GoogleCloudPlatform/awesome-google-cloud) (official, but archived/read-only — no large actively-maintained general list currently dominates)
- **Free tier / pricing:** [Free Program](https://cloud.google.com/free) · [Pricing Calculator](https://cloud.google.com/products/calculator)
- *Note: Google now serves `cloud.google.com/architecture*` and most `/docs` from `docs.cloud.google.com` via 301 — both forms work.*

### Azure
- **Doctrine:** [Well-Architected Framework](https://learn.microsoft.com/azure/well-architected/) · [Architecture Center](https://learn.microsoft.com/azure/architecture/)
- **Community:** [lukemurraynz/awesome-azure-architecture](https://github.com/lukemurraynz/awesome-azure-architecture) (~1.7k★, active) · [kristofferandreasen/awesome-azure](https://github.com/kristofferandreasen/awesome-azure) (classic general list)
- **Free tier / pricing:** [Free Account](https://azure.microsoft.com/free/) · [Pricing Calculator](https://azure.microsoft.com/pricing/calculator/)

### Cloudflare
- **Doctrine:** [Reference Architectures](https://developers.cloudflare.com/reference-architecture/) · [Developer Docs](https://developers.cloudflare.com/)
- **Community:** [irazasyed/awesome-cloudflare](https://github.com/irazasyed/awesome-cloudflare) (original/canonical) · [zhuima/awesome-cloudflare](https://github.com/zhuima/awesome-cloudflare) (now most-starred)
- **Pricing:** [Plans](https://www.cloudflare.com/plans/)

---

## How to choose — provider, managed vs self-host, multi-cloud

**Managed service vs self-host (the default decision).** Prefer the managed service. Per the Well-Architected cost principle *"stop spending money on undifferentiated heavy lifting,"* running your own Postgres/Kafka/Redis is only worth it when you have a specific driver: cost at very large stable scale (see `references/05-cost-modeling.md` §10 repatriation), a feature the managed version lacks, strict data-residency, or portability. Self-hosting trades a per-unit rate for operational toil (patching, backups, failover, on-call) — a real cost that is easy to under-count.

**Picking a primary provider.** For most teams, pick **one** primary cloud and go deep — the operational simplicity and native integration outweigh the theoretical benefits of spreading. Choose by: where your team already has expertise; which provider's managed services best fit your workload (e.g. Cloudflare for edge-first/zero-egress, GCP for BigQuery-centric analytics, AWS for breadth/maturity); pricing for your specific dominant cost driver; and compliance/region coverage.

**Multi-cloud vs single-cloud (know the tradeoff).** Multi-cloud is a **per-workload decision, not an all-or-nothing stance**:

| | Single-cloud | Multi-cloud |
|---|---|---|
| **Wins** | Simpler ops, cheaper to run, deep native integration, one skill set | Avoids lock-in, best-of-breed per workload, resilience to one provider's outage, negotiating leverage |
| **Costs** | Vendor lock-in, single-provider risk | Higher operational overhead, cross-cloud networking/data-sync complexity, needs a unifying control plane and mature DevOps |

The authoritative framings agree the added complexity only pays off with unified governance and real DevOps maturity — otherwise fragmentation dominates. Sources: [Google Cloud — hybrid & multicloud patterns](https://cloud.google.com/architecture/hybrid-multicloud-patterns) · [Microsoft CAF — unified hybrid/multicloud operations](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/scenarios/hybrid/strategy) · [DigitalOcean — multi-cloud vs single-cloud](https://www.digitalocean.com/resources/articles/multi-cloud-vs-single-cloud).

**Rule of thumb:** single primary cloud for the core; reach for a second provider only for a specific best-of-breed capability (e.g. Cloudflare edge/R2 zero-egress in front of an AWS backend) where the win is concrete and the integration surface is small.
