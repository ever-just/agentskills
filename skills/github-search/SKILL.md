---
name: github-search
description: Search GitHub effectively — repositories, code, and topics — using the official GitHub docs' search syntax. Use when hunting for a repo/framework/library that does X, locating code patterns across public GitHub, or building a discovery query matrix for research. Covers repository search qualifiers, the code-search syntax (boolean/regex/path/symbol), the REST search API with rate limits, and a repeatable find-a-framework playbook. Grounded in docs.github.com (fetched 2026-07); re-fetch the linked docs pages if a qualifier seems to misbehave.
---

# GitHub Search

## Overview

GitHub is the largest index of working software, but naive keyword queries surface
SEO'd awesome-lists and abandoned forks. This skill encodes the official search
syntax from the GitHub docs plus a discovery playbook, so an agent can go from
"is there a framework that does X?" to a verified shortlist in a few queries.

Three search surfaces, pick by task:

| Surface | Use for | How |
|---|---|---|
| Web search UI (`github.com/search`) | Repo discovery, topic browsing | WebFetch/WebSearch on `github.com/search?q=...&type=repositories` |
| REST API (`api.github.com/search/*`) | Scripted/sorted/paginated discovery | `curl` (token optional but raises limits) |
| `gh` CLI | Same as REST, ergonomic | `gh search repos`, `gh search code` |

> **Remote-session caveat:** in Claude Code on the web, GitHub MCP tools
> (`mcp__github__search_*`) are often **scoped to the session's repos only** — do
> not use them to search public GitHub there. Use WebSearch/WebFetch or
> unauthenticated `curl` to `api.github.com` instead.

Source docs (re-fetch these if syntax seems off):
- Repos: <https://docs.github.com/en/search-github/searching-on-github/searching-for-repositories>
- Code: <https://docs.github.com/en/search-github/github-code-search/understanding-github-code-search-syntax>
- REST: <https://docs.github.com/en/rest/search/search>
- Topics: <https://docs.github.com/en/search-github/searching-on-github/searching-topics>

---

## Repository search qualifiers

Combine free keywords with qualifiers; whitespace = AND.

| Goal | Qualifier | Example |
|---|---|---|
| Match in name/description/readme | `in:name`, `in:description`, `in:readme`, `in:topics` | `"design doc" in:name,description` |
| By topic label | `topic:TOPIC` | `topic:ml-system-design` |
| Popularity floor | `stars:>n`, `stars:n..n` | `stars:>500` |
| Recently maintained | `pushed:>YYYY-MM-DD` | `pushed:>2025-06-01` |
| Created window | `created:<YYYY-MM-DD` | `created:>2024-01-01` |
| Language / license | `language:LANG`, `license:KEY` | `language:python license:mit` |
| Owner scope | `user:U`, `org:O`, `repo:O/R` | `org:stanford-cs329s` |
| Forks / archived / template | `fork:true`, `archived:false`, `template:true` | `archived:false` |
| Size (KB) | `size:>n` | `size:>1000` |

Sorting: on the REST API / `gh`, use the separate `sort` (`stars`, `forks`,
`updated`) and `order` params — do **not** put `sort:` inside the query string.

## Code search syntax (github.com/search?type=code)

- **Exact match:** quote it — `"sparse index"`; escape inner quotes `\"`.
- **Boolean:** `AND`, `OR`, `NOT` (adjacent terms default to AND) —
  `"fatal error" NOT path:__testing__`; parentheses for grouping.
- **Regex:** slashes — `/sparse.*index/`, `/^App\/src\//`. No look-around.
  Case-insensitive by default; force case with `/(?-i)True/`.
- **Qualifiers:** `repo:owner/name`, `org:`, `user:`, `language:`,
  `path:` (globs: `path:/src/**/*.js`), `symbol:FunctionName` (definitions),
  `content:` (contents only, not filenames), `is:archived|fork|generated`.
- Code search on the **API** requires authentication and at least one plain
  search term.

## REST API essentials

```bash
# Repositories (works unauthenticated at low volume)
curl -s "https://api.github.com/search/repositories?q=topic:ml-system-design+stars:>100&sort=stars&order=desc&per_page=10" \
  | jq -r '.items[] | "\(.stargazers_count)\t\(.full_name)\t\(.description)"'

# Topics
curl -s "https://api.github.com/search/topics?q=ml-system-design" | jq '.items[].name'

# Authenticated (higher limits + code search)
curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
  "https://api.github.com/search/code?q=%22design_doc_checklist%22+language:markdown"
```

Endpoints: `/search/repositories`, `/search/code`, `/search/topics`,
`/search/issues`, `/search/commits`, `/search/users` — all take `q`, `sort`,
`order`, `per_page` (max 100), `page`.

**Limits (from the docs — respect them):**
- Authenticated: 30 req/min; **code search: 9 req/min**; unauthenticated: 10 req/min total.
- Query: max 256 chars, max five `AND/OR/NOT` operators; URL-encode `q` (`>` → `%3E`, quotes → `%22`, space → `+`).
- Max **1,000 results** per query — narrow with qualifiers rather than paginating past it.
- Timeouts return `"incomplete_results": true` — treat as partial, re-run narrower.

---

## Playbook: "find a repo/framework that does X"

1. **Name the concept 3 ways.** The canonical term, the practitioner term, the
   topic-slug guess (e.g. "ML system design doc" / "design doc template" /
   `ml-system-design`).
2. **Topic first:** `topic:<slug>` — topics are human-curated, low-noise. Check
   the topic page (`github.com/topics/<slug>`) for sibling topics.
3. **Then readme/description:** `"exact phrase" in:name,description,readme stars:>50 archived:false`.
   Quoted phrases beat keyword soup.
4. **Then code search for distinctive strings** a matching project would contain
   (a config key, a template heading, an import) — finds repos whose README
   doesn't use your vocabulary.
5. **Harvest awesome-lists** from steps 2–3 hits: `awesome <concept> in:name` —
   mine them for candidates, but never cite a list as the answer itself.
6. **Cross-check with general web search** (blog posts, "top N repos" articles)
   — catches repos GitHub search ranks poorly.
7. **Verify every candidate** before recommending: fetch the repo page/README;
   record purpose, license, stars, last push (`pushed:` or the page header),
   and whether it *actually does X* vs. documents X. Classify: does-the-thing /
   template-for-the-thing / knowledge-about-the-thing / adjacent.
8. **Record the query matrix** (angle → query → best hit) in your research notes
   so the search is reproducible.

## Pitfalls

- `sort:stars` inside the query string silently does nothing on the API — use the `sort` param.
- Repo search only sees the *default branch* README/description; code search only indexes default branches too.
- `in:readme` matches forks' inherited READMEs — add `fork:false` (default) or check the fork badge.
- Stars measure marketing as much as quality — always pair `stars:` with `pushed:` recency.
- Unauthenticated code-search API calls fail — fall back to the web UI via WebFetch.
