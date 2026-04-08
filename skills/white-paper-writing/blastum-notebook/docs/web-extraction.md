# Web Extraction

How content is extracted from loaded pages.

## Core extraction

`vendor/puppeteer/extraction.js` — used by `acquire.js` automatically. Direct use:

```js
import { extractContent, cleanText } from '../vendor/puppeteer/extraction.js';

const { title, h1, h2s, text, links } = await extractContent(page);
```

## Output format

```js
{
  title: "Page title from document.title",
  h1: "Primary heading text",
  h2s: ["Section heading 1", "Section heading 2"],   // up to 12, deduped
  text: "Clean extracted text content...",
  links: [{ text: "Link text", href: "https://..." }]  // up to 500
}
```

## What gets stripped

`extractContent` removes before extracting:
- `nav`, `header`, `footer`, `aside`, `script`, `style`, `noscript`
- Dialogs and modals (`[role='dialog']`, `[aria-modal='true']`)
- Cookie banners (`[class*='cookie' i]`, `[id*='cookie' i]`)
- Ads (`.ad`, `.ads`, `[class*='banner' i]`)
- Carousels and sliders

Prefers `<main>` → `<article>` → `<body>` for extraction root.

## Waiting for dynamic content

JavaScript-rendered pages need explicit waits before extraction:

```js
// Wait for a specific element
await page.waitForSelector('article.main-content', { timeout: 10_000 });

// Wait for network to settle (for SPAs)
await page.waitForNetworkIdle({ idleTime: 1000 });

// Wait for arbitrary condition
await page.waitForFunction(
  () => document.querySelector('.results')?.children.length > 0,
  { timeout: 15_000 }
);
```

`fetch-page-puppeteer.mjs` uses `waitUntil: "networkidle2"` and waits for `h1` by default.

## Targeted extraction (known site structure)

```js
export async function extractArticle(page, selectors = {}) {
  const {
    title = 'h1',
    body = 'article, main, .content, .post-body',
    date = 'time, .date, .published',
  } = selectors;

  return page.evaluate(({ title, body, date }) => {
    const get = (sel) => document.querySelector(sel)?.innerText?.trim() ?? '';
    const getAttr = (sel, attr) => document.querySelector(sel)?.getAttribute(attr) ?? '';
    return {
      title: get(title),
      text: get(body),
      date: getAttr(date, 'datetime') || get(date),
    };
  }, { title, body, date });
}
```

## Archival snapshots

```js
import { openBrowser, newPage } from '../vendor/puppeteer/setup.js';

const browser = await openBrowser();
const page = await newPage(browser);
await page.goto(url);

// Full-page PDF
await page.pdf({ path: outputPath, format: 'A4', printBackground: true });

// Full-page screenshot
await page.screenshot({ path: outputPath, fullPage: true });

await browser.close();
```
