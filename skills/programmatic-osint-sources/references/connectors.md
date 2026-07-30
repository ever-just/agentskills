# Claude connectors & MCP servers for these data sources

How to get the data in this catalog **through Claude connectors / MCP** instead of raw `curl`.
Prioritized for **free / free-tier**, **no account** (bonus), and **low lift to add**.

> **The one rule that shapes everything:** claude.ai custom connectors must be **remote**
> (HTTP/SSE). Three lift levels:
> - **`[1-click]`** — in the claude.ai connector directory; enable in Settings → Connectors.
> - **`[URL]`** — remote MCP you add by pasting a URL (`claude mcp add --transport http …`).
> - **`[self-host]`** — a stdio/local MCP (most raw OSINT tools: GHunt, holehe, theHarvester).
>   Can't go in the in-app connector experience; run it in Claude Code or wrap it as a remote
>   server. Only worth it where the directory has no equivalent (infra recon, dev-identity).
>
> **Snapshot:** compiled 2026-07 from the live registry. Availability/tiers change — re-check
> `ListConnectors` / the connector directory before relying on any row.

---

## Already connected (don't re-add — this is what you already have)

| Connector | Data it gives |
|-----------|---------------|
| **Apollo.io** | People/company search + match, verified work emails, org data (270M+ contacts) |
| **Clay** | Find + enrich contacts/companies, waterfall enrichment, data points |
| **G2** | Buyer intent, firmographics, competitive intelligence |
| **Twilio** | Phone **Lookup** — carrier, line-type, CNAM (phone→name) |

---

## Contact & company personnel data (the focused pass)

Finding **people at companies** — decision-makers, titles, org structure, direct emails/dials.
You already have Apollo + Clay (the strongest two); these are complements.

| Connector | What it adds | Cost / account | Lift |
|-----------|--------------|----------------|------|
| **Lusha** | B2B `contacts_search` / `companies_search` + prospecting search/enrich/filters; strong direct dials + EU coverage | free-tier | `[1-click]` |
| **Vibe Prospecting** | `enrich-business`, `enrich-prospects`, autocomplete, export-to-csv — company & contact data | free-tier | `[1-click]` |
| **Sprouts Data Intelligence** | "query → qualified lead", `icp_analysis`, query templates/refinement | free-tier | `[1-click]` |
| **Phoenix by HG Insights** | Firmographic + **technographic** + intent + spend + contracts (great for tech-stack-based targeting) | account | `[1-click]` |
| **Day AI** | CRMx prospect/customer research + create/update person-org records | account | `[1-click]` |
| **Close** / **Attio** | CRMs — search/write **your own** pipeline (not discovery); use to push enriched contacts back | account | `[1-click]` |

**Recommendation:** keep Apollo + Clay as the primary finders; add **Lusha** (free tier, direct
dials) as a second waterfall provider and **Phoenix HG** if you target by tech stack. Everything
here needs an account — for no-account personnel data, fall back to the skill's keyless recipes
(GitHub commit emails → [developer-identity.md](developer-identity.md); OpenFEC/Companies House →
[public-records.md](public-records.md)).

---

## Best connector per data category

| Category (skill file) | Recommended connector | Cost / account | Lift |
|-----------------------|-----------------------|----------------|------|
| **Breach/exposure** ([breach](breach-and-exposure.md)) | **Have I Been Pwned** | free catalog; ~$4/mo lookups | `[1-click]` |
| ↳ no-account alt | **Malwarebytes** — email/phone/link reputation + WHOIS | **[no-account]** free | `[1-click]` |
| **Contact enrichment** ([contact](contact-enrichment.md)) | Apollo+Clay (have) · **Lusha** | free-tier | `[1-click]` |
| **Firmographics/tech/intent** | **Phoenix by HG Insights** | account | `[1-click]` |
| **Brand → social handles** ([contact](contact-enrichment.md)) | **Brandfetch** | free-tier | `[1-click]` |
| **Web search** | **Exa** — `https://mcp.exa.ai/mcp` | **[no-account]** keyless tier | `[URL]` |
| **Web scrape** | **Firecrawl keyless** — `https://mcp.firecrawl.dev/v2/mcp` | **[no-account]** 1,000 cr/mo | `[URL]` |
| **Web extract (alt)** | **Nimble** | account | `[1-click]` |
| **Infra recon** ([infra](infrastructure-recon.md)) | **badchars/osint-mcp-server** — Shodan/VT/Censys/SecurityTrails/DNS/WHOIS/CT/BGP/Wayback/GeoIP (graceful degradation; keyless core) | free core | `[self-host]` |
| **Public records — healthcare** ([records](public-records.md)) | **NPI Registry** | **[no-account]** free | `[1-click]` |
| **Public records — SEC/financial** | **FMP** or **Alpha Vantage** | free-key | `[1-click]` |
| **Traffic/market** ([signals](market-signals.md)) | **Similarweb** | paid | `[1-click]` |
| **Academic identity** ([contact](contact-enrichment.md)) | **alphaXiv** / **Scite** | free / free-tier | `[1-click]` |
| **Phone** ([phone](phone-and-messaging.md)) | **Twilio** (have) | free-tier | ✓ |
| **Dev identity / presence oracles** ([dev](developer-identity.md), [presence](presence-oracles.md)) | *no directory connector* → OpenOSINT / osint-tools-mcp-server, or skill `curl` | free | `[self-host]` |

---

## 🎯 Connect these first (free + no-account + low-lift)

1. **Malwarebytes** `[no-account] [1-click]` — email/phone/link scam-check + WHOIS.
2. **NPI Registry** `[no-account] [1-click]` — US healthcare people (if in scope).
3. **Exa** `[no-account] [URL]` — `claude mcp add exa --transport http https://mcp.exa.ai/mcp`
4. **Firecrawl keyless** `[no-account] [URL]` — `claude mcp add --transport http firecrawl https://mcp.firecrawl.dev/v2/mcp`
5. **Have I Been Pwned** `[1-click]` — free breach catalog now; ~$4/mo for per-email lookups.
6. **Lusha** + **Brandfetch** `[1-click]` — free tiers; personnel dials + brand→social, complementing Apollo/Clay.
7. **Later, self-host:** **badchars/osint-mcp-server** — the whole infra stack behind one remote
   URL; runs keyless, drop in free per-source API keys as needed. The directory has **no** Shodan/
   urlscan/VirusTotal connector, so this is the one worth the extra lift.

## Directory gap (what connectors can't do)

The connector directory covers **breach + enrichment + brand + records + web/scrape**. It has
**no** connector for subdomain / certificate-transparency / internet-scan recon, or the
developer-identity email pivots. Those stay on the skill's keyless `curl` recipes
([infrastructure-recon.md](infrastructure-recon.md), [developer-identity.md](developer-identity.md))
or one self-hosted OSINT bundle.
