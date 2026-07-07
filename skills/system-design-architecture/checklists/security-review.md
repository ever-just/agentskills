# Security Review Checklist

A ship-blocking gate. Full guidance and references: `references/02-security.md`.
Anchored to the [OWASP Top 10](https://owasp.org/www-project-top-ten/) and
[OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/).

## Threat model
- [ ] STRIDE (or equivalent) run over the design; trust boundaries drawn.
- [ ] Attack surface enumerated (every input, endpoint, dependency, admin path).
- [ ] Abuse cases considered, not just use cases.

## Authentication & session
- [ ] Standard protocols only (OAuth 2.1 / OIDC); no hand-rolled auth or crypto.
- [ ] Passwords hashed with a slow KDF (argon2/bcrypt/scrypt); MFA available for privileged access.
- [ ] Session tokens: secure, httpOnly, SameSite; short-lived + rotation; JWT follows [RFC 8725 BCP](https://www.rfc-editor.org/rfc/rfc8725).

## Authorization
- [ ] Every request authorized server-side (no client-trusted access control).
- [ ] Object-level authorization checked (no IDOR / BOLA — OWASP API #1).
- [ ] Least privilege for users, services, and IAM roles; deny by default.

## Input / output handling
- [ ] All input validated (allow-list) and output encoded for its sink → blocks XSS/SQLi/command injection.
- [ ] Parameterized queries / ORM; no string-built SQL.
- [ ] SSRF defenses on any server-side fetch (allow-list, block metadata endpoints/link-local).
- [ ] CSRF protection on state-changing browser requests.
- [ ] File uploads validated (type/size), stored off the app host, scanned.

## Data protection
- [ ] Data classified; PII/secrets identified.
- [ ] TLS in transit (modern config); encryption at rest with KMS-managed keys.
- [ ] Secrets in a manager (Vault/cloud), never in git/images/logs; rotation defined.
- [ ] Sensitive data not logged; logs scrubbed.

## Dependencies & supply chain
- [ ] Dependency scanning (SCA) in CI; known-vuln policy.
- [ ] SBOM generated; builds pinned; artifacts signed (Sigstore/cosign); [SLSA](https://slsa.dev/) level targeted.

## Infrastructure & platform
- [ ] Network segmented; databases not publicly reachable; security groups least-open.
- [ ] Containers: non-root, minimal base, scanned; K8s hardened (NSA/CISA guide).
- [ ] CIS Benchmark alignment for the platform.
- [ ] Rate limiting + WAF + DDoS protection at the edge.

## Detection & response
- [ ] Security-relevant events audited (auth, authz failures, admin actions).
- [ ] Alerting on anomalies; incident response plan exists ([NIST SP 800-61](https://csrc.nist.gov/pubs/sp/800/61/r2/final)).

## Compliance (if applicable)
- [ ] Governing frameworks identified (SOC 2 / ISO 27001 / PCI-DSS / HIPAA / GDPR) and their controls mapped.

## Verdict
Block release on any unchecked **critical** item (auth, authz, injection, secrets,
data exposure). Record accepted risks with an owner and expiry.
