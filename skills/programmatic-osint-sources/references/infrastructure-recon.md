# Infrastructure recon — domain / IP → subdomains, services, DNS, related infra

Certificate transparency, internet-scan engines, DNS/RDAP/WHOIS, passive DNS, ASN/abuse
contacts, and web-index/history. Keyless-first.

## Certificate transparency (subdomain discovery)

### Cert Spotter — SSLMate  [keyless → free-key]
- **Input → output:** domain → JSON issuances: `dns_names[]`, issuer, SHA-256, validity, revoked.
  `include_subdomains=true&expand=dns_names` → a de-duped subdomain list.
- **Call:** `curl -s 'https://api.certspotter.com/v1/issuances?domain=example.com&include_subdomains=true&expand=dns_names'`
- **Use:** Cleaner and more reliable than crt.sh; paginated (`after=ID`). **Make this the primary
  CT source, crt.sh the fallback.**
- **Caveats:** Default returns only unexpired certs; unauth calls hit HTTP 429 fast — a free key raises limits.

### crt.sh  [keyless]
- **Input → output:** `%.domain` → every CT-logged cert; `name_value` SANs = subdomains (incl.
  internal/staging/dev). Postgres alternative at `crt.sh:5432` (db `certwatch`, user `guest`).
- **Call:** `curl -s -H 'User-Agent: Mozilla/5.0' 'https://crt.sh/?q=%25.example.com&output=json' | jq -r '.[].name_value' | sort -u`
- **Caveats:** Down/flaky often (timeouts/502s) — retry, send a UA. (Also referenced in
  `website-techstack-analysis` / `verification-audit`.)

## Internet-scan engines (IP/domain → services, tech, CVEs)

### Shodan InternetDB  [keyless]
- **Input → output:** IPv4 → `ports[]`, CPEs, `hostnames[]` (reverse-DNS/cert names → co-hosted
  domains), tags, `vulns[]` (CVEs).
- **Call:** `curl -s https://internetdb.shodan.io/1.1.1.1`
- **Use:** Any resolved IP → fast port/tech/CVE fingerprint + mini reverse-IP, zero auth.
- **Caveats:** IP-only (resolve first). Refreshes ~weekly. Shodan states non-commercial use — check ToS.

### urlscan.io — Search API  [keyless → free-key]
- **Input → output:** ES-style query (`page.domain`, `ip`, `hash`) → historical scans: URLs,
  resolved IPs, apexDomain, ASN/org, server tech, third-party domains loaded, cookies, TLS,
  screenshot + DOM.
- **Call:** `curl -s 'https://urlscan.io/api/v1/search/?q=page.domain:example.com&size=100'`
- **Use:** Passive recon on what a site loads — discover the CRM/marketing/analytics domains and IDs
  a target embeds, without touching it.
- **Caveats:** Only covers previously-submitted URLs. **Public scans you submit are searchable by
  anyone** — use `visibility=private` (needs a free key) so you don't leak a target list.

### Censys — Platform Search API  [free-tier → paid]
- **Input → output:** query over hosts/certs/web props → services/banners/software, parsed TLS cert
  names (= subdomains), ASN/org, attack-surface rollups.
- **Call:** `POST https://api.platform.censys.io/v3/global/search/query` (Bearer PAT + org id)
- **Caveats:** Migration in flux (legacy Search deprecates ~Sept 2026). 100 query credits/mo is
  small; a query can cost several.

### Netlas.io  [free-key]
- **Input → output:** domain/IP/FQDN/full-text → DNS, domain+IP WHOIS, TLS certs, HTTP scan
  responses (banners, tech, favicon hashes).
- **Call:** `curl -s -H 'X-API-Key: $NETLAS_KEY' 'https://app.netlas.io/api/domains_search/?q=domain:*.example.com&fields=domain'`
- **Caveats:** Community tier ~50 req/day; deeper history paid.

### ONYPHE  [free-key]
- **Input → output:** IP/domain/FQDN → ports/services, resolvers, TLS certs, geoloc, ASN/org,
  reverse-DNS, exposure categories.
- **Call:** `curl -s -H 'Authorization: bearer $ONYPHE_KEY' 'https://www.onyphe.io/api/v2/summary/domain/example.com'`
- **Caveats:** Free tier: last 30 days, ~10 results/category. Spot pivots, not enumeration.

### FullHunt  [shaky]
- `GET /api/v1/domain/{d}/details` (X-API-KEY) → subdomains + hosts + DNS + ports in one call.
  **Free tier now ~10 credits/month** — evaluation only. · **ZoomEye** `[shaky]` — heavy result
  masking, ~10 searches/day, version churn, data-residency caveats.

## DNS / RDAP / WHOIS + reverse pivots

### RDAP via rdap.org bootstrap  [keyless]
- **Input → output:** domain/IP/ASN → structured JSON: registrar, creation/expiry/updated dates,
  status codes, nameservers, entities (registrar/abuse survive redaction).
- **Call:** `curl -sL https://rdap.org/domain/example.com` · also `rdap.org/ip/1.1.1.1`, `rdap.org/autnum/13335`
- **Use:** Modern JSON-native WHOIS replacement (port-43 WHOIS sunset Jan 2025). One schema across
  TLDs/RIRs.
- **Caveats:** Must follow the redirect (`-L`). Registrant PII redacted for most gTLDs. Some ccTLDs lack RDAP.

### HackerTarget API  [keyless → paid]
- **Input → output:** domain/IP → plaintext/CSV: `hostsearch` (subdomain,IP), `dnslookup`,
  `reverseiplookup` (co-hosted domains), `aslookup`, `httpheaders`.
- **Call:** `curl -s 'https://api.hackertarget.com/hostsearch/?q=example.com'` · reverse IP:
  `curl -s 'https://api.hackertarget.com/reverseiplookup/?q=1.2.3.4'`
- **Use:** Zero-setup shell one-liners for domain→subdomains+IPs and IP→co-hosted domains.
- **Caveats:** Low free cap (~20–50 queries/day by IP); results truncated ~50/req.

### WhoisXML API (WHOIS / DNS / Subdomains / Reverse)  [free-key]
- **Input → output:** domain/IP → parsed WHOIS, DNS, Subdomains Lookup, **Reverse WHOIS** (domains
  by registrant email/org), Reverse IP.
- **Call:** `curl -s 'https://subdomains.whoisxmlapi.com/api/v1?apiKey=$WHOISXML_KEY&domainName=example.com'`
- **Use:** Best free-ish **reverse** pivots — registrant email/org → all their domains ("find
  everything this company owns").
- **Caveats:** 500 credits per product is a **one-time** trial, not monthly.

### ViewDNS.info API  [free-key]
- **Input → output:** domain/IP/owner → `reverseip`, `iphistory` (past hosting — sometimes
  de-cloaks origin IP behind a CDN), `reversewhois`, reverse NS/MX, port scan, DNS.
- **Call:** `curl -s 'https://api.viewdns.info/reverseip/?host=example.com&apikey=$VIEWDNS_KEY&output=json'`
- **Caveats:** Modest monthly budget; reverse-IP on big shared hosts is noisy.

### SecurityTrails  [shaky]
- Historical DNS/subdomains gold, but the free self-serve key appears gated after the
  Recorded Future acquisition — **do not assume a 2026 free tier.**

## Passive DNS / DNS history

### VirusTotal — API v3  [free-key]
- **Input → output:** domain → `/subdomains`, `/resolutions` (passive DNS), WHOIS, sibling domains,
  `/relationships/*`.
- **Call:** `curl -s -H 'x-apikey: $VT_KEY' 'https://www.virustotal.com/api/v3/domains/example.com/subdomains?limit=40'`
- **Use:** Subdomains + passive DNS + WHOIS + siblings under one key — a major infra primitive.
- **Caveats:** Free tier ~4 req/min.

### AlienVault OTX  [free-key]
- **Input → output:** domain → `/passive_dns`, related URLs/indicators/pulses.
- **Call:** `curl -s -H 'X-OTX-API-KEY: $OTX_KEY' 'https://otx.alienvault.com/api/v1/indicators/domain/example.com/passive_dns'`
- Also **Mnemonic PassiveDNS** (`https://api.mnemonic.no/pdns/v3/{query}`, rate-limited, effectively
  keyless) and **DNSlytics** free reverse-IP/analytics tier.

## Network / ASN / abuse contact

### RIPEstat Data API  [keyless]
- **Input → output:** IP/prefix/ASN → dozens of "data calls": `abuse-contact-finder`, `whois`,
  `dns-chain`, `maxmind-geo-lite`, `prefix-overview`, `related-prefixes`, `as-overview`.
- **Call:** `curl -s 'https://stat.ripe.net/data/abuse-contact-finder/data.json?resource=1.2.3.4'`
- **Use:** One keyless surface for infra ownership + **abuse/security contact email** + routing + geo.
- **Caveats:** Structured but verbose — pick the specific data call you need.

### BGPView  [keyless]
- **Input → output:** `https://api.bgpview.io/asn/{asn}` or `/ip/{ip}` → ASN → org, prefixes,
  contact emails, peers.
- **Use:** IP/ASN → owning org + contact emails + all their prefixes.

### PeeringDB  [keyless]
- **Input → output:** `https://www.peeringdb.com/api/net?...` → network operator NOC/policy emails
  and facilities. Great for ISP / hosting / telco targets.

## Web index / historical recon

### Common Crawl Index  [keyless]
- **Input → output:** `url=*.domain` against a monthly crawl → per-URL rows (URL, MIME, status,
  WARC file+offset); fetch page bytes from S3; columnar parquet enables SQL across all crawls.
- **Call:** `curl -s 'https://index.commoncrawl.org/CC-MAIN-2026-30-index?url=*.example.com&output=json&fl=url,mime,status'` (crawl list: `collinfo.json`)
- **Use:** Web-scale subdomain/URL enumeration + page-text harvesting (emails, staff, tech, partner
  links) without crawling the target.
- **Caveats:** Per-monthly-crawl (loop for history); heavy analysis wants S3/Athena. Sampled, not exhaustive.

### Wayback CDX Server API  [keyless]
- `url=*.target.com` → old subdomains/admin paths/staging; fetch archived bodies to recover
  scrubbed emails/staff. (Also referenced in `domain-email-enumeration`.)
- **Call:** `curl -s 'http://web.archive.org/cdx/search/cdx?url=*.example.com&output=json&fl=original&collapse=urlkey&limit=500'`
