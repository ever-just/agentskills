#!/usr/bin/env python3
"""
Extract text from PDF files with page markers.

Usage:
    python extract-pdf.py <input-pdf> [output-txt]

If output-txt is not provided, outputs to stdout.
"""

import sys
import pdfplumber
from pathlib import Path


def extract_pdf_text(pdf_path, output_path=None):
    """Extract text from PDF with page markers."""
    pdf_file = Path(pdf_path)
    if not pdf_file.exists():
        print(f"Error: PDF file not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    text_lines = []
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                text_lines.append(f"--- Page {page_num} ---")
                text_lines.append("")
                page_text = page.extract_text()
                if page_text:
                    text_lines.append(page_text)
                    text_lines.append("")
    except Exception as e:
        print(f"Error extracting PDF: {e}", file=sys.stderr)
        sys.exit(1)

    output_text = "\n".join(text_lines)
    
    if output_path:
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        output_file.write_text(output_text, encoding='utf-8')
        print(f"Extracted text saved to: {output_path}")
    else:
        print(output_text)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract-pdf.py <input-pdf> [output-txt]", file=sys.stderr)
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    
    extract_pdf_text(pdf_path, output_path)
