#!/bin/bash
# Read-only inventory of every GCP project the active gcloud account can list.
# Usage: sweep-all.sh [OUT_DIR]   (default: a fresh temp dir). Prints the report.
here="$(cd "$(dirname "$0")" && pwd)"
out="${1:-$(mktemp -d)}"; mkdir -p "$out"
if ! gcloud projects list --format='value(projectId)' >/dev/null 2>"$out/.err"; then
  cat "$out/.err" >&2
  echo "gcloud is not authenticated. The owner must run: gcloud auth login <owner account> (see ~/CLAUDE.md)" >&2
  exit 1
fi
gcloud projects list --format='value(projectId)' | xargs -P 6 -I{} "$here/sweep-project.sh" {} "$out"
for f in "$out"/*.txt; do echo "=== $(basename "$f" .txt)"; cat "$f"; done
echo; echo "(raw files in $out)"
