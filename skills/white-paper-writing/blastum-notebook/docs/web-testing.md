# Web Acquisition Testing

Verify the puppeteer setup is working.

## Quick dependency check

```bash
node -e "
import('../vendor/puppeteer/setup.js').then(async m => {
  const ok = await m.robotsAllows('https://httpbin.org/get');
  console.log('robots allow:', ok);
  const blocked = await m.robotsAllows('https://httpbin.org/deny');
  console.log('robots block:', !blocked);
}).catch(e => console.error('FAIL:', e.message))
"
```

Run from `.cursor/skills/notebook/`.

`httpbin.org/robots.txt` disallows `/deny` and allows everything else — deterministic for both pass and block cases.

## Browser launch check

```bash
node -e "
import('../vendor/puppeteer/setup.js').then(async m => {
  const b = await m.openBrowser();
  await b.close();
  console.log('browser: ok');
}).catch(e => console.error('FAIL:', e.message))
"
```

## End-to-end fetch test

```bash
node scripts/fetch-page-puppeteer.mjs https://httpbin.org/html test-fetch /tmp
```

Expect: `Saved: /tmp/test-fetch.md` and a file with extracted text.

## If `npm install` hasn't been run

```bash
cd .cursor/skills/notebook/vendor/puppeteer && npm install
```

See [web-setup.md](web-setup.md) for full setup.
