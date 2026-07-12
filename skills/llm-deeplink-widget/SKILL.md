---
name: llm-deeplink-widget
description: Build an "Ask AI about us" widget — a row of icon buttons that deep-link a visitor into their own LLM app (ChatGPT, Claude, Perplexity, Google AI Mode, Grok) with a prompt pre-filled about the product or page. Use this skill whenever the user wants "ask AI" / "open in ChatGPT" / "explain this with AI" buttons, LLM deep links, a way for visitors to learn about the product from their own AI assistant, or wants to add AI-assistant call-to-actions to a site footer, docs, or landing page. Includes the verified per-provider URL schemes and the critical rule that the injected prompt must be self-contained.
license: Complete terms in LICENSE.txt
---

# LLM Deep-Link Widget ("Ask AI about us")

A row of icons in a footer/docs/CTA that opens the visitor's LLM with a prompt about the product already typed in. Mechanically it is just `<a href>` links, like "Tweet this" buttons — the LLM does the rest. It is a legitimate, user-initiated pattern (the user clicks), not prompt injection.

## Verified deep-link URL schemes (2026)

Each provider takes the prompt in a query param, URL-encoded (`encodeURIComponent`). The reliable set:

| Provider | URL (prompt in `{Q}`) | Behavior |
|---|---|---|
| ChatGPT | `https://chatgpt.com/?q={Q}` | prefills, usually auto-runs on a direct click |
| Perplexity | `https://www.perplexity.ai/search?q={Q}` | auto-runs a search |
| Google AI Mode | `https://www.google.com/search?udm=50&q={Q}` | server-side AI answer on load |
| Claude | `https://claude.ai/new?q={Q}` | prefills a new chat |
| Grok | `https://grok.com/?q={Q}` | usually auto-submits |

**Skip these:** Gemini (`gemini.google.com` ignores `?q=` natively), Copilot (its `?q=` was removed/broken in 2026), and Meta AI / DeepSeek / Mistral (no verified scheme). These schemes are undocumented and community/security-researched, so re-verify occasionally; they can change.

In HTML/XML attributes, the encoded prompt is safe, but a literal `&` (e.g. Google's `&q=`) must be written `&amp;`.

## The critical rule: make the prompt SELF-CONTAINED

The biggest failure mode: you tell the prompt to "read https://yoursite.com/llms.txt first", the user clicks, and the LLM **searches instead of fetching** — and if the site is not indexed yet, or the URL contains a searchable term like "llms.txt" (which returns articles about the format), it finds nothing and says "I couldn't retrieve that."

So do NOT depend on the LLM fetching or finding an un-indexed page. **Bake a concise, accurate product summary directly into the prompt** so any LLM gives a good answer immediately, and add "for more, see yoursite.com" as a pointer, not a dependency.

**Good prompt shape:**
> "Explain [Product] (yoursite.com) in plain English. Grounding facts: [2-4 sentences of what it does, who it is for, key capabilities]. Tell me what it does, who it is for, and how it works. More at https://yoursite.com"

Keep it dash-free and on-brand if the project bans em/en dashes or competitor names.

## Icons

Use the official brand marks from **Simple Icons** (MIT-ish, monochrome single-path SVGs) served via jsdelivr, e.g. `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/{slug}.svg` (openai, claude, perplexity, googlegemini). Simple Icons has **dropped some AI logos** (openai, grok) at times — fall back to **lobehub** `@lobehub/icons-static-svg` for those (`grok.svg`). Render inline `<svg fill="currentColor" width="19">` so they inherit your text color, wrapped in `<a target="_blank" rel="noopener noreferrer" aria-label="Ask [Provider] about [Product]">`.

## Reference implementation
The closest open-source widget is **copy2llm** (github.com/vladzima/copy2llm, MIT) — its `links.ts` is the authoritative URL-scheme reference. It is React, so on a non-React/server-rendered site, hand-roll the ~15-line anchor row instead of bundling it.

## Minimal example (framework-agnostic)
```html
<div class="ask-ai">
  <span>Ask AI about us</span>
  <a href="https://chatgpt.com/?q=ENCODED_PROMPT" target="_blank" rel="noopener noreferrer"
     aria-label="Ask ChatGPT about Product" class="ask-ai__icon"><!-- inline SVG --></a>
  <!-- repeat for claude / perplexity / google (udm=50, &amp;q=) / grok -->
</div>
```

## Also worth knowing
The widget's success ultimately depends on the site being fetchable/indexed — so pair it with real crawlability + Bing indexing (see `generative-engine-optimization`). Until then, the self-contained prompt is what makes it work.
