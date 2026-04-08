const DEFAULT_DROP_PHRASES = [
  "Skip to Main Content",
  "GO TO SLIDE",
  "Play Video",
  "PREV",
  "NEXT"
];

function uniq(items) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const key = it.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

export function cleanText(raw) {
  return (raw || "")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/**
 * Extract clean content from a loaded page.
 * Call after navigation and any required waits.
 */
export async function extractContent(page, options = {}) {
  const { dropPhrases = DEFAULT_DROP_PHRASES, maxLinks = 500 } = options;

  const data = await page.evaluate(
    ({ dropPhrases, maxLinks }) => {
      const norm = (s) => (s || "").replace(/\s+/g, " ").trim();

      // Prefer semantic containers. Falling back to body increases UI junk.
      const root = document.querySelector("main") || document.querySelector("article") || document.body;

      // Remove noise elements before extracting.
      const remove = [
        "nav",
        "header",
        "footer",
        "aside",
        "script",
        "style",
        "noscript",
        "[role='dialog']",
        "[aria-modal='true']",
        ".ad",
        ".ads",
        "[class*='banner' i]",
        "[class*='cookie' i]",
        "[id*='cookie' i]"
      ];
      remove.forEach((sel) => document.querySelectorAll(sel).forEach((el) => el.remove()));

      // Remove obviously non-content widgets (carousels/controls). Heuristic.
      const controlLike = [
        "[aria-label*='slide' i]",
        "[aria-label*='carousel' i]",
        "[class*='carousel' i]",
        "[class*='slider' i]"
      ];
      controlLike.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          const txt = norm(el.innerText);
          const isMostlyControls =
            txt.startsWith("PREV") ||
            txt.startsWith("NEXT") ||
            txt.includes("GO TO SLIDE") ||
            txt.includes("Play Video");
          if (isMostlyControls) el.remove();
        });
      });

      const title = norm(document.title);
      const h1 = norm(document.querySelector("h1")?.innerText || "");
      const h2s = Array.from(document.querySelectorAll("h2"))
        .map((el) => norm(el.innerText))
        .filter(Boolean)
        .slice(0, 12);

      const raw = (root?.innerText || "").split("\n").map(norm).filter(Boolean);
      const filtered = raw.filter((line) => !dropPhrases.some((p) => line === p || line.startsWith(p)));

      const links = Array.from(document.querySelectorAll("a[href]"))
        .slice(0, maxLinks)
        .map((a) => {
          const rawHref = a.href;
          const href =
            typeof rawHref === "string"
              ? rawHref
              : typeof rawHref?.baseVal === "string"
                ? rawHref.baseVal
                : "";
          return { text: norm(a.textContent), href };
        })
        .filter((l) => l.text && l.href && l.href.startsWith("http"));

      return { title, h1, h2s, text: filtered.join("\n"), links };
    },
    { dropPhrases, maxLinks }
  );

  return {
    ...data,
    h2s: uniq(data.h2s || []),
    text: cleanText(data.text)
  };
}
