# Example: Complex Skill

## Structure

```
pdf-processing/
├── SKILL.md
├── docs/
│   ├── index.md
│   ├── extraction.md
│   ├── forms.md
│   └── merging.md
├── scripts/
│   ├── extract.py
│   └── validate.py
└── examples/
    └── workflows.md
```

## SKILL.md (L1 - Minimal)

```markdown
---
name: pdf-processing
description: Extract text, fill forms, merge PDFs. Use when working with PDF files.
---
# PDF Processing

Handle PDF extraction, forms, and merging.

## Resources
- [Index](docs/index.md)
- [Workflows](examples/workflows.md)
```

## docs/index.md (L2 - Index)

```markdown
# PDF Processing Index

## Topics
- [Text Extraction](extraction.md) - extract text/tables
- [Form Filling](forms.md) - fill PDF forms
- [Merging](merging.md) - combine PDFs

## Quick Start
\`\`\`python
import pdfplumber
with pdfplumber.open("f.pdf") as p:
    print(p.pages[0].extract_text())
\`\`\`
```

## docs/extraction.md (L3 - Topic)

```markdown
# Text Extraction

## Overview
Use pdfplumber for text; pdf2image+tesseract for scanned.

## Usage
\`\`\`bash
python scripts/extract.py input.pdf > output.txt
\`\`\`

## Options
- `--pages 1-5`: specific pages
- `--tables`: extract tables as CSV
- `--ocr`: use OCR for scanned PDFs
```

## scripts/extract.py

```python
#!/usr/bin/env python3
"""Extract text from PDF."""
import sys
import pdfplumber

def main(path):
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            print(page.extract_text() or "")

if __name__ == "__main__":
    main(sys.argv[1])
```
