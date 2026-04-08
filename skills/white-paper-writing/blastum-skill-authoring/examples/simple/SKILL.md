---
name: commit-messages
description: Generate conventional commit messages from git diffs. Use when writing commit messages or reviewing staged changes.
---
# Commit Messages

Format: `type(scope): description`

Types: feat, fix, docs, style, refactor, test, chore

**Example:**
```
feat(auth): add JWT token validation

Implement middleware for validating JWT tokens on protected routes
```

Keep subject <50 chars. Body explains why, not what.
