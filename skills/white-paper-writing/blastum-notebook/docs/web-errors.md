# Web Acquisition Errors

## Common failures

| Error | Likely cause | Response |
|-------|-------------|----------|
| `TimeoutError` | Page slow/hung | Increase `--timeout` or use `domcontentloaded` waitUntil |
| `net::ERR_NAME_NOT_RESOLVED` | Bad URL or DNS | Validate URL before running |
| `net::ERR_CONNECTION_REFUSED` | Site down | Skip, log, don't retry |
| HTTP 403/429 | Rate limited or blocked | Back off, don't retry immediately |
| `detached Frame` | Page navigated mid-extract | Wrap extraction in try/catch |
| Blank extract result | DOM not ready | Add explicit `waitForSelector` |
| Exit code 2 from script | Robots disallow, timeout, or <200 chars extracted | Check URL; try `--interactive` |

## Retry wrapper

`vendor/puppeteer/errors.js` — retries on `TimeoutError` and `net::ERR_*` only. Does not retry 403/429.

```js
import { withRetry } from '../vendor/puppeteer/errors.js';

const result = await withRetry(() => acquirePage(url), { maxAttempts: 3 });
```

## Fallback to basic HTTP fetch

When puppeteer fails and the page doesn't require JS rendering:

```js
import { fallbackFetch } from '../vendor/puppeteer/errors.js';

const text = await fallbackFetch(url);
```

Or use the Python fallback script:

```bash
python scripts/fetch-page.py {url} {slug} documents/
```

## Browser cleanup

`vendor/puppeteer/acquire.js` always closes the browser in a `finally` block. If writing custom scripts:

```js
const browser = await openBrowser();
try {
  // ... work
} catch (err) {
  console.error(`Failed: ${url}`, err.message);
  return null;
} finally {
  await browser.close();
}
```

## Logging format

```js
function logResult(url, status, detail = '') {
  const ts = new Date().toISOString().slice(0, 19);
  console.log(`[${ts}] ${status.padEnd(7)} ${url}${detail ? ' — ' + detail : ''}`);
}

logResult(url, 'OK', `${content.text.length} chars`);
logResult(url, 'SKIP', 'robots.txt disallow');
logResult(url, 'FAIL', err.message);
```
