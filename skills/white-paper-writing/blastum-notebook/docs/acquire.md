# Acquire Workflow

Add sources to a topic's knowledge base.

## Steps

### 1. Initialize topic (if new)

Create under the **resolved base** (workspace `notebook/{topic-slug}/` or global `{NOTEBOOK_HOME or ~/.cursor/notebooks}/{topic-slug}/` per [index](index.md#notebook-roots)):

```
mkdir -p {base}/{topic-slug}/documents
mkdir -p {base}/{topic-slug}/metadata
mkdir -p {base}/{topic-slug}/notes
```

Create `metadata/index.meta.md` using the template in [metadata.md](metadata.md). Set **title** to a one-line description derived from the user's creation prompt (e.g. "Research topic X", "Comparison of Y", "Planning for Z").

### 2. Find sources

Use `web_search` to find relevant sources. Aim for 5–10 high-quality sources.
Prioritize: official sites, authoritative guides, reviews, pricing pages.

**When searching, always look for PDF versions first.** For research reports, white papers, and official publications, explicitly search for `site:example.com filetype:pdf` or look for PDF links on the source page before falling back to the HTML article.

### 3. Delegate acquisition (>2 sources)

When acquiring **3 or more** sources, delegate to `Task` subagents instead of acquiring serially:

1. Group URLs into batches of 2–3
2. Launch subagents in parallel (max 4 concurrent), each with `subagent_type: "generalPurpose"`, `model: "fast"`
3. Each subagent prompt must include:
   - The notebook skill path (`~/.cursor/skills/notebook/SKILL.md`) — instruct it to read the skill first
   - The topic slug and the resolved base path (workspace or global)
   - The assigned URLs and slugs
   - Instructions to: fetch each source, write `documents/{slug}.*` and `metadata/{slug}.meta.md`, produce a `documents/{slug}-summary.md`, extract durable facts and append to `notes/learned-facts.md` (see step 6.5), and return a brief acquisition report (title, slug, type, key facts, any failures)
4. Main agent collects subagent reports and rebuilds the topic index (step 6)

For **1–2 sources**, acquire directly per step 4 below.

### 4. Acquire each source

**Source acquisition priority order:**

1. **PDF (preferred)** — use if a PDF is available for the source
2. **Web page** — fall back if no PDF exists or PDF is inaccessible

**PDF:**
1. Search for a direct PDF URL (check the source page, search `filetype:pdf`, or look for "Download PDF" / "Read PDF" links)
2. Attempt to download: `curl -L "{url}" -o documents/{slug}.pdf`
3. Verify the download succeeded and is a valid PDF (non-zero size, not an HTML error page)
4. If download succeeded: run `python3 scripts/extract-pdf.py documents/{slug}.pdf documents/{slug}-extracted.txt` to extract text with page markers
5. **If extracted text is sparse** (average < 100 chars/page — scanned or image-only PDF):
   - Use the vision-ocr skill: `~/.cursor/skills/vision-ocr/scripts/vision-ocr documents/{slug}.pdf documents/{slug}-ocr/`
   - Set `ocr_output_dir: documents/{slug}-ocr/` in `metadata/{slug}.meta.md`
   - Use `documents/{slug}-ocr/page-*.txt` as the content for querying instead of the extracted text file
6. Write metadata: `metadata/{slug}.meta.md` (includes `snapshot: true`, `type: pdf`, and `why_saved`)
7. **If download failed or PDF is unreadable**: fall back to web page acquisition below

**Web page:**
1. Fetch the page using puppeteer (stealth, ad-blocking, robots.txt compliance built in):
   ```bash
   node scripts/fetch-page-puppeteer.mjs {url} {slug} documents/
   ```
   - Exit code 2 = robots disallow, timeout, or too little content extracted
   - For bot-walled pages: add `--interactive` flag (opens visible browser, waits for you to solve CAPTCHA)
   - First time only: `cd vendor/puppeteer && npm install` (see [web-setup.md](web-setup.md))
2. **For pages with robots.txt restrictions** (pages you can personally access): use live browser capture:
   ```bash
   bash scripts/launch-chrome.sh [url]                            # launch once; sessions persist
   node scripts/fetch-live-page.mjs {slug} documents/            # grab active tab
   node scripts/fetch-live-page.mjs {slug} documents/ --url {url}  # navigate then grab
   ```
   - Chrome connects via remote debugging — requests originate from your real browser session
   - You control page loading: scroll to reveal lazy-loaded content, then press Enter when ready
   - Optional `--tab <n>` if multiple tabs are open
3. If puppeteer fails, fall back to:
   ```bash
   python3 scripts/fetch-page.py {url} {slug} documents/
   ```
4. Write metadata: `metadata/{slug}.meta.md` (includes `snapshot: true`, `type: web`, and `why_saved`)

**Image file (JPEG, PNG, TIFF, HEIC, WebP, etc.):**
1. Download to `documents/{slug}.{ext}`
2. Run vision-ocr: `~/.cursor/skills/vision-ocr/scripts/vision-ocr documents/{slug}.{ext} documents/{slug}-ocr/`
3. Treat `documents/{slug}-ocr/page-001.txt` as the extracted content
4. Set `ocr_output_dir: documents/{slug}-ocr/` in metadata

**Markdown / plain text:**
1. Copy or save file to `documents/{slug}.md` / `documents/{slug}.txt`
2. Write metadata: `metadata/{slug}.meta.md`

### 5. Summarize each document

After writing the raw document, immediately produce `documents/{slug}-summary.md` (~50–150 lines):

```markdown
# Summary: {Source Title}

Source: [{slug}](documents/{slug}.md)

## Key Facts
- Bullet list of extractable facts: prices, dates, specs, limits, rules

## Section Digest
### {Section 1 heading}
Brief digest of section content (2–4 sentences).

### {Section 2 heading}
...

## Tables & Structured Data
(Preserve any tables, comparison charts, or structured data verbatim as markdown tables)
```

**Rules:**
- Preserve all numbers, prices, dates, and proper nouns exactly
- Keep citations to page/section refs from the raw document
- Include all tables and structured data — these are high-value and compress poorly
- Target ~10–20% of raw document length
- If the raw document is already short (<100 lines), the summary can just be the key facts section

**Next step**: After summarizing, immediately extract durable facts (step 6.5) before moving to the next source.

### 6. Update topic index

Rebuild `metadata/index.meta.md` from all `metadata/*.meta.md` files:

- Read all `metadata/*.meta.md` files
- Preserve existing **title** (do not remove or overwrite)
- Set `document_count` to total source count
- Regenerate the Sources table from all metadata (do not remove existing rows)

When using subagent delegation (step 3), do this once after all subagents complete, using their reports.

### 6.5. Capture durable facts (required)

After creating each summary, extract and append durable facts to `notes/learned-facts.md` with source citations.

**Durable facts include:**
- **Specifications**: Contribution limits, deduction amounts, thresholds, caps
- **Rules**: Filing requirements, eligibility criteria, qualification tests, phaseout rules
- **Deadlines**: Due dates, payment deadlines, filing deadlines
- **Pricing/cost anchors**: Tax rates, thresholds, phaseout ranges, MAGI limits
- **Constraints**: Income limits, age requirements, time limits, usage restrictions
- **Quantitative findings**: Any numbers that inform planning decisions (percentages, dollar amounts, time periods)

**Format**: One bullet per fact, organized by category (e.g., "## Medical Expenses", "## Retirement Limits"). Include source citation link to metadata file.

**When to extract**: Review the summary and extracted text for quantitative facts, limits, thresholds, and rules. Extract 5-15 key facts per document depending on content density. When in doubt, log it — better to have too many facts than miss important ones.

### 7. Confirm with user

List sources acquired, note any that failed, ask if more are needed.
If `notes/learned-facts.md` was updated, include links footer (see index.md end-of-response rule).

## File templates

See [metadata.md](metadata.md) for all file format templates.
