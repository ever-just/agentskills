# Anti-Patterns

## Avoid

| Pattern | Problem | Fix |
|---------|---------|-----|
| Verbose explanations | Token waste | Assume Claude knows basics |
| Deep nesting (L4+) | Partial reads | Keep refs 1 level deep |
| Multiple options | Decision paralysis | Provide one default |
| Time-sensitive info | Becomes stale | Use "deprecated" section |
| Windows paths | Cross-platform breaks | Use forward slashes |
| Vague names | Poor discovery | Be specific: `pdf-extract` not `utils` |
| First/second person | Inconsistent context | Use third person |

## Bad vs Good

**Verbose** (bad):
```
PDF files are a common format containing text...
To extract text, you need a library...
```

**Concise** (good):
```
Use pdfplumber:
\`\`\`python
with pdfplumber.open("f.pdf") as p:
    text = p.pages[0].extract_text()
\`\`\`
```

---

**Too many options** (bad):
```
Use pypdf, pdfplumber, PyMuPDF, or pdf2image...
```

**Default + escape hatch** (good):
```
Use pdfplumber. For OCR: pdf2image + pytesseract.
```

---

**Nested refs** (bad):
```
SKILL.md → advanced.md → details.md → actual-content.md
```

**Flat refs** (good):
```
SKILL.md → docs/advanced.md
SKILL.md → docs/details.md
```
