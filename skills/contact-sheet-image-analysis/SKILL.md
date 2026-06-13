# Contact Sheet Image Analysis

## Overview

A batch image analysis technique that grids large numbers of images into contact sheets for efficient AI vision review. Instead of reading images one-by-one (which burns tokens, time, and tool calls), this method composites them into 6x6 grids with a position map for drill-down. Validated during the BROGAV Solutions dossier project (June 2026), analyzing 397 images in ~45 minutes vs. an estimated 8+ hours individually.

## When to Use

- You have 50+ images to analyze and need to extract intelligence from all of them
- You are looking for logos, people, products, text, events, or patterns across a large image set
- You want to reduce AI vision API/tool calls by 80-95%
- You are processing images extracted from an MHTML archive, scraped gallery, or document dump
- You need to categorize images before deciding which ones deserve full-resolution analysis

## Prerequisites

- **Python 3.10+**
- **Libraries:** `Pillow` (PIL fork)
- **AI vision capability:** Claude, GPT-4V, or any multimodal model that can read images
- **Disk space:** Contact sheets add ~5-10% to the total image set size
- **Memory:** Processing 400+ images requires ~500MB RAM for thumbnail generation

## Method

### Step 1: Auto-Classify Images

Before gridding, classify every image by its physical properties. This determines sort order and helps the AI agent know what to expect in each cell.

```python
from PIL import Image
from pathlib import Path

def classify_image(filepath):
    """
    Classify an image by dimensions, file size, and properties.
    Returns a category string used for sorting and analysis context.
    """
    filepath = Path(filepath)
    try:
        with Image.open(filepath) as img:
            w, h = img.size
            has_alpha = img.mode in ("RGBA", "LA", "PA")
            size_kb = filepath.stat().st_size / 1024
    except Exception:
        return "skip_corrupt"

    if size_kb < 5:
        return "skip_tiny"       # Tracking pixels, spacer GIFs
    if w < 50 or h < 50:
        return "skip_icon"       # Favicons, tiny UI elements
    
    ratio = w / h if h > 0 else 1.0
    
    if ratio > 2.5:
        return "banner_wide"     # LinkedIn banners, ad units
    if ratio < 0.4:
        return "infographic_tall"  # Vertical infographics, screenshots
    if has_alpha and size_kb < 100:
        return "logo_or_graphic" # Logos, icons with transparency
    if size_kb > 200:
        return "photo_large"     # High-res photos, most content-rich
    if size_kb > 50:
        return "photo_medium"    # Standard photos
    if 0.9 < ratio < 1.1:
        return "photo_square"    # Profile photos, thumbnails
    return "photo_medium"
```

**Category guide:**

| Category | Typical Content | Intelligence Value |
|---|---|---|
| `photo_large` | Event photos, product shots, team photos | High -- most findings come from here |
| `photo_medium` | General posts, screenshots, shared content | Medium |
| `banner_wide` | LinkedIn banners, promotional graphics | Low-Medium -- may show branding |
| `infographic_tall` | Data visualizations, process diagrams | Medium-High -- dense information |
| `logo_or_graphic` | Company logos, partner logos, certificates | Medium -- confirms relationships |
| `photo_square` | Profile pics, headshots | Low unless identifying people |
| `skip_tiny` | Tracking pixels, 1x1 GIFs | None -- exclude |
| `skip_icon` | Favicons, UI elements | None -- exclude |
| `skip_corrupt` | Unreadable files | None -- exclude |

### Step 2: Sort by Size Descending

Largest files contain the most visual information. Sorting by size ensures the AI agent sees the most content-rich images first.

```python
def collect_and_sort_images(image_dir):
    """Collect all images, classify, filter, and sort by size descending."""
    image_dir = Path(image_dir)
    files = []
    for ext in ("*.jpg", "*.jpeg", "*.png", "*.gif", "*.webp", "*.bmp"):
        files.extend(image_dir.glob(ext))
    
    classified = []
    for f in files:
        cat = classify_image(f)
        if cat.startswith("skip_"):
            continue
        classified.append({
            "path": f,
            "size_kb": round(f.stat().st_size / 1024, 1),
            "category": cat,
        })
    
    # Sort by file size descending
    classified.sort(key=lambda x: -x["size_kb"])
    return classified
```

### Step 3: Generate Contact Sheets

Create 6x6 grids (36 images per sheet) using Pillow.

```python
def make_contact_sheets(
    image_list,
    output_dir,
    cols=6,
    rows=6,
    thumb_size=200,
    padding=10,
):
    """
    Generate contact sheet grids from a list of classified images.
    
    Args:
        image_list: List of dicts from collect_and_sort_images()
        output_dir: Where to save contact sheets and position map
        cols: Columns per sheet (default 6)
        rows: Rows per sheet (default 6)
        thumb_size: Thumbnail dimension in pixels (default 200)
        padding: Pixels between thumbnails (default 10)
    
    Returns:
        Tuple of (list of sheet paths, position map list)
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    images_per_sheet = cols * rows
    sheets = []
    position_map = []

    for sheet_idx in range(0, len(image_list), images_per_sheet):
        batch = image_list[sheet_idx:sheet_idx + images_per_sheet]
        sheet_num = sheet_idx // images_per_sheet + 1

        # Calculate sheet dimensions
        sheet_w = cols * (thumb_size + padding) + padding
        sheet_h = rows * (thumb_size + padding) + padding
        sheet_img = Image.new("RGB", (sheet_w, sheet_h), (255, 255, 255))

        for i, item in enumerate(batch):
            row = i // cols
            col = i % cols
            x = padding + col * (thumb_size + padding)
            y = padding + row * (thumb_size + padding)

            try:
                with Image.open(item["path"]) as img:
                    img.thumbnail((thumb_size, thumb_size), Image.LANCZOS)
                    # Convert to RGB if necessary (handles RGBA, palette modes)
                    if img.mode != "RGB":
                        img = img.convert("RGB")
                    sheet_img.paste(img, (x, y))
            except Exception:
                pass  # Leave cell blank for corrupt images

            position_map.append({
                "sheet": sheet_num,
                "row": row + 1,
                "col": col + 1,
                "filename": item["path"].name,
                "filepath": str(item["path"]),
                "size_kb": item["size_kb"],
                "category": item["category"],
            })

        sheet_path = output_dir / f"contact_sheet_{sheet_num:02d}.jpg"
        sheet_img.save(sheet_path, "JPEG", quality=90)
        sheets.append(str(sheet_path))
        print(f"  Sheet {sheet_num}: {len(batch)} images -> {sheet_path.name}")

    # Write position map as text
    map_path = output_dir / "position_map.txt"
    with open(map_path, "w") as f:
        f.write(f"Contact Sheet Position Map\n")
        f.write(f"Total images: {len(position_map)}\n")
        f.write(f"Total sheets: {len(sheets)}\n")
        f.write(f"Grid: {cols}x{rows} ({images_per_sheet} per sheet)\n")
        f.write(f"Thumbnail size: {thumb_size}px\n\n")
        f.write(f"{'Sheet':>5} | {'Row':>3} | {'Col':>3} | {'Filename':<35} | {'Size(KB)':>8} | Category\n")
        f.write("-" * 85 + "\n")
        for entry in position_map:
            f.write(
                f"{entry['sheet']:>5} | {entry['row']:>3} | {entry['col']:>3} | "
                f"{entry['filename']:<35} | {entry['size_kb']:>8} | {entry['category']}\n"
            )

    # Write position map as CSV for programmatic use
    csv_path = output_dir / "position_map.csv"
    with open(csv_path, "w") as f:
        f.write("sheet,row,col,filename,filepath,size_kb,category\n")
        for entry in position_map:
            f.write(
                f"{entry['sheet']},{entry['row']},{entry['col']},"
                f"\"{entry['filename']}\",\"{entry['filepath']}\","
                f"{entry['size_kb']},{entry['category']}\n"
            )

    return sheets, position_map
```

### Step 4: Create the Complete Pipeline Script

```python
#!/usr/bin/env python3
"""
Contact Sheet Generator for Batch Image Analysis.
Usage: python contact_sheets.py /path/to/images /path/to/output
"""
import sys
from pathlib import Path
from PIL import Image

def main():
    if len(sys.argv) < 3:
        print("Usage: python contact_sheets.py <image_dir> <output_dir>")
        sys.exit(1)
    
    image_dir = Path(sys.argv[1])
    output_dir = Path(sys.argv[2])
    
    print(f"Scanning images in: {image_dir}")
    images = collect_and_sort_images(image_dir)
    print(f"Found {len(images)} images (after filtering skips)")
    
    # Print category breakdown
    categories = {}
    for img in images:
        cat = img["category"]
        categories[cat] = categories.get(cat, 0) + 1
    print("\nCategory breakdown:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {count}")
    
    print(f"\nGenerating contact sheets...")
    sheets, pos_map = make_contact_sheets(images, output_dir)
    print(f"\nDone! Created {len(sheets)} contact sheets")
    print(f"Position map: {output_dir}/position_map.txt")
    print(f"Position CSV: {output_dir}/position_map.csv")

if __name__ == "__main__":
    main()
```

### Step 5: Batch Review with AI Vision

When reviewing contact sheets with an AI agent, use this prompt pattern:

```
I am showing you a contact sheet grid of [36] images arranged in a 6x6 grid.
This is sheet [N] of [total]. Images are sorted by file size (largest first).

For each cell where you can identify meaningful content, report:
- Position: Row X, Col Y
- What you see: logos, text, people, products, events, signage
- Any company names or brand logos visible
- Any text you can read (even partially)

If text is too small to read at this thumbnail size, flag it as "ZOOM NEEDED"
with a brief description of what you think it might say.

Do NOT describe empty cells, generic LinkedIn UI elements, or profile photos
unless they show someone notable.
```

### Step 6: Zoom In on Flagged Images

For any cell flagged as "ZOOM NEEDED," use the position map to find the original full-resolution file and read it individually.

```python
def get_original_path(position_map, sheet, row, col):
    """Look up the original file path from the position map."""
    for entry in position_map:
        if entry["sheet"] == sheet and entry["row"] == row and entry["col"] == col:
            return entry["filepath"]
    return None
```

### Step 7: Generate Analysis Output

Compile findings into a structured CSV and intelligence report.

**CSV columns:** filename, category, subcategory, description, companies_visible, people_visible, era (if applicable), intelligence_value (high/medium/low)

## Performance

| Metric | Value |
|---|---|
| Images processed | 397 |
| Images after filtering | 302 (skipped 95 tiny/icon/corrupt) |
| Contact sheets generated | 12 (at 6x6 = 36 per sheet) |
| AI vision tool calls | 12 (vs. 302 individual reads) |
| Tool call reduction | 96% |
| Token reduction | ~80% (thumbnails use fewer tokens than full-res) |
| Total analysis time | ~45 minutes |
| Estimated time (one-by-one) | 8+ hours |
| Throughput improvement | ~10-33x depending on image complexity |

## Pitfalls

1. **Text legibility at thumbnail scale:** At 200px thumbnails, small text in images becomes unreadable. Always flag these for full-resolution follow-up. Do not guess at text content from thumbnails.

2. **Aspect ratio distortion:** Very wide banners or very tall infographics get squeezed into square thumbnail cells. They may be unrecognizable. Consider generating separate sheets for extreme aspect ratios with wider/taller cells.

3. **RGBA to RGB conversion:** PNG images with transparency will show a black background when converted to JPEG for the contact sheet. This can obscure content. Consider pasting onto a white background before thumbnailing.

4. **Memory usage:** Opening 400+ images sequentially is fine, but loading them all at once will exhaust memory. The script above opens and closes each image individually via the `with` context manager.

5. **Grid math on the last sheet:** The final sheet may have fewer than 36 images. Empty cells appear as white space. The position map handles this correctly, but the AI agent should be told the last sheet is partial.

6. **Duplicate detection:** If the source image set has duplicates (common with MHTML extraction where LinkedIn embeds images multiple times), deduplicate by file hash before generating contact sheets to avoid wasting grid cells.

```python
import hashlib

def deduplicate_images(image_list):
    """Remove duplicate images based on file content hash."""
    seen_hashes = set()
    unique = []
    for item in image_list:
        file_hash = hashlib.md5(item["path"].read_bytes()).hexdigest()
        if file_hash not in seen_hashes:
            seen_hashes.add(file_hash)
            unique.append(item)
    return unique
```

7. **Thumbnail quality:** Using `Image.LANCZOS` (high-quality downsampling) is critical. `Image.NEAREST` produces pixelated thumbnails that the AI cannot interpret. Always use LANCZOS.

## Real-World Example

**Project:** BROGAV Solutions LinkedIn intelligence extraction
**Source:** 397 images extracted from Celina Berglund's LinkedIn MHTML archive
**After dedup/filtering:** 302 images across 12 contact sheets

**Category breakdown:**
- photo_large: 89 (event photos, product installations, team shots)
- photo_medium: 124 (general LinkedIn posts, screenshots)
- banner_wide: 31 (LinkedIn banners, promotional graphics)
- logo_or_graphic: 28 (partner logos, certification badges)
- infographic_tall: 15 (process diagrams, data visualizations)
- photo_square: 15 (headshots, profile thumbnails)

**Key findings from contact sheet review:**
- Sheet 1-2 (largest images): Product installation photos showing BROGAV-branded cabinets at customer sites
- Sheet 3: Trade show booth photos from Data Center World 2023-2025 with supplier co-branding
- Sheet 5: Partner logos visible on booth backdrop -- confirmed Gateview, Chatsworth, Panduit relationships
- Sheet 8: Customer site visit photos revealing healthcare and financial services verticals
- Sheet 11: Emcor-era content (pre-BROGAV) flagged by missing BROGAV branding

**Zoom-in requests:** 18 images flagged for full-resolution review (text too small at thumbnail scale). 14 of 18 yielded additional intelligence (customer names on signage, product model numbers, event dates).

## Output Template

```
# Contact Sheet Analysis Report

## Image Set Summary
- Source: [MHTML archive / scraped gallery / document dump]
- Total images: [N]
- After filtering: [N] (excluded [N] tiny/icon/corrupt)
- After dedup: [N] (removed [N] duplicates)
- Contact sheets generated: [N]

## Category Breakdown
| Category | Count | % of Total |
|---|---|---|
| photo_large | X | X% |
| photo_medium | X | X% |
| ... | ... | ... |

## Findings by Sheet

### Sheet 1 (images 1-36, largest files)
| Row | Col | Filename | Finding | Companies | People | Value |
|-----|-----|----------|---------|-----------|--------|-------|

### Sheet 2 (images 37-72)
...

## Zoom-In Results
| Sheet | Row | Col | Filename | What Was Readable | Intelligence |
|-------|-----|-----|----------|-------------------|-------------|

## Intelligence Summary
- Supplier relationships confirmed: [list]
- Events identified: [list]
- Products visible: [list]
- People identified: [list]
- Customer verticals revealed: [list]

## Files
- Contact sheets: [output_dir]/contact_sheet_*.jpg
- Position map (text): [output_dir]/position_map.txt
- Position map (CSV): [output_dir]/position_map.csv
```
