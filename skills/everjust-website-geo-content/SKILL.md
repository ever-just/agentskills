---
name: everjust-website-geo-content
description: Build the citable CONTENT layer that gets an everjust.app (Odoo 19) marketing site cited by AI answer engines (ChatGPT, Perplexity, Google AI Overviews) and ranked for category/intent queries. Use when the task is to create a topical content cluster (pillar page + glossary/definition pages + how-to guides), add per-page schema.org JSON-LD in the QWeb arch (DefinedTerm, FAQPage, TechArticle, CollectionPage, additive to the auto Organization/WebSite blocks), wire hub-and-spoke internal linking, structure copy answer-first for AI citation, or keep new pages discoverable via the sitemap ir.attachment freshness cron. The everjust-Odoo IMPLEMENTATION of [[generative-engine-optimization]] (the generic strategy). NOT for per-page SEO metadata/sitemap/robots/IndexNow ([[everjust-website-seo]]) nor raw page editing ([[everjust-website]]); publish via [[everjust-odoo-shell-ops]] or the MCP. Cross-references [[everjust-website-snippets]], [[everjust-platform]].
---

# EVERJUST Website GEO Content, Agent Skill

Build the **content** that gets a live everjust.app tenant's public marketing site **cited by AI answer engines** (ChatGPT Search, Perplexity, Google AI Overviews) and **ranked for category / intent queries** ("custom domains for SaaS", "how to add custom domains to my SaaS"), not just its brand name. This is the CONTENT-CREATION counterpart to [[everjust-website-seo]] (the metadata / indexing / IndexNow layer) and [[everjust-website]] (raw page arch editing). It answers one question those two do not: **what content to build, and how to structure and interlink it so an AI extracts and cites it.** Stay in that lane; do not re-implement per-page meta, sitemap membership, robots, or IndexNow here (that is [[everjust-website-seo]]).

You publish through the tenant's **`everjust_agent_mcp`** website tools so the pages are CMS records (an `ir.ui.view` COW fork + a `website.page`) with no addon deploy: `website_new_page` then `website_edit_page`, which are COW-safe and set up the `website.page` + `ir.ui.view` correctly ([[everjust-website]]). Connect to the tenant per [[everjust-agent-mcp]]. Read [[everjust-platform]] first for COW, the `/odoo` debrand, `everjust.public_website`, and the never-self-escalate invariants.

## When to use this skill

- **Build a content cluster for topical authority**, one long comprehensive PILLAR page plus GLOSSARY/definition pages plus HOW-TO GUIDES, wired hub-and-spoke, targeting a category rather than a competitor.
- **Add a pillar page**, roughly 4000 to 5000 words, one H1, about ten question-shaped H2s, a build-vs-buy comparison table, that links out to every spoke in its cluster.
- **Add glossary / definition pages**, one term each, roughly 1000 to 1400 words, answer-first, with `DefinedTerm` JSON-LD, each linking back to the pillar plus its sibling terms plus one audience page.
- **Add how-to guides**, roughly 1000 to 1600 words, `TechArticle` JSON-LD, honesty-checked so no API/endpoint/SDK is fabricated (product specifics defer to the docs host).
- **Add per-page CONTENT schema.org JSON-LD**, a `DefinedTerm`, `FAQPage`, `TechArticle`, or `CollectionPage` + `ItemList` block INSIDE the page arch, ADDITIVE to the platform's auto-injected Organization/WebSite blocks.
- **Structure copy for AI citation (GEO)**, answer-first BLUF, question-shaped H2s that mirror real searches, comparison/FAQ TABLES, exactly one H1, a short FAQ per page.
- **Enforce a per-tenant brand contract at scale**, author in parallel, adversarially verify against a banned-terms/brand contract, then independently re-scan every page before publish.
- **Fix sitemap freshness after publishing a cluster**, clear the cached `/sitemap.xml` `ir.attachment` (or install an `ir.cron` to keep it fresh) so Google and an IndexNow sweep actually see the new URLs.

**Do NOT use this skill for**, and stop if the task is really:
- **Per-page meta / sitemap membership / robots / IndexNow / Search Console**, `website_meta_*`, `seo_name`, `website_indexed`, `robots_txt`, the `everjust_visibility.indexnow_key`. That is [[everjust-website-seo]]. This skill sets the JSON-LD you ADD to a page; [[everjust-website-seo]] owns the auto-injected Organization/WebSite blocks and everything crawler-facing.
- **Raw page arch editing, nav menus, redirects**, the COW-safe `website_edit_page`, `website_menu`, `website_redirect`. That is [[everjust-website]]. This skill tells you WHAT arch to write; [[everjust-website]] is the mechanic for writing it.
- **The on-brand snippet vocabulary**, the `s_cd_*` snippets and the compiled Tailwind class set. That is [[everjust-website-snippets]]; match its class idiom, do not invent it here.
- **Connecting to the tenant and the generic tool surface**, the MCP handshake, `search`/`get`/`create`/`update`/`call` and the `confirm:true` gate. That is [[everjust-agent-mcp]].
- **Platform invariants**, COW, the public gate, structural-model confirm gates, never self-escalate. Read [[everjust-platform]] first.

---

## The content-cluster pattern (topical authority)

One CLUSTER = one PILLAR (the hub) plus its SPOKES (glossary defs + guides). The link graph is what earns topical authority and passes internal-link equity; the word counts are minimums for comprehensiveness, not padding.

| Content type | Length | Structure | Per-page JSON-LD (@type) | Links |
|---|---|---|---|---|
| **Pillar** (hub) | ~4000-5000 words | one H1, ~10 question-shaped H2s, a build-vs-buy comparison table, a "Key terms, defined" hub block linking every glossary def | `FAQPage` + a product `@type` (e.g. `SoftwareApplication`) | OUT to every spoke |
| **Glossary def** (spoke) | ~1000-1400 words | answer-first BLUF, question-shaped H2s, short FAQ | `DefinedTerm` + `FAQPage` | back to pillar + sibling defs + one audience page |
| **How-to guide** (spoke) | ~1000-1600 words | answer-first, numbered steps, short FAQ, NO fabricated API | `TechArticle` + `FAQPage` | back to pillar + sibling guides + one audience page |
| **Glossary / hub index** | short | a list that hubs the whole cluster | `CollectionPage` + `ItemList` | to every def + guide + pillar |

**Hub-and-spoke wiring (do all four):**
1. The **pillar links OUT to every spoke** (a dedicated hub section, e.g. `<section id="cd-pillar-glossary">` "Key terms, defined", injected idempotently so a re-run does not duplicate it).
2. Each **spoke links BACK to the pillar**, to its **sibling spokes**, and to the **single most relevant audience page** (e.g. one `/for/*` page).
3. A **glossary/index page** that lists and links the entire cluster (its own `CollectionPage` + `ItemList`).
4. A **site-wide FOOTER link to the hub** so EVERY page on the site passes link equity into the cluster (a "Resources" column leading with the pillar + "Glossary").

### Real worked example (customdomain.ai, connectdomain tenant, website id 1)

Built as CMS records, all live, all in the sitemap. Use it as the concrete template for a new cluster.

| Page | URL | `website.page` id | `ir.ui.view` id | view key |
|---|---|---|---|---|
| Pillar | `/custom-domains-for-saas` | 40 | 4112 | `website_connectdomain.cd_custom_domains_for_saas` |
| Glossary def | `/glossary/bring-your-own-domain` | 41 | 4115 | (per-page) |
| Glossary def | `/glossary/multi-tenant-tls` | 42 | 4116 | (per-page) |
| Glossary def | `/glossary/apex-domain-vs-cname` | 43 | 4117 | (per-page) |
| Glossary def | `/glossary/on-demand-tls` | 44 | 4118 | (per-page) |
| Glossary index | `/glossary` | 45 | 4119 | (per-page) |
| Guide | `/guides/add-custom-domains-to-your-saas` | 46 | 4120 | (per-page) |
| Guide | `/guides/automate-tls-for-customer-domains` | 47 | 4121 | (per-page) |
| Guide | `/guides/connect-domains-with-ai-agents` | 48 | 4122 | (per-page) |

The footer that actually renders on this tenant is the **website-specific COW fork `cd_footer` view id 4091** (`website_id=1`), NOT the generic `website_connectdomain.cd_footer` (view 3753, `website_id=False`). Editing 3753 does nothing visible. Edit 4091 for footer changes (see Pitfall 8 and [[everjust-website]] on COW).

---

## Per-page schema.org JSON-LD (the differentiator vs [[everjust-website-seo]])

This is the key nuance. The `everjust_visibility` addon AUTO-injects **Organization + WebSite** JSON-LD on **every page globally** (via `website._everjust_jsonld()` xpathed into `//head`). You must **NOT hand-author a duplicate Organization or WebSite block** ([[everjust-website-seo]] Pitfall 6). BUT per-page **CONTENT schema of a DIFFERENT `@type`** is **ADDITIVE**, and you DO add it, as a `<script type="application/ld+json">` block inside the page arch. Multiple JSON-LD blocks of different types on one page are valid.

Pick the `@type` by page role:

- **Glossary definition page** to `DefinedTerm`:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "DefinedTerm",
  "name": "Bring your own domain",
  "description": "A short one-sentence definition that matches the on-page H1 and BLUF.",
  "inDefinedTermSet": "https://customdomain.ai/glossary"
}
</script>
```

- **Any page with a VISIBLE FAQ** to `FAQPage`. Google requires the schema to match the on-page visible content, so ONLY add `FAQPage` when the page actually renders those questions and answers:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is multi-tenant TLS?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The exact answer text that appears on the page."
      }
    }
  ]
}
</script>
```

- **How-to guide** to `TechArticle`:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": "How to add custom domains to your SaaS",
  "description": "One-sentence summary matching the BLUF.",
  "author": { "@type": "Organization", "name": "Custom Domain" }
}
</script>
```

- **Hub / index page** to `CollectionPage` + `ItemList` (the `ItemList` enumerates the cluster URLs):
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Glossary",
  "mainEntity": {
    "@type": "ItemList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "url": "https://customdomain.ai/glossary/bring-your-own-domain" },
      { "@type": "ListItem", "position": 2, "url": "https://customdomain.ai/glossary/multi-tenant-tls" }
    ]
  }
}
</script>
```

Place the block INSIDE the page body arch (it works because it is valid HTML the layout renders). Do NOT put an Organization or WebSite `@type` in it. Validate each block is parseable JSON before publish (Pitfall 4).

---

## GEO content structure (what gets extracted and cited)

AI answer engines extract structure far more reliably than prose. Every page in the cluster follows the same shape:

1. **Answer-first BLUF.** The first paragraph directly answers the query in about 40 to 60 words, before any preamble. This is the single highest-leverage structural move; it is what an engine lifts as the answer.
2. **Exactly one H1.** One `<h1>` per page. Everything else is `<h2>`/`<h3>`.
3. **Question-shaped H2s** that mirror real searches ("What is on-demand TLS?", "How do I automate certificates for customer domains?"). These map to how people and engines phrase queries.
4. **Comparison / FAQ TABLES.** A build-vs-buy or feature table on the pillar; comparison tables are extracted far more often than the same facts written as prose. Put the decision-relevant contrast in a `<table>`.
5. **A short FAQ per page** with a matching `FAQPage` block (only when the FAQ is visible on the page).
6. **Brand-safe copy** to the per-tenant contract (see below).

### Per-tenant brand contract (state as an example, not universal law)

For the **customdomain** product specifically these are that tenant's brand rules, enforced on every page:
- **No competitor names** and no "X alternative" / "vs" framing (win via category framing and the agent angle instead).
- **No em dashes or en dashes** anywhere, literal or HTML entity. Use commas or periods.
- **No "free" in CTAs.** Filled CTAs point at the app (e.g. `https://app.customdomain.ai/signup` labeled "Get started", and `/docs`).
- **No fabricated API / endpoints / SDK** in guides. Product specifics defer to `app.customdomain.ai/docs`.

These are that tenant's contract, not a law of the platform. The generalizable move is: **capture the tenant's contract explicitly, then enforce it mechanically before publish.** Another tenant may allow "free" and dashes and comparison pages; read its contract first.

---

## Brand-safe authoring at scale (author then independently re-scan)

Do NOT trust a single author pass. Use a two-stage pipeline:

1. **Author, then adversarially verify** each page against the banned-terms / brand contract (a parallel Workflow: author, then adversarial verify).
2. **Independently re-scan every page before publish**, from the raw arch you are about to write, checking all of:
   - **decode** the arch and **validate it is well-formed XML** (parse it; a malformed arch fails to install or renders broken).
   - **validate each JSON-LD block is valid JSON** (extract every `<script type="application/ld+json">` body and `json.loads` it).
   - **regex-scan for banned terms**, **em/en dashes** (literal AND entity, the characters plus `—`/`–`), **disallowed CTAs** (e.g. the word "free" in a CTA), and **fabricated API** signatures.
   - **Only publish what passes all checks.**

```python
# Independent pre-publish gate (run per page arch string, publish only if it passes)
import re, json
from lxml import etree

def scan(arch: str, banned: list[str]) -> list[str]:
    problems = []
    # 1. well-formed XML (wrap so a bare-fragment arch still parses)
    try:
        etree.fromstring(f"<root>{arch}</root>")
    except etree.XMLSyntaxError as e:
        problems.append(f"malformed XML: {e}")
    # 2. every JSON-LD block must be valid JSON
    for m in re.finditer(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>', arch, re.S):
        try:
            json.loads(m.group(1).strip())
        except json.JSONDecodeError as e:
            problems.append(f"invalid JSON-LD: {e}")
    # 3. dashes (literal + entity), per the customdomain brand contract.
    #    – is the en dash, — is the em dash; matched via escapes so
    #    this scanner file itself contains no literal dash byte.
    if re.search(r'[–—]|—|–', arch):
        problems.append("en dash / em dash present")
    # 4. banned terms (competitor names, "free" in a CTA, etc.), tenant contract
    for term in banned:
        if re.search(rf'\b{re.escape(term)}\b', arch, re.I):
            problems.append(f"banned term: {term}")
    return problems
```

Exactly one H1 per page is also a cheap mechanical check worth adding to the gate (`arch.count('<h1')` should be 1).

---

## Publish mechanics (CMS records, no addon deploy)

Publish the pages as CMS records so there is no addon deploy and no collision with concurrent deploys churning the shared checkout. Do it through the tenant's `everjust_agent_mcp` website tools ([[everjust-website]], connect per [[everjust-agent-mcp]]):

- **Create the page:** `website_new_page` makes an unpublished `website.page` from a template.
- **Write the body:** `website_edit_page` (COW-safe) overwrites the FULL view arch with your pre-scanned QWeb. It writes an `ir.ui.view` fork with `website_id` set, so you do NOT hit the raw-`ir.ui.view`-write COW trap ([[everjust-website]] Pitfall 1). Its `arch` is the complete template, not a fragment.
- **Publish + index:** set `website_published` and `website_indexed` on the `website.page` via a generic `update` ([[everjust-agent-mcp]]).

Match the site's conventions or the page will not render or will not be styled:
- **Compiled-CSS subset.** Only Tailwind classes ALREADY used on the site render (the addon ships a compiled `connectdomain.css`, not JIT). Reuse the existing class vocabulary; a class the compiled CSS does not define renders unstyled ([[everjust-website-snippets]]).
- **Layout wrapper.** Wrap the page body in the site's `<t t-call="website.layout">` and the `cd-root` wrapper pattern the other pages use, so it inherits the header/footer chrome and typography.
- The auto Organization/WebSite JSON-LD is injected by the layout, so you get it for free; you only add the per-page content `@type` block (above).

```jsonc
// tool: website_new_page  -> unpublished page from a template
{ "name": "Bring your own domain", "template": "website.default_page", "add_menu": false, "published": false }

// tool: website_edit_page  -> COW-safe, arch is the COMPLETE QWeb template
{ "url": "/glossary/bring-your-own-domain",
  "arch": "<t t-call=\"website.layout\">...cd-root body + per-page JSON-LD...</t>" }

// tool: update  -> publish + join the sitemap (see [[everjust-website-seo]] for the meta layer)
{ "model": "website.page", "ids": [<page_id>],
  "values": { "website_published": true, "website_indexed": true } }
```

For a large bulk cluster where the MCP page-at-a-time loop is too slow, an admin can create the `ir.ui.view` + `website.page` rows directly in an odoo shell on the tenant, but you MUST set `website_id` on the view from the start (a COW fork, not a shared module view) or the next module upgrade wipes it, and you MUST suppress notifications with `with_context(tracking_disable=True, mail_create_nosubscribe=True)`. Prefer the COW-safe `website_edit_page` route unless bulk volume forces the shell.

---

## Sitemap freshness (why a new page is invisible until you clear the cache)

This is the gotcha that makes or breaks auto-discoverability. **Odoo caches `/sitemap.xml` as an `ir.attachment`** (its `name` or `url` matches `sitemap`, roughly a 12h TTL). A newly created `website.page` does **NOT appear in the sitemap until that cache clears**, so **neither Google nor an IndexNow sweep sees it** even though the page is live. Publishing the cluster is not enough; you must invalidate the cache.

**One-shot clear (do this immediately after publishing a cluster)** via the generic `search`/`call` tools ([[everjust-agent-mcp]]), matching the cached attachment by BOTH name and url so a wrong-field cache still gets cleared:
```jsonc
// find the cached sitemap attachment(s)
{ "model": "ir.attachment",
  "domain": ["|", ["name", "ilike", "sitemap"], ["url", "ilike", "sitemap"]],
  "fields": ["id", "name", "url"] }

// delete them (confirm:true is required for a non-read call / delete)
{ "model": "ir.attachment", "ids": [<ids>], "confirm": true }
// then re-fetch the sitemap over HTTP to force regeneration
```
```bash
# confirm the NEW URLs are present with the correct delimiters (match the full <loc>URL</loc>)
curl -s https://customdomain.ai/sitemap.xml | grep -F '<loc>https://customdomain.ai/glossary/bring-your-own-domain</loc>'
```
Grep the **full `<loc>...</loc>`** line, not a bare path substring, so a partial or wrong-host match cannot give a false positive.

**Keep it fresh automatically** with an `ir.cron` (`state=code`, every ~4h) that unlinks the cached sitemap attachment so it regenerates and reflects new pages within the interval. On this tenant that cron is named **"customdomain.ai: clear sitemap cache (SEO freshness)"**, with this code body (note the `sudo()` and the name-OR-url match, so it clears the attachment however it is keyed):
```python
recs = env['ir.attachment'].sudo().search(['|', ('name', 'ilike', 'sitemap'), ('url', 'ilike', 'sitemap')])
recs and recs.unlink()
```

### Honest engine reality (defer depth to [[everjust-website-seo]])

- **IndexNow feeds Bing/Yandex, and therefore ChatGPT Search, NOT Google.** After the sitemap is fresh, submit the new URLs via IndexNow ([[everjust-website-seo]]).
- **Google has no legitimate auto-submit for a marketing site.** The sitemap-ping endpoint was removed in 2023 (returns 404). The Indexing API is JobPosting/BroadcastEvent-only; off-label use risks the property. Google discovers new content by **re-crawling the sitemap it already knows**, which is exactly why the freshness cron above matters: it keeps the sitemap current so Google's next crawl picks up the cluster. The one remaining Google step (verify the property + submit the sitemap once in Search Console) is owner-only and one-time.

---

## Pitfalls

1. **Do NOT hand-author an Organization or WebSite JSON-LD block.** The `everjust_visibility` addon already injects those on every page from the `website` record ([[everjust-website-seo]] Pitfall 6). A second Organization/WebSite block is a duplicate/competing block. Your per-page block must be a DIFFERENT `@type` (`DefinedTerm`, `FAQPage`, `TechArticle`, `CollectionPage`+`ItemList`), additive, one page, content-specific.

2. **`FAQPage` schema must match VISIBLE on-page content.** Google requires the questions and answers in the schema to actually render on the page. Do NOT bolt a `FAQPage` block onto a page with no visible FAQ (to add FAQ schema to an existing page like `/pricing` or a `/for/*` page, first add a real, visible FAQ section, then the matching schema). Mismatched FAQ schema risks the whole page's rich-result eligibility.

3. **BLUF or bust.** If the first paragraph does not directly answer the query in ~40 to 60 words, the page loses its best shot at being the lifted answer. Do not open with a marketing preamble or a "in this guide we will..." throat-clear. Answer first, elaborate after.

4. **Re-scan independently; do not trust the author pass.** The author-then-adversarial-verify Workflow is stage one, not the gate. Before publish, from the raw arch you are about to write: parse it as XML (well-formed), `json.loads` every JSON-LD block, and regex-scan for banned terms, dashes (literal AND `—`/`–` entities), disallowed CTAs, and fabricated API. Publish only what passes ALL checks. A single trusted pass ships escaped-JSON blocks and stray dashes.

5. **Only compiled Tailwind classes render.** The site ships a compiled `connectdomain.css`, not JIT Tailwind. A class you invent (or copy from generic Tailwind docs) that is not already used on the site renders **unstyled**. Reuse the existing `cd-*` / `text-stone-*` / `max-w-*` vocabulary ([[everjust-website-snippets]]); pin the same fonts (display serif headings, body sans, mono for code/records).

6. **Publish as CMS records; do not commit cluster content to the addon.** These pages are CMS content. Create them with `website_new_page` + `website_edit_page` so they live as a `website.page` + COW `ir.ui.view` in the DB. Do NOT add them to `website_connectdomain` in git, that triggers the shared deploy pipeline and collides with concurrent branch-switching sessions, and rsync `--delete` deploys never touch the DB, so DB pages survive every deploy anyway.

7. **A new page is invisible until the sitemap cache clears.** Creating the `website.page` does not put it in `/sitemap.xml`; Odoo serves a cached `ir.attachment` (name or url matches `sitemap`, ~12h TTL). Google and any IndexNow sweep read the cached sitemap, so they never see the new URL. After publishing a cluster, delete the sitemap attachment(s) and re-fetch, then grep the full `<loc>...</loc>` to confirm. Keep it fresh with the ~4h `ir.cron` ("customdomain.ai: clear sitemap cache (SEO freshness)").

8. **The footer that renders is the website_id=1 COW fork, not the generic view.** `cd_footer` exists twice: generic `website_connectdomain.cd_footer` (view 3753, `website_id=False`) and a COW fork (view **4091**, `website_id=1`) that overrides it. To add the site-wide "Resources" hub link (pillar + Glossary), edit **4091**; editing 3753 does nothing visible. The same COW-override pattern likely applies to the header and other layout snippets: always check for a `website_id=1` fork of the key before editing the generic view ([[everjust-website]] on COW).

9. **A generic-view arch write without the website in context edits the SHIPPED module view.** If you bypass `website_edit_page` and raw-write an `ir.ui.view` `arch` without `website_id` in context (e.g. to inject the pillar's hub block into view 4112 or the footer fork 4091), you edit the module view with no COW fork, and the next module upgrade wipes your change. Go through `website_edit_page` (it forks correctly) ([[everjust-website]] Pitfall 1). Inject the pillar hub block **idempotently** (check for `id="cd-pillar-glossary"` before appending) so a re-run does not duplicate it.

10. **Enforce the TENANT's brand contract, not a generic one.** "No em/en dashes, no competitor names, no 'free' in CTAs, no fabricated API" are the customdomain contract. Do not assume they apply to every tenant, and do not skip them on customdomain. Read the tenant's contract first, encode it as the scan's banned list, and gate on it. The competitor-free choice is a positioning decision (win via category framing + the agent angle), not a technical limit.

11. **This skill sets the page's ADDED schema; [[everjust-website-seo]] owns everything else crawler-facing.** Do not set `website_meta_*`, `seo_name`, `robots_txt`, or the IndexNow key here, that is [[everjust-website-seo]]. This skill decides WHAT content and WHICH extra JSON-LD `@type`; the metadata/indexing/submission layer is a separate skill. Set `website_indexed:true` when publishing the page (so it joins the sitemap), but route the meta title/description/OG and IndexNow submit through [[everjust-website-seo]].

## See also

- [[everjust-website-seo]]. The metadata / indexing layer: per-page meta, sitemap membership, robots, the auto Organization/WebSite JSON-LD, IndexNow. This skill is its content-creation counterpart; do not duplicate its surfaces.
- [[everjust-website]]. Raw page arch editing, `website_new_page` / `website_edit_page` (COW-safe, the publish route for these pages), nav menus, redirects.
- [[everjust-website-snippets]]. The on-brand `s_cd_*` snippet vocabulary and the compiled Tailwind class set to reuse so pages render styled.
- [[everjust-agent-mcp]]. Connect to the tenant; the generic `search`/`get`/`create`/`update`/`call` surface and the `confirm:true` gate used to publish, clear the sitemap cache, and manage the cron.
- [[everjust-platform]]. COW, the `/odoo` debrand, the `everjust.public_website` gate, structural-model confirm gates, never self-escalate.
- [[everjust-odoo-shell-ops]]. The shell/box path for bulk DB publishing, the sitemap-cache-clear, and creating the freshness ir.cron when the MCP is not the right tool.
- [[generative-engine-optimization]] — the generic, cross-engine GEO STRATEGY (answer-first structure, myth-busting ground truth, the workflow) independent of any stack. THIS skill is the everjust-Odoo IMPLEMENTATION of it: per-page schema in the QWeb arch, DB-only publish, the sitemap-cache freshness cron. Read that for the why, this for the how on Odoo.
