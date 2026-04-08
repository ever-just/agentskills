#!/usr/bin/env bash
# One-time backfill: add title to metadata/index.meta.md for global notebooks that lack it.
# Uses first line of ## Overview if present, else slug-to-phrase. Run from any dir.
# Usage: bash backfill-titles.sh

set -euo pipefail
GLOBAL_BASE="${NOTEBOOK_HOME:-$HOME/.cursor/notebooks}"
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$GLOBAL_BASE" 2>/dev/null || { echo "No global library at: $GLOBAL_BASE"; exit 0; }

for d in */; do
  [ -d "$d" ] || continue
  slug=$(basename "$d")
  idx="${d}metadata/index.meta.md"
  [ -f "$idx" ] || continue
  if grep -q '^title:' "$idx"; then
    continue
  fi
  # Use first line of Overview (after ## Overview) as title if it looks like a sentence
  overview=$(sed -n '/^## Overview$/,/^## /p' "$idx" | sed '1d;/^## /q' | head -1 | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
  if [ -n "$overview" ] && [ "${#overview}" -lt 120 ]; then
    title="$overview"
  else
    # Slug to title: hyphens to spaces, capitalize words
    title=$(echo "$slug" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1')
  fi
  # Insert title after topic: line in frontmatter (escape " in title)
  if grep -q '^topic:' "$idx"; then
    safe_title=$(echo "$title" | sed 's/"/\\"/g')
    tmp=$(mktemp)
    while IFS= read -r line; do
      printf '%s\n' "$line"
      case "$line" in topic:*) printf 'title: "%s"\n' "$safe_title" ;; esac
    done < "$idx" > "$tmp" && mv "$tmp" "$idx"
    echo "Set title for $slug: $title"
  fi
done
