---
name: product-hunt-launch
description: Prepare and ship a Product Hunt launch — verify API access, write the launch copy, generate on-brand gallery assets at Product Hunt's exact sizes, get the demo video onto YouTube, and hand off the manual submission. Use when the task is to launch on Product Hunt, prep a PH launch, build PH launch assets, you were handed a Product Hunt API key / developer token, or a user says "set up our Product Hunt launch" / "get us on Product Hunt". Critical: the Product Hunt API has NO launch-creation mutation (createPost / PostSubmissionCreate were removed), so you cannot create, schedule, or edit a launch via the API — the submission is done by hand on producthunt.com (or by a browser agent you brief). The demo video must be a full YouTube link (not Vimeo, not an MP4, not a youtu.be short link). Cross-references [[web-artifacts-builder]] and [[frontend-design]].
---

# Product Hunt launch — prep and manual handoff

Launch a product on Product Hunt. The one fact that shapes everything: **you cannot create or schedule a launch through the API** — the submission is manual on producthunt.com. So this skill is: verify the token, write the copy, generate on-brand gallery assets at PH's exact sizes, get the video onto YouTube, and hand a browser agent a turnkey, guard-railed submission doc.

## When to use this skill

- **"Launch on Product Hunt" / "set up our PH launch" / "prep the PH assets"** — even when phrased loosely as "get us on Product Hunt."
- **You were handed a Product Hunt API key / developer token** — verify it, then use it only for what it CAN do (read the live post's vote count for a badge), never to launch.
- **Post-launch: add a "Featured on Product Hunt" badge to a site** — the embed image + the CSP gotcha.
- Do NOT expect to schedule or publish via the API — that step is manual. This is asset + copy prep and a guarded handoff, not general go-to-market strategy.

## Architecture — the platform's shape (know before you start)

- **No launch mutation.** GraphQL at `https://api.producthunt.com/v2/api/graphql`, header `Authorization: Bearer <dev-token>`. The mutation type is limited to following users (`userFollow` / `userFollowUndo`) and goal management (`goalCreate` / `goalCheer` / …) — there is **no** post/launch-creation mutation (`createPost` / `PostSubmissionCreate` were removed). Do not burn time hunting one; the launch is submitted by hand.
- **The launch is manual.** Someone (a browser agent on the user's session, or the user) creates the product and schedules the date on producthunt.com.
- **Video = a full YouTube URL, nothing else.** PH's gallery embeds `https://www.youtube.com/watch?v=VIDEO_ID` — NOT Vimeo, NOT a shortened `youtu.be/…` link, NOT an uploaded MP4. The video only needs to be Unlisted or Public. Upload first, then paste the watch URL.
- **Gallery needs 2+ images** before it renders; the video is added as a separate field.
- **Exact asset sizes:** thumbnail / logo **240×240**; gallery images **1270×760**.
- **Commercial-use note:** PH's API terms restrict commercial use without approval, but the standard "we're live, go vote" embed badge is provided by PH and is fine to use.

## Recipes

### 0. Verify the token + whether the product already exists
```bash
curl -s -X POST https://api.producthunt.com/v2/api/graphql \
  -H "Authorization: Bearer $PH_TOKEN" -H "Content-Type: application/json" \
  --data '{"query":"query { viewer { user { id name username } } }"}'
# list the (few) mutations — none creates a launch:  {"query":"query { __schema { mutationType { fields { name } } } }"}
# find an existing product: {"query":"query { post(slug:\"<slug>\") { id name url votesCount } }"}
```

### 1. Write the launch kit (paste-ready copy)
- **Name**; **Tagline** ≤ 60 chars (give 2-3 options); **Topics** (3, from PH's taxonomy — SaaS / Developer Tools / API / Web App / etc.); **Website URL**.
- **Description** — one short, honest paragraph; no fabricated stats.
- **Maker's first comment** — the intro posted the moment you go live (problem → what it does → who it is for → a question that invites replies). This drives more engagement than the description.

### 2. Generate on-brand gallery assets at exact sizes
Real product/site screenshots convert better than invented mockups. Two reliable, tool-free techniques:
```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
# (a) screenshot the REAL live site's sections at 2x, downscale to the exact PH size (crisp text):
"$CHROME" --headless=new --force-device-scale-factor=2 --window-size=1270,760 \
  --hide-scrollbars --virtual-time-budget=6000 --screenshot=raw.png "https://yoursite/#section"
sips -z 760 1270 raw.png --out gallery-1.png          # 2540x1520 -> crisp 1270x760

# (b) author a branded 1270x760 HTML slide (real fonts via Google Fonts) and screenshot it the same way.

# logo/thumbnail from a real brand SVG (prefer the real app-icon over a re-render):
rsvg-convert -w 150 -h 150 mark.svg -o mark.png
magick -size 240x240 xc:'#faf9f7' mark.png -gravity center -composite logo-240.png
```
Screenshot the live site's real hero / product-UI / provider-wall sections instead of fabricating `acme.com` mockups — a gallery that matches the landing page the visitor clicks through to converts better and reads as honest.

### 3. Get the demo video onto YouTube
PH only takes a YouTube link. Upload the demo MP4 to the product's YouTube channel as **Unlisted**, then paste the **full** `https://www.youtube.com/watch?v=VIDEO_ID` URL (rewrite any `youtu.be/…` short form). You cannot upload it server-side to the user's channel — that is their action, or a browser agent driving their logged-in YouTube.

### 4. Hand the submission to a browser agent (turnkey + guard-railed)
Because the launch is manual, write ONE self-contained submission doc a browser agent (e.g. `claude-in-chrome`) executes, plus the asset files in a folder. The submission doc MUST:
- State the account it should be signed in as; stop if it is not that account.
- Give every field value inline (name / tagline / description / topics / URL) + the asset filenames in upload order.
- **Guardrails, stated up front: SAVE AS DRAFT ONLY. Do NOT publish, do NOT schedule a live date, do NOT change account settings. Stop and ask the human at the launch-date / hunter / any irreversible submit control.** The human owns going live.

### 5. Post-launch: the "Featured on Product Hunt" badge
The embed is `<a href="producthunt.com/products/<slug>?..."><img src="api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=<id>&theme=..."></a>`. When adding it to a site:
- For JSX, convert the HTML entities (`&amp;` → `&`) and use a plain `<img>`.
- **If the site enforces a Content-Security-Policy, add `https://api.producthunt.com` to `img-src`** or the badge silently renders as a broken image.

## Pitfalls

1. **Do not try to launch via the API.** There is no post/launch-creation mutation — only follow and goal mutations exist. Creating and scheduling a launch is manual on producthunt.com; build for that instead of hunting a nonexistent mutation.
2. **Video is YouTube-only.** An MP4 file, a direct `.../file.mp4` URL, a Vimeo link, or a `youtu.be` short link will NOT embed in the PH gallery. Upload to YouTube and paste the full `watch?v=` URL.
3. **Gallery needs 2+ images** before it shows; the video is a separate field.
4. **A strict CSP blocks the badge image.** `img-src` must include `https://api.producthunt.com`. Related: a headless-browser screenshot may show the badge broken because offscreen renders often skip cross-origin / CSP-blocked images even when a real browser loads them — `curl` the SVG to confirm it resolves rather than trusting the headless shot.
5. **Never let the browser agent publish.** Save-as-draft only; the human confirms the date. Publishing on the wrong date is hard to undo.
6. **No fabricated stats in the copy.** Keep claims honest and defensible — PH makers and audiences scrutinize.

## See also

- [[web-artifacts-builder]] — for building richer HTML slide/asset pages when a plain screenshot is not enough.
- [[frontend-design]] — brand-faithful HTML slides to screenshot at PH's exact sizes.
- [[canvas-design]] — for designed poster/graphic gallery images when a screenshot will not do.
