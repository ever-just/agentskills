---
name: godaddy-api
description: Manage GoDaddy domains and DNS records via the official GoDaddy Developer Portal REST API (developer.godaddy.com). Use when user needs to list domains, update DNS records, check domain availability, or automate domain management tasks.
source: https://developer.godaddy.com/doc/endpoint/domains (Swagger spec)
---

# GoDaddy API — Agent Skill

Manage domains and DNS records through the **official GoDaddy Developer Portal REST API**. Documentation source: [developer.godaddy.com](https://developer.godaddy.com).

## Prerequisites

- **GoDaddy account** with at least **1 domain** (Management/DNS API access requires an active domain)
- **API Key + Secret** — Generate at https://developer.godaddy.com/keys
  - First key created is for OTE (sandbox) testing against `api.ote-godaddy.com`
  - Create a second key for production against `api.godaddy.com`
- **Domain availability API** requires account with **50+ domains**
- **Python 3.9+** with `requests` and `python-dotenv`, **or Node.js 18+** (native `fetch`)

## Authentication

GoDaddy uses SSO key-based auth. Every request includes this header:

```
Authorization: sso-key {API_KEY}:{API_SECRET}
```

For **resellers** operating on behalf of customers, add `X-Shopper-Id` header with the customer's Shopper ID.

### Environment Variables

```bash
export GODADDY_API_KEY="your_key"
export GODADDY_API_SECRET="your_secret"
export GODADDY_API_ENV="production"  # or "ote" for sandbox
```

## Base URLs

| Environment | Base URL | Key Type |
|-------------|----------|----------|
| Production  | `https://api.godaddy.com` | Production key |
| OTE Sandbox | `https://api.ote-godaddy.com` | OTE/test key |

**Note:** The `/v1` prefix is part of each endpoint path, not the base URL.

## API Endpoints Reference (from official Swagger spec)

### Domain Operations

| Method | Path | Operation ID | Purpose |
|--------|------|-------------|---------|
| GET | `/v1/domains` | `list` | List domains for the shopper (max 1000 per page, use `marker` for pagination) |
| GET | `/v1/domains/{domain}` | `get` | Get full domain details (status, nameservers, contacts, expiration) |
| PATCH | `/v1/domains/{domain}` | `update` | Update domain settings (e.g., nameservers, auto-renew) |
| DELETE | `/v1/domains/{domain}` | `cancel` | Cancel a purchased domain |
| GET | `/v1/domains/available` | `available` | Check domain availability (requires 50+ domains on account) |
| GET | `/v1/domains/suggest` | `suggest` | Suggest alternate domain names based on seed/keywords |
| GET | `/v1/domains/tlds` | `tlds` | List TLDs supported for sale |
| GET | `/v1/domains/agreements` | `getAgreement` | Retrieve legal agreements for TLDs |
| POST | `/v1/domains/purchase` | `purchase` | Purchase a domain |
| POST | `/v1/domains/{domain}/renew` | `renew` | Renew a domain |
| POST | `/v1/domains/{domain}/transfer` | `transferIn` | Transfer a domain in |

### DNS Record Operations (primary use case)

| Method | Path | Operation ID | Purpose |
|--------|------|-------------|---------|
| **PATCH** | `/v1/domains/{domain}/records` | `recordAdd` | **Add** records — appends to existing zone |
| **PUT** | `/v1/domains/{domain}/records` | `recordReplace` | **Replace ALL** records in the entire zone |
| **GET** | `/v1/domains/{domain}/records/{type}/{name}` | `recordGet` | Retrieve records by type + name (supports `offset` & `limit` query params) |
| **PUT** | `/v1/domains/{domain}/records/{type}/{name}` | `recordReplaceTypeName` | Replace all records matching type + name |
| **PUT** | `/v1/domains/{domain}/records/{type}` | `recordReplaceType` | Replace all records of a given type |
| **DELETE** | `/v1/domains/{domain}/records/{type}/{name}` | `recordDeleteTypeName` | Delete all records matching type + name |

### DNS Record Types

- **GET/PUT** accept: `A`, `AAAA`, `CNAME`, `MX`, `NS`, `SOA`, `SRV`, `TXT`
- **DELETE** accepts: `A`, `AAAA`, `CNAME`, `MX`, `SRV`, `TXT` (cannot delete `NS` or `SOA`)

### Other Domain Operations

| Method | Path | Purpose |
|--------|------|---------|
| PATCH | `/v1/domains/{domain}/contacts` | Update domain contacts |
| DELETE | `/v1/domains/{domain}/privacy` | Cancel privacy protection |
| POST | `/v1/domains/{domain}/privacy/purchase` | Purchase privacy protection |
| POST | `/v1/domains/{domain}/verifyRegistrantEmail` | Re-send registrant verification email |

## DNS Record Schema (from Swagger `#/definitions/DNSRecord`)

```json
{
  "type": "A",           // REQUIRED — A, AAAA, CNAME, MX, NS, SOA, SRV, TXT
  "name": "api",         // REQUIRED — subdomain label; "@" for zone apex
  "data": "1.2.3.4",     // REQUIRED — IP address, hostname, or text value
  "ttl": 600,            // Optional — seconds (minimum 600)
  "priority": 10,        // MX and SRV only — integer
  "port": 443,           // SRV only — 1-65535
  "protocol": "_tcp",    // SRV only
  "service": "_https",   // SRV only
  "weight": 100          // SRV only — integer
}
```

When using `PUT /records/{type}/{name}`, the body uses `DNSRecordCreateTypeName` which omits `type` and `name` (they're in the URL):

```json
[{ "data": "1.2.3.4", "ttl": 600 }]
```

When using `PUT /records/{type}`, the body uses `DNSRecordCreateType` which omits `type` (it's in the URL):

```json
[{ "name": "api", "data": "1.2.3.4", "ttl": 600 }]
```

## Python Client

```bash
pip install requests python-dotenv
```

```python
"""GoDaddy Developer Portal API client — sourced from developer.godaddy.com Swagger spec."""

import os, time
from typing import Any, Dict, List, Optional
import requests
from dotenv import load_dotenv

load_dotenv()


class GoDaddyClient:
    """Wrapper around the official GoDaddy Domains REST API."""

    BASE_URLS = {
        "production": "https://api.godaddy.com",
        "ote": "https://api.ote-godaddy.com",
    }

    def __init__(
        self,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        environment: str = "production",
        timeout: int = 30,
        shopper_id: Optional[str] = None,
    ) -> None:
        self.api_key = api_key or os.getenv("GODADDY_API_KEY", "")
        self.api_secret = api_secret or os.getenv("GODADDY_API_SECRET", "")
        env = (environment or os.getenv("GODADDY_API_ENV", "production")).lower()
        self.timeout = timeout
        self.base_url = self.BASE_URLS[env]
        self.shopper_id = shopper_id
        self.session = requests.Session()
        if not self.api_key or not self.api_secret:
            raise ValueError("GODADDY_API_KEY and GODADDY_API_SECRET are required.")

    @property
    def _headers(self) -> Dict[str, str]:
        h = {
            "Authorization": f"sso-key {self.api_key}:{self.api_secret}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }
        if self.shopper_id:
            h["X-Shopper-Id"] = self.shopper_id
        return h

    def _request(self, method: str, path: str, **kwargs) -> Any:
        url = f"{self.base_url}{path}"
        resp = self.session.request(
            method, url, headers=self._headers, timeout=self.timeout, **kwargs
        )
        if resp.status_code == 429:
            retry = int(resp.headers.get("Retry-After", 60))
            raise RuntimeError(f"Rate limited. Retry after {retry}s.")
        if not resp.ok:
            raise RuntimeError(f"GoDaddy API {resp.status_code}: {resp.text}")
        if resp.status_code == 204 or not resp.content:
            return None
        return resp.json()

    # ── Domain Operations ──

    def list_domains(self, limit: int = 100, marker: str = None) -> List[Dict]:
        """List domains. Max 1000 per call. Use marker for pagination."""
        params = {"limit": min(limit, 1000)}
        if marker:
            params["marker"] = marker
        return self._request("GET", "/v1/domains", params=params)

    def get_domain(self, domain: str) -> Dict:
        return self._request("GET", f"/v1/domains/{domain}")

    def update_domain(self, domain: str, updates: Dict) -> None:
        """Update domain settings (nameservers, auto-renew, etc.)."""
        self._request("PATCH", f"/v1/domains/{domain}", json=updates)

    def check_availability(self, domain: str) -> Dict:
        """Check if domain is available. Requires 50+ domains on account."""
        return self._request("GET", "/v1/domains/available", params={"domain": domain})

    # ── DNS Record Operations ──

    def list_records(
        self, domain: str, record_type: str = None, name: str = None,
        offset: int = None, limit: int = None,
    ) -> List[Dict]:
        """List DNS records. Filter by type and/or name. Supports pagination."""
        path = f"/v1/domains/{domain}/records"
        if record_type:
            path += f"/{record_type}"
            if name:
                path += f"/{name}"
        params = {}
        if offset is not None:
            params["offset"] = offset
        if limit is not None:
            params["limit"] = limit
        return self._request("GET", path, params=params or None)

    def add_records(self, domain: str, records: List[Dict]) -> None:
        """PATCH — Append records to the zone. Does NOT overwrite existing records.
        Each record needs: type, name, data. Optional: ttl, priority, port, etc."""
        self._request("PATCH", f"/v1/domains/{domain}/records", json=records)

    def replace_all_records(self, domain: str, records: List[Dict]) -> None:
        """PUT /records — DANGER: Replaces the ENTIRE zone. Every record must
        include type, name, and data. Omitted records are deleted."""
        self._request("PUT", f"/v1/domains/{domain}/records", json=records)

    def replace_records_by_type_name(
        self, domain: str, record_type: str, name: str, records: List[Dict]
    ) -> None:
        """PUT /records/{type}/{name} — Replace all records matching type+name.
        Body records only need: data (and optional ttl, priority, etc.)."""
        self._request(
            "PUT", f"/v1/domains/{domain}/records/{record_type}/{name}", json=records
        )

    def replace_records_by_type(
        self, domain: str, record_type: str, records: List[Dict]
    ) -> None:
        """PUT /records/{type} — Replace ALL records of a given type.
        Body records need: name, data (and optional ttl, priority, etc.)."""
        self._request(
            "PUT", f"/v1/domains/{domain}/records/{record_type}", json=records
        )

    def delete_records(self, domain: str, record_type: str, name: str) -> None:
        """DELETE — Remove all records matching type+name.
        Allowed types: A, AAAA, CNAME, MX, SRV, TXT (NOT NS or SOA)."""
        self._request(
            "DELETE", f"/v1/domains/{domain}/records/{record_type}/{name}"
        )
```

### Usage Examples

```python
client = GoDaddyClient()

# List all domains
for d in client.list_domains():
    print(f"{d['domain']} — status: {d['status']}, expires: {d.get('expires', 'N/A')}")

# Get all DNS records
records = client.list_records("example.com")
for r in records:
    print(f"{r['type']:6} {r['name']:20} → {r['data']}  (TTL: {r.get('ttl', 'default')})")

# Get specific records (A records named "api")
api_records = client.list_records("example.com", record_type="A", name="api")

# Add a new A record (does NOT touch existing records)
client.add_records("example.com", [
    {"type": "A", "name": "api", "data": "134.209.221.255", "ttl": 600}
])

# Replace a specific CNAME (only affects CNAME records named "app")
client.replace_records_by_type_name("example.com", "CNAME", "app", [
    {"data": "my-app.netlify.app", "ttl": 3600}
])

# Delete a record
client.delete_records("example.com", "A", "old-api")

# Check domain availability (requires 50+ domains on account)
result = client.check_availability("coolstartup.io")
print(f"Available: {result['available']}, Price: {result.get('price')}")

# Update nameservers
client.update_domain("example.com", {
    "nameServers": ["ns1.cloudflare.com", "ns2.cloudflare.com"]
})
```

## Node.js / TypeScript Client

No dependencies — uses native `fetch` (Node 18+):

```typescript
class GoDaddyClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(
    apiKey = process.env.GODADDY_API_KEY!,
    apiSecret = process.env.GODADDY_API_SECRET!,
    env = process.env.GODADDY_API_ENV || "production",
    shopperId?: string,
  ) {
    this.baseUrl =
      env === "ote"
        ? "https://api.ote-godaddy.com"
        : "https://api.godaddy.com";
    this.headers = {
      Authorization: `sso-key ${apiKey}:${apiSecret}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (shopperId) this.headers["X-Shopper-Id"] = shopperId;
  }

  private async request<T = any>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T | null> {
    const resp = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (resp.status === 429) {
      const retry = resp.headers.get("Retry-After") || "60";
      throw new Error(`Rate limited. Retry after ${retry}s.`);
    }
    if (!resp.ok)
      throw new Error(`GoDaddy ${resp.status}: ${await resp.text()}`);
    if (resp.status === 204) return null;
    const text = await resp.text();
    return text ? JSON.parse(text) : null;
  }

  // ── Domains ──
  listDomains = (limit = 100) =>
    this.request("GET", `/v1/domains?limit=${limit}`);
  getDomain = (domain: string) =>
    this.request("GET", `/v1/domains/${domain}`);
  updateDomain = (domain: string, updates: Record<string, any>) =>
    this.request("PATCH", `/v1/domains/${domain}`, updates);
  checkAvailability = (domain: string) =>
    this.request("GET", `/v1/domains/available?domain=${encodeURIComponent(domain)}`);

  // ── DNS Records ──
  listRecords = (domain: string, type?: string, name?: string) => {
    let path = `/v1/domains/${domain}/records`;
    if (type) path += `/${type}`;
    if (type && name) path += `/${name}`;
    return this.request("GET", path);
  };

  /** PATCH — append records to zone (safe, no overwrites) */
  addRecords = (domain: string, records: Record<string, any>[]) =>
    this.request("PATCH", `/v1/domains/${domain}/records`, records);

  /** PUT /records — DANGER: replaces ENTIRE zone */
  replaceAllRecords = (domain: string, records: Record<string, any>[]) =>
    this.request("PUT", `/v1/domains/${domain}/records`, records);

  /** PUT /records/{type}/{name} — replace records matching type+name only */
  replaceRecordsByTypeName = (
    domain: string, type: string, name: string, records: Record<string, any>[],
  ) =>
    this.request("PUT", `/v1/domains/${domain}/records/${type}/${name}`, records);

  /** PUT /records/{type} — replace ALL records of a given type */
  replaceRecordsByType = (
    domain: string, type: string, records: Record<string, any>[],
  ) =>
    this.request("PUT", `/v1/domains/${domain}/records/${type}`, records);

  /** DELETE — remove all records matching type+name */
  deleteRecords = (domain: string, type: string, name: string) =>
    this.request("DELETE", `/v1/domains/${domain}/records/${type}/${name}`);
}
```

## curl Examples

```bash
# Auth header for all requests
AUTH="Authorization: sso-key $GODADDY_API_KEY:$GODADDY_API_SECRET"
BASE="https://api.godaddy.com"

# ── Domain Operations ──

# List domains
curl -s -H "$AUTH" "$BASE/v1/domains?limit=100" | jq '.[].domain'

# Get domain details
curl -s -H "$AUTH" "$BASE/v1/domains/example.com" | jq

# Update nameservers
curl -X PATCH -H "$AUTH" -H "Content-Type: application/json" \
  "$BASE/v1/domains/example.com" \
  -d '{"nameServers":["ns1.cloudflare.com","ns2.cloudflare.com"]}'

# Check availability (requires 50+ domains on account)
curl -s -H "$AUTH" "$BASE/v1/domains/available?domain=coolstartup.io" | jq

# ── DNS Record Operations ──

# List ALL DNS records for a domain
curl -s -H "$AUTH" "$BASE/v1/domains/example.com/records" | jq

# List only A records
curl -s -H "$AUTH" "$BASE/v1/domains/example.com/records/A" | jq

# Get specific record by type+name
curl -s -H "$AUTH" "$BASE/v1/domains/example.com/records/A/api" | jq

# ADD a record (PATCH — safe, appends to zone)
curl -X PATCH -H "$AUTH" -H "Content-Type: application/json" \
  "$BASE/v1/domains/example.com/records" \
  -d '[{"type":"A","name":"api","data":"1.2.3.4","ttl":600}]'

# REPLACE a specific record by type+name (PUT)
curl -X PUT -H "$AUTH" -H "Content-Type: application/json" \
  "$BASE/v1/domains/example.com/records/CNAME/app" \
  -d '[{"data":"my-app.netlify.app","ttl":3600}]'

# REPLACE all A records (PUT /records/{type})
curl -X PUT -H "$AUTH" -H "Content-Type: application/json" \
  "$BASE/v1/domains/example.com/records/A" \
  -d '[{"name":"@","data":"1.2.3.4","ttl":600},{"name":"api","data":"5.6.7.8","ttl":600}]'

# DELETE record by type+name
curl -X DELETE -H "$AUTH" "$BASE/v1/domains/example.com/records/A/old-api"

# Add SRV record
curl -X PATCH -H "$AUTH" -H "Content-Type: application/json" \
  "$BASE/v1/domains/example.com/records" \
  -d '[{"type":"SRV","name":"_https._tcp","data":"target.example.com","port":443,"priority":10,"weight":100,"ttl":600,"protocol":"_tcp","service":"_https"}]'
```

## Common Patterns

### Point subdomain to a new server IP
```python
client.replace_records_by_type_name("mysite.com", "A", "api", [
    {"data": "NEW_SERVER_IP", "ttl": 600}
])
```

### Add a Netlify CNAME for frontend
```python
client.add_records("mysite.com", [
    {"type": "CNAME", "name": "app", "data": "my-app.netlify.app", "ttl": 3600}
])
```

### Add email DNS (MX + SPF + DKIM)
```python
# Set MX record (replaces existing MX for root)
client.replace_records_by_type_name("mysite.com", "MX", "@", [
    {"data": "inbound-smtp.us-east-2.amazonaws.com", "priority": 10, "ttl": 3600}
])
# Add SPF TXT record
client.add_records("mysite.com", [
    {"type": "TXT", "name": "@", "data": "v=spf1 include:amazonses.com ~all", "ttl": 3600}
])
```

### Switch nameservers to Cloudflare
```python
client.update_domain("mysite.com", {
    "nameServers": ["ns1.cloudflare.com", "ns2.cloudflare.com"]
})
```

### Batch add multiple records safely
```python
import time

records_to_add = [
    {"type": "A", "name": "api", "data": "1.2.3.4", "ttl": 600},
    {"type": "CNAME", "name": "app", "data": "my-app.netlify.app", "ttl": 3600},
    {"type": "TXT", "name": "@", "data": "v=spf1 include:amazonses.com ~all", "ttl": 3600},
    {"type": "MX", "name": "@", "data": "mail.example.com", "priority": 10, "ttl": 3600},
]
# Single PATCH call adds all records at once — no rate limit concern
client.add_records("mysite.com", records_to_add)
```

## Rate Limits & Access Restrictions

| Restriction | Limit |
|------------|-------|
| **Requests per minute** | 60 per endpoint |
| **Zone record limit (standard DNS)** | 500 records per zone |
| **Zone record limit (premium DNS)** | 1,500 records per zone |
| **GET /records limit param** | Max 500 records per response |
| **GET /domains limit param** | Max 1,000 domains per response |
| **Availability API access** | Requires 50+ domains on account |
| **DNS/Management API access** | Requires 1+ domain on account |

When rate limited, the API returns `429 Too Many Requests` with a `Retry-After` header.

## Pitfalls & Critical Warnings

1. **PATCH adds, PUT replaces** — `PATCH /records` safely appends. `PUT /records` replaces the **ENTIRE zone** (will delete any records not in the request body). `PUT /records/{type}/{name}` replaces only the matching records. Always prefer `PATCH` to add and `PUT /records/{type}/{name}` to update specific records.

2. **TTL minimum is 600** — API returns 422 if you set a lower TTL.

3. **Cannot delete NS or SOA** — The DELETE endpoint only accepts `A`, `AAAA`, `CNAME`, `MX`, `SRV`, `TXT`.

4. **OTE keys ≠ Production keys** — Test keys only work against `api.ote-godaddy.com`. Production keys only against `api.godaddy.com`. They are not interchangeable.

5. **Root domain = `@`** — Use `@` as the `name` field for the zone apex (e.g., `example.com` itself).

6. **No CNAME at root** — GoDaddy does not support `CNAME` at `@`. Use an `A` record instead, or delegate nameservers to a provider that supports CNAME flattening (e.g., Cloudflare).

7. **API access restricted in 2024** — GoDaddy silently restricted DNS API access. You must have at least one domain on the account. The Availability API requires 50+ domains.

8. **PUT /records/{type}/{name} body schema** — The body does NOT include `type` or `name` fields (they're in the URL path). Only send `data`, `ttl`, etc.

9. **Rate limiting in batch operations** — If you need to make many calls, add a 1-second delay between requests. A single `PATCH` call can add multiple records at once (preferred over multiple calls).

10. **2FA blocks some operations** — Updating nameservers on "protected" or "high-value" domains may require 2FA, which is **not supported via the API**. You must do this in the GoDaddy web UI.

## HTTP Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success (with response body) |
| 204 | Success (no content — DELETE, some PUTs) |
| 400 | Malformed request |
| 401 | Invalid or missing authentication |
| 403 | Authenticated but not authorized |
| 404 | Domain or resource not found |
| 409 | Domain not eligible for this operation |
| 422 | Validation error (invalid domain, bad schema, TTL too low) |
| 429 | Rate limited — check `Retry-After` header |
| 500 | GoDaddy internal server error |
| 504 | Gateway timeout |
