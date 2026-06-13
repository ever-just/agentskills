# LinkedIn Activity Intelligence

## Overview

Extract structured intelligence from a LinkedIn user's activity feed when direct API access and scraping are blocked. This skill covers MHTML archive parsing, authenticated video download via Playwright, batch image analysis using contact sheets, career-era separation, and post text extraction. Validated on Celina Berglund's feed (181 posts, 398 images, 18 videos) during the BROGAV Solutions dossier project (June 2026).

## When to Use

- You need intelligence from a LinkedIn power user's activity feed (50+ posts)
- Direct scraping is blocked or unreliable (LinkedIn's anti-bot measures)
- You have a saved MHTML archive of the profile's activity page
- You need to attribute findings to specific career eras (current vs. prior employers)
- You need to download LinkedIn-hosted video that yt-dlp cannot extract

## Prerequisites

- **Python 3.10+**
- **Libraries:** `Pillow`, `beautifulsoup4`, `playwright`, `lxml`
- **Browser:** Playwright with `channel="chrome"` (uses real Chrome, not Chromium)
- **LinkedIn session:** User must be logged into Chrome with a valid LinkedIn session
- **MHTML file:** Saved via browser "Save As" -> "Webpage, Single File (.mhtml)"
- **Disk space:** MHTML files can be 50-200MB; extracted images add 30-60% more

## Method

### Step 1: Acquire the MHTML Archive

Save the target user's LinkedIn activity page as MHTML from Chrome:

1. Navigate to `linkedin.com/in/{username}/recent-activity/all/`
2. Scroll to the bottom of the feed (or as far back as needed)
3. File -> Save As -> "Webpage, Single File (.mhtml)"
4. Note: A 181-post feed produces ~136MB MHTML

**Why MHTML:** It captures the fully-rendered DOM including lazy-loaded images, embedded base64 assets, and all HTML structure in a single portable file. Unlike HAR files, MHTML preserves the visual layout.

### Step 2: Parse the MHTML Archive

Use Python's built-in `email` module to parse the MHTML (which is a MIME multipart message):

```python
import email
import base64
import os
from pathlib import Path

def parse_mhtml(mhtml_path, output_dir):
    """
    Parse an MHTML file and extract all embedded content.
    Returns dict with 'html_parts' (list of str) and 'images' (list of dicts).
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    img_dir = output_dir / "images"
    img_dir.mkdir(exist_ok=True)

    with open(mhtml_path, "rb") as f:
        msg = email.message_from_bytes(f.read())

    html_parts = []
    images = []
    part_index = 0

    for part in msg.walk():
        content_type = part.get_content_type()
        payload = part.get_payload(decode=True)
        if payload is None:
            continue

        if content_type == "text/html":
            html_text = payload.decode("utf-8", errors="replace")
            html_parts.append(html_text)
            html_path = output_dir / f"content_{part_index}.html"
            html_path.write_text(html_text, encoding="utf-8")

        elif content_type.startswith("image/"):
            ext = content_type.split("/")[1].split(";")[0]
            if ext == "jpeg":
                ext = "jpg"
            filename = f"image_{part_index:04d}.{ext}"
            filepath = img_dir / filename
            filepath.write_bytes(payload)
            size_kb = len(payload) / 1024

            # Filter tracking pixels and spacer GIFs (< 5KB)
            if size_kb > 5:
                images.append({
                    "filename": filename,
                    "path": str(filepath),
                    "size_kb": round(size_kb, 1),
                    "content_type": content_type,
                    "part_index": part_index,
                })

        part_index += 1

    # Write manifest
    manifest_path = output_dir / "manifest.txt"
    with open(manifest_path, "w") as mf:
        mf.write(f"HTML parts: {len(html_parts)}\n")
        mf.write(f"Images (>5KB): {len(images)}\n")
        mf.write(f"Total chars HTML: {sum(len(h) for h in html_parts):,}\n\n")
        for img in sorted(images, key=lambda x: -x['size_kb']):
            mf.write(f"{img['filename']}: {img['size_kb']}KB\n")

    return {"html_parts": html_parts, "images": images}
```

**Key detail:** Filter images >5KB. LinkedIn embeds dozens of 1x1 tracking pixels and tiny UI icons. Anything under 5KB is almost never intelligence-relevant.

**Expected yield:** A 136MB MHTML from 181 posts produced 302 images (>5KB) and 10M characters of HTML.

### Step 3: Extract Post Text from HTML

LinkedIn post text lives inside `<span>` elements. Parse the HTML to extract post content:

```python
from bs4 import BeautifulSoup
import re

def extract_post_texts(html_content):
    """
    Extract post texts from LinkedIn activity feed HTML.
    Returns list of dicts with text, hashtags, and metadata.
    """
    soup = BeautifulSoup(html_content, "lxml")
    posts = []
    seen_texts = set()

    # LinkedIn wraps post text in spans with dir="ltr" or class="break-words"
    for span in soup.find_all("span", attrs={"dir": "ltr"}):
        text = span.get_text(separator=" ", strip=True)

        # Skip short fragments (UI labels, button text)
        if len(text) < 50:
            continue

        # Deduplicate (LinkedIn repeats content in multiple DOM locations)
        text_hash = hash(text[:200])
        if text_hash in seen_texts:
            continue
        seen_texts.add(text_hash)

        hashtags = re.findall(r"#(\w+)", text)

        posts.append({
            "text": text,
            "hashtags": hashtags,
            "char_count": len(text),
        })

    # Also check break-words class (alternate DOM structure)
    for span in soup.find_all("span", class_="break-words"):
        text = span.get_text(separator=" ", strip=True)
        if len(text) < 50:
            continue
        text_hash = hash(text[:200])
        if text_hash in seen_texts:
            continue
        seen_texts.add(text_hash)
        hashtags = re.findall(r"#(\w+)", text)
        posts.append({
            "text": text,
            "hashtags": hashtags,
            "char_count": len(text),
        })

    return posts
```

### Step 4: Download Videos via Playwright

As of 2026, yt-dlp's LinkedIn extractor is broken (last working: 2026.03.17). Use Playwright with real Chrome instead:

```python
import asyncio
from playwright.async_api import async_playwright
from pathlib import Path

async def download_linkedin_video(post_url, output_path):
    """
    Download a LinkedIn video using Playwright with existing Chrome session.
    Requires user to be logged into Chrome on LinkedIn.
    """
    output_path = Path(output_path)

    async with async_playwright() as p:
        # Launch real Chrome (not Chromium) to use existing session cookies
        browser = await p.chromium.launch(
            channel="chrome",
            headless=False,
        )
        context = await browser.new_context()
        page = await context.new_page()

        video_url = None

        # Method A: Intercept video responses from LinkedIn CDN
        async def handle_response(response):
            nonlocal video_url
            if "dms.licdn.com" in response.url and "video" in response.url:
                video_url = response.url

        page.on("response", handle_response)

        await page.goto(post_url, wait_until="networkidle")
        await page.wait_for_timeout(3000)

        # Click play button if video hasn't auto-played
        try:
            play_btn = page.locator("button.vjs-big-play-button")
            if await play_btn.is_visible():
                await play_btn.click()
                await page.wait_for_timeout(5000)
        except Exception:
            pass

        # Method B: Extract video src directly from DOM
        if not video_url:
            video_url = await page.evaluate("""
                () => {
                    const video = document.querySelector('video');
                    return video ? video.currentSrc : null;
                }
            """)

        if video_url:
            # Download using context.request (carries auth cookies automatically)
            response = await context.request.get(video_url)
            if response.ok:
                output_path.write_bytes(await response.body())
                print(f"Saved: {output_path} ({output_path.stat().st_size / 1024 / 1024:.1f}MB)")
            else:
                print(f"Download failed: HTTP {response.status}")
        else:
            print("Could not extract video URL")

        await browser.close()

# Usage:
# asyncio.run(download_linkedin_video(
#     "https://www.linkedin.com/feed/update/urn:li:activity:7123456789",
#     "video_001.mp4"
# ))
```

**Fallback order:**
1. `page.evaluate("document.querySelector('video').currentSrc")` -- fastest
2. Response interception for `dms.licdn.com` URLs -- catches lazy-loaded sources
3. Manual: copy video URL from browser DevTools Network tab

### Step 5: Build Contact Sheets for Batch Image Analysis

Instead of reading 400 images individually, grid them into contact sheets. See the dedicated `contact-sheet-image-analysis` skill for full implementation. Summary:

1. Auto-classify all images by size, dimensions, aspect ratio, transparency
2. Sort by file size descending (largest = most content-rich)
3. Generate 6x6 grids (36 images per sheet) using Pillow
4. Create position map linking each cell to the original filename
5. AI agent reviews 12 sheets instead of 400 images = 33x faster

### Step 6: Separate Career Eras

LinkedIn feeds are reverse-chronological and span multiple employers. You must map post numbers to career eras before attributing any finding.

**Era separation process:**

1. Number all posts from newest (1) to oldest (N)
2. Scan for career transition signals:
   - "Excited to announce" / "thrilled to join" / "new chapter" posts
   - Change in company branding in images
   - Change in hashtags (e.g., #BROGAV disappears, #Emcor appears)
   - "Last day" / "farewell" / "grateful for X years" posts
3. Create an era map:

```
Era 1 (Current): Posts 1-140   -> BROGAV Solutions (2022-present)
Era 2 (Prior):   Posts 141-172 -> Emcor (2018-2022)
Era 3 (Earlier): Posts 173-181 -> Earlier career
```

4. **Boundary audit:** Posts within 5 of an era boundary get manual review. Career transitions are gradual -- someone might post about their old employer for weeks after starting a new job.

**Era validation checklist for every finding:**
- [ ] Post number falls within the correct era range
- [ ] Company branding in images matches the attributed era
- [ ] Hashtags are consistent with the era
- [ ] If near a boundary (+/- 5 posts), manually verified
- [ ] No cross-era contamination (e.g., attributing a prior employer's product to the current company)

### Step 7: Synthesize Intelligence Report

Combine all extracted data into a structured report:

1. **Post timeline** -- Chronological list of all posts with text, hashtags, era attribution
2. **Image intelligence** -- Categorized findings from contact sheet review
3. **Video inventory** -- Downloaded videos with descriptions and timestamps
4. **Relationship map** -- People, companies, events mentioned across all posts
5. **Product intelligence** -- Any products, logos, demos, or installations visible
6. **Event attendance** -- Conferences, trade shows, customer visits identified

## Performance

| Metric | Value |
|---|---|
| MHTML parsing | 136MB file parsed in ~15 seconds |
| Image extraction | 302 images (>5KB) from 398 total |
| Contact sheet generation | 12 sheets from 397 images in ~30 seconds |
| Video download | 18 videos, avg 45 seconds each |
| Post text extraction | 181 posts extracted in ~10 seconds |
| Total analysis time | ~4 hours (vs. estimated 12+ hours manual) |
| Token savings (contact sheets) | ~80% reduction vs. individual image reads |

## Pitfalls

1. **MHTML size limits:** Browsers may crash saving feeds with 500+ posts. Scroll in batches and save multiple MHTMLs, then merge the extracted content.

2. **LinkedIn DOM changes:** LinkedIn updates its HTML structure frequently. The `dir="ltr"` and `break-words` selectors worked as of June 2026. If extraction yields zero results, inspect the DOM for new class names.

3. **Video auth cookies:** Playwright must use `channel="chrome"` (real Chrome), not the bundled Chromium, to access the user's existing LinkedIn session. Headless mode will not carry cookies.

4. **Era misattribution:** The single most dangerous error. A product photo from a prior employer attributed to the current company creates false intelligence. Always verify era boundaries before integrating findings.

5. **Duplicate images:** LinkedIn embeds the same image in multiple DOM locations (feed view, expanded view, mobile fallback). Deduplicate by file hash before counting or analyzing.

6. **Rate limiting:** When downloading many videos, add 5-10 second delays between downloads to avoid LinkedIn rate limits or session invalidation.

7. **MHTML encoding:** Some MHTML files use quoted-printable encoding instead of base64 for images. Python's `email` module with `decode=True` handles both, but verify output images are not corrupted by spot-checking a few.

## Real-World Example

**Subject:** Celina Berglund, co-founder of BROGAV Solutions
**Feed stats:** 181 posts, 398 images, 18 videos, spanning 2019-2026
**MHTML size:** 136MB

**Key findings extracted:**
- Confirmed supplier relationships via product photos (Gateview racks, Chatsworth cable management)
- Identified trade show attendance pattern (Data Center World annually since 2023)
- Discovered private-label cabinet branding ("BROGAV" logo on generic-looking cabinets)
- Mapped career timeline: Emcor -> BROGAV Solutions founding (2022)
- Found customer site visit photos revealing end-user verticals (healthcare, financial services)
- Extracted 18 product demo and installation videos
- Identified 23 individual contacts/colleagues tagged in posts

**Era separation was critical:** Posts 141-172 contained Emcor-era content. Without era separation, "Protector Cabinets" (an Emcor product line) would have been incorrectly attributed to BROGAV's product catalog.

## Output Template

```
# LinkedIn Activity Intelligence Report: [Subject Name]

## Feed Statistics
- Total posts analyzed: [N]
- Images extracted: [N] (>5KB threshold)
- Videos downloaded: [N]
- Date range: [earliest] to [latest]
- Career eras identified: [N]

## Era Map
| Era | Posts | Company | Dates |
|-----|-------|---------|-------|
| 1   | 1-X   | Current | YYYY-present |
| 2   | X-Y   | Prior   | YYYY-YYYY |

## Key Findings

### Supplier/Partner Intelligence
| Finding | Evidence | Era | Confidence |
|---------|----------|-----|------------|

### Product Intelligence
| Finding | Evidence | Era | Confidence |
|---------|----------|-----|------------|

### Event/Conference Attendance
| Event | Date | Evidence | Notes |
|-------|------|----------|-------|

### Relationship Map
| Person | Company | Relationship Type | Evidence |
|--------|---------|-------------------|----------|

## Image Analysis Summary
- Total contact sheets reviewed: [N]
- Categories: [breakdown]
- Notable images flagged for full-size review: [N]

## Videos Inventory
| # | URL | Duration | Description | Era |
|---|-----|----------|-------------|-----|

## Data Gaps
- [What could not be determined from this feed]

## Sources
- MHTML archive: [filename, size, date saved]
- Images extracted: [count]
- Videos downloaded: [count]
```
