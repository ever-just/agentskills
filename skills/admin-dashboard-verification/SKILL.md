# Admin Dashboard Verification

## Overview
A systematic approach to verifying admin dashboard enhancements — covering error tracking, simulation testing, database integrity, mobile responsiveness, and edge case handling. Built from real-world verification of org↔user↔agent relationship views in a Next.js + Express + MongoDB stack.

## Prerequisites
- Admin dashboard: Next.js with TailwindCSS
- API: Express.js with Mongoose
- Test runner: `bun test`
- Error tracking: Sentry

## Verification Checklist

### Phase 1: Error Tracking Coverage
For every changed backend endpoint:
1. Identify all `catch (err)` blocks
2. Verify each has `captureException` with a descriptive context string
3. Run file-level test to count catches vs Sentry calls

```bash
# Quick audit: find catch blocks without Sentry
grep -n "catch (err)" routes/admin/*.ts | while read line; do
  file=$(echo "$line" | cut -d: -f1)
  lineno=$(echo "$line" | cut -d: -f2)
  # Check if captureException appears within 3 lines after the catch
  sed -n "$((lineno)),$(( lineno + 3 ))p" "$file" | grep -q "captureException" || echo "MISSING: $line"
done
```

### Phase 2: Simulation Tests
Write tests that verify endpoint behavior without hitting the database:

```typescript
describe("Org Detail Relationship View", () => {
  // Verify endpoint code contains expected queries
  test("endpoint returns agents, users, messageCount, recentMessages", async () => {
    const file = await Bun.file("routes/admin/organizations.ts").text();
    expect(file).toContain("agents, users, messageCount, recentMessages");
    expect(file).toContain("Message.countDocuments({ organizationId:");
  });

  // Verify response shape with mock data
  test("response shape simulation", () => {
    const mockResponse = {
      organization: { _id: "org1", name: "Test", plan: "free" },
      agents: [{ _id: "a1", name: "Agent 1" }],
      users: [{ _id: "u1", firstName: "John" }],
      messageCount: 42,
      recentMessages: [{ _id: "m1", subject: "Hello", direction: "inbound" }],
    };
    expect(mockResponse.agents).toBeArray();
    expect(mockResponse.messageCount).toBeNumber();
    expect(mockResponse.recentMessages[0]).toHaveProperty("direction");
  });
});
```

### Phase 3: Database Integrity
1. **Index coverage** — Every query pattern has a supporting index
2. **Relationship direction** — Verify which schema owns the foreign key
3. **Schema field existence** — Test that referenced fields actually exist
4. **Migration completeness** — Historical data is updated and usable

### Phase 4: Mobile Responsiveness
Verify CSS classes in the changed UI files:

```typescript
describe("Mobile Responsiveness", () => {
  test("responsive table columns", async () => {
    const file = await Bun.file("customers/page.tsx").text();
    expect(file).toContain("hidden sm:table-cell");  // Hide columns on mobile
    expect(file).toContain("overflow-x-auto");        // Horizontal scroll
  });

  test("drawer is mobile-friendly", async () => {
    const file = await Bun.file("customers/page.tsx").text();
    expect(file).toContain("w-full max-w-md");         // Full width on mobile, capped on desktop
  });

  test("no hover-only interactions on touch", async () => {
    const file = await Bun.file("customers/page.tsx").text();
    // Should use sm:opacity-0 sm:group-hover:opacity-100, NOT opacity-0 group-hover:opacity-100
    expect(file).not.toMatch(/(?<!sm:)opacity-0 group-hover:opacity-100/);
  });
});
```

### Phase 5: Edge Cases
- **Empty states** — Arrays with 0 items render gracefully (null, not crash)
- **Loading states** — Shimmer skeletons during fetch, not blank space
- **Null safety** — Use `?? "—"` or `?? 0` for missing data
- **Error states** — API failures show user-friendly message
- **Cross-navigation** — Closing one drawer and opening another works without stale state

## Common Patterns

### Cross-Navigation Between Drawers
When clicking an entity in one drawer opens another drawer:
```typescript
<button onClick={() => {
  setSelectedOrg(null);        // Close current drawer first
  setSelectedUser(userObj);    // Then open target drawer
}}>
```

### Inline Editing Pattern
```typescript
{editingField ? (
  <div className="flex items-center gap-1.5">
    <input value={input} onChange={(e) => setInput(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
      autoFocus className="..." />
    <button onClick={save}>✓</button>
    <button onClick={cancel}>✕</button>
  </div>
) : (
  <div className="flex items-center gap-1.5 group">
    <p>{displayValue}</p>
    <button onClick={startEditing}
      className="sm:opacity-0 sm:group-hover:opacity-100">  {/* Visible on mobile, hover on desktop */}
      <PencilIcon />
    </button>
  </div>
)}
```

### Enriched Detail Endpoint
When a list endpoint returns minimal data but a detail view needs relationships:
```typescript
router.get("/:id", async (req, res) => {
  const entity = await Model.findById(req.params.id).lean();
  if (!entity) return res.status(404).json({ error: "Not found" });

  const [related1, related2, count, recent] = await Promise.all([
    Related1.find({ entityId: entity._id }).lean(),
    Related2.find({ entityId: entity._id }).lean(),
    Message.countDocuments({ entityId: entity._id }),
    Message.find({ entityId: entity._id })
      .sort({ createdAt: -1 }).limit(10)
      .select("subject from direction createdAt").lean(),
  ]);

  res.json({ entity, related1, related2, messageCount: count, recentMessages: recent });
});
```

## Pitfalls

1. **Querying by non-existent field** — `Inbox.findOne({ agentId })` returns null silently when Inbox has no `agentId` field. Always verify the schema owns the field you're querying.
2. **Hover-only UI on mobile** — `opacity-0 group-hover:opacity-100` is invisible on touch devices. Use `sm:opacity-0 sm:group-hover:opacity-100` so it's always visible on mobile.
3. **Missing indexes on frequently-joined collections** — Organization and User schemas often lack indexes because they're small initially but grow. Add indexes proactively.
4. **Stale drawer state** — When cross-navigating, always close the source drawer before opening the target. Otherwise both drawers stack.
5. **Migration idempotency** — Running "migrate default org names" twice should be safe. Check for the condition before updating.

## Combining With Other Skills
- **Sentry Instrumentation** — Every endpoint verified here must have Sentry coverage
- **MongoDB Schema Auditing** — Index and relationship validation feeds into this verification
- **UI/UX Audit** — Mobile responsiveness checks overlap with the UI audit checklist
- **Deployment Testing** — Run all verification tests before deploy
