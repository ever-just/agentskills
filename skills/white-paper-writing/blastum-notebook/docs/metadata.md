# Metadata Format Specification

All metadata files use Markdown with YAML frontmatter.
This ensures Cursor's semantic indexing works on both the structured fields and prose content.

---

## Source metadata — `metadata/{slug}.meta.md`

One file per source. The slug matches the corresponding file in `documents/`.

```markdown
---
title: "Source Title"
type: web
source: documents/{slug}.md
url: https://example.com/page
acquired: YYYY-MM-DD
snapshot: true
topics:
  - main topic
  - subtopic
keywords:
  - keyword1
  - keyword2
sections:
  - ref: "page 3"
    topic: "Pricing and packages"
  - ref: "#comparison"
    topic: "Side-by-side option comparison"
---

## Why saved
One sentence on relevance to the topic.

## Summary
One paragraph overview of the document's content.

## Key facts
- Important extractable fact relevant to the research topic.
- Another fact.
```

**type values**: `pdf` | `web` | `markdown` | `text` | `link`

**snapshot**: `true` if a corresponding document file exists, `false` for link-only sources

**ref values**:
- PDFs: `"page N"` or `"page N–M"`
- Web: `"#anchor"` or `"Section Title"`
- Text: line range `"lines 10–50"`

---

## Document summary — `documents/{slug}-summary.md`

One per source document, produced at acquisition time. Used as the first-pass search target in research queries.

```markdown
# Summary: {Source Title}

Source: [{slug}](documents/{slug}.md)

## Key Facts
- Price, date, spec, limit, or rule extracted from the source

## Section Digest
### {Section heading}
2–4 sentence digest of section content.

## Tables & Structured Data
(Markdown tables preserved verbatim from source)
```

Target ~10–20% of raw document length. Preserve all numbers, dates, and proper nouns exactly.

---

## Topic index — `metadata/index.meta.md`

One per topic. Rebuilt from all `metadata/*.meta.md` files after each acquisition session.

```markdown
---
topic: {topic-slug}
title: "One-line description from creation prompt"
created: YYYY-MM-DD
document_count: 0
---

## Overview
What this topic covers and the research goal.

## Sources
| Slug | Title | Type | Key topics |
|------|-------|------|------------|
| {slug} | {Title} | web | topic1, topic2 |
```
