# TCSW Complete Research Methodology Guide

**Created:** June 7, 2026  
**Purpose:** Document how to find, extract, synthesize, and organize ALL data related to Twin Cities Startup Week

---

## Table of Contents

1. [Initial Prompt & Planning](#initial-prompt--planning)
2. [Web Search Strategy](#web-search-strategy)
3. [Source Discovery Methods](#source-discovery-methods)
4. [Data Extraction Techniques](#data-extraction-techniques)
5. [Synthesis & Organization](#synthesis--organization)
6. [Complete Command Reference](#complete-command-reference)

---

## Initial Prompt & Planning

### The Original Request (Session Start)

```
"okay this is the twincitiesstartup week repo. we will be putting on the event 
in september and this repo is both for the planning, researching and executing. 
the central repo to do it all. i need one folder that has 'research' and within 
that research folder, i need you to create a plan to go find any and all data 
on the internet that relates to twincitiesstartup week, all historical, all 
sponsors, all files. go figure out how to do that. create a prompt and plan to 
do that"
```

### How I Approached It

**Step 1: Use Sequential Thinking Tool**
- Before writing ANY code, I used `mcp13_sequentialthinking` to brainstorm
- Enumerated data categories: historical, sponsors, sessions, speakers, media, financials
- Identified source types: websites, PDFs, social media, IRS filings, press releases
- Planned extraction tiers based on difficulty and value

**Step 2: Repository Structure Analysis**
```bash
# First, understand what already exists
ls -R /Users/cloudaistudio/Desktop/twincitiesstartupweek/
```

Found existing folders:
- `data/history/` — Timeline markdown files
- `raw/sched/` — Cached session data
- `raw/youtube_videos.json` — Video metadata
- Various analysis folders

**Step 3: Gap Analysis**
What's missing:
- Quantitative metrics (attendance, revenue, prize money)
- Hidden documents (annual reports, sponsor decks)
- Complete sponsor history
- Media coverage archive
- Investor/funder information

---

## Web Search Strategy

### Phase 1: Broad Discovery Searches

**Search Pattern:**
```
search_web("Twin Cities Startup Week history timeline")
search_web("TCSW sponsors 2014-2024")
search_web("Beta.MN nonprofit annual report")
search_web("MN Cup prize money winners")
```

**What This Found:**
- Wikipedia article on MN Cup (comprehensive history)
- TCB Magazine articles (attendance figures)
- Star Tribune coverage (2019 attendance: 17,000)
- Medium articles by organizers
- Beta.MN official site structure

### Phase 2: Targeted Source Searches

**For Financial Data:**
```
search_web("Beta Group nonprofit 990 IRS filing EIN")
→ Found: ProPublica Nonprofit Explorer
→ Found: Impala.digital nonprofit profile
→ EIN: 81-2227583
```

**For Event Data:**
```
search_web("Twin Cities Startup Week 2020 recap attendance")
→ Found: Medium article with 19,000 attendees
→ Found: Reference to PDF recap on beta.mn
```

**For Prize Data:**
```
search_web("MN Cup 2024 grand prize winner amount")
→ Found: PRNewswire press release
→ Found: Carlson School official page
→ Data: $100K grand prize, $400K total pool
```

### Phase 3: Domain-Specific Searches

**Identify Key Domains:**
1. `tcstartupweek.com` (primary event site)
2. `beta.mn` (organizing nonprofit)
3. `twincitiesstartupweek.com` (alternate domain)
4. `sched.com/tcsw*` (event schedules)
5. `youtube.com/@twincitiesstartupweek` (video archive)

**Search for Each Domain:**
```
search_web("site:beta.mn annual report PDF")
search_web("site:tcstartupweek.com sponsor prospectus")
search_web("site:sched.com twin cities startup week 2023")
```

---

## Source Discovery Methods

### Method 1: Wayback Machine CDX API (The Goldmine)

**What It Does:**
- Searches Internet Archive's index of crawled URLs
- Can filter by file type (mimetype)
- Returns ALL archived versions of matching files

**Query Structure:**
```python
url = (
    f"http://web.archive.org/cdx/search/cdx"
    f"?url={domain}/*"              # Domain to search
    f"&output=json"                 # Return JSON
    f"&fl=timestamp,original,mimetype,length,statuscode"  # Fields
    f"&filter=mimetype:{mime}"      # Filter by file type
    f"&filter=statuscode:200"       # Only successful requests
    f"&collapse=original"           # Deduplicate URLs
    f"&limit=50"                    # Max results
)
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

**Critical Rate Limiting:**
```python
for domain in DOMAINS:
    for mime in mimetypes:
        await asyncio.sleep(1.5)  # MANDATORY — prevents 503 errors
        data = await fetch_json(session, url)
```

**What This Found:**
- 26 PDFs on beta.mn domain
- All stored in HubSpot: `beta.mn/hubfs/2020%20Website/How%20to%20Help%20PDFs/`
- Annual recaps: 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022
- TCSW recaps: 2017, 2018, 2019, 2020, 2021

**Why This Works:**
- Finds documents not linked from current site
- Discovers old URLs that still work
- Reveals file storage patterns (HubSpot, S3, etc.)

### Method 2: Live Server Hidden Path Probing

**Common Hidden Paths:**
```python
HIDDEN_PATHS = [
    "/sponsor-prospectus.pdf",
    "/sponsorship-deck.pdf",
    "/media-kit.pdf",
    "/annual-report.pdf",
    "/impact-report.pdf",
    "/2024-recap.pdf",
    "/press-kit.zip",
    "/speaker-guide.pdf",
]
```

**Probing Logic:**
```python
for domain in DOMAINS:
    for path in HIDDEN_PATHS:
        url = f"https://{domain}{path}"
        response = await session.head(url)  # HEAD request = faster
        if response.status == 200:
            print(f"FOUND: {url}")
            # Download it
```

**What This Found:**
- Most returned 404 (expected)
- But validated that HubSpot PDFs are still live
- Discovered naming patterns for future searches

### Method 3: Sched.com Event Archive

**Discovery:**
```
search_web("site:sched.com twin cities startup week")
→ Found: sched.com/tcsw2023, sched.com/tcsw2018
```

**Data Extraction:**
```python
# Sched provides JSON export
url = "https://tcsw2023.sched.com/directory/exportjson"
sessions = await fetch_json(session, url)

# Also has ICS calendar export
url = "https://tcsw2023.sched.com/directory/exportical"
```

**What This Found:**
- 398 total sessions across 2018 + 2023
- 625 unique speakers
- Session titles, descriptions, times, venues
- Speaker companies and bios

### Method 4: YouTube Channel Scraping

**Discovery:**
```
search_web("Twin Cities Startup Week YouTube channel")
→ Found: youtube.com/@twincitiesstartupweek
```

**Data Sources:**
1. **Cached JSON** (from previous scrape): `raw/youtube_videos.json`
   - Had: 303 videos, durations, titles
   - Missing: View counts, publish dates

2. **YouTube /watch Page Scraping:**
```python
url = f"https://www.youtube.com/watch?v={video_id}"
body = await fetch(session, url)

# Extract from embedded JSON
views = re.search(r'"viewCount":\s*"(\d+)"', body)
likes = re.search(r'"likeCount":\s*"(\d+)"', body)
pub_date = re.search(r'"publishDate":\s*"(\d{4}-\d{2}-\d{2})"', body)
```

**Rate Limiting:**
```python
await asyncio.sleep(0.4)  # Between each video
```

**What This Found:**
- 303 videos with complete metadata
- Total views, likes, publish dates
- Content hours: 221.4 hours
- Avg video: 43.8 minutes

### Method 5: IRS Form 990 Filings

**Discovery:**
```
search_web("Beta Group Minnesota nonprofit 990")
→ Found: ProPublica Nonprofit Explorer
→ EIN: 81-2227583
```

**Direct URLs:**
```python
FILING_URLS = {
    2024: "https://projects.propublica.org/nonprofits/organizations/812227583",
    2023: "https://projects.propublica.org/nonprofits/organizations/812227583/202343159349302035/full",
    # ... etc
}
```

**Extraction Attempts:**
1. **HTML Regex** (failed — tables rendered via JavaScript)
2. **Impala.digital AI Summary** (worked):
```
search_web("Beta Group nonprofit Impala.digital")
→ Found AI-generated summary: "$490K revenue, $394.5K operating budget"
```

### Method 6: Press Release Archives

**Discovery:**
```
search_web("Twin Cities Startup Week press release PRNewswire")
search_web("MN Cup 2024 winner press release")
```

**What This Found:**
- PRNewswire: MN Cup 2024 details (3,200 applicants, $5.4M total prizes)
- TCB Magazine: TCSW 2018 attendance (12,000)
- Star Tribune: TCSW 2019 attendance (17,000+)

### Method 7: Social Media & LinkedIn

**Discovery:**
```
search_web("Twin Cities Startup Week LinkedIn followers")
→ Found: linkedin.com/company/twin-cities-startup-week
```

**Manual Extraction:**
- LinkedIn followers: 4,231
- Twitter/X mentions (searched but not scraped)
- Facebook event pages (historical data unavailable)

---

## Data Extraction Techniques

### Technique 1: PDF Text Extraction

**Tool:** `pdfminer.six`

```python
import pdfminer.high_level as pml

text = pml.extract_text("TCSW_2020_recap.pdf")
```

**Regex Patterns for Quantitative Data:**
```python
patterns = {
    "attendees": r'(\d[\d,]+)\+?\s*(?:attendees?|participants?|people)',
    "events": r'(\d[\d,]+)\+?\s*(?:events?|sessions?|talks?|workshops?)',
    "speakers": r'(\d[\d,]+)\+?\s*speakers?',
    "sponsors": r'(\d[\d,]+)\+?\s*sponsors?',
    "startups": r'(\d[\d,]+)\+?\s*(?:startups?|companies)',
    "revenue": r'\$\s*([\d,]+(?:\.\d+)?)\s*(?:K|M|thousand|million)?',
    "raised": r'\$\s*([\d,]+(?:\.\d+)?)\s*(?:M|million)\s*(?:raised|funded)',
}
```

**Example Output:**
```json
{
  "label": "TCSW_2020_recap",
  "attendees": ["8,000"],
  "events": ["213"],
  "speakers": ["525"],
  "source_file": "TCSW_2020_recap.pdf"
}
```

### Technique 2: HTML Parsing with BeautifulSoup

**For Structured Pages:**
```python
from bs4 import BeautifulSoup

soup = BeautifulSoup(html, "lxml")

# Extract specific elements
title = soup.find("h1", class_="event-title").text
date = soup.find("time", {"datetime": True})["datetime"]

# Extract all links
links = [a["href"] for a in soup.find_all("a", href=True)]
```

**For Tables:**
```python
table = soup.find("table", class_="financial-data")
rows = []
for tr in table.find_all("tr")[1:]:  # Skip header
    cells = [td.text.strip() for td in tr.find_all("td")]
    rows.append(cells)
```

### Technique 3: JSON Extraction from Page Source

**YouTube Example:**
```python
# YouTube embeds data in page source
body = await fetch(session, youtube_url)

# Method 1: Direct field extraction
views = re.search(r'"viewCount":\s*"(\d+)"', body)

# Method 2: Extract full ytInitialData object
yt_data = re.search(r'var ytInitialData = ({.*?});', body)
data = json.loads(yt_data.group(1))
```

### Technique 4: Async Parallel Scraping

**Pattern:**
```python
async def scrape_all_videos(video_ids):
    sem = asyncio.Semaphore(4)  # Max 4 concurrent
    
    async def scrape_one(vid_id):
        async with sem:
            await asyncio.sleep(0.4)  # Rate limit
            return await fetch_video_data(vid_id)
    
    tasks = [scrape_one(vid) for vid in video_ids]
    return await asyncio.gather(*tasks)
```

**Progress Tracking:**
```python
for i, vid in enumerate(video_ids):
    result = await scrape_one(vid)
    if i % 30 == 0:
        print(f"Progress: {i}/{len(video_ids)}")
```

---

## Synthesis & Organization

### Step 1: Data Categorization

**As Data Came In, I Organized Into:**

1. **Quantitative Metrics** → `data/quantitative/`
   - Attendance by year
   - Session counts
   - Speaker counts
   - Revenue/funding
   - Prize money

2. **Historical Narrative** → `data/history/`
   - Timeline markdown files
   - Year-by-year summaries
   - Key milestones

3. **People** → `data/people/`
   - Speakers database
   - Organizers
   - Board members

4. **Organizations** → `data/sponsors/`, `data/investors/`
   - Sponsor lists by year
   - Funding sources
   - Partner organizations

5. **Media** → `data/media/`
   - Press coverage
   - YouTube videos
   - Photos/graphics

6. **Raw Source Files** → `raw/`
   - PDFs
   - JSON exports
   - Scraped HTML

### Step 2: Cross-Referencing & Triangulation

**For Each Metric, I Tracked:**
```json
{
  "metric": "2020_attendance",
  "value": "19,000+",
  "confidence": "high",
  "sources": [
    "TCSW 2020 Recap PDF (page 3)",
    "Medium article by organizers",
    "TCB Magazine mention"
  ],
  "notes": "Virtual event, 3 weeks instead of 5 days"
}
```

**Triangulation Rules:**
- 1 source = "Low" confidence
- 2 sources = "Medium" confidence
- 3+ sources = "High" confidence
- Primary source (PDF, 990) > Secondary (news article)

### Step 3: Building Master Datasets

**Created Structured Files:**

1. **`quantitative_raw.json`** — All numeric data with sources
2. **`sponsors_complete.json`** — All sponsors by year
3. **`sessions_database.json`** — All sessions across all years
4. **`speakers_database.json`** — All speakers with metadata
5. **`media_coverage.json`** — All press mentions

### Step 4: Report Generation

**Multi-Format Outputs:**

1. **Excel Workbook** (`TCSW_Quantitative_Master.xlsx`)
   - 8 sheets: Attendance, BETA Stats, 990 Financials, MN Cup, YouTube, Sched, PDFs, Key Aggregates
   - Styled headers, alternating rows, auto-width columns

2. **PDF Report** (`TCSW_Quantitative_Master.pdf`)
   - Formatted tables, section headers, methodology notes
   - Designed for board presentations

3. **JSON Archive** (`hidden_docs_and_deep_quant.json`)
   - Complete raw data for programmatic access

---

## Complete Command Reference

### Initial Setup
```bash
# Install dependencies
pip3 install aiohttp beautifulsoup4 lxml pdfminer.six openpyxl reportlab pytrends

# Create folder structure
mkdir -p data/{quantitative,history,sponsors,media,people,sessions}
mkdir -p raw/{pdfs,json,html}
mkdir -p scripts
```

### Web Search Commands
```python
# In Windsurf/Cascade
search_web("Twin Cities Startup Week history")
search_web("Beta.MN nonprofit 990 filing")
search_web("MN Cup prize money 2024")
search_web("site:beta.mn annual report PDF")
```

### Wayback CDX Discovery
```bash
# Command-line version
curl "http://web.archive.org/cdx/search/cdx?url=beta.mn/*&output=json&filter=mimetype:application/pdf&filter=statuscode:200&limit=50" | jq

# Python async version (see hunt_hidden_docs.py)
```

### PDF Download & Extraction
```bash
# Download PDF
curl -o "TCSW_2020_recap.pdf" "https://www.beta.mn/hubfs/TCSW-Recap-2020.pdf"

# Extract text
python3 -c "
import pdfminer.high_level as pml
text = pml.extract_text('TCSW_2020_recap.pdf')
print(text[:1000])
"

# Extract numbers
python3 -c "
import pdfminer.high_level as pml, re
text = pml.extract_text('TCSW_2020_recap.pdf')
attendees = re.findall(r'(\d[\d,]+)\+?\s*attendees?', text, re.I)
print('Attendees:', attendees)
"
```

### YouTube Scraping
```bash
# Get view count for single video
python3 -c "
import requests, re
url = 'https://www.youtube.com/watch?v=VIDEO_ID'
r = requests.get(url)
views = re.search(r'\"viewCount\":\"(\d+)\"', r.text)
print('Views:', views.group(1) if views else 'Not found')
"
```

### JSON Parsing
```bash
# Parse sched sessions
python3 -c "
import json
from pathlib import Path
from collections import Counter

sessions = json.loads(Path('raw/sched/all_sessions.json').read_text())
by_year = Counter(s['year'] for s in sessions)
print('Sessions by year:', dict(by_year))
"
```

### Report Building
```bash
# Run complete pipeline
cd scripts
python3 hunt_hidden_docs.py          # Scrape all sources
python3 download_hidden_pdfs.py      # Download + extract PDFs
python3 build_quant_report.py        # Generate Excel + PDF
```

---

## Key Lessons Learned

### What Worked Best

1. **Wayback CDX** — Found 26 PDFs not discoverable any other way
2. **Sequential thinking first** — Planning before coding saved hours
3. **Phased execution** — Fast sources first, slow sources last
4. **Rate limiting** — 1.5s for Wayback, 0.4s for YouTube = no bans
5. **Primary sources** — PDFs and 990s beat news articles
6. **Triangulation** — 3+ sources = high confidence

### What Had Issues

1. **ProPublica 990 tables** — JavaScript-rendered, regex failed
2. **Google Trends** — Rate limited immediately
3. **Live TCSW site** — HTTP 421 errors
4. **Eventbrite** — No structured data in HTML
5. **Parallel Wayback** — 503 errors, must be sequential

### Critical Success Factors

1. **Start with what you have** — Parse local files first
2. **Use web search for discovery** — Find authoritative sources
3. **Wayback for hidden docs** — Filter by mimetype
4. **Rate limit aggressively** — Respect server limits
5. **Clean data before output** — Remove illegal characters
6. **Document sources** — Every metric needs attribution
7. **Build reusable scripts** — Separate concerns (discover, download, extract, compile)

---

## Replication Guide

**To replicate this research for ANY event/organization:**

1. **Think first** — Use sequential thinking to enumerate sources
2. **Parse local** — Start with cached/downloaded data
3. **Web search** — Find official sites, press, Wikipedia
4. **Wayback hunt** — Search for PDFs, Excel, Word docs
5. **Scrape live** — YouTube, social media, event platforms
6. **Extract text** — PDFs → pdfminer, HTML → BeautifulSoup
7. **Triangulate** — Cross-reference same metrics
8. **Organize** — Categorize into folders (quantitative, history, people, etc.)
9. **Synthesize** — Build master datasets
10. **Report** — Generate Excel + PDF for stakeholders

**The complete pipeline:**
```
Think → Parse Local → Search Web → Wayback Hunt → Download Files → 
Extract Data → Scrape Live → Triangulate → Clean → Organize → Report
```

---

**End of Methodology Guide**
