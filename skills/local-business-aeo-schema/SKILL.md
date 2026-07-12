---
name: local-business-aeo-schema
description: Implement local-business SEO plus answer-engine / generative-engine optimization (AEO/GEO) structured data on a marketing site by HAND-AUTHORING a schema.org JSON-LD @graph — LocalBusiness, Service, FAQPage, Review/AggregateRating, BreadcrumbList — rather than relying on a CMS's auto-generated Organization/WebSite blocks. Use when a site (especially a customized everjust.app/Odoo tenant edited via [[everjust-website-infra-views]]) needs rich per-page structured data plus AI-citation crawlability. Covers: a SITEWIDE LocalBusiness node with @id='#business' injected into <head> that RESOLVES dangling provider {@id:#business} refs other pages emit; per-page Service + FAQPage + BreadcrumbList @graph; building FAQPage DETERMINISTICALLY from the page's VISIBLE Q&A (regex-extract both accordion and h3/p markups) so schema always matches visible content per Google's requirement; the Google Dec-2025 policy that Review + AggregateRating must sit on a SERVICE node NOT on LocalBusiness/Organization (self-serving aggregateRating on the business is ineligible and risks a manual action) and only from REAL reviews (author + verbatim body); an explicit robots.txt Allow-list for AI-citation crawlers (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended); diagnosing a bot-challenge (e.g. a WAF / Vercel Attack Challenge Mode returning 429 to Googlebot/GPTBot/PerplexityBot) that makes a domain INVISIBLE to search + AI; and the llms.txt reality-check (research shows ~97% get zero requests and Google says it does not use it — the real levers are crawlability, schema, real reviews, and answer-first content). NOT for the platform's auto Organization/WebSite JSON-LD or per-page meta title/description (use [[everjust-website-seo]]) and NOT the mechanics of writing the infra view itself (use [[everjust-website-infra-views]]). Cross-references [[everjust-website-seo]], [[everjust-website-infra-views]], [[everjust-website]].
---

# Local-Business AEO / GEO Schema — Agent Skill

Make a marketing site rank in local search AND get cited by answer engines (Google AI Overviews, ChatGPT, Perplexity, Claude) by **hand-authoring a schema.org JSON-LD @graph** and by making the site crawlable to AI-citation bots. This is for sites that need **richer structured data than a CMS auto-generates** — a customized everjust.app/Odoo tenant, or any page where you emit your own `<script type="application/ld+json">`.

This skill is the **schema design + AEO strategy**. Two neighbors own the mechanics: [[everjust-website-infra-views]] SHIPS a sitewide JSON-LD view over XML-RPC and edits robots.txt; [[everjust-website-seo]] owns per-page meta title/description and the platform's AUTO Organization/WebSite blocks. Note the contrast with everjust-website-seo: it says 'do not author your own JSON-LD, feed the auto blocks.' That holds for a vanilla tenant. This skill applies to a **hand-authored-schema** site where you deliberately inject a graph — a different, more customized surface. Do not run both stances on the same node (see Pitfalls).

## When to use this skill

- A local-business marketing site needs **LocalBusiness / Service / FAQPage / Review / BreadcrumbList** structured data.
- Other pages already emit `provider: {"@id":"#business"}` refs that resolve to nothing — you need the **canonical `@id='#business'` node**.
- You want the page's **visible FAQ** mirrored into `FAQPage` schema (Google requires the answer be visible on the page).
- You need to add **star ratings / reviews** to rich results — and must place `aggregateRating` correctly to stay eligible.
- The site is up but **not appearing** in Google or AI answers — you suspect a bot challenge.
- Someone wants to 'add llms.txt for AI SEO' and you need the honest cost/benefit.

**Do NOT use this skill for**:
- **Per-page meta title/description/OG** or the platform AUTO Org/WebSite JSON-LD → [[everjust-website-seo]].
- **The mechanics of writing the infra view / robots.txt** on an everjust tenant → [[everjust-website-infra-views]].
- **Page body content** → [[everjust-website]].

## The schema model — the @graph map

| Node | Where it lives | Key point |
|---|---|---|
| `LocalBusiness` `@id='#business'` | ONE sitewide node, injected into `<head>` on every page | Canonical business identity: name, address, geo, telephone, url, openingHours, sameAs. Other pages reference it by `@id` — this node RESOLVES those refs. |
| `Service` | Per service page | `provider: {"@id":"#business"}` links back to the sitewide node. **This is where `aggregateRating`/`review` go** (see Dec-2025 rule). |
| `FAQPage` | Per page that shows a visible FAQ | `mainEntity[]` of Question→acceptedAnswer, built from the page's VISIBLE Q&A. |
| `BreadcrumbList` | Per deep page | `itemListElement[]` mirroring the visible breadcrumb trail. |
| `Review` / `AggregateRating` | ON the `Service` node (NOT LocalBusiness/Organization) | Only REAL reviews (author name + verbatim body). |

## Core rule 1 — the sitewide @id='#business' node resolves cross-page refs

Per-page Service graphs commonly emit `"provider": {"@id": "#business"}` — a REFERENCE, not a definition. If nothing on the page defines `@id: "#business"`, the ref dangles and validators warn. Fix once: inject a single **sitewide** `LocalBusiness` node with `"@id": "#business"` into `<head>` on every page (ship it via [[everjust-website-infra-views]] Recipe 4). Every page's Service `provider` ref now resolves to it.

```json
{ "@context": "https://schema.org", "@type": "LocalBusiness", "@id": "#business",
  "name": "...", "url": "https://connectdomain.app", "telephone": "+1-612-...",
  "address": {"@type": "PostalAddress", "streetAddress": "...", "addressLocality": "...", "addressRegion": "MN", "postalCode": "..."},
  "geo": {"@type": "GeoCoordinates", "latitude": "...", "longitude": "..."},
  "openingHoursSpecification": [ ... ], "sameAs": [ ... ] }
```

## Core rule 2 — FAQPage MUST be built from VISIBLE content, deterministically

Google requires that FAQ schema answers are **visible on the page**. So do NOT invent Q&A for schema — EXTRACT the page's rendered FAQ and mirror it. Handle BOTH common markups (accordion and h3/p) with regex so schema tracks the DOM exactly:

```python
import re, html
# accordion: <button ...>Q</button> ... <div ...>A</div>   |  or h3/p: <h3>Q</h3><p>A</p>
pairs = []
for q, a in re.findall(r'<h3[^>]*>(.*?)</h3>\s*<p[^>]*>(.*?)</p>', page_html, re.S):
    pairs.append((html.unescape(re.sub('<[^>]+>','',q)).strip(),
                  html.unescape(re.sub('<[^>]+>','',a)).strip()))
# also parse the accordion markup variant the same way and merge
faq = {"@context":"https://schema.org","@type":"FAQPage",
  "mainEntity":[{"@type":"Question","name":q,
    "acceptedAnswer":{"@type":"Answer","text":a}} for q,a in pairs]}
```
If a Q&A is not visible on the page, it does not go in the schema. Rebuild the schema whenever the visible FAQ changes so they never drift.

## Core rule 3 — aggregateRating/review go on the SERVICE node (Google Dec-2025)

**Do not put `aggregateRating` or `review` on the `LocalBusiness`/`Organization` node.** Per Google's December 2025 policy, **self-serving `aggregateRating` on the business entity is ineligible for rich results and risks a manual action**. Star ratings belong on a `Service` (or `Product`) node the business provides:

```json
{ "@type": "Service", "name": "...", "provider": {"@id": "#business"},
  "aggregateRating": {"@type": "AggregateRating", "ratingValue": "4.9", "reviewCount": "37"},
  "review": [ {"@type":"Review", "author":{"@type":"Person","name":"<REAL name>"},
               "reviewRating":{"@type":"Rating","ratingValue":"5"},
               "reviewBody":"<verbatim review text>"} ] }
```
Use **only REAL reviews** — a real author and the **verbatim** body. Fabricated or paraphrased reviews are a policy violation (and an honesty problem — see [[marketing-site-authenticity-audit]]).

## Core rule 4 — allow the AI-citation crawlers (robots.txt)

Answer engines cite pages their bots can fetch. Add an explicit allow-list (ship via [[everjust-website-infra-views]] Recipe 5 → `website.robots_txt`):
```
User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Claude-SearchBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /
```

## Core rule 5 — diagnose bot-challenge INVISIBILITY

A site can be fully up for humans yet **invisible to search + AI** because a WAF / edge bot-challenge (e.g. Vercel Attack Challenge Mode, Cloudflare challenge) returns **429/403 to bot user-agents**. Symptom: `site:` shows nothing indexed and AI engines don't cite it, though the browser loads fine. Diagnose by fetching as each bot UA and running the index check:
```bash
for ua in "Googlebot" "GPTBot" "PerplexityBot"; do
  echo "== $ua =="; curl -s -o /dev/null -w '%{http_code}\n' -A "$ua" https://<site>/
done
# 429/403 for bot UAs but 200 in a browser  → a bot challenge is hiding you
```
Also check `site:<domain>` coverage. Remedy: allow-list verified crawler UAs / turn the challenge off for them at the edge. No amount of schema helps if the crawler gets a 429.

## Core rule 6 — the llms.txt reality-check

When asked to 'add llms.txt for AI SEO': it is **low value** for answer-engine ranking. Research shows **~97% of llms.txt files get zero requests**, and **Google has said it does not use llms.txt**. Don't spend effort there. The real levers are, in order: **crawlability** (no bot challenge; robots allows the AI bots), **structured data** (the @graph above), **real reviews** on the Service node, and **answer-first content** (lead with the direct answer, then support it). Shipping llms.txt is harmless but not a substitute for these.

## Recipes

1. **Audit** — fetch each page, list what schema is present, find dangling `@id` refs, note which FAQs are visible, check `site:` coverage, and curl as bot UAs (Core rule 5).
2. **Ship the sitewide `#business` node** into `<head>` (Core rule 1) via [[everjust-website-infra-views]] Recipe 4.
3. **Per page**: add `Service` (with real reviews/rating per Core rule 3), `FAQPage` built from visible Q&A (Core rule 2), and `BreadcrumbList` mirroring the visible trail.
4. **robots.txt** — allow the AI crawlers (Core rule 4) via [[everjust-website-infra-views]] Recipe 5.
5. **Validate** — Google Rich Results Test / Schema Markup Validator; confirm no dangling refs, no aggregateRating on the business node, FAQ answers all visible.

## Pitfalls

1. **aggregateRating/review on LocalBusiness or Organization.** Ineligible + manual-action risk per Google Dec-2025. Put them on the `Service` node with `provider: {@id:#business}`.
2. **FAQ schema that isn't on the page.** Google requires the answer be visible. Build FAQPage by EXTRACTING the rendered Q&A (Core rule 2); never author FAQ schema by hand from imagination.
3. **Dangling `@id` refs.** Pages reference `#business` but nothing defines it. Ship the ONE sitewide node.
4. **Fake or paraphrased reviews.** Only real author + verbatim body. Fabrication is a policy violation and a marketing-honesty problem ([[marketing-site-authenticity-audit]]).
5. **Running the auto-JSON-LD stance and the hand-authored stance on the same node.** everjust-website-seo says feed the auto Org/WebSite blocks and NOT inject your own; this skill injects a graph. Two competing Organization blocks confuse validators. Keep the AUTO Org/WebSite (via [[everjust-website-seo]]) and add the LocalBusiness/Service/FAQ graph — don't emit a SECOND Organization.
6. **Shipping llms.txt instead of fixing crawlability/schema.** ~97% zero requests; Google doesn't use it. Fix the real levers first.
7. **Publishing schema on a site behind a bot challenge.** The crawler gets 429 and never sees your markup. Diagnose (Core rule 5) before blaming the schema.

## See also
- [[everjust-website-infra-views]] — SHIPS the sitewide JSON-LD view + robots.txt over XML-RPC (no SSH).
- [[everjust-website-seo]] — per-page meta + AUTO Org/WebSite blocks.
- [[marketing-site-authenticity-audit]] — ensure the reviews you schema-ify are real.
