---
name: markdown-to-pdf
description: Convert markdown files to styled PDFs using pandoc and WeasyPrint with CSS. Use when exporting markdown documents to PDF with custom styling.
---
# Markdown to PDF

Convert markdown files to styled PDFs via pandoc → HTML → WeasyPrint.

## Prerequisites

```bash
brew install pandoc
pipx install weasyprint
```

## Usage

```bash
./scripts/md_to_pdf.sh [--mobile|-m] <input.md> <output.pdf> [style.css]
```

CSS file is optional. Default styling in `assets/style.css`. Use `--mobile` flag for mobile-optimized PDFs.

## Examples

```bash
# Basic conversion
./scripts/md_to_pdf.sh document.md document.pdf

# Mobile-optimized PDF
./scripts/md_to_pdf.sh --mobile document.md document.pdf

# With custom CSS
./scripts/md_to_pdf.sh document.md document.pdf custom.css

# Mobile with custom CSS
./scripts/md_to_pdf.sh --mobile document.md document.pdf custom.css
```

## Resources

- [Script](scripts/md_to_pdf.sh)
- [Default CSS](assets/style.css)
- [Mobile CSS](assets/style-mobile.css)
