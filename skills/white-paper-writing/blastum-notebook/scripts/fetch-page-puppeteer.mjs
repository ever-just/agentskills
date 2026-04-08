#!/usr/bin/env node
/**
 * Fetch a web page via headless Chrome and append extracted text
 * to an existing notebook document (preserving any "Captured notes").
 *
 * Usage:
 *   node fetch-page-puppeteer.mjs <url> <slug> [output-dir]
 *
 * Writes:
 *   {output-dir}/{slug}.md
 */

import fs from "node:fs/promises";
import path from "node:path";

const argv = process.argv.slice(2);
const url = argv[0];
const slug = argv[1];
let i = 2;

let outputDir = ".";
if (argv[i] && !argv[i].startsWith("--")) {
  outputDir = argv[i];
  i += 1;
}

let interactive = false;
let userDataDir = "";
for (; i < argv.length; i += 1) {
  const a = argv[i];
  if (a === "--interactive" || a === "--headful") {
    interactive = true;
    continue;
  }
  if (a === "--user-data-dir") {
    userDataDir = argv[i + 1] || "";
    i += 1;
    continue;
  }
}

if (!url || !slug) {
  console.error(
    "Usage: node fetch-page-puppeteer.mjs <url> <slug> [output-dir] [--interactive] [--user-data-dir <path>]"
  );
  process.exit(1);
}

import { acquirePage } from "../vendor/puppeteer/acquire.js";

const userAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/121.0.0.0 Safari/537.36";

const defaultUserDataDir = path.join("tmp", "puppeteer-user-data");
const launchOptions = interactive
  ? {
    headless: false,
    userDataDir: userDataDir || defaultUserDataDir
  }
  : {};

const result = await acquirePage(url, {
  respectRobots: true,
  waitUntil: "networkidle2",
  timeout: 90_000,
  userAgent,
  interactive,
  challengeTimeoutMs: 300_000,
  launchOptions,
  debug: true
});

if (!result) {
  console.error("Acquire failed or skipped (robots/timeout/block).");
  process.exit(2);
}

// Heuristic: if we didn't get meaningful text, treat as blocked and don't overwrite.
if (!result.text || result.text.trim().length < 200) {
  console.error("Acquire returned too little text; likely blocked.");
  process.exit(2);
}

const outputPath = path.join(outputDir, `${slug}.md`);

let existing = "";
try {
  existing = await fs.readFile(outputPath, "utf8");
} catch {
  // ok
}

// Keep everything before any prior puppeteer extraction section.
const preserved = (existing || `# ${result.title}\n\nSource URL: ${url}\n\n## Captured notes\n`)
  .replace(/\n## Extracted page content \(Puppeteer\)[\s\S]*$/m, "")
  .trimEnd();

const next = [
  preserved,
  "",
  "## Extracted page content (Puppeteer)",
  "",
  `Acquired: ${result.timestamp}`,
  "",
  result.text,
  ""
].join("\n");

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, next, "utf8");
console.log(`Saved: ${outputPath}`);
