---
name: web-visibility
description: >-
  Make a site or product maximally findable by search engines AND AI answer
  engines (ChatGPT Search, Perplexity, Google AI Overviews). Use when building
  visibility into a product, auditing a site's SEO/AEO/GEO, or deciding which
  discoverability mechanism is worth implementing. Evidence-based: prioritizes
  structured data and proven content patterns, and explicitly skips the hype
  (llms.txt-as-SEO, FAQ rich results, Indexing API). Includes JSON-LD recipes,
  robots.txt/llms.txt/IndexNow generators, and a validation step.
---

# Web visibility (SEO + AEO/GEO)

How to get found by both classic search and AI answer engines. The space is full
of hype; this skill encodes what the research actually shows (academic papers +
official docs + vendor specs — sources at the end). **Default to the evidence
hierarchy below before implementing anything.**

## First principle: credibility + structure beat tricks

The only peer-reviewed controlled study (GEO, KDD 2024) found the biggest gains
in AI-answer visibility came from **quotations (+41%), statistics (+32%), inline
citations (+28%), and fluency (+28%)** — and **keyword stuffing measurably
*hurt*.** Citations gave **+115% for a page ranked #5**: the leverage is largest
for newer, lower-authority sites. So: write credible, well-structured, quotable
content; never stuff keywords.

## Evidence hierarchy — what to do vs. skip

| Mechanism | Reality (2026) | Call |
|---|---|---|
| **schema.org / JSON-LD** | The ONLY machine-readable signal AI consumes at scale (Google + Bing→ChatGPT) | **DO — top priority** |
| **AEO/GEO content** (quotes, stats, citations, front-loaded answers, freshness, semantic HTML) | Peer-reviewed effect sizes; biggest lever for small sites | **DO** |
| **robots.txt (RFC 9309) + Content Signals** | Real crawler control; "block training, keep search"; voluntary | **DO** |
| **Sitemap + honest `lastmod` + canonical + internal links** | Core, proven; `priority`/`changefreq` ignored by Google | **DO** |
| **Core Web Vitals** (LCP ≤2.5s, INP ≤200ms, CLS ≤0.1, mobile-first) | Quality tiebreaker, not a boost | **DO** |
| **IndexNow** | Bing/Yandex honor it (Google doesn't); **Bing gates ChatGPT Search ~87%** | **DO (for Bing)** |
| **llms.txt / llms-full.txt** | Vendors don't consume it (~97% of files never fetched); only coding agents fetch | **DO cheaply — as dev-agent convenience, NEVER sold as SEO** |
| **Markdown twins** (serve `.md` to agents via `Accept`) | Emerging; near-free if content is already Markdown | **DO if cheap** |
| **security.txt** (RFC 9116) | IANA-permanent hygiene | **DO (trivial)** |
| **FAQPage / HowTo rich results** | **Deprecated by Google (gone June 2026)** | **Keep visible Q&A (aids AI citation); do NOT chase the markup** |
| **Google Indexing API** | Eligible only for JobPosting/livestream | **SKIP** |
| **aggregateRating without real reviews** | Manual-action risk | **SKIP until genuine on-page reviews** |
| **agents.json / ai-plugin.json / .well-known/mcp** | Niche/stalled/deprecated; not in IANA registry | **SKIP** |
| **Keyword stuffing / thin schema** | Proven to hurt / underperform | **AVOID** |
| **hreflang on a single-language site** | Adds risk, no benefit | **AVOID** |

## The architecture: one source of truth → every artifact

Never hand-author discoverability files. Generate page metadata, JSON-LD,
`sitemap.xml`, `robots.txt`, `llms.txt`, and Markdown twins from one content
model so a new page lights up everywhere and nothing drifts. Reference
implementation (FastAPI/Jinja): `control-plane/seo.py` in `ever-just/ww.everjust.app`.

## JSON-LD recipes (the high-ROI part)

Place `<script type="application/ld+json">` in `<head>`; markup must match
visible content (anti-spam). **Validate every block** (see Validation).

- **Organization** (homepage): `name`, `url`, `logo`, `sameAs` (real social
  profiles only), `contactPoint`.
- **WebSite** (homepage): `name`, `alternateName`, `url`, and a `SearchAction`
  `potentialAction` (sitelinks searchbox eligibility).
- **BreadcrumbList** (catalog/docs): ≥2 `ListItem`s; last may omit `item`.
- **SoftwareApplication / Product** (app/pricing): `name`, `offers.price`. Add
  `aggregateRating` **only** with genuine on-page reviews.
- **Article / TechArticle** (blog/docs): `headline`, `image`, `datePublished`,
  `dateModified` (ISO 8601 w/ tz), `author` (Organization w/ `name`+`url`).

## robots.txt + Content Signals

```
User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=yes
Allow: /
Disallow: /private
Sitemap: https://example.com/sitemap.xml
```

- A site that wants reach **welcomes** search + answer crawlers; `ai-train` is
  the owner's lever (yes for max brand spread; no to opt out of training).
- robots.txt is **voluntary** (RFC 9309); user-triggered fetchers ignore it and
  at least one vendor was caught evading — use a WAF for anything you must stop.
- Keep the AI-crawler user-agent list current from
  `github.com/ai-robots-txt/ai.robots.txt` (`robots.json`).

## llms.txt (cheap, honestly framed)

llmstxt.org format: `# H1` → `> summary` blockquote → `## Section` link lists →
`## Optional`. Hosted at `/llms.txt`; `/llms-full.txt` inlines content. Ship it
for coding agents (Claude Code/Cursor do fetch it) — **never present it as an SEO
lever.**

## IndexNow (fast Bing → ChatGPT)

Host `https://host/{key}.txt`, then POST changed URLs to
`https://api.indexnow.org/indexnow` on deploy (`{host, key, keyLocation,
urlList}`). ~30 lines; Google ignores it, Bing/Yandex/Naver/Seznam honor it.

## AEO/GEO content checklist (apply to every important page)

- [ ] **Front-load a self-contained direct answer** to the page's core question
      in the first ~150 words (passage extraction + citation-position bias).
- [ ] **Cite credible sources inline**, use **concrete statistics with sources**,
      and **quote authorities** where truthful — the three biggest levers.
- [ ] **Show freshness**: visible "last updated" date; review quarterly.
- [ ] **Clean semantic HTML / heading hierarchy** so engines chunk cleanly.
- [ ] **Be in Bing's index** (gates ChatGPT Search) and Google's.
- [ ] **Earn third-party coverage** (answer engines favor earned over owned).
- [ ] **Never keyword-stuff; never fabricate** stats/quotes.

## Validation (do not ship malformed markup)

- Parse every `<script type="application/ld+json">` block as JSON in tests
  (catches template breakage). For richer checks use `scrapinghub/extruct`.
- Google Rich Results Test + Search Console rich-result reports.
- PageSpeed/CrUX for Core Web Vitals at p75 mobile.

## Auditing an existing site (quick pass)

1. `robots.txt` / `sitemap.xml` present, honest, not blocking `noindex` pages?
2. Self-referencing canonical, HTTPS, 200s, shallow internal linking?
3. JSON-LD present, valid, matching visible content (Organization/WebSite at
   minimum; Breadcrumb/Article/Product where relevant)?
4. Pages front-load answers, cite sources/stats, show freshness, chunk cleanly?
5. In Bing's index? IndexNow wired?
6. Core Web Vitals green on mobile?
7. Not doing the "skip" list (FAQ-markup chasing, fake ratings, keyword stuffing)?

## Building visibility into a product (e.g., a website builder)

Bake the above in **by default** per generated site: JSON-LD from the user's real
data, an AI-aware `robots.txt` with an owner training-toggle, per-site `llms.txt`,
IndexNow on the site's domain, and an in-editor AEO checklist (front-loaded
answer, headings, freshness, alt text) so non-technical owners publish citable
pages. Respect tenant isolation (build only from that owner's data) and their
training preference.

## Field-tested techniques (proven in production on everjust.app)

These are the parts that worked end-to-end, with the gotchas that bit us.

**IndexNow with a committed public key (no secret, no server access).** An
IndexNow key is *public by design* — the engine verifies host ownership by
fetching `https://<host>/<key>.txt` — so commit it (a `DEFAULT_INDEXNOW_KEY`
constant, env-overridable), serve the key file unconditionally, and ping
`api.indexnow.org` on every deploy + a weekly cron. No GitHub secret or prod
`.env` edit required. Submission caps that matter: **Bing Webmaster API
`SubmitUrlbatch` = 50 URLs/day; IndexNow = effectively uncapped; sitemap
submission (`SubmitFeed`) = uncapped.** So push everything via IndexNow + the
sitemap, and use the Bing URL-API only for a small priority set.

**The demand-surface page pattern (data-driven, one template, many pages).** The
highest-leverage owned surface is unbranded intent pages generated from data you
already keep:
- `/alternatives/<tool>` — invert each product's "replaces" list → one page per
  competitor ("X alternative", "open source alternative to X").
- `/open-source/<category>` — a curated map of "open source <category>" →
  the app(s) that deliver it.
Each: front-loaded answer, links to the real product page, visible Q&A,
`SoftwareApplication` + `BreadcrumbList` JSON-LD, auto-added to sitemap + llms.txt.
Be honest (no fabricated superiority); if the product is open-source-based, say
so plainly (a true, differentiated angle) — and respect debranding (don't name an
upstream the product hides).

**Prioritize with real keyword volume.** Pull free directional volume from the
**Bing Webmaster Keyword Research API** (`GetKeyword`, ISO `YYYY-MM-DD` dates —
*not* `/Date(ms)/`). What it showed for a SaaS: **"[category] software" and
"open source [category]" volume dwarf "[brand] alternative"** on Bing. Caveats:
Bing is ~3–4% of search (Google ~10–30×, so cross-check Keyword Planner for
absolutes); and **"agent/LLM search volume" is not publicly measurable** — track
your *citation share* (Profound/Otterly-type tools) instead of query counts.

**Ops gotcha that caused a 502 outage:** if nginx upstreams are static
(`server name:port;`, resolved once at startup), a deploy that *recreates* the
app containers gives them new Docker IPs and nginx keeps proxying the dead
ones → 502 on every vhost, while container-direct health checks still pass.
**Fix: restart nginx at the end of the deploy** (after backends are recreated),
or use a `resolver` + variable `proxy_pass` to resolve at request time. Always
verify recovery through nginx (the public URL), not just the container.

## Sources

Academic: GEO (KDD 2024) arxiv.org/abs/2311.09735 · GEO-16 citation study
arxiv.org/html/2509.10762v1 · GEO across engines arxiv.org/html/2509.08919v1.
Official: developers.google.com/search · schema.org · RFC 9309 · llmstxt.org ·
contentsignals.org · indexnow.org/documentation · RFC 9116. Data: Seer (SearchGPT
87% Bing) · Ahrefs (llms.txt 97% unfetched) · github.com/ai-robots-txt/ai.robots.txt.
Full hierarchy and rationale: `ww.everjust.app/docs/VISIBILITY_PLAN.md`.
