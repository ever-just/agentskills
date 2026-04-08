#!/bin/bash
# Lint a skill directory for common issues
# Usage: lint-skill.sh path/to/skill

set -e

SKILL_DIR="${1:-.}"
SKILL_FILE="$SKILL_DIR/SKILL.md"

if [[ ! -f "$SKILL_FILE" ]]; then
    echo "Error: SKILL.md not found in $SKILL_DIR"
    exit 1
fi

echo "Linting: $SKILL_DIR"
echo "---"

ERRORS=0
WARNINGS=0

# Check frontmatter exists
if ! head -1 "$SKILL_FILE" | grep -q '^---$'; then
    echo "ERROR: Missing YAML frontmatter"
    ((ERRORS++))
fi

# Check name field
NAME=$(grep -m1 '^name:' "$SKILL_FILE" | sed 's/name: *//')
if [[ -z "$NAME" ]]; then
    echo "ERROR: Missing 'name' field"
    ((ERRORS++))
elif [[ ${#NAME} -gt 64 ]]; then
    echo "ERROR: Name exceeds 64 chars: $NAME"
    ((ERRORS++))
elif [[ ! "$NAME" =~ ^[a-z0-9-]+$ ]]; then
    echo "ERROR: Name must be lowercase letters, numbers, hyphens: $NAME"
    ((ERRORS++))
fi

# Check description field
DESC=$(grep -m1 '^description:' "$SKILL_FILE" | sed 's/description: *//')
if [[ -z "$DESC" ]]; then
    echo "ERROR: Missing 'description' field"
    ((ERRORS++))
elif [[ ${#DESC} -gt 1024 ]]; then
    echo "ERROR: Description exceeds 1024 chars"
    ((ERRORS++))
fi

# Check line count
LINES=$(wc -l < "$SKILL_FILE" | tr -d ' ')
if [[ $LINES -gt 500 ]]; then
    echo "ERROR: SKILL.md has $LINES lines (max 500)"
    ((ERRORS++))
elif [[ $LINES -gt 100 ]]; then
    echo "WARN: SKILL.md has $LINES lines (prefer <100 for L1)"
    ((WARNINGS++))
fi

# Check for Windows paths
if grep -q '\\' "$SKILL_FILE" 2>/dev/null; then
    echo "WARN: Possible Windows-style paths detected"
    ((WARNINGS++))
fi

# Check for deeply nested references
DOCS_DIR="$SKILL_DIR/docs"
if [[ -d "$DOCS_DIR" ]]; then
    for f in "$DOCS_DIR"/*.md; do
        [[ -f "$f" ]] || continue
        if grep -q '\[.*\](.*\.md)' "$f" 2>/dev/null; then
            REF_FILE=$(basename "$f")
            echo "WARN: $REF_FILE contains nested references (keep 1 level deep)"
            ((WARNINGS++))
        fi
    done
fi

echo "---"
echo "Errors: $ERRORS, Warnings: $WARNINGS"

[[ $ERRORS -eq 0 ]] && echo "✓ Skill passes validation" || exit 1
