# Research Workflow

Answer questions using collected sources.

## Steps

### 1. Search metadata first (fast pass)

Search only metadata and summary files. Use the **resolved topic base** (workspace or global) for this session:

```
codebase_search("{user question}", target_directories=["{resolved-base}/metadata/"])
```

Also search summaries:

```
codebase_search("{user question}", target_directories=["{resolved-base}/documents/"])
```

— filter results to `*-summary.md` and `*.meta.md` files first. These are small (20–150 lines each) and contain key facts, section digests, and structured data.

If the metadata/summary results answer the question, skip to step 4.

### 2. Escalate to full documents

Only if metadata-level answers are insufficient:

```
codebase_search("{user question}", target_directories=["{resolved-base}/"])
```

Use `Read` with `offset` and `limit` against the returned file at the indicated line range. Do not read entire raw documents.

### 3. Get citation info

Look up `metadata/{slug}.meta.md` for the source's title, URL, and page ref.

### 4. Synthesize answer

Compose answer with inline citations:

> "According to [Title](documents/{slug}.md), pricing starts at $3,000 per person (page 5)."

Use the `ref` field from the metadata `sections` list as the citation location.

### 5. If sources are insufficient

Acquire additional sources before answering from new web content:

1. Add each new source via Acquire workflow (`documents/` + `metadata/` + topic index update)
2. Re-run research against notebook files
3. Answer with citations only from saved notebook sources

### 6. Persist relevant findings

After answering, append key durable facts to `notes/learned-facts.md`.
At end of response, include links footer for any notes touched (see index.md end-of-response rule).

- One bullet per fact
- Include date, short fact, and source citation
- Keep factual (no preferences here)

**What qualifies as a durable fact** — anything a researcher would want to recall without re-reading the source:
- Specifications, capacities, limits, version numbers
- Pricing, cost anchors, licensing terms
- Rules, policies, deadlines, compliance requirements
- Structural comparisons: e.g. "option A supports X; option B does not"
- Inclusion/exclusion details (what is/isn't covered, supported, or required)
- Availability windows, timelines, dependencies
- Constraints (technical, legal, logistical, budgetary)
- Any quantitative finding that informs a decision

**When in doubt, include it.** It is better to over-log than to omit something the user will ask about again.

**Always save after external web fetches.** When answering from freshly fetched web content (not from existing notebook documents), always persist the key facts — do not wait for the user to ask. Policy schedules, pricing, deadlines, and structured data are especially high-value and must always be logged.

Format:

```markdown
## YYYY-MM-DD
- Fact statement. Source: [Title]({resolved-base}/documents/{slug}.md) — {ref}
```

If user states a preference or choice in the same conversation, also append it to
`notes/decisions-preferences.md` (see notes workflow).

## Citation format

```
[Source Title]({resolved-base}/documents/{slug}.md) — {ref}
```

For link-only sources:
```
[Source Title]({url}) — {ref or section anchor}
```
