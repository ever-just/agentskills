---
name: cdp-render-verification
description: Prove a web change actually rendered correctly by driving a local headless Chrome over the DevTools Protocol (CDP) — using only Node's built-in WebSocket and fetch, no Puppeteer or Playwright install. Use before declaring ANY visual or interactive web change done: to screenshot desktop + real mobile emulation, read computed styles (the reliable way to check colors/fonts/spacing), detect layout overflow, catch raw code that leaked as visible text, verify a video is actually playing, and drive multi-step flows (click through a form/booking/checkout and read the resulting state). Use when the user says "verify it looks right", "check it on mobile", "did that change actually take", "make sure nothing is broken", or after any CSS/template/JS edit you are about to ship.
---

# CDP Render Verification

Render-verify web changes in a **real browser** before calling them done. Drives a
local headless Chrome over the DevTools Protocol with **zero dependencies** —
Node's global `WebSocket`/`fetch` and `child_process`. Screenshots are for a human
glance; the **computed-style and flow probes are the actual proof**.

**Why this exists:** shipping a visual change you only *think* is right is how you
put broken pixels or raw code in front of a user. A 40-line CDP harness lets you
assert the exact outcome: page returns 200, the intended style changed, nothing
leaked, mobile does not overflow, the flow reaches the right end state.

## When to use

- Before shipping any CSS / template / JS / content change to a live page.
- To check a **specific** property changed (e.g., an accent color is no longer
  green) — computed styles are far more reliable than eyeballing a screenshot.
- To catch **raw code leaking as text** (a `<style>`/`<script>` printed on the
  page — see [[everjust-website-customization]] Markup trap).
- To confirm **mobile** behavior (real device-metrics emulation, overflow).
- To **drive a multi-step flow** (pick date → time → fill form → review) and read
  the composed result — integration bugs a static screenshot cannot show.
- To verify a **video** autoplays/loops.

## When NOT to use

- Logic that a unit/integration test runner covers better.
- When a dedicated preview/browser MCP is connected and sufficient — though CDP
  still wins for computed-style assertions and scripted flow-driving.

---

## The harness (copy, adapt)

```js
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; // or `which google-chrome`
const port = 9333;
spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, "--disable-gpu",
  "--hide-scrollbars", "--no-first-run", "--autoplay-policy=no-user-gesture-required",
  "--user-data-dir=/tmp/cdp-"+port], { stdio: "ignore" });                 // fresh profile per run
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function ws_url(){ for(let i=0;i<40;i++){ try{ return (await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()).webSocketDebuggerUrl; }catch{ await sleep(250);} } }
const ws = new WebSocket(await ws_url()); let id=0; const pend=new Map();
ws.addEventListener("message", e=>{ const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){ pend.get(m.id)(m); pend.delete(m.id);} });
await new Promise(r=>ws.addEventListener("open", r));
const cmd=(method,params={},s)=>new Promise(res=>{ const i=++id; pend.set(i,res); ws.send(JSON.stringify({id:i,method,params,...(s?{sessionId:s}:{})})); });
const { result:{ targetId } } = await cmd("Target.createTarget", { url:"about:blank" });
const { result:{ sessionId:sess } } = await cmd("Target.attachToTarget", { targetId, flatten:true });
await cmd("Runtime.enable", {}, sess);
const ev = async x => (await cmd("Runtime.evaluate", { expression:x, returnByValue:true, awaitPromise:true }, sess)).result?.result?.value;
const shot = async name => { const r=await cmd("Page.captureScreenshot",{format:"png",captureBeyondViewport:true},sess); fs.writeFileSync(name, Buffer.from(r.result.data,"base64")); };

// DESKTOP
await cmd("Emulation.setDeviceMetricsOverride", { width:1280, height:900, deviceScaleFactor:2, mobile:false }, sess);
await cmd("Page.navigate", { url:"https://example.com/page" }, sess); await sleep(4500);   // let assets + JS settle
console.log(JSON.stringify(await ev(`JSON.stringify({
  title: document.title,
  accent: getComputedStyle(document.querySelector('.el')).color,        // computed style = the real check
  overflow: document.documentElement.scrollWidth <= window.innerWidth,  // false = horizontal overflow bug
  codeLeak: /<style|<script|&lt;/.test((document.body.innerText||'').slice(0,4000)),
  present: !!document.querySelector('.expected')
})`)));
await shot("desktop.png");

// MOBILE (real device metrics)
await cmd("Emulation.setDeviceMetricsOverride", { width:390, height:844, deviceScaleFactor:3, mobile:true }, sess);
await cmd("Page.navigate", { url:"https://example.com/page" }, sess); await sleep(4000);
console.log("mobile overflow:", await ev(`document.documentElement.scrollWidth+'/'+window.innerWidth`)); // want equal
await shot("mobile.png");
process.exit(0);
```

Run with `node harness.mjs` (Node 18+; the WebSocket global is built in on 20+/22).

## Probes that matter

- **Computed style** — `getComputedStyle(el).color` / `backgroundColor`. Assert the
  value, e.g. `!/166a0b|22,\s*106,\s*11/i.test(color)` to prove a color is gone.
- **Overflow** — `documentElement.scrollWidth` vs `window.innerWidth`; unequal on
  mobile = a horizontal-scroll bug.
- **Code leak** — `/<style|<script|&lt;/.test(body.innerText.slice(0,4000))`.
- **Video playing** — read `.readyState` (4 = enough data), `.currentTime` (>0 after
  a wait = advancing), `.paused` (false). Needs `--autoplay-policy=no-user-gesture-required`
  and a muted/`playsinline` video.
- **Console errors** — subscribe to `Runtime.exceptionThrown` messages.

## Driving a multi-step flow

Assert the *end state*, not just that a button exists:

```js
await ev(`document.querySelector('.calendar-day.available').click()`); await sleep(2500); // fetch slots
await ev(`document.querySelector('.slot').click()`); await sleep(800);
await ev(`(function(){var e=document.getElementById('email');e.value='a@b.com';e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
await ev(`document.querySelector('.next').click()`); await sleep(500);
// for a native <select>: set .value then dispatch a 'change' event
console.log("composed summary:", await ev(`document.getElementById('review').textContent`));
```

This catches integration bugs (JS not wired, wrong data composed, a step not
advancing) that screenshots never reveal.

## Gotchas

- **Wait** after `Page.navigate` (~4s) — assets, fonts, and deferred module JS
  settle after DOMContentLoaded.
- Fresh `--user-data-dir` per run avoids stale state; unique port per parallel run.
- Reading an image screenshot verifies layout/vibe; for **colors/fonts/spacing**
  trust `getComputedStyle`, not the screenshot.
- To force a fresh asset after a server change, navigate again; bumping the URL or
  cache-busting the asset avoids a stale bundle.

## Related

- [[everjust-website-customization]] — the changes this verifies (and its Markup trap).
- [[web-embed-video-optimization]] — pairs with the video-playback probe.
- [[ui-ux-audit]] / [[admin-dashboard-verification]] — broader UX/feature review.
