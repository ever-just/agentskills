# Security & Secure-by-Design

Purpose: a curated, link-rich map of the standards, frameworks, and reference architectures an agent should apply to design production-grade, defensible systems — every link points to an official or primary source.

> **Meta-rule for every design decision below:** never hand-roll cryptography, authentication, session management, or access control. Use vetted, maintained libraries and identity providers, and reach for the primary standards on this page rather than inventing a scheme.

---

## 1. Secure-by-Design & First Principles

Design security in from the first diagram; do not bolt it on. Ship secure defaults so the safe path is the default path.

| Resource | What it is | Why it matters |
|---|---|---|
| [Saltzer & Schroeder, *The Protection of Information in Computer Systems* (1975)](https://www.cs.virginia.edu/~evans/cs551/saltzer/) ([overview](https://en.wikipedia.org/wiki/The_Protection_of_Information_in_Computer_Systems)) | The 8 canonical design principles: economy of mechanism, fail-safe defaults, complete mediation, open design, separation of privilege, least privilege, least common mechanism, psychological acceptability. | Every later framework traces its lineage here. This is the vocabulary reviewers expect you to reason in. |
| [CISA Secure by Design](https://www.cisa.gov/securebydesign) + [Secure by Design Pledge](https://www.cisa.gov/securebydesign/pledge) | Government-backed program shifting security burden from users to manufacturers; the pledge sets 7 measurable goals (MFA, default-on logging, eliminate default passwords, reduce vuln classes, etc.). | The current authoritative statement of what "secure by default" means as a product commitment, not a feature. |
| [*Shifting the Balance of Cybersecurity Risk* (CISA + 17 international partners)](https://www.cisa.gov/sites/default/files/2023-10/Shifting-the-Balance-of-Cybersecurity-Risk-Principles-and-Approaches-for-Secure-by-Design-Software.pdf) | Joint guidance: 3 principles — take ownership of customer security outcomes, embrace radical transparency, lead from the top — with concrete engineering tactics (memory-safe languages, parameterized queries, secure defaults). | Turns "secure by design" from a slogan into a checklist of implementable practices. |
| [NIST SP 800-218 — Secure Software Development Framework (SSDF)](https://csrc.nist.gov/pubs/sp/800/218/final) | 19 practices / 42 tasks across Prepare-Protect-Produce-Respond; the US federal benchmark for secure SDLC. | The framework you'll be attested against if you sell to the US government; a solid neutral SDLC baseline for anyone. |
| [OWASP Top 10 Proactive Controls](https://top10proactive.owasp.org/) | Developer-facing list of the 10 controls to build in first (define requirements, use frameworks, secure DB access, encode/escape, validate inputs, digital identity, access control, protect data, logging, error handling). | The "do these first" list for engineers who don't have a security team over their shoulder. |

---

## 2. Threat Modeling

Answer four questions early: *What are we building? What can go wrong? What are we going to do about it? Did we do a good job?*

| Resource | What it is | Why it matters |
|---|---|---|
| [Threat Modeling Manifesto](https://www.threatmodelingmanifesto.org/) | Vendor-neutral values & principles for threat modeling, authored by the field's leading practitioners. | Grounds any methodology choice; a good "why/how" primer to attach to a design doc. |
| [OWASP Threat Modeling (community page)](https://owasp.org/www-community/Threat_Modeling) | OWASP's overview linking methodologies, data-flow diagrams, and trust boundaries. | Neutral entry point mapping the whole threat-modeling landscape. |
| [STRIDE model](https://en.wikipedia.org/wiki/STRIDE_model) | Microsoft's mnemonic — Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege — one per security property. | The most widely taught per-element/per-interaction technique; a fast, structured brainstorm over a DFD. |
| [PASTA — Process for Attack Simulation & Threat Analysis](https://versprite.com/cybersecurity-listings/devsecops/pasta-threat-modeling/) | 7-stage, risk-centric, attacker-simulation methodology that ties technical threats to business impact. | Use when you must prioritize by likelihood × business impact, not just enumerate threats. |
| [MITRE ATT&CK](https://attack.mitre.org/) | Global knowledge base of real-world adversary tactics, techniques, and sub-techniques (Enterprise, Cloud, Mobile, ICS). | Grounds threat models and detections in techniques attackers actually use; a shared language across red/blue teams. |
| [OWASP Threat Dragon](https://owasp.org/www-project-threat-dragon/) ([GitHub](https://github.com/OWASP/threat-dragon)) | Free, open-source diagramming + threat-modeling tool (STRIDE/LINDDUN/CIA), web or desktop. | Lets you produce and version an actual threat model artifact instead of a whiteboard photo. |
| [`awesome-threat-modeling`](https://github.com/hysnsec/awesome-threat-modelling) ([alt](https://github.com/redshiftzero/awesome-threat-modeling)) | Curated index of books, courses, tools, attack-tree resources, and worked examples. | A jumping-off point when you need deeper material (e.g. attack trees) on a specific technique. |

---

## 3. The OWASP Canon

The consensus corpus for application security. Treat ASVS as the requirements spec, the Top 10 as awareness, WSTG as the test plan, and the Cheat Sheets as the how-to.

| Resource | What it is | Why it matters |
|---|---|---|
| [OWASP Top 10](https://owasp.org/Top10/2021/) ([project](https://owasp.org/www-project-top-ten/)) | The 10 most critical web app risk categories (Broken Access Control #1, Cryptographic Failures, Injection, Insecure Design, SSRF, …). | The universal baseline; "we address the OWASP Top 10" is the minimum bar reviewers ask for. |
| [OWASP ASVS — Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/) ([GitHub](https://github.com/OWASP/ASVS)) | Hundreds of testable requirements across 14 chapters, at 3 verification levels (L1–L3). | The one to build *requirements* and pen-test acceptance criteria from — far more actionable than the Top 10. |
| [OWASP API Security Top 10 (2023)](https://owasp.org/API-Security/editions/2023/en/0x11-t10/) ([project](https://owasp.org/www-project-api-security/)) | API-specific risks led by Broken Object Level Authorization (BOLA), Broken Authentication, and Broken Object Property Level Authorization. | Web-app Top 10 misses API-native failures; mandatory reading for any service exposing an API. |
| [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) ([GitHub](https://github.com/OWASP/CheatSheetSeries)) | Concise, authoritative how-to guides per topic (auth, session, crypto, injection, headers, …). | The fastest path from "which risk" to "exact control to implement." Specific sheets are cited throughout below. |
| [OWASP WSTG — Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/) ([GitHub](https://github.com/OWASP/wstg)) | The de-facto standard test methodology for web apps and services. | Turns "test our security" into a repeatable, coverage-checked procedure. |
| [OWASP SAMM — Software Assurance Maturity Model](https://owaspsamm.org/) ([project](https://owasp.org/www-project-samm/)) | Maturity model: 5 business functions × 15 practices to assess and improve an org's security program. | Use to benchmark and roadmap the *program*, not a single app. |

---

## 4. Authentication & Authorization

Delegate identity to a standards-based provider; enforce authorization on every request at the object level. AuthN proves who you are; AuthZ decides what you may do — keep them distinct.

| Resource | What it is | Why it matters |
|---|---|---|
| [OAuth 2.1 (IETF draft)](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/) ([oauth.net/2.1](https://oauth.net/2.1/)) | Consolidation of OAuth 2.0 + PKCE + BCPs: PKCE required, exact redirect-URI matching, implicit & password grants removed. | The current target for delegated authorization; "OAuth 2.1" bakes in the safe subset by default. |
| [RFC 9700 — OAuth 2.0 Security Best Current Practice](https://datatracker.ietf.org/doc/rfc9700/) ([summary](https://oauth.net/2/oauth-best-practice/)) | Updated threat model + hard requirements: PKCE for all clients, refresh-token rotation, sender-constrained tokens, no implicit/ROPC. | The definitive "how not to get OAuth wrong" reference; cite it in any auth design review. |
| [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html) | Authentication layer on top of OAuth 2.0; issues an ID Token (JWT) with verified end-user claims. | OAuth is authorization, *not* login — OIDC is the correct standard when you need to authenticate users. |
| [RFC 8725 — JWT Best Current Practices](https://www.rfc-editor.org/rfc/rfc8725.html) | Hardening rules for JWTs: reject `alg:none`, prevent RS256→HS256 confusion, validate `iss`/`aud`, use explicit typing, require sufficient key entropy. | JWTs are trivially misused; this is the checklist that closes the classic verification-bypass attacks. |
| [NIST SP 800-63 — Digital Identity Guidelines](https://pages.nist.gov/800-63-4/) | Requirements for identity proofing, authenticators, and federation across assurance levels (incl. phishing-resistant MFA guidance). | The authoritative source for password/MFA policy — including why length beats forced complexity/rotation. |
| [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) | Practical rules for credential handling, MFA, and session lifecycle. | Implementation-level companion to the standards above. |
| [Google Zanzibar → OpenFGA](https://openfga.dev/docs/learn/zanzibar) ([OpenFGA](https://openfga.dev/) · [GitHub](https://github.com/openfga/openfga)) | ReBAC engine inspired by Google's global authz system: permissions as `(object, relation, user)` tuples; unifies RBAC/ABAC/ReBAC. | The reference pattern for centralized, low-latency, fine-grained authz at scale (see §13). |
| [OpenFGA authorization concepts (RBAC / ABAC / ReBAC)](https://openfga.dev/docs/authorization-concepts) | Clear comparison of the three access-control models and when each fits. | Helps pick the right authz model instead of defaulting to sprawling role checks. |
| [SPIFFE / SPIRE](https://spiffe.io/) ([SPIRE GitHub](https://github.com/spiffe/spire)) | CNCF-graduated workload-identity standard + runtime issuing short-lived X.509-SVIDs for mutual TLS between services. | The standards-based way to do service-to-service authN and mTLS without long-lived shared secrets. |

---

## 5. Zero-Trust Architecture

No implicit trust from network location. Authenticate, authorize, and encrypt *every* request — user-to-service and service-to-service alike.

| Resource | What it is | Why it matters |
|---|---|---|
| [NIST SP 800-207 — Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final) ([PDF](https://nvlpubs.nist.gov/nistpubs/specialpublications/NIST.SP.800-207.pdf)) | The canonical definition: tenets, logical components (policy engine / administrator / enforcement point), deployment models. | The reference everyone cites; use its component model and vocabulary in ZTA designs. |
| [NIST SP 800-207A — ZTA model for cloud-native / multi-cloud](https://csrc.nist.gov/pubs/sp/800/207/a/final) | Applies ZTA to identity-based segmentation for microservices across clouds. | Bridges the abstract 800-207 to concrete service-mesh / multi-cloud enforcement. |
| [Google BeyondCorp](https://cloud.google.com/beyondcorp) | Google's production zero-trust model for *user* access: trust the user+device context, not the network; no VPN perimeter. | The original real-world ZTA case study for workforce access (papers + implementation). |
| [Google BeyondProd](https://cloud.google.com/blog/products/identity-security/beyondprod-whitepaper-discusses-cloud-native-security-at-google) | Zero trust for *production* service-to-service traffic: no inherent mutual trust, authenticated services, code of known provenance. | Shows how ZTA principles extend from users to workloads — the model behind cloud-native security. |

---

## 6. Secrets Management

Secrets never live in source, images, or config files. Centralize, encrypt, scope to least privilege, rotate, and audit.

| Resource | What it is | Why it matters |
|---|---|---|
| [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) | End-to-end lifecycle guidance: generation, storage, access, rotation, revocation, auditing across CI/CD, cloud, containers, multi-cloud. | The vendor-neutral checklist for doing secrets right; start here before choosing a tool. |
| [HashiCorp Vault](https://developer.hashicorp.com/vault/docs) | Identity-based secrets platform: central storage, dynamic/short-lived credentials, encryption-as-a-service, full audit. | The reference self-hosted secrets manager; dynamic secrets eliminate long-lived static credentials. |
| [SOPS](https://github.com/getsops/sops) ([getsops.io](https://getsops.io/)) | CNCF tool that encrypts *values* in YAML/JSON/ENV files (keys stay plaintext) using KMS/age/PGP. | Enables safe GitOps: encrypted secrets can live in git with reviewable diffs. |
| [AWS Secrets Manager — rotation](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html) | Managed cloud secret store with scheduled/automatic rotation (Lambda or managed) and IAM-scoped access. | Representative of the correct managed-cloud pattern (GCP Secret Manager, Azure Key Vault are equivalents): rotation is a first-class, automated feature. |

> **Prevention beats cleanup:** pair a secrets manager with pre-commit/CI secret scanning (e.g. OpenSSF Scorecard's checks, GitHub secret scanning) so credentials never enter history in the first place.

---

## 7. Data Protection — Encryption, TLS, KMS, PII

Encrypt in transit and at rest, manage keys in a KMS/HSM, and minimize the sensitive data you hold at all.

| Resource | What it is | Why it matters |
|---|---|---|
| [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/) | Copy-paste TLS configs (Nginx/Apache/etc.) for Modern / Intermediate / Old profiles. | Removes guesswork from cipher suites and protocol versions; the fastest way to a safe TLS config. |
| [Mozilla Server-Side TLS guidelines](https://wiki.mozilla.org/Security/Server_Side_TLS) | The rationale behind the generator: recommended protocols, ciphers, and rotation practices. | Explains *why* each setting — needed when you must justify a config or handle a legacy exception. |
| [MDN — TLS configuration guide](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/TLS) | Practitioner guide: TLS 1.3 default, TLS 1.2 fallback only, HSTS, OCSP stapling. | Concise, current implementation reference for HTTPS hardening. |
| [OWASP Transport Layer Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html) | Application-side TLS rules: enforce HTTPS everywhere, HSTS, disable TLS ≤1.1, validate certs. | Covers app-layer TLS decisions the server config alone doesn't. |
| [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html) | At-rest crypto guidance: AES-256-GCM, ECC (Curve25519), key management, and password *hashing* (not encryption). | Prevents the classic "encrypted the password reversibly" and weak-cipher mistakes; use a KMS/HSM for key custody, tokenize/avoid storing PII where possible. |

---

## 8. Supply-Chain Security

Know, verify, and sign everything that goes into your build. Generate provenance and an SBOM; scan dependencies continuously.

| Resource | What it is | Why it matters |
|---|---|---|
| [SLSA — Supply-chain Levels for Software Artifacts](https://slsa.dev/) ([GitHub](https://github.com/slsa-framework/slsa)) | OpenSSF framework of incrementally adoptable build-integrity levels (provenance, hardened CI, isolated builds). | The common language for "how tamper-resistant is this build?"; targets to raise CI maturity against. |
| [SPDX](https://spdx.dev/) | ISO/IEC 5962 international SBOM standard for components, licenses, and provenance. | One of two SBOM formats regulators/customers accept; interoperable and tool-supported. |
| [CycloneDX](https://cyclonedx.org/) ([OWASP project](https://owasp.org/www-project-cyclonedx/)) | OWASP/ECMA-424 full-stack BOM standard (SBOM, SaaSBOM, ML-BOM, VEX, attestations). | The other accepted SBOM format; richer for security use cases (VEX, vuln disclosure). |
| [Sigstore + cosign](https://docs.sigstore.dev/) ([cosign GitHub](https://github.com/sigstore/cosign)) | Keyless signing & transparency for containers/artifacts via OIDC identities and a public transparency log. | Makes "is this artifact the one we built, unmodified?" verifiable without managing signing keys. |
| [in-toto](https://in-toto.io/) ([GitHub](https://github.com/in-toto/in-toto)) | CNCF-graduated framework attesting each supply-chain step was done by an authorized party, unmodified in transit. | Provides the attestation format SLSA provenance builds on; end-to-end chain integrity. |
| [OpenSSF Scorecard](https://scorecard.dev/) ([GitHub](https://github.com/ossf/scorecard)) | Automated checks scoring a repo's security posture (branch protection, pinned deps, signed releases, …). | Fast risk read on a project — yours or a dependency you're about to add. |
| [OSV.dev](https://osv.dev/) ([GitHub](https://github.com/google/osv.dev)) | Google's open vulnerability DB + scanner across ecosystems (PyPI, npm, Go, Maven, …); precise version matching. | Machine-readable, low-false-positive vuln data; drives dependency scanning that flags what actually affects you. |
| [GitHub Dependabot security updates](https://docs.github.com/en/code-security/dependabot/dependabot-security-updates) | Automated PRs to patch vulnerable dependencies from the dependency graph. | Turns "known-vulnerable dependency" alerts into ready-to-merge fixes with minimal toil. |
| [`awesome-software-supply-chain-security`](https://github.com/bureado/awesome-software-supply-chain-security) | Curated index of tools, standards, and research in the domain. | Map of the wider ecosystem when you need a capability not covered above. |

---

## 9. Application Hardening

Validate input, encode on output, and default-deny. Never trust data from the client, the network, or another service.

| Resource | What it is | Why it matters |
|---|---|---|
| [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/) | Reference set + validator for HTTP security response headers (CSP, HSTS, X-Content-Type-Options, referrer policy, …). | Cheap, high-leverage browser-side defenses; the validator turns it into a pass/fail gate. |
| [OWASP HTTP Headers Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html) | Per-header guidance on what to set and why. | Implementation companion to the project above. |
| [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) | Context-aware output encoding + HTML sanitization (DOMPurify) rules. | XSS is perennial; contextual encoding is the actual fix, not blocklists. |
| [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html) | Parameterized queries / prepared statements as the primary defense, plus least-privilege DB accounts. | Injection stays in the Top 10 because people still concatenate SQL; this closes it. |
| [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) | Framework CSRF tokens, SameSite cookies, and Fetch-Metadata checks for state-changing requests. | State-changing endpoints need explicit CSRF defense; this is the current best practice. |
| [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) | Allowlist destinations, block internal ranges/metadata endpoints, segment egress. | SSRF (Top 10 A10) is how attackers pivot to cloud metadata/internal services — critical for anything that fetches URLs. |

> **Also apply:** rate limiting / quotas on every public endpoint (defends against brute force, credential stuffing, and resource exhaustion — API Security Top 10 "Unrestricted Resource Consumption"), and a WAF as defense-in-depth in front of — never instead of — the fixes above.

---

## 10. Cloud & Infrastructure Security

Least-privilege IAM, no long-lived static credentials, segmented networks, hardened baselines, and continuous scanning.

| Resource | What it is | Why it matters |
|---|---|---|
| [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks) | 100+ consensus hardening baselines for OSes, cloud platforms, containers, K8s, databases. | The accepted secure-configuration standard; many auditors and scanners map directly to it. |
| [CIS Critical Security Controls v8](https://www.cisecurity.org/controls/v8) | 18 prioritized safeguard groups (IG1–IG3) mitigating the most common attacks. | A prioritized "what to do first" program roadmap, complementary to the config-level Benchmarks. |
| [AWS Well-Architected — Security Pillar](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html) | AWS's security best practices: strong identity foundation, least privilege, traceability, defense in depth, automate, protect data. | Authoritative pattern set for AWS designs; the principles generalize across clouds. |
| [Google Cloud Security Best Practices Center](https://cloud.google.com/security/best-practices) | GCP's blueprints incl. the enterprise foundations blueprint (defense-in-depth: architecture + policy + detective controls). | The GCP-native equivalent, with IaC/Terraform reference implementations. |
| [Azure Security Best Practices & Patterns](https://learn.microsoft.com/en-us/azure/security/fundamentals/best-practices-and-patterns) | Microsoft's guidance mapped to the Cloud Security Benchmark and Zero Trust. | The Azure-native equivalent for identity, network, compute, and data controls. |
| [CSA Cloud Controls Matrix (CCM)](https://cloudsecurityalliance.org/research/cloud-controls-matrix) | Vendor-neutral framework of 207 cloud controls across 17 domains, mapped to major standards. | Clarifies shared-responsibility boundaries and lets you assess a CSP consistently. |
| [NSA/CISA Kubernetes Hardening Guide](https://media.defense.gov/2022/Aug/29/2003066362/-1/-1/0/CTR_KUBERNETES_HARDENING_GUIDANCE_1.2_20220829.PDF) ([CISA alert](https://www.cisa.gov/news-events/alerts/2022/03/15/updated-kubernetes-hardening-guide)) | Government hardening guidance: scan images, run least-privilege pods, network policies, RBAC, audit logging. | The authoritative K8s baseline; concrete misconfigurations to avoid. |
| [Trivy](https://github.com/aquasecurity/trivy) | Open-source scanner for CVEs, misconfigs, secrets, and SBOMs across images, filesystems, IaC, and clusters. | One tool to shift-left vuln + config + secret scanning in CI and at runtime. |
| [Falco](https://falco.org/) ([GitHub](https://github.com/falcosecurity/falco)) | CNCF-graduated runtime security: eBPF/syscall-based real-time detection of anomalous behavior in containers/hosts/K8s. | Runtime detection (crypto-mining, privilege escalation, exfiltration) that static scanning can't see. |

---

## 11. Compliance Frameworks — What Governs What

Compliance is a floor, not a ceiling. Know which regime applies so security requirements and data handling are scoped correctly from day one.

| Framework | Governs / applies when | Why it matters |
|---|---|---|
| [SOC 2 — AICPA Trust Services Criteria](https://www.aicpa-cima.com/resources/landing/system-and-organization-controls-soc-suite-of-services) | Service orgs handling customer data; audited against Security (required) + Availability, Processing Integrity, Confidentiality, Privacy. | The report B2B/SaaS buyers ask for; its Common Criteria (CC1–CC9) shape control design. |
| [ISO/IEC 27001:2022](https://www.iso.org/standard/27001) | Any org wanting a certified Information Security Management System (ISMS). | The globally recognized ISMS certification; risk-based and process-oriented (Annex A controls). |
| [PCI DSS v4.0.1](https://www.pcisecuritystandards.org/standards/pci-dss/) | Anyone that stores, processes, or transmits cardholder data. | Prescriptive and mandatory for payments; v4 requires MFA into the cardholder data environment. |
| [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html) | US covered entities & business associates handling electronic PHI. | Mandates administrative, physical, and technical safeguards for health data (45 CFR Part 164). |
| [GDPR (Reg. EU 2016/679)](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng) ([readable text](https://gdpr-info.eu/)) | Processing personal data of people in the EU/EEA, wherever you're based. | Drives data minimization, lawful basis, breach notification, and data-subject rights — architectural, not just legal. |

---

## 12. Detection & Response

You will be breached; design to detect fast and recover cleanly. Log security-relevant events in a standard vocabulary, centralize them, and rehearse the response.

| Resource | What it is | Why it matters |
|---|---|---|
| [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) + [Logging Vocabulary](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Vocabulary_Cheat_Sheet.html) | What security events to log (and what to *never* log), plus a standard event vocabulary for alerting. | Consistent, standardized logs are the precondition for any useful SIEM detection/alerting. |
| [NIST SP 800-61 Rev. 3 — Incident Response (CSF 2.0)](https://csrc.nist.gov/pubs/sp/800/61/r3/final) ([Rev. 2](https://csrc.nist.gov/pubs/sp/800/61/r2/final)) | The authoritative IR lifecycle: preparation, detection & analysis, containment/eradication/recovery, post-incident lessons. | The playbook everyone builds their IR process on; cite it when designing on-call/runbooks. |
| [MITRE ATT&CK](https://attack.mitre.org/) | (See §2) technique catalog. | Doubles as a detection-engineering map: build alerts against specific techniques and measure coverage. |
| [*Building Secure and Reliable Systems* (Google/O'Reilly, free)](https://google.github.io/building-secure-and-reliable-systems/raw/toc.html) ([landing](https://sre.google/books/)) | 500-page book from Google security + SRE on designing, implementing, and operating systems that are secure *and* reliable. | The best single deep reference on how the two disciplines intersect — design, testing, incident response, culture. |

---

## 13. Real-World Architecture Case Studies

Primary-source writeups of how large orgs actually implement the patterns above.

| Case study | What it demonstrates | Source |
|---|---|---|
| **Airbnb Himeji** | A centralized, Zanzibar-based authorization system: fan-out-on-write, tiered cache, ~850k entity checks/sec at 99.999% availability and 12 ms p99. | [Airbnb Tech Blog — *Himeji: a scalable centralized system for authorization*](https://medium.com/airbnb-engineering/himeji-a-scalable-centralized-system-for-authorization-at-airbnb-341664924574) |
| **Google Zanzibar → OpenFGA** | The relationship-tuple + consistency-token (Zookie) model behind Google's global authz — now open-sourced so you can adopt the pattern. | [OpenFGA — *What is Google Zanzibar?*](https://openfga.dev/docs/learn/zanzibar) |
| **Google BeyondCorp** | Zero trust for the workforce: access decisions from user + device context, no VPN perimeter — deployed org-wide at Google. | [Google Cloud — BeyondCorp](https://cloud.google.com/beyondcorp) |
| **Google BeyondProd** | Zero trust for production service-to-service traffic: mutual authentication, no inherent trust, code of known provenance. | [Google Cloud — *BeyondProd whitepaper*](https://cloud.google.com/blog/products/identity-security/beyondprod-whitepaper-discusses-cloud-native-security-at-google) |

---

## Apply It — Design Review Checklist

Run a proposed design against these. A "no" is a finding. (See also `checklists/security-review.md`.)

- [ ] **Threat model exists** (STRIDE/PASTA over a current data-flow diagram), trust boundaries marked, top threats have mitigations. (§2)
- [ ] **Secure-by-default:** the out-of-the-box config is the safe config — MFA available, no default passwords, logging on, least privilege. (§1)
- [ ] **No hand-rolled auth or crypto.** AuthN via OIDC; delegated authZ via OAuth 2.1 + RFC 9700; JWTs follow RFC 8725. (§4)
- [ ] **Authorization enforced server-side on every request, at the object level** (defends BOLA); model chosen deliberately (RBAC/ABAC/ReBAC). (§4)
- [ ] **Zero-trust posture:** no trust from network location; service-to-service traffic authenticated + mTLS (e.g. SPIFFE/SPIRE). (§5, §4)
- [ ] **No secrets in code/images/config.** Central secrets manager, least-privilege scope, automated rotation, secret scanning in CI. (§6)
- [ ] **Encryption in transit (TLS 1.3, HSTS) and at rest;** keys in a KMS/HSM; sensitive data minimized/tokenized. (§7)
- [ ] **Input validated, output contextually encoded;** SSRF/CSRF/XSS/SQLi defenses in place; security headers set; rate limiting on public endpoints. (§9)
- [ ] **Supply chain:** SBOM generated, dependencies scanned (OSV/Dependabot), artifacts signed (cosign), build provenance toward a SLSA level. (§8)
- [ ] **Infra hardened** to CIS Benchmarks; IAM least-privilege with no long-lived static credentials; network segmented; containers/K8s scanned (Trivy) + runtime detection (Falco). (§10)
- [ ] **Applicable compliance regime identified** (SOC 2 / ISO 27001 / PCI / HIPAA / GDPR) and its data-handling requirements designed in. (§11)
- [ ] **Detection & response ready:** security events logged in a standard vocabulary and centralized; alerts mapped to ATT&CK; an IR runbook (NIST SP 800-61) exists and has been rehearsed. (§12)
