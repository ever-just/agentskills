# Visual Intelligence Extraction

## Overview

Extract business intelligence from video frames — facilities, products, team, branding, equipment — using frame extraction + AI multimodal vision. A 2-minute YouTube vlog can yield 7+ intelligence findings that NO text source (transcripts, websites, aggregators, filings) could reveal. Visual analysis is not optional — it's a distinct intelligence layer.

## When to Use

- Target company has YouTube videos showing offices, warehouses, products
- "Day in the Life" or vlog content exists
- Event/conference videos with sponsor banners
- Product demo videos with visible brand names/models
- Any video where WHAT YOU SEE matters more than what's said

## Prerequisites

- **yt-dlp** — video download (`pip install yt-dlp`)
- **ffmpeg** — frame extraction (`brew install ffmpeg`)
- **Multimodal AI model** — Claude (Read tool on JPG) or GPT-4V for frame analysis
- **Pillow** — optional, for building contact sheets when frame count exceeds 20 (`pip install Pillow`)

## Method

### Step 1: Download Video

Download at 720p — sufficient resolution for visual analysis, saves bandwidth and disk.

```bash
yt-dlp -f "bestvideo[height<=720]+bestaudio/best[height<=720]" \
  --merge-output-format mp4 -o "VIDEO_ID.mp4" VIDEO_URL
```

For metadata-only checks (duration, title, upload date) before committing to download:

```bash
yt-dlp --skip-download --print "%(title)s | %(duration)s | %(upload_date)s" VIDEO_URL
```

### Step 2: Extract Frames

Choose extraction rate based on video length:

```bash
# Short video (<2 min): 1 frame every 5 seconds
ffmpeg -i video.mp4 -vf "fps=1/5" frames/frame_%03d.jpg

# Medium video (2-10 min): 1 frame every 10 seconds
ffmpeg -i video.mp4 -vf "fps=1/10" frames/frame_%03d.jpg

# Long video (10+ min): 1 frame every 30 seconds
ffmpeg -i video.mp4 -vf "fps=1/30" frames/frame_%03d.jpg

# Keyframes only (scene changes — most efficient for edited content)
ffmpeg -i video.mp4 -vf "select='eq(pict_type,I)'" -vsync vfr frames/keyframe_%03d.jpg
```

### Step 3: Build Contact Sheet (if >20 frames)

Grid frames into a 6x6 contact sheet for batch review. This reduces tool calls by 30x.

```python
from PIL import Image
import glob

frames = sorted(glob.glob('frames/*.jpg'))
cols, rows = 6, 6
thumb_size = (200, 150)

sheet = Image.new('RGB', (cols * thumb_size[0], rows * thumb_size[1]), 'white')
for i, frame_path in enumerate(frames[:36]):
    img = Image.open(frame_path).resize(thumb_size, Image.LANCZOS)
    x = (i % cols) * thumb_size[0]
    y = (i // cols) * thumb_size[1]
    sheet.paste(img, (x, y))

sheet.save('contact_sheet.jpg', quality=85)
```

If more than 36 frames, generate multiple sheets and analyze sequentially.

### Step 4: AI Vision Analysis

Analyze each frame (or contact sheet) systematically. For every frame where content is identifiable, report:

1. **FACILITY** — Office or warehouse? Commercial or residential? Size estimate?
2. **PRODUCTS** — Equipment visible? Brand names? Model numbers? Condition?
3. **PEOPLE** — How many? Roles (from clothing/context)? Gender? Family?
4. **BRANDING** — Company logos? Partner logos? Event banners? Merchandise?
5. **SIGNAGE** — Readable text? Addresses? Phone numbers? Certifications on walls?
6. **EQUIPMENT** — Vehicles? Forklifts? Computers? Software on screen?
7. **SCALE** — Inventory levels? Number of bays? Parking lot size? Attendee count?

### Step 5: Cross-Reference Against Dossier

Compare visual findings against existing text-based intelligence:

- "Commercial office" claim → does the video show residential walls and carpet?
- "10 employees" → how many people visible?
- "Fleet of vehicles" → personal car with no branding?
- "Enterprise customers" → customer site shows 8 cabinets, not hyperscale?

Visual evidence CONFIRMS or CONTRADICTS text claims. Flag discrepancies.

## Checklist by Video Type

### Vlogs / Day in the Life
- [ ] Office type (home vs. commercial vs. coworking)
- [ ] Vehicle (company truck? Personal car? Branded?)
- [ ] Team members visible (count, roles)
- [ ] Computer/software visible on screen
- [ ] Family members (founder concentration signal)
- [ ] Neighborhood/location clues

### Product Demos
- [ ] Brand names on equipment (manufacturer ID)
- [ ] Model numbers visible (SKU validation)
- [ ] Packaging (new vs. refurbished indicators)
- [ ] Condition (scratches, dents, wear)
- [ ] Shipping/logistics setup

### Events / Conferences
- [ ] Booth size and positioning (budget signal)
- [ ] Sponsor banner logos (partnership evidence)
- [ ] Attendee count estimate
- [ ] Speaking slot (stage, panel, or just booth?)
- [ ] Other company reps visible

### Facility Tours
- [ ] Square footage estimate (ceiling tiles, people for scale)
- [ ] Loading dock (truck access = real warehouse)
- [ ] Racking systems (inventory capacity)
- [ ] Office area (desks = headcount)
- [ ] Vehicles in parking lot (employee count)
- [ ] Signage (address, hours, certifications)

## Anti-Patterns

- **Don't skip short videos** — even 30-second Shorts show products/facilities
- **Don't ignore backgrounds** — certificates on walls, whiteboards, signage all carry intel
- **Don't assume professional = large** — home office does not mean small revenue
- **Don't download full video if you only need frames** — use `--skip-download` for metadata, download only when visual analysis is needed
- **Don't analyze blurry frames** — flag as "ZOOM NEEDED" and re-extract at higher resolution or specific timestamp

## Real-World Results

**BROGAV Solutions case study (June 2026):**

- 1 video (2 minutes, "CEO Data Center Day in the Life")
- 25 frames extracted at fps=1/5
- 7 NEW findings not discoverable from any text source:

| # | Finding | Intel Category |
|---|---------|----------------|
| 1 | Daily work is HOME-BASED, not commercial office | Facilities |
| 2 | Husband/partner exists (unnamed) | People |
| 3 | MacBook Pro + Microsoft 365 confirmed | Tech stack |
| 4 | CapCut used for video editing | Marketing tools |
| 5 | No company vehicle fleet | Operations |
| 6 | BROGAV-branded hard hat (field PPE) | Brand |
| 7 | Customer DC is mid-market (~8 cabinets, mini-split) | Customer segment |

**Total time:** 5 min download + 1 min frame extraction + 10 min visual review = 16 minutes for 7 findings.

**Key insight:** Visual analysis is a distinct intelligence layer. Text sources (transcripts, websites, aggregators, filings) cannot reveal what only the camera captures.
