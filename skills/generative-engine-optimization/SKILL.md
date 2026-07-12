---
name: generative-engine-optimization
description: Optimize a website so AI answer engines (ChatGPT, Perplexity, Google AI Overviews/AI Mode, Copilot) and AI agents cite it as THE answer for category and intent searches, not just its brand name. Use this skill whenever the user wants to "show up in ChatGPT / Perplexity / AI Overviews", "get cited by AI", "be found by AI from a specific search", improve AI or LLM discoverability, do GEO (generative engine optimization) or answer-engine optimization, or asks how to rank for what a product DOES (not just its name). Covers the evidence-based levers, keyword-for-intent research, answer-first plus schema content, crawlability and Bing, and the off-site sources AI actually cites. Complements classic SEO and llms.txt work rather than replacing them.
license: Complete terms in LICENSE.txt
---

# Generative Engine Optimization (GEO)

Getting **cited by AI answer engines** is a different game from ranking on Google. This skill is the playbook for making a site the source an LLM quotes when a user (or their agent) asks a category question like "what are custom domains for SaaS" or "best tool for X", not just when they search the brand name.

The core reframe to give the user: **branded discovery ("find MyProduct") is easy; intent discovery ("find a solution to my problem") is the valuable, hard part**, and it now spans three surfaces at once — classic search results, AI answers (ChatGPT/Perplexity/AI Overviews), and AI agents shopping for a tool.

## Ground truth (cite these; they kill common myths)

Lead with evidence, because most GEO advice online is hype. The load-bearing facts (verify with a quick web search if challenged, they shift):

- **Crawlability is lever #1.** If robots.txt blocks AI bots or the site is client-rendered with no HTML, nothing else matters. On-demand fetchers (ChatGPT-User, Claude-User, Perplexity-User) obey robots.txt.
- **Bing indexing gates ChatGPT.** ChatGPT search runs on Bing; studies show ~87% of its citations match Bing's top organic results. Google rank does NOT drive ChatGPT citations. So verify + submit the sitemap in **Bing Webmaster Tools**, not just Google Search Console.
- **`llms.txt` is largely decoration for AI *chat*.** Server-log studies (Ahrefs, OtterlyAI) show ~97% of llms.txt files get zero requests, and Google says it does not use it. Its one real consumer is **coding agents** (Claude Code, Cursor). Publish it for docs/agents, not to get cited in chat. Do not oversell it to the user.
- **Structured content gets extracted disproportionately.** AI pulls **comparison/HTML tables ~81% vs ~23% for prose**, and **FAQ-schema pages earn roughly 3x more citations**. First ~30% of a page is where most citations come from — so answer first.
- **Reddit is the #1 cited source across major engines** (~40% frequency), and **G2/Capterra** are top-cited for B2B. Off-site presence matters as much as on-site.
- **There is no magic force-index button.** Google's Indexing API is officially JobPosting/BroadcastEvent-only; off-label use risks revocation. Sitemap "ping" was removed in 2023. Do not chase these.

## The workflow

### 1. Map the demand (keyword-for-intent research)
Do not start from the brand. Enumerate the queries buyers and their agents actually type, by awareness stage:
- **Problem-aware:** "how do I let users use their own domain", "SSL cert stuck pending".
- **Solution-aware:** "custom domains as a service", "managed X for SaaS".
- **Vendor-aware:** "X alternative", "best X tools 2026" (respect any no-competitor-names brand rule; you can still win the category term without naming rivals).
- **Dev/agent:** "API to do X", "MCP server for X".

Research the real phrasings with web search: Google autocomplete, "People Also Ask", related searches, and community threads (Reddit, Hacker News, Indie Hackers, Stack Overflow). Note who currently **ranks** and who **AI cites** for the top queries — that is who you displace or get named alongside. Fan this out across a few subagents if available.

### 2. Build answer-first content that AI can lift
The cornerstone is a **pillar page** for the head category term, plus supporting clusters. Structure every page so an LLM can extract a clean answer:
- Open with a **40-60 word direct answer** (BLUF) before anything else.
- Use **question-shaped H2s** that mirror the target queries, each opening with a 1-2 sentence answer, then detail.
- Include at least one **HTML `<table>`** (build-vs-buy, feature/price, decision matrix).
- Add stats + dates + a cited source where relevant.
- End plainly; no keyword stuffing (Google explicitly names AI-specific rewriting and tiny-chunk fragmentation as ineffective).

Content assets that rank and get cited, in priority order: pillar guide, glossary/definitions (own the category vocabulary), per-use-case pages, dev how-to guides, and (if the brand allows) comparison/alternatives pages with tables.

### 3. Add schema.org (machine-readable = citable)
Put a JSON-LD `@graph` in the page. The high-value types:
- **FAQPage** (mirror the on-page Q&A, 8-12 real buyer questions) — the ~3x citation lever.
- **SoftwareApplication** (applicationCategory, operatingSystem, description, provider, featureList; add `offers`/`PriceSpecification` only if you have real prices — do not invent them).
- **Organization** (with `sameAs` to LinkedIn/Crunchbase/GitHub) and **WebSite** (SearchAction).
- **Article/BlogPosting** with author + dateModified on posts.

### 4. Guarantee crawlability + submit
- robots.txt: no `Disallow: /`, and a `Sitemap:` directive with the canonical host. For max reach, give AI bots explicit Allow groups (ChatGPT-User, Claude-User, Perplexity-User, OAI-SearchBot, PerplexityBot, GPTBot, ClaudeBot, Googlebot, Bingbot) plus a Cloudflare-style `Content-Signal: search=yes, ai-input=yes, ai-train=yes` line.
- Sitemap: canonical, same-host, indexable URLs only; accurate `<lastmod>`.
- **Owner-only console steps** (say clearly these need the user's login): submit the sitemap in Google Search Console AND Bing Webmaster Tools; URL-Inspection "Request Indexing" for the homepage + top ~10 pages.

### 5. Earn off-site citations
Because Reddit + review sites dominate AI citations: seed genuine, non-spammy answers on the Reddit/Indie Hackers/DEV threads AI already cites for the category; get listed on G2/Capterra in the right category; and get included in the "best X" roundup listicles that rank. This is slower but often the highest-ceiling lever.

### 6. Measure
Track rankings + which URLs get cited: Bing Webmaster's AI Performance report (Copilot citations), and prompt ChatGPT/Perplexity with the buyer queries and log which domains they cite. Iterate on the gaps.

## Common pitfalls
- Optimizing only for Google while ignoring Bing (which gates ChatGPT).
- Over-investing in llms.txt expecting chat-citation lift.
- Prose-only pages with no tables/FAQ schema (poor extraction).
- Client-side-rendered pages AI can't read (verify with `view-source`, not devtools).
- Treating "OKF" (Google Open Knowledge Format) as an SEO tool — it is an internal-agent knowledge spec, unrelated to indexing.

## Related skills
For a full crawlability/indexing setup behind a reverse proxy, see `reverse-proxy-cms-indexing`. For making an MCP server findable by agents, see `mcp-server-discoverability`. For an "Ask AI about us" on-site CTA, see `llm-deeplink-widget`.
