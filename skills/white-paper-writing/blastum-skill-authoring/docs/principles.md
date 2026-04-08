# Core Principles

The ideas here align with **widely published agent-skill guidance** (notably **Anthropic**’s public documentation on skills) and common practice elsewhere—always prefer the **source docs** when they conflict with this summary.

## 1. Token Economy

Context window is shared. Every token competes.

**Rule**: Only add what Claude doesn't know.

Challenge each line:
- Does Claude need this?
- Can I assume Claude knows this?
- Worth the token cost?

## 2. Progressive Disclosure

Load content only when needed:
1. **Metadata** (name/description): Always loaded
2. **SKILL.md body**: Loaded when skill triggers
3. **Referenced files**: Loaded on-demand

## 3. Degrees of Freedom

| Freedom | Use When | Example |
|---------|----------|---------|
| High (text) | Multiple valid approaches | Code review |
| Medium (templates) | Preferred pattern exists | Report format |
| Low (exact scripts) | Fragile/critical ops | DB migrations |

## 4. One Level Deep

References from SKILL.md → docs/file.md (good)  
References from docs/file.md → more/file.md (bad - partial reads)

## 5. Concise Defaults

- SKILL.md < 500 lines
- Description < 1024 chars
- Name: lowercase, hyphens, max 64 chars
- Third person descriptions
