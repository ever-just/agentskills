# Example: Simple Skill

## Structure

```
commit-helper/
├── SKILL.md
└── docs/
    └── guide.md
```

## SKILL.md

```markdown
---
name: commit-helper
description: Generate commit messages from git diffs. Use when committing changes or writing commit messages.
---
# Commit Helper

Generate conventional commit messages.

## Resources
- [Guide](docs/guide.md)
```

## docs/guide.md

```markdown
# Commit Message Guide

## Format
\`\`\`
<type>(<scope>): <subject>

<body>
\`\`\`

## Types
- feat: New feature
- fix: Bug fix
- docs: Documentation
- refactor: Code restructure
- test: Tests
- chore: Maintenance

## Examples

**Input**: Added JWT authentication
**Output**:
\`\`\`
feat(auth): implement JWT authentication

Add login endpoint and token validation middleware
\`\`\`

**Input**: Fixed date display bug
**Output**:
\`\`\`
fix(ui): correct date formatting

Use UTC timestamps consistently
\`\`\`
```
