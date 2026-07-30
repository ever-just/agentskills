# Breach & credential-exposure data

> **Defensive use.** These assess exposure for a domain/person you're authorized on, or a
> counterparty's risk. Never obtain or reuse others' credentials. Treat any returned plaintext
> as toxic. See the ethics note in [../SKILL.md](../SKILL.md).

Keyless-first, ranked by free-tier richness × programmatic access.

### Hudson Rock — Cavalier OSINT-tools API  [keyless]
- **Input → output:** email / domain / username → JSON on **infostealer-infected-machine** presence
  (30M+ machines): `date_compromised`, computer name, OS, malware path, AV list, masked IP,
  corporate-vs-user service counts, masked top passwords/logins. Domain search returns aggregate
  compromised-employee counts + stealer families.
- **Call:** `curl -s "https://cavalier.hudsonrock.com/api/json/v2/osint-tools/search-by-email?email=target@example.com"`
- **Use:** Uniquely covers **malware/infostealer** exposure (not classic DB dumps) — live
  credential-theft risk for a person or a whole company domain. Keyless, trivial to script.
- **Caveats:** Free endpoint masks passwords/logins/IP; unmasked data is paid. Threat-intel framing.

### XposedOrNot API  [keyless]
- **Input → output:** email → breaches; `/v1/breach-analytics?email=` → risk score/label,
  per-industry exposure, password-strength buckets, `xposed_data` category tree, per-breach detail.
  Password checks via k-anonymity (Keccak-512 prefix).
- **Call:** `curl -s "https://api.xposedornot.com/v1/breach-analytics?email=target@example.com"`
- **Use:** Best keyless HIBP alternative with a ready-made risk score + exposed-data taxonomy —
  the default first-pass, no signup. (~2 req/s.)
- **Caveats:** Smaller breadth than HIBP/DeHashed; domain monitoring needs a free key.

### LeakCheck — Public API  [keyless]
- **Input → output:** email/username/phone/hash → `{found: <count>, fields: [categories],
  sources: [{name, date}]}` — named breach sources + dates + which PII field types leaked (no values).
- **Call:** `curl -s "https://leakcheck.io/api/public?check=target@example.com"`
- **Use:** Keyless triage — how many breaches, which named ones, what PII categories (SSN? phone?
  dob?) before spending a paid lookup. Commercial use permitted. (~1 req/s.)
- **Caveats:** No plaintext values — LeakCheck Pro v2 (`[paid]`, ~$9.99/mo) returns those.

### ProxyNova COMB API  [keyless]
- **Input → output:** email/username/password fragment → `{count, lines: ["email:password", …]}`
  from the 3.2B-credential COMB compilation.
- **Call:** `curl -s "https://api.proxynova.com/comb?query=target@example.com&start=0&limit=20"`
- **Use:** Keyless (old) plaintext pairs for password-pattern / credential-stuffing-risk analysis.
- **Caveats:** Static 2021 dump — stale, noisy, no per-record attribution. Real creds → authorized
  defensive use only. Unofficial endpoint.

### Intelligence X (intelx.io)  [free-key → paid]
- **Input → output:** selector (email/domain/URL/IP/phone/BTC) → matching leaks/pastes/darkweb/docs/
  WHOIS items (async: POST search → poll results). Paid `/phonebook/search` enumerates a domain's
  emails/subdomains.
- **Call:** `curl -s -X POST "https://free.intelx.io/intelligent/search" -H "x-key: $INTELX_KEY" -H "Content-Type: application/json" -d '{"term":"target@example.com","maxresults":100,"media":0,"sort":2,"terminate":[]}'`
- **Use:** Broadest "selector → everything" archive (200B+ records). Free key covers low-volume scripting.
- **Caveats:** Free credits limited/expiring; phonebook + many buckets are paid.

### Have I Been Pwned — API v3  [paid* + free keyless catalog]
- **Input → output:** email/domain → structured breach array (DataClasses, `IsStealerLog`), pastes,
  stealer-log endpoints, domain-wide maps. **Free & keyless:** catalog endpoints (`/breaches`,
  `/breach/{name}`, `/dataClasses`, `/latestBreach`) + the Pwned Passwords range API.
- **Call (paid lookup):** `curl -s "https://haveibeenpwned.com/api/v3/breachedaccount/target@example.com?truncateResponse=false" -H "hibp-api-key: $HIBP_KEY" -H "user-agent: osint-skill/1.0"`
- **Call (free):** `curl -s "https://api.pwnedpasswords.com/range/21BD1"` · `curl -s https://haveibeenpwned.com/api/v3/breaches`
- **Use:** Best-in-class breach data + the reference source others resell. Keep for the free
  catalog/Pwned-Passwords primitives; upgrade to paid for identifier lookups.
- **Caveats:** Tiered pricing (churns — re-check). **Missing `user-agent` header = 403.** Domain
  endpoints require proven ownership. Attribution required.

### DeHashed — API v2  [paid]
- **Input → output:** any field (email/username/password/hash/name/address/phone/IP/domain/VIN) →
  linked cross-field breach records + `database_name`. Boolean/wildcard/regex queries.
- **Call:** `curl -s -X POST "https://api.dehashed.com/v2/search" -H "Dehashed-Api-Key: $DEHASHED_KEY" -H "Content-Type: application/json" -d '{"query":"email:target@example.com","page":1,"size":100}'`
- **Use:** Richest **pivot** engine in the category — one selector → linked identities across many DBs.
- **Caveats:** Vetted paid access (PAYG ~$0.02/query). Wildcard `*` flaky.

### Cheap paid, secondary
- **LeakCheck Pro v2** `[paid]` (~$9.99/mo) — plaintext values.
- **Snusbase** `[paid]` (~$5–16/mo) — field-flexible reverse lookups incl. `lastip`.
- **BreachDirectory** (via RapidAPI) `[free-tier]` (~10/mo) — resells others, returns hashes.

### Dropped / dead (don't waste time)
- **Scylla** `[dropped]` (scylla.sh dead, scylla.so parked) · **BinaryEdge** `[dropped]` (shut down
  2025-03-31) · **Spyse** `[dropped]` (defunct ~2022).
