#!/usr/bin/env bash
# Export notebook documents for NotebookLM import.
# Copies all snapshot documents (excluding summaries) to tmp/notebooklm-export/{topic}/
#
# Usage:
#   export-notebooklm.sh <topic-slug> [workspace_root]
#
# Default workspace_root = $PWD. Resolves workspace or global notebook base.

set -euo pipefail

TOPIC="${1:-}"
WORKSPACE_ROOT="${2:-$PWD}"
GLOBAL_BASE="${NOTEBOOK_HOME:-$HOME/.cursor/notebooks}"
WORKSPACE_NOTEBOOK="${WORKSPACE_ROOT}/notebook"
EXPORT_DIR="${WORKSPACE_ROOT}/tmp/notebooklm-export/${TOPIC}"

usage() {
  echo "Usage: export-notebooklm.sh <topic-slug> [workspace_root]"
  exit 1
}

[ -n "$TOPIC" ] || usage

# Resolve notebook base (workspace first, then global)
if [ -d "$WORKSPACE_NOTEBOOK/$TOPIC" ]; then
  NOTEBOOK_BASE="$WORKSPACE_NOTEBOOK/$TOPIC"
elif [ -d "$GLOBAL_BASE/$TOPIC" ]; then
  NOTEBOOK_BASE="$GLOBAL_BASE/$TOPIC"
else
  echo "Notebook not found: $TOPIC"
  echo "  Checked: $WORKSPACE_NOTEBOOK/$TOPIC"
  echo "  Checked: $GLOBAL_BASE/$TOPIC"
  exit 2
fi

METADATA_DIR="$NOTEBOOK_BASE/metadata"
DOCUMENTS_DIR="$NOTEBOOK_BASE/documents"
INDEX_FILE="$METADATA_DIR/index.meta.md"

if [ ! -f "$INDEX_FILE" ]; then
  echo "Index not found: $INDEX_FILE"
  exit 2
fi

echo "Exporting notebook: $TOPIC"
echo "Source: $NOTEBOOK_BASE"
echo "Export to: $EXPORT_DIR"
echo ""

# Create export directory
mkdir -p "$EXPORT_DIR"

# Extract source slugs from index.meta.md (from Sources table)
SLUGS=$(grep -E "^\| [a-z0-9-]+ \|" "$INDEX_FILE" | sed 's/^| \([a-z0-9-]*\) .*/\1/' | grep -v "^Slug$" || true)

if [ -z "$SLUGS" ]; then
  echo "No sources found in index"
  exit 0
fi

COPIED=0
SKIPPED=0

for SLUG in $SLUGS; do
  META_FILE="$METADATA_DIR/${SLUG}.meta.md"
  
  if [ ! -f "$META_FILE" ]; then
    echo "  ⚠️  Skipping $SLUG: metadata not found"
    ((SKIPPED++)) || true
    continue
  fi
  
  # Check if snapshot: true
  if ! grep -q "^snapshot: true" "$META_FILE"; then
    echo "  ⏭️  Skipping $SLUG: no snapshot (link-only source)"
    ((SKIPPED++)) || true
    continue
  fi
  
  # Extract source path from metadata
  SOURCE_PATH=$(grep "^source:" "$META_FILE" | sed 's/^source: *//' | sed 's/^documents\///' || true)
  
  if [ -z "$SOURCE_PATH" ]; then
    # Fallback: try common patterns
    SOURCE_PATH="${SLUG}.md"
  fi
  
  # Remove 'documents/' prefix if present
  SOURCE_PATH="${SOURCE_PATH#documents/}"
  
  # Try to find the document file
  DOC_FILE=""
  if [ -f "$DOCUMENTS_DIR/$SOURCE_PATH" ]; then
    DOC_FILE="$DOCUMENTS_DIR/$SOURCE_PATH"
  elif [ -f "$DOCUMENTS_DIR/${SLUG}.md" ]; then
    DOC_FILE="$DOCUMENTS_DIR/${SLUG}.md"
  elif [ -f "$DOCUMENTS_DIR/${SLUG}.pdf" ]; then
    DOC_FILE="$DOCUMENTS_DIR/${SLUG}.pdf"
  elif [ -f "$DOCUMENTS_DIR/${SLUG}.txt" ]; then
    DOC_FILE="$DOCUMENTS_DIR/${SLUG}.txt"
  fi
  
  if [ -z "$DOC_FILE" ] || [ ! -f "$DOC_FILE" ]; then
    echo "  ⚠️  Skipping $SLUG: document not found"
    ((SKIPPED++)) || true
    continue
  fi
  
  # Skip summary files
  if [[ "$DOC_FILE" == *"-summary.md" ]]; then
    echo "  ⏭️  Skipping $SLUG: summary file"
    ((SKIPPED++)) || true
    continue
  fi
  
  # Copy the document
  FILENAME=$(basename "$DOC_FILE")
  cp "$DOC_FILE" "$EXPORT_DIR/$FILENAME"
  echo "  ✓ Copied $FILENAME"
  ((COPIED++)) || true
  
  # Also copy extracted text if present (for PDFs)
  if [ -f "$DOCUMENTS_DIR/${SLUG}-extracted.txt" ]; then
    cp "$DOCUMENTS_DIR/${SLUG}-extracted.txt" "$EXPORT_DIR/${SLUG}-extracted.txt"
    echo "    → Also copied extracted text"
  fi
  
  # Copy OCR directory if present
  if [ -d "$DOCUMENTS_DIR/${SLUG}-ocr" ]; then
    cp -R "$DOCUMENTS_DIR/${SLUG}-ocr" "$EXPORT_DIR/"
    echo "    → Also copied OCR output"
  fi
done

echo ""
echo "Export complete:"
echo "  Copied: $COPIED files"
echo "  Skipped: $SKIPPED sources"
echo "  Location: $EXPORT_DIR"
