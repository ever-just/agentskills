# Intelligence Dossier

## Overview

How to build, populate, and maintain a structured intelligence dossier on a private company. Covers folder architecture, section content, product/supplier analysis, business model mix analysis, asset auditing, and ongoing maintenance (folder renames, cross-reference cleanup, dataset canonicalization).

Developed and validated on a full OSINT dossier for a ~$5-7M data-center VAR (BROGAV Solutions LLC, June 2026).

Use this skill when you need to:
- Build a permanent, navigable intelligence file on a company for due diligence, competitive research, or acquisition analysis
- Go beyond a one-time report and into a living, structured knowledge base
- Organize scattered OSINT into sections that different audiences (analysts, acquirers, competitors, partners) can navigate directly

---

## Folder architecture

Number all top-level sections with two-digit prefixes. This enforces a stable sort order and makes cross-references unambiguous.

```
COMPANY_Dossier/
├── 00_Overview/
├── 01_Company_Profile/          # Identity, legal, filings, certs
├── 02_People_and_Organization/  # Org chart, leadership bios, roster
├── 03_Products_and_Suppliers/   # Catalog, suppliers, business model
├── 04_Market_and_Customers/     # ICP, known clients, competitive landscape
├── 05_Financials/               # Revenue estimates, funding, pricing
├── 06_Marketing_and_Events/     # Social, events, brand voice
├── 07_Timeline_and_History/     # Founding, milestones, compliance lapses
├── 08_Evidence_and_Sources/     # Raw docs, datasets, case studies
│   └── datasets/                # Canonical CSVs (products, suppliers, people)
│   └── document_library/
│   └── raw/                     # Scraped HTML, Wayback captures, transcripts
├── 09_Analysis_and_Implications/# SWOT, risk register, acquisition/partnership theses
└── 10_Brand_and_Identity/       # Logo, colors, voice, characters
```

**Rule:** Every section folder gets a `README.md` that lists all files in it with one-line descriptions. This makes the dossier navigable without opening individual files.

---

## Section content guide

### 01 — Company Profile
Must-haves:
- Legal name, all prior names (companies rename constantly — see BROGAV: "Hope-filled Hearts LLC" → "BROGAV Solutions LLC")
- State of incorporation, statute, file number
- Registered office vs. marketing/operations address (often different)
- Compliance timeline: any termination, reinstatement, or lapse events
- Federal identifiers: UEI, CAGE, DUNS
- Certifications with exact expiry dates: WBENC, WOSB, DBE, 8(a), HUBZone
- Optional: `federal_registration.md` for SAM.gov and federal market analysis

### 02 — People and Organization
Must-haves:
- Full roster table: name, title, source, confidence
- LinkedIn-sourced tenure data (flag as "manual check needed" if gated)
- Org chart (inferred is fine — label it as inferred)
- Hiring patterns (active job postings + states)
- Founder origin story

### 03 — Products and Suppliers
See **Product and Supplier Analysis** section below.

### 08 — Evidence and Sources
The `datasets/` subfolder is the canonical data layer. All `.md` files across other sections reference CSVs here, not their own local copies. Key files:
- `products.csv` — one row per SKU, columns: product, category, spec_notes, price_usd, condition, fulfillment, source
- `supplier_line_card.csv` — one row per supplier
- `people.csv` — one row per employee

---

## Product and supplier analysis

### The three modes of a VAR (reseller) catalog

Any VAR operates in at most three modes for each product. Identify which mode applies before writing any analysis:

| Mode | Description | Margin profile | Lead time |
|------|-------------|---------------|-----------|
| In-stock (own inventory) | Product is on the shelf, ships same/next day | Highest (own capital at risk) | 1-5 days |
| Quote-to-order | Ordered after customer commits; no inventory risk | Medium | Days to weeks |
| Surplus / liquidation | One-time lots, no reorder | Highest (bulk purchase discount) | Immediate |

**Why this matters:** The distinction between in-stock and quote-to-order is invisible from the outside but defines the business model. A company with 25 supplier logos on their website may stock zero of those suppliers' products.

### Supplier catalog depth analysis

For each supplier brand, determine:
1. **Total SKU count in relevant categories** — find on the supplier's site (Products → filter by category)
2. **BROGAV (or target company) SKUs visible** — count in-stock products on target's store
3. **Coverage %** = target's in-stock SKUs / supplier's total catalog
4. **Sales mode** — In-stock, Quote-to-order, or Surplus only

**Template table:**
```markdown
| Supplier | BROGAV carries | Supplier total SKUs (cat.) | Coverage % | Mode |
|----------|---------------|--------------------------|-----------|------|
| Brand A  | 26 SKUs       | ~26 (full line)          | ~100%     | In-stock |
| Brand B  | 0 in-stock    | ~800+ SKUs               | <1%       | Quote-to-order |
| Brand C  | 3 surplus lots | N/A                     | N/A       | Surplus only |
```

**Key finding pattern:** Small VARs almost always stock only their own private-label product and 1-2 commodity fast-movers. All OEM brands are quote-to-order. Document this clearly — it is counterintuitive.

### Business model mix

Break revenue into modes. Use evidence, not guesses:

| Mode | Description | Evidence sources |
|------|-------------|-----------------|
| New VAR (quote-to-order) | Ordered after customer commits | Active job listings mention it; case studies describe it |
| New e-commerce | In-stock products on live store | Visible at store URL; free shipping offer |
| Refurbished | Used/tested equipment resold | Website section, job titles ("refurb technician") |
| Rental | Short-term equipment loans | Rental brochure, dedicated page |
| Surplus / liquidation | One-time bulk lots | Live surplus listings at known prices |

**Template:**
```markdown
| Mode | Est. % of revenue | Evidence | Confidence |
|------|------------------|----------|------------|
| New VAR | 60-70% | Core business model per website, job postings, case studies | Medium |
| New e-comm | 10-15% | Live store with 28 in-stock SKUs; free shipping | Medium |
| Surplus | 5-15% | 3 live surplus listings totaling ~$2M face value | High |
| Rental | 5-10% | 2024 Power Rentals brochure; dedicated /powerrentals page | High |
| Refurb | 3-8% | Mentioned in offerings; no dedicated page | Low |
```

**Surplus red flag:** Large surplus listings relative to estimated annual revenue are a significant signal. If face-value surplus inventory on hand is 20-40% of estimated annual revenue, the company either has excess capital, a failed project return, or a strategic liquidation business.

### Product asset audit

For each product category, assess whether comprehensive data exists:

| Asset type | Where to look | What "complete" means |
|------------|-------------|----------------------|
| Product photo | Store product page, datasheet | High-res, multiple angles, labeled |
| Spec sheet / datasheet | Downloadable PDF link on product page | Dimensions, electrical specs, certifications |
| Price | Store page, quote form | Published or clearly "request quote" |
| Marketing copy | Product description | More than one sentence |
| Installation guide | Docs section, footer | PDF or web page |
| Video | YouTube channel | Product demo or install walkthrough |

Score each category (Complete / Partial / Missing) and produce a priority-gap list.

---

## Folder maintenance

### Renaming a section folder

When renaming a folder (e.g., `02_People_and_Org` → `02_People_and_Organization`):

1. Do the rename first:
```bash
mv "02_People_and_Org" "02_People_and_Organization"
```

2. Find all cross-references across the dossier:
```bash
grep -rl "02_People_and_Org" /path/to/dossier --include="*.md"
```

3. Update each file. Use `sed` for bulk replacement:
```bash
grep -rl "02_People_and_Org" /path/to/dossier --include="*.md" | \
  xargs sed -i '' 's|02_People_and_Org|02_People_and_Organization|g'
```

4. Verify no old references remain:
```bash
grep -r "02_People_and_Org" /path/to/dossier --include="*.md"
```

### Canonicalizing duplicate datasets

If the same data (e.g., product list) exists in two places, pick one as canonical, delete the other, and update all references:

1. Identify the canonical file (the more complete, more up-to-date one)
2. Delete the duplicate: `rm path/to/duplicate.csv`
3. Find all references: `grep -rl "duplicate.csv" . --include="*.md"`
4. Update references to point to the canonical path
5. Commit the deletion as a separate commit with a clear message

### Empty directory cleanup

After restructuring, remove empty directories to keep the vault clean:
```bash
find /path/to/dossier -type d -empty | sort
# Review the list, then:
find /path/to/dossier -type d -empty -delete
```

---

## Intelligence dimensions beyond the basics

After the standard dossier sections are populated, these dimensions add material value:

1. **Revenue by product category** — Where does the money actually come from? Differs from catalog breadth.
2. **Average selling price (ASP) by category** — Drives deal economics and sales cycle length.
3. **Geographic demand by state** — Where is the company hiring? That is where the pipeline is.
4. **Partner tier and margin structure** — Preferred-tier pricing = 5-15% better margins; look for partner portal indicators.
5. **Product lifecycle signals** — Pages that were live and then deleted reveal pivot direction. Wayback Machine CDX is the source.
6. **Cross-sell / attach rate** — Which products are sold together? Determines what a typical project looks like.
7. **Lead time by product** — In-stock vs. 16-week lead time is a key competitive differentiator to document.
8. **Competitive SKU overlap** — Where the catalog overlaps with larger competitors, the company must compete on relationships, not product.
9. **E-commerce signals** — Platform (Wix, Shopify, etc.), SEO domain authority, pixel installs, free shipping offers.
10. **Certification value by customer segment** — Which certs unlock which customer tiers? What is at risk if a cert expires?

---

## Writing style for dossier files

- No em dashes (use commas, periods, or parentheses instead)
- Active voice throughout
- Tables preferred over prose for lists of facts
- Every claim gets a confidence tag: `[High]`, `[Medium]`, `[Low]`
- Every claim gets a source inline or in a footnote
- Avoid hedging language when the source is primary (filing, live page, PDF)

---

## Web traffic and keyword analysis

After the core dossier is built, add a web traffic section using the **`open-source-traffic-analysis`** skill. This populates `02_Web_Traffic_Analysis/` with:

- Multi-source traffic estimates (SimilarWeb API + Wayback CDX + Tranco + Cloudflare Radar)
- Keyword analysis with quantitative data from competitor SimilarWeb queries
- Geographic demand mapping (state-by-state data center capacity for DC infrastructure companies)
- Market size context per product category

**Key files:**
```
02_Web_Traffic_Analysis/
├── README.md              # Synthesized analysis with confidence ratings
├── KEYWORD_ANALYSIS.md    # Keywords with volumes, CPC, competitor benchmarks
├── raw_similarweb_data.md # Raw API responses
├── raw_wayback_data.md    # Full Wayback CDX capture log
└── raw_ranking_data.md    # Tranco, Cloudflare Radar, supplementary signals
```

## Competitive landscape analysis

Use the **`competitor-identification`** skill to build `05_Competitive_Landscape/`. The methodology:

1. Mine the existing dossier (supplier line card, partner logos, event data, any bulk competitor CSVs) before web searching
2. Search manufacturer partner directories for other resellers of the same brands
3. Process any large datasets (S&P Global, D&B) with Python keyword filtering
4. Validate candidates with SimilarWeb API and company profile databases
5. Build product/service coverage matrices, brand overlap matrices, and geographic overlap maps

**Key lesson from BROGAV dossier:** A 4,797-company S&P Global dataset yielded only 8 genuine competitors after screening. >99% of SIC-code-based datasets are irrelevant noise.

---

## Combining with other skills

- **`company-legal-reputation-research`** — Run first, before building the full dossier. Its output populates `01_Company_Profile/` and the `risk_register.md`.
- **`deep-research`** — Use for the scraping and document discovery phases that populate `08_Evidence_and_Sources/raw/`.
- **`open-source-traffic-analysis`** — Populates `02_Web_Traffic_Analysis/` with multi-source traffic estimates, keyword intelligence, and geographic demand data. No paid SEO tools required.
- **`competitor-identification`** — Populates `05_Competitive_Landscape/` with validated Top 10 competitors, product/brand/geographic matrices, and strategic implications.
- **`github-repo-management`** — Push the finished dossier to a private GitHub repo for version control and access management.
