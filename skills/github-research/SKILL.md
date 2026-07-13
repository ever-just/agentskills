---
name: github-research
description: >-
  Search GitHub intelligently to find specs, reference implementations, library
  adopters, and config patterns. Use when research means locating code, repos,
  or examples on GitHub — pick the right surface (REST/web search vs GraphQL vs
  code search), the right qualifiers, and the right tool (gh CLI or mcp__github__*),
  then rank and verify results. Covers rate limits, the 1,000-result cap, and a
  goal->tool decision guide.
---

# GitHub research

A methodology for finding things on GitHub fast and rigorously, instead of
guessing repo names or scraping search-result pages. Built from the official
GitHub docs (links at the end).

## Mental model: discover wide, then drill in

1. **Discover** with REST/web search (`gh search ...` or `mcp__github__search_*`)
   — broad, ranked, filterable by stars/recency/language.
2. **Drill in** with GraphQL or direct file reads once you know `owner/repo` —
   exact, structured (read a file, list the tree, list releases).

## The three search surfaces (and when each applies)

| Surface | Use for | Hard limits |
|---|---|---|
| REST / web search (`gh search`, `mcp__github__search_*`) | repos, code, issues/PRs, commits, users, topics | **1,000 results max/query**, 100/page, query ≤256 chars, ≤5 boolean ops |
| GraphQL (`gh api graphql`) | precise nested fetches; file trees; batched lookups | 5,000 points/hr; ≤500k nodes/call; 10s timeout |
| Code search (regex-capable) | content/path/symbol search across indexed repos | **auth required**; indexed + default-branch only; ~5 matches/file shown |

## Repository search qualifiers

```
TOPIC in:name,description,readme stars:>200 pushed:>2025-01-01 archived:false
```

| Qualifier | Example | Note |
|---|---|---|
| `in:` | `seo in:name,description,readme,topics` | scope the text match |
| `org:` / `user:` / `repo:` | `org:fastapi sitemap` | owner scope (exact names only) |
| `language:` | `language:python` | |
| `topic:` / `topics:n` | `topic:seo`, `topics:>3` | tag / tag count |
| `stars:` / `forks:` | `stars:>500`, `stars:100..1000` | ranges: `>`,`<`,`>=`,`<=`,`a..b` |
| `pushed:` / `created:` | `pushed:>2025-01-01` | **maintenance / maturity signal** |
| `license:` | `license:apache-2.0` | |
| `is:` / `archived:` | `is:public archived:false` | state filters |

**Quality ranking recipe:** high `stars:` + recent `pushed:` + `archived:false`
+ permissive `license:` = maintained and trustworthy. Sort by stars; confirm with
`created:` (maturity).

## Code search qualifiers (whitespace = AND)

| Feature | Syntax | Example |
|---|---|---|
| Path glob | `path:` | `path:**/*.tf`, `path:robots.txt` |
| Extension | `path:*.ext` | `path:*.jsonld` |
| Content only | `content:` | `content:application/ld+json` |
| Symbol (definitions) | `symbol:` | `symbol:create_sitemap` |
| Regex | `/pattern/` | `/llms[-_]full\.txt/` |
| Exact phrase | `"..."` | `"type=\"application/ld+json\""` |
| Boolean/group | `AND OR NOT ( )` | `(language:python OR language:go) NOT path:test` |

Gotchas: code search **needs auth**; indexes **default branch only**, files
≤~350 KB; `symbol:` finds *definitions, not references*; no regex look-around;
`repo:`/`org:`/`user:` need full exact names.

## Issues / PRs / commits

`type:issue|pr` · `is:open|closed|merged|draft` · `author: assignee: involves:
reviewed-by:` · `label: in:title,body,comments` · `created: updated: merged:` ·
`comments:n reactions:n` · exclude with `-author:USER`. Commits: `gh search
commits "msg" --author-date:'>2025-01-01' repo:owner/name`.

## `gh` CLI recipes

```bash
# Ranked repos by topic + stars, JSON for parsing
gh search repos --topic=seo --stars='>500' --sort=stars --limit=20 \
  --json fullName,stargazersCount,pushedAt,description,url

# Code patterns across an org (auth required)
gh search code "application/ld+json" --owner=vercel --language=html --limit=20

# Drill in: read a file, list the whole tree, list releases
gh api repos/OWNER/REPO/contents/SPEC.md --jq .content | base64 -d
gh api repos/OWNER/REPO/git/trees/HEAD?recursive=1 --jq '.tree[].path'
gh release list --repo OWNER/REPO
gh repo view OWNER/REPO --json stargazerCount,pushedAt,licenseInfo,description

# GraphQL with a rate-limit budget
gh api graphql -f query='
{ search(query:"topic:seo stars:>500 sort:stars", type:REPOSITORY, first:20) {
    nodes { ... on Repository { nameWithOwner stargazerCount pushedAt url } } }
  rateLimit { cost remaining } }'
```

## In restricted sessions: the `mcp__github__*` mapping

When `gh` isn't available, **the qualifier strings are identical** — pass them in
the `query` arg. Load schemas first with
`ToolSearch "select:mcp__github__search_repositories,mcp__github__search_code,..."`.

| Goal | `gh` | MCP tool |
|---|---|---|
| Find repos | `gh search repos` | `mcp__github__search_repositories` |
| Find code | `gh search code` | `mcp__github__search_code` |
| Issues / PRs | `gh search issues/prs` | `mcp__github__search_issues` / `search_pull_requests` |
| Commits | `gh search commits` | `mcp__github__search_commits` |
| Read a file / tree | `gh api .../contents` | `mcp__github__get_file_contents` |
| Releases / tags | `gh release list` | `mcp__github__list_releases` / `list_tags` |

Same 1,000-result cap and "code search needs auth" caveats apply.

## Rate limits, auth, pagination

| API | Authenticated | Unauth |
|---|---|---|
| REST search (most) | 30 req/min | 10 req/min |
| REST **code** search | 9 req/min, auth mandatory | n/a |
| GraphQL | 5,000 points/hr | n/a |
| Core REST | 5,000 req/hr | 60 req/hr |

- **Always authenticate** (`gh auth login` / `GH_TOKEN`): higher limits, unlocks
  code search, more complete results.
- **1,000-result cap:** if you hit it, **partition** by `stars:`/`created:`/
  `language:` ranges and merge.
- `incomplete_results: true` (or a 403) = timed out / secondary limit → **back
  off and narrow**, don't retry identically. Add `rateLimit { cost remaining }`
  to GraphQL to budget.

## Decision guide (goal → first move → refine)

| Goal | First move | Refine |
|---|---|---|
| Find a spec / canonical repo | `search repos NAME in:name,readme sort:stars` | check `created:` + license; open README |
| Find example implementations | `search code "SYMBOL" language:X` (auth) | add `org:`/`stars`; open top files |
| Find who uses a library | code `content:"import LIB"` / `path:requirements.txt LIB` | cross-check `stars:>` for notable adopters |
| Find config patterns | `path:FILENAME PATTERN` (e.g. `path:Dockerfile`) | add `language:`/`org:` |
| Assess repo quality | `gh repo view --json stargazerCount,pushedAt,licenseInfo` | stars + recent push + not archived + license |
| Find the canonical fix | `search issues/prs "error" is:merged sort:reactions` | open the linked PR |

## Sources

- Code search syntax — docs.github.com/en/search-github/github-code-search/understanding-github-code-search-syntax
- Repository search — docs.github.com/en/search-github/searching-on-github/searching-for-repositories
- Issues/PRs search — docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests
- REST Search API (limits/cap/pagination) — docs.github.com/en/rest/search/search
- GraphQL resource limits — docs.github.com/en/graphql/overview/resource-limitations
- `gh search` manual — cli.github.com/manual/gh_search
