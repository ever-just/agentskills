# Frontmatter

## Required Fields

```yaml
---
name: my-skill-name
description: What it does and when to use it.
---
```

### name
- Max 64 chars
- Lowercase letters, numbers, hyphens only
- No XML tags
- No reserved words: "anthropic", "claude"
- Prefer gerund: `processing-pdfs`, `analyzing-data`

### description
- Max 1024 chars
- Non-empty
- Third person ("Processes X" not "I process X")
- Include WHAT + WHEN

## Effective Descriptions

**Pattern**: `[What it does]. Use when [triggers].`

Good:
```yaml
description: Extract text from PDFs and fill forms. Use when working with PDF files or document extraction.
```

Bad:
```yaml
description: Helps with documents
```

## Discovery

Description enables skill selection from 100+ skills.
Be specific. Include key terms users will mention.
