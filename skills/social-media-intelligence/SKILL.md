# Social Media Intelligence

> Pull public content (photos, videos, posts, metadata) from social media profiles for competitive intelligence research.

## When to Use

- After discovering a company's social media profiles during website crawl or OSINT
- When building a company dossier and need content beyond what the website shows
- When analyzing a competitor's marketing activity, product launches, or client relationships
- When you need engagement metrics (followers, likes, views) for competitive benchmarking

## Prerequisites

Install one or more of these tools (all optional — the skill degrades gracefully):

```bash
pip install instagrapi    # Instagram profiles + posts
pip install gallery-dl    # TikTok, Facebook, Pinterest, Tumblr, Flickr, Twitter
pip install yt-dlp        # YouTube channels + video metadata
```

## Input

- One or more social media profile URLs (discovered during earlier research phases)
- OR a company name + website URL (the skill will discover profiles first)

## Process

### Step 1: Discover Social Profiles

If not already discovered, find profiles via:
1. HTML extraction from company website (footer, contact page, schema.org JSON-LD)
2. HEAD probing common URL patterns: `linkedin.com/company/{slug}`, `twitter.com/{slug}`, `instagram.com/{slug}`, etc.
3. Sitemap link extraction

### Step 2: Classify & Route

Parse each URL to identify platform + handle. Check auth requirements:

| Platform | Auth Needed? | Tool |
|----------|:---:|------|
| Instagram | No | instagrapi |
| TikTok | No | gallery-dl |
| YouTube | No | yt-dlp |
| Facebook | No (photos only) | gallery-dl |
| Pinterest | No | gallery-dl |
| Tumblr | No | gallery-dl |
| Flickr | No | gallery-dl |
| Twitter/X | Yes (browser cookies) | gallery-dl --cookies-from-browser chrome |
| LinkedIn | Yes (browser cookies) | Playwright (limited) |

### Step 3: Pull Content

**Instagram:**
```python
from instagrapi import Client
cl = Client()
info = cl.user_info_by_username("handle")
# Profile: username, full_name, biography, follower_count, media_count, external_url, is_business
medias = cl.user_medias(info.pk, amount=20)
# Per post: media_type, caption_text, like_count, comment_count, timestamp, thumbnail_url, video_url, location, usertags
```

**TikTok:**
```bash
gallery-dl --range 1-20 -G "https://www.tiktok.com/@handle"          # URLs only (fast)
gallery-dl --range 1-20 --write-metadata "https://www.tiktok.com/@handle"  # Full download
```

**YouTube:**
```bash
yt-dlp --flat-playlist --print-json --playlist-items 1-20 "https://youtube.com/@handle/videos"
# Per video: id, title, description, view_count, like_count, duration, upload_date, thumbnail
```

**Facebook:**
```bash
gallery-dl --range 1-20 "https://www.facebook.com/PAGE/photos"
```

**Twitter/X (requires cookies):**
```bash
gallery-dl --cookies-from-browser chrome "https://twitter.com/handle"
```

### Step 4: Organize Output

```
8_marketing/social_content/
  instagram/
    profile.json
    posts/
      YYYY-MM-DD_description.jpg
      YYYY-MM-DD_description.json    ← caption, likes, hashtags, location
  tiktok/
    video_urls.json                  ← or videos/ with MP4s
  youtube/
    videos.json                      ← channel + video metadata
    thumbnails/
      video-id.jpg
  facebook/
    photos/
      001.jpg
  manifest.json                      ← master index
```

### Step 5: Extract Intelligence

From the social content, identify:
- **Product launches** — new product photos/videos with dates
- **Client relationships** — tagged accounts, case study posts, testimonial videos
- **Team members** — tagged employees, team photos, hiring announcements
- **Event attendance** — trade show photos, conference mentions
- **Geographic reach** — location tags across posts
- **Competitive positioning** — how they describe themselves casually vs formally
- **Hiring signals** — "we're growing" posts, job announcement posts
- **Partnership reveals** — co-branded content, shared posts with other companies

## Output

| Artifact | Location |
|----------|----------|
| Per-platform profile JSON | `social_content/{platform}/profile.json` |
| Media files + JSON sidecars | `social_content/{platform}/posts/` |
| Master manifest | `social_content/manifest.json` |
| Flattened CSV | `_data/social_content.csv` |

## Confidence Ratings

| Finding Source | Confidence |
|---------------|-----------|
| Profile bio, follower count, post count | HIGH (structured data from platform) |
| Post captions, hashtags, tagged users | HIGH (user-generated, direct) |
| Engagement metrics (likes, views) | MODERATE (can fluctuate, snapshot in time) |
| Inferred relationships from tags/mentions | MODERATE (requires verification) |
| Location data from posts | MODERATE (users can set incorrect locations) |

## Tested Results (June 2026)

| Platform | Target | Result |
|----------|--------|--------|
| Instagram | @shopify | Profile (2.5M followers, bio, business), 3 posts with media |
| Instagram | @nasa | Profile (104M followers), 3 posts with video URLs |
| YouTube | @shopify | 3 videos (titles, durations, URLs) |
| YouTube | @NASA | 5 videos (titles, full metadata) |
| TikTok | @washingtonpost | 119+ videos enumerated |
| TikTok | @shopify | 42+ videos enumerated |
| Facebook | /shopify | 3 photos downloaded from CDN |
| Facebook | /NASA | 5 photos downloaded from CDN |
| Pinterest | /nasa | Original-quality images extracted |
| Tumblr | /nasa | 7.3MB + 1.6MB images downloaded |

## Rate Limits

| Platform | Limit | Delay |
|----------|-------|-------|
| Instagram | ~200 req/hr | 1-2s |
| TikTok | Moderate | gallery-dl handles paging |
| YouTube | Generous | None for metadata |
| Facebook | Moderate | gallery-dl handles paging |
| Twitter | Strict | 1-2s with cookies |
