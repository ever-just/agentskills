# Research Prompt Template
## For Comprehensive Event/Organization Data Collection

**Use this template when starting research on ANY event, organization, or topic**

---

## The Prompt

```
I need you to conduct comprehensive research on [ORGANIZATION/EVENT NAME].

CONTEXT:
- [Brief description of what it is]
- [Why you need this data]
- [Timeline/deadline if applicable]

OBJECTIVE:
Find and extract ALL available data from the internet including:

1. HISTORICAL DATA
   - Timeline of events/milestones
   - Year-by-year evolution
   - Founding story and key dates
   - Past locations, venues, formats

2. QUANTITATIVE METRICS
   - Attendance/participation numbers
   - Financial data (revenue, funding, budgets)
   - Event statistics (sessions, speakers, tracks)
   - Growth metrics over time
   - Prize money / awards (if applicable)

3. PEOPLE
   - Organizers and leadership
   - Speakers/presenters
   - Participants/attendees
   - Board members / advisors
   - Sponsors and partners

4. ORGANIZATIONS
   - Sponsoring companies (by year)
   - Partner organizations
   - Funding sources
   - Affiliated nonprofits
   - Investor networks

5. MEDIA & CONTENT
   - Press coverage (news articles, magazines)
   - Social media presence
   - Video archives (YouTube, Vimeo)
   - Photos and graphics
   - Podcasts or interviews

6. DOCUMENTS & FILES
   - Annual reports
   - Sponsor prospectuses
   - Media kits
   - Recap documents
   - Financial filings (990s for nonprofits)
   - Presentations and decks

7. ONLINE PRESENCE
   - Current website content
   - Archived website versions (Wayback Machine)
   - Social media profiles and stats
   - Event platforms (Eventbrite, Sched, etc.)
   - Newsletter archives

METHODOLOGY:
1. Start with sequential thinking to plan the research
2. Parse any existing local data first
3. Use web search to discover authoritative sources
4. Use Wayback Machine CDX API to find hidden documents
5. Scrape live websites and platforms
6. Extract data from PDFs, spreadsheets, and other files
7. Cross-reference and triangulate findings
8. Organize into structured folders
9. Generate comprehensive reports

OUTPUT:
- Organized folder structure with all findings
- Master Excel spreadsheet with quantitative data
- PDF report with key findings and sources
- Raw data files (JSON, CSV) for programmatic access
- Methodology documentation

CONSTRAINTS:
- [Any rate limits or access restrictions]
- [Preferred tools or methods]
- [Data you already have]
- [Timeline constraints]

Please create a detailed plan first, then execute the research systematically.
```

---

## Example: TCSW Research Prompt (Actual)

```
I need you to conduct comprehensive research on Twin Cities Startup Week (TCSW).

CONTEXT:
- Annual startup event in Minneapolis/St. Paul, Minnesota
- Running since 2014
- Organized by Beta.MN nonprofit
- We're planning the 2026 event and need complete historical context

OBJECTIVE:
Find ALL quantitative data including:
- Attendance figures by year
- Session/speaker counts
- Sponsor lists
- Prize money (MN Cup)
- Beta.MN financials (IRS 990)
- YouTube video stats
- Media coverage metrics

Also find:
- Historical documents (annual reports, recaps)
- Sponsor prospectuses
- Hidden PDFs on beta.mn and tcstartupweek.com
- Complete speaker database
- Session archives from sched.com

METHODOLOGY:
1. Parse existing local data (sched cache, YouTube JSON)
2. Web search for press coverage and official sources
3. Wayback Machine CDX to find hidden PDFs
4. Scrape ProPublica for 990 filings
5. Extract text from PDFs using pdfminer
6. Scrape YouTube for view counts
7. Compile into Excel + PDF reports

OUTPUT:
- TCSW_Quantitative_Master.xlsx (8 sheets)
- TCSW_Quantitative_Master.pdf (formatted report)
- Raw JSON files with all extracted data
- Downloaded PDFs in organized folders

CONSTRAINTS:
- No Playwright (user preference)
- Respect rate limits (1.5s for Wayback, 0.4s for YouTube)
- High confidence = 3+ sources
```

---

## Customization Guide

### For a Conference/Event:
```
Replace [ORGANIZATION/EVENT NAME] with: "PyCon 2024"

Add to QUANTITATIVE METRICS:
- Ticket sales
- Workshop attendance
- Sponsor tier counts
- CFP submission numbers

Add to DOCUMENTS:
- Conference programs
- Sponsor prospectuses
- Speaker guidelines
```

### For a Nonprofit:
```
Replace [ORGANIZATION/EVENT NAME] with: "Habitat for Humanity Minnesota"

Add to QUANTITATIVE METRICS:
- Homes built
- Volunteer hours
- Donation amounts
- Grant funding

Add to DOCUMENTS:
- IRS Form 990 (all years)
- Annual reports
- Impact reports
- Donor lists (if public)
```

### For a Startup:
```
Replace [ORGANIZATION/EVENT NAME] with: "Acme Corp"

Add to QUANTITATIVE METRICS:
- Funding rounds
- Employee count
- Customer numbers
- Revenue (if public)

Add to DOCUMENTS:
- Pitch decks
- Press releases
- SEC filings (if public)
- Product documentation
```

### For a Competition:
```
Replace [ORGANIZATION/EVENT NAME] with: "MN Cup"

Add to QUANTITATIVE METRICS:
- Applicant counts
- Prize amounts
- Winner outcomes
- Alumni funding raised

Add to DOCUMENTS:
- Application guidelines
- Judging criteria
- Winner announcements
- Alumni success stories
```

---

## Research Checklist

Use this checklist to ensure comprehensive coverage:

### Discovery Phase
- [ ] Web search for official website
- [ ] Web search for Wikipedia article
- [ ] Web search for news coverage
- [ ] Web search for social media profiles
- [ ] Identify key domains to search
- [ ] Identify key people/organizations
- [ ] Check for nonprofit status (EIN lookup)

### Data Collection Phase
- [ ] Parse any existing local data
- [ ] Wayback Machine CDX for PDFs
- [ ] Wayback Machine CDX for Excel files
- [ ] Wayback Machine CDX for Word docs
- [ ] Download all found documents
- [ ] Scrape official website
- [ ] Scrape event platforms (Eventbrite, Sched, etc.)
- [ ] Scrape social media (LinkedIn, YouTube, etc.)
- [ ] Search IRS 990 database (if nonprofit)
- [ ] Search press release archives
- [ ] Search academic databases (if applicable)

### Extraction Phase
- [ ] Extract text from PDFs
- [ ] Parse spreadsheets
- [ ] Extract data from HTML
- [ ] Parse JSON exports
- [ ] Extract numbers with regex
- [ ] Extract dates and timelines
- [ ] Extract people names
- [ ] Extract organization names

### Synthesis Phase
- [ ] Cross-reference metrics across sources
- [ ] Tag confidence levels (high/med/low)
- [ ] Organize into folder structure
- [ ] Build master datasets (JSON, CSV)
- [ ] Create timeline/chronology
- [ ] Identify gaps in data
- [ ] Document methodology

### Reporting Phase
- [ ] Generate Excel workbook
- [ ] Generate PDF report
- [ ] Create summary document
- [ ] Document all sources
- [ ] Create replication guide
- [ ] Archive raw files

---

## Common Pitfalls & Solutions

### Pitfall 1: Rate Limiting
**Problem:** Getting 429 or 503 errors  
**Solution:** Add `await asyncio.sleep(1.5)` between requests

### Pitfall 2: JavaScript-Rendered Content
**Problem:** BeautifulSoup returns empty results  
**Solution:** Look for JSON in page source, or use alternative source

### Pitfall 3: Illegal Characters in Excel
**Problem:** `IllegalCharacterError` when writing to Excel  
**Solution:** Use `safe_str()` to remove control characters

### Pitfall 4: Wayback CDX Returns Too Many Results
**Problem:** 10,000+ results, can't process all  
**Solution:** Add `&collapse=original` to deduplicate URLs

### Pitfall 5: PDF Text Extraction Fails
**Problem:** pdfminer returns empty string  
**Solution:** PDF might be image-based, use OCR (tesseract)

### Pitfall 6: Missing Metadata
**Problem:** No publish dates, authors, or sources  
**Solution:** Extract from URL patterns, filenames, or surrounding text

---

## Advanced Techniques

### Technique 1: Recursive Wayback Searching
```python
# Find all PDFs, then search for more PDFs in same directory
found_urls = wayback_search("beta.mn", "application/pdf")
directories = set(os.path.dirname(url) for url in found_urls)
for directory in directories:
    more_pdfs = wayback_search(f"{directory}/*", "application/pdf")
```

### Technique 2: Cross-Domain Link Following
```python
# Find all links on main site, then search Wayback for each
links = extract_links("https://beta.mn")
for link in links:
    if "sponsor" in link or "report" in link:
        wayback_search(link, "application/pdf")
```

### Technique 3: Temporal Analysis
```python
# Search Wayback for same URL across different years
for year in range(2014, 2025):
    url = f"https://beta.mn/annual-report-{year}.pdf"
    wayback_search(url, "application/pdf")
```

### Technique 4: Fuzzy Filename Matching
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

## Output Structure Template

```
research/
├── quantitative/
│   ├── attendance_by_year.json
│   ├── financial_data.json
│   ├── event_statistics.json
│   └── master_report.xlsx
├── history/
│   ├── timeline.md
│   ├── year_summaries/
│   └── milestones.json
├── people/
│   ├── speakers_database.json
│   ├── organizers.json
│   └── board_members.json
├── organizations/
│   ├── sponsors_by_year.json
│   ├── partners.json
│   └── funders.json
├── media/
│   ├── press_coverage.json
│   ├── youtube_videos.json
│   └── social_media_stats.json
├── documents/
│   ├── pdfs/
│   ├── spreadsheets/
│   └── presentations/
├── raw/
│   ├── html/
│   ├── json/
│   └── api_responses/
└── RESEARCH_METHODOLOGY.md
```

---

## Quick Start Commands

```bash
# 1. Set up environment
mkdir -p research/{quantitative,history,people,organizations,media,documents,raw}
cd research

# 2. Install dependencies
pip3 install aiohttp beautifulsoup4 lxml pdfminer.six openpyxl reportlab

# 3. Start with web search
# (Use Windsurf/Cascade search_web tool)

# 4. Run Wayback CDX search
python3 wayback_search.py

# 5. Download found documents
python3 download_docs.py

# 6. Extract data
python3 extract_data.py

# 7. Generate reports
python3 build_reports.py
```

---

**End of Template**
