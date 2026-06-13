# Web Crawl Intelligence Extraction

> Process saved "webcomplete" browser captures, Wayback Machine archives, video transcripts, and API data dumps to extract intelligence from data that was already collected but never systematically analyzed.

---

## When to use

- You have a `research/` folder with saved HTML pages, text extractions, video transcripts, and API data
- A prior research session crawled a website but only analyzed a subset of the data
- You need to extract intelligence from deleted/archived pages captured via Wayback Machine
- You have saved LinkedIn MHTML archives, PDF text extractions, or browser "Save As Complete" files

---

## The problem

Web crawl sessions often collect far more data than they analyze. A typical crawl of a company website might produce:
- 50+ HTML pages with text extractions
- 10-30 deleted/archived Wayback pages
- 5-15 PDF text extractions
- Video transcripts
- API response data (government databases, corporate registries)
- Saved LinkedIn pages
- Partner logo images with OCR data
- SEO audit data

The intelligence is already downloaded — it just needs systematic extraction.

---

## Workflow

### Phase 1: Inventory the data

```bash
# List all content files (excluding JS/CSS/images)
find research/ -type f \( -name "*.txt" -o -name "*.md" -o -name "*.csv" \
  -o -name "*.json" -o -name "*.html" \) ! -path "*/site_files/*" | sort
```

Categorize files by type:
- **Text extractions** (`raw/html/text/*.txt`) — rendered page content
- **Deleted pages** (`raw/wayback/deleted_pages/*.txt`) — pages no longer on live site
- **Video transcripts** (`raw/video/transcript_*.txt`) — podcast/video content
- **API data** (`raw/api/*.json`, `*.html`) — government/corporate registry responses
- **LinkedIn data** (`raw/linkedin/`) — activity posts, hashtags, media URLs
- **OCR data** (`brand/partner_logos/_ocr.json`) — text extracted from logo images
- **Research reports** (`*.md` in research root) — prior analysis

### Phase 2: Prioritize by intelligence value

| File type | Intelligence value | Priority |
|-----------|-------------------|----------|
| **Deleted product/pricing pages** | Highest — pricing, specs, RFQ forms | 1 |
| **Deleted event/sponsor pages** | High — speaker lists, ticket prices, sponsor companies | 1 |
| **Video/podcast transcripts** | High — unscripted quotes, revenue hints, customer names | 1 |
| **Contact/team pages** | High — emails, phones, addresses, staff names | 1 |
| **API data** (government, corporate) | High — structured data, federal registrations | 2 |
| **LinkedIn activity posts** | High — deal signals, hiring, customer tags | 2 |
| **Partner/offerings pages** | Medium — supplier relationships, product taxonomy | 2 |
| **Testimonial pages** | Medium — client names, endorsements | 2 |
| **OCR partner logos** | Medium — definitive brand identification | 3 |
| **SEO audit data** | Low-Medium — DA score, backlinks, rankings | 3 |
| **Homepage/about content** | Low — usually already captured | 4 |

### Phase 3: Extract with parallel agents

Launch 2-3 extraction agents in parallel, each focused on a different file category:

**Agent 1: Deleted/archived pages**
- Read all `deleted_pages/*.txt` files
- Extract: pricing, specifications, RFQ form fields, addresses, contact info, sponsor lists, speaker rosters, ticket prices

**Agent 2: Transcripts + API data + LinkedIn**
- Read all `transcript_*.txt` files — extract revenue hints, customer names, strategic plans, employee mentions
- Read API JSON/HTML files — extract structured data from government databases
- Read LinkedIn post text — extract deal signals, hiring announcements, company tags

**Agent 3: Key text pages + research reports**
- Read testimonial, services, offerings, careers, case study text extractions
- Read research reports for findings not yet in the dossier
- Extract client names, service descriptions, pricing, job requirements

### Phase 4: Cross-reference and place

For each finding:
1. Check if it's already in the dossier (grep for key terms)
2. If new, place it in the correct dossier file with source attribution
3. If it contradicts existing data, flag the discrepancy
4. If it corrects existing data, update with "[CORRECTED (date)]" notation

---

## What to look for in each file type

### Deleted product pages
- **Pricing** — may contain prices no longer on the live site
- **RFQ form fields** — reveal what technical specs the company can configure
- **Product features** — may list capabilities that were removed or consolidated
- **Footer addresses** — may show addresses that changed over time

### Video transcripts
- **Revenue or deal size mentions** — people say things in podcasts they'd never put on a website
- **Customer names** — hosts sometimes ask "who are your clients?"
- **Hiring philosophy** — how they recruit, what they look for
- **Competitive positioning** — how they describe their differentiation
- **Personal details** — founding story, motivation, family connections

### Deleted event pages
- **Ticket prices** — quantifies event revenue
- **Speaker rosters** — maps commercial relationships
- **Sponsor tiers** — reveals pricing structure
- **Attendee policies** — "end-users attend free" vs. paid reveals business model

### OCR logo data
- Read `_ocr.json` files to identify partner brands from logo images
- OCR text is imperfect — cross-reference with HTML alt-text and filename analysis

---

## Real-world example

Processing 75+ files from a saved web crawl (June 2026) surfaced:
- **Complete product pricing** (24 cabinet SKUs at $1,805-$3,016) that WebFetch couldn't extract from the live Wix SPA
- **$425 event ticket price** from a deleted Wayback page
- **"End-users attend free"** policy change between event years (from deleted pages)
- **Previously unknown employee "Tiffany"** (DoD background) mentioned in a podcast transcript
- **Recruiting methods** (neighbor recruitment, college friend network) from transcript analysis
- **Product line evolution timeline** (3 categories in 2024 → 6 in 2025 → consolidated eCommerce in 2026) from deleted page sequence
- **"Brody is Celina's son, not a dog"** correction — discovered from LinkedIn post text extraction

The pricing data alone — sitting unread in saved text files — was the single most valuable extraction of the entire session.
