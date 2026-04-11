# Bun Testing Patterns

## Overview
Patterns for writing fast simulation and verification tests using Bun's built-in test runner. Focuses on file-based verification, mock data simulation, and code coverage auditing — without needing a running database or server.

## Prerequisites
- Bun runtime installed (`brew install oven-sh/bun/bun`)
- Test files named `*.test.ts` or `*.spec.ts`

## Quick Start

```bash
# Run a single test file
bun test tests/my-tests.test.ts

# Run with timeout (prevents hangs)
bun test tests/my-tests.test.ts --timeout 10000

# Run all tests
bun test

# Watch mode
bun test --watch
```

## Common Patterns

### File Content Verification
Test that source files contain expected patterns without importing/executing them:

```typescript
import { describe, test, expect } from "bun:test";

describe("API Route Structure", () => {
  test("user routes import Sentry", async () => {
    const file = await Bun.file("routes/admin/users.ts").text();
    expect(file).toContain("captureException");
    expect(file).toContain("SentryService");
  });

  test("every catch block has error tracking", async () => {
    const file = await Bun.file("routes/admin/users.ts").text();
    const catches = (file.match(/} catch \(err\)/g) || []).length;
    const sentryCaptures = (file.match(/captureException\(/g) || []).length;
    expect(sentryCaptures).toBeGreaterThanOrEqual(catches);
  });
});
```

### Mock Data Shape Simulation
Validate API response shapes without hitting a real API:

```typescript
describe("Response Shape", () => {
  test("org detail has expected fields", () => {
    const response = {
      organization: { _id: "org1", name: "Test", plan: "free" },
      agents: [{ _id: "a1", name: "Agent 1" }],
      users: [{ _id: "u1", email: "user@test.com" }],
      messageCount: 42,
      recentMessages: [],
    };
    expect(response.agents).toBeArray();
    expect(response.messageCount).toBeNumber();
    expect(response.recentMessages).toBeArray();
    expect(response.organization).toHaveProperty("name");
    expect(response.organization).toHaveProperty("plan");
  });
});
```

### Business Logic Simulation
Test pure functions or logic patterns independently:

```typescript
describe("Org Name Migration", () => {
  function generateOrgName(firstName?: string): string {
    return `${firstName || "User"}'s Organization`;
  }

  test("names org after user", () => {
    expect(generateOrgName("John")).toBe("John's Organization");
  });

  test("falls back when no name", () => {
    expect(generateOrgName(undefined)).toBe("User's Organization");
    expect(generateOrgName("")).toBe("User's Organization");
  });
});
```

### CSS/UI Class Verification
Ensure responsive classes are present in UI files:

```typescript
describe("Mobile Responsiveness", () => {
  test("tables have responsive column hiding", async () => {
    const file = await Bun.file("../admin/src/app/(dashboard)/customers/page.tsx").text();
    expect(file).toContain("hidden sm:table-cell");
    expect(file).toContain("overflow-x-auto");
  });

  test("drawers constrain width on mobile", async () => {
    const file = await Bun.file("../admin/src/app/(dashboard)/customers/page.tsx").text();
    expect(file).toContain("w-full max-w-md");
  });
});
```

### Schema Field Verification
Verify database schema files contain expected fields:

```typescript
describe("Schema Compatibility", () => {
  test("Agent schema has required refs", async () => {
    const file = await Bun.file("db/mongo/schemas/Agent.ts").text();
    expect(file).toContain("organizationId");
    expect(file).toContain("inboxId");
    expect(file).toContain('ref: "Inbox"');
  });
});
```

### Suppressing Strict TypeScript in Tests
When test assertions conflict with strict null checks:

```typescript
// @ts-nocheck
// ^^^ Add at top of test file if strict mode causes issues with test assertions
import { describe, test, expect } from "bun:test";
```

## Bun-Specific Matchers
Bun extends Jest matchers with extras:

| Matcher | Usage |
|---------|-------|
| `toBeArray()` | Checks value is an array |
| `toBeNumber()` | Checks value is a number |
| `toHaveProperty(key)` | Checks object has key |
| `toContain(str)` | String contains substring |
| `toMatch(regex)` | String matches regex |
| `toBeGreaterThanOrEqual(n)` | Numeric comparison |

## File Path Tips
- Bun resolves paths relative to the **test file location**, not cwd
- Use `Bun.file("relative/path").text()` to read files as strings
- Use `../` to reach sibling directories (e.g., `../admin/src/...`)

## Pitfalls

1. **Hanging tests** — Always pass `--timeout 10000` to prevent indefinite hangs
2. **Path resolution** — `Bun.file()` resolves relative to the test file's directory, not process.cwd()
3. **Async file reads** — `Bun.file().text()` returns a Promise — always `await` it
4. **Regex in toContain** — `toContain` is literal string matching, not regex. Use `toMatch` for regex
5. **`npx bun test` vs `bun test`** — Use `bun test` directly. `npx bun` adds overhead and may use wrong version
6. **Empty test output** — If `bun test` shows no output, check that describe/test are properly imported from `bun:test`

## Combining With Other Skills
- **Sentry Instrumentation** — Verify Sentry coverage with file content tests
- **MongoDB Schema Auditing** — Verify schema field presence and index definitions
- **Admin Dashboard Verification** — Run full verification suite before deploy
- **Deployment Testing** — Include `bun test` in pre-deploy checks
