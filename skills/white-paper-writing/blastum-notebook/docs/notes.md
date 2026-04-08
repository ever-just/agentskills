# Notes Workflow

Store plans, options, learned facts, and decision preferences.

## Triggers

| User says | Action |
|-----------|--------|
| "Remember this as option 1" | Create `notes/option-1.md` |
| "Create a plan" | Create `notes/plan.md` |
| "Save this as {name}" | Create `notes/{slugified-name}.md` |
| "Write a how to" / "tell me how to" / "explain" / mechanism/how-it-works questions (while working in a notebook) | If the answer is substantial, create `notes/{slugified-topic}.md` with a lightweight how-to/mechanism template |
| "Add to session notes" | Append to `notes/session-notes.md` |
| "Track what we learned" / research answers with durable facts | Append to `notes/learned-facts.md` |
| "I prefer..." / "decide..." / "constraint..." | Append to `notes/decisions-preferences.md` |
| "Table of contents" / "list sources" / "summary of documents" / "what sources do you have" | Create/overwrite `notes/table-of-contents.md` |

### Table of Contents note

When asked for a table of contents, source list, or document summary, generate `notes/table-of-contents.md` from `metadata/index.meta.md` and all `metadata/*.meta.md` files. Use this format:

```markdown
# Sources — {Topic Title}

> {title from index.meta.md frontmatter, or Overview if missing}

## {Category 1}

| # | Source | Type | Description |
|---|--------|------|-------------|
| 1 | [Title](../documents/{slug}.md) | `web` / `pdf` / `txt` | Key topics and what this source covers |

## {Category 2}
...

---
*{N} sources · Last updated {date}*
```

**Categorize sources** by natural grouping (e.g., Official / Third-Party / Weather / Logistics). Use judgment based on topics and URL domains. Link each source title to its document file. Render type as inline code. Keep descriptions concise (one line).

## Auto-note substantial how-to/mechanism answers

When operating in a resolved notebook and the user asks for a how-to/process/mechanism explanation (for example: "write a how to", "tell me how to", "explain", or "how does this work"), store substantial answers as notes.

- Soft rule: write a note when the response is substantial (roughly 3+ paragraphs or equivalent depth), skip trivial answers.
- Destination: always write under `<resolved-base>/notes/`.
- Suggested filename: `notes/{slugified-topic}.md`.
- Suggested template:

```markdown
# {How-to or Mechanism Title}
Date: YYYY-MM-DD

## Context
What this explains and when to use it.

## Steps / Mechanism
1. ...
2. ...

## Key considerations
- ...

## Sources (optional)
- ...
```

## Steps

1. Determine note target from instruction
2. For append-only files (`learned-facts.md`, `decisions-preferences.md`), always append
3. For named notes, check if file exists; confirm overwrite or append
4. Write structured content
5. **MANDATORY:** At the end of every response that writes or modifies any `notes/` file, list all changed notes files as links grouped by folder. If the `file-change-tracker` skill is available, use it. Otherwise use this format:

   Use the actual resolved path (workspace or global) in the link list. Include only files actually written or appended in that response.

## Note structure

Structure based on content type:

**Option / alternative:**
```markdown
# Option 1: {short title}
Date: YYYY-MM-DD

## Summary
What this option entails.

## Pros
- 

## Cons
- 

## Details
...
```

**Plan:**
```markdown
# Plan: {short title}
Date: YYYY-MM-DD

## Goal

## Steps
1. 
2. 

## Notes
```

**Free-form / session notes:**
```markdown
# Session Notes — YYYY-MM-DD

## Decisions

## Open questions

## Next steps
```

**Learned facts log (append-only):**
```markdown
# Learned Facts

## YYYY-MM-DD
- Fact statement. Source: [Title]({resolved-base}/documents/{slug}.md) — {ref}
```

**Decisions and preferences log (append-only):**
```markdown
# Decisions and Preferences

## YYYY-MM-DD
- Preference: Prefer vendor A's API over vendor B's due to rate limits.
- Decision: Scope MVP to three features only.
- Constraint: Must support offline mode.
```

## Slugification rule

`"Option 1"` → `option-1`; `"My project plan"` → `my-project-plan`
Lowercase, hyphens, no special characters.
