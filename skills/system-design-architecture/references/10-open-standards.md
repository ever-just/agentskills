# Open Standards — Conform, Don't Invent

The canonical specs for API and network-adjacent concerns. Default to these;
deviating is a decision to justify in the design doc, not a starting point.

## API description & contracts

| Need | Standard (canonical source) | Notes |
|---|---|---|
| REST API contract | [OpenAPI 3.1](https://github.com/OAI/OpenAPI-Specification) | The most widely adopted API description format; JSON/YAML. Tooling: codegen, mock, validate. |
| Event / message APIs | [AsyncAPI 3.0](https://github.com/asyncapi/spec) | OpenAPI's counterpart for event-driven (Kafka, MQTT, AMQP, WebSocket). Collaborative with OpenAPI, not competitive. |
| Shared type grammar | [JSON Schema 2020-12](https://github.com/json-schema-org/json-schema-spec) | The grammar under OpenAPI/AsyncAPI **and** LLM tool-calling. Learn it once, reuse everywhere. |
| Service-to-service RPC | [gRPC](https://github.com/grpc/grpc) + [Protobuf](https://github.com/protocolbuffers/protobuf) | High-performance internal RPC; Protobuf IDL + wire format. |
| Client-shaped query graphs | [GraphQL spec](https://github.com/graphql/graphql-spec) | Client asks for exactly the fields it needs; good for aggregating BFFs. |
| Common event envelope | [CloudEvents](https://github.com/cloudevents/spec) (CNCF) | Vendor-neutral metadata envelope so events are portable across buses/clouds. Pairs with AsyncAPI (app) — CloudEvents describes the message. |

**Selection rule:** REST → OpenAPI 3.1; events → AsyncAPI 3.0; internal RPC →
gRPC/Protobuf; frontend graphs → GraphQL; JSON Schema is the grammar under all.

## Identity, security & observability standards

| Need | Standard | Notes |
|---|---|---|
| Authorization framework | [OAuth 2.0](https://www.rfc-editor.org/rfc/rfc6749) / [OAuth 2.1](https://oauth.net/2.1/) | Delegated authorization. Never hand-roll. See `references/02-security.md`. |
| Federated identity / login | [OpenID Connect](https://openid.net/developers/specs/) | Identity layer on top of OAuth 2.0. |
| Tokens | [JWT (RFC 7519)](https://www.rfc-editor.org/rfc/rfc7519) + [JWT BCP (RFC 8725)](https://www.rfc-editor.org/rfc/rfc8725) | Follow the best-current-practice RFC — many JWT footguns. |
| Traces / metrics / logs | [OpenTelemetry](https://github.com/open-telemetry/opentelemetry-specification) | The vendor-neutral observability wire standard. See `references/07-product-layers.md`. |
| Trace propagation | [W3C Trace Context](https://www.w3.org/TR/trace-context/) | Standard headers so traces cross service boundaries. |

## Baseline app hygiene

| Standard | Role |
|---|---|
| [The Twelve-Factor App](https://12factor.net/) ([repo](https://github.com/twelve-factor/twelve-factor)) | Config-in-env, stateless processes, disposability, dev/prod parity — the baseline for a cloud-portable, scalable app. |
| [Semantic Versioning](https://semver.org/) · [Keep a Changelog](https://keepachangelog.com/) | Predictable versioning of the contracts above. |

> Auth **implementation** guidance (flows, token handling, common attacks) lives
> in `references/02-security.md`, not here — this file is the standards index.
