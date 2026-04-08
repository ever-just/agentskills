---
name: skill-authoring
description: Write and refactor agent skills using published best practices (Anthropic and others), emphasizing token efficiency and progressive disclosure. Use when authoring new skills, merging learning from other skills into one organized skill, or restructuring skills sensibly.
---
# Skill Authoring

Write skills according to **best practices published by Anthropic and others**. The focus is **token efficiency** and **progressive disclosure**: small, high-signal roots that load deeper material only when needed.

Use this skill to **refactor** existing skills without bloat, and to **integrate new learning** (or several related skills) into a **single, organized** skill set. **Most of the skills in this repository were written or refactored with these patterns.**

## Structure

**Level 1** (this file): Frontmatter + pointers only  
**Level 2**: Core skill content OR index to Level 3  
**Level 3**: Detailed topic files (for complex skills)

## Quick Reference

| Skill Complexity | Structure |
|-----------------|-----------|
| Simple | L1 → L2 (single file) |
| Complex | L1 → L2 (index) → L3 (topic files) |

## Resources

- [Core principles](docs/principles.md)
- [Structure patterns](docs/structure.md)
- [Templates](docs/templates.md)
- [Anti-patterns](docs/anti-patterns.md)
