import { extractContent } from "./extraction.js";
import { openBrowser, newPage, robotsAllows } from "./setup.js";

async function detectChallenge(page) {
  try {
    const sig = await page.evaluate(() => {
      const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
      const title = norm(document.title);
      const bodyText = norm(document.body?.innerText || "");
      const hasCaptchaFrame = !!document.querySelector(
        "iframe[src*='captcha' i], iframe[src*='recaptcha' i], iframe[src*='hcaptcha' i], div.g-recaptcha, div.h-captcha"
      );
      const hasCloudflareMarkers =
        /cloudflare/i.test(bodyText) ||
        /checking your browser/i.test(bodyText) ||
        /attention required/i.test(title) ||
        /verify you are human/i.test(bodyText) ||
        /unusual traffic/i.test(bodyText) ||
        /access denied/i.test(title) ||
        /permission denied/i.test(title);
      return { title, bodyTextLen: bodyText.length, hasCaptchaFrame, hasCloudflareMarkers };
    });
    return sig.hasCaptchaFrame || sig.hasCloudflareMarkers;
  } catch {
    return false;
  }
}

async function waitForChallengeToClear(page, { timeoutMs = 300_000, minTextLen = 500 } = {}) {
  const challenged = await detectChallenge(page);
  if (!challenged) return true;

  // Headful mode: give the user time to solve any interactive challenge.
  try {
    await page.waitForFunction(
      (minTextLen) => (document.body?.innerText || "").trim().length >= minTextLen,
      { timeout: timeoutMs, polling: 1000 },
      minTextLen
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Acquire a single page as a notebook document.
 * Returns { title, h1, h2s, text, links, url, timestamp } or null on skip/failure.
 */
export async function acquirePage(url, options = {}) {
  const {
    waitUntil = "domcontentloaded",
    timeout = 45_000,
    respectRobots = true,
    userAgent,
    adblock = true,
    // If true, run in a visible browser and wait for you to solve CAPTCHAs / bot walls.
    interactive = false,
    challengeTimeoutMs = 300_000,
    launchOptions = {},
    debug = false
  } = options;

  if (respectRobots && !(await robotsAllows(url))) {
    return null;
  }

  const browser = await openBrowser(launchOptions);
  try {
    const page = await newPage(browser, { userAgent, adblock });
    if (interactive && launchOptions.headless === undefined) {
      // no-op; openBrowser already received launchOptions
    }

    await page.goto(url, { waitUntil, timeout });

    if (interactive) {
      const ok = await waitForChallengeToClear(page, { timeoutMs: challengeTimeoutMs });
      if (!ok) return null;
    }

    await page.waitForSelector("h1", { timeout: Math.min(timeout, 15_000) }).catch(() => {});

    const content = await extractContent(page);
    return { ...content, url, timestamp: new Date().toISOString() };
  } catch (err) {
    if (debug) {
      const msg = err?.stack || err?.message || String(err);
      console.error(`[notebook.acquirePage] ${url} failed: ${msg}`);
    }
    return null;
  } finally {
    await browser.close();
  }
}

export async function acquirePages(urls, options = {}) {
  const { delayMs = 2000 } = options;
  const results = [];
  for (const url of urls) {
    const result = await acquirePage(url, options);
    results.push({ url, result });
    if (url !== urls.at(-1)) await new Promise((r) => setTimeout(r, delayMs));
  }
  return results;
}
