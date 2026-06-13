# Client Discovery via Cross-Referencing (OSINT)

## Overview

How to identify the clients and customers of a private company using only open-source intelligence. Private companies (especially bootstrapped VARs, consultancies, and services firms) rarely publish client lists. This skill provides a systematic methodology for extracting client signals from 12+ data source categories, cross-referencing them, and building a tiered confidence registry.

Developed and validated on BROGAV Solutions LLC (data center equipment VAR, ~$4.5M revenue, 1 publicly named client out of an estimated 75-150 total). Started with a single confirmed client (Cologix). Finished with 6 confirmed + 6 probable + 17 event sponsors + 10 warm-network connections = 43+ companies identified across 7 tiers.

Use this skill when you need to:
- Build a client list for a company that doesn't publish one
- Assess customer concentration risk for an acquisition target
- Map a competitor's installed base
- Identify warm leads through relationship intelligence
- Validate an ICP list against real-world relationship evidence

---

## When to Use

- **M&A due diligence:** The target claims "100+ customers" but won't share names before LOI. Use OSINT to verify the claim's plausibility and identify concentration risk.
- **Competitive intelligence:** You need to know who a competitor serves so you can target the same accounts or adjacent ones.
- **Partnership assessment:** Before partnering with a company, verify they actually serve the market they claim.
- **Sales prospecting:** Use identified clients of a competitor to build a lookalike prospect list.
- **Investor diligence:** Verify a startup's claimed traction by finding evidence of real customer relationships.

---

## Prerequisites

- Company name, website URL, and founder/CEO LinkedIn profile URL
- Access to web search, LinkedIn (manual or saved HTML), and public records databases
- Familiarity with the `linkedin-activity-intelligence` and `era-validated-linkedin-analysis` skills (for timeline verification)
- Optional: SignalHire, ZoomInfo, or Apollo for contact enrichment
- Optional: Wayback Machine CDX API access for historical page captures

---

## Method

### The 12 Source Categories

Search all of these. Most private company client intelligence hides in the intersection of multiple weak signals, not in any single strong one.

#### 1. Testimonials (website)
Scrape the company website for testimonial pages. Look for:
- Named clients with named contacts (strongest signal)
- Unnamed testimonials with CMS template errors (e.g., `{they were established}` reveals a Squarespace merge-field failure, meaning the testimonial was pulled from a structured database)
- Product-specific testimonials that narrow the client type (e.g., "liquid cooling installation" narrows to high-density compute operators)
- Testimonial tone and vocabulary (a facility engineer writes differently than a procurement VP)

**Extraction command:**
```bash
curl -s https://example.com/testimonials | grep -oP '"[^"]{50,}"' | sort -u
```

#### 2. Case Studies (website + partner sites)
Case studies often name the client, the product, and the outcome. Check:
- Company website case study pages (and Wayback captures of removed case studies)
- LinkedIn posts describing project completions with tagged companies
- **Supplier/partner websites** — this is the breakthrough source. Manufacturers list their resellers' case studies to promote their own products. Example: RLE Technologies published a BROGAV case study on their website, revealing a Cologix installation that BROGAV never mentioned on its own site.
- YouTube project walkthrough videos

**Key insight:** Supplier case studies are harder for the target company to hide or retract, because they're on a third party's website.

#### 3. LinkedIn Posts (company + founder + team)
The richest source for relationship-driven businesses. Extract:
- Posts explicitly saying "partners and customers" with tagged companies
- Event recap posts tagging attendees from client companies
- Project completion posts with hashtags (#pduinstallation, #pdustartup, #datacenter)
- "Congratulations" posts to clients on expansions, openings, or milestones
- Founder's personal LinkedIn activity archive (see `linkedin-activity-intelligence` skill)
- Employee LinkedIn posts (sales reps, project managers, field technicians often post from client sites)

**Critical warning:** Apply the `era-validated-linkedin-analysis` skill before attributing any LinkedIn intelligence. A founder's feed contains posts from prior employers.

#### 4. Event Sponsors and Speakers
Companies that sponsor or send speakers to the target's proprietary event have a commercial relationship. Classification:
- **Premier sponsors ($5K-$10K+):** Deep commercial relationships — nobody spends $10K to sponsor a 120-person event unless there's a business reason
- **Speakers from end-user companies** (facility managers, procurement VPs, CTOs): Likely clients
- **Speakers from supplier companies:** Upstream partners, not clients — classify separately
- **Event attendees** (non-speaker, non-sponsor): Weakest signal, but still indicates engagement

Source sponsor lists from: event web pages, Wayback Machine captures, YouTube video thumbnails showing sponsor banners, LinkedIn sponsor thank-you posts, sponsorship package PDFs, event registration platforms (Eventbrite, Sched, Emamo).

**Photo intelligence method:** A single event photo can reveal 5-10 sponsor relationships. Download event recap images from LinkedIn and decode every logo on sponsor banners, step-and-repeat backdrops, and table tents.

#### 5. YouTube Transcripts and Videos
Search video transcripts for client names. Check:
- Founder interview videos for "we worked with [company]" references
- Installation demo videos for facility identifiers or client equipment labels
- Event recap videos for sponsor banners and name badges
- Video descriptions and comments
- Podcast guest appearances (often hosted on YouTube)

**Transcript extraction:**
```bash
yt-dlp --write-auto-sub --skip-download --sub-lang en -o "transcript" "VIDEO_URL"
grep -i "client\|customer\|partner\|install\|project" transcript.en.vtt
```

#### 6. Website Crawl (full site)
Crawl every page of the company website. Search for:
- Client logos on "trusted by" or "our clients" sections
- Partner/client distinction (many sites blur these — "partners" may mean clients, suppliers, or both)
- Product pages mentioning specific installations or deployments
- Blog posts referencing projects
- Deleted pages recovered via Wayback Machine (event pages, sponsor pages, member directories)

```bash
wget --spider --recursive --level=3 --no-parent -o crawl.log https://example.com
grep -oP 'https?://[^ ]+' crawl.log | sort -u > all_urls.txt
```

#### 7. Employee Career Histories
Former employers of current staff are warm-lead pools. In relationship-driven industries, salespeople sell to their old networks. Map:
- **Founder's career** (10+ years of accumulated client relationships transfer to the new company)
- **VP Sales connections** (their rolodex is the pipeline)
- **BDMs with manufacturer backgrounds** (they bring their OEM's client list as warm introductions)
- **Field technicians from competitors** (they know where every rack is installed)

This does NOT mean these former employers are current clients. It means there's a warm relationship that makes them probable prospects or referral sources.

#### 8. Web Search (general + trade press)
Search for the company name in:
- Trade publications (Data Center POST, Telecom Newsroom, Mission Critical Magazine)
- Press releases mentioning project partnerships
- Industry award announcements
- Event recap articles from third parties
- Podcasts and webinar announcements

Search queries:
```
"[company name]" client OR customer OR project OR install
"[company name]" site:linkedin.com
"[company name]" site:youtube.com
"[founder name]" podcast OR interview OR webinar
```

#### 9. Industry Associations
Association membership exposes the company to specific buyer pools. Map:
- Which chapters they belong to (geography signal)
- Board positions held by staff (influence signal)
- Golf outings and networking events attended (relationship signal)
- Co-membership with potential clients (shared association = shared network)

Relevant associations vary by industry. For data center: 7x24 Exchange, AFCOM, iMasons, Uptime Institute, Bisnow events.

#### 10. Certification and Registration Databases
- **Supplier diversity registries:** UMN OSD, WBENC directory, SBA DSBS, state DBE directories — registration implies active pursuit of procurement relationships with diversity-mandated buyers
- **Federal procurement:** SAM.gov registration + USASpending.gov for actual awards
- **Construction platforms:** ConstructConnect, Blue Book, Procore — presence means the company bids on construction projects, revealing GC relationships
- **State procurement portals:** Many states publish vendor registrations and PO histories

#### 11. D&B / Third-Party Business Data
- D&B Hoovers OneStop Reports may include trade references (companies the target pays or is paid by)
- SignalHire, ZoomInfo, Apollo firmographics for employee connections
- S&P Global Capital IQ for industry peer comparisons
- Crunchbase for investment relationships and board connections

#### 12. Photo and Image Intelligence
- Event photos with sponsor banners (decode every logo — use AI vision if needed)
- Name badges in group photos (company name + person name + title)
- Facility photos showing client signage on loading docks, lobbies, or server rooms
- Product photos with manufacturer labels (reveals supplier relationships)
- Team photos at client sites (hard hats, hi-vis vests = active construction or commissioning site)
- Social media images from company accounts and employee accounts

**Case study: The LinkedIn image that revealed a $2-5M deal.** A single LinkedIn post image showed BROGAV equipment being installed in a facility with visible client branding. Cross-referencing the tagged people, the equipment type (AI-ready liquid cooling), and the location revealed a previously unknown deal worth an estimated $2-5M with a major colocation provider.

---

## Tiering Framework

Classify every identified company into tiers based on evidence strength.

| Tier | Label | Evidence Required | Example |
|------|-------|-------------------|---------|
| 1 | **Confirmed Client** | Named testimonial, case study, or explicit "partner and customer" tag with transaction evidence | Cologix (named testimonial + case study + C-suite LinkedIn tag) |
| 2 | **Highly Probable** | 3+ independent signals across different source categories | CAI Mission Critical (testimonial + event sponsor + co-presenter + partner decks) |
| 3 | **Probable / Active Prospect** | 2 signals, typically event participation + procurement-role contact | Prime Data Centers (Denver Bisnow "partners and customers" tag + VP Procurement) |
| 4 | **Event Relationship** | Paid sponsorship or sent speaker to proprietary event | RLE Technologies (sponsor + speaker + supplier overlap) |
| 5 | **Referral Channel** | Formal partner listing or co-event sponsorship with referral model | Cofluence LLC (consultancy whose clients need equipment) |
| 6 | **Warm Network** | Prior-employer connections of current staff | Clearfield (founder's 10-year career) |
| 7 | **Ecosystem** | Same buyer pool, indirect relationship, shared association membership | Companies in same 7x24 Exchange chapter who haven't directly engaged |

### Tier Promotion Rules

A company moves up tiers when new evidence surfaces:
- Tier 7 to Tier 6: A current employee previously worked there
- Tier 6 to Tier 5: Evidence of active referral or co-marketing
- Tier 5 to Tier 4: Paid to sponsor or attend the company's event
- Tier 4 to Tier 3: Second independent signal appears (e.g., LinkedIn tag + event)
- Tier 3 to Tier 2: Third independent signal from a different source category
- Tier 2 to Tier 1: Direct transactional evidence (testimonial, case study, PO reference)

---

## Cross-Reference Matrix

Build a matrix showing which companies appear in multiple source categories. More categories = higher confidence.

| Company | Testimonial | Case Study | LinkedIn | Event | YouTube | Supplier | Career | Web Search | Association | Registry | D&B | Photo | Total | Tier |
|---------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Cologix | X | X | X | | | X | | | | | | | 4 | 1 |
| CAI | X | | X | X | | | | | | | | X | 4 | 2 |
| Company C | | | X | X | | | | | | | | | 2 | 3 |

**Template CSV for the matrix:**
```csv
company,testimonial,case_study,linkedin,event,youtube,supplier,career,web_search,association,registry,dub,photo,total_signals,tier,notes
```

---

## Geographic Mapping

Map confirmed and probable client activity against the company's stated sales territories.

```
Territory Map:
  MN (home): 3 confirmed, 5 probable
  VA: 1 probable (Northern Virginia data center corridor)
  TX: 2 event relationships (Dallas)
  CO: 1 highly probable (Denver)
  AZ: 0 identified (Phoenix — gap)
  CA: 0 identified (Bay Area — gap)
```

Geographic gaps (territories with zero identified clients) indicate either:
1. New/undeveloped territory (opportunity)
2. Territory served through channel partners (hidden relationships)
3. Aspirational territory claim (the company doesn't actually operate there)

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

**BROGAV example:**
- Revenue: ~$4.5M
- Project stream: ~65% = $2.9M / $150K avg = ~19 project clients/year
- E-commerce stream: ~35% = $1.6M / $5K avg = ~315 transactions/year
- Operating since 2022 (4 years) = ~75 project clients lifetime
- Identified: 12 (Tier 1-3) = 16% visibility

---

## ICP List Validation

If the company has an ICP (Ideal Customer Profile) prospect list, cross-reference it against your identified relationships. If zero matches appear, the ICP list may be built from wrong industry codes.

This happened with BROGAV: 0 of 20 known relationship companies appeared in a 3,568-row ICP list built from SIC codes for data processing (7374) and telecom (4813), when the actual market operates under electrical work (1731) and electronic parts wholesale (5065) codes. The mismatch revealed that the ICP methodology was fundamentally flawed — it was targeting the clients' industry classification instead of the buyer's procurement classification.

**Lesson:** Always validate an ICP list against known relationships before using it for outreach. Zero overlap = wrong targeting methodology.

---

## Pitfalls

1. **Conflating suppliers with clients.** A company tagged as "partner" on LinkedIn could be upstream (supplier) or downstream (client). Check the relationship direction: does the target company BUY from them or SELL to them?

2. **Era misattribution.** A founder's LinkedIn posts span multiple employers. A "client" from 2019 belongs to the founder's prior employer, not the current company. Always apply `era-validated-linkedin-analysis`.

3. **Event sponsor != client.** A company that sponsors the target's event may be a supplier trying to reach the target's audience, not a buyer. Classify sponsors by type (end-user vs. manufacturer).

4. **Testimonial recycling.** Some companies reuse testimonials from a previous business, a parent company, or a partner. Verify the testimonial is about the current company's products and services.

5. **Overstating confidence.** Two weak signals from the same source category (e.g., two LinkedIn posts) count as one signal, not two. Independence across categories matters more than volume within one category.

6. **Missing the obvious.** Sometimes the client list is on page 47 of the website, in a PDF brochure, or embedded in an image. Crawl everything before declaring the information unavailable.

---

## Real-World Example

**Subject:** BROGAV Solutions LLC (data center equipment VAR, Elk River, MN)

**Starting point:** 1 confirmed client (Cologix, from a website testimonial).

**Process:**
1. Crawled brogavsolutions.com — found 3 unnamed testimonials with CMS template errors
2. Searched RLE Technologies website — found a BROGAV case study naming Cologix
3. Saved and analyzed founder's LinkedIn activity (181 posts) — identified 97 tagged companies
4. Applied era-validated analysis — retracted 30+ companies as prior-employer connections
5. Reviewed BROGAV's proprietary event (LBTI) sponsor lists from 2023-2025 — identified 17 sponsors
6. Cross-referenced LinkedIn tags against event sponsors — 6 companies appeared in both
7. Mapped employee career histories — identified 10 warm-network connections
8. Searched trade press, YouTube, and industry associations — found 3 additional signals

**Result:** 43+ companies identified across 7 tiers. Estimated 16% visibility of total client base. Geographic concentration in MN/Upper Midwest with expansion signals in CO, TX, VA.

---

## Output Template

### Client Relationship Registry

```markdown
# [Company Name] — Client Relationship Registry
Generated: [Date]
Analyst: [Name/Agent]

## Summary
- Confirmed clients: [N]
- Highly probable: [N]
- Probable: [N]
- Event relationships: [N]
- Referral channels: [N]
- Warm network: [N]
- Ecosystem: [N]
- **Total identified: [N]**
- Estimated total client base: [N]
- Visibility: [N]%

## Tier 1: Confirmed Clients
| Company | Evidence | Sources | Notes |
|---------|----------|---------|-------|

## Tier 2: Highly Probable
...

## Cross-Reference Matrix
[Matrix table]

## Geographic Distribution
[Territory map]

## Timeline Verification Notes
[What was retracted and why]

## Open Questions
- [ ] [Question 1]
- [ ] [Question 2]

## Source Index
| # | Source | URL/Path | Date Accessed |
|---|--------|----------|---------------|
```

---

## Companion Skills

- `linkedin-activity-intelligence` — deep extraction from LinkedIn archives
- `era-validated-linkedin-analysis` — prevents misattribution of prior-employer intelligence
- `intelligence-dossier` — the dossier framework that houses the registry
- `deep-research` — the 7-phase research pipeline for gathering raw data
- `commercial-property-research` — identifies facilities that may reveal client relationships
- `competitor-identification` — identifies who else serves the same client base
