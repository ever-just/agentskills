// Neutralize untrusted error text before it is written into a GitHub issue an agent will read.
const hex = (n) => "\\u{" + n.toString(16) + "}";
const cls = (...ranges) => new RegExp("[" + ranges.map(([a, b]) => hex(a) + "-" + hex(b ?? a)).join("") + "]", "gu");
const INVISIBLE = cls(
  [0x00, 0x08], [0x0b, 0x0c], [0x0e, 0x1f], [0x7f, 0x9f], // control chars (keeps tab, LF, CR)
  [0xad], [0x180e], [0x200b, 0x200f], [0x202a, 0x202e],   // soft hyphen, mongolian vs, zero-width, bidi embeds
  [0x2060, 0x2064], [0x2066, 0x2069], [0xfeff],           // word joiner, invisible operators, bidi isolates, BOM
  [0xfe00, 0xfe0f], [0xe0100, 0xe01ef],                   // variation selectors (smuggling)
  [0xe0000, 0xe007f],                                     // Unicode tag block (ASCII smuggling)
);
export function neutralize(s, max = 2000) {
  s = String(s ?? "").normalize("NFKC").replace(INVISIBLE, "");
  s = s.replace(/<!--[\s\S]*?(?:-->|$)/g, "[html-comment-removed]");
  s = s.replace(/<\/?[a-z][^>]*>/gi, "");
  s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, "[image-removed]");
  s = s.replace(/\[([^\]]*)\]\((https?:[^)]*)\)/g, "$1 (link removed)");
  s = s.replace(/@([A-Za-z0-9][A-Za-z0-9-]{0,38})/g, "@_$1");
  s = s.replace(/(^|\s)\/(devin|claude|copilot|gemini|codex)\b/gi, "$1[slash-command-removed]");
  return s.length > max ? s.slice(0, max) + " [truncated]" : s;
}
export function fence(s) {
  const longest = Math.max(2, ...[...s.matchAll(/`+/g)].map((m) => m[0].length));
  const f = "`".repeat(longest + 1);
  return f + "text\n" + s + "\n" + f;
}
