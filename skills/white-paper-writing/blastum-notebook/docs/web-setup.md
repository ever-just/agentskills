# Web Acquisition Setup

## Installation

From `.cursor/skills/notebook/vendor/puppeteer/`:

```bash
cd .cursor/skills/notebook/vendor/puppeteer
npm install
```

> puppeteer downloads Chromium on install (~170MB). Only needs to be done once.

## Dependencies

| Package | Purpose |
|---------|---------|
| `puppeteer` | Headless Chrome |
| `puppeteer-extra` | Plugin wrapper |
| `puppeteer-extra-plugin-stealth` | Anti-fingerprinting |
| `@ghostery/adblocker-puppeteer` | Ad/tracker blocking |
| `robots-parser` | robots.txt compliance |

## Environment requirements

- Node.js 18+
- macOS: no extra deps
- Linux: may need `libnss3`, `libxss1`, `libasound2`
- CI/Docker: `--no-sandbox` flag is already set in `vendor/puppeteer/setup.js`

## Verify installation

```bash
node -e "import('../vendor/puppeteer/setup.js').then(m => m.robotsAllows('https://httpbin.org/get')).then(r => console.log('ok:', r))"
```

Run from `.cursor/skills/notebook/`.

## Optional: CAPTCHA solving

For pages with CAPTCHAs on content you're entitled to access:

```bash
cd .cursor/skills/notebook/vendor/puppeteer
npm install puppeteer-extra-plugin-recaptcha
```

Requires a paid 2captcha account. See [web-anti-detection.md](web-anti-detection.md).
