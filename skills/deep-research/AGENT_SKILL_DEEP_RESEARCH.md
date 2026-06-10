# Agent Skill: Deep Research Methodology
## Comprehensive Guide for Agents to Conduct Thorough Internet Research

**Created:** June 10, 2026  
**Purpose:** Enable any agent to replicate the complete research process used for Twin Cities Startup Week  
**Difficulty:** Advanced  
**Time Estimate:** 4-8 hours per research project

---

## Overview

This skill teaches agents how to conduct **comprehensive, multi-source research** on any topic, organization, or event. It combines:
- Strategic web searching
- Hidden document discovery
- Data extraction from multiple platforms
- Source triangulation
- Structured organization
- Report generation

**Key Principle:** Think first, code second. Plan the research before executing.

---

## When to Use This Skill

Use this skill when you need to:
- Find **all available data** on a topic (not just top search results)
- Discover **hidden documents** (PDFs, Excel files, archived pages)
- Extract data from **multiple platforms** (websites, social media, APIs)
- Build **comprehensive databases** from scattered sources
- Create **authoritative reports** with proper source attribution
- **Triangulate** findings across 3+ sources for confidence

**Not ideal for:**
- Quick fact-checking (use web search instead)
- Real-time data (use APIs instead)
- Proprietary/private information (respect privacy)

---

## The Complete Research Pipeline

```
PHASE 1: PLANNING
├─ Use sequential thinking to enumerate sources
├─ Identify data categories
├─ Plan extraction tiers
└─ Create research checklist

PHASE 2: LOCAL DATA
├─ Parse existing cached data
├─ Analyze repository structure
├─ Identify gaps
└─ Extract initial metrics

PHASE 3: WEB DISCOVERY
├─ Broad discovery searches
├─ Targeted source searches
├─ Domain-specific searches
└─ Alternative source searches

PHASE 4: HIDDEN DOCUMENTS
├─ Wayback Machine CDX API
├─ Live server probing
├─ Archive searching
└─ Download & extract

PHASE 5: PLATFORM SCRAPING
├─ Identify platforms (Sched, Emamo, Eventbrite, etc.)
├─ Rate-limited async scraping
├─ JSON extraction from page source
└─ HTML parsing with BeautifulSoup

PHASE 6: SYNTHESIS
├─ Cross-reference metrics
├─ Tag confidence levels
├─ Resolve conflicts
└─ Build master datasets

PHASE 7: ORGANIZATION
├─ Categorize into folders
├─ Create structured JSON
├─ Build Excel workbooks
└─ Generate PDF reports
```

---

## Phase 1: Planning (Before Any Code)

### Step 1.1: Use Sequential Thinking

**Tool:** `mcp13_sequentialthinking`

**Brainstorm:**
1. What data categories exist? (historical, financial, people, organizations, media, documents)
2. Where might this data live? (websites, PDFs, social media, APIs, archives)
3. What tools do I need? (web search, Wayback, scrapers, PDF extractors)
4. What's the extraction difficulty? (Tier 1: local, Tier 2: Wayback, Tier 3: JS-heavy, Tier 4: APIs)

**Example Output:**
```
Data Categories:
- Historical: timelines, milestones, founding story
- Financial: revenue, funding, budgets, 990 filings
- People: founders, employees, speakers, advisors
- Organizations: sponsors, partners, competitors
- Media: press coverage, social media, videos
- Documents: reports, decks, prospectuses, filings

Source Types:
- Official websites
- Wikipedia/reference sites
- News archives
- Social media
- IRS/government databases
- Wayback Machine
- Event platforms (Sched, Eventbrite, etc.)
- PDF archives
- Press releases
```

### Step 1.2: Create Research Checklist

**Discovery Phase:**
- [ ] Web search for official website
- [ ] Web search for Wikipedia article
- [ ] Web search for news coverage
- [ ] Web search for social media profiles
- [ ] Identify key domains to search
- [ ] Identify key people/organizations
- [ ] Check for nonprofit status (EIN lookup)

**Data Collection Phase:**
- [ ] Parse any existing local data
- [ ] Wayback Machine CDX for PDFs
- [ ] Wayback Machine CDX for Excel files
- [ ] Wayback Machine CDX for Word docs
- [ ] Download all found documents
- [ ] Scrape official website
- [ ] Scrape event platforms
- [ ] Scrape social media
- [ ] Search IRS 990 database (if nonprofit)
- [ ] Search press release archives

**Extraction Phase:**
- [ ] Extract text from PDFs
- [ ] Parse spreadsheets
- [ ] Extract data from HTML
- [ ] Parse JSON exports
- [ ] Extract numbers with regex
- [ ] Extract dates and timelines
- [ ] Extract people names
- [ ] Extract organization names

**Synthesis Phase:**
- [ ] Cross-reference metrics across sources
- [ ] Tag confidence levels (high/med/low)
- [ ] Organize into folder structure
- [ ] Build master datasets (JSON, CSV)
- [ ] Create timeline/chronology
- [ ] Identify gaps in data
- [ ] Document methodology

**Reporting Phase:**
- [ ] Generate Excel workbook
- [ ] Generate PDF report
- [ ] Create summary document
- [ ] Document all sources
- [ ] Create replication guide

---

## Phase 2: Local Data (Zero Network Cost)

### Step 2.1: Parse Existing Files

**Command:**
```python
import json
from pathlib import Path
from collections import Counter

# Parse JSON files
data = json.loads(Path('local_file.json').read_text())

# Count by category
by_year = Counter(item['year'] for item in data)
by_type = Counter(item['type'] for item in data)

print(f"Total items: {len(data)}")
print(f"By year: {dict(by_year)}")
print(f"By type: {dict(by_type)}")
```

**What to Look For:**
- Cached API responses
- Exported data (JSON, CSV, Excel)
- Markdown documentation
- Historical records
- Previous research

### Step 2.2: Analyze Repository Structure

**Command:**
```bash
find . -type f -name "*.json" -o -name "*.csv" -o -name "*.md" | head -20
```

**Document:**
- What data already exists
- What's missing
- Data quality and completeness
- Potential gaps to fill

---

## Phase 3: Web Discovery (Strategic Searching)

### Step 3.1: Broad Discovery Searches

**Tool:** `search_web()`

**Pattern:**
```python
search_web("[TOPIC] history timeline")
search_web("[TOPIC] statistics data")
search_web("[TOPIC] annual report")
search_web("[ORGANIZATION] nonprofit 990 IRS")
```

**What to Find:**
- Official websites
- Wikipedia articles
- News coverage
- Press releases
- Social media profiles

### Step 3.2: Targeted Source Searches

**Pattern:**
```python
search_web("[TOPIC] [SPECIFIC_METRIC] [YEAR]")
search_web("site:[DOMAIN] [KEYWORD]")
search_web("[TOPIC] [PLATFORM_NAME]")
```

**Examples:**
```python
search_web("Twin Cities Startup Week attendance 2020")
search_web("site:beta.mn annual report PDF")
search_web("Twin Cities Startup Week sched.com")
```

### Step 3.3: Alternative Source Searches

**Pattern:**
```python
search_web("[TOPIC] [ALTERNATIVE_PLATFORM]")
search_web("[TOPIC] [YEAR] emamo OR eventbrite OR sched")
search_web("[TOPIC] [COMPETITOR_NAME]")
```

**Why:** Discover alternative platforms, competitors, related topics

---

## Phase 4: Hidden Document Discovery

### Step 4.1: Wayback Machine CDX API

**The Goldmine:** Finds documents not indexed by Google

**Query Structure:**
```python
import aiohttp
import asyncio

async def wayback_hunt(domain, mimetype):
    url = (
        f"http://web.archive.org/cdx/search/cdx"
        f"?url={domain}/*"
        f"&output=json"
        f"&filter=mimetype:{mimetype}"
        f"&filter=statuscode:200"
        f"&collapse=original"
        f"&limit=50"
    )
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as r:
            return await r.json()
```

**MIME Types to Search:**
```python
mimetypes = [
    "application/pdf",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/csv",
    "application/vnd.ms-powerpoint",
]
```

**Critical:** Add `await asyncio.sleep(1.5)` between requests (mandatory rate limit)

### Step 4.2: Live Server Probing

**Common Hidden Paths:**
```python
HIDDEN_PATHS = [
    "/sponsor-prospectus.pdf",
    "/sponsorship-deck.pdf",
    "/media-kit.pdf",
    "/annual-report.pdf",
    "/impact-report.pdf",
    "/press-kit.zip",
    "/speaker-guide.pdf",
]

for path in HIDDEN_PATHS:
    url = f"https://{domain}{path}"
    response = await session.head(url)  # HEAD = faster
    if response.status == 200:
        print(f"FOUND: {url}")
```

### Step 4.3: PDF Download & Text Extraction

**Tool:** `pdfminer.six`

```python
import pdfminer.high_level as pml

text = pml.extract_text("document.pdf")

# Extract numbers with regex
import re
attendees = re.findall(r'(\d[\d,]+)\+?\s*attendees?', text, re.I)
revenue = re.findall(r'\$\s*([\d,]+(?:\.\d+)?)', text, re.I)
```

---

## Phase 5: Platform Scraping

### Step 5.1: Identify Platforms

**Common Event Platforms:**
- sched.com (event scheduling)
- Eventbrite (ticketing)
- Emamo (event management)
- Hopin (virtual events)
- Meetup.com (community events)

**Discovery:**
```python
search_web("site:sched.com [TOPIC]")
search_web("site:eventbrite.com [TOPIC]")
search_web("site:emamo.com [TOPIC]")
```

### Step 5.2: Rate-Limited Async Scraping

**Pattern:**
```python
async def scrape_platform(platform_urls):
    sem = asyncio.Semaphore(4)  # Max 4 concurrent
    
    async def scrape_one(url):
        async with sem:
            await asyncio.sleep(0.4)  # Rate limit
            return await fetch(url)
    
    tasks = [scrape_one(url) for url in platform_urls]
    return await asyncio.gather(*tasks)
```

**Rate Limits by Platform:**
- Wayback CDX: 1.5s between requests
- YouTube: 0.3-0.4s between requests
- General websites: 0.5-1.0s between requests

### Step 5.3: HTML Parsing with BeautifulSoup

```python
from bs4 import BeautifulSoup

soup = BeautifulSoup(html, "lxml")

# Extract specific elements
for item in soup.find_all(class_="session"):
    title = item.find(class_="title").text
    time = item.find(class_="time").text
    speaker = item.find(class_="speaker").text
```

### Step 5.4: JSON Extraction from Page Source

```python
import re
import json

# YouTube example
views = re.search(r'"viewCount":\s*"(\d+)"', html)
if views:
    view_count = int(views.group(1))

# Extract full JSON object
data = re.search(r'var ytInitialData = ({.*?});', html)
if data:
    json_data = json.loads(data.group(1))
```

---

## Phase 6: Synthesis & Triangulation

### Step 6.1: Cross-Reference Metrics

**For each metric, track:**
```json
{
  "metric": "2020_attendance",
  "value": 19000,
  "confidence": "high",
  "sources": [
    {
      "type": "primary",
      "name": "Medium article by organizers",
      "url": "https://...",
      "date_accessed": "2026-06-06"
    },
    {
      "type": "primary",
      "name": "TCSW 2020 Recap PDF",
      "file": "pdfs/TCSW_2020_recap.pdf",
      "page": 1
    }
  ],
  "notes": "Virtual event, 21 days"
}
```

### Step 6.2: Confidence Tagging

**High Confidence:**
- 3+ independent sources agree
- OR 1 primary source (official PDF, 990 filing)

**Medium Confidence:**
- 2 sources agree
- OR 1 secondary source (news article, Wikipedia)

**Low Confidence:**
- 1 source only
- OR conflicting sources

### Step 6.3: Resolve Conflicts

**When numbers disagree:**
1. Read surrounding context carefully
2. Check source dates (newer = more accurate)
3. Check source type (primary > secondary)
4. Document the discrepancy
5. Tag with lower confidence

---

## Phase 7: Organization & Reporting

### Step 7.1: Folder Structure

```
research/
├── quantitative/
│   ├── master_data.json
│   └── master_report.xlsx
├── history/
│   ├── timeline.md
│   └── year_summaries/
├── people/
│   ├── speakers_database.json
│   └── organizers.json
├── organizations/
│   ├── sponsors_by_year.json
│   └── partners.json
├── media/
│   ├── press_coverage.json
│   └── youtube_videos.json
├── documents/
│   ├── pdfs/
│   ├── spreadsheets/
│   └── presentations/
└── raw/
    ├── html/
    ├── json/
    └── api_responses/
```

### Step 7.2: Master Dataset Structure

```python
master_data = {
    "metadata": {
        "research_date": "2026-06-10",
        "sources_count": 15,
        "data_points": 500,
    },
    "by_category": {
        "quantitative": [...],
        "historical": [...],
        "people": [...],
    },
    "by_confidence": {
        "high": [...],
        "medium": [...],
        "low": [...],
    }
}
```

### Step 7.3: Excel Report Generation

```python
import openpyxl
from openpyxl.styles import Font, PatternFill

wb = openpyxl.Workbook()
ws = wb.active

# Header
ws.append(["Metric", "Value", "Year", "Source", "Confidence"])
ws[1][0].font = Font(bold=True)
ws[1][0].fill = PatternFill("solid", fgColor="000000")

# Data (clean illegal characters)
for row in data:
    ws.append([safe_str(v) for v in row])

wb.save("report.xlsx")
```

### Step 7.4: PDF Report Generation

```python
from reportlab.platypus import SimpleDocTemplate, Table, Paragraph
from reportlab.lib.pagesizes import letter

doc = SimpleDocTemplate("report.pdf", pagesize=letter)
story = []

# Add sections
story.append(Paragraph("Research Report", styles['Heading1']))
story.append(Table(data))

doc.build(story)
```

---

## Key Tools & Libraries

| Tool | Purpose | When to Use |
|------|---------|------------|
| `search_web()` | Web search | Discovery phase |
| `read_url_content()` | Fetch web pages | Reading articles, reports |
| `read_file()` | Read local files | Parsing existing data |
| `aiohttp` | Async HTTP requests | Scraping multiple pages |
| `BeautifulSoup` | HTML parsing | Extracting data from websites |
| `pdfminer.six` | PDF text extraction | Extracting text from PDFs |
| `regex` | Pattern matching | Extracting numbers, dates |
| `openpyxl` | Excel generation | Creating reports |
| `reportlab` | PDF generation | Creating formatted reports |
| `asyncio` | Concurrency | Rate-limited scraping |

---

## Common Pitfalls & Solutions

| Pitfall | Problem | Solution |
|---------|---------|----------|
| Rate limiting | 429/503 errors | Add `await asyncio.sleep(1.5)` |
| JS-rendered content | BeautifulSoup returns empty | Look for JSON in page source |
| Illegal characters in Excel | `IllegalCharacterError` | Use `safe_str()` to remove control chars |
| Wayback too many results | 10,000+ results | Add `&collapse=original` |
| PDF text extraction fails | Empty string returned | PDF might be image-based, use OCR |
| Missing metadata | No dates/authors | Extract from URL patterns, filenames |
| Parallel execution hangs | Timeouts on slow sources | Use phased execution (fast → slow) |
| None values in formatting | TypeError | Guard with `if value else "N/A"` |

---

## Complete Example: Research Any Organization

### Step 1: Plan (5 minutes)

```
Organization: [NAME]
Data needed: Historical, financial, people, media, documents
Sources: Website, Wikipedia, news, IRS 990, social media, Wayback
Platforms: Identify event platforms if applicable
```

### Step 2: Local Data (5 minutes)

```python
# Check what exists locally
find . -type f -name "*.json" -o -name "*.md"
```

### Step 3: Web Search (15 minutes)

```python
search_web("[ORG] history")
search_web("[ORG] nonprofit 990 IRS")
search_web("[ORG] annual report")
search_web("[ORG] press release")
```

### Step 4: Hidden Documents (30 minutes)

```python
# Wayback CDX for PDFs
wayback_hunt("domain.com", "application/pdf")
```

### Step 5: Platform Scraping (30 minutes)

```python
# Identify and scrape platforms
scrape_platform(platform_urls)
```

### Step 6: Synthesis (30 minutes)

```python
# Cross-reference, tag confidence, resolve conflicts
triangulate_metrics(all_sources)
```

### Step 7: Reporting (30 minutes)

```python
# Generate Excel + PDF reports
generate_excel_report(data)
generate_pdf_report(data)
```

**Total Time:** ~2-3 hours for comprehensive research

---

## Success Criteria

A successful deep research project should:

✅ **Coverage:** Find data from 3+ independent sources  
✅ **Confidence:** Tag all metrics with confidence levels  
✅ **Organization:** Structured folders and master datasets  
✅ **Documentation:** Every metric has source attribution  
✅ **Triangulation:** Same metric from 3+ sources = high confidence  
✅ **Completeness:** Cover all major data categories  
✅ **Accessibility:** Reports in Excel + PDF formats  
✅ **Replicability:** Document methodology for future use  

---

## Advanced Techniques

### Recursive Wayback Searching
```python
# Find all PDFs, then search for more PDFs in same directory
found_urls = wayback_search("domain.com", "application/pdf")
directories = set(os.path.dirname(url) for url in found_urls)
for directory in directories:
    more_pdfs = wayback_search(f"{directory}/*", "application/pdf")
```

### Cross-Domain Link Following
```python
# Find all links on main site, then search Wayback for each
links = extract_links("https://domain.com")
for link in links:
    if "report" in link or "sponsor" in link:
        wayback_search(link, "application/pdf")
```

### Temporal Analysis
```python
# Search for same URL across different years
for year in range(2014, 2025):
    url = f"https://domain.com/annual-report-{year}.pdf"
    wayback_search(url, "application/pdf")
```

### Fuzzy Filename Matching
```python
# Try common variations
patterns = [
    "annual-report-{year}.pdf",
    "{year}-annual-report.pdf",
    "report-{year}.pdf",
    "{year}_report.pdf",
]
for pattern in patterns:
    for year in range(2014, 2025):
        try_url(pattern.format(year=year))
```

---

## Teaching Others

When teaching this skill to other agents:

1. **Start with planning** — Use sequential thinking first
2. **Parse local data** — Zero network cost, immediate results
3. **Use web search** — Find authoritative sources
4. **Wayback for hidden docs** — Filter by mimetype
5. **Rate limit aggressively** — Respect server limits
6. **Phase execution** — Fast parallel → rate-limited sequential → slow sequential
7. **Triangulate findings** — 3+ sources = high confidence
8. **Document sources** — Every metric needs attribution
9. **Build reusable scripts** — Separate concerns (discover, download, extract, compile)
10. **Generate reports** — Excel + PDF for stakeholders

---

## Conclusion

This skill enables agents to conduct **comprehensive, multi-source research** on any topic. By following the pipeline:

```
Think → Parse Local → Search Web → Wayback Hunt → Download Files → 
Extract Data → Scrape Live → Triangulate → Clean → Organize → Report
```

Agents can find and organize **all available data** on any organization, event, or topic, with proper source attribution and confidence tagging.

**Key Principle:** Quality research takes time. Plan first, execute second, verify always.

---

**End of Agent Skill: Deep Research Methodology**
