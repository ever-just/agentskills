---
name: godaddy-api
description: Manage GoDaddy domains and DNS records programmatically via the GoDaddy REST API. Use when user needs to list domains, update DNS records, check domain availability, or automate domain management tasks.
---

# GoDaddy API — Agent Skill

Manage domains and DNS records through GoDaddy's REST API. Supports both production and OTE (sandbox) environments.

## Prerequisites

- **GoDaddy API Key + Secret** — Generate at https://developer.godaddy.com/keys
  - Production keys for real domains
  - OTE (test) keys for sandbox testing
- **Python 3.9+** with `requests` and `python-dotenv`
- **Or Node.js 18+** with `fetch` (no extra deps)

## Authentication

GoDaddy uses SSO key-based auth. Every request includes:

```
Authorization: sso-key {API_KEY}:{API_SECRET}
```

### Environment Variables

```bash
export GODADDY_API_KEY="your_key"
export GODADDY_API_SECRET="your_secret"
export GODADDY_API_ENV="production"  # or "ote" for sandbox
```

## Base URLs

| Environment | Base URL |
|-------------|----------|
| Production  | `https://api.godaddy.com/v1` |
| OTE Sandbox | `https://api.ote-godaddy.com/v1` |

## Python Client

### Installation

```bash
pip install requests python-dotenv
```

### Client Class

```python
"""Thin GoDaddy REST API client."""

import os
from typing import Any, Dict, List, Optional
import requests
from dotenv import load_dotenv

load_dotenv()


class GoDaddyClient:
    """Lightweight wrapper around GoDaddy's REST endpoints."""

    BASE_URLS = {
        "production": "https://api.godaddy.com/v1",
        "ote": "https://api.ote-godaddy.com/v1",
    }

    def __init__(
        self,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        environment: str = "production",
        timeout: int = 30,
    ) -> None:
        self.api_key = api_key or os.getenv("GODADDY_API_KEY", "")
        self.api_secret = api_secret or os.getenv("GODADDY_API_SECRET", "")
        self.environment = (environment or os.getenv("GODADDY_API_ENV", "production")).lower()
        self.timeout = timeout
        self.base_url = self.BASE_URLS[self.environment]
        self.session = requests.Session()

        if not self.api_key or not self.api_secret:
            raise ValueError("Set GODADDY_API_KEY and GODADDY_API_SECRET.")

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"sso-key {self.api_key}:{self.api_secret}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def _request(self, method: str, path: str, **kwargs) -> Any:
        url = f"{self.base_url}{path}"
        resp = self.session.request(
            method, url, headers=self._headers(), timeout=self.timeout, **kwargs
        )
        if not resp.ok:
            raise RuntimeError(f"GoDaddy API {resp.status_code}: {resp.text}")
        return resp.json() if resp.content else None

    # --- Domain Operations ---

    def list_domains(self) -> List[Dict]:
        """List all domains on the account."""
        return self._request("GET", "/domains")

    def get_domain(self, domain: str) -> Dict:
        """Get details for a single domain."""
        return self._request("GET", f"/domains/{domain}")

    def check_availability(self, domain: str) -> Dict:
        """Check if a domain is available for purchase."""
        return self._request("GET", f"/domains/available", params={"domain": domain})

    # --- DNS Record Operations ---

    def list_records(self, domain: str, record_type: str = None, name: str = None) -> List[Dict]:
        """List DNS records. Optionally filter by type and/or name."""
        path = f"/domains/{domain}/records"
        if record_type:
            path += f"/{record_type}"
            if name:
                path += f"/{name}"
        return self._request("GET", path)

    def add_records(self, domain: str, records: List[Dict]) -> None:
        """Add DNS records. Each record: {type, name, data, ttl}."""
        self._request("PATCH", f"/domains/{domain}/records", json=records)

    def replace_records(self, domain: str, record_type: str, name: str, records: List[Dict]) -> None:
        """Replace all records of a given type+name."""
        self._request("PUT", f"/domains/{domain}/records/{record_type}/{name}", json=records)

    def delete_records(self, domain: str, record_type: str, name: str) -> None:
        """Delete all records matching type+name."""
        self._request("DELETE", f"/domains/{domain}/records/{record_type}/{name}")
```

### Usage Examples

```python
from godaddy_sdk import GoDaddyClient

client = GoDaddyClient()

# List all domains
for d in client.list_domains():
    print(f"{d['domain']} — expires {d['expires']}")

# Get DNS records
records = client.list_records("example.com")
for r in records:
    print(f"{r['type']:6} {r['name']:20} → {r['data']}")

# Add an A record
client.add_records("example.com", [
    {"type": "A", "name": "api", "data": "134.209.221.255", "ttl": 600}
])

# Update/replace a CNAME
client.replace_records("example.com", "CNAME", "app", [
    {"data": "my-app.netlify.app", "ttl": 3600}
])

# Check domain availability
result = client.check_availability("coolstartup.io")
print(f"Available: {result['available']}, Price: {result.get('price')}")

# Delete a record
client.delete_records("example.com", "A", "old-api")
```

## Node.js / TypeScript

No dependencies needed — uses native `fetch`:

```typescript
class GoDaddyClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(
    apiKey = process.env.GODADDY_API_KEY!,
    apiSecret = process.env.GODADDY_API_SECRET!,
    env = process.env.GODADDY_API_ENV || "production"
  ) {
    this.baseUrl = env === "ote"
      ? "https://api.ote-godaddy.com/v1"
      : "https://api.godaddy.com/v1";
    this.headers = {
      Authorization: `sso-key ${apiKey}:${apiSecret}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  private async request(method: string, path: string, body?: any) {
    const resp = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!resp.ok) throw new Error(`GoDaddy ${resp.status}: ${await resp.text()}`);
    return resp.status === 204 ? null : resp.json();
  }

  // Domains
  listDomains = () => this.request("GET", "/domains");
  getDomain = (domain: string) => this.request("GET", `/domains/${domain}`);
  checkAvailability = (domain: string) =>
    this.request("GET", `/domains/available?domain=${domain}`);

  // DNS Records
  listRecords = (domain: string, type?: string, name?: string) => {
    let path = `/domains/${domain}/records`;
    if (type) path += `/${type}`;
    if (type && name) path += `/${name}`;
    return this.request("GET", path);
  };

  addRecords = (domain: string, records: any[]) =>
    this.request("PATCH", `/domains/${domain}/records`, records);

  replaceRecords = (domain: string, type: string, name: string, records: any[]) =>
    this.request("PUT", `/domains/${domain}/records/${type}/${name}`, records);

  deleteRecords = (domain: string, type: string, name: string) =>
    this.request("DELETE", `/domains/${domain}/records/${type}/${name}`);
}
```

## curl Examples

```bash
# Auth header for all requests
AUTH="Authorization: sso-key $GODADDY_API_KEY:$GODADDY_API_SECRET"

# List domains
curl -s -H "$AUTH" "https://api.godaddy.com/v1/domains" | jq '.[] | .domain'

# List all DNS records for a domain
curl -s -H "$AUTH" "https://api.godaddy.com/v1/domains/example.com/records" | jq

# Get specific record type
curl -s -H "$AUTH" "https://api.godaddy.com/v1/domains/example.com/records/A/api" | jq

# Add A record
curl -X PATCH -H "$AUTH" -H "Content-Type: application/json" \
  "https://api.godaddy.com/v1/domains/example.com/records" \
  -d '[{"type":"A","name":"api","data":"1.2.3.4","ttl":600}]'

# Replace CNAME record
curl -X PUT -H "$AUTH" -H "Content-Type: application/json" \
  "https://api.godaddy.com/v1/domains/example.com/records/CNAME/app" \
  -d '[{"data":"my-app.netlify.app","ttl":3600}]'

# Check domain availability
curl -s -H "$AUTH" "https://api.godaddy.com/v1/domains/available?domain=coolstartup.io" | jq
```

## API Endpoints Reference

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1/domains` | List all domains on account |
| GET | `/v1/domains/{domain}` | Get domain details |
| GET | `/v1/domains/available?domain={name}` | Check availability |
| GET | `/v1/domains/{domain}/records` | List all DNS records |
| GET | `/v1/domains/{domain}/records/{type}` | List records by type |
| GET | `/v1/domains/{domain}/records/{type}/{name}` | Get specific record |
| PATCH | `/v1/domains/{domain}/records` | Add records (append) |
| PUT | `/v1/domains/{domain}/records/{type}/{name}` | Replace records |
| DELETE | `/v1/domains/{domain}/records/{type}/{name}` | Delete records |

## DNS Record Format

```json
{
  "type": "A",        // A, AAAA, CNAME, MX, TXT, NS, SRV, CAA
  "name": "api",      // subdomain ("@" for root)
  "data": "1.2.3.4",  // IP, hostname, or text value
  "ttl": 600,         // seconds (minimum 600 for most record types)
  "priority": 10      // only for MX and SRV records
}
```

## Common Patterns

### Dynamic DNS Update (Point subdomain to new server)
```python
client.replace_records("mysite.com", "A", "api", [
    {"data": "NEW_SERVER_IP", "ttl": 600}
])
```

### Add Netlify CNAME for Frontend
```python
client.add_records("mysite.com", [
    {"type": "CNAME", "name": "app", "data": "my-app.netlify.app", "ttl": 3600}
])
```

### Add Email DNS (MX + SPF + DKIM)
```python
client.replace_records("mysite.com", "MX", "@", [
    {"data": "inbound-smtp.us-east-2.amazonaws.com", "priority": 10, "ttl": 3600}
])
client.add_records("mysite.com", [
    {"type": "TXT", "name": "@", "data": "v=spf1 include:amazonses.com ~all", "ttl": 3600}
])
```

## Pitfalls

- **PATCH adds, PUT replaces** — `PATCH /records` appends; `PUT /records/{type}/{name}` overwrites all records of that type+name.
- **TTL minimum is 600** — API rejects lower values.
- **Rate limiting** — GoDaddy enforces rate limits (~60 req/min). Add delays in batch operations.
- **OTE sandbox** — Test keys only work against `api.ote-godaddy.com`. Production keys only against `api.godaddy.com`.
- **Root domain** — Use `@` as the name for the root domain (e.g., `example.com` itself).
- **CNAME at root** — GoDaddy doesn't support CNAME at `@`. Use an A record or ALIAS if needed.
