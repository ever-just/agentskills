# Web Anti-Detection

For personal, targeted page access. Not designed for bulk or commercial scraping.

## What's already handled by stealth plugin

`puppeteer-extra-plugin-stealth` patches these automatically:
- `navigator.webdriver` flag (fingerprint tell)
- Chrome runtime properties that reveal automation
- Plugin and language arrays (consistent with real browser)
- WebGL and canvas fingerprinting

No extra code needed once registered (already done in `vendor/puppeteer/setup.js`).

## User-agent

`fetch-page-puppeteer.mjs` sets a realistic desktop UA by default. Update when Chrome releases new major versions:

```js
const userAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/121.0.0.0 Safari/537.36";
```

## Robots.txt

Checked before every request via `robotsAllows()` in `vendor/puppeteer/setup.js`.

| Situation | Approach |
|-----------|----------|
| Personal research, page allows | Proceed |
| Personal research, page disallows | Log and skip; find alternative source |
| CAPTCHAs on allowed page | See below |

## CAPTCHA handling

For simple CAPTCHAs on pages you're entitled to access:

```bash
npm install puppeteer-extra-plugin-recaptcha
```

```js
import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha';

puppeteer.use(RecaptchaPlugin({
  provider: { id: '2captcha', token: process.env.CAPTCHA_API_KEY },
  visualFeedback: false,
}));

const { solved } = await page.solveRecaptchas();
```

> Requires a paid 2captcha account. Only worth it for occasional access to pages you have legitimate reason to visit.

## Manual (interactive) CAPTCHA solving

Run `fetch-page-puppeteer.mjs` in interactive mode — opens a visible browser, waits up to 5 minutes for you to solve the challenge:

```bash
node scripts/fetch-page-puppeteer.mjs https://example.com/ my-slug documents/ --interactive
```

Browser session persists via `tmp/puppeteer-user-data` (cookies survive between runs). Pass `--user-data-dir <path>` to override.

## Avoiding rate-limit detection

- `fetch-page-puppeteer.mjs` processes one URL at a time
- For batch use, use `acquirePages()` from `vendor/puppeteer/acquire.js` with `delayMs` (default 2s, use 5s+ for caution)
- Don't parallelize requests to the same domain
- If blocked (403/429): back off, wait 5–10 minutes, retry once
- Don't retry repeatedly — respect the signal

## If site requires login

```js
import { openBrowser, newPage } from '../vendor/puppeteer/setup.js';

const browser = await openBrowser({ headless: false, userDataDir: 'tmp/puppeteer-user-data' });
const page = await newPage(browser);
await page.goto('https://example.com/login');
await page.type('#username', process.env.SITE_USER);
await page.type('#password', process.env.SITE_PASS);
await page.click('button[type=submit]');
await page.waitForNavigation();
// Session now persists in userDataDir for future runs
await browser.close();
```
