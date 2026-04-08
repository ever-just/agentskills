#!/usr/bin/env node
/**
 * Capture a live Chrome tab as a notebook document.
 * Connects to Chrome via remote debugging protocol.
 *
 * Usage:
 *   node fetch-live-page.mjs <slug> [output-dir] [--url <url>] [--port <port>] [--tab <n>]
 *
 * Requires Chrome running with debug port open:
 *   scripts/launch-chrome.sh [url]
 *
 * Writes: {output-dir}/{slug}.md
 */

import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";

import { connectToChrome, extractContent } from "../vendor/puppeteer/connect.js";

const argv = process.argv.slice(2);
const slug = argv[0];
let i = 1;

let outputDir = "documents";
if (argv[i] && !argv[i].startsWith("--")) {
  outputDir = argv[i];
  i += 1;
}

let url = "";
let port = 9222;
let tabIndex = null;

for (; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--url")  { url = argv[++i];            continue; }
  if (a === "--port") { port = Number(argv[++i]);   continue; }
  if (a === "--tab")  { tabIndex = Number(argv[++i]); continue; }
}

if (!slug) {
  console.error(
    "Usage: node fetch-live-page.mjs <slug> [output-dir] [--url <url>] [--port <port>] [--tab <n>]"
  );
  process.exit(1);
}

function prompt(msg) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(msg, (answer) => { rl.close(); resolve(answer); });
  });
}

let browser;
try {
  browser = await connectToChrome({ port });
} catch {
  console.error(`Could not connect to Chrome on port ${port}.`);
  console.error("Run: scripts/launch-chrome.sh");
  process.exit(1);
}

const pages = await browser.pages();
let page;

if (url) {
  page = await browser.newPage();
  console.log(`Navigating to: ${url}`);
  await page.goto(url, { waitUntil: "networkidle2", timeout: 90_000 });
} else {
  if (!pages.length) {
    console.error("No open tabs found.");
    await browser.disconnect();
    process.exit(1);
  }

  if (tabIndex != null) {
    page = pages[tabIndex];
  } else if (pages.length === 1) {
    page = pages[0];
  } else {
    console.log("Open tabs:");
    for (let n = 0; n < pages.length; n++) {
      const t = await pages[n].title().catch(() => "");
      console.log(`  [${n}] ${t || "(no title)"} — ${pages[n].url()}`);
    }
    const choice = await prompt("Tab number to capture (default 0): ");
    page = pages[Number(choice) || 0];
  }
}

const currentUrl = page.url();
const titleText = await page.title().catch(() => "");
console.log(`\nTarget: ${titleText || "(no title)"}`);
console.log(`URL:    ${currentUrl}`);
console.log("\nScroll to load all content, then press Enter to capture...");
await prompt("");

const content = await extractContent(page);

if (!content.text || content.text.trim().length < 200) {
  console.error("Too little content extracted — page may not be fully loaded.");
  await browser.disconnect();
  process.exit(2);
}

const outputPath = path.join(outputDir, `${slug}.md`);

let existing = "";
try { existing = await fs.readFile(outputPath, "utf8"); } catch {}

const preserved = (
  existing || `# ${content.title || titleText}\n\nSource URL: ${currentUrl}\n\n## Captured notes\n`
)
  .replace(/\n## Extracted page content \(live browser\)[\s\S]*$/m, "")
  .trimEnd();

const next = [
  preserved,
  "",
  "## Extracted page content (live browser)",
  "",
  `Acquired: ${new Date().toISOString()}`,
  `URL: ${currentUrl}`,
  "",
  content.text,
  "",
].join("\n");

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, next, "utf8");
console.log(`\nSaved: ${outputPath}`);

await browser.disconnect();
