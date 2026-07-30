---
name: programmatic-osint-sources
description: >-
  Catalog of data-rich OSINT/enrichment sources that can be pulled PROGRAMMATICALLY
  with low lift — a public URL endpoint, a keyless REST API, or a genuine free-tier
  API. Use when you have an identifier (email, name, domain, username, phone, company,
  or IP) and want to turn it into rich machine-readable data: find or verify emails,
  reverse-lookup a person from an email, enumerate subdomains and infrastructure,
  check breach/credential exposure, resolve a company to officers/beneficial owners,
  confirm an account exists on a platform, enrich a phone number, or pivot an identity
  across ecosystems. Generalizes the "Gravatar returns a profile from an email" trick
  to hundreds of sources. Covers keyless endpoints, free-key APIs, and cheap paid
  upgrades, each with a concrete example call and honest auth/ToS/freshness caveats.
---

# Programmatic OSINT Sources

> **The idea:** an identifier (email · name · domain · username · phone · company · IP)
> keys into a rich, machine-readable response. This skill is a curated, verified catalog
> of sources where that pull is *low-lift* — a plain URL, a keyless API, or a real
> free-tier key — so an agent can script it. It generalizes the Gravatar
> "email → profile" trick out to breach data, infrastructure, code repos, public
> records, presence oracles, phones, and more.

This is the **broad source catalog**. For the email-specific workflow (DNS/MX, theHarvester,
holehe, GHunt, SMTP/people-API verification, Gravatar/Libravatar/unavatar) see the sibling
skill **[domain-email-enumeration](../domain-email-enumeration/SKILL.md)**. This skill covers
everything *outside* that email-and-avatar core.

---

## How to use this skill

1. **Start from the identifier you already have.** The catalog is organized so you can jump to
   "I have an X, I want a Y":

   | I have… | I want… | Go to |
   |---------|---------|-------|
   | email | is it breached? / infostealer exposure | [breach-and-exposure](references/breach-and-exposure.md) |
   | email | the person behind it (name/role/socials) | [contact-enrichment](references/contact-enrichment.md) · [presence-oracles](references/presence-oracles.md) |
   | name + company/domain | a verified work email | [contact-enrichment](references/contact-enrichment.md) |
   | domain | subdomains, hosts, tech, related infra | [infrastructure-recon](references/infrastructure-recon.md) |
   | domain / company | officers, owners, filings, litigation | [public-records](references/public-records.md) |
   | company name | canonical domain + firmographics + IDs | [contact-enrichment](references/contact-enrichment.md) · [market-signals](references/market-signals.md) |
   | company | hiring intent, tech stack, ad/news signal | [market-signals](references/market-signals.md) |
   | username / handle | linked accounts, real name, activity | [presence-oracles](references/presence-oracles.md) · [developer-identity](references/developer-identity.md) |
   | name / org / email | public code commits → real emails | [developer-identity](references/developer-identity.md) |
   | phone number | carrier, line type, name, platform footprint | [phone-and-messaging](references/phone-and-messaging.md) |
   | IP | ports, CVEs, co-hosted domains, ASN/abuse contact | [infrastructure-recon](references/infrastructure-recon.md) |

2. **Prefer keyless → free-key → cheap-paid, in that order.** Every entry is tagged. Reach for a
   paid tier only when a keyless one can't answer.
3. **Chain sources into a waterfall.** e.g. company name → canonical domain (Clearbit autocomplete)
   → subdomains (Cert Spotter) → contributor emails (GitHub) → verify (Abstract) → enrich the
   person (People Data Labs) → confirm they're active (Duolingo/Keybase). The reference files note
   what feeds what.
4. **Re-verify before you rely on it.** These endpoints churn — free tiers shrink, hosts move,
   ToS changes. Freshness/confidence caveats are on every entry; treat pricing and free-quota
   numbers as "last-checked, re-check now."

---

## Highest-value keyless sources (zero auth, start here)

The fastest wins — no signup, scriptable in one `curl`. Full details + more in the reference files.

| Source | Identifier → data | Category |
|--------|-------------------|----------|
| **Hudson Rock Cavalier** | email/domain → infostealer-infection exposure | [breach](references/breach-and-exposure.md) |
| **XposedOrNot** | email → breaches + risk score | [breach](references/breach-and-exposure.md) |
| **LeakCheck (public)** | email/username/phone → breach source names + PII categories | [breach](references/breach-and-exposure.md) |
| **crt.sh / Cert Spotter** | domain → subdomains (from CT logs) | [infra](references/infrastructure-recon.md) |
| **Shodan InternetDB** | IP → ports, CVEs, hostnames | [infra](references/infrastructure-recon.md) |
| **RDAP (rdap.org)** | domain/IP/ASN → registrar, dates, nameservers, ownership | [infra](references/infrastructure-recon.md) |
| **HackerTarget** | domain ↔ subdomains / reverse-IP | [infra](references/infrastructure-recon.md) |
| **RIPEstat** | IP/ASN/prefix → whois, abuse contact, routing, geo | [infra](references/infrastructure-recon.md) |
| **Common Crawl index** | domain → web-scale URL/subdomain list + page text | [infra](references/infrastructure-recon.md) |
| **GitHub commit/patch** | name/org/email ↔ username + real commit emails | [dev](references/developer-identity.md) |
| **Sourcegraph** | email/name → wherever it appears across public code | [dev](references/developer-identity.md) |
| **Wikidata** | company/person → cross-linked external IDs (LinkedIn/GitHub/ORCID/SEC…) | [contact](references/contact-enrichment.md) |
| **ORCID / OpenAlex** | name/email → researcher affiliation, works, co-authors | [contact](references/contact-enrichment.md) |
| **Clearbit autocomplete** | company name → canonical domain | [contact](references/contact-enrichment.md) |
| **Hunter `email-count`** | domain → # emails by department + seniority | [contact](references/contact-enrichment.md) |
| **GLEIF** | company → legal entity + who-owns-whom | [records](references/public-records.md) |
| **OpenFEC** | donor name/employer → name+address+employer+occupation | [records](references/public-records.md) |
| **Duolingo users API** | email → real name + username + avatar | [presence](references/presence-oracles.md) |
| **Keybase** | username → cryptographically-linked accounts + PGP | [presence](references/presence-oracles.md) |
| **Greenhouse / Lever / Ashby** | company → all open roles (tech stack + hiring intent) | [signals](references/market-signals.md) |
| **X syndication API** | tweet id → author profile (no auth) | [phone/msg](references/phone-and-messaging.md) |

---

## Reference catalog

Load the file for the category you need — see **[references/INDEX.md](references/INDEX.md)** for the map.

- **[breach-and-exposure.md](references/breach-and-exposure.md)** — credential leaks, infostealer exposure, paste/darkweb archives.
- **[infrastructure-recon.md](references/infrastructure-recon.md)** — certificate transparency, internet-scan engines, DNS/RDAP/WHOIS, passive DNS, ASN/abuse contacts, web-index/history.
- **[developer-identity.md](references/developer-identity.md)** — GitHub/GitLab/npm/PyPI/Sourcegraph/GH-Archive: code repos as an email↔identity graph.
- **[contact-enrichment.md](references/contact-enrichment.md)** — B2B email finders, email validation, firmographic resolvers, knowledge graphs (Wikidata), academic identity (ORCID/OpenAlex).
- **[public-records.md](references/public-records.md)** — government/legal/financial registries: officers, beneficial owners, donors, filings, litigation, procurement.
- **[presence-oracles.md](references/presence-oracles.md)** — identifier → "real person + profile" existence checks across consumer platforms (the direct generalization of the Gravatar trick).
- **[phone-and-messaging.md](references/phone-and-messaging.md)** — phone → carrier/line-type/name, and messaging-app footprint (Telegram/Discord/X/WhatsApp/Signal).
- **[market-signals.md](references/market-signals.md)** — hiring signals (job boards), news (GDELT), ad transparency, maps/reviews, tech-fingerprint.
- **[connectors.md](references/connectors.md)** — how to get this data via **Claude connectors / MCP servers** instead of raw `curl`, prioritized free / no-account / low-lift (what's already connected, 1-click directory options, remote-URL MCPs, and self-host power tools).

---

## Legal, ToS & ethics (read before scripting)

This skill is for **authorized** work: B2B prospecting on business contacts, defensive
security / threat intelligence, due diligence, and competitive research. With that scope:

- **Respect each source's ToS and rate limits.** Many keyless endpoints (Duolingo, X syndication,
  Truecaller, LinkedIn Voyager, WhatsApp self-sessions) are *undocumented* or *explicitly forbid
  automation*. They're fine for low-volume investigative pivots; they are **not** for bulk
  scraping, and some carry account-ban or legal risk (LinkedIn `hiQ`, Truecaller). Each entry
  flags this — heed it.
- **Breach / infostealer / credential data is defensive.** Hudson Rock, HIBP, DeHashed, ProxyNova
  COMB, Intelligence X etc. exist for exposure assessment and threat intel. Use them to protect a
  domain you're authorized on or assess a counterparty's risk — never to obtain or use others'
  credentials. Treat any returned plaintext as toxic.
- **Handle PII responsibly.** Much of this is personal data (home addresses in FEC/registry data,
  phone→name, breach records). Collect only what the task needs, store it as your engagement's
  rules require, and honor GDPR/CCPA where they apply.
- **No secrets in the repo.** Every example uses a `$ENV_VAR` or placeholder key. Never commit a
  real key, token, or cookie.

If a task would use these sources to target a **private individual** rather than a business
context, or in a way the user wouldn't expect, stop and confirm scope first.

---

## Related skills

- **[domain-email-enumeration](../domain-email-enumeration/SKILL.md)** — the email/avatar core (theHarvester, holehe, GHunt, SMTP/people-API verification, Gravatar).
- **[client-discovery-osint](../client-discovery-osint/SKILL.md)** · **[intelligence-dossier](../intelligence-dossier/SKILL.md)** · **[verification-audit](../verification-audit/SKILL.md)** · **[company-legal-reputation-research](../company-legal-reputation-research/SKILL.md)** — workflows that consume these sources.
- **[website-techstack-analysis](../website-techstack-analysis/SKILL.md)** · **[google-dorking-osint](../google-dorking-osint/SKILL.md)** — adjacent recon techniques.

> **Freshness:** catalog compiled 2026-07; API availability, free tiers, and pricing change
> frequently. Re-check any endpoint before depending on it, and downgrade your confidence for
> entries tagged `[shaky]`.
