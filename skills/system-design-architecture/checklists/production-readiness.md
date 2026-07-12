# Production Readiness Checklist

The gate before a service takes real traffic. Derived from Google SRE practice
and the AWS Builders' Library. Companion: [bregman-arie/sre-checklist](https://github.com/bregman-arie/sre-checklist),
[Google SRE books](https://sre.google/books/).

## Reliability & availability
- [ ] SLIs/SLOs defined and measurable; error budget agreed.
- [ ] No untolerated single points of failure; redundancy across AZs.
- [ ] Health checks (liveness + readiness) and graceful shutdown/drain.
- [ ] Timeouts on every network call; retries use exponential backoff **with jitter**; retry budgets cap amplification.
- [ ] Circuit breakers / bulkheads isolate failing dependencies.
- [ ] Load shedding + backpressure under overload; requests are prioritized/queued, not dropped randomly.
- [ ] Idempotency for retried/duplicated requests (idempotency keys).

## Scalability & performance
- [ ] Load tested to expected peak + headroom; breaking point known (`references/04-capacity-limits.md`).
- [ ] Autoscaling configured with sane min/max and correct trigger metrics.
- [ ] Resource limits/requests set (CPU/mem); no unbounded queues/buffers.
- [ ] Tail latency (p99/p99.9) within SLO under load.

## Observability
- [ ] The Four Golden Signals emitted: latency, traffic, errors, saturation.
- [ ] Structured logs, metrics, and distributed traces (OpenTelemetry) wired.
- [ ] Dashboards exist; alerts are actionable (symptom-based, low false-positive) and page on SLO burn.
- [ ] Correlation IDs propagate across services.

## Data & state
- [ ] Backups automated **and restore tested**; RPO/RTO documented.
- [ ] Schema migrations are backward-compatible and reversible; run without downtime.
- [ ] Data retention / deletion / PII handling compliant (`references/02-security.md`).

## Deployment & operations
- [ ] CI/CD with automated tests; deploys are incremental (canary/blue-green) and rollback-able.
- [ ] Feature flags for risky changes / kill switches for dependencies.
- [ ] Config and secrets externalized (12-factor); no secrets in images/repos.
- [ ] Runbook for common failures; on-call rotation + escalation defined.
- [ ] Dependencies documented with their SLAs; failure of each has a defined behavior.

## Security & compliance
- [ ] Security review passed (`checklists/security-review.md`).
- [ ] Least-privilege IAM; network segmentation; TLS everywhere.
- [ ] Rate limiting / WAF / DDoS protection at the edge.

## Launch
- [ ] Capacity provisioned for launch spike; load test simulated it.
- [ ] Rollout plan + rollback criteria written; postmortem template ready.
- [ ] Dark-launch / gradual ramp where possible.
