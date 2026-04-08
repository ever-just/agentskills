# Open Workflow

Open a source document in the user's default application via the shell.

## Triggers

User says: "show me", "open", "view the original", "open the PDF", "open the URL", "open the source", or any variant requesting to view a raw document.

## Steps

### 1. Identify the source

Look up `metadata/{slug}.meta.md` for the requested source. Priority order for what to open:

1. **PDF** — if `pdf:` field exists and the file is present locally
2. **URL** — if no local PDF, use `url:` (or `web_url:` as fallback)

### 2. Open via shell

**Local file (PDF, image, etc.):** Use the resolved topic base path.
```bash
open "{resolved-base}/documents/{slug}.pdf"
```

**URL:**
```bash
open "https://..."
```

`open` on macOS hands the path or URL to the system default application:
- PDFs → Preview (or default PDF viewer)
- URLs → default browser
- Images → Preview

### 3. Confirm

Tell the user what was opened and from which field (`pdf`, `url`, etc.).

## Notes

- If the user doesn't specify a source and the topic has multiple, ask which one or list them.
- If the local PDF file is missing but the `url` is a direct PDF link, open the URL — the browser will handle it.
- Do not use `xdg-open` (Linux) — this skill targets macOS.
