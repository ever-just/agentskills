"""Redaction helpers shared by every Python runtime (FastAPI, Odoo). Patterns: spec/redact_patterns.json."""
import json, os, re

_PATTERNS = os.environ.get("REDACT_PATTERNS_PATH") or os.path.join(os.path.dirname(os.path.abspath(__file__)), "redact_patterns.json")
_RULES = []
for r in json.load(open(_PATTERNS))["rules"]:
    repl = r.get("repl")
    if repl: repl = re.sub(r"\$\{(\d+)\}", r"\\g<\1>", repl)
    _RULES.append((r["name"], re.compile(r["re"], re.I if "i" in r["flags"] else 0), repl, r.get("luhn", False)))

def _luhn(s):
    d = [int(c) for c in s if c.isdigit()]
    if len(d) < 13: return False
    tot = 0
    for i, n in enumerate(reversed(d)):
        if i % 2: n = n * 2 - 9 if n * 2 > 9 else n * 2
        tot += n
    return tot % 10 == 0

def redact_str(s, allow=()):
    if not isinstance(s, str) or not s: return s
    kept = []
    for a in allow:
        if a in s: kept.append(a); s = s.replace(a, f"\x00{len(kept)-1}\x00")
    for name, rx, repl, luhn in _RULES:
        if luhn: s = rx.sub(lambda m: f"[REDACTED_{name}]" if _luhn(m.group(0)) else m.group(0), s)
        else: s = rx.sub(repl or f"[REDACTED_{name}]", s)
    return re.sub(r"\x00(\d+)\x00", lambda m: kept[int(m.group(1))], s)

def redact_deep(v, allow=(), depth=0):
    if depth > 8: return "[TRUNCATED]"
    if isinstance(v, str): return redact_str(v, allow)
    if isinstance(v, list): return [redact_deep(x, allow, depth + 1) for x in v]
    if isinstance(v, dict): return {k: redact_deep(x, allow, depth + 1) for k, x in v.items()}
    return v

def before_send(event, hint):   # sentry_sdk.init(before_send=before_send, before_send_transaction=before_send)
    return redact_deep(event)

def before_breadcrumb(crumb, hint):
    return redact_deep(crumb)
