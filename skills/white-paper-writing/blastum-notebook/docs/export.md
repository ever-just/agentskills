# Export Workflow

Prepare a notebook's documents for NotebookLM import.

## Steps

### 1. Resolve topic base

Determine the **resolved base** (workspace `notebook/{topic-slug}/` or global `{NOTEBOOK_HOME or ~/.cursor/notebooks}/{topic-slug}/` per [index](index.md#notebook-roots)).

### 2. Read source index

Read `metadata/index.meta.md` to get the list of sources.

### 3. Filter snapshot sources

For each source in the index:
- Read `metadata/{slug}.meta.md`
- Check `snapshot: true` (skip if `false` or missing)
- Extract `source:` field to get document path (e.g., `documents/{slug}.md`)

### 4. Copy documents

Create export directory:
```
mkdir -p tmp/notebooklm-export/{topic-slug}
```

For each snapshot source:
- Copy the document file(s) from `documents/` to `tmp/notebooklm-export/{topic-slug}/`
- Preserve original filename
- **Exclude** `-summary.md` files (NotebookLM will process originals)
- Handle multiple extensions: `.md`, `.pdf`, `.txt`, extracted text files

**File matching logic:**
- If `source:` is `documents/{slug}.md`, copy `documents/{slug}.md`
- Also check for `documents/{slug}.pdf`, `documents/{slug}.txt` if markdown doesn't exist
- For PDFs with extracted text: copy both `.pdf` and `-extracted.txt` if present
- For OCR outputs: copy entire `{slug}-ocr/` directory if present

### 5. Report

List copied files and count. Confirm export location.

## Usage

**Agent workflow:**
- User says "export to NotebookLM" / "prep for NotebookLM" / "prepare NotebookLM export"
- Follow steps above
- Output: `tmp/notebooklm-export/{topic-slug}/` with all snapshot documents

**Script:**
```bash
# From workspace root
bash ~/.cursor/skills/notebook/scripts/export-notebooklm.sh {topic-slug}
```

## Notes

- Export includes only documents with `snapshot: true` (actual files, not link-only sources)
- Summary files are excluded (NotebookLM processes originals)
- Original filenames preserved for easy reference
- Flat structure in export folder (NotebookLM handles organization)
