#!/usr/bin/env bash
# Library-style checkout/check-in for global notebooks.
# Checkout: copy global → workspace (so it's indexed and editable); register in .notebook-checkouts.
# Check-in: copy workspace → global, then remove local copy; unregister from .notebook-checkouts.
# Sync: copy workspace → global (update library), keep local copy and stay registered.
#
# Usage:
#   notebook-library.sh checkout <topic-slug> [workspace_root]
#   notebook-library.sh checkin  <topic-slug> [workspace_root]
#   notebook-library.sh sync     <topic-slug> [workspace_root]
#   notebook-library.sh where     <topic-slug>
#   notebook-library.sh list
#   notebook-library.sh catalog
#
# Default workspace_root = $PWD. Global base = $NOTEBOOK_HOME or ~/.cursor/notebooks.
# Checkout state: $GLOBAL_BASE/.notebook-checkouts (topic<TAB>workspace_root per line).

set -euo pipefail

CMD="${1:-}"
TOPIC="${2:-}"
WORKSPACE_ROOT="${3:-$PWD}"
GLOBAL_BASE="${NOTEBOOK_HOME:-$HOME/.cursor/notebooks}"
WORKSPACE_ROOT="$(cd "$WORKSPACE_ROOT" && pwd)"
WORKSPACE_NOTEBOOK="${WORKSPACE_ROOT}/notebook"
CHECKOUTS_FILE="${GLOBAL_BASE}/.notebook-checkouts"

usage() {
  echo "Usage: notebook-library.sh checkout <topic-slug> [workspace_root]"
  echo "       notebook-library.sh checkin  <topic-slug> [workspace_root]"
  echo "       notebook-library.sh sync     <topic-slug> [workspace_root]"
  echo "       notebook-library.sh where    <topic-slug>"
  echo "       notebook-library.sh list"
  echo "       notebook-library.sh catalog"
  exit 1
}

# Append this workspace to checkouts for TOPIC if not already present.
register_checkout() {
  local line="${1}"$'\t'"${2}"
  mkdir -p "$GLOBAL_BASE"
  if [ ! -f "$CHECKOUTS_FILE" ] || ! grep -Fxq "$line" "$CHECKOUTS_FILE" 2>/dev/null; then
    echo "$line" >> "$CHECKOUTS_FILE"
  fi
}

# Remove this workspace from checkouts for TOPIC.
unregister_checkout() {
  local line="${1}"$'\t'"${2}"
  if [ -f "$CHECKOUTS_FILE" ]; then
    grep -Fvx "$line" "$CHECKOUTS_FILE" > "${CHECKOUTS_FILE}.tmp" 2>/dev/null && mv "${CHECKOUTS_FILE}.tmp" "$CHECKOUTS_FILE" || true
  fi
}

case "$CMD" in
  checkout)
    [ -n "$TOPIC" ] || usage
    if [ ! -d "$GLOBAL_BASE/$TOPIC" ]; then
      echo "Not found in library: $GLOBAL_BASE/$TOPIC"
      exit 2
    fi
    mkdir -p "$WORKSPACE_NOTEBOOK"
    cp -R "$GLOBAL_BASE/$TOPIC" "$WORKSPACE_NOTEBOOK/$TOPIC"
    register_checkout "$TOPIC" "$WORKSPACE_ROOT"
    echo "Checked out: $TOPIC -> $WORKSPACE_NOTEBOOK/$TOPIC"
    ;;
  checkin)
    [ -n "$TOPIC" ] || usage
    if [ ! -d "$WORKSPACE_NOTEBOOK/$TOPIC" ]; then
      echo "Not found in workspace: $WORKSPACE_NOTEBOOK/$TOPIC"
      exit 2
    fi
    mkdir -p "$GLOBAL_BASE"
    cp -R "$WORKSPACE_NOTEBOOK/$TOPIC" "$GLOBAL_BASE/$TOPIC"
    rm -rf "$WORKSPACE_NOTEBOOK/$TOPIC"
    unregister_checkout "$TOPIC" "$WORKSPACE_ROOT"
    echo "Checked in: $WORKSPACE_NOTEBOOK/$TOPIC -> $GLOBAL_BASE/$TOPIC (local copy removed)"
    ;;
  sync)
    [ -n "$TOPIC" ] || usage
    if [ ! -d "$WORKSPACE_NOTEBOOK/$TOPIC" ]; then
      echo "Not found in workspace: $WORKSPACE_NOTEBOOK/$TOPIC"
      exit 2
    fi
    mkdir -p "$GLOBAL_BASE"
    cp -R "$WORKSPACE_NOTEBOOK/$TOPIC" "$GLOBAL_BASE/$TOPIC"
    echo "Synced: $WORKSPACE_NOTEBOOK/$TOPIC -> $GLOBAL_BASE/$TOPIC (local copy kept)"
    ;;
  where)
    [ -n "$TOPIC" ] || usage
    if [ ! -f "$CHECKOUTS_FILE" ]; then
      echo "Not checked out"
      exit 0
    fi
    found=
    while IFS= read -r path; do
      [ -n "$path" ] && { echo "$path"; found=1; }
    done < <(awk -F'\t' -v t="$TOPIC" '$1==t {print $2}' "$CHECKOUTS_FILE" 2>/dev/null)
    [ -n "$found" ] || echo "Not checked out"
    ;;
  list|catalog)
    if [ ! -d "$GLOBAL_BASE" ]; then
      echo "No global notebook library at: $GLOBAL_BASE"
      exit 0
    fi
    for d in "$GLOBAL_BASE"/*/; do
      [ -d "$d" ] || continue
      slug=$(basename "$d")
      idx="$d/metadata/index.meta.md"
      if [ -f "$idx" ]; then
        title=$(grep -m1 '^title:' "$idx" 2>/dev/null | sed -n 's/^title: *"\([^"]*\)".*/\1/p' || true)
        if [ -n "$title" ]; then
          echo "$slug — $title"
        else
          echo "$slug"
        fi
      else
        echo "$slug"
      fi
    done
    ;;
  *)
    usage
    ;;
esac
