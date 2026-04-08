#!/usr/bin/env python3
"""
Fetch a web page and convert to markdown.

Usage:
    python fetch-page.py <url> <slug> [output-dir]

Fetches the URL, converts HTML to markdown, and saves as {slug}.md
in the output directory (default: current directory).
"""

import sys
import requests
from pathlib import Path
from urllib.parse import urlparse
from datetime import datetime
import html2text


def fetch_page_to_markdown(url, slug, output_dir="."):
    """Fetch URL and convert to markdown."""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"Error fetching URL: {e}", file=sys.stderr)
        sys.exit(1)

    # Convert HTML to markdown
    h = html2text.HTML2Text()
    h.ignore_links = False
    h.ignore_images = False
    h.body_width = 0  # Don't wrap lines
    markdown_content = h.handle(response.text)

    # Save to file
    output_path = Path(output_dir) / f"{slug}.md"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(markdown_content, encoding='utf-8')
    
    print(f"Page snapshot saved to: {output_path}")
    return output_path


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python fetch-page.py <url> <slug> [output-dir]", file=sys.stderr)
        sys.exit(1)
    
    url = sys.argv[1]
    slug = sys.argv[2]
    output_dir = sys.argv[3] if len(sys.argv) > 3 else "."
    
    fetch_page_to_markdown(url, slug, output_dir)
