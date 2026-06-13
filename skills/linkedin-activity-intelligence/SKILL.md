# LinkedIn Activity Intelligence Extraction

## Overview

How to extract structured business intelligence from a LinkedIn user's activity archive (MHTML save or HTML save). Covers company tag extraction, people identification, post dating by content clues, timeline verification, image analysis, and cross-referencing tagged entities to build relationship maps.

Developed and validated on Celina Berglund's LinkedIn activity (136MB MHTML, 181 posts, 97 companies, 60+ people, 398 images, June 2026).

Use this skill when you need to:
- Map a founder's or executive's professional network from their LinkedIn activity
- Identify clients, suppliers, and partners from social media signals
- Extract business intelligence from a saved LinkedIn page without API access
- Build a relationship graph from public social media data

---

## Data Capture

### Step 1: Save the LinkedIn Activity Page

Navigate to the target profile's activity page:
`https://www.linkedin.com/in/[username]/recent-activity/all/`

Scroll to the bottom to load all posts (LinkedIn lazy-loads). Then save two ways:
1. **MHTML (Web Archive):** File > Save As > Web Page, Single File (.mhtml). This captures images inline. Expect 50-200MB.
2. **Complete HTML:** File > Save As > Web Page, Complete. This saves HTML + a folder of assets (images, CSS, JS). Smaller HTML file but images in a separate folder.

### Step 2: Extract Metadata

From the saved HTML/MHTML, extract:

**Company tags:**
```bash
grep -oE 'linkedin\.com/company/[a-z0-9_-]+' raw.html | sed 's|linkedin.com/company/||' | sort | uniq -c | sort -rn
```

**Person tags:**
```bash
grep -oE 'linkedin\.com/in/[a-z0-9_-]+' raw.html | sed 's|linkedin.com/in/||' | sort | uniq -c | sort -rn
```

**Activity/post URLs:**
```bash
grep -oE 'linkedin\.com/feed/update/urn:li:activity:[0-9]+' raw.html | sort -u
```

**Company names with labels:**
```bash
grep -oE 'aria-label="[^"]*" target="_self" href="https://www\.linkedin\.com/company/[^"]*"' raw.html | sort -u
```

**Post text extraction:** LinkedIn's "see more" truncation means most post text is cut off in the HTML. The visible text is what loaded before the user clicked "see more." To get full post text, you need to expand each post in a browser before saving. If the text is truncated, use surrounding HTML context (tagged entities near the truncated text) to infer what was cut off:

```bash
grep -B2 -A20 'SEARCH_PHRASE' raw.html | grep -oE 'href="https://www.linkedin.com/(company|in)/[^"]*"'
```

### Step 3: Extract Images

From MHTML: use a MHTML parser or extract manually.
From Complete HTML: images are in the `_files/` folder.

Filter by size: images >100KB are likely product photos, event photos, or marketing materials. Images <10KB are LinkedIn UI elements (thumbs up icons, chevrons, etc.).

---

## Analysis Framework

### Company Tags: Classification

Categorize every tagged company by relationship type:

| Category | Description | Example |
|----------|-------------|---------|
| **Client/Prospect** | Data center operators, end-users tagged in business context | Cologix, H5 Data Centers, CoreSite |
| **Supplier/Manufacturer** | Companies whose products the subject sells | Eaton, Vertiv, Schneider Electric |
| **Strategic Partner** | Co-selling, co-presenting, or referral relationships | CAI Mission Critical, Cofluence |
| **Industry Association** | Membership organizations | 7x24 Exchange, iMasons, AFCOM |
| **Media/PR** | Publications, podcasts, PR agencies | Data Center POST, iMiller PR |
| **Pre-Career** | Former employers (tagged in reshares or legacy posts) | Clearfield, Emcor, Belden |
| **Event** | Event brands (may be the subject's own) | LBTI, DCAC, PTC |
| **Education/Community** | Schools, nonprofits | Hennepin Technical College |

**Tag frequency matters but is not definitive.** A company tagged 10 times could be a deep client or a supplier whose content the subject frequently reshares. Always check the post context.

### People Tags: Identification

For frequently tagged people whose companies are unknown:
1. Search "[Name]" + industry keywords + "linkedin"
2. Check ZoomInfo, RocketReach, The Org for current company/title
3. Map each person to their company, then classify the company

**Key insight:** A person's role determines the relationship type. A VP of Procurement at a data center operator is a buyer. A Sales Manager at a manufacturer is a supplier contact. A CEO of a consulting firm is a referral partner.

### Timeline Verification (Critical)

**LinkedIn activity pages show posts in reverse chronological order (newest first).** But they include the user's ENTIRE history, including posts from previous employers. If a founder started their company in 2022, posts from 2020 are from a previous job.

**How to date posts without timestamps:**
- Explicit year mentions ("2026 SKI2 Summit," "budget spent in 2023")
- Event dates ("PTC in January," "LBTI Feb 5-6")
- Seasonal clues ("Labor Day weekend," "Christmas gift")
- Product/hiring references that match known company timelines
- Post position in the list (post 1 = newest, post 181 = oldest)

**Verification rule:** Before attributing any intelligence to the current company, verify the post dates to the correct era. A post saying "our customers in Columbus, OH" from 2020 describes the previous employer's customers, not the current company's.

**Red flags for era misattribution:**
- Posts mentioning products the current company doesn't sell
- Posts tagging the former employer's company page
- Posts referencing cities/events not in the current company's territory
- COVID-era references ("first time traveling in 3 months") dating to 2020-2021

### Image Analysis

Prioritize images by intelligence value:
1. **Sponsor banners** at events (identify every logo)
2. **Name badges** (company name + person name)
3. **Facility photos** (signage, equipment labels, client logos on walls)
4. **Product photos** (manufacturer branding, model numbers)
5. **Group/team photos** (branded clothing, company backdrops)
6. **Marketing materials** (datasheets, presentations)

Skip: personal/family photos, food/drink, scenic photos, memes, motivational quotes, LinkedIn UI screenshots.

---

## Output Structure

Produce a structured intelligence report with:

1. **Archive statistics:** post count, company tag count, people count, image count, date range
2. **Company tag inventory:** full list with tag counts, categorized by relationship type
3. **People tag inventory:** top 20+ with company affiliations resolved
4. **Timeline map:** which posts belong to which employment era
5. **Key findings:** new suppliers, new clients, new events, new products discovered
6. **Image intelligence:** findings from photo analysis
7. **Retracted/corrected items:** anything initially misattributed to the wrong era

---

## Pitfalls

1. **LinkedIn "see more" truncation.** Most post text is cut off. The tagged company/person names are often in the truncated portion. Use HTML context extraction (grep around the visible text) to recover them.

2. **Reshares look like original posts.** A reshare of a manufacturer's post looks like the user tagged that manufacturer. Check whether the post text is original or a reshare.

3. **Video posts are opaque.** LinkedIn videos cannot be downloaded without browser authentication. yt-dlp's LinkedIn extractor is broken as of 2026. Video content (DataBank MSP3 ribbon cutting, installation demos) may contain critical intelligence not available in text.

4. **Tag inflation.** Some tags come from LinkedIn's auto-suggestion, not intentional mentions. A company tagged once in a reshare is weaker signal than one tagged in original content with business context.

5. **Era bleed.** The most dangerous error. A post from 2020 attributed to a 2022 company produces false client lists, false product catalogs, and false geographic claims. Always verify the era.

---

## Companion Skills

- `intelligence-dossier` -- the dossier framework that consumes this intelligence
- `client-discovery-osint` -- the broader client identification methodology
- `deep-research` -- the 7-phase research pipeline that may feed into this
