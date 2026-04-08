#!/bin/bash
# Validate skill structure
# Usage: validate-skill.sh <skill-dir>

set -e

DIR="${1:?Usage: validate-skill.sh <skill-dir>}"
ERRORS=0

error() { echo "❌ $1"; ((ERRORS++)); }
warn() { echo "⚠️  $1"; }
ok() { echo "✅ $1"; }

# Check SKILL.md exists
if [[ ! -f "$DIR/SKILL.md" ]]; then
  error "Missing SKILL.md"
  exit 1
fi

# Check frontmatter
if ! head -1 "$DIR/SKILL.md" | grep -q "^---"; then
  error "Missing YAML frontmatter"
fi

# Check name field
NAME=$(grep "^name:" "$DIR/SKILL.md" | head -1 | cut -d: -f2 | tr -d ' ')
if [[ -z "$NAME" ]]; then
  error "Missing name field"
elif [[ ! "$NAME" =~ ^[a-z0-9-]+$ ]]; then
  error "Invalid name: must be lowercase, numbers, hyphens"
elif [[ ${#NAME} -gt 64 ]]; then
  error "Name too long (max 64 chars)"
else
  ok "Name: $NAME"
fi

# Check description
DESC=$(grep "^description:" "$DIR/SKILL.md" | head -1)
if [[ -z "$DESC" ]]; then
  error "Missing description field"
elif [[ ${#DESC} -gt 1024 ]]; then
  error "Description too long (max 1024 chars)"
else
  ok "Description present"
fi

# Check line count
LINES=$(wc -l < "$DIR/SKILL.md" | tr -d ' ')
if [[ $LINES -gt 500 ]]; then
  warn "SKILL.md has $LINES lines (recommend < 500)"
else
  ok "SKILL.md: $LINES lines"
fi

# Check for nested refs (simple heuristic)
if [[ -d "$DIR/docs" ]]; then
  for f in "$DIR/docs"/*.md; do
    [[ -f "$f" ]] || continue
    if grep -q '\[.*\](.*\.md)' "$f" 2>/dev/null; then
      warn "$(basename "$f") contains .md refs (keep 1 level deep)"
    fi
  done
fi

# Summary
echo ""
if [[ $ERRORS -gt 0 ]]; then
  echo "Found $ERRORS error(s)"
  exit 1
else
  echo "Validation passed"
fi
