# Video Intelligence Extraction

## Overview

Extract actionable intelligence from video content across YouTube, Vimeo, and company websites. Video reveals what text sources cannot: facility scale, team composition, product demonstrations, signage, event attendance, and operational reality.

This skill focuses on metadata + caption extraction (fast, free, no storage cost) and only downloads actual video files when visual analysis is required.

---

## When to Use

- Target company has a YouTube channel (even a small one — Shorts count)
- Founder or leadership appears in podcast/interview videos
- Product demos or walkthroughs exist on any platform
- Event recordings show the company's booth, presentations, or attendance
- You need to verify claims (facility size, team count, product range) with visual evidence
- Company website has embedded video content

---

## Prerequisites

| Tool | Install | Purpose |
|------|---------|---------|
| yt-dlp | `pip install yt-dlp` or `brew install yt-dlp` | Video metadata/caption download |
| Python 3.10+ | System | VTT parsing, automation |
| Whisper (optional) | `pip install openai-whisper` | Transcription when no captions exist |
| ffmpeg (optional) | `brew install ffmpeg` | Audio extraction for Whisper |

---

## Phase 1: Discovery

### YouTube Channel Enumeration

```bash
# List ALL videos on a channel (returns video IDs + titles, no download)
yt-dlp --flat-playlist --print "%(id)s %(title)s" "https://www.youtube.com/@CHANNEL_HANDLE"

# Include upload dates for timeline analysis
yt-dlp --flat-playlist --print "%(upload_date)s %(id)s %(title)s" "https://www.youtube.com/@CHANNEL_HANDLE"
```

### YouTube Search

```bash
# Search YouTube (top 10 results)
yt-dlp --flat-playlist --print "%(id)s %(title)s" "ytsearch10:COMPANY_NAME"

# Broader search (top 30)
yt-dlp --flat-playlist --print "%(id)s %(title)s" "ytsearch30:COMPANY_NAME founder interview"
```

### Other Discovery Methods

| Source | Method |
|--------|--------|
| Google Video search | `site:youtube.com "Company Name"` |
| Company website | Inspect source for `<iframe src="youtube.com/embed/...">` |
| Vimeo | `yt-dlp --flat-playlist "https://vimeo.com/USER"` |
| LinkedIn | Manual browse — videos cannot be enumerated programmatically |
| Event platforms | Check Sched/Emamo session pages for embedded video links |

### Discovery Checklist

- [ ] Target company's own YouTube channel
- [ ] Founder/CEO personal channel or guest appearances
- [ ] Industry podcast channels where target was interviewed
- [ ] Event/conference channels with target's presentations
- [ ] Partner/supplier channels mentioning target
- [ ] Local news/media channels covering target

---

## Phase 2: Capture

### Metadata + Captions (Default — No Video Download)

```bash
# Entire channel — metadata + auto-captions, no video files
yt-dlp --write-info-json --write-auto-sub --sub-lang en --skip-download \
  --sleep-interval 2 "https://www.youtube.com/@CHANNEL"

# Single video
yt-dlp --write-info-json --write-auto-sub --sub-lang en --skip-download \
  "https://www.youtube.com/watch?v=VIDEO_ID"

# Multiple specific videos from a list
yt-dlp --write-info-json --write-auto-sub --sub-lang en --skip-download \
  --sleep-interval 2 -a video_urls.txt
```

### Key yt-dlp Flags

| Flag | Purpose |
|------|---------|
| `--write-info-json` | Saves full metadata (title, date, duration, description, tags, view count) |
| `--write-auto-sub` | Downloads auto-generated captions |
| `--sub-lang en` | English captions only |
| `--skip-download` | No video/audio file — metadata only |
| `--sleep-interval 2` | Rate limiting (critical for channels with 30+ videos) |
| `--flat-playlist` | List mode — enumerate without downloading anything |
| `-f "bestvideo[height<=720]+bestaudio"` | Download video at reasonable quality |
| `-x --audio-format mp3` | Extract audio only (for Whisper) |

### Download Video Files (When Visual Analysis Needed)

```bash
# 720p max (good balance of quality vs. file size)
yt-dlp -f "bestvideo[height<=720]+bestaudio" --merge-output-format mp4 VIDEO_URL

# Audio only for Whisper transcription
yt-dlp -x --audio-format mp3 VIDEO_URL
```

### Output File Structure

```
project/
├── raw/video/
│   ├── Title of Video [VIDEO_ID].info.json    # Metadata
│   ├── Title of Video [VIDEO_ID].en.vtt       # Auto-captions (VTT format)
│   └── Title of Video [VIDEO_ID].mp4          # Video file (only if downloaded)
├── transcripts/
│   ├── VIDEO_ID_transcript.txt                # Parsed plain text
│   └── VIDEO_ID_transcript.txt
└── analysis/
    └── video_intelligence_summary.md
```

---

## Phase 3: VTT Parsing

### Convert VTT Captions to Plain Text

```python
import re
import glob

def vtt_to_text(vtt_path):
    """Parse VTT subtitle file to clean plain text."""
    with open(vtt_path) as f:
        content = f.read()
    # Remove WEBVTT header and metadata
    content = re.sub(r'WEBVTT.*?\n', '', content, flags=re.DOTALL)
    # Remove timestamp lines
    content = re.sub(r'\d{2}:\d{2}:\d{2}\.\d+ --> .*', '', content)
    # Remove HTML-style formatting tags
    content = re.sub(r'<[^>]+>', '', content)
    # Deduplicate consecutive repeated lines and join
    lines = []
    for l in content.split('\n'):
        l = l.strip()
        if l and not l.isdigit() and (not lines or l != lines[-1]):
            lines.append(l)
    return ' '.join(lines)


def batch_parse_vtts(vtt_dir, output_dir):
    """Parse all VTT files in a directory to plain text."""
    import os
    os.makedirs(output_dir, exist_ok=True)
    for vtt_file in glob.glob(f"{vtt_dir}/*.vtt"):
        text = vtt_to_text(vtt_file)
        # Extract video ID from filename pattern "Title [VIDEO_ID].en.vtt"
        video_id = re.search(r'\[([^\]]+)\]', vtt_file)
        if video_id:
            out_name = f"{video_id.group(1)}_transcript.txt"
        else:
            out_name = os.path.basename(vtt_file).replace('.en.vtt', '_transcript.txt')
        with open(os.path.join(output_dir, out_name), 'w') as f:
            f.write(text)
        print(f"Parsed: {out_name} ({len(text.split())} words)")
```

---

## Phase 4: Whisper Fallback (No Captions Available)

When auto-captions don't exist (common for Shorts, older videos, non-English content):

```bash
# Download audio only
yt-dlp -x --audio-format mp3 -o "%(id)s.%(ext)s" VIDEO_URL

# Transcribe with Whisper
whisper VIDEO_ID.mp3 --model base --language en --output_format txt

# For better proper noun accuracy (3-5x slower):
whisper VIDEO_ID.mp3 --model medium --language en --output_format txt
```

### When Captions Typically Don't Exist

- YouTube Shorts (< 60 seconds)
- Videos uploaded before ~2015 (pre-auto-caption era)
- Unlisted/private videos
- Music-heavy content with minimal speech
- Non-English content without specified language

---

## Phase 5: Intelligence Extraction

### Metadata Intelligence (from info.json)

Every `.info.json` file contains:

| Field | Intelligence value |
|-------|-------------------|
| `upload_date` | Timeline of company activity and content strategy |
| `duration` | Short = promo; Long = substantive interview |
| `description` | Often contains links, names, timestamps, partner mentions |
| `tags` | SEO strategy, self-identified categories |
| `view_count` | Which content resonates with their audience |
| `like_count` | Engagement quality signal |
| `channel` | Who published it (their channel vs. guest appearance) |

### Transcript Intelligence Checklist

- [ ] Named people (employees, partners, clients)
- [ ] Revenue/growth figures mentioned casually in interviews
- [ ] Future plans or strategy discussed
- [ ] Pain points or challenges admitted
- [ ] Competitor mentions (positive or negative)
- [ ] Hiring plans or team size references
- [ ] Product roadmap or feature announcements
- [ ] Customer names or case studies mentioned verbally

### Visual Intelligence Checklist (Requires Video Download)

- [ ] Facility/warehouse size and condition
- [ ] Number of employees visible (team size proxy)
- [ ] Products on shelves or in demos (inventory breadth)
- [ ] Equipment and machinery (capital investment signals)
- [ ] Signage, branding, and logo usage
- [ ] Event booth size and design quality
- [ ] Vehicle fleet (delivery capability)
- [ ] Customer interactions caught on camera
- [ ] Geographic/location identifiers in background

---

## Edge Cases and Gotchas

1. **YouTube rate limiting** — Use `--sleep-interval 2` between downloads. DNS errors appear after 30+ rapid requests. For large channels, break into batches of 20.

2. **Channel download filenames** — yt-dlp names files as "Title [VIDEO_ID].ext" when downloading from channels. Spaces and special characters in titles break shell scripts. Use `-o "%(id)s.%(ext)s"` for clean filenames.

3. **Duplicate uploads** — Same interview uploaded under different channels or titles. Cross-reference by duration + upload_date to catch duplicates before spending time analyzing both.

4. **LinkedIn native videos** — CANNOT be downloaded programmatically. LinkedIn CDN URLs are authenticated and expire within hours. Flag as manual task: "Save as Web Complete" in browser, or screenshot key frames.

5. **Shorts vs. full videos** — Shorts URL format is `youtube.com/shorts/ID` but yt-dlp handles both formats transparently. Don't skip Shorts — they often show products, facilities, and team culture.

6. **Unlisted videos** — Not in channel listings but accessible via direct URL. Search engines may have indexed them. Check Google cache and Wayback Machine for unlisted URLs that were once linked publicly.

7. **Auto-caption quality** — No punctuation, sometimes garbled proper nouns (Celina → Selena, BROGAV → ProGraph). 95%+ word accuracy for standard English speech. Always verify company/person names against known-good sources.

8. **Upload date vs. content date** — Videos may be uploaded weeks or months after recording. Check description and audio cues for actual recording date. Event videos especially lag.

9. **info.json is gold** — Always capture with `--write-info-json`. The description field often contains timestamps, guest names, links to resources, and partner mentions that aren't in the video itself.

10. **VTT timestamps are valuable** — The plain-text conversion loses temporal information. Keep original VTT files as source of truth. Timestamps let you find specific moments for visual verification.

---

## Anti-Patterns

| Don't | Do instead |
|-------|-----------|
| Ignore Shorts because they're short | Review Shorts for visual intel (products, facility, team) |
| Assume all videos have captions | Check; fall back to Whisper for uncaptioned content |
| Download video files by default | Start with `--skip-download`; only get video for visual analysis |
| Try to automate LinkedIn video download | Flag as manual task; CDN URLs are authenticated |
| Trust upload_date as content date | Cross-reference with description, audio cues, event dates |
| Download entire channel at once without rate limiting | Use `--sleep-interval 2` and batch into groups of 20 |
| Parse only transcripts, ignore info.json | Metadata contains names, links, tags not in the audio |
| Treat video as inferior to text sources | Video uniquely confirms physical reality (facility, team, products) |

---

## Decision Tree

```
Content is on YouTube?
├── YES → yt-dlp --write-info-json --write-auto-sub --skip-download
│   ├── Has captions? → Parse VTT to text → Extract intelligence
│   └── No captions?
│       ├── Video > 60s with speech? → yt-dlp -x → Whisper → Analyze
│       └── Short/visual only? → Download video → Visual analysis
└── NO →
    ├── Vimeo → yt-dlp supports it (same workflow as YouTube)
    ├── LinkedIn video → Manual "Save as Web Complete" (flag as manual task)
    ├── Company website embed → Extract iframe URL → usually YouTube/Vimeo
    └── Other platform → Check yt-dlp supported sites list
```

---

## Real-World Results (BROGAV Case Study)

| Metric | Value |
|--------|-------|
| Total videos discovered | 45 (9 full-length, 36 Shorts) |
| VTT caption files captured | 10 |
| Transcripts parsed to text | 10 |
| Substantive interviews analyzed | 2 (5,000+ words each) |
| Podcast via RSS/Whisper fallback | 1 (6,489 words) |
| Duplicate videos caught | 1 (same interview, two channels) |
| Unique intelligence extracted | Founder origin story, revenue signals, growth plans, supplier relationships, facility details, team culture |
| Visual intelligence from Shorts | Product range, warehouse layout, branded cabinet line, seasonal inventory |

---

## Integration with Other Skills

| Skill | Integration point |
|-------|------------------|
| `deep-research` | Video is Phase 3/4 source alongside web search |
| `intelligence-dossier` | Video transcripts feed People, Products, Financial Signals sections |
| `client-discovery-osint` | Customer testimonial videos name clients directly |
| `supplier-verification` | Product demo videos show supplier logos and branded products |
| `era-validated-linkedin-analysis` | Video upload dates cross-reference LinkedIn activity timeline |
| `contact-sheet-image-analysis` | Video screenshots can be batch-analyzed via thumbnail grids |
