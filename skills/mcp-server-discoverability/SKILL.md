---
name: mcp-server-discoverability
description: Make a hosted MCP server (and the REST API behind it) discoverable and usable by AI agents, so agents find and call your tools rather than only humans finding your site. Use this skill whenever the user has an MCP server or a public API and wants AI agents / ChatGPT / Claude to discover and use it, wants to "list our MCP server", "submit to the MCP registry", get into Claude/ChatGPT connector directories, fix "the MCP connection silently fails or won't authenticate", or improve agent-facing (not human) discoverability. Covers the official MCP Registry, the /.well-known OAuth discovery chain that is the #1 silent-fail cause, third-party directories, and writing tool descriptions that rank for agent intent.
license: Complete terms in LICENSE.txt
---

# MCP Server Discoverability (agent-facing)

This is the discovery layer for **AI agents**, distinct from human SEO. When an agent (or a user of Claude/ChatGPT/Cursor) wants a tool to "connect a domain" or "create an invoice", it looks in MCP registries and directories, then connects to your server and authenticates. If any link in that chain is missing, you are invisible or the connection silently fails.

## The funnel, in priority order

### 1. Publish to the Official MCP Registry (do this first)
`registry.modelcontextprotocol.io` is the canonical upstream that mcp.so / Smithery / Glama / PulseMCP mirror. Author a `server.json` (schema in `github.com/modelcontextprotocol/registry`), claim a **reverse-DNS namespace** (e.g. `com.yourdomain/your-server` or `ai.yourdomain/...`) and verify ownership via a **DNS TXT record** (or `io.github.*` via GitHub). One metadata set feeds every downstream directory, so get the name + description right here.

### 2. Implement the OAuth well-known discovery chain (the #1 silent-fail cause)
For a **hosted/remote** MCP server that requires auth, this is a hard MUST and the single most common reason connections "just don't work":
- Return **`401` with `WWW-Authenticate: Bearer resource_metadata="https://mcp.you.com/.well-known/oauth-protected-resource", scope="..."`** on unauthenticated requests.
- Serve **RFC 9728 Protected Resource Metadata** at `/.well-known/oauth-protected-resource` (include `authorization_servers`).
- Serve the OAuth Authorization Server metadata the client is pointed to.
Test with an actual MCP client (Claude Desktop / an agent), not just curl — an auth-gated server that returns a bare 401 with no `WWW-Authenticate` header will fail discovery even though it "works".

### 3. Submit to the first-party connector directories
- **Anthropic Connectors Directory** (via Claude.ai admin settings; needs a Team/Enterprise org, a stable public Privacy Policy URL, per-tool `title` + `readOnlyHint`/`destructiveHint`, and a populated test account + reviewer instructions).
- **OpenAI ChatGPT Apps** submission portal.
These are gated, human-reviewed channels — plan for review time.

### 4. List on the third-party directories
After the registry: **mcp.so, Smithery, Glama, PulseMCP, the GitHub MCP Registry, and awesome-mcp-servers**. Reuse the same `server.json` name everywhere. Smithery: `smithery mcp publish https://mcp.you.com -n yourorg/your-server`.

### 5. Write tool + server descriptions FOR ranking
Agent discovery ranks on your descriptions, so treat them as the SEO layer:
- Give every tool an **intent-phrased description**: what it does, when to use it, inputs/outputs.
- Split **read vs write into separate tools**; annotate each with `title` + `readOnlyHint` or `destructiveHint` (required by the connector reviews and by well-behaved agents).
- Write a concise server `instructions` string for cross-tool context.

### 6. Ship the agent-facing files
- **`/llms.txt`** (and optionally `/llms-full.txt`) — a curated index of docs/API/quickstart. This is the one place llms.txt genuinely helps, because **coding agents** (Cursor, Claude Code, Codex, Cline, Windsurf) fetch it.
- A stable, public **OpenAPI 3.x spec** with descriptive summaries/operationIds + examples.
- Optionally `/.well-known/api-catalog` (RFC 9727).
- **Do NOT** create `/.well-known/ai-plugin.json` — the OpenAI plugin manifest is dead.

## Common pitfalls
- Skipping the registry and only submitting to directories (they mirror the registry — do it first).
- A remote server that returns 401 with no `WWW-Authenticate` header (silent discovery failure).
- Vague tool names/descriptions ("do_thing") that no agent will rank or pick.
- Relying on `ai-plugin.json` (deprecated).
- Confusing this with USING an MCP server — for connecting to and operating an existing MCP/Odoo workspace, that is a different task (e.g. the `everjust-agent-mcp` skill).

## Related skills
Pair with `generative-engine-optimization` (human-side AI discoverability) and `llm-deeplink-widget` (on-site "ask AI" CTA). Together they cover: humans find you in AI answers, and agents find your tools.
