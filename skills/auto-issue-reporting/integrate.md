# Integrate the pipeline into a product

Work in a fresh worktree from origin's default branch, one draft PR per repo, following the repo's
own CLAUDE.md or AGENTS.md. Everything is opt-in: without a DSN the product behaves exactly as before.

## Checklist (every product)

1. **Sentry projects.** One project per surface in org `everjust` (names in spec/pipeline.md). DSNs are
   runtime config, never committed except where a repo already hardcodes public client DSNs.
2. **Redaction helper.** Copy the helper for the language (`templates/go`, `templates/js`,
   `templates/python`) and its `redact_patterns.json` next to the code that initializes Sentry.
3. **SDK init** per spec/redaction.md layer 1: no PII, no locals, no bodies, redact hooks, release and
   environment set, tenant as a salted hash tag.
4. **Capture gaps.** Make sure these reach Sentry: unhandled exceptions and rejections, 5xx responses
   that were caught and converted, background jobs and goroutines that recover and log, terminal
   queue job failures (not every retry).
5. **Client side throttle** for noisy runtimes: at most one event per fingerprint per 10 minutes per
   process, and a hard cap per process per hour. Required wherever the error volume could exhaust the
   5k per month Sentry quota (Odoo today).
6. **Report this problem.** On error screens, show a short optional text box only when Sentry is
   initialized, and send `captureFeedback({ message, associatedEventId })` with the id returned by
   `captureException`. No name, no email. Never create an issue from feedback alone.
7. **Labels and gate.** Create the labels from `templates/github/labels.json`, add
   `templates/github/auto-issue-gate.yml` (set repo variable `AUTO_ISSUE_BOT` to the App's bot login) and
   `templates/github/bug.yml`, and add repo variable `DEVIN_AUTOFIX=false` until Devin is ready.
8. **Tests.** Port `tests/cases.hex` into the repo's test framework: every case must come out
   containing `[REDACTED`. Add a test that the hooks are no-ops without a DSN, and one that a thrown
   error inside `before_send` never breaks the request.
9. **Docs and env.** Register new env vars wherever the repo's allowlists live, update `.env.example`
   and ops docs in the same PR.
10. **Verify.** Throw a synthetic error through a test-only path in a local or staging run with a
    sandbox DSN, and confirm the Sentry event contains no canary values.

## Go (net/http, sentry-go)

- Copy `templates/go/redact.go` and `redact_patterns.json` into each binary that needs it (for
  example `cmd/server/redact/`), because each Go service is its own module.
- In `BeforeSend` call `redact.Event(e, release)` after any existing scrubbing.
- Panic middleware: `hub.RecoverWithContext(ctx, err)` then write the 500. Also capture in the
  non-panic 5xx path with `hub.CaptureException(err)` and a `route` tag (pattern, not the raw path).
- Goroutines: wrap bodies in a helper that recovers, captures with a `job` tag, and logs.
- Flush on shutdown: `sentry.Flush(2 * time.Second)`.
- Never break `http.Hijacker` or `http.Flusher` on proxies: pass the original writer through.

## Bun or Node with Express 5

- `Sentry.init` stays first in the entrypoint. Add `redactDeep` hooks and remove any middleware that
  sets email or full name on the scope; set `{ id: hash(userId) }` at most.
- After init: `process.on("uncaughtException", ...)` and `process.on("unhandledRejection", ...)` that
  capture, flush with a timeout, and keep existing shutdown behavior.
- Widen the logger's redact paths to cover `token`, `secret`, `access_token`, `refresh_token`,
  `x-api-key`, signature headers, `email`, `phone`, `body`.
- Queue workers: capture only terminal failures (`attemptsMade >= opts.attempts`), tag `queue` and
  `job` name, never the job data.

## Next.js 15 and 16 (App Router)

- Hooks go in `instrumentation-client.ts`, `sentry.server.config.ts` and `sentry.edge.config.ts` (or
  the repo's existing equivalents). In Next 16, read `node_modules/next/dist/docs` first; middleware
  is `proxy.ts` and `onRequestError` context uses `proxy` instead of `middleware`.
- `instrumentation.ts`: `export const onRequestError = (err, request, context) => Sentry.captureRequestError(err, request, context)`
  and tag `digest` when the error has one.
- `global-error.tsx`: client component that renders its own `<html>` and `<body>`, captures the error,
  and shows the report box. Handle `reset` (15) and `retry` (16.3).
- `error.tsx` and class error boundaries: keep the id from `Sentry.captureException(error, { tags: { digest } })`,
  show the report box only when `Sentry.getClient()` exists, then
  `Sentry.captureFeedback({ message, associatedEventId: id, tags: { digest } })`.
- Self-hostable apps: `withSentryConfig` and source map upload must be skipped cleanly when the auth
  token or DSN env is missing.

## FastAPI

- Init per spec/redaction.md. Add `@app.exception_handler(Exception)` that captures, renders the
  existing error template with the event id, and returns 500. Keep existing HTTPException handlers.
- Report endpoint: `POST /report-problem` with CSRF or same-site protection and a small rate limit,
  body `{ event_id, message }`, max 1000 characters, forwarded as a Sentry feedback item (see
  the Odoo envelope section for the item shape if the SDK has no helper).

## Odoo 19 (no sentry_sdk in the image)

Build an addon, for example `everjust_error_report`, with no new pip dependency:

- `reporter.py`: parse the DSN from `ir.config_parameter`-free sources only (an env var or
  `odoo.tools.config` key such as `everjust_sentry_dsn`), build events, and POST envelopes with
  `urllib.request` from a daemon thread fed by a bounded `queue.Queue(maxsize=200)`. Drop when full.
  - Endpoint `https://<host>/api/<project_id>/envelope/`
  - Headers `Content-Type: application/x-sentry-envelope` and
    `X-Sentry-Auth: Sentry sentry_version=7, sentry_client=everjust-odoo/1.0, sentry_key=<public key>`
  - Body is three lines: `{"event_id":"<32 hex>","sent_at":"<iso>"}`, `{"type":"event"}`, then the
    event JSON (`event_id`, `timestamp`, `platform: "python"`, `level`, `logger`, `environment`,
    `release`, `tags: {tenant, module}`, `exception.values[{type, value, module, stacktrace.frames[{filename, function, lineno, module, in_app}], mechanism: {type: "odoo", handled: false}}]`).
  - Feedback item: `{"type":"feedback"}` with an event of `type: "feedback"` and
    `contexts.feedback: {message, associated_event_id}`.
- Capture points:
  - Override `ir.http._handle_error(cls, exception)` (classmethod in 19.0; there is no
    `_handle_exception`). Capture non user errors only (skip `UserError`, `AccessError`,
    `ValidationError`, `MissingError`, `SessionExpiredException`, werkzeug `HTTPException`), put the
    event id into `exception.context["sentry_event_id"]` when possible, then call super.
  - A `logging.Handler` attached once per process at module import for `odoo.*` and `everjust.*`
    records at ERROR or above. Records with `exc_info` become exception events. `odoo.sql_db` "bad
    query" records become a message event of the PostgreSQL error class only: never the SQL text or
    parameters. Skip records already captured by `_handle_error` (track exception ids).
- Tenant: `tags.tenant = sha256(salt + dbname)[:12]` from `threading.current_thread().dbname`.
- Throttle: per process, one event per fingerprint (type + top in-app frame + logger) per 10 minutes,
  and at most 30 events per process per hour. Count what was dropped and send one summary message per
  hour.
- Web client: register an `error_handlers` entry with sequence between 1 and 96 that returns false,
  and extend `web.ErrorDialog` with a "Report this problem" button that posts
  `{event_id, message}` to a JSON route, which sends a feedback item. Leave `WarningDialog` alone.
- Existing crash beacon (`everjust_brand` `/ej/telemetry/crash`): also send a structured event from
  the controller with kind, bundle, message and stack only (no login, no href query, no user agent).
- Deploy: installing or updating an addon is an Odoo class deploy. Plan it for a maintenance window
  and prefer the addons only blue/green path.

## Electron

`@sentry/electron` in main and renderer with the same hooks; skip for now if the app is not shipped to
customers.
