---
name: pdf-processing
description: Extract text and tables from PDFs, fill forms, merge documents. Use when working with PDF files, forms, or document extraction.
---
# PDF Processing

See [docs/INDEX.md](docs/INDEX.md) for complete instructions.

## Quick Start

Extract text:
```python
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```

