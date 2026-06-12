# Competitor Identification

## Overview

How to find and validate the nearest competitors for a company, starting from existing data assets and expanding through manufacturer partner networks, free APIs, and large dataset screening. Produces a ranked Top 10 competitor list with product/service coverage matrices, brand overlap analysis, and geographic mapping.

Developed and validated on BROGAV Solutions LLC (June 2026) — a ~$5-7M data center equipment VAR. The methodology screened 4,797 S&P Global companies, queried SimilarWeb API for 12 domains, and searched manufacturer partner directories to produce a validated Top 10.

## When to use this skill

- You need to find the 5-15 closest competitors for a company
- You have an existing intelligence dossier with supplier/partner data to work from
- You've been given a bulk competitor dataset (S&P Global, Dun & Bradstreet, etc.) and need to extract the relevant companies
- You need to compare competitors on specific dimensions (products, brands carried, services, geography, size)

## Critical principle: Think before you search

The biggest mistake in competitor identification is jumping straight to web searches. The right sequence is:

1. **Define the target profile precisely** — What makes a company a "competitor"? Write it down before searching.
2. **Mine existing data first** — Read every file in the dossier. The partner list, supplier line card, event/association data, and any existing competitor datasets contain more signal than a web search.
3. **Search outward from the supplier line card** — If you know which brands the target carries, find who else carries those brands. Those are the real competitors.
4. **Validate with quantitative data** — Use SimilarWeb API, company profile databases, and financial data to confirm size/relevance.
5. **Build comparison matrices** — Product coverage, brand overlap, geographic overlap. Numbers, not narratives.

## Phase 1: Define the target profile (15 minutes)

Write a crisp profile table before doing any research:

```markdown
| Dimension | Target Profile | Competitor Must Be |
|-----------|---------------|-------------------|
| Business model | [e.g., VAR + installation] | [Same type, not manufacturer or mega-distributor] |
| Revenue | [e.g., ~$5-7M] | [Under $50M, or whatever ceiling makes sense] |
| Products | [List specific categories] | [Must overlap on core categories] |
| Services | [e.g., sourcing, installation, maintenance] | [Must offer services, not just ship boxes] |
| Geography | [HQ + sales territories] | [US-based, or whatever scope] |
| Brands carried | [List key manufacturer partners] | [Must carry 1+ of the same brands] |
```

### Exclusion list

Equally important — define what does NOT qualify:

| Type | Why Excluded |
|------|-------------|
| **Manufacturers** (e.g., Vertiv, Eaton, Schneider) | Upstream suppliers, not competitors |
| **Mega-distributors** (e.g., SHI, CDW, Anixter) | Different scale entirely ($10B+) |
| **Manufacturer's reps** (if target is a stocking VAR) | Different business model — reps don't carry inventory or install |
| **Pure e-commerce** (if target does installation) | Different value proposition |
| **Wrong product category** (e.g., servers if target sells infrastructure) | Not competing for the same budget |

## Phase 2: Mine existing data (30 minutes)

Read EVERYTHING in the dossier before doing a single web search:

### Files to read and what to extract

| File | What to look for |
|------|-----------------|
| **Supplier line card / partners CSV** | Every brand the target carries — these define the competitive landscape |
| **Partner logos (OCR if needed)** | Additional brands not in structured data |
| **Known clients / testimonials** | Who the target sells to — their competitors sell to similar buyers |
| **Event/association memberships** | AFCOM, 7x24 Exchange, iMasons member companies are peers |
| **Job postings** | Sales territories reveal where competitors are likely found |
| **Existing competitor datasets** | May contain thousands of companies — most irrelevant, but gems buried |

### Processing large competitor datasets

If you have a bulk dataset (S&P Global, D&B, etc.), don't eyeball it. Process it programmatically:

```python
import csv

# Step 1: Filter by revenue
under_threshold = [r for r in rows if float(r['revenue_m']) < 50]

# Step 2: Keyword match on descriptions
# Build keywords from the target's actual products/services
product_keywords = ['ups', 'pdu', 'precision cooling', 'containment', 
                    'busway', 'critical power', 'server rack', 'cabinet',
                    'leak detection', 'data center']

brand_keywords = ['eaton', 'schneider', 'vertiv', 'panduit', 'legrand',
                  'starline', 'chatsworth', 'generac']

for row in under_threshold:
    desc = row.get('description', '').lower()
    product_hits = [kw for kw in product_keywords if kw in desc]
    brand_hits = [kw for kw in brand_keywords if kw in desc]
    if len(product_hits) >= 1 or len(brand_hits) >= 1:
        matches.append(row)

# Step 3: Rank by relevance score
matches.sort(key=lambda x: -(len(x['product_hits']) + len(x['brand_hits']) * 2))
```

**Key lesson from BROGAV analysis:** A 4,797-company dataset from S&P Global yielded only 8 genuine competitors after filtering. >99% were irrelevant (generic tech distributors, consumer electronics, software companies miscategorized under hardware SIC codes). Don't skip the programmatic screening.

## Phase 3: Search outward from the supplier line card (30 minutes)

For each of the target company's top 5-10 manufacturer brands, find who else resells them:

### Manufacturer partner directories

| Manufacturer | Where to find resellers |
|-------------|----------------------|
| Starline (Legrand) | `starlinepower.com/find-a-rep/starline/` — ZIP code search |
| Eaton | `poweradvantage.eaton.com` — Partner program portal |
| Schneider/APC | Partner locator on schneider-electric.com |
| Chatsworth Products | `chatsworth.com/en-us/how-to-buy/find-a-distributor` |
| RLE Technologies | `rletech.com/partners/` |
| Vertiv | `vertiv-authorized-partner.com` |
| Great Lakes | Now Vertiv — check `racks.vertiv.com` |

**Tip:** Most directories require ZIP code or are gated. Web search for `"[brand] authorized partner" OR "authorized reseller" OR "representative" [region]` often surfaces names the directory doesn't easily expose.

### Industry association and event networks

| Source | What to search for |
|--------|-------------------|
| DCAC exhibitor lists | Small DC VARs cluster at this event |
| 7x24 Exchange member companies | Chapter members are peers |
| Data Center World exhibitors | Larger pool, filter by booth size |
| LinkedIn "Companies similar to [target]" | Algorithm finds business model peers |

## Phase 4: Validate with quantitative data (20 minutes)

For each candidate competitor, pull:

### SimilarWeb Free API

```
https://data.similarweb.com/api/v1/data?domain=COMPETITOR.com
```

Extract: monthly visits, global rank, bounce rate, pages/visit, traffic sources, top keywords with volumes + CPC.

**Rate limiting:** SimilarWeb throttles after ~5-10 queries. Space them out or accept 504 errors on some.

### Company profile databases (web search)

For each candidate, search: `"Company Name" employees revenue size`

Sources that surface: RocketReach, ZoomInfo, LeadIQ, LinkedIn, Inc.com, Craft.co, Prospeo, Crunchbase, Glassdoor.

**Revenue and employee data varies wildly across sources.** Use ranges, not point estimates.

## Phase 5: Build comparison matrices (30 minutes)

### Product/service coverage matrix

List every capability the target company has. Score each competitor:

```markdown
| Capability | Target | Comp 1 | Comp 2 | Comp 3 | ... |
|------------|--------|--------|--------|--------|-----|
| Cabinets/Racks | Yes | Yes | — | Yes | |
| PDUs | Yes | Yes | Yes | — | |
| UPS | Yes | — | Yes | Yes | |
| Cooling | Yes | Yes | Yes | — | |
| Containment | Yes | — | — | — | |
| Leak Detection | Yes | — | — | — | |
| Turnkey Installation | Yes | Yes | — | Yes | |
| Refurbished/Used | Yes | Yes | — | — | |
| Rental | Yes | — | — | — | |
| Coverage breadth | 9/9 | 5/9 | 3/9 | 3/9 | |
```

**This matrix is the deliverable.** It immediately shows where the target wins (unique capabilities) and where competitors crowd (commodity categories).

### Shared manufacturer brand matrix

```markdown
| Brand | Target | Comp 1 | Comp 2 | Comp 3 |
|-------|--------|--------|--------|--------|
| Eaton | Yes | — | Yes | — |
| Schneider | Yes | — | — | Yes |
| Starline | Yes | Yes | — | Yes |
| ... | | | | |
```

### Geographic overlap map

```markdown
| Territory | Target | Comp 1 | Comp 2 | Comp 3 |
|-----------|--------|--------|--------|--------|
| State A (HQ) | HQ | — | Yes (acquired local firm) | — |
| State B | Field sales | HQ | — | Yes |
| National | Yes | — | Yes | — |
```

## Phase 6: Write the report (20 minutes)

### Report structure

```markdown
# Competitive Landscape — [Company] Top 10 Nearest Competitors

## Selection Criteria
[Target profile table + exclusion list with reasons]

## Dataset Screening (if applicable)
[How many companies screened, filtering steps, how many survived]

## The Top 10
[For each: name, HQ, revenue, employees, products, services, territory, 
brand overlap, similarity score X/10, why they match]

## Product/Service Coverage Matrix
[Full table]

## Shared Manufacturer Brand Matrix
[Full table]

## Geographic Overlap Map
[Full table]

## Strategic Takeaways
[5-7 key findings: unique advantages, biggest threats, uncontested niches]

## Data Sources
[Every source cited]
```

### Competitor profile template

```markdown
### #N. Company Name

| Field | Detail |
|-------|--------|
| Website | example.com |
| HQ | City, State |
| Founded | YYYY |
| Employees | ~XX |
| Revenue | ~$X.XM |
| Products | [List] |
| Services | [List] |
| Territory | [States/regions] |
| Brand overlap | [Which brands they share with target] |
| Similarity score | X/10 — [Explanation of why] |
```

## Common pitfalls

1. **Confusing partners with competitors.** Manufacturers the target resells for are suppliers, not competitors. Flag them explicitly.
2. **Including companies that are 100x the target's size.** A $5M company does not compete with a $500M company. Set a revenue ceiling.
3. **Trusting SIC codes.** SIC 5045 "Computers and Peripherals" includes everything from smartphone distributors to data center VARs. >95% of a SIC-based list will be irrelevant.
4. **Not mining existing data first.** The best competitor intelligence is already in the dossier's supplier, partner, and association files. Web searches should fill gaps, not replace local research.
5. **Judging competitors by web traffic.** A company with 25,000 monthly website visits but no product overlap is not a competitor. A company with 850 visits/mo that carries the same brands and serves the same customers IS.
6. **Not building the matrices.** A narrative list of 10 companies is mediocre. Product coverage matrices, brand overlap matrices, and geographic maps are what make the analysis actionable.

## Combining with other skills

- **`intelligence-dossier`** — Populates the `04_Market_and_Customers/` and `05_Competitive_Landscape/` sections
- **`open-source-traffic-analysis`** — Use SimilarWeb API to benchmark competitor traffic and extract their keyword data
- **`deep-research`** — If you need to go deeper on a specific competitor, use the 7-phase pipeline
- **`company-legal-reputation-research`** — Run on top competitors to find legal/compliance risks
