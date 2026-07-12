---
name: svg-logo-brand-asset-pipeline
description: Design a vector brand mark (logo/icon) as hand-authored SVG, then programmatically export it to every size and format a real product needs (favicon.ico, apple-touch-icon, PWA manifest icons, header mark) using cairosvg + Pillow — no design tool required. Also covers normalizing third-party sourced logos (e.g. from a logo API) to a consistent monochrome treatment: keying out a solid background, flattening, grayscale, autocontrast, and autocropping, for use cases like a provider/partner logo wall. Use when asked to create a new logo/favicon/icon set, or to clean up a set of differently-styled sourced logos into one consistent look.
---

# SVG Logo & Brand Asset Pipeline

Produce a real, deployable icon/logo set from a design brief, entirely in code: draft the mark as
SVG, render it to a contact sheet at multiple sizes to iterate visually, then export the final
production asset set. Also covers the adjacent problem of taking *someone else's* logos (fetched
from a logo API or scraped) and normalizing them into one consistent monochrome style.

## When to use this skill

- Designing a new product/brand mark from a brief (e.g. "a tree in a rounded square, black and
  white") and needing production-ready assets: `favicon.ico`, `apple-touch-icon.png`, PWA manifest
  icons, an SVG for crisp display at any size, a header-sized mark.
- Normalizing a set of third-party logos (fetched via a logo API, scraped from sites) that arrive
  in inconsistent styles (some transparent, some on solid colored backgrounds, full color vs
  monochrome) into one consistent treatment — e.g. for a "supported integrations" logo wall.

**Do NOT use this skill for**: motion/animated logos (see `lottie-animation`), full brand
identity systems (typography, color palette, voice) beyond the mark itself, or video assets (see
`remotion`/`moviepy`).

## Setup

```bash
pip install cairosvg pillow
```

No Node/browser dependency — `cairosvg` renders SVG to PNG directly; Pillow does raster
post-processing (compositing, grayscale, autocrop).

## Pattern 1: design and iterate a new mark

Draft candidate SVGs by hand (simple geometric shapes — circles, paths, rects — compose better at
small sizes than intricate detail). Render each candidate at multiple sizes into one contact
sheet so you can judge legibility at favicon size *before* committing:

```python
import cairosvg
from PIL import Image

SIZES = [512, 180, 64, 32, 16]  # full mark, apple-touch, tab, small tab, tiny favicon

for size in SIZES:
    cairosvg.svg2png(url="candidate.svg", write_to=f"candidate_{size}.png",
                      output_width=size, output_height=size)

# Build a side-by-side contact sheet to inspect all sizes at once
sheet = Image.new("RGB", (sum(SIZES) + 40, 200), (240, 240, 239))
x = 10
for size in SIZES:
    im = Image.open(f"candidate_{size}.png").convert("RGBA")
    sheet.paste(im, (x, 20), im)
    x += size + 10
sheet.save("contact_sheet.png")
```

**Judge at the smallest size first, not the largest.** A mark that looks great at 512px but
becomes an illegible blob at 16px (browser tab favicon) is a failed design for this use case —
iterate until the *small* rendering reads clearly, then the large one almost always looks fine
too. Prefer bold, simple silhouettes over fine detail or thin strokes, which disappear or alias
badly under 32px.

## Pattern 2: export the production asset set

Once a mark is finalized as SVG, generate every format a real web app needs:

```python
import cairosvg

MASTER = "logo-final.svg"

# Scalable favicon (modern browsers read this directly)
cairosvg.svg2png(url=MASTER, write_to="icon.svg")  # keep the SVG itself as one output too

# Apple touch icon — exactly 180x180, PNG (not SVG; iOS doesn't accept SVG here)
cairosvg.svg2png(url=MASTER, write_to="apple-icon.png", output_width=180, output_height=180)

# Multi-size favicon.ico — small sizes often need MORE contrast/simplification than the
# master; if the master gets muddy at 16-32px, render a deliberately simplified variant
# for these sizes rather than just downscaling the detailed master.
from PIL import Image
imgs = []
for size in [16, 32, 48]:
    p = f"/tmp/fav_{size}.png"
    cairosvg.svg2png(url="logo-simplified.svg", write_to=p, output_width=size, output_height=size)
    imgs.append(Image.open(p).convert("RGBA"))
imgs[0].save("favicon.ico", sizes=[(16,16),(32,32),(48,48)], append_images=imgs[1:])

# PWA manifest icons
for size in [192, 512]:
    cairosvg.svg2png(url=MASTER, write_to=f"icon-{size}.png", output_width=size, output_height=size)
```

Wire the outputs into the app's manifest (sizes, `purpose: any`/`maskable`) and metadata —
framework-specific, but the asset generation above is framework-agnostic.

## Pattern 3: normalize third-party sourced logos to one monochrome style

Logos fetched from a logo API or scraped from company sites arrive in wildly inconsistent forms:
some transparent, some on a solid brand-colored background, some light-on-dark, some
full-color. For a use case like a "supported providers" wall that needs one consistent
monochrome look, normalize every logo through the same pipeline:

```python
from PIL import Image, ImageChops, ImageOps

def normalize_to_monochrome(src_path, dst_path):
    im = Image.open(src_path).convert("RGBA")
    w, h = im.size

    # 1. Detect a solid background by sampling all 4 corners; key it to transparent
    corners = [im.getpixel((0,0)), im.getpixel((w-1,0)), im.getpixel((0,h-1)), im.getpixel((w-1,h-1))]
    opaque = [c for c in corners if c[3] > 200]
    bg = None
    if len(opaque) >= 3:
        r = sum(c[0] for c in opaque) // len(opaque)
        g = sum(c[1] for c in opaque) // len(opaque)
        b = sum(c[2] for c in opaque) // len(opaque)
        if all(abs(c[0]-r) < 25 and abs(c[1]-g) < 25 and abs(c[2]-b) < 25 for c in opaque):
            bg = (r, g, b)
    if bg is not None:
        nd = [(pr,pg,pb,0) if abs(pr-bg[0])+abs(pg-bg[1])+abs(pb-bg[2]) < 70 else (pr,pg,pb,pa)
              for pr,pg,pb,pa in im.getdata()]
        im.putdata(nd)

    # 2. Flatten onto white, then grayscale
    white = Image.new("RGBA", im.size, (255,255,255,255))
    white.alpha_composite(im)
    gray = white.convert("L")

    # 3. Detect and fix light-on-dark-source logos (their gray histogram skews dark) —
    #    invert so the mark ends up dark-on-light like everything else in the set
    hist = gray.histogram()
    if sum(hist[:100]) > sum(hist[156:]):
        gray = ImageOps.invert(gray)

    # 4. Punch up contrast (fixes marks that came out too light/muddy after flattening)
    gray = ImageOps.autocontrast(gray, cutoff=1)

    # 5. Autocrop to the mark's actual bounding box, with a small pad, then re-square
    diff = ImageChops.difference(gray, Image.new("L", gray.size, 255))
    bbox = diff.getbbox()
    if bbox:
        pad = 10
        l, t, r, b = bbox
        gray = gray.crop((max(0,l-pad), max(0,t-pad), min(gray.size[0],r+pad), min(gray.size[1],b+pad)))
    side = max(gray.size)
    sq = Image.new("L", (side, side), 255)
    sq.paste(gray, ((side - gray.size[0])//2, (side - gray.size[1])//2))
    sq = sq.resize((256, 256), Image.LANCZOS)

    # 6. Make white transparent again so it composites onto any card background
    out = Image.new("RGBA", (256, 256))
    out.putdata([(v,v,v,0) if v >= 250 else (v,v,v,255) for v in sq.getdata()])
    out.save(dst_path)
```

Run every sourced logo through this one function so the whole set ends up visually consistent,
then spot-check a contact sheet (Pattern 1's technique) before shipping — automated normalization
occasionally over-inverts or over-crops an unusual source image, and it's cheap to catch visually.

## Pitfalls

**1. Judging a design only at large size.** Always render the smallest target size (16px
favicon) before finalizing — see Pattern 1. A logo that's a rich illustration at 512px is often
an unrecognizable smudge at 16px.

**2. One-size-fits-all export from a detailed master.** If the master SVG has fine detail, don't
just downscale it for the favicon.ico sizes — it'll look muddy. Either simplify the master itself
until it holds up small, or maintain a deliberately-simplified variant just for the tiny sizes
(Pattern 2 does this).

**3. Skipping the background-color detection step on sourced logos.** Naively converting a
fetched logo straight to grayscale without first keying out a solid colored/black background
leaves a visible box around the mark instead of a clean transparent cutout. Always sample the
corners and key the background first (Pattern 3, step 1).

**4. Not handling light-on-dark source logos.** A logo that was originally white-on-black (common
for "dark mode" brand assets) will flatten onto white as a near-invisible pale gray shape if you
skip the invert-detection step — it needs inverting *before* the grayscale/contrast steps, not
after.

**5. Forgetting `apple-icon.png` must be a real PNG, not SVG.** iOS/Safari's `apple-touch-icon`
convention does not accept SVG; always export a rasterized 180×180 PNG for it specifically, even
if every other icon is served as SVG.

## Combining with other skills

- **`lottie-animation`** — once a static mark is finalized, animate it (e.g. a loading spinner
  variant) as a separate deliverable.
- **`web-deploy-verification`** — after wiring the new assets into a manifest/metadata and
  deploying, verify the favicon/apple-touch-icon actually resolve (200, correct content-type) on
  the live site rather than assuming the build succeeded.
