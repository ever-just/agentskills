# Agent Skill: Deep Research — Quick Reference Card

**For agents who need to conduct comprehensive research quickly**

---

## The 7-Phase Pipeline (TL;DR)

```
1. PLAN (5 min)      → Use sequential thinking, enumerate sources
2. LOCAL (5 min)     → Parse existing files, identify gaps
3. SEARCH (15 min)   → Broad → Targeted → Domain-specific
4. WAYBACK (30 min)  → CDX API for PDFs, Excel, Word docs
5. SCRAPE (30 min)   → Identify platforms, rate-limited async
6. SYNTHESIZE (30 min) → Cross-reference, tag confidence, resolve conflicts
7. REPORT (30 min)   → Excel + PDF with source attribution
```

**Total Time:** 2-3 hours for comprehensive research

---

## Phase 1: PLAN (5 minutes)

```python
# Use sequential thinking FIRST
Tool: mcp13_sequentialthinking

Brainstorm:
- What data categories exist?
- Where might data live?
- What tools do I need?
- What's the extraction difficulty?
```

---

## Phase 2: LOCAL (5 minutes)

```python
# Parse existing files
import json
from pathlib import Path
from collections import Counter

data = json.loads(Path('file.json').read_text())
by_year = Counter(item['year'] for item in data)

# Document what exists and what's missing
```

---

## Phase 3: SEARCH (15 minutes)

```python
# Broad discovery
search_web("[TOPIC] history timeline")
search_web("[TOPIC] statistics")

# Targeted sources
search_web("[ORG] nonprofit 990 IRS")
search_web("[TOPIC] annual report")

# Domain-specific
search_web("site:[DOMAIN] [KEYWORD]")
search_web("[TOPIC] [PLATFORM_NAME]")
```

---

## Phase 4: WAYBACK (30 minutes)

```python
# The goldmine: finds documents not on Google
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

# CRITICAL: Rate limit
await asyncio.sleep(1.5)  # Between each request

# MIME types to search
mimetypes = [
    "application/pdf",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/msword",
]
```

---

## Phase 5: SCRAPE (30 minutes)

```python
# Identify platforms
search_web("site:sched.com [TOPIC]")
search_web("site:eventbrite.com [TOPIC]")
search_web("site:emamo.com [TOPIC]")

# Rate-limited async scraping
async def scrape_platform(urls):
    sem = asyncio.Semaphore(4)  # Max 4 concurrent
    
    async def scrape_one(url):
        async with sem:
            await asyncio.sleep(0.4)  # Rate limit
            return await fetch(url)
    
    return await asyncio.gather(*[scrape_one(u) for u in urls])

# Parse HTML
from bs4 import BeautifulSoup
soup = BeautifulSoup(html, "lxml")
for item in soup.find_all(class_="session"):
    title = item.find(class_="title").text

# Extract JSON from page source
import re
views = re.search(r'"viewCount":\s*"(\d+)"', html)
```

---

## Phase 6: SYNTHESIZE (30 minutes)

```python
# Cross-reference metrics
metric_data = {
    "value": 19000,
    "sources": [
        {"type": "primary", "name": "PDF", "url": "..."},
        {"type": "primary", "name": "Article", "url": "..."},
        {"type": "secondary", "name": "Wikipedia", "url": "..."},
    ],
    "confidence": "high"  # 3+ sources = high
}

# Confidence levels
# HIGH: 3+ sources OR 1 primary source
# MEDIUM: 2 sources OR 1 secondary source
# LOW: 1 source OR conflicting sources

# Resolve conflicts: read context, check dates, check source type
```

---

## Phase 7: REPORT (30 minutes)

```python
# Excel generation
import openpyxl
from openpyxl.styles import Font, PatternFill

wb = openpyxl.Workbook()
ws = wb.active
ws.append(["Metric", "Value", "Source", "Confidence"])

# Clean illegal characters
def safe_str(v):
    if isinstance(v, str):
        return re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', v)
    return v

ws.append([safe_str(v) for v in row])
wb.save("report.xlsx")

# PDF generation
from reportlab.platypus import SimpleDocTemplate, Table, Paragraph
doc = SimpleDocTemplate("report.pdf")
story = [Paragraph("Title", styles['Heading1']), Table(data)]
doc.build(story)
```

---

## Common Pitfalls & Fixes

| Problem | Fix |
|---------|-----|
| 429/503 errors | Add `await asyncio.sleep(1.5)` |
| JS-rendered content | Look for JSON in page source |
| Illegal chars in Excel | Use `safe_str()` |
| Too many Wayback results | Add `&collapse=original` |
| PDF extraction fails | Might be image-based, use OCR |
| Parallel hangs | Use phased execution (fast → slow) |
| None in formatting | Guard with `if value else "N/A"` |

---

## Tools You'll Need

```bash
pip install aiohttp beautifulsoup4 lxml pdfminer.six openpyxl reportlab
```

---

## Folder Structure Template

```
research/
├── quantitative/
│   ├── master_data.json
│   └── master_report.xlsx
├── history/
├── people/
├── organizations/
├── media/
├── documents/
│   ├── pdfs/
│   └── spreadsheets/
└── raw/
    ├── html/
    └── json/
```

---

## Success Checklist

- [ ] Data from 3+ independent sources
- [ ] All metrics tagged with confidence
- [ ] Structured folders and master datasets
- [ ] Every metric has source attribution
- [ ] Same metric from 3+ sources = high confidence
- [ ] Cover all major data categories
- [ ] Reports in Excel + PDF
- [ ] Methodology documented

---

## Key Principles

1. **Think first** — Use sequential thinking before coding
2. **Start local** — Parse existing files first (zero network cost)
3. **Search strategically** — Broad → Targeted → Domain-specific
4. **Wayback is goldmine** — Finds documents not on Google
5. **Rate limit aggressively** — 1.5s for Wayback, 0.4s for YouTube
6. **Phase execution** — Fast parallel, then rate-limited sequential
7. **Triangulate findings** — 3+ sources = high confidence
8. **Document sources** — Every metric needs attribution
9. **Build reusable scripts** — Separate concerns
10. **Generate reports** — Excel + PDF for stakeholders

---

## Example: Research Any Organization in 2-3 Hours

```
1. PLAN (5 min)
   - What data do I need?
   - Where might it live?

2. LOCAL (5 min)
   - Check existing files
   - Identify gaps

3. SEARCH (15 min)
   - search_web("[ORG] history")
   - search_web("[ORG] 990 IRS")
   - search_web("[ORG] annual report")

4. WAYBACK (30 min)
   - Hunt for PDFs, Excel, Word docs
   - Download all found files

5. SCRAPE (30 min)
   - Identify platforms (Sched, Eventbrite, etc.)
   - Extract data with rate limiting

6. SYNTHESIZE (30 min)
   - Cross-reference metrics
   - Tag confidence levels
   - Resolve conflicts

7. REPORT (30 min)
   - Generate Excel workbook
   - Generate PDF report
   - Document sources
```

---

## When to Use This Skill

✅ Find **all available data** on a topic  
✅ Discover **hidden documents**  
✅ Extract from **multiple platforms**  
✅ Build **comprehensive databases**  
✅ Create **authoritative reports**  
✅ **Triangulate** findings for confidence  

❌ Quick fact-checking (use web search)  
❌ Real-time data (use APIs)  
❌ Proprietary/private info (respect privacy)  

---

## Full Documentation

See `AGENT_SKILL_DEEP_RESEARCH.md` for complete guide with:
- Detailed explanations of each phase
- Code examples for every step
- Advanced techniques
- Teaching strategies
- Troubleshooting guide

---

**Quick Start:** Follow the 7-phase pipeline above. Allocate 2-3 hours. Document everything.

