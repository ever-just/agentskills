# Deep Research Agent Skill

Comprehensive methodology for agents to conduct thorough internet research on any topic, organization, or event.

## Overview

This skill teaches agents how to find, extract, synthesize, and organize **all available data** on any subject by following a proven 7-phase pipeline. It combines strategic web searching, hidden document discovery, multi-platform data extraction, source triangulation, and structured reporting.

**Time Investment:** 2-3 hours for comprehensive research  
**Difficulty:** Advanced  
**Prerequisites:** Basic Python, async/await, web scraping concepts

## Quick Start (30 minutes)

1. Read `AGENT_SKILL_QUICK_REFERENCE.md`
2. Follow the 7-phase pipeline
3. Adapt code snippets to your topic

## Complete Learning (2-3 hours)

1. Read `AGENT_SKILL_INDEX.md` (navigation guide)
2. Read `AGENT_SKILL_DEEP_RESEARCH.md` (main guide)
3. Study `AGENT_SKILL_REAL_EXAMPLES.md` (case studies)
4. Review `RESEARCH_METHODOLOGY.md` (original research)

## The 7-Phase Pipeline

```
1. PLAN (5 min)
   → Use sequential thinking to enumerate sources
   → Create research checklist
   → Identify data categories

2. LOCAL (5 min)
   → Parse existing cached data
   → Analyze repository structure
   → Identify gaps

3. SEARCH (15 min)
   → Broad discovery searches
   → Targeted source searches
   → Domain-specific searches

4. WAYBACK (30 min)
   → Wayback Machine CDX API for PDFs
   → Live server probing
   → Download & extract documents

5. SCRAPE (30 min)
   → Identify platforms (Sched, Emamo, Eventbrite, etc.)
   → Rate-limited async scraping
   → HTML parsing & JSON extraction

6. SYNTHESIZE (30 min)
   → Cross-reference metrics
   → Tag confidence levels (high/med/low)
   → Resolve conflicts

7. REPORT (30 min)
   → Generate Excel workbook
   → Generate PDF report
   → Document sources & methodology
```

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
10. **Generate reports** — Excel + PDF for different audiences

## Success Criteria

✅ Coverage: Find data from 3+ independent sources  
✅ Confidence: Tag all metrics with confidence levels  
✅ Organization: Structured folders and master datasets  
✅ Documentation: Every metric has source attribution  
✅ Triangulation: Same metric from 3+ sources = high confidence  
✅ Completeness: Cover all major data categories  
✅ Accessibility: Reports in Excel + PDF formats  
✅ Replicability: Document methodology for future use  

## Files in This Skill

| File | Purpose | Length |
|------|---------|--------|
| `AGENT_SKILL_INDEX.md` | Navigation guide | ~400 lines |
| `AGENT_SKILL_QUICK_REFERENCE.md` | Quick reference card | ~300 lines |
| `AGENT_SKILL_DEEP_RESEARCH.md` | Complete methodology guide | ~1,500 lines |
| `AGENT_SKILL_REAL_EXAMPLES.md` | Real case studies from TCSW | ~600 lines |
| `RESEARCH_METHODOLOGY.md` | Original TCSW research documentation | ~1,200 lines |
| `RESEARCH_PROMPT_TEMPLATE.md` | Reusable research prompt template | ~400 lines |
| `SEARCH_SYNTHESIS_WALKTHROUGH.md` | Step-by-step process walkthrough | ~800 lines |

## Real Results

**From Twin Cities Startup Week Research:**
- 9 years of sched.com data (2015-2019, 2023)
- 3 years of Emamo data (2020-2022)
- 26 hidden PDFs found via Wayback CDX
- 303 YouTube videos with view counts
- 7 years of IRS 990 financial data
- Complete speaker database (625 speakers)
- Complete session database (398 sessions)
- MN Cup history (21 years of prize data)

**Reports Generated:**
- TCSW_Quantitative_Master.xlsx (8 sheets, 500+ rows)
- TCSW_Quantitative_Master.pdf (formatted report)
- hidden_docs_and_deep_quant.json (raw data)

**Time Invested:** ~20 hours total research  
**Data Points Collected:** 500+  
**Sources Used:** 15+  
**Confidence Level:** High (3+ sources per metric)

## Tools & Libraries

```bash
pip install aiohttp beautifulsoup4 lxml pdfminer.six openpyxl reportlab
```

**Core Tools:**
- `aiohttp` — Async HTTP requests
- `BeautifulSoup` — HTML parsing
- `pdfminer.six` — PDF text extraction
- `openpyxl` — Excel generation
- `reportlab` — PDF generation
- `asyncio` — Concurrency management
- `regex` — Pattern extraction

## When to Use This Skill

✅ **Use when you need to:**
- Find **all available data** on a topic
- Discover **hidden documents**
- Extract from **multiple platforms**
- Build **comprehensive databases**
- Create **authoritative reports**
- **Triangulate** findings for confidence

❌ **Don't use for:**
- Quick fact-checking (use web search)
- Real-time data (use APIs)
- Proprietary/private information

## Getting Started

### Option 1: Quick Start (30 minutes)
```
1. Read AGENT_SKILL_QUICK_REFERENCE.md
2. Follow the 7-phase pipeline
3. Adapt code snippets to your topic
```

### Option 2: Complete Learning (2-3 hours)
```
1. Read AGENT_SKILL_INDEX.md
2. Read AGENT_SKILL_DEEP_RESEARCH.md
3. Study AGENT_SKILL_REAL_EXAMPLES.md
4. Review RESEARCH_METHODOLOGY.md
```

### Option 3: Learning by Example (1-2 hours)
```
1. Start with AGENT_SKILL_REAL_EXAMPLES.md
2. Review the 8 real examples from TCSW
3. Understand what worked and what failed
4. Apply to your own research
```

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
   - Identify platforms
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

## Questions?

Refer to the appropriate documentation:
- **"How do I get started?"** → `AGENT_SKILL_QUICK_REFERENCE.md`
- **"How does this work?"** → `AGENT_SKILL_DEEP_RESEARCH.md`
- **"Show me examples"** → `AGENT_SKILL_REAL_EXAMPLES.md`
- **"What's the original research?"** → `RESEARCH_METHODOLOGY.md`
- **"How do I create my research prompt?"** → `RESEARCH_PROMPT_TEMPLATE.md`
- **"What was the actual process?"** → `SEARCH_SYNTHESIS_WALKTHROUGH.md`

---

**Created:** June 10, 2026  
**Based on:** Twin Cities Startup Week comprehensive research project  
**Status:** Complete and ready for use by any agent

