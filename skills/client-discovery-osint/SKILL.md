# Client Discovery via OSINT

## Overview

How to identify the clients and customers of a private company using only open-source intelligence. Private companies (especially bootstrapped VARs, consultancies, and services firms) rarely publish client lists. This skill provides a systematic methodology for extracting client signals from 12+ data source categories, cross-referencing them, and building a tiered confidence registry.

Developed and validated on BROGAV Solutions LLC (data center equipment VAR, ~$4.5M revenue, 1 publicly named client out of an estimated 75-150 total). Final registry: 75+ identified relationships from 12 source categories.

Use this skill when you need to:
- Build a client list for a company that doesn't publish one
- Assess customer concentration risk for an acquisition target
- Map a competitor's installed base
- Identify warm leads through relationship intelligence

---

## The 12 Source Categories

Search all of these. Most private company client intelligence hides in the intersection of multiple weak signals, not in any single strong one.

### 1. Testimonials (website)
Scrape the company website for testimonial pages. Look for:
- Named clients with named contacts (strongest signal)
- Unnamed testimonials with CMS template errors (e.g., `{they were established}` reveals a founding-era client)
- Product-specific testimonials that narrow the client type

### 2. Case Studies (website + LinkedIn)
Case studies often name the client, the product, and the outcome. Check:
- Website case study pages
- LinkedIn posts describing project completions
- Partner websites (e.g., RLE Technologies listing BROGAV as a partner with a case study reference)

### 3. LinkedIn Posts (company + founder)
The richest source for relationship-driven businesses. Extract:
- Posts explicitly saying "partners and customers" with tagged companies
- Event recap posts tagging attendees from client companies
- Project completion posts with hashtags (#pduinstallation, #pdustartup)
- Founder's personal LinkedIn activity archive (see `linkedin-activity-intelligence` skill)

### 4. Event Sponsors and Speakers
Companies that sponsor or send speakers to the target's proprietary event have a commercial relationship. Tiers:
- Premier sponsors ($5K-$10K+) are deep relationships
- Speakers from end-user companies (facility managers, procurement VPs) are likely clients
- Speakers from supplier companies are upstream partners, not clients

Source sponsor lists from: event web pages, Wayback Machine captures, YouTube video thumbnails showing sponsor banners, LinkedIn sponsor thank-you posts, sponsorship package PDFs.

### 5. YouTube Transcripts and Videos
Search video transcripts for client names. Check:
- Founder interview videos for "we worked with [company]" references
- Installation demo videos for facility identifiers or client equipment labels
- Event recap videos for sponsor banners and name badges
- Video descriptions and comments

### 6. Website Crawl (full site)
Crawl every page of the company website. Search for:
- Client logos on "trusted by" sections
- Partner/client distinction (many sites blur these)
- Product pages mentioning specific installations
- Deleted pages recovered via Wayback Machine (event pages, sponsor pages, member pages)

### 7. Employee Career Histories
Former employers of current staff are warm-lead pools. In relationship-driven industries, salespeople sell to their old networks. Map:
- Founder's career (10+ years of accumulated client relationships transfer)
- VP Sales connections (their rolodex is the pipeline)
- BDMs with manufacturer backgrounds (they bring their OEM's client list)

### 8. Web Search (general + trade press)
Search for the company name in:
- Trade publications (Data Center POST, Telecom Newsroom, etc.)
- Press releases mentioning project partnerships
- Industry award announcements
- Event recap articles from third parties

### 9. Industry Associations
Association membership exposes the company to specific buyer pools. Map:
- Which chapters they belong to (geography signal)
- Board positions held by staff (influence signal)
- Golf outings and networking events attended (relationship signal)

### 10. Certification and Registration Databases
- UMN OSD, WBENC directory, SBA DSBS (supplier diversity registrations imply active procurement relationships)
- SAM.gov (federal registration; check USASpending for awards)
- ConstructConnect, Blue Book, Procore (construction procurement platforms)

### 11. D&B / Third-Party Business Data
- D&B Hoovers OneStop Reports may include trade references
- SignalHire, ZoomInfo, Apollo firmographics
- S&P Global Capital IQ for industry peer comparisons

### 12. Photo and Image Intelligence
- Event photos with sponsor banners (decode every logo)
- Name badges in group photos
- Facility photos showing client signage
- Product photos with manufacturer labels
- Team photos at client sites (hard hats, hi-vis vests = active facility)

---

## Tiering Framework

Classify every identified company into tiers based on evidence strength.

| Tier | Label | Evidence Required | Example |
|------|-------|-------------------|---------|
| 1 | **Confirmed Client** | Named testimonial, case study, or explicit "partner and customer" tag with transaction evidence | Cologix (named testimonial + case study + C-suite LinkedIn tag) |
| 2 | **Highly Probable** | 3+ independent signals across different source categories | CAI Mission Critical (testimonial + event sponsor + co-presenter + partner decks) |
| 3 | **Probable / Active Prospect** | 2 signals, typically event participation + procurement-role contact | Prime Data Centers (Denver Bisnow "partners and customers" tag + VP Procurement) |
| 4 | **Event Relationship** | Paid sponsorship or sent speaker to proprietary event | RLE Technologies (sponsor + speaker + supplier) |
| 5 | **Referral Channel** | Formal partner listing or co-event sponsorship with referral model | Cofluence LLC (consultancy whose clients need equipment) |
| 6 | **Warm Network** | Prior-employer connections of current staff | Clearfield (founder's 10-year career) |

### Cross-Reference Matrix

Build a matrix showing which companies appear in multiple source categories. More categories = higher confidence.

| Company | Testimonial | Case Study | LinkedIn | Event | Supplier Card | Partner Listing | Total |
|---------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Cologix | X | X | X | | | | 3 |
| CAI | X | | | X | | X | 3 |

---

## Timeline Verification

**Critical:** When using LinkedIn posts or career histories, verify that the intelligence belongs to the current company, not a previous employer. A founder's LinkedIn activity may span 10+ years and 3+ employers.

**Rule:** If a post doesn't explicitly name the current company, date it using content clues (event dates, year mentions, seasonal references, product references). If the date falls before the company was founded, the intelligence belongs to the previous employer.

See `linkedin-activity-intelligence` skill for detailed timeline verification methodology.

---

## Estimating Total Client Count

For private companies that don't disclose client counts:

```
Estimated project clients/year = (Revenue * project_stream_%) / avg_deal_size
Estimated e-commerce clients/year = (Revenue * ecomm_stream_%) / avg_ecomm_deal
Total lifetime clients = annual_clients * years_operating * (1 - repeat_rate)
```

Then calculate visibility: `identified_clients / estimated_total = visibility_%`

Typical result for private VARs: 10-20% visibility. The remaining 80-90% are invisible from public sources.

---

## ICP List Validation

If the company has an ICP (Ideal Customer Profile) prospect list, cross-reference it against your identified relationships. If zero matches appear, the ICP list may be built from wrong industry codes. This happened with BROGAV: 0 of 20 known relationship companies appeared in a 3,568-row ICP list built from SIC codes for data processing and telecom, when the actual market operates under electrical work (1731) and electronic parts wholesale (5065) codes.

---

## Output: Client Relationship Registry

The deliverable is a single markdown file with:
1. Tiered company list (Tier 1-6) with evidence chains
2. Cross-reference matrix
3. Geographic mapping (where client activity concentrates)
4. Timeline verification notes (what was retracted and why)
5. Estimated total client count vs. identified count
6. Source index (every source cited with file path or URL)
7. Open questions and next steps

---

## Companion Skills

- `linkedin-activity-intelligence` -- deep extraction from LinkedIn archives
- `intelligence-dossier` -- the dossier framework that houses the registry
- `deep-research` -- the 7-phase research pipeline for gathering raw data
- `commercial-property-research` -- identifies facilities that may reveal client relationships
