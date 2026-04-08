import puppeteer from "puppeteer";
import { extractContent } from "./extraction.js";

/**
 * Connect to a running Chrome instance via remote debugging protocol.
 * Returns the browser object. Call browser.disconnect() when done — do not close().
 */
export async function connectToChrome({ port = 9222 } = {}) {
  return puppeteer.connect({
    browserURL: `http://localhost:${port}`,
    defaultViewport: null,
  });
}

export { extractContent };
