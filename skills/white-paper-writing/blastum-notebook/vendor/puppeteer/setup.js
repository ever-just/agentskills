import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { PuppeteerBlocker } from "@ghostery/adblocker-puppeteer";
import robotsParser from "robots-parser";

let pluginsRegistered = false;

function ensurePluginsRegistered() {
  if (pluginsRegistered) return;
  puppeteer.use(StealthPlugin());
  pluginsRegistered = true;
}

export const LAUNCH_OPTIONS = {
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
};

export async function openBrowser(overrides = {}) {
  ensurePluginsRegistered();
  return puppeteer.launch({ ...LAUNCH_OPTIONS, ...overrides });
}

export async function enableAdblock(page) {
  const blocker = await PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch);
  await blocker.enableBlockingInPage(page);
  return blocker;
}

export async function newPage(
  browser,
  {
    viewport = { width: 1280, height: 800 },
    userAgent,
    adblock = true
  } = {}
) {
  const page = await browser.newPage();
  if (viewport) await page.setViewport(viewport);
  if (userAgent) await page.setUserAgent(userAgent);
  if (adblock) await enableAdblock(page);
  return page;
}

/**
 * robots.txt check for personal, targeted scraping.
 * Conservative defaults:
 * - if robots.txt cannot be fetched, allow (do not block)
 * - if isAllowed() returns false, disallow
 */
export async function robotsAllows(url, { userAgent = "notebook-skill" } = {}) {
  const u = new URL(url);
  const robotsUrl = `${u.protocol}//${u.host}/robots.txt`;
  try {
    const res = await fetch(robotsUrl);
    if (!res.ok) return true;
    const robotsText = await res.text();
    const robots = robotsParser(robotsUrl, robotsText);
    return robots.isAllowed(url, userAgent) !== false;
  } catch {
    return true;
  }
}
