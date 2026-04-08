/**
 * Retry a function up to maxAttempts times.
 * Retries only on timeouts and `net::ERR_*` failures — not on 403/429.
 */
export async function withRetry(fn, { maxAttempts = 3, backoffMs = 3000 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isRetryable = err?.name === "TimeoutError" || err?.message?.includes("net::ERR_");
      if (!isRetryable || attempt === maxAttempts) break;
      await new Promise((r) => setTimeout(r, backoffMs * attempt));
    }
  }
  throw lastError;
}

export async function fallbackFetch(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; personal-research-bot/1.0)" }
  });
  if (!res.ok) return null;
  const html = await res.text();
  return html.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim();
}
