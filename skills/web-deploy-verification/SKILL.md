---
name: web-deploy-verification
description: Confirm a web/site change is ACTUALLY live in production after a merge, instead of reporting success because the merge or CI succeeded. Use after merging a PR that deploys on push (Vercel/Netlify/GitHub Actions/etc.) to a live URL, before telling a user a change has "shipped." Covers polling a live URL for content markers with a bounded background loop, a local-build Playwright screenshot fallback for visual changes (with the headless-Chromium-through-a-proxy and port-race pitfalls that break naive attempts), and why "the build succeeded" and "the deploy is live" are different claims. Complementary to product-specific deployment-testing skills (health checks, CI/CD mechanics for one stack) — this is the generic verification habit, usable on any deploy pipeline.
---

# Web Deploy Verification

**A merged PR and a green build are not the same claim as "the change is live."** Between merge
and a user seeing the change there's a build step, a CDN/edge propagation delay, and sometimes a
caching layer — any of which can silently fail or lag. This skill is the habit of closing that
gap: don't tell a user something shipped until you've observed it on the real URL.

## When to use this skill

- You merged a PR to a branch that auto-deploys (Vercel, Netlify, GitHub Actions → static host,
  etc.) and are about to report the change as done.
- A user reports "I don't see the change" — confirm whether it's *not deployed yet* vs *deployed
  but you're looking at the wrong thing* (cache, wrong route, wrong environment).
- You need to visually verify a design change (new section, logo, layout) rather than just check
  a status code.

**Do NOT use this skill for**: the deploy *mechanics* themselves (build commands, CI/CD config,
platform-specific gotchas) — that belongs in a product-specific skill like `deployment-testing`.
This skill starts *after* the deploy is triggered — it's about proving the result, not causing it.

## Pattern 1: poll the live URL for a content marker

Don't check once immediately after merging — deploys take time (typically 30s–5min depending on
the platform). Poll in a bounded loop, checking for a string that only exists in the new version:

```bash
for i in $(seq 1 40); do   # 40 x 20s = ~13 min ceiling; tune to the platform's typical deploy time
  html=$(curl -s https://example.com/path)
  marker_count=$(printf '%s' "$html" | grep -c 'unique-string-only-in-new-version')
  if [ "$marker_count" -ge 1 ]; then
    echo "LIVE ✅ (after ~$((i*20))s)"
    exit 0
  fi
  sleep 20
done
echo "TIMEOUT ⏳ — still not live after the ceiling; check the deploy pipeline, don't assume success"
```

Run this as a background/async task (not blocking the foreground), and only report "shipped" to
the user after it reports success — or report the timeout honestly if it doesn't. **A timeout is
a real signal, not noise** — go check the actual deploy pipeline (build logs, CI run status)
rather than silently re-polling forever or assuming it'll resolve itself.

**Pick the marker carefully**: a string that exists in *both* old and new versions (e.g. the site
name) proves nothing. Use new copy, a new route, a new asset filename, or a new DOM id/class that
didn't exist pre-change.

## Pattern 2: local-build screenshot when the live proxy is unreliable

Polling proves content is present in the HTML; it doesn't prove the page *renders* correctly
(CSS loaded, layout correct, no visual regression). For that, screenshot the actual rendered
page. If the sandboxed environment's outbound proxy makes headless-browser navigation to the
live URL flaky (stalls, timeouts), screenshot a **local production build** of the same commit
instead — same code, no proxy dependency:

```bash
# 1. Build and serve the exact commit that's deploying
npm run build
PORT=3100 npm run start &   # or the framework's equivalent prod server
SERVER_PID=$!

# 2. Wait for the server to actually answer before navigating to it (don't sleep-and-hope)
for i in $(seq 1 30); do
  [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3100/ 2>/dev/null)" = "200" ] && break
  sleep 1
done

# 3. Screenshot with a locally-installed headless Chromium (bypass any HTTPS_PROXY —
#    it's a loopback request, no proxy needed or wanted)
node screenshot.js http://localhost:3100/path out.png

kill $SERVER_PID
```

```js
// screenshot.js — minimal Playwright screenshot, no proxy config
const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,  // point at a pre-installed binary if 'playwright install' is unavailable
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  await page.goto(process.argv[2], { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1200);  // let late CSS/webfonts/animations settle
  await page.screenshot({ path: process.argv[3] });
  await browser.close();
})();
```

## Pitfalls

**1. Checking too early and reporting a false negative.** A deploy pipeline has a real, often
multi-minute lag between merge and live. Checking once right after merging and concluding "it
didn't work" (when it just hasn't finished yet) causes unnecessary rework. Poll with a ceiling
generous enough for the platform (check its typical build time), not a single shot.

**2. A weak content marker.** Checking for text that exists in both the old and new page (site
name, nav links) will report "live" immediately regardless of whether the actual change deployed.
Always pick a marker unique to the new content.

**3. Racing your own local server.** Starting a local server and immediately curling it in the
same command chain — the server needs a moment to bind its port. Poll for a 200 response before
navigating a headless browser at it; a browser hitting a not-yet-listening port fails in ways
that look like a browser bug, not a timing bug, and waste time debugging the wrong layer.

**4. Fighting a sandbox's outbound proxy for browser navigation.** If `HTTPS_PROXY` is set and a
headless browser's navigation to a live public URL stalls or hangs indefinitely, don't spend
cycles configuring the browser's proxy settings — screenshot a local build instead (Pattern 2).
Loopback traffic to `localhost` doesn't need the proxy at all, sidestepping the problem entirely.

**5. Foreground commands getting interrupted mid-poll.** In an interactive session, other
messages/events can interrupt a long-running foreground poll loop. Run verification loops as an
explicit background task so they survive interruption, and check their output file rather than
re-running the whole loop from scratch.

**6. Trusting "build succeeded" as "deployed."** A green CI run only proves the code compiles; it
says nothing about whether the deploy step that follows actually ran, or ran against the commit
you think it did. Always close the loop on the real URL, not the CI dashboard.

## Combining with other skills

- **Product-specific deployment skills** (e.g. `deployment-testing`) — use those for the deploy
  *mechanics* (build commands, required env vars, platform quirks); use this skill for proving
  the *result*.
- **`ui-ux-audit`** — once you've confirmed a change is live and screenshotted it, that screenshot
  is the input for a UI/UX pass.
