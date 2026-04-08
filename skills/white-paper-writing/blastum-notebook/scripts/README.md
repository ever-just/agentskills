# Scripts

Utility scripts for the notebook skill.

| Script | Purpose | Runtime |
|--------|---------|---------|
| `notebook-library.sh` | Check out / check in / sync global notebooks; list catalog (slug — title) | Bash |
| `backfill-titles.sh` | Add title to existing global notebooks (Overview or slug-to-phrase) | Bash |
| `export-notebooklm.sh` | Export notebook documents for NotebookLM import | Bash |
| `extract-pdf.py` | Extract text from PDF using pdfplumber; output `{slug}-extracted.txt` | Python |
| `fetch-page.py` | Fetch URL, convert HTML to markdown; output `{slug}.md` | Python |
| `fetch-page-puppeteer.mjs` | Fetch URL via headless Chrome (stealth, ad-blocking); output `{slug}.md` | Node |
| `launch-chrome.sh` | Launch Chrome with remote debugging port open (persistent profile) | Bash |
| `fetch-live-page.mjs` | Capture active tab from your running Chrome; you control scrolling/loading | Node |

## Python setup

```bash
pip install -r requirements.txt
```

## Node setup (one-time)

```bash
cd vendor/puppeteer && npm install
```

> Downloads Chromium (~170MB). Only needed once.

## Usage

```bash
# Extract PDF text with page markers
python3 scripts/extract-pdf.py documents/{slug}.pdf documents/{slug}-extracted.txt

# Fetch web page snapshot (Python fallback)
python3 scripts/fetch-page.py https://example.com/page {slug} documents/

# Fetch web page via puppeteer (preferred)
node scripts/fetch-page-puppeteer.mjs https://example.com/page {slug} documents/

# Fetch with interactive mode (for CAPTCHA / bot-walled pages)
node scripts/fetch-page-puppeteer.mjs https://example.com/page {slug} documents/ --interactive

# Launch Chrome with remote debugging (run once; sessions persist)
bash scripts/launch-chrome.sh
bash scripts/launch-chrome.sh https://example.com/page   # launch and navigate

# Capture the active tab from your running Chrome (you scroll, then press Enter)
node scripts/fetch-live-page.mjs {slug} documents/

# Navigate to a URL in your live Chrome, then capture
node scripts/fetch-live-page.mjs {slug} documents/ --url https://example.com/page

# Library: check out a global notebook into this workspace (run from workspace root)
bash ~/.cursor/skills/notebook/scripts/notebook-library.sh checkout {topic-slug}

# Library: check in the workspace notebook to global (removes local copy)
bash ~/.cursor/skills/notebook/scripts/notebook-library.sh checkin {topic-slug}

# Library: sync workspace notebook to global (update library, keep local copy; stays checked out)
bash ~/.cursor/skills/notebook/scripts/notebook-library.sh sync {topic-slug}

# Library: list workspace roots where a topic is checked out
bash ~/.cursor/skills/notebook/scripts/notebook-library.sh where {topic-slug}

# List notebooks in the global library (catalog; shows slug — title)
bash ~/.cursor/skills/notebook/scripts/notebook-library.sh list
bash ~/.cursor/skills/notebook/scripts/notebook-library.sh catalog   # alias

# Backfill title for existing global notebooks (once; run from any dir)
bash ~/.cursor/skills/notebook/scripts/backfill-titles.sh

# Export notebook for NotebookLM (run from workspace root)
bash ~/.cursor/skills/notebook/scripts/export-notebooklm.sh {topic-slug}
```

All scripts run from the notebook skill root (`.cursor/skills/notebook/`) except `notebook-library.sh` and `export-notebooklm.sh`, which are run from the **workspace root** and take optional `[workspace_root]` (default `$PWD`).

Checkout state is stored in `$NOTEBOOK_HOME/.notebook-checkouts` (one line per checkout: `topic-slug<TAB>workspace_root`). A notebook can be checked out in multiple workspaces at once; it stays on the list for a location until check-in (local copy removed) there.

## Notes

- `extract-pdf.py` adds `--- Page N ---` markers between pages for citation
- `fetch-page.py` converts HTML to markdown, preserving links and basic structure
- `fetch-page-puppeteer.mjs` exits with code 2 if acquisition fails or returns <200 chars; fall back to `fetch-page.py`
- See `docs/web-errors.md` for puppeteer troubleshooting
