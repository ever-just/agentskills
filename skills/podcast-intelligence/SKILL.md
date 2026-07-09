# Podcast Intelligence Extraction

Discover, download, and transcribe podcast episodes featuring a target company or individual. Extract structured intelligence from audio content that is not available via web scraping or API queries.

## When to Use

- Target company founder or executives appeared on podcasts
- Audio-only content exists that hasn't been transcribed
- YouTube search for podcast episodes returns no results (audio-only platforms)
- Need to capture intelligence from interviews (revenue hints, customer names, future plans)
- Web research has plateaued and you suspect unindexed audio content contains unique data points
- Dossier needs first-person quotes or self-reported metrics that only exist in spoken form

## Prerequisites

- Python 3.11+
- ffmpeg (`brew install ffmpeg`)
- OpenAI Whisper (`pip3 install openai-whisper`)
- curl (for downloads)
- Internet access for iTunes Lookup API
- yt-dlp (`pip3 install yt-dlp`) for YouTube-hosted podcast episodes

## Method

### Step 1: Discovery

Search for podcast appearances across multiple vectors:

```
web_search: "COMPANY_NAME" OR "FOUNDER_NAME" podcast interview episode
web_search: "COMPANY_NAME" site:podcasts.apple.com
web_search: "COMPANY_NAME" site:open.spotify.com
web_search: "FOUNDER_NAME" site:buzzsprout.com OR site:libsyn.com OR site:podbean.com
```

Also check:
- LinkedIn posts mentioning "podcast" or "interview" or "episode"
- Company website press/media page
- YouTube (many podcasts cross-post video versions with free auto-captions)
- Google Podcasts search (returns Apple Podcasts listings)
- Podcast-specific search engines: listennotes.com, podchaser.com

Log every discovered episode in a tracking table:

| # | Podcast Name | Episode Title | Date | Platform | URL | Status |
|---|---|---|---|---|---|---|
| 1 | Example Show | "Interview with Founder" | 2024-03-15 | Apple/BuzzSprout | url | Pending |

### Step 2: Get RSS Feed via iTunes Lookup API

Most podcasts distributed through Apple Podcasts expose an RSS feed. Extract the Apple Podcast ID from the URL and query the iTunes API:

```bash
# Find Apple Podcast ID from URL (e.g., podcasts.apple.com/podcast/id1525551829)
curl -s "https://itunes.apple.com/lookup?id=PODCAST_ID&entity=podcast" | \
  python3 -c "import json,sys; d=json.load(sys.stdin); print(d['results'][0]['feedUrl'])"
```

This returns the RSS feed URL (hosted on BuzzSprout, Libsyn, Anchor, Podbean, etc.)

If you cannot find the Apple Podcasts listing, try:
- Check the podcast's website footer for an RSS icon/link
- Look for "Subscribe" links that reveal the feed URL
- Search `site:feeds.buzzsprout.com "PODCAST_NAME"` or equivalent for other hosts

### Step 3: Parse RSS for Episode MP3 URL

```python
import re, urllib.request

rss = urllib.request.urlopen("RSS_FEED_URL").read().decode()
items = re.findall(r'<item>(.*?)</item>', rss, re.DOTALL)

for item in items:
    title = re.search(r'<title>(.*?)</title>', item)
    if 'TARGET' in (title.group(1) if title else '').lower():
        mp3 = re.search(r'<enclosure[^>]+url="([^"]+)"', item)
        date = re.search(r'<pubDate>(.*?)</pubDate>', item)
        duration = re.search(r'<itunes:duration>(.*?)</itunes:duration>', item)
        print(f"Title: {title.group(1)}")
        print(f"Date: {date.group(1) if date else 'unknown'}")
        print(f"Duration: {duration.group(1) if duration else 'unknown'}")
        print(f"MP3: {mp3.group(1) if mp3 else 'NOT FOUND'}")
```

Also parse `<description>` and `<itunes:summary>` tags for guest names, topics, and show notes. This avoids downloading irrelevant episodes.

### Step 4: Download Audio

```bash
# Some hosts (BuzzSprout) require User-Agent and ?download=true
curl -L -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" \
  -o episode.mp3 "MP3_URL?download=true"

# Verify it's actually audio (not an HTML error page)
file episode.mp3  # Should say "Audio file with ID3"

# If file reports HTML/text, the download was blocked. Try:
# 1. Add ?download=true parameter
# 2. Try a different User-Agent
# 3. Check if the URL has expired (some hosts use signed URLs)
```

For YouTube-hosted episodes (the preferred path when available):
```bash
# Download audio only + auto-generated subtitles
yt-dlp --extract-audio --audio-format mp3 --write-auto-sub --sub-lang en \
  -o "episode.%(ext)s" "YOUTUBE_URL"
```

### Step 5: Transcribe with Whisper

```python
import whisper

model = whisper.load_model('base')  # Use 'medium' for better proper noun accuracy
result = model.transcribe('episode.mp3', language='en')

with open('transcript.txt', 'w') as f:
    f.write(result['text'])

print(f"Words: {len(result['text'].split())}")
```

Model selection guide:
- `tiny` (75MB): Fast but poor proper noun handling. Use for initial pass to confirm relevance.
- `base` (139MB): Good balance of speed and accuracy. Default choice.
- `medium` (1.5GB): Significantly better proper noun recognition. Use when names matter.
- `large` (2.9GB): Best accuracy but slow on CPU. Use only when medium fails on critical names.

### Step 6: Intelligence Extraction

Read the transcript and extract structured intelligence into categories:

| Category | What to Look For | Example |
|---|---|---|
| Revenue/pricing | Dollar amounts, growth rates, pricing models | "We crossed $2M ARR last quarter" |
| Customers | Named clients, industry verticals, deal sizes | "We just onboarded [Company] for their 50 locations" |
| Employees | Names, roles, team size | "Our head of sales, Mike, joined from..." |
| Suppliers/products | Vendor names, product lines, sourcing | "We source our cabinets from [Manufacturer]" |
| Timeline | Founding date, milestones, growth markers | "We're 18 months in and have 12 employees" |
| Competition | Named competitors, positioning statements | "Unlike [Competitor], we focus on..." |
| Future plans | Expansion, hiring, product roadmap | "By Q4 we want to be in three new markets" |
| Personal background | Education, prior roles, motivations | "I spent 8 years at [Company] before starting this" |
| Industry relationships | Partnerships, associations, advisors | "Our advisor [Name] connected us with..." |

For each finding, note:
- Exact quote (or close paraphrase)
- Timestamp if using segment-level transcription
- Confidence level (verbatim quote = high, inferred from context = medium)
- Whether this is NEW intelligence or CONFIRMS existing dossier data

## Performance Benchmarks

| Episode Length | Model | Time (Apple Silicon CPU) | Words Output |
|---|---|---|---|
| 34 minutes | base (139MB) | 93 seconds | 6,489 |
| 27 minutes | base | ~70 seconds | ~5,000 |
| 60 minutes | base | ~180 seconds | ~12,000 |
| 34 minutes | medium (1.5GB) | ~8 minutes | 6,489 (better names) |

## Decision Tree

```
Is the podcast on YouTube?
├── YES → yt-dlp --write-auto-sub (free, no Whisper needed)
│         └── Auto-captions available? 
│             ├── YES → Use captions directly, skip Whisper
│             └── NO → Download audio, run Whisper
└── NO → Is it on a platform with RSS?
    ├── YES → iTunes API → RSS → MP3 → Whisper
    │         └── Download blocked?
    │             ├── Add ?download=true + User-Agent header
    │             └── Try alternate RSS enclosure URLs
    └── NO (Spotify exclusive) → Manual listening only
        └── Document as "uncapturable" with episode metadata
```

## Anti-Patterns and Lessons Learned

1. **Always check YouTube first** — many podcasts cross-post video versions that have free auto-captions (no Whisper needed). This saves 5-10 minutes per episode.

2. **BuzzSprout Cloudflare protection** — direct .mp3 URLs return HTML 403 pages. Must add `?download=true` query parameter and a browser User-Agent header.

3. **Libsyn 404s** — direct episode URLs from search results often 404 because Libsyn uses rotating/signed paths. Always use the RSS feed approach to get the current enclosure URL.

4. **Whisper proper noun weakness** — the base model renders unfamiliar names phonetically. "BROGAV" becomes "ProGraph", "Celina" becomes "Salina", "Berglund" becomes "Bergland". After transcription, do a find-and-replace pass using the known entity list from your dossier.

5. **Spotify exclusives are uncapturable** — no RSS feed, no download endpoint, no programmatic access. The in-app transcript feature is view-only with no export. Only option is manual listening and note-taking.

6. **Don't skip short episodes** — even 5-minute podcast appearances can contain unique intelligence. A single customer name drop or revenue figure justifies the effort.

7. **RSS feeds contain episode descriptions** — parse `<description>` and `<itunes:summary>` for guest names and topics BEFORE downloading audio. This saves downloading and transcribing irrelevant episodes.

8. **Date the content carefully** — podcast publication date does NOT equal recording date. "We're 18 months old" in a Jul 2023 episode means something different than in a Jan 2024 episode. Always note both the pub date and any self-dating statements in the audio.

9. **One podcast feed may have multiple relevant episodes** — search the full RSS for ALL team member names, not just the founder. A sales director's guest spot may reveal different intelligence than the CEO's.

10. **Transcripts degrade at episode boundaries** — intro/outro music, ad reads, and cross-talk produce garbage text. The intelligence is in the interview segment. Mentally (or programmatically) skip the first and last 2-3 minutes.

## Tools Required

| Tool | Purpose | Install |
|------|---------|---------|
| curl | HTTP requests, MP3 download | Built-in (macOS) |
| python3 | RSS parsing, Whisper orchestration | `brew install python` |
| openai-whisper | Speech-to-text transcription | `pip3 install openai-whisper` |
| ffmpeg | Audio format conversion (Whisper dependency) | `brew install ffmpeg` |
| yt-dlp | YouTube podcast episodes + subtitle download | `pip3 install yt-dlp` |

## Example Output

The skill produces a markdown file per episode with the following structure:

```markdown
# Podcast Transcript: [Episode Title]

## Metadata
| Field | Value |
|---|---|
| Podcast | [Show Name] |
| Episode | [Title] |
| Host | [Host Name] |
| Guest(s) | [Names] |
| Published | [Date] |
| Duration | [MM:SS] |
| Platform | Apple Podcasts / BuzzSprout |
| Source URL | [URL] |
| Transcription model | whisper-base |
| Word count | [N] |

## Full Transcript
[Complete text output from Whisper]

## Intelligence Extraction

| # | Finding | Category | Confidence | New/Confirms | Dossier File to Update |
|---|---|---|---|---|---|
| 1 | "We did $1.8M last year" | Revenue | High (verbatim) | NEW | 05_Financials/financial_signals.md |
| 2 | Guest mentions working with Acme Corp | Customer | Medium (casual mention) | NEW | 04_Market_and_Customers/client_list.md |
| 3 | "We have 14 people now" | Headcount | High (verbatim) | Confirms roster | 02_People_and_Organization/team_roster.csv |

## Cross-References
- Updates to: [list of dossier files that need updating based on findings]
- Contradictions: [any findings that conflict with existing dossier data]
- Follow-up needed: [questions raised that require additional research]
```

## Integration with Dossier Workflow

This skill is typically invoked during:
- Phase 3 (SEARCH) of the deep-research pipeline when audio sources are identified
- Intelligence-dossier assembly when web-only sources have been exhausted
- Verification-audit when podcast quotes can confirm or contradict existing findings

After extraction, update the relevant dossier section files and add the podcast as a source citation with episode title, date, and timestamp of the relevant statement.
