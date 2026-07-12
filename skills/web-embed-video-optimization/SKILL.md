---
name: web-embed-video-optimization
description: Optimize and embed an existing video as a fast, crisp, autoplaying hero/background/loop on a website. Use when adding or replacing a video on a marketing site and it is too heavy, will not autoplay (especially on mobile/Safari), shows a codec error, or looks soft — to transcode it to web-safe H.264 with the right pixel format, faststart, retina-aware sizing, and a poster frame, then embed and verify it actually plays. This is optimization + embedding of footage you already have, not creating/animating a video (for that use remotion/moviepy/motion-canvas). Use when the user says "add this video to the site", "the hero video is too big / won't play / isn't crisp", "replace the homepage video", or "make this loop on the landing page".
---

# Web Embed Video Optimization

Turn a source clip (screen recording, phone export, HEVC render) into a **fast,
crisp, reliably-autoplaying** hero/background/loop and embed it. The win is
usually large: retina-aware H.264 at a sane CRF takes a 1080p screen recording
from ~8 MB to ~1.5 MB with **no visible loss**, and fixes autoplay/codec issues.

For *creating* or animating video, use [[remotion]] / [[moviepy]] /
[[motion-canvas]] instead — this skill optimizes footage you already have.

## When to use

- Adding/replacing a hero, background, or looping demo video on a site.
- The video is too heavy, won't autoplay (mobile/Safari), errors on a codec, or
  looks soft.

## Recipe

### 1. Probe first
```bash
ffprobe -v error -select_streams v:0 \
  -show_entries stream=codec_name,width,height,r_frame_rate,duration,pix_fmt,profile \
  -of default=noprint_wrappers=1 in.mp4
ffprobe -v error -select_streams a -show_entries stream=codec_name -of csv=p=0 in.mp4   # audio?
# faststart check: is 'moov' before 'mdat'? (moov at end = slow start)
```

### 2. Transcode (web-safe + retina-aware)
```bash
ffmpeg -y -i in.mp4 -vf "scale=1600:-2" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 23 -preset slow \
  -movflags +faststart -an -r 30 out.mp4
```
- **`-pix_fmt yuv420p`** — mandatory for Safari/broad support (yuv444/422 won't play).
- **`-movflags +faststart`** — moves the moov atom to the front so it starts before
  fully downloaded. Without it, an autoplay hero stalls on slow links.
- **`-an`** — strip audio; a muted background loop never needs it (smaller file).
- **`scale=1600:-2`** — encode to roughly **2× the CSS display width**, not native
  1080p/4K. At a ≤820px frame, 1600px is retina-crisp and much lighter. `-2` keeps
  height even (required by H.264).
- **`-crf 23 -preset slow`** — high quality, good compression. Screen/UI content
  compresses especially well; bump CRF to 25–26 only if the file is still heavy.

### 3. Poster frame
```bash
ffmpeg -y -ss 3 -i in.mp4 -vframes 1 -vf "scale=1600:-2" -q:v 3 poster.jpg
```
Pick a representative moment (`-ss`), not a blank intro frame.

### 4. Embed
```html
<video autoplay muted loop playsinline preload="auto" poster="/path/poster.jpg">
  <source src="/path/out.mp4" type="video/mp4"/>
</video>
```
- **`muted` + `playsinline` + `autoplay`** are all required for mobile autoplay.
- Container CSS: `video{display:block;width:100%;height:auto}` lets a 16:9 clip set
  its own height; wrap in a frame with `overflow:hidden;border-radius`.

### 5. Serve (Odoo tenants)
Store as a **public `ir.attachment`** and reference `/web/content/<id>` (video) and
`/web/image/<id>` (poster) — see [[everjust-website-customization]]. Transfer the
binary in via `docker cp` (the shell runs inside the container). Use **fresh
attachment IDs** and repoint the view, rather than overwriting old IDs, to dodge
stale browser/CDN cache. View edits need a container restart to render.

## Verify (mandatory)

Confirm it actually plays with [[cdp-render-verification]] — launch Chrome with
`--autoplay-policy=no-user-gesture-required`, then read the `<video>` element:

- `readyState` === 4 (HAVE_ENOUGH_DATA), `paused` === false, `currentTime` > 0
  after a short wait (advancing), and `videoWidth`/`videoHeight` match the encode.
- Check **desktop and mobile**, and that the page has no horizontal overflow.

## Related

- [[everjust-website-customization]] — serving via Odoo attachments + view embed.
- [[cdp-render-verification]] — the playback proof.
- [[remotion]] / [[moviepy]] — creating/animating video (the opposite job).
