---
name: agent-discoverability
description: Make YOUR product and its MCP server findable and connectable BY third-party AI agents (the publish/register side of agent discovery). Use when the task is to list an MCP server in the official registry.modelcontextprotocol.io plus community directories (mcp.so, Smithery, Glama, PulseMCP); to fix a remote MCP endpoint clients cannot connect to (the OAuth discovery chain: 401 + WWW-Authenticate to /.well-known/oauth-protected-resource per RFC 9728, then /.well-known/oauth-authorization-server per RFC 8414); to serve a capability manifest at /.well-known/agent/mcp.json; or to publish DNS-AID records (SVCB + TXT + _index._agents + TLSA/DANE under DNSSEC) so agents resolve a domain to its MCP endpoint with DNS-native trust, verified with dns-aid verify. Goes deeper on DNS-AID than [[mcp-server-discoverability]]. NOT for connecting to an existing tenant MCP as a client ([[everjust-agent-mcp]]) or search/answer-engine SEO ([[everjust-website-seo]], [[generative-engine-optimization]]).
---

# Agent Discoverability, Agent Skill

Make a product you operate, and specifically **the MCP server it exposes**, discoverable and connectable **by other AI agents**. This is the **publish / register** side of agent discovery: you own an endpoint and you want third-party agents (and the humans directing them) to find it, trust it, and complete an auth handshake against it. It is product-agnostic; `customdomain.ai` is used only as a worked example (its MCP at `https://app.customdomain.ai/mcp`, its docs at `app.customdomain.ai`).

The boundary matters. Connecting to and driving an existing MCP as a **client** is [[everjust-agent-mcp]], not this. Getting a marketing site cited by **search / answer engines** (SEO, JSON-LD, sitemap, IndexNow) is [[everjust-website-seo]], not this. This skill covers only the four surfaces an agent walks to go from "a domain" to "a working MCP session": the **registry listing**, the **OAuth discovery chain**, the **capability manifest**, and **DNS-AID** records.

## When to use this skill

- **List an MCP server in the official registry**, claim a reverse-DNS namespace (e.g. `com.customdomain/*`), prove domain ownership via a DNS TXT record, publish a `server.json`, then mirror the listing to the community directories agents browse (mcp.so, Smithery, Glama, PulseMCP). This is the single highest-leverage lever for "agents find us" in a category nobody owns.
- **Fix a remote MCP that clients "cannot connect to" even though it is up**, almost always a broken OAuth discovery chain: a protected endpoint that does not answer an unauthenticated request with `401` + a `WWW-Authenticate: Bearer` header carrying `resource_metadata`, or a missing `/.well-known/oauth-protected-resource` / `/.well-known/oauth-authorization-server`. Clients cannot start auth, so the connection silently fails.
- **Serve an agent capability manifest**, a `/.well-known/agent/mcp.json` (or equivalent) describing `protocol=mcp`, transport, the tool list, and auth. This is the doc DNS-AID's SVCB `cap=` parameter and directory listings point at.
- **Publish DNS-AID records**, SVCB + TXT + an `_index._agents` TXT + a TLSA/DANE record under a DNSSEC-signed zone, so an agent can resolve `mcp.<domain>` to your endpoint with DNS-native trust, then `dns-aid verify` it.
- **Wire cert rotation to the TLSA record**, if the same system issues and renews the TLS cert AND writes DNS (a custom-domain product does), keep the DANE `TLSA` record in lockstep on every cert rotation. Most operators cannot do this cleanly, so it is a real differentiator, not a checkbox.

**Do NOT use this skill for**, and stop if the task is really:
- **Operating a tenant's MCP as a client**, reading/writing records over someone's existing MCP, minting the Bearer key, driving the tools. That is [[everjust-agent-mcp]] (the connect/consume side). This skill is the opposite direction: making an endpoint YOU own connectable.
- **Search / answer-engine discoverability**, per-page SEO metadata, sitemap/robots, schema.org JSON-LD `sameAs`, IndexNow, getting cited by ChatGPT Search / Perplexity / Google AI Overviews. That is [[everjust-website-seo]]. `llms.txt` also lives there; here it is only a minor complement (see Pitfall 7).
- **Registrar DNS mechanics**, creating the raw TXT/SVCB/TLSA records at the registrar or DNS provider is a means, not the goal; for GoDaddy/Route 53 record CRUD see [[godaddy-api]]. This skill tells you WHICH records to publish and how to verify the chain; it does not re-teach a registrar API.
- **Standing up the MCP server itself**, building the addon/endpoint that answers MCP is platform work ([[everjust-platform]] for the EverJust case). This skill assumes the endpoint exists and makes it *discoverable*.

---

## The four surfaces (what an agent actually walks)

An agent goes from a bare domain to a live MCP session by walking these, roughly in this order. Each is independent: you can ship the registry listing without DNS-AID, or the OAuth chain without a manifest, but a connection only *completes* when the OAuth chain is intact. Publish all four for full coverage.

| Surface | Where it lives | What it answers for the agent | Failure mode if absent |
|---|---|---|---|
| **Official registry listing** | `registry.modelcontextprotocol.io` + mirrors (mcp.so, Smithery, Glama, PulseMCP) | "Does an MCP for this product/category exist, and what is its URL + transport + auth?" | Agents/users never learn the server exists; you are invisible in the directories they browse. |
| **OAuth discovery chain** | the MCP endpoint's `401` + `WWW-Authenticate`, then `/.well-known/oauth-protected-resource` (RFC 9728), then `/.well-known/oauth-authorization-server` (RFC 8414) | "This endpoint needs auth, where do I authenticate, and how?" | Client sees a `401`/`403` with no pointer and gives up. The #1 reason a remote MCP "won't connect" despite being up. |
| **Capability manifest** | `/.well-known/agent/mcp.json` (served over HTTPS) | "What protocol/transport does it speak, what tools does it expose, what auth does it want, before I even connect?" | No pre-connect introspection; DNS-AID `cap=` and directory cards have nothing to point at. |
| **DNS-AID records** | the DNS zone: `SVCB`, `TXT`, `_index._agents.<domain> TXT`, `TLSA`, under DNSSEC | "Resolve this domain to its agent endpoint(s), with DNS-native (DNSSEC + DANE) trust, without trusting a directory." | No DNS-layer discovery; agents that resolve by domain (not by directory) can't find or trust the endpoint. |

`customdomain.ai` worked example used throughout: MCP endpoint `https://app.customdomain.ai/mcp`, base domain `customdomain.ai`, agent host `mcp.customdomain.ai`, reverse-DNS namespace `com.customdomain`.

---

## Recipes

Every command below is copy-pasteable; replace the angle-bracket placeholders. Never commit a real token: use `<CF_API_TOKEN>` / `$CF_API_TOKEN`, `~/.ssh/<deploy-key>.pem`, etc.

### 1. List the MCP server in the official registry (highest leverage)

`registry.modelcontextprotocol.io` is the canonical upstream; the community directories (mcp.so, Smithery, Glama, PulseMCP) mirror or ingest from it and are what agents and users actually browse. You (a) claim a reverse-DNS namespace, (b) prove you own the matching domain via a DNS TXT record, (c) publish a `server.json`.

Author the `server.json` (this is the record other tools render):

```jsonc
{
  "name": "com.customdomain/mcp",
  "description": "Buy, connect, and manage custom domains (DNS + SSL + edge) over MCP.",
  "repository": { "url": "https://github.com/ever-just/customdomain", "source": "github" },
  "version": "1.0.0",
  "remotes": [
    {
      "type": "streamable-http",
      "url": "https://app.customdomain.ai/mcp"
    }
  ]
}
```

Namespace = reverse DNS of the domain you control: own `customdomain.ai`, so claim `com.customdomain/*`. Prove ownership by publishing the TXT record the registry's publisher CLI tells you to (a per-account verification value), e.g.:

```bash
# The publisher flow prints the exact host + value; publish it at your DNS provider.
# Example shape (value comes FROM the CLI, do not invent it):
#   _mcp-registry.customdomain.ai.  TXT  "mcp-verify=<VALUE-FROM-CLI>"

# Then publish (the official CLI is 'mcp-publisher'; auth is DNS-based for the namespace):
mcp-publisher login dns --domain customdomain.ai
mcp-publisher publish            # reads ./server.json in the working dir
```

Then submit / claim the same server on the directories agents browse (each has its own "add server" or GitHub-based submission flow): **mcp.so**, **Smithery** (`smithery.ai`), **Glama** (`glama.ai`), **PulseMCP** (`pulsemcp.com`). Point every listing at the same `https://app.customdomain.ai/mcp` and the same capability manifest URL so they stay consistent. Verify the upstream took by fetching it back (recipe 5).

### 2. Fix / verify the OAuth discovery chain (the #1 silent-failure)

A protected MCP endpoint MUST make an **unauthenticated** request fail in a way the client can follow. The chain is three hops:

1. Endpoint returns **`401 Unauthorized`** with a `WWW-Authenticate: Bearer` header whose `resource_metadata` points at the protected-resource doc:

```
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer resource_metadata="https://app.customdomain.ai/.well-known/oauth-protected-resource"
```

2. `/.well-known/oauth-protected-resource` (RFC 9728, Protected Resource Metadata) names the resource and points at its authorization server(s):

```jsonc
// GET https://app.customdomain.ai/.well-known/oauth-protected-resource
{
  "resource": "https://app.customdomain.ai/mcp",
  "authorization_servers": ["https://auth.customdomain.ai"],
  "bearer_methods_supported": ["header"],
  "scopes_supported": ["mcp:read", "mcp:write"]
}
```

3. `/.well-known/oauth-authorization-server` on that auth server (RFC 8414) exposes the OAuth endpoints the client drives (authorize, token, registration):

```jsonc
// GET https://auth.customdomain.ai/.well-known/oauth-authorization-server
{
  "issuer": "https://auth.customdomain.ai",
  "authorization_endpoint": "https://auth.customdomain.ai/authorize",
  "token_endpoint": "https://auth.customdomain.ai/token",
  "registration_endpoint": "https://auth.customdomain.ai/register",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "code_challenge_methods_supported": ["S256"]
}
```

Test all three hops from the shell before blaming the client:

```bash
# Hop 1: unauthenticated hit MUST be 401 and carry a resource_metadata pointer.
curl -si https://app.customdomain.ai/mcp | grep -i -E 'HTTP/|www-authenticate'
#   expect:  HTTP/1.1 401 ...
#            WWW-Authenticate: Bearer resource_metadata="https://.../.well-known/oauth-protected-resource"

# Hop 2: the protected-resource doc resolves and names an authorization_servers[].
curl -s https://app.customdomain.ai/.well-known/oauth-protected-resource | python3 -m json.tool

# Hop 3: that auth server's metadata resolves and exposes authorize/token endpoints.
curl -s https://auth.customdomain.ai/.well-known/oauth-authorization-server | python3 -m json.tool
```

If hop 1 returns `200` (open), `403` with no header, or a `401` **without** `resource_metadata`, MCP clients cannot start auth. That is the failure, even though the endpoint is "up". Fix the endpoint to emit the header; then the two well-known docs must resolve over HTTPS with valid JSON.

### 3. Serve the capability manifest at /.well-known/agent/mcp.json

A pre-connect capability doc lets agents (and directory crawlers, and DNS-AID's `cap=`) introspect the server without opening a session. Serve it over HTTPS at `/.well-known/agent/mcp.json`:

```jsonc
// GET https://customdomain.ai/.well-known/agent/mcp.json
{
  "protocol": "mcp",
  "name": "com.customdomain/mcp",
  "endpoint": "https://app.customdomain.ai/mcp",
  "transport": "streamable-http",          // or "sse" for the legacy transport
  "auth": {
    "type": "oauth2",
    "protected_resource_metadata": "https://app.customdomain.ai/.well-known/oauth-protected-resource"
  },
  "tools": [
    { "name": "domains_check_availability", "description": "Check if a domain is available." },
    { "name": "domains_suggest",            "description": "Suggest available domains for a query." }
  ],
  "version": "1.0.0"
}
```

Keep the `endpoint`, `transport`, and `auth.protected_resource_metadata` byte-identical to what recipe 1's `server.json` and recipe 2's OAuth chain declare, and a mismatch here is what makes a listing look valid but not connect. This is also the URL you put in the DNS-AID `cap=` parameter (recipe 4), so its SHA-256 must stay stable or you have to re-publish the DNS `cap-sha256`.

### 4. Publish DNS-AID records so agents resolve the domain to the endpoint

DNS-AID (`draft-mozleywilliams-dnsop-dnsaid`, a Linux Foundation / IETF effort for DNS-based Agent Identification and Discovery) lets an agent resolve a domain straight to its agent endpoints with **DNS-native trust** (DNSSEC for authenticity, DANE/TLSA for the endpoint cert), no directory required. The record set for an MCP agent at `mcp.customdomain.ai`:

- **SVCB**, the service binding, with `alpn="mcp"`, `port`, and a `cap=` pointer to the manifest plus a `cap-sha256` of it:

```
mcp.customdomain.ai.  SVCB  1 app.customdomain.ai. alpn="mcp" port=443 \
    cap="https://customdomain.ai/.well-known/agent/mcp.json" \
    cap-sha256="<sha256-of-the-manifest-body>"
```

- **TXT**, machine-readable capabilities + version alongside the SVCB:

```
mcp.customdomain.ai.  TXT  "capabilities=mcp,streamable-http" "version=1.0.0"
```

- **Index**, a zone-level list of the agents you publish, so an agent can enumerate:

```
_index._agents.customdomain.ai.  TXT  "agents=mcp" "v=1"
```

- **TLSA / DANE**, binds the endpoint's TLS cert into DNS so the agent can verify it without a public CA round-trip:

```
_443._tcp.mcp.customdomain.ai.  TLSA  3 1 1 <sha256-of-endpoint-cert-SPKI>
```

- **DNSSEC**, the zone MUST be signed and the **DS record placed at the registrar**, or the AD (Authenticated Data) flag never lights up and the whole chain is untrusted.

Use the reference implementation rather than hand-rolling record math:

```bash
# github.com/infobloxopen/dns-aid-core : Python SDK + CLI + an MCP server, multiple DNS backends.
pip install "dns-aid[cloudflare]"        # backend extra: [cloudflare] / [route53] / [infoblox] / ...

# Publish the record set for the agent (backend creds come from env, never inline):
export CLOUDFLARE_API_TOKEN="$CF_API_TOKEN"
dns-aid publish \
  --domain customdomain.ai \
  --agent mcp \
  --target app.customdomain.ai \
  --alpn mcp --port 443 \
  --cap "https://customdomain.ai/.well-known/agent/mcp.json"
```

**Cert-rotation tie-in (the differentiator).** The `TLSA` hash is the endpoint's cert; the moment the cert rotates, a stale `TLSA` breaks DANE and the agent rejects a *valid* endpoint. If the same system issues and renews the TLS cert AND writes DNS (which a custom-domain product does by design), wire the TLSA update **into the renewal pipeline** so the record changes in the same step as the cert. Most operators run cert renewal and DNS as separate systems and cannot keep these in lockstep, which is exactly why keeping them synced is a real advantage, not a formality.

### 5. Verify the whole thing works end to end

Do not declare done until all four surfaces resolve AND a real client can connect.

```bash
# (a) DNS-AID: checks DNSSEC AD flag, DANE/TLSA, endpoint health; returns a score.
dns-aid verify mcp.customdomain.ai
#   look for: AD flag = true, TLSA match = true, endpoint healthy, non-zero score.

# (b) Registry listing resolves (upstream). Fetch your published record back:
curl -s "https://registry.modelcontextprotocol.io/v0/servers?search=com.customdomain" \
  | python3 -m json.tool
#   expect: your com.customdomain/mcp entry with the right remote URL.

# (c) OAuth chain intact (recipe 2's three hops), quickest smoke:
curl -si https://app.customdomain.ai/mcp | grep -i www-authenticate   # must show resource_metadata=...

# (d) Manifest resolves and its hash matches the DNS cap-sha256:
curl -s https://customdomain.ai/.well-known/agent/mcp.json | sha256sum
#   then: compare to the cap-sha256 you published in the SVCB record.
```

Then do the thing that actually proves it: **connect a real MCP client through the OAuth chain.** Add the server to a client and confirm it walks 401, then protected-resource, then auth-server, then token, then session, and lists the tools:

```bash
# Claude Code, HTTP transport, the client discovers auth via the chain in recipe 2:
claude mcp add --transport http --scope user customdomain https://app.customdomain.ai/mcp
claude mcp list        # 'customdomain' should show connected; its tools appear as mcp__customdomain__*
```

A green `dns-aid verify` and a resolvable registry entry are necessary but not sufficient; the connect test is the only proof the OAuth chain is truly walkable by a client, not just curl.

---

## Pitfalls

1. **"The endpoint is up" is not "the endpoint is connectable."** The overwhelmingly common remote-MCP failure is a broken OAuth discovery chain, not a down server. If an unauthenticated hit returns `200` (accidentally open), a bare `403`, or a `401` **without** the `WWW-Authenticate: Bearer resource_metadata="..."` pointer, no client can start auth, it just fails "cannot connect." Always run recipe 2's three curls before touching anything else. This is hop 1; hops 2 and 3 (`/.well-known/oauth-protected-resource` then `/.well-known/oauth-authorization-server`) must each resolve to valid JSON too.

2. **Do not spend a minute on `/.well-known/ai-plugin.json`.** That is the OpenAI ChatGPT-plugins manifest and it is **deprecated**, no current agent framework discovers MCP through it. The live surfaces are the registry, the OAuth chain, `/.well-known/agent/mcp.json`, and DNS-AID. Serving `ai-plugin.json` is wasted effort and can mislead a reviewer into thinking discovery is handled.

3. **Reverse-DNS namespace must match a domain you can prove you own.** You cannot claim `com.customdomain/*` in the registry without publishing the registry's verification TXT record on `customdomain.ai`. Use the value the publisher CLI prints, do not invent a TXT value or reuse another product's namespace. If ownership verification fails, the publish is rejected; fix the TXT record at the DNS provider ([[godaddy-api]] / your provider) and retry.

4. **DNSSEC + the DS record at the registrar is the load-bearing part of DNS-AID.** Publishing SVCB/TXT/TLSA on an **unsigned** zone gives you records with no trust, `dns-aid verify` will show the AD flag false and score it down, and a strict agent will reject it. Sign the zone AND place the DS record at the registrar; without the DS delegation the chain is broken even though the records "exist."

5. **A rotated TLS cert with a stale TLSA record silently breaks DANE.** The `_443._tcp.<agent>.<domain>` TLSA hash is pinned to the current endpoint cert. If cert renewal and DNS are separate systems (the norm), the TLSA goes stale on every rotation and agents start rejecting a perfectly valid endpoint. Wire the TLSA rewrite into the same renewal step that issues the cert. Where one system owns both (a custom-domain product), this is straightforward and is a genuine differentiator; where it doesn't, at minimum monitor `dns-aid verify` after each renewal.

6. **Keep `endpoint` / `transport` / `auth` identical across all four surfaces.** The `server.json` remote, the `/.well-known/agent/mcp.json` manifest, the OAuth `resource`, and the DNS-AID `cap=`/SVCB target must agree byte-for-byte. A registry listing that points at `/mcp` while the manifest says `/api/mcp`, or a manifest declaring `sse` while the endpoint speaks `streamable-http`, produces a listing that looks published but won't connect, the hardest kind of bug to spot because nothing errors. And when the manifest body changes, its SHA-256 changes, so you must re-publish the DNS `cap-sha256` or DNS-AID verification fails.

7. **`llms.txt` is a weak, complementary signal, not a discovery lever here.** It helps some coding agents find your docs and is a soft signal for chat engines, but it does **not** make an MCP server connectable and is not part of any of the four surfaces above. Ship it if it is cheap, but do not treat it as "agent discoverability handled." Its real home (and the sitemap/robots/JSON-LD story) is [[everjust-website-seo]]; defer depth there.

8. **This is the publish side, not the consume side, don't confuse the two.** If the task is to read/write records over an *existing* MCP with a Bearer key, that is [[everjust-agent-mcp]] and none of these recipes apply. This skill only makes an endpoint YOU own discoverable and connectable. Conversely, the connect test in recipe 5 uses the client flow from [[everjust-agent-mcp]] purely as verification.

9. **Registry listing is not answer-engine visibility.** Getting listed in `registry.modelcontextprotocol.io` and the MCP directories makes you findable by **agents and MCP tooling**; it does nothing for ChatGPT Search / Perplexity / Google AI Overviews citing your marketing pages. Those are separate audiences with separate levers ([[everjust-website-seo]]: SEO metadata, sitemap, JSON-LD `sameAs`, IndexNow). Publishing to one does not cover the other; a full "make us discoverable" ask usually needs both skills.

10. **Verify by connecting, not just by curling.** A resolvable registry entry, a green `dns-aid verify`, and three passing curls are necessary but not sufficient. The only proof the OAuth chain is walkable by an actual client is adding the server to a real MCP client (recipe 5's `claude mcp add`) and confirming it completes auth and lists tools. Stop short of that and you can ship a "discoverable" server that no client can actually use.

## See also

- [[everjust-agent-mcp]], the CONSUME side: connect to and drive an existing tenant MCP as a client (Bearer key, the generic `search`/`get`/`create`/`update`/`call` tools, confirm gates). This skill is the opposite direction.
- [[everjust-website-seo]], search/answer-engine discoverability (per-page metadata, sitemap/robots, schema.org JSON-LD `sameAs`, IndexNow, `llms.txt`). Different audience, different levers; the `llms.txt` depth lives there.
- [[everjust-platform]], platform invariants and where the MCP server addon itself lives; read it if the task is standing up or changing the endpoint, not making an existing one discoverable.
- [[godaddy-api]], registrar/DNS record CRUD (the TXT/SVCB/TLSA/DS records these recipes tell you WHICH to publish); use it for the raw provider API mechanics.
- [[mcp-server-discoverability]] — a shorter registry/directory-submission + auth funnel checklist. It overlaps this skill's registry and OAuth ground; THIS skill goes deeper and adds the DNS-AID record layer (SVCB/TXT/_index._agents/TLSA under DNSSEC) and the capability manifest. Use that for a quick submit, use this for DNS-native discovery and trust.
