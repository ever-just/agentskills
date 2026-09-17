// redact.mjs: RE2-safe patterns (no lookbehind, no inline flags). Works in Node 22, Bun, CF Workers, browser.
const R = (re, flags = "") => new RegExp(re, "g" + flags);
const SECRET_RULES = [
  ["PRIVATE_KEY", R("-----BEGIN[ A-Z0-9_-]{0,100}PRIVATE KEY(?: BLOCK)?-----[\\s\\S]{16,}?-----END[ A-Z0-9_-]{0,100}PRIVATE KEY(?: BLOCK)?-----")],
  ["AWS_KEY_ID", R("\\b(?:A3T[A-Z0-9]|AKIA|ASIA|ABIA|ACCA)[A-Z2-7]{16}\\b")],
  ["AWS_SECRET", R("(aws_?secret_?access_?key|secretaccesskey)([\"']?\\s*[:=]\\s*[\"']?)[A-Za-z0-9/+=]{40}", "i"), "$1$2[REDACTED_AWS_SECRET]"],
  ["STRIPE_KEY", R("\\b[rs]k_(?:live|test|prod)_[A-Za-z0-9]{10,247}\\b")],
  ["STRIPE_WHSEC", R("\\bwhsec_[A-Za-z0-9+/=_-]{16,}")],
  ["GITHUB_TOKEN", R("\\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,255}\\b")],
  ["GITHUB_PAT", R("\\bgithub_pat_[A-Za-z0-9_]{36,255}\\b")],
  ["SLACK_TOKEN", R("\\bxox(?:e\\.xox[bp]|[abeoprs])-[A-Za-z0-9-]{8,}")],
  ["SLACK_APP_TOKEN", R("\\bxapp-\\d-[A-Za-z0-9-]{8,}")],
  ["SLACK_WEBHOOK", R("hooks\\.slack\\.com/(?:services|workflows|triggers)/[A-Za-z0-9+/]{43,56}")],
  ["JWT", R("\\bey[A-Za-z0-9_-]{17,}\\.ey[A-Za-z0-9_/-]{17,}\\.(?:[A-Za-z0-9_/-]{10,}={0,2})?")],
  ["OPENAI_KEY", R("\\bsk-(?:(?:proj|svcacct|admin|service)-[A-Za-z0-9_-]{20,}|[A-Za-z0-9]{20})T3BlbkFJ[A-Za-z0-9_-]{20,}")],
  ["ANTHROPIC_KEY", R("\\bsk-ant-[a-z]{2,8}\\d{2}-[A-Za-z0-9_-]{20,}")],
  ["DEVIN_KEY", R("\\b(?:cog|apk_user|apk)_[A-Za-z0-9_-]{20,}")],
  ["CLOUDFLARE_TOKEN", R("\\bcf(?:ut|at|k)_[A-Za-z0-9]{40}[a-f0-9]{8}\\b")],
  ["CLOUDFLARE_LEGACY", R("(cloudflare|cf_api_token|cf_api_key)([\\w.-]{0,20}[\"']?\\s*[:=]\\s*[\"']?)[A-Za-z0-9_-]{37,45}", "i"), "$1$2[REDACTED_CLOUDFLARE]"],
  ["SENTRY_TOKEN", R("\\bsntry[su]_[A-Za-z0-9+/=_]{64,}")],
  ["OP_SA_TOKEN", R("\\bops_eyJ[A-Za-z0-9+/]{250,}={0,3}")],
  ["DO_TOKEN", R("\\bdo[opr]_v1_[a-f0-9]{64}\\b")],
  ["GCP_API_KEY", R("\\bAIza[A-Za-z0-9_-]{35}\\b")],
  ["TWILIO_API_KEY", R("\\bSK[0-9a-fA-F]{32}\\b")],
  ["URL_CREDENTIALS", R("\\b([a-z][a-z0-9+.-]*://)[^\\s:/?#@]+:[^\\s@/]+@", "i"), "$1[REDACTED_USERINFO]@"],
  ["DSN_PASSWORD", R("\\b(password|passwd|pwd)=('[^']*'|[^\\s;&]+)", "i"), "$1=[REDACTED]"],
  ["AUTH_HEADER", R("\\b(bearer|basic|token)\\s+[A-Za-z0-9._~+/=-]{8,}", "i"), "$1 [REDACTED]"],
  ["SECRET_KV", R("([\\w.-]{0,50}(?:access|auth|api|credential|creds|key|passw(?:or)?d|secret|token|session|cookie|signature)[\\w.-]{0,20}[\"']?\\s*(?:=|:|=>)\\s*[\"']?)[^\\s\"',;&]{8,}", "i"), "$1[REDACTED]"],
  ["HEX40", R("\\b[a-f0-9]{40}\\b")], // Odoo API keys (and git SHAs: allowlist your release SHA before this runs)
];
const PII_RULES = [
  ["EMAIL", R("\\b[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)*\\.[a-zA-Z]{2,}\\b")],
  ["CARD", R("\\b(?:\\d[ -]?){12,18}\\d\\b"), (m) => (luhn(m) ? "[REDACTED_CARD]" : m)],
  ["US_SSN", R("\\b[0-9]{3}-[0-9]{2}-[0-9]{4}\\b")],
  ["PHONE_E164", R("\\+[1-9]\\d{6,14}\\b")],
  ["PHONE_NANP", R("(?:\\+?1[\\s.-]?)?\\(?\\b[2-9]\\d{2}\\)?[\\s.-]?[2-9]\\d{2}[\\s.-]?\\d{4}\\b")],
  ["IPV4", R("\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}\\b")],
];
function luhn(s) { const d = s.replace(/\D/g, ""); let sum = 0, alt = false;
  for (let i = d.length - 1; i >= 0; i--) { let n = +d[i]; if (alt) { n *= 2; if (n > 9) n -= 9; } sum += n; alt = !alt; }
  return d.length >= 13 && sum % 10 === 0; }
export function redactString(s, { allow = [] } = {}) {
  if (typeof s !== "string" || !s) return s;
  const kept = []; for (const a of allow) s = s.split(a).join(`\u0000${kept.push(a) - 1}\u0000`);
  for (const [name, re, rep] of [...SECRET_RULES, ...PII_RULES]) {
    re.lastIndex = 0; s = s.replace(re, rep ?? `[REDACTED_${name}]`);
  }
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => kept[+i]);
}
export function redactDeep(v, opts, depth = 0) {
  if (depth > 8) return "[TRUNCATED]";
  if (typeof v === "string") return redactString(v, opts);
  if (Array.isArray(v)) return v.map((x) => redactDeep(x, opts, depth + 1));
  if (v && typeof v === "object") { const o = {}; for (const [k, x] of Object.entries(v)) o[k] = redactDeep(x, opts, depth + 1); return o; }
  return v;
}
