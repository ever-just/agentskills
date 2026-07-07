# Reference Library — Master Index

The `system-design-architecture` skill's on-demand knowledge base. `SKILL.md`
holds the decision frameworks; load the file below that matches the problem.

## References

| File | Load when you need… |
|---|---|
| [01-core-sources.md](01-core-sources.md) | The canonical curricula, distributed-systems, networking, and cloud-doctrine corpus to learn from or ground a design in. |
| [02-security.md](02-security.md) | To design a secure system: threat modeling, OWASP/ASVS, authn/z, zero-trust, secrets, data protection, supply chain, cloud/infra security, compliance. |
| [03-scaling-ladder.md](03-scaling-ladder.md) | The process of scaling from low volume to millions of users — stage-by-stage moves and their triggers. |
| [04-capacity-limits.md](04-capacity-limits.md) | To determine a system's limits/thresholds: back-of-envelope math, Little's Law, USE/RED, load testing, SLO-driven thresholds, rate limits. |
| [05-cost-modeling.md](05-cost-modeling.md) | To project and control cost: unit economics, cloud pricing, commitments, egress traps, FinOps, cost observability. |
| [06-architecture-archetypes.md](06-architecture-archetypes.md) | To pick a system style: monolith, microservices, event-driven, serverless, multi-tenant SaaS, multi-agent/LLM, data-intensive, real-time, edge. |
| [07-product-layers.md](07-product-layers.md) | To enumerate the parts a full product needs: client → edge → gateway → services → async → data → cache → search → observability → infra. |
| [08-cloud-providers.md](08-cloud-providers.md) | To choose managed services: AWS/GCP/Azure/Cloudflare capability→service maps with docs links, and each provider's architecture guidance. |
| [09-case-studies.md](09-case-studies.md) | Real, sourced examples of how live systems at scale are designed (Netflix, Uber, Discord, Stripe, Figma, Shopify, …). |
| [10-open-standards.md](10-open-standards.md) | To choose API/network standards: OpenAPI, AsyncAPI, JSON Schema, gRPC, GraphQL, CloudEvents, OAuth/OIDC, OpenTelemetry, 12-factor. |
| [11-decision-records.md](11-decision-records.md) | To capture a significant decision (ADR templates) or choose between candidate technologies/approaches (option-space framework, adversarial probe, cite-or-die evidence rule). |

## Checklists (`../checklists/`)

| File | Use as |
|---|---|
| [design-review.md](../checklists/design-review.md) | The gate before committing to a design — walks the six Well-Architected pillars + archetype/scale fit. |
| [production-readiness.md](../checklists/production-readiness.md) | The gate before a service takes real traffic (SRE launch gate). |
| [security-review.md](../checklists/security-review.md) | The ship-blocking security gate (OWASP-anchored). |

## Examples (`../examples/`)

| File | Shows |
|---|---|
| [worked-design-doc.md](../examples/worked-design-doc.md) | The whole skill applied end-to-end to a multi-tenant notification service. |
