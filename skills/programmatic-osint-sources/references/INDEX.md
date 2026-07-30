# Reference Index — which file to load

Each file is a self-contained catalog for one category. Entries follow a consistent shape:

```
### Source name  [tag]
- Input → output: what you give it → what data-rich thing comes back
- Call: a concrete curl / URL / endpoint
- Use: how it helps find/enrich/verify people, contacts, companies, or infra
- Caveats: auth, rate limits, ToS, accuracy, freshness
```

**Tags:** `[keyless]` no auth · `[free-key]` free signup key · `[free-tier]` free quota then paid ·
`[paid]` no real free tier · `[shaky]` degraded/uncertain free access or endpoint churn ·
`[dropped]` defunct (listed so you don't waste time).

| File | Covers | Best for |
|------|--------|----------|
| [breach-and-exposure.md](breach-and-exposure.md) | Hudson Rock, XposedOrNot, LeakCheck, ProxyNova COMB, Intelligence X, HIBP, DeHashed | "Is this email/domain exposed in breaches or infostealer logs?" |
| [infrastructure-recon.md](infrastructure-recon.md) | crt.sh, Cert Spotter, Shodan InternetDB, urlscan, Censys, Netlas, ONYPHE, RDAP, HackerTarget, RIPEstat, BGPView, PeeringDB, VirusTotal, AlienVault OTX, WhoisXML/ViewDNS, Common Crawl, Wayback | domain/IP → subdomains, services, DNS, related infra, abuse contacts |
| [developer-identity.md](developer-identity.md) | GitHub (commit/patch/events/search), GH Archive on BigQuery, Sourcegraph, GitLab, npm, PyPI, gitcolombo | code repos → real emails + linked handles, both directions |
| [contact-enrichment.md](contact-enrichment.md) | Apollo, People Data Labs, Enrich.so, LeadMagic, Tomba, Snov, Prospeo, Hunter email-count, Abstract, Clearbit autocomplete, Brandfetch, Wikidata, ORCID, OpenAlex, Crossref, ROR | name/company/domain/email → verified email + rich person/company record + cross-ecosystem IDs |
| [public-records.md](public-records.md) | UK Companies House, GLEIF, OpenCorporates, OpenFEC, NPPES, CourtListener, SEC EDGAR full-text, GovInfo, USAspending, France recherche-entreprises, State SoS | company/person → officers, beneficial owners, donors, filings, litigation, procurement |
| [presence-oracles.md](presence-oracles.md) | Microsoft GetUserRealm/GetCredentialType, Duolingo, Chess.com, Spotify, ignorant, Keybase, Reddit, HN Algolia, Slack, GHunt/holehe/Maigret (cross-ref) | email/username/phone → "does a real person exist here?" + profile |
| [phone-and-messaging.md](phone-and-messaging.md) | Twilio Lookup, Veriphone, NumVerify/Abstract, Truecaller, X syndication, Telegram, Discord, WhatsApp, Signal | phone → carrier/line-type/name; handle/phone → messaging-app identity |
| [market-signals.md](market-signals.md) | Greenhouse/Lever/Ashby/SmartRecruiters/USAJOBS, GDELT, Meta Ad Library, Yelp/Nominatim, WhatCMS/BuiltWith | company → hiring intent, tech stack, news, ads, physical presence |

## Suggested waterfalls

- **Company → people:** Clearbit autocomplete (name→domain) → Cert Spotter (subdomains) → GitHub
  + GH Archive (`@domain` → dev roster with emails) → Apollo People Search (org chart) → Abstract
  (verify) → People Data Labs / Enrich.so (enrich each person).
- **Email → identity:** XposedOrNot/Hudson Rock (exposure) ∥ Enrich.so/PDL (person) ∥ Duolingo/
  Keybase/holehe (presence) ∥ GitHub commit-search (dev handle) → converge on one profile.
- **Domain → attack surface:** RDAP (ownership) → Cert Spotter + crt.sh (subdomains) → Shodan
  InternetDB + urlscan (services/tech) → RIPEstat/BGPView (ASN + abuse contact) → VirusTotal/OTX
  (passive DNS, siblings).
- **Company → firmographics + IDs:** Wikidata (cross-linked IDs) → GLEIF (ownership tree) →
  Companies House/OpenCorporates (officers) → market-signals (hiring/tech/ads).
