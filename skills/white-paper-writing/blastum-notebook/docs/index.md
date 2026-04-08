# Notebook Workflows

## Capabilities

- **Acquire**: Collect documents and web links, extract and snapshot content, produce per-document summaries. Delegates to subagents for parallel acquisition when >2 sources.
- **Query**: Answer questions across sources with citations. Two-tier search: metadata/summaries first, raw documents only when needed.
- **Notes**: Store plans, options, learned facts, and decision preferences.
- **Progressive memory**: Persist findings from Q&A sessions for later reuse.

## Notebook structure

Same layout under either root:

```
{base}/
└── {topic-slug}/
    ├── documents/    ← PDFs, web snapshots, plain text, *-summary.md digests
    ├── metadata/     ← Cursor-indexed metadata per source + topic index
    └── notes/        ← User plans, options, session notes
```

## Notebook roots

- **Workspace (default):** `notebook/` at workspace root. Project-specific; often gitignored; lost on branch switch or clone.
- **Global:** Persists across projects and branches. Base path = `$NOTEBOOK_HOME` if set, else `~/.cursor/notebooks/`.

**Resolving a topic:** Check workspace `notebook/{topic-slug}/` first; if missing, check global base `{NOTEBOOK_HOME or ~/.cursor/notebooks}/{topic-slug}/`. Use the first that exists as the **resolved base** for that session.

**Creating a notebook:** Default = workspace. Use **global** when the user says "global", "personal", "across projects", "not project-specific", or "in my home notebooks". Then create under global base only.

**Library (checkout/check-in):** Global notebooks can be "checked out" into the workspace (copy global → `notebook/{topic}/`) so they are indexed and editable; then "checked in" (copy workspace → global and remove local copy). A notebook can be checked out in multiple workspaces at once; it remains on the checked-out list for a location until check-in (local copy removed) there. Use the script so the agent doesn't have to remember paths:

```bash
# From workspace root
bash ~/.cursor/skills/notebook/scripts/notebook-library.sh checkout <topic-slug>
bash ~/.cursor/skills/notebook/scripts/notebook-library.sh checkin <topic-slug>
bash ~/.cursor/skills/notebook/scripts/notebook-library.sh sync <topic-slug>   # update library, keep local
bash ~/.cursor/skills/notebook/scripts/notebook-library.sh where <topic-slug> # list checkout locations
bash ~/.cursor/skills/notebook/scripts/notebook-library.sh list               # catalog of library (slug — title)
bash ~/.cursor/skills/notebook/scripts/notebook-library.sh catalog            # alias for list
```

**Notebook title:** Each notebook has a one-line **title** in `metadata/index.meta.md` frontmatter (from the creation prompt). The list/catalog command shows it after the slug. For existing notebooks without a title, run once: `bash ~/.cursor/skills/notebook/scripts/backfill-titles.sh` (uses Overview or slug-to-phrase).

User says "check out the foo-bar notebook" → run checkout; "check in the foo-bar notebook" → run checkin; "sync foo-bar to the library" / "check in but keep local" → run sync.

## Trigger → workflow

| User says | Workflow |
|-----------|---------|
| Research topic / start a notebook | [acquire.md](acquire.md) |
| "Check out the X notebook" / "check out X" | Run `notebook-library.sh checkout X` from workspace root; then topic is in workspace |
| "Check in the X notebook" / "check in X" | Run `notebook-library.sh checkin X` from workspace root |
| "Sync X to library" / "check in X but keep local" | Run `notebook-library.sh sync X` from workspace root |
| "Where is X checked out?" / "where is X" | Run `notebook-library.sh where X`; report listed paths |
| "Catalog of notebooks" / "list all notebooks in library" | Run `notebook-library.sh list` or `catalog` |
| "Global notebook" / "personal notebook" / "across projects" | Use global root; then [acquire.md](acquire.md) or notes as needed |
| Ask a question about sources | [research.md](research.md) |
| "Write a how to" / "tell me how to" / "explain" / "how does this work?" (in notebook context) | [notes.md](notes.md) auto-note behavior for substantial answers |
| "Remember this as X" / "Create a plan" / "track preferences" | [notes.md](notes.md) |
| "Table of contents" / "list sources" / "what sources do you have" | [notes.md](notes.md) → `notes/table-of-contents.md` |
| "show me" / "open" / "view the original" | [open.md](open.md) |
| "export to NotebookLM" / "prep for NotebookLM" / "prepare NotebookLM export" | [export.md](export.md) |

## Web acquisition reference

| Topic | File |
|-------|------|
| Setup and install | [web-setup.md](web-setup.md) |
| Anti-detection, bots, CAPTCHAs | [web-anti-detection.md](web-anti-detection.md) |
| Content extraction | [web-extraction.md](web-extraction.md) |
| Errors and fallbacks | [web-errors.md](web-errors.md) |
| Verify setup | [web-testing.md](web-testing.md) |

## Conventions

- Topic slugs: lowercase, hyphens (`electric-vehicles`, `market-research-q3`)
- Source slugs: lowercase, hyphens, no extension (`nhtsa-ev-report`, `competitor-pricing-2025`)
- Metadata slug matches document slug: `nhtsa-ev-report.meta.md` ↔ `nhtsa-ev-report.md`
- Summary slug: `{slug}-summary.md` in `documents/`
- All paths relative to the resolved topic base (workspace `notebook/{topic-slug}/` or global `{base}/{topic-slug}/`)
- Per-source files: raw document + metadata + summary (3 files). No separate `.link.md` files.

## Acquisition model

- **≤2 sources**: acquire directly in main agent context
- **>2 sources**: delegate to `Task` subagents (`generalPurpose`, `fast` model), 2–3 sources per subagent, max 4 concurrent. Main agent rebuilds index after all complete.

## Starting a session

1. Ask user for topic if not stated.
2. Resolve topic: look for `notebook/{topic-slug}/` in workspace, then `{NOTEBOOK_HOME or ~/.cursor/notebooks}/{topic-slug}/`. If neither exists, decide workspace vs global from user intent (e.g. "global notebook" → create under global base); then create the topic dir and subdirs.
3. Determine user intent (acquire vs query vs notes).
4. Follow the appropriate workflow. All paths in workflows are relative to the **resolved base** (e.g. `documents/`, `metadata/`, `notes/` under that base).

## Always-on memory files

Maintain these appendable files for each topic:

- `notes/learned-facts.md` — concise facts with source citations
- `notes/decisions-preferences.md` — user choices, constraints, stated preferences

## End-of-response rule

At the end of every response that creates or updates any file under `notes/`, list changed files as links grouped by folder. If the `file-change-tracker` skill is available, use it. Otherwise use the actual resolved path (workspace or global) in the link list. Omit if no notes were touched.
