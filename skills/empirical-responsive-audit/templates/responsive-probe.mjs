// Responsive/layout regression probe — EMPIRICAL mobile/layout audit + CI gate.
//
// Renders a URL across a device viewport matrix (phones in both orientations,
// tablets, desktop; light + dark) and MECHANICALLY detects:
//   - horizontal page overflow (documentElement.scrollWidth > innerWidth), and
//     lists every element whose right edge spills past the viewport
//   - sub-44px tap targets (WCAG 2.5.5 Target Size)
//   - sub-16px input font-size (the iOS focus-zoom trap)
//   - viewport-meta presence + content (and user-scalable=no / maximum-scale abuse)
// plus a full-page screenshot per (viewport, colorScheme).
//
// It uses the PREINSTALLED Chromium (never run `playwright install`) and exits
// NON-ZERO if any viewport has horizontal overflow — so the same script doubles
// as a pre-merge / CI regression gate after layout fixes.
//
// Deps: `npm i -g playwright-core` (or a local devDependency). Browsers are
// expected to be preinstalled under $PLAYWRIGHT_BROWSERS_PATH.
//
// Usage:
//   node responsive-probe.mjs <url> <label> [outDir]
//   PROBE_SCHEMES=light,dark PROBE_MATRIX=phones node responsive-probe.mjs https://example.com home
//
// Env overrides (all optional):
//   PLAYWRIGHT_BROWSERS_PATH  where preinstalled browsers live (default /opt/pw-browsers)
//   PROBE_CHROMIUM            explicit path to a chrome/headless_shell binary
//   PROBE_OUT                 default output dir (arg 3 wins if given)
//   PROBE_SCHEMES             comma list of color schemes (default "light,dark")
//   PROBE_MATRIX              "full" (default) | "phones" | "quick"
//   PROBE_WAIT_MS             settle time after load before probing (default 800)

import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const url = process.argv[2] || 'http://localhost:3000/';
const label = process.argv[3] || 'surface';
const outDir = process.argv[4] || process.env.PROBE_OUT || './probe-out';
fs.mkdirSync(outDir, { recursive: true });

// ---------------------------------------------------------------------------
// 1) Resolve the PREINSTALLED Chromium. NEVER shell out to `playwright install`.
//    Discover the versioned build dynamically (build numbers drift), preferring
//    the full chromium binary and falling back to headless_shell.
// ---------------------------------------------------------------------------
function findChromium() {
  if (process.env.PROBE_CHROMIUM && fs.existsSync(process.env.PROBE_CHROMIUM))
    return process.env.PROBE_CHROMIUM;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  let entries = [];
  try { entries = fs.readdirSync(root); } catch { entries = []; }
  const numOf = (d) => parseInt((d.match(/(\d+)$/) || [])[1] || '0', 10);
  const chromiums = entries.filter(d => /^chromium-\d+$/.test(d)).sort((a, b) => numOf(b) - numOf(a));
  const shells = entries.filter(d => /^chromium_headless_shell-\d+$/.test(d)).sort((a, b) => numOf(b) - numOf(a));
  const candidates = [
    ...chromiums.map(d => path.join(root, d, 'chrome-linux', 'chrome')),
    ...shells.map(d => path.join(root, d, 'chrome-linux', 'headless_shell')),
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
  ];
  return candidates.find(p => fs.existsSync(p)) || null;
}

const executablePath = findChromium();
if (!executablePath) {
  console.error('No preinstalled Chromium found. Set PROBE_CHROMIUM or PLAYWRIGHT_BROWSERS_PATH.');
  console.error('Do NOT run `playwright install` — use the browser already on the box.');
  process.exit(2);
}

// ---------------------------------------------------------------------------
// 2) Viewport matrix. Phones expand to BOTH orientations. Widths cover the real
//    device population; heights are representative.
// ---------------------------------------------------------------------------
const PHONES = [
  { w: 320, h: 568 }, // smallest still-supported (iPhone SE 1)
  { w: 360, h: 800 }, // common Android
  { w: 375, h: 667 }, // iPhone SE 2/3, mini
  { w: 390, h: 844 }, // iPhone 12–15
  { w: 414, h: 896 }, // iPhone Plus / Max
];
const TABLETS = [
  { w: 768, h: 1024 }, // iPad portrait
  { w: 834, h: 1112 }, // iPad Air/Pro 11"
];
const DESKTOPS = [
  { w: 1024, h: 768 },
  { w: 1280, h: 800 },
  { w: 1440, h: 900 },
];

function buildMatrix(mode) {
  const out = [];
  const phones = mode === 'quick' ? [PHONES[1], PHONES[3]] : PHONES;
  for (const p of phones) {
    out.push({ name: `phone-${p.w}-portrait`, type: 'phone', width: p.w, height: p.h });
    out.push({ name: `phone-${p.w}-landscape`, type: 'phone', width: p.h, height: p.w });
  }
  if (mode === 'phones') return out;
  const tablets = mode === 'quick' ? [TABLETS[0]] : TABLETS;
  const desktops = mode === 'quick' ? [DESKTOPS[2]] : DESKTOPS;
  for (const t of tablets) out.push({ name: `tablet-${t.w}`, type: 'tablet', width: t.w, height: t.h });
  for (const d of desktops) out.push({ name: `desktop-${d.w}`, type: 'desktop', width: d.w, height: d.h });
  return out;
}

const VIEWPORTS = buildMatrix(process.env.PROBE_MATRIX || 'full');
const SCHEMES = (process.env.PROBE_SCHEMES || 'light,dark').split(',').map(s => s.trim()).filter(Boolean);
const WAIT_MS = parseInt(process.env.PROBE_WAIT_MS || '800', 10);

// ---------------------------------------------------------------------------
// 3) The injected DOM probe. Runs in the page; returns a pure JSON defect record.
//    A 1px slack absorbs sub-pixel rounding so we don't flag phantom overflow.
// ---------------------------------------------------------------------------
const PROBE = () => {
  const vw = window.innerWidth;
  const docSW = document.documentElement.scrollWidth;

  // Elements whose right edge spills past the viewport = horizontal-overflow offenders.
  const offenders = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.right > vw + 1) {
      offenders.push({
        tag: el.tagName.toLowerCase(),
        right: Math.round(r.right),
        w: Math.round(r.width),
        cls: (typeof el.className === 'string' ? el.className : '').slice(0, 60),
        id: el.id || null,
        text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40),
      });
    }
  }
  offenders.sort((a, b) => b.right - a.right);

  // Tap targets under 44x44 CSS px (WCAG 2.5.5). Skip zero-size / hidden.
  const smallTargets = [];
  for (const el of document.querySelectorAll('a,button,input,select,textarea,[role=button],[onclick]')) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44)) {
      smallTargets.push({
        tag: el.tagName.toLowerCase(),
        w: Math.round(r.width),
        h: Math.round(r.height),
        text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24),
      });
    }
  }

  // Inputs under 16px font-size trigger iOS focus-zoom. Report each offender.
  const sub16 = [];
  for (const el of document.querySelectorAll('input,select,textarea')) {
    const type = (el.getAttribute('type') || '').toLowerCase();
    if (type === 'hidden' || type === 'checkbox' || type === 'radio') continue;
    const size = parseFloat(getComputedStyle(el).fontSize);
    if (size < 16) sub16.push({ tag: el.tagName.toLowerCase(), type: type || null, fontSize: size });
  }

  const meta = document.querySelector('meta[name="viewport"]');
  const metaContent = meta ? (meta.getAttribute('content') || '') : null;
  const blocksZoom = !!metaContent && /user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0*)?\b/i.test(metaContent);

  return {
    vw,
    docSW,
    horizontalOverflow: docSW > vw + 1,
    overflowPx: docSW - vw,
    offenderCount: offenders.length,
    topOffenders: offenders.slice(0, 10),
    smallTargetCount: smallTargets.length,
    smallTargets: smallTargets.slice(0, 10),
    sub16InputCount: sub16.length,
    sub16Inputs: sub16.slice(0, 10),
    hasViewportMeta: !!meta,
    viewportMetaContent: metaContent,
    // WCAG 1.4.4 violation: never suppress pinch-zoom to "fix" iOS input zoom.
    zoomDisabled: blocksZoom,
  };
};

// ---------------------------------------------------------------------------
// 4) Drive the matrix. networkidle first, domcontentloaded fallback on timeout.
// ---------------------------------------------------------------------------
const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });
const results = {};
let anyOverflow = false;
let anyZoomDisabled = false;

for (const scheme of SCHEMES) {
  for (const vp of VIEWPORTS) {
    const key = `${vp.name}-${scheme}`;
    const isTouch = vp.type !== 'desktop';
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      isMobile: isTouch,
      hasTouch: isTouch,
      colorScheme: scheme,
    });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() =>
      page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}));
    await page.waitForTimeout(WAIT_MS);

    let probe;
    try { probe = await page.evaluate(PROBE); }
    catch (e) { probe = { error: String(e && e.message || e) }; }

    const shot = path.join(outDir, `${label}-${key}.png`);
    await page.screenshot({ path: shot, fullPage: true }).catch(() => {});
    results[key] = { viewport: vp, scheme, ...probe, screenshot: shot };

    if (probe && probe.horizontalOverflow) anyOverflow = true;
    if (probe && probe.zoomDisabled) anyZoomDisabled = true;
    await ctx.close();
  }
}
await browser.close();

// ---------------------------------------------------------------------------
// 5) Emit the JSON defect log + a terse summary, then set the gate exit code.
// ---------------------------------------------------------------------------
const overflowed = Object.entries(results)
  .filter(([, r]) => r.horizontalOverflow)
  .map(([k, r]) => `${k} (+${r.overflowPx}px, ${r.offenderCount} offenders)`);

console.log(JSON.stringify({ url, label, executablePath, schemes: SCHEMES, results }, null, 2));
console.error(`\n[responsive-probe] ${url} — ${Object.keys(results).length} renders`);
console.error(overflowed.length
  ? `[responsive-probe] FAIL: horizontal overflow in ${overflowed.length} → ${overflowed.join(', ')}`
  : '[responsive-probe] OK: no horizontal overflow in any viewport');
if (anyZoomDisabled) console.error('[responsive-probe] WARN: viewport meta disables pinch-zoom (WCAG 1.4.4)');

process.exit(anyOverflow ? 1 : 0);
