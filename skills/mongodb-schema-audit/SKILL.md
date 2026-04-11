# MongoDB Schema Auditing & Migration

## Overview
Patterns for auditing MongoDB/Mongoose schemas — finding missing indexes, validating relationship integrity, detecting broken queries, and running data migrations. Critical for admin dashboards that join data across collections.

## Prerequisites
- Mongoose 8.x with TypeScript
- Access to schema files (`db/mongo/schemas/*.ts`)
- `bun test` or equivalent for verification tests

## Quick Start

### 1. Audit Index Coverage
Every query pattern needs a supporting index. Common gaps:

```bash
# Find all schemas and their indexes
grep -rn '\.index(' db/mongo/schemas/ --include='*.ts'

# Find schemas with NO indexes (dangerous)
for f in db/mongo/schemas/*.ts; do
  grep -q '\.index(' "$f" || echo "NO INDEX: $f"
done
```

### 2. Map Query Patterns to Indexes
For every `Model.find()`, `Model.countDocuments()`, `Model.aggregate()`:
```
Query: Organization.find({ users: userId })
Need:  organizationSchema.index({ users: 1 })

Query: Message.find({ organizationId }).sort({ createdAt: -1 })
Need:  messageSchema.index({ organizationId: 1, createdAt: -1 })

Query: Agent.find({ organizationId })
Need:  agentSchema.index({ organizationId: 1 })
```

### 3. Add Missing Indexes
```typescript
// Always add before the model export
organizationSchema.index({ users: 1 });
organizationSchema.index({ name: 1 });
organizationSchema.index({ plan: 1 });
organizationSchema.index({ createdAt: -1 });

export default mongoose.model<IOrganization>("Organization", organizationSchema);
```

## Common Patterns

### Relationship Validation
Mongoose refs define relationships but don't enforce them. Verify the direction:

```typescript
// Agent has inboxId → Inbox (Agent owns the reference)
// CORRECT: Inbox.findById(agent.inboxId)
// WRONG:   Inbox.findOne({ agentId: agent._id })  // agentId doesn't exist on Inbox!

// Organization has users[] array
// CORRECT: Organization.find({ users: userId })
// User has organizations[] array
// CORRECT: User.find({ organizations: orgId })
```

**Key rule:** Always verify the field exists on the schema before querying it. A query on a non-existent field silently returns null/empty — no error, just no data.

### Data Migration Patterns
For renaming/transforming existing data:

```typescript
router.post("/migrate-names", async (_req, res) => {
  try {
    const targets = await Model.find({ field: "old_value" }).lean();
    if (targets.length === 0) {
      return res.json({ migrated: 0, message: "Nothing to migrate" });
    }

    let migrated = 0;
    for (const doc of targets) {
      const newValue = computeNewValue(doc);
      await Model.findByIdAndUpdate(doc._id, { field: newValue });
      migrated++;
    }

    res.json({ migrated, total: targets.length });
  } catch (err) {
    captureException(err);
    res.status(500).json({ error: String(err) });
  }
});
```

**Migration best practices:**
- Always return `{ migrated, total }` for auditability
- Make migrations idempotent (safe to run multiple times)
- Handle empty results gracefully (return early, don't error)
- Add Sentry tracking to the catch block
- Use `.lean()` for read-only queries (faster)

### Schema Verification Tests
```typescript
describe("Database Schema Compatibility", () => {
  test("Organization schema has required fields", async () => {
    const file = await Bun.file("db/mongo/schemas/Organization.ts").text();
    expect(file).toContain("name");
    expect(file).toContain("plan");
    expect(file).toContain("users");
  });

  test("Agent→Inbox relationship is correct direction", async () => {
    const file = await Bun.file("db/mongo/schemas/Agent.ts").text();
    expect(file).toContain("inboxId");
    expect(file).toContain('ref: "Inbox"');
  });

  test("Message has organizationId index for admin queries", async () => {
    const file = await Bun.file("db/mongo/schemas/Message.ts").text();
    expect(file).toContain("organizationId: 1");
  });
});
```

### Index Types Cheat Sheet
| Index Type | When to Use | Example |
|-----------|-------------|---------|
| Single field | Simple equality/sort | `{ email: 1 }` |
| Compound | Multi-field queries | `{ organizationId: 1, createdAt: -1 }` |
| Unique | Enforce uniqueness | `{ email: 1 }, { unique: true }` |
| Sparse | Only index docs with field | `{ externalId: 1 }, { sparse: true }` |
| TTL | Auto-delete old docs | `{ createdAt: 1 }, { expireAfterSeconds: 86400 }` |

## Pitfalls

1. **Querying non-existent fields** — MongoDB won't error. `Inbox.findOne({ agentId })` returns null silently if `agentId` isn't in the schema. Always verify field exists.
2. **Missing indexes on array fields** — `Organization.find({ users: userId })` does a collection scan without `index({ users: 1 })`. MongoDB multikey indexes handle arrays.
3. **Forgetting `createdAt` index** — Every collection queried with `.sort({ createdAt: -1 })` needs this index or it scans the full collection.
4. **Unique index on existing data** — Adding `{ unique: true }` to a field with duplicates will fail at startup. Clean data first or handle the error.
5. **`.lean()` for read-only** — Always use `.lean()` on queries where you don't need Mongoose document methods. 3-5x faster.

## Combining With Other Skills
- **Sentry Instrumentation** — Catches runtime query errors that schema audits miss
- **Deployment Testing** — Run schema verification tests before every deploy
- **Admin Dashboard Verification** — Admin panels expose relationship views that depend on correct indexes
