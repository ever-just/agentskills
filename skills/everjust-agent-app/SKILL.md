---
name: everjust-agent-app
description: Build or extend "Ever" — the EverJust iOS app that lets a business owner text a Claude agent which operates their EverJust/Odoo workspace over MCP. Use when working on the Ever app (native SwiftUI client + first-party backend), when wiring a mobile/remote client to a tenant's stateless Streamable-HTTP /mcp endpoint with bearer auth, when implementing an LLM tool-use loop over MCP tools, or when you need the human-in-the-loop confirm-gate for destructive/outbound actions (delete, mail_send). Companion to everjust-agent-mcp (the server/tools) and everjust-platform (the tenancy model).
---

# EverJust Agent App ("Ever") — build/extend skill

Ever is a native iOS app where the owner texts a Claude agent in plain English
and the agent does it in their EverJust/Odoo workspace over the tenant's MCP
endpoint, pausing for a tap before anything risky. Source lives in the
`ww.everjust.app` repo under `apps/ever/` (`backend/` = the brain, `ios/` = the
SwiftUI app, `docs/` = the build brief + contract). This skill is the operating
knowledge for building and extending it. For the server and its tools, see
[[everjust-agent-mcp]]; for the tenancy model, [[everjust-platform]].

## The one architecture fact that drives everything

The tenant `/mcp` endpoint is **remote MCP Streamable-HTTP in stateless JSON
mode + bearer auth**: one JSON-RPC message per POST, one JSON reply; `GET` → 405;
notifications → 202 empty; no `Mcp-Session-Id`; **no server→client SSE**. Two
consequences:

1. **stdio MCP clients are useless on iOS** (no subprocesses) — but a remote-HTTP
   client works fine. Do not fork a stdio-first desktop client; do not pull in an
   MCP transport SDK built around SSE/session reconnection. The client is ~100
   lines of POST/parse.
2. **The Anthropic key must never ship in the app binary.** So the agent loop
   runs on a **first-party backend** that holds the Anthropic key and each
   tenant bearer, talks MCP to the tenant, and streams events to the app. The app
   holds only a first-party session token (Keychain).

```
iOS (SwiftUI) ──session token──▶ Ever backend ──Anthropic key──▶ Claude
                                     │  bearer per workspace
                                     └────HTTP + Bearer────▶ https://<tenant>.everjust.app/mcp
```

## The agent loop (backend, per user turn)

1. Once per workspace, cached: `initialize` (capture the **`instructions`**
   string — it is the biggest correctness lever; prepend it verbatim to the
   system prompt), fire `notifications/initialized` (expect 202), `tools/list`
   (cache tools), then call `platform_info` to learn installed apps + admin.
2. Translate MCP tools → Anthropic tools: rename `inputSchema`→`input_schema`,
   pass the JSON-Schema through, and **strip `confirm` from every tool** so the
   model can never self-confirm. Claude's `tool_use.input` is the MCP
   `arguments` unchanged.
3. Run plan/act/observe with `tool_choice={type:auto, disable_parallel_tool_use:true}`
   (one tool per assistant turn). Append the assistant content verbatim
   (preserve `tool_use`/thinking). Feed each tool result back as a `tool_result`.
4. Stop on `end_turn`; enforce a per-turn tool-call cap. On an MCP tool error
   (`isError:true`) feed the text back so Claude adapts — an **`AccessError`
   means the user lacks the right, not a missing record**; say so in the prompt.

## The confirm-gate (the safety spine — do not weaken)

Every write is intercepted **before** any MCP call and surfaced as an approval
card; the loop pauses server-side (keyed by conversation + `tool_use_id`) and
resumes only on an explicit decision. Two categories:

- **Category A — server-confirm-gated:** `delete`, `mail_send`, **all `call`**
  (can't pre-classify read vs mutating), and `update` with **>100 ids**. The
  server refuses these without `{"confirm": true}` and returns a
  `confirm_required` preview. On **Approve**, resend the identical arguments
  **plus `confirm:true`**.
- **Category B — other writes:** `create`, `update` ≤100, `website_*`. Not
  server-gated; gated only by the client write posture. On **Approve**, call with
  **no `confirm` argument** (these tools don't define it).

Invariants (all covered by tests in `backend/tests/`):
- No write hits `/mcp` before an explicit approve.
- The model can't self-confirm (`confirm` stripped from schemas).
- A surprise `confirm_required` (misclassification) is **converted into a card**,
  never auto-confirmed, never fed back to Claude as a `tool_result`.
- A confirmed `mail_send` reports the **true** outcome (Sent / Queued / Blocked)
  read from the result — never "Sent" on a falsy success flag.
- Deny → a synthetic `tool_result` ("user declined") so Claude offers an
  alternative rather than stalling.

## Auth (same as EVERJUST)

EVERJUST has no separate account system — users sign in with their tenant Odoo
email + password (+ optional 2FA) at `<tenant>.everjust.app/web/login`. So the
app authenticates the user against their tenant's Odoo via
`/web/session/authenticate`; the backend then issues a first-party session token
bound to the Odoo identity (`account_id = "<db>:<uid>"`). The Odoo web session
isn't kept — MCP uses the API-key bearer, not the web session. LLM cost is
platform-absorbed (one backend Anthropic key; no metering/BYO-key in v1).
One-step connect is built: `everjust_agent_connect` exposes
`POST /everjust/agent/provision` (JSON-RPC, `auth="none"`) which authenticates
with EVERJUST credentials and mints the role-bounded agent key in one call, so
the backend folds sign-in and connect together (no key paste). Older tenants
without the route return 404 and the app falls back to manual paste.

## Connect / onboarding

The bearer is minted on desktop Odoo (My Preferences → Account Security →
"Connect an AI agent"). v1 path: the user pastes workspace URL + key; the backend
validates by calling `initialize` + `platform_info` and returns the tenant
identity. **If the connected user is an admin, warn loudly** and steer to a
least-privilege bot user (`is_everjust_agent=True`). Error branching: a reachable
endpoint returning **401** → "Check the API key"; a DNS/TLS failure or a
non-JSON-RPC response → "Check the workspace URL". **Do not branch on 404** — a
mistyped-but-resolving tenant returns 401. QR/universal-link handoff needs a
server-side change (see the build brief); design the client to accept a scanned
payload but don't schedule it as client-only work.

## Brand

Apply EverJust: ink `#0b0b0d` on white paper, Space Grotesk (display) + Geist
(body), plainspoken-operator voice — no emoji, no hype. Errors say what happened
and what to do next. iMessage-style thread; writes render as approval cards, not
chat text.

## Gotchas

- Never GET `/mcp` (405). Handle 202 empty notification bodies. One JSON-RPC
  message per POST; no session id.
- Retry idempotent **reads** only — never auto-retry `create`/`update`/`mail_send`
  (double-create/double-send). Add app-level idempotency.
- Model/thinking config is per-model (5-series support `effort`; pre-4.6 models
  use legacy `thinking.budget_tokens` and reject `effort`). Keep model ids in env.
- Run the whole stack keyless for UI dev: `EVER_FAKE_TENANT=1 EVER_MOCK_LLM=1`.

## Cross-references

- [[everjust-agent-mcp]] — the server, its tools, and guardrails.
- [[everjust-platform]] — tenancy, mail platform, business rules.
- Build brief + wire spec: `ww.everjust.app/apps/ever/docs/BUILD_BRIEF.md` and
  `API_CONTRACT.md`.
