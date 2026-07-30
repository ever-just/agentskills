# Market & company signals — hiring, tech, news, ads, physical presence

Company-level intent and firmographic signals, mostly keyless.

## Hiring signals (job boards) — company slug → all open roles

The highest signal-per-effort firmographic source: JD text reveals tech stack, team sizing, growth,
and often a **named hiring-manager contact**. All keyless; find a company's board slug from its
careers page URL.

### Greenhouse  [keyless]
- `curl -s 'https://boards-api.greenhouse.io/v1/boards/{company}/jobs?content=true'`

### Lever  [keyless]
- `curl -s 'https://api.lever.co/v0/postings/{company}?mode=json'`

### Ashby  [keyless]
- `curl -s 'https://api.ashbyhq.com/posting-api/job-board/{company}?includeCompensation=true'`

### SmartRecruiters  [keyless]
- `curl -s 'https://api.smartrecruiters.com/v1/companies/{company}/postings'`
- Plus **Workable**, **Recruitee**, **Teamtailor** public feeds; **USAJOBS** `[free-key]`:
  `https://data.usajobs.gov/api/search`.

> An Apollo `organizations_job_postings` tool exists in this environment, but a keyless job-board
> reader is a distinct, free primitive — and it gives you the full JD text.

## Tech fingerprint (domain → stack)

Complements urlscan/PublicWWW (in [infrastructure-recon.md](infrastructure-recon.md)) with a direct lookup:

### WhatCMS  [free-key]
- `curl -s 'https://whatcms.org/API/Tech?key=$WHATCMS_KEY&url=example.com'`

### BuiltWith — free API  [free-key]
- `curl -s 'https://api.builtwith.com/free1/api.json?KEY=$BUILTWITH_KEY&LOOKUP=example.com'`
- Also **HTTP Archive on BigQuery** for per-site tech + Lighthouse at web scale.

## News / media monitoring

### GDELT DOC 2.0  [keyless]
- **Input → output:** query (company/person/topic) → global news articles, tone, timelines, entity
  co-occurrence.
- **Call:** `curl -s 'https://api.gdeltproject.org/api/v2/doc/doc?query=%22Acme%20Corp%22&format=json&maxrecords=75'`
- **Use:** Keyless news/entity monitoring — funding, leadership changes, controversies.

## Ad transparency

### Meta Ad Library API  [free-key]
- **Input → output:** advertiser → active ads, spend ranges, targeting.
- **Call:** `curl -s 'https://graph.facebook.com/v21.0/ads_archive?search_terms=acme&ad_reached_countries=["US"]&access_token=$META_TOKEN'`
- **Caveats:** Needs a token + ID verification. EU DSA coverage is now **all** ads, not just political.
- Cross-reference: the repo's `ad-transparency-audit` skill covers the pixel→platform workflow.

## Maps / reviews / physical presence

### OpenStreetMap — Nominatim / Overpass  [keyless]
- Geocode + POI lookup with name/phone/website tags.
- **Call:** `curl -s 'https://nominatim.openstreetmap.org/search?q=acme+corp&format=json&addressdetails=1' -H 'User-Agent: research/1.0'`
- **Caveats:** Nominatim = 1 req/s max; heavy tag queries → Overpass API.

### Yelp Fusion  [free-key]
- Business name/location → address, phone, categories, reviews (~500 calls/day free).
- `curl -s 'https://api.yelp.com/v3/businesses/search?term=acme&location=SF' -H 'Authorization: Bearer $YELP_KEY'`
- **Google Places** is paid (with a monthly credit) — reach for it only if OSM/Yelp fall short.

## Procurement / spending (non-US)
- **TED** (EU tenders) and **UK Find a Tender** — public procurement award data → supplier company +
  contact. (US federal spend = USAspending, in [public-records.md](public-records.md).)

## Honest gap: image / face reverse search
There is **no viable free + programmatic** face/image reverse-search source. The real players are
paid or ToS-hostile: **PimEyes**, **FaceCheck.id**, **TinEye API** (paid), Yandex (scrape-only).
Don't promise this capability from a free endpoint — flag it as a paid/manual step if a task needs it.
