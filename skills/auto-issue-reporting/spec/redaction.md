# Redaction spec (v1)

Error text is attacker writable and full of user data. Four layers, each assuming the previous one
failed. Patterns live in `spec/redact_patterns.json`; copies sit next to each template helper.
The JS, Python and Go helpers produce identical output on `tests/cases.hex`.

## Layer 1: SDK hooks (every runtime)

Always:

- `send_default_pii` / `sendDefaultPii` false.
- Local variables off: Python `include_local_variables=False`, Node `includeLocalVariables: false`,
  Go clear `Frames[].Vars`.
- Request bodies off: Python `max_request_body_size="never"`.
- `before_send`, `before_send_transaction` and `before_breadcrumb` run the redact helper over the whole
  event. Keep the release SHA in the allow list so `HEX40` does not eat it.
- User context: id only, and only a salted hash of it. Never email, name, username or IP.
- Tenant: tag `tenant` with `sha256(salt + dbname or org id)[:12]`. Never the raw name.

Python (FastAPI, control planes):

```python
from sentry_sdk.scrubber import EventScrubber, DEFAULT_DENYLIST
from redact import before_send, before_breadcrumb
sentry_sdk.init(
    dsn=os.environ.get("SENTRY_DSN") or None,
    environment=os.environ.get("SENTRY_ENVIRONMENT", "production"),
    release=os.environ.get("SENTRY_RELEASE") or None,
    send_default_pii=False, include_local_variables=False, max_request_body_size="never",
    event_scrubber=EventScrubber(recursive=True, denylist=DEFAULT_DENYLIST + ["passwd", "params", "x-api-key", "stripe-signature", "session_id", "set-cookie"]),
    before_send=before_send, before_send_transaction=before_send, before_breadcrumb=before_breadcrumb,
)
```

Do not enable `_experiments` data collection; it disables `EventScrubber`.

Node, Bun, Electron, Next.js (client, server and edge configs):

```js
import { redactDeep } from "./redact.mjs";
Sentry.init({
  dsn, sendDefaultPii: false, includeLocalVariables: false,
  beforeSend: (e) => redactDeep(e, { allow: [release] }),
  beforeSendTransaction: (e) => redactDeep(e, { allow: [release] }),
  beforeBreadcrumb: (b) => redactDeep(b, { allow: [release] }),
});
```

Keep Replay masking defaults (`maskAllText`, `maskAllInputs`, `blockAllMedia`) and never set
`networkDetailAllowUrls`.

Go (sentry-go):

```go
sentry.Init(sentry.ClientOptions{
    Dsn: dsn, Environment: env, Release: release, SendDefaultPII: false,
    BeforeSend: func(e *sentry.Event, h *sentry.EventHint) *sentry.Event { return redact.Event(e, release) },
    BeforeSendTransaction: func(e *sentry.Event, h *sentry.EventHint) *sentry.Event { return redact.Event(e, release) },
    BeforeBreadcrumb: func(b *sentry.Breadcrumb, h *sentry.BreadcrumbHint) *sentry.Breadcrumb { b.Message = redact.String(b.Message, release); return b },
})
```

Odoo (no sentry_sdk in the image): the `everjust_error_report` addon builds the event itself and runs
`redact_deep` before serializing. It never includes request params, headers, cookies, the session,
the user login, or `exc.context`.

## Layer 2: Sentry server side (org settings)

- Data Scrubber on, default scrubbers on, "Prevent storing of IP addresses" on.
- Advanced Data Scrubbing, method Replace, source `$string`: `@email`, `@creditcard`, `@ip`,
  `@bearer`, `@urlauth`, `@pemkey`, `@usssn`, `@iban`, `@password`, plus one "Regex Matches" rule per
  vendor token rule in `redact_patterns.json` (they contain no lookaround, so Relay accepts them).

## Layer 3: bridge allowlist

The bridge builds the issue from these fields only: exception type, in-app frames as
`file:function:line`, at most 300 characters of message, culprit, release, environment, first and
last seen, counts, user and tenant counts, short id and permalink. Every string goes through
`redactString`, then `neutralize`, then `fence`.

Never: request headers, body, cookies, query string, user, breadcrumbs, contexts, extra, local
variables, tags other than `release`, `environment` and `tenant` (counted, not printed).

Hostnames: customer and tenant domains are identity. Free text in an issue (message and culprit)
also replaces hostnames with `[host]` using a public suffix style TLD list, keeping only the
product's own API hosts when they help diagnosis.

Then the bridge runs the same JSON patterns as a canary over the finished title and body. Any
`[REDACTED_` free match of a secret rule means the issue is not filed; a content free issue
"Redaction canary tripped for <short id>" is filed instead with `redaction-tripped`.

## Layer 4: gate scan

The product repo's gate workflow runs gitleaks (`spec/canary.gitleaks.toml`,
`--ignore-gitleaks-allow`) and trufflehog (`--no-verification --fail`) over title and body before any
agent label is applied. Exit codes: gitleaks 1 means a leak, trufflehog 183 means a leak.

## Neutralizing untrusted text

`templates/js/neutralize.mjs`: NFKC; strip control characters, zero width and bidi characters,
variation selectors and the Unicode tag block; remove HTML comments, raw HTML, images and links;
defang `@mentions` and `/devin`, `/claude`, `/copilot`, `/codex`, `/gemini`; truncate; fence with a
backtick run longer than any inside the text.

## Testing

`node tests/run.mjs` decodes `tests/cases.hex` (synthetic tokens stored as hex of JSON with
every value reversed, so secret scanners and push protection ignore them) and checks that the JS, Python and Go helpers redact every case identically.
Every product copies these cases into its own test suite.
