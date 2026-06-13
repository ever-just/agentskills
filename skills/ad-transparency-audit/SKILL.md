# Ad Transparency Audit

> Determine a company's actual paid advertising activity by cross-referencing tracking pixels installed on their website against public ad transparency platforms. Reveals the gap between "pixel infrastructure" and "actual ad spend."

---

## When to use

- Competitive intelligence: understanding a competitor's marketing investment
- Due diligence: assessing a company's customer acquisition strategy
- Partnership evaluation: understanding how a company generates leads
- Marketing analysis: comparing digital marketing sophistication across competitors

---

## The insight

Many companies install advertising tracking pixels (Google Analytics, Meta Pixel, TikTok Pixel, The Trade Desk, etc.) on their website but never activate paid campaigns behind them. Detecting pixels alone overstates advertising activity. This skill cross-references pixel presence against actual ad transparency data to determine real marketing spend.

---

## Workflow

### Phase 1: Identify installed pixels

Run a tech stack scan to detect all tracking pixels and marketing tags:

```bash
# ProjectDiscovery httpx with tech detection
~/go/bin/httpx -u https://TARGET.com -tech-detect -json -follow-redirects

# Look for: Google Analytics, GTM, Meta Pixel, TikTok Pixel, 
# The Trade Desk, LinkedIn Insight Tag, Twitter/X Pixel, etc.
```

### Phase 2: Parse GTM container

If Google Tag Manager is detected, parse the container JavaScript for the full tag configuration:

```bash
# Fetch and analyze GTM container
curl -s "https://www.googletagmanager.com/gtm.js?id=GTM-XXXXXXX"
```

Extract from the GTM container:
- All Google Analytics measurement IDs (GA4 + UA)
- GCLID (Google Click ID) tracking — if enabled, a Google Ads account exists or existed
- Facebook/Meta Pixel IDs
- TikTok Pixel IDs
- LinkedIn Insight Tag
- Custom conversion tracking
- Any other marketing tags

**Key signal:** GCLID tracking enabled in GTM means the company has/had a Google Ads account, even if no active ads are currently running.

### Phase 3: Check ad transparency platforms

| Platform | URL | What to search | Data returned |
|----------|-----|---------------|---------------|
| **Google Ads Transparency** | adstransparency.google.com | Company name or domain | Ad creatives, date ranges, geographic targeting |
| **Meta Ad Library** | facebook.com/ads/library | Company name | Ad creatives, platforms (FB/IG/Messenger), date ranges |
| **TikTok Ad Library** | library.tiktok.com/ads | Company name | Ad creatives, targeting |
| **LinkedIn** | No public ad library | Search for "sponsored" posts | Indirect only |
| **The Trade Desk** | No public ad library | N/A | Cannot verify — DSP is opaque |

### Phase 4: Check for ads.txt

```bash
curl -s "https://TARGET.com/ads.txt"
```

If present, ads.txt lists authorized digital sellers and publisher IDs. If 404 (not found), the company has no programmatic ad infrastructure.

### Phase 5: Cross-reference GA IDs for related domains

Search for other websites using the same Google Analytics property:

```
# Try these services:
dnslytics.com/google-analytics/GA-MEASUREMENT-ID
spyonweb.com/GA-MEASUREMENT-ID
builtwith.com (search by tracking ID)
```

If multiple domains share the same GA property, they're controlled by the same entity — reveals related websites, event microsites, or subsidiary brands.

### Phase 6: Check PR/content marketing (non-paid channels)

Search for the company's PR agency and identify if editorial coverage is actually PR placement:

```
"company name" site:imillerpr.com OR site:prnewswire.com OR site:businesswire.com
```

**Key pattern to check:** Is the company's PR agency also the publisher of their media coverage? (e.g., iMiller PR runs both the PR agency and Data Center POST — same person controls both sides.)

---

## Output template

```markdown
# Ad Transparency Audit: [TARGET]

## Pixel vs. activity matrix

| Platform | Pixel installed? | Active ads found? | Assessment |
|----------|-----------------|-------------------|------------|
| Google Ads | GA + GTM + GCLID | Yes/No | ... |
| Meta | Pixel ID: ... | Yes/No | ... |
| TikTok | Yes/No | Yes/No | ... |
| LinkedIn | Yes/No | Yes/No | ... |
| Trade Desk | Pixel ID: ... | Unknown | ... |

## Key findings
- [Is the company actually running paid ads, or just collecting data?]
- [What is their real marketing strategy? (Events? PR? Organic LinkedIn? Referrals?)]
- [Any PR/editorial conflicts of interest?]
```

---

## Real-world example

A data center VAR (June 2026) had The Trade Desk and TikTok pixels installed, suggesting active programmatic and social advertising. Cross-referencing against all 5 ad transparency platforms revealed **zero active ads on any platform**. The pixels were either dormant setup, Wix template artifacts, or from paused campaigns. The company's actual marketing strategy was entirely relationship-driven (referrals + industry events + PR placements through a conflicted PR agency/publisher relationship).

The gap between "has pixels" and "runs ads" was 100%.

---

## Tools

- ProjectDiscovery httpx (tech detection)
- GTM container fetch and parse
- Google Ads Transparency Center (free)
- Meta Ad Library (free, basic login required)
- TikTok Commercial Content Library (free)
- ads.txt fetch
- DNSlytics / SpyOnWeb (GA ID cross-referencing)
