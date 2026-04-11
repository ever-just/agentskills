# Sentry Error Tracking Instrumentation

## Overview
Patterns for adding Sentry error tracking to Express.js API routes and Next.js API routes. Covers backend captureException, breadcrumbs, and verification testing.

## Prerequisites
- `@sentry/node` installed in the API project
- A SentryService wrapper (recommended) that exports `captureException` and `addBreadcrumb`
- Sentry DSN configured in environment variables

## Quick Start

### 1. Create a SentryService Wrapper
```typescript
// services/SentryService.ts
import * as Sentry from "@sentry/node";

export function captureException(err: Error, context?: Record<string, any>) {
  Sentry.captureException(err, { extra: context });
}

export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
  Sentry.addBreadcrumb(breadcrumb);
}
```

### 2. Instrument Every Catch Block
```typescript
import { captureException } from "../../services/SentryService";

router.get("/endpoint", async (req, res) => {
  try {
    // ... route logic
  } catch (err) {
    captureException(
      err instanceof Error ? err : new Error(String(err)),
      { context: "descriptive_endpoint_name" }
    );
    res.status(500).json({ error: String(err) });
  }
});
```

### 3. Add Breadcrumbs for Multi-Step Operations
```typescript
addBreadcrumb({
  category: "service",
  message: "Redis token persistence failed, falling back to MongoDB",
  level: "warning",
  data: { orgId, month },
});
```

## Common Patterns

### Express Route Coverage
Every `catch (err)` block in every route handler MUST have `captureException`. The pattern:
```typescript
} catch (err) {
  captureException(err instanceof Error ? err : new Error(String(err)), { context: "admin_user_list" });
  res.status(500).json({ error: String(err) });
}
```

Use descriptive context strings like:
- `admin_user_list`, `admin_user_detail`, `admin_user_patch`, `admin_user_delete`
- `admin_org_list`, `admin_org_stats`, `admin_org_detail`, `admin_org_patch`
- `admin_agent_list`, `admin_agent_detail`, `admin_agent_delete`

### Next.js API Route Coverage
```typescript
import * as Sentry from "@sentry/nextjs";

export async function GET(request: NextRequest) {
  try {
    // ... logic
  } catch (err: any) {
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)));
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

### Verification Test Pattern (Bun)
Test that every catch block has Sentry coverage by counting catches vs captureException calls:
```typescript
test("all catch blocks report to Sentry", async () => {
  const file = await Bun.file("routes/admin/users.ts").text();
  const catches = (file.match(/} catch \(err\)/g) || []).length;
  const sentryCaptures = (file.match(/captureException\(/g) || []).length;
  expect(sentryCaptures).toBeGreaterThanOrEqual(catches);
});
```

## Pitfalls

1. **Bare `catch` blocks** — Easy to forget Sentry in new endpoints. Always add the `captureException` line immediately when writing a new `try/catch`.
2. **Non-Error objects** — `throw "string"` or `throw { msg }` happens. Always wrap: `err instanceof Error ? err : new Error(String(err))`.
3. **Inner catch blocks** — Some operations have nested catches (e.g., Stripe cancel inside org delete). These are intentionally silent — only instrument the outer/main catch.
4. **Import the wrapper, not Sentry directly** — Keeps instrumentation consistent and testable.
5. **Don't captureException for expected errors** — 404s and validation errors are NOT exceptions. Only instrument 500-level server errors.

## Combining With Other Skills
- **Deployment Testing** — After adding Sentry, run verification tests before deploy
- **MongoDB Schema Auditing** — Sentry catches runtime schema/query errors that static analysis misses
