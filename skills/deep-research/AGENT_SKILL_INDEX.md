# Agent Skill: Deep Research — Complete Index

**A comprehensive skill for agents to conduct thorough internet research**

---

## Overview

This skill teaches agents how to find, extract, synthesize, and organize **all available data** on any topic, organization, or event. It combines strategic web searching, hidden document discovery, multi-platform data extraction, source triangulation, and structured reporting.

**Time Investment:** 2-3 hours for comprehensive research  
**Difficulty:** Advanced  
**Prerequisites:** Basic Python, async/await, web scraping concepts

---

## Documentation Files

### 1. **AGENT_SKILL_DEEP_RESEARCH.md** (Main Guide)
**Length:** ~1,500 lines  
**Purpose:** Complete, detailed methodology guide

**Sections:**
- Overview & when to use
- Complete 7-phase pipeline
- Phase 1: Planning with sequential thinking
- Phase 2: Local data parsing
- Phase 3: Web discovery strategy
- Phase 4: Hidden document discovery (Wayback CDX)
- Phase 5: Platform scraping
- Phase 6: Synthesis & triangulation
- Phase 7: Organization & reporting
- Key tools & libraries
- Common pitfalls & solutions
- Advanced techniques
- Teaching strategies

**Best For:** Agents who want complete understanding of the methodology

---

### 2. **AGENT_SKILL_QUICK_REFERENCE.md** (Cheat Sheet)
**Length:** ~300 lines  
**Purpose:** Quick reference for agents in a hurry

**Sections:**
- 7-phase pipeline (TL;DR)
- Code snippets for each phase
- Common pitfalls & fixes
- Tools needed
- Folder structure template
- Success checklist
- Key principles
- Example timeline

**Best For:** Agents who want to get started quickly

---

### 3. **AGENT_SKILL_REAL_EXAMPLES.md** (Case Studies)
**Length:** ~600 lines  
**Purpose:** Real examples from TCSW research

**Examples:**
1. Finding hidden documents via Wayback CDX (26 PDFs found)
2. Extracting from multiple platforms (sched.com, Emamo, Eventbrite)
3. PDF text extraction & regex parsing (quantitative data)
4. Triangulation & confidence tagging (resolving conflicts)
5. Building master dataset (9 sources → Excel + PDF)
6. Handling errors & pivoting (ProPublica 990 failure)
7. Rate limiting & phased execution (300+ YouTube videos)
8. Data cleaning for Excel (control characters)

**Best For:** Agents who learn by example

---

### 4. **RESEARCH_METHODOLOGY.md** (Original Guide)
**Length:** ~1,200 lines  
**Purpose:** Original TCSW research documentation

**Sections:**
- Initial prompt & planning
- Web search strategy (3 phases)
- Source discovery methods (7 methods)
- Data extraction techniques (4 techniques)
- Synthesis & organization
- Complete command reference
- Key lessons learned
- Replication guide

**Best For:** Deep understanding of the original research

---

### 5. **RESEARCH_PROMPT_TEMPLATE.md** (Reusable Template)
**Length:** ~400 lines  
**Purpose:** Generic prompt template for any research project

**Sections:**
- Generic research prompt
- Example: TCSW research prompt
- Customization guide (conferences, nonprofits, startups, competitions)
- Research checklist
- Common pitfalls & solutions
- Advanced techniques
- Output structure template
- Quick start commands

**Best For:** Starting research on a new topic

---

### 6. **SEARCH_SYNTHESIS_WALKTHROUGH.md** (Step-by-Step Story)
**Length:** ~800 lines  
**Purpose:** Actual evolution from first prompt to final reports

**Sections:**
- Initial request & planning
- Understanding existing data
- Web search for discovery
- Hidden document breakthrough (Wayback CDX)
- PDF download & extraction
- YouTube data extraction
- Cross-referencing & triangulation
- Organization & synthesis
- Report generation
- Key synthesis insights
- Replication checklist

**Best For:** Understanding the actual research process

---

## How to Use This Skill

### For Quick Start (30 minutes)
1. Read **AGENT_SKILL_QUICK_REFERENCE.md**
2. Follow the 7-phase pipeline
3. Adapt the code snippets to your topic

### For Complete Understanding (2-3 hours)
1. Read **AGENT_SKILL_DEEP_RESEARCH.md** (main guide)
2. Review **AGENT_SKILL_REAL_EXAMPLES.md** (case studies)
3. Refer to **RESEARCH_METHODOLOGY.md** for details
4. Use **RESEARCH_PROMPT_TEMPLATE.md** to create your research prompt

### For Learning by Example (1-2 hours)
1. Start with **AGENT_SKILL_REAL_EXAMPLES.md**
2. Review the 8 real examples from TCSW
3. Understand what worked and what failed
4. Apply to your own research

### For Replicating TCSW Research (4-8 hours)
1. Follow **SEARCH_SYNTHESIS_WALKTHROUGH.md** step-by-step
2. Use the same tools and techniques
3. Adapt for your specific topic
4. Generate reports in Excel + PDF

---

## The 7-Phase Pipeline (Quick Summary)

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

**Total Time:** 2-3 hours for comprehensive research

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
9. **Build reusable scripts** — Separate concerns (discover, download, extract, compile)
10. **Generate reports** — Excel + PDF for different audiences

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

## Tools & Libraries

```bash
# Install dependencies
pip install aiohttp beautifulsoup4 lxml pdfminer.six openpyxl reportlab

# Optional (for advanced use)
pip install pytrends selenium playwright
```

**Core Tools:**
- `aiohttp` — Async HTTP requests
- `BeautifulSoup` — HTML parsing
- `pdfminer.six` — PDF text extraction
- `openpyxl` — Excel generation
- `reportlab` — PDF generation
- `asyncio` — Concurrency management
- `regex` — Pattern extraction

---

## Real Results from TCSW Research

**What Was Found:**
- 9 years of sched.com data (2015-2019, 2023)
- 3 years of Emamo data (2020-2022)
- 26 hidden PDFs on beta.mn (via Wayback CDX)
- 303 YouTube videos with view counts
- 7 years of IRS 990 financial data
- Complete speaker database (625 speakers)
- Complete session database (398 sessions)
- MN Cup history (21 years of prize data)

**Reports Generated:**
- TCSW_Quantitative_Master.xlsx (8 sheets, 500+ rows)
- TCSW_Quantitative_Master.pdf (formatted report)
- hidden_docs_and_deep_quant.json (raw data)
- pdf_quantitative_data.json (extracted from PDFs)

**Time Invested:** ~20 hours total research  
**Data Points Collected:** 500+  
**Sources Used:** 15+  
**Confidence Level:** High (3+ sources per metric)

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

## When to Use This Skill

✅ **Use this skill when you need to:**
- Find **all available data** on a topic (not just top search results)
- Discover **hidden documents** (PDFs, Excel files, archived pages)
- Extract data from **multiple platforms** (websites, social media, APIs)
- Build **comprehensive databases** from scattered sources
- Create **authoritative reports** with proper source attribution
- **Triangulate** findings across 3+ sources for confidence

❌ **Don't use this skill for:**
- Quick fact-checking (use web search instead)
- Real-time data (use APIs instead)
- Proprietary/private information (respect privacy)
- Single-source lookups (use direct search)

---

## Next Steps

### To Get Started:
1. Choose your research topic
2. Read **AGENT_SKILL_QUICK_REFERENCE.md** (30 min)
3. Follow the 7-phase pipeline
4. Adapt code snippets to your topic
5. Generate reports in Excel + PDF

### To Go Deeper:
1. Read **AGENT_SKILL_DEEP_RESEARCH.md** (complete guide)
2. Study **AGENT_SKILL_REAL_EXAMPLES.md** (case studies)
3. Review **RESEARCH_METHODOLOGY.md** (original research)
4. Use **RESEARCH_PROMPT_TEMPLATE.md** (create your prompt)

### To Replicate TCSW Research:
1. Follow **SEARCH_SYNTHESIS_WALKTHROUGH.md** step-by-step
2. Use the same tools and techniques
3. Adapt for your specific topic
4. Generate comprehensive reports

---

## File Organization

```
BACKGROUND/
├── AGENT_SKILL_INDEX.md (this file)
├── AGENT_SKILL_DEEP_RESEARCH.md (main guide, ~1,500 lines)
├── AGENT_SKILL_QUICK_REFERENCE.md (cheat sheet, ~300 lines)
├── AGENT_SKILL_REAL_EXAMPLES.md (case studies, ~600 lines)
├── RESEARCH_METHODOLOGY.md (original guide, ~1,200 lines)
├── RESEARCH_PROMPT_TEMPLATE.md (reusable template, ~400 lines)
└── SEARCH_SYNTHESIS_WALKTHROUGH.md (step-by-step story, ~800 lines)
```

---

## Summary

This skill enables agents to conduct **comprehensive, multi-source research** on any topic by following a proven 7-phase pipeline:

```
Think → Parse Local → Search Web → Wayback Hunt → Download Files → 
Extract Data → Scrape Live → Triangulate → Clean → Organize → Report
```

**Key Advantage:** Finds data that Google can't find (hidden documents, archived pages, multiple platforms)

**Key Result:** Comprehensive reports with proper source attribution and confidence tagging

**Time Investment:** 2-3 hours for thorough research

**Quality:** High confidence (3+ sources per metric), well-organized, properly documented

---

## Questions?

Refer to the appropriate documentation:
- **"How do I get started?"** → AGENT_SKILL_QUICK_REFERENCE.md
- **"How does this work?"** → AGENT_SKILL_DEEP_RESEARCH.md
- **"Show me examples"** → AGENT_SKILL_REAL_EXAMPLES.md
- **"What's the original research?"** → RESEARCH_METHODOLOGY.md
- **"How do I create my research prompt?"** → RESEARCH_PROMPT_TEMPLATE.md
- **"What was the actual process?"** → SEARCH_SYNTHESIS_WALKTHROUGH.md

---

**Created:** June 10, 2026  
**Based on:** Twin Cities Startup Week comprehensive research project  
**Status:** Complete and ready for use by any agent

