# Open-Source Web Traffic Analysis

## Overview

How to estimate any website's traffic, keyword profile, and online visibility using free/open-source tools — no SimilarWeb Pro, Ahrefs, or SEMrush subscription required. Produces a quantitative traffic report with confidence ratings by triangulating 5+ independent data sources.

Developed and validated on brogav.com (June 2026) — a micro-traffic B2B site with ~1,200 monthly visits. The methodology works for sites from near-zero traffic to millions of monthly visits, with accuracy improving as traffic increases.

## When to use this skill

- You need to estimate a competitor's or prospect's web traffic and don't have paid SEO tools
- You're building a company intelligence dossier and need a "Web Traffic Analysis" section
- You need keyword intelligence for SEO strategy without paid tools
- You want to understand a site's growth trajectory over time
- You need geographic demand data for a market

## Tools and APIs used

All free, no API keys required:

| Tool | Endpoint | What It Provides | Rate Limits |
|------|----------|-----------------|-------------|
| **SimilarWeb Free API** | `https://data.similarweb.com/api/v1/data?domain=DOMAIN` | Monthly visits (3 months), global/country rank, bounce rate, pages/visit, time on site, traffic source split, top keywords with volumes + CPC, top countries | ~5-10 queries before throttling; 504 errors on some domains |
| **Wayback Machine CDX API** | `https://web.archive.org/cdx/search/cdx?url=DOMAIN/*&output=json&fl=timestamp,original,statuscode,mimetype&collapse=timestamp:6` | Every archived capture with timestamp, URL, status code, MIME type. Use as crawl frequency proxy for popularity. | Rate limit ~15 req/min; `collapse=timestamp:6` reduces to monthly granularity |
| **Tranco List API** | `https://tranco-list.eu/api/ranks/domain/DOMAIN` | Domain ranking in aggregated top-1M list (Umbrella + Majestic + Chrome + Farsight). Absence = outside top 1M. | Free, no limits observed |
| **Cloudflare Radar API** | `https://radar.cloudflare.com/api/v1/ranking/domain/DOMAIN` | DNS-based domain ranking bucket (top 100, 1K, 10K, 100K, 200K, 500K, 1M). 403 = not ranked. | Cloudflare challenge may block automated access |
| **Google Trends** | Manual via trends.google.com (no free API for programmatic access) | Relative search interest over time, by region/state | Browser-only |
| **Web Search** | Any search engine | Third-party traffic estimates, industry reports, PR mentions | Standard |

## Phase 1: SimilarWeb Free API (5 minutes)

### The query

```
https://data.similarweb.com/api/v1/data?domain=example.com
```

Use `WebFetch` or `curl`. Returns JSON with:

```
Monthly visits (3 months), Global rank, Country rank, Category rank,
Bounce rate, Pages per visit, Avg visit duration,
Traffic sources (direct, organic, paid, social, referral, mail, display, GenAI, affiliate),
Top 5 countries with percentages,
Top 5 organic keywords with monthly volume and CPC,
Top 5 paid keywords, Top referring sites
```

### What to extract

| Field | Where to find it | Notes |
|-------|-----------------|-------|
| Monthly visits | `Engagements.Visits` for each month | 3 most recent months |
| Rank | `GlobalRank`, `CountryRank` | Lower = better |
| Engagement | `Engagements.BounceRate`, `Engagements.PagesPerVisit`, `Engagements.TimeOnSite` | |
| Traffic sources | `TrafficSources.*` | Percentages for each channel |
| Keywords | `TopKeywords[].Name`, `.Volume`, `.Cpc` | Real search volumes |
| Countries | `TopCountryShares[].CountryCode`, `.Value` | Percentage share |

### Important caveats

- **Below ~5,000 monthly visits**, SimilarWeb's data becomes unreliable. Traffic source attribution may show 0% for all channels. Monthly visit estimates can fluctuate wildly.
- **The API may return 403, 504, or empty data** for smaller sites. Try again or accept the limitation.
- **Data is directional, not precise.** SimilarWeb estimates are based on browser extension panels and ISP data. Treat as order-of-magnitude, not exact.
- **Only 3 months of history.** No deep historical data from this endpoint.

### Competitor benchmarking trick

Query SimilarWeb for **competitor domains** in the same space. Their keyword data reveals what buyers search for. Example: querying `racksolutions.com` revealed that "server rack" has 15,790 monthly searches at $1.93 CPC — intelligence you can't get from the target site alone.

```
# Query multiple competitors
for domain in competitor1.com competitor2.com competitor3.com; do
  curl -s "https://data.similarweb.com/api/v1/data?domain=$domain"
done
```

## Phase 2: Wayback Machine CDX API (10 minutes)

### The query

```
https://web.archive.org/cdx/search/cdx?url=example.com/*&output=json&fl=timestamp,original,statuscode,mimetype&collapse=timestamp:6&limit=500
```

Key parameters:
- `collapse=timestamp:6` — Deduplicate to one capture per URL per month
- `fl=timestamp,original,statuscode,mimetype` — Only return fields you need
- `limit=500` — Prevent massive responses

### Analysis with Python

```python
import json, sys
from collections import Counter

data = json.load(sys.stdin)
rows = data[1:]  # Skip header row

# Monthly crawl volume (proxy for site activity/popularity)
monthly = Counter()
for row in rows:
    monthly[row[0][:6]] += 1  # YYYYMM

# Unique URLs (site complexity/size)
urls = set(row[1] for row in rows)

# Content types
mimes = Counter(row[3] for row in rows)

print(f"Total captures: {len(rows)}")
print(f"Unique URLs: {len(urls)}")
print(f"Monthly captures: {dict(sorted(monthly.items()))}")
print(f"Content types: {dict(mimes.most_common())}")
```

### What this tells you

1. **First capture date** = When the site launched (or first became visible to crawlers)
2. **Monthly capture trend** = Rising captures correlate with growing site complexity and popularity
3. **URL inventory** = Complete list of every page the site has ever had, with dates of first appearance
4. **Content types** = PDFs (datasheets, case studies), XML (sitemaps), images
5. **404 patterns** = Pages that were removed or restructured (reveals pivots)
6. **Site evolution phases** = Group URLs by first-capture date to map product launches, event pages, e-commerce additions

### Interpreting crawl frequency

| Captures/Year | Likely Traffic Level | Example |
|---------------|---------------------|---------|
| <20 | Minimal (<1K/mo) | New or inactive site |
| 20-100 | Low (1-10K/mo) | Small B2B site |
| 100-500 | Moderate (10-50K/mo) | Active business site |
| 500+ | Significant (50K+/mo) | Popular or content-heavy site |

**Caveat:** Crawl frequency is influenced by Wayback's own prioritization algorithms, not just site popularity. It's a loose proxy, not a direct measurement.

## Phase 3: Ranking checks (2 minutes)

### Tranco

```
https://tranco-list.eu/api/ranks/domain/example.com
```

Returns `{"domain": "example.com", "ranks": [...]}`. Empty ranks array = not in top 1M.

**Threshold:** A site typically needs ~500-1,000+ daily visits to appear in Tranco top 1M.

### Cloudflare Radar

```
https://radar.cloudflare.com/api/v1/ranking/domain/example.com
```

Returns ranking bucket or 403 (not ranked). Based on 1.1.1.1 DNS resolver queries. Data from Jan 2023 onward.

**Both confirming absence = high confidence the site is outside the top 1M globally.** This is itself a strong signal for micro-traffic sites.

## Phase 4: Supplementary signals (5 minutes)

### Google CrUX (Chrome UX Report)
- Requires BigQuery access
- Threshold for inclusion: ~10,000-15,000+ monthly pageviews
- If a site is in CrUX, it's above the "micro-traffic" threshold
- If not, it confirms low traffic (but absence is not proof of <10K)

### LinkedIn followers
- Check the company's LinkedIn page
- LinkedIn followers often exceed website visitors for B2B companies
- A strong LinkedIn following (1,000+) with minimal web traffic indicates relationship-driven business

### Web search for third-party estimates
```
"example.com" website traffic
site:example.com OR "Company Name" traffic similarweb semrush
```

### Industry press mentions
Search for the company name in industry publications. PR coverage often correlates with traffic spikes.

## Phase 5: Synthesis (15 minutes)

### Confidence matrix template

| Metric | Value | Sources Agreeing | Confidence |
|--------|-------|------------------|------------|
| Monthly visits (recent) | ~X,XXX at peak | SimilarWeb (1) | LOW-MEDIUM |
| Global rank | >1,000,000 | SimilarWeb, Tranco, Cloudflare (3) | HIGH |
| Site age (first indexed) | YYYY-MM | Wayback (1) | HIGH |
| Page count trend | X → Y URLs | Wayback (1) | HIGH |
| Primary traffic channel | Unknown / Organic / Direct | SimilarWeb (1) | LOW-MEDIUM |

### Cross-reference checklist

- [ ] Does the SimilarWeb site age match the Wayback first-capture date?
- [ ] Does the Wayback URL count match what you'd expect for the monthly visit level?
- [ ] Do the Tranco/Cloudflare ranking checks agree with SimilarWeb's global rank?
- [ ] Does LinkedIn follower count make sense relative to web traffic?
- [ ] Do any third-party estimates contradict or confirm?

### Report structure

```markdown
# Web Traffic Analysis — example.com

## Executive Summary
[One paragraph: traffic level, ranking, trajectory, key finding]

## Source 1: SimilarWeb Free API
[Monthly visits table, engagement metrics, traffic sources, keywords]

## Source 2: Wayback Machine CDX API
[Yearly captures, monthly trend, site structure evolution, URL inventory]

## Source 3: Tranco / Cloudflare Radar
[Ranking result with interpretation]

## Source 4: Supplementary Signals
[LinkedIn, CrUX, web search, PR mentions]

## Cross-Source Synthesis
[Confidence matrix, key findings, traffic trajectory narrative]

## Comparison to Industry Benchmarks
[Table: site metrics vs. industry averages]

## Data Sources
[Table: source, endpoint, date queried]

## Limitations
[What couldn't be measured and why]
```

## Combining with other skills

- **`intelligence-dossier`** — This skill populates the `02_Web_Traffic_Analysis/` section of a dossier
- **`competitor-identification`** — Use SimilarWeb competitor benchmarking to pull keyword data from peers
- **`deep-research`** — The Wayback CDX analysis here is a subset of the deep-research Wayback phase

## Real example: brogav.com results

**SimilarWeb:** 1,246 visits/mo (May 2026 peak), global rank 11.1M, 37.8% bounce rate, 0% attribution across all channels (below threshold)

**Wayback CDX:** 408 captures, 130 unique URLs, first capture June 2023. Site grew from 5 pages to 130+ in 3 years. Major e-commerce expansion Oct-Nov 2025 (20+ product pages added).

**Tranco:** Not in top 1M (never has been). **Cloudflare Radar:** Not ranked.

**Synthesis:** Micro-traffic site (~1,200 visits/mo peak) consistent with a 3-year-old, 11-20 employee B2B company. Website functions as a digital brochure, not a lead-generation engine. LinkedIn (1,512 followers) is the primary digital presence. Traffic trajectory is upward with the e-commerce expansion.

## Common pitfalls

1. **Don't treat SimilarWeb estimates as precise** for sites under 5K/mo. The error bars are huge.
2. **Don't confuse Wayback crawl frequency with actual traffic.** It's a proxy influenced by Wayback's own prioritization.
3. **Don't skip the ranking checks.** Three sources confirming "not ranked" is stronger than one source estimating low traffic.
4. **Don't forget competitor benchmarking.** Querying SimilarWeb for competitors in the same space yields keyword volumes you can't get from the target domain alone.
5. **Don't present data without confidence ratings.** Every metric should have HIGH/MEDIUM/LOW confidence with a note on how many sources agree.
