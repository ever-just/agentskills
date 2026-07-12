# Open Standards — Conform, Don't Invent

The canonical specs, RFCs, and conventions a production system should conform to.
Default to these; deviating from a widely-adopted standard is a decision to
justify in the design doc, not a starting point. Prefer the primary source
(rfc-editor.org, w3.org, the spec's official site, the standards body) over
blog summaries.

**Selection rule (memorize this):** REST → **OpenAPI 3.1**; events → **AsyncAPI
3.0** + **CloudEvents** envelope; internal RPC → **gRPC/Protobuf**; browser/BFF
graphs → **GraphQL**; and **JSON Schema 2020-12** is the type grammar sitting
under OpenAPI, AsyncAPI, and LLM tool-calling alike — learn it once, reuse
everywhere.

---

## 1. API description & contracts

| Need | Standard | When / why |
|---|---|---|
| REST / HTTP API contract | [OpenAPI 3.1](https://spec.openapis.org/oas/v3.1.0.html) ([OAI](https://www.openapis.org/)) | The dominant REST description format; JSON/YAML. 3.1 is a full JSON Schema 2020-12 dialect. Codegen, mock, validate, doc from one file. |
| Event / message-driven API | [AsyncAPI 3.0](https://www.asyncapi.com/) ([spec repo](https://github.com/asyncapi/spec)) | OpenAPI's counterpart for Kafka/AMQP/MQTT/WebSocket. Describes channels, operations, message payloads. Collaborative with OpenAPI, not a competitor. |
| Shared type / validation grammar | [JSON Schema 2020-12](https://json-schema.org/) ([draft](https://json-schema.org/draft/2020-12/schema)) | The grammar under OpenAPI 3.1, AsyncAPI, config files, and LLM tool schemas. The single most reusable thing in this file. |
| Service-to-service RPC | [gRPC](https://grpc.io/docs/what-is-grpc/introduction/) + [Protocol Buffers](https://protobuf.dev/) | High-throughput internal RPC over HTTP/2; Protobuf IDL + compact binary wire format + streaming. |
| Protobuf tooling & conventions | [Buf](https://buf.build/) + [Buf style guide](https://buf.build/docs/best-practices/style-guide/) ([bufbuild/buf](https://github.com/bufbuild/buf)) | Modern replacement for raw `protoc`: lint, breaking-change detection, formatting, schema registry. Adopt the style guide so `.proto` stays evolvable. |
| Browser/mobile gRPC | [gRPC-Web](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md) ([grpc-web](https://github.com/grpc/grpc-web)) · [Connect](https://connectrpc.com/) | Browsers can't speak raw gRPC. gRPC-Web (needs a proxy) or Connect (works on HTTP/1.1 & HTTP/2, browser-native, gRPC-compatible) bridge the gap. |
| Client-shaped query graph | [GraphQL](https://spec.graphql.org/) | Client requests exactly the fields it needs; good for aggregating BFFs and mobile. |
| Federated GraphQL across teams | [Apollo Federation](https://www.apollographql.com/docs/graphos/schema-design/federated-schemas/federation) · [Open Federation](https://open-federation.org/) | Compose many subgraphs into one supergraph without a monolith resolver. |
| Protocol-agnostic service IDL | [Smithy 2.0](https://smithy.io/) ([spec](https://smithy.io/2.0/spec/index.html)) | AWS's IDL: define a service once, generate OpenAPI/clients/servers; extensible traits, standards enforcement. |
| Typed API design in code | [TypeSpec](https://typespec.io/) | Microsoft's concise language for describing APIs; emits OpenAPI 3.x, JSON Schema, Protobuf. Good when you'd rather author types than YAML. |
| REST response conventions | [JSON:API 1.1](https://jsonapi.org/) | Opinionated envelope for resources, relationships, pagination, sparse fieldsets — stops every team reinventing list/error shapes. |
| Hypermedia links | [HAL](https://stateless.group/hal_specification.html) ([IETF draft](https://datatracker.ietf.org/doc/html/draft-kelly-json-hal)) | Minimal `_links`/`_embedded` convention when you want HATEOAS without JSON:API's full weight. |
| OpenAPI linting / governance | [Redocly CLI](https://github.com/Redocly/redocly-cli) · Spectral | Enforce naming, security, and consistency rules in CI; generate docs. Pair with a schema registry (Buf Schema Registry, Confluent) to version and gate breaking changes. |

---

## 2. Events, messaging & webhooks

| Need | Standard | When / why |
|---|---|---|
| Vendor-neutral event envelope | [CloudEvents](https://cloudevents.io/) (CNCF) ([spec](https://github.com/cloudevents/spec)) | Common metadata envelope (`id`, `source`, `type`, `time`, `data`) so events stay portable across buses and clouds. CloudEvents describes the *message*; AsyncAPI describes the *API*. |
| Event API description | [AsyncAPI 3.0](https://www.asyncapi.com/) | See §1 — the contract for channels, operations, and payloads. |
| Outbound webhooks (secure, consistent) | [Standard Webhooks](https://www.standardwebhooks.com/) ([spec repo](https://github.com/standard-webhooks/standard-webhooks)) | Cross-industry convention (OpenAI, Anthropic, Kong, Svix…) for signed, verifiable, replay-resistant webhooks. Reference SDKs for signature verification. |
| Event delivery over HTTP | [CloudEvents HTTP Webhook](https://github.com/cloudevents/spec/blob/main/cloudevents/http-webhook.md) | Defines the delivery method, an authorization model, and a registration/validation handshake that protects receivers from being used to flood third parties. |

---

## 3. HTTP & web protocols

| Need | Standard | When / why |
|---|---|---|
| HTTP semantics (methods, status, headers) | [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html) | Version-independent core: methods, status codes, `Retry-After`, conditional/range requests, auth framework. The reference for "what does 429/409/412 mean". |
| HTTP caching | [RFC 9111](https://www.rfc-editor.org/rfc/rfc9111.html) | `Cache-Control`, `ETag`, freshness/validation. Get this right before adding a CDN. |
| HTTP/1.1 wire format | [RFC 9112](https://www.rfc-editor.org/rfc/rfc9112.html) | Text framing over TCP/TLS. |
| HTTP/2 | [RFC 9113](https://www.rfc-editor.org/rfc/rfc9113.html) | Binary framing, multiplexed streams, HPACK header compression. |
| HTTP/3 | [RFC 9114](https://www.rfc-editor.org/rfc/rfc9114.html) | HTTP over QUIC — drops head-of-line blocking. |
| QUIC transport | [RFC 9000](https://www.rfc-editor.org/rfc/rfc9000.html) | UDP-based, multiplexed, always-encrypted transport under HTTP/3. |
| (all HTTP specs, one index) | [httpwg.org/specs](https://httpwg.org/specs/) | The HTTP Working Group's canonical list. |
| Bidirectional sockets | [WebSocket — RFC 6455](https://www.rfc-editor.org/rfc/rfc6455.html) ([WHATWG API](https://websockets.spec.whatwg.org/)) | Full-duplex over a single TCP connection; RFC 6455 is the wire protocol, WHATWG defines the browser API. |
| Server→client streaming | [Server-Sent Events](https://html.spec.whatwg.org/multipage/server-sent-events.html) (WHATWG HTML) | One-way event stream over plain HTTP; simpler than WebSocket when you only push. |
| Low-latency datagrams/streams | [WebTransport](https://www.w3.org/TR/webtransport/) (W3C) | Newer HTTP/3-based transport for realtime; multiple streams + unreliable datagrams. |
| Machine-readable errors | [Problem Details — RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html) | `application/problem+json`. Obsoletes RFC 7807; adds multiple-problem and a type registry. Use this instead of a bespoke error shape. |
| Rate-limit signaling | [RateLimit header fields](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/) (IETF draft) | Standard `RateLimit`/`RateLimit-Policy` headers so clients can back off instead of hammering. |
| Safe retries on writes | [Idempotency-Key](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/) (IETF draft) | Client-supplied key makes POST/PATCH fault-tolerant; the pattern Stripe/PayPal use. Pairs with `Retry-After` (RFC 9110). |
| Cross-origin requests | [Fetch Standard / CORS](https://fetch.spec.whatwg.org/) (WHATWG) | The living definition of CORS and request semantics; the old W3C CORS Recommendation is superseded by this. |
| Content injection defense | [Content Security Policy Level 3](https://www.w3.org/TR/CSP3/) (W3C) | Restrict script/resource origins to blunt XSS. See `references/02-security.md`. |
| Force HTTPS | [HSTS — RFC 6797](https://www.rfc-editor.org/rfc/rfc6797.html) | `Strict-Transport-Security` header pins clients to HTTPS. |

---

## 4. Identity, authn & authz

> Auth **implementation** guidance (flows, token handling, attacks) lives in
> `references/02-security.md`. This section is the standards index.

| Need | Standard | When / why |
|---|---|---|
| Delegated authorization | [OAuth 2.0 — RFC 6749](https://www.rfc-editor.org/rfc/rfc6749.html) → [OAuth 2.1](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/) ([oauth.net](https://oauth.net/2.1/)) | Never hand-roll auth. OAuth 2.1 consolidates 2.0 + a decade of BCPs (PKCE mandatory, implicit grant dropped). |
| OAuth security baseline | [Security BCP — RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html) | Best current practice: PKCE everywhere, sender-constrained tokens, no implicit grant, mix-up/replay defenses. |
| Public-client code protection | [PKCE — RFC 7636](https://www.rfc-editor.org/rfc/rfc7636.html) | Proof Key for Code Exchange — required for mobile/SPA and now for all clients under 2.1. |
| Input-constrained device login | [Device Authorization Grant — RFC 8628](https://www.rfc-editor.org/rfc/rfc8628.html) | TVs, CLIs, IoT: authorize on a second device via a user code. |
| Sender-constrained tokens | [DPoP — RFC 9449](https://www.rfc-editor.org/rfc/rfc9449.html) · [mTLS — RFC 8705](https://www.rfc-editor.org/rfc/rfc8705.html) | Bind access tokens to a key/certificate so a stolen token is useless. |
| Harden the authorization request | [PAR — RFC 9126](https://www.rfc-editor.org/rfc/rfc9126.html) ([oauth.net](https://oauth.net/2/pushed-authorization-requests/)) | Push request params back-channel instead of in the browser URL. |
| Federated login / SSO | [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html) ([all specs](https://openid.net/developers/specs/)) | Identity layer on OAuth 2.0 — ID tokens + UserInfo. The modern SSO default. |
| Enterprise XML SSO | [SAML 2.0](https://www.oasis-open.org/standard/saml/) (OASIS) ([overview](https://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html)) | Still required for many enterprise IdPs; know it even if OIDC is preferred for new work. |
| Tokens | [JWT — RFC 7519](https://www.rfc-editor.org/rfc/rfc7519.html) + [JWT BCP — RFC 8725](https://www.rfc-editor.org/rfc/rfc8725.html) | Follow the BCP — JWT has many footguns (`alg:none`, weak validation). |
| JWT crypto primitives (JOSE) | [JWS 7515](https://www.rfc-editor.org/rfc/rfc7515.html) · [JWE 7516](https://www.rfc-editor.org/rfc/rfc7516.html) · [JWA 7518](https://www.rfc-editor.org/rfc/rfc7518.html) · [JWK 7517](https://www.rfc-editor.org/rfc/rfc7517.html) | Signing, encryption, algorithms, key format under JWT. Publish public keys as a JWKS. |
| OAuth access-token format | [JWT Profile — RFC 9068](https://www.rfc-editor.org/rfc/rfc9068.html) | Interoperable claim set for JWT access tokens. |
| User/group provisioning | [SCIM — RFC 7643](https://www.rfc-editor.org/rfc/rfc7643.html) (schema) + [RFC 7644](https://www.rfc-editor.org/rfc/rfc7644.html) (protocol) ([scim.cloud](https://scim.cloud/)) | Standard CRUD API so enterprise IdPs can auto-provision/deprovision users into your app. |
| Passwordless / phishing-resistant | [WebAuthn L2](https://www.w3.org/TR/webauthn-2/) / [L3](https://www.w3.org/TR/webauthn-3/) (W3C) · [FIDO2](https://fidoalliance.org/specifications/) · [passkeys](https://passkeys.dev/docs/reference/specs/) | Public-key credentials in the browser/platform; WebAuthn + CTAP = FIDO2, surfaced to users as passkeys. |
| Workload identity (zero trust) | [SPIFFE](https://github.com/spiffe/spiffe/blob/main/standards/SPIFFE.md) ([spec index](https://spiffe.io/docs/latest/spiffe-specs/)) | Cryptographic identity (SPIFFE ID + SVID via the Workload API) for services in dynamic infra; underpins mTLS meshes. |

---

## 5. Observability

| Need | Standard | When / why |
|---|---|---|
| Traces / metrics / logs (wire + SDK) | [OpenTelemetry](https://github.com/open-telemetry/opentelemetry-specification) ([opentelemetry.io](https://opentelemetry.io/)) | The vendor-neutral observability standard: instrument once, export anywhere (OTLP). See `references/07-product-layers.md`. |
| Consistent attribute names | [OTel Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/) ([repo](https://github.com/open-telemetry/semantic-conventions)) | Standard span/metric attribute names for HTTP, DB, messaging, RPC, gen-AI — so dashboards work across services. |
| Metrics exposition format | [OpenMetrics](https://prometheus.io/docs/specs/om/open_metrics_spec/) (Prometheus) | The Prometheus text exposition format, standardized. What a `/metrics` endpoint should emit. |
| Trace propagation across services | [W3C Trace Context](https://www.w3.org/TR/trace-context/) | `traceparent`/`tracestate` headers so a trace survives service hops. |
| Contextual key/values on a request | [W3C Baggage](https://www.w3.org/TR/baggage/) | Propagate app-defined context (tenant, request-class) alongside the trace. Keep it small. |
| Structured logs | JSON logs + OTel log data model | Emit machine-parseable JSON with trace/span IDs; the OTel spec covers the log signal and its correlation to traces. |

---

## 6. Data & serialization formats

| Need | Standard | When / why |
|---|---|---|
| Text data interchange | [JSON — RFC 8259](https://www.rfc-editor.org/rfc/rfc8259.html) (STD 90) | The default API/config payload. |
| Human-authored config | [YAML 1.2.2](https://yaml.org/spec/1.2.2/) ([yaml.org](https://yaml.org/)) | Config/manifests; know the footguns (Norway problem, tabs, anchors). |
| Tabular text | [CSV — RFC 4180](https://www.rfc-editor.org/rfc/rfc4180.html) | The only thing resembling a CSV standard — cite it to settle quoting/newline disputes. |
| Schema'd binary records | [Apache Avro](https://avro.apache.org/) ([spec](https://avro.apache.org/docs/1.11.1/specification/)) | Row-based, schema-carrying serialization; the default for Kafka + schema registries thanks to strong schema evolution. |
| Efficient RPC binary | [Protocol Buffers](https://protobuf.dev/) | Compact, typed, fast; the gRPC payload format (see §1). |
| Columnar on-disk analytics | [Apache Parquet](https://parquet.apache.org/) ([format](https://github.com/apache/parquet-format)) | Column-oriented storage with compression/encoding; the lakehouse file format. |
| Columnar in-memory | [Apache Arrow](https://arrow.apache.org/) | Zero-copy in-memory columnar layout; the interchange layer between engines. |
| Open table format | [Apache Iceberg](https://iceberg.apache.org/spec/) · [Delta Lake](https://delta.io/) ([protocol](https://github.com/delta-io/delta/blob/master/PROTOCOL.md)) · [Apache Hudi](https://hudi.apache.org/) | ACID transactions, schema evolution, and time travel over Parquet files in object storage. Pick one deliberately — it's a long-lived commitment. |
| Relational query language | [SQL — ISO/IEC 9075](https://www.iso.org/standard/76583.html) | The (paywalled) standard; target Core SQL for portability and treat vendor extensions as such. |
| Resource identifiers | [URI — RFC 3986](https://www.rfc-editor.org/rfc/rfc3986.html) | Syntax for URLs/URNs; the basis for routing, `$ref`, and identity. |
| Timestamps | [RFC 3339](https://www.rfc-editor.org/rfc/rfc3339.html) (profile of ISO 8601) | Store/transmit UTC ISO-8601 timestamps; never invent a date format. |
| Sortable unique IDs | [UUID — RFC 9562](https://www.rfc-editor.org/rfc/rfc9562.html) · [ULID](https://github.com/ulid/spec) | Prefer UUIDv7 (time-ordered, index-friendly) for new IDs; ULID is the lexicographically-sortable alternative. |
| Text encoding | [UTF-8 — RFC 3629](https://www.rfc-editor.org/rfc/rfc3629.html) / Unicode | UTF-8 everywhere. Normalize on input; don't assume ASCII. |

---

## 7. Delivery, versioning & config conventions

| Need | Standard | When / why |
|---|---|---|
| Cloud-portable app baseline | [The Twelve-Factor App](https://12factor.net/) ([repo](https://github.com/twelve-factor/twelve-factor)) | Config-in-env, stateless processes, disposability, dev/prod parity — the baseline for a scalable, portable service. |
| Version the contracts above | [Semantic Versioning](https://semver.org/) | MAJOR.MINOR.PATCH with real breaking-change discipline; the contract clients depend on. |
| Date-based versions | [Calendar Versioning (CalVer)](https://calver.org/) | For apps/OSes with time-based releases where "breaking change" isn't the meaningful axis. |
| Readable release notes | [Keep a Changelog](https://keepachangelog.com/) | A human-first, consistently-structured `CHANGELOG.md`. |
| Machine-parseable history | [Conventional Commits](https://www.conventionalcommits.org/) | Structured commit messages that drive automated semver bumps and changelogs. |
| Feature flags | [OpenFeature](https://openfeature.dev/specification/) ([spec repo](https://github.com/open-feature/spec)) | CNCF vendor-neutral flag-evaluation API/SDK — decouple flags from any one provider. |
| Container images | [OCI Image Spec](https://specs.opencontainers.org/image-spec/) ([repo](https://github.com/opencontainers/image-spec)) | Portable image format so any registry/runtime interoperates. |
| Supply-chain: SBOM | [SPDX](https://spdx.dev/) · [CycloneDX](https://cyclonedx.org/) | Software bill of materials — SPDX leans license/compliance, CycloneDX leans security. See `references/02-security.md`. |
| Supply-chain: build integrity | [SLSA](https://slsa.dev/) ([repo](https://github.com/slsa-framework/slsa)) | Levels for provenance and tamper-resistance of builds. Cross-ref security. |

---

## How to adopt a standard well

- **Take the whole standard, not a vibe of it.** "REST-ish" and "JWT but we
  skip signature checks" are where breaches and integration pain live. If you
  deviate, document *which* clause and *why* in the design doc.
- **Version the contract explicitly** and evolve it backward-compatibly:
  additive changes only within a major version; breaking changes get a new
  version and a deprecation window. Semantic Versioning + Conventional Commits
  make this mechanical.
- **Make the contract the source of truth**, then generate code, mocks, docs,
  and clients from it — don't hand-write both sides and hope they match.
- **Enforce conformance in CI, not review.** Lint specs (Redocly/Spectral for
  OpenAPI, Buf for Protobuf), run **contract tests** (consumer-driven where you
  can), and gate breaking changes with a schema registry or breaking-change
  detector.
- **Pin to a specific spec version** (OpenAPI 3.1, JSON Schema 2020-12, HTTP/2 =
  RFC 9113) so "the standard" can't drift under you.
- **Reuse the grammar underneath.** JSON Schema shows up in OpenAPI, AsyncAPI,
  config validation, and LLM tool-calling — one investment, many payoffs.

### Who maintains these

- **IETF** — the RFC series (HTTP, OAuth, JWT, QUIC, JSON, URI) via an open,
  rough-consensus process; published by the [RFC Editor](https://www.rfc-editor.org/).
- **W3C** — web platform standards (WebAuthn, Trace Context, Baggage, CSP,
  WebTransport, Fetch/CORS with WHATWG).
- **OpenAPI Initiative** — OpenAPI, under the **Linux Foundation**.
- **CNCF** — CloudEvents, OpenTelemetry, OpenFeature, SPIFFE (vendor-neutral,
  graduated/incubating projects).
- **OASIS** (SAML), **Apache Software Foundation** (Avro/Parquet/Arrow/Iceberg/
  Hudi), **ISO/IEC JTC 1** (SQL, and now several OIDC specs).
