# Text Extraction

## Basic

```python
import pdfplumber

with pdfplumber.open("file.pdf") as pdf:
    for page in pdf.pages:
        print(page.extract_text())
```

## Tables

```python
with pdfplumber.open("file.pdf") as pdf:
    tables = pdf.pages[0].extract_tables()
    for table in tables:
        for row in table:
            print(row)
```

## Scanned PDFs (OCR)

Use pdf2image + pytesseract:

```python
from pdf2image import convert_from_path
import pytesseract

images = convert_from_path("scanned.pdf")
for img in images:
    text = pytesseract.image_to_string(img)
```
