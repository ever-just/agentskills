#!/bin/bash
# Markdown → HTML → PDF (with optional CSS styling)

MOBILE=false
INPUT=""
OUTPUT=""
CSS_FILE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --mobile|-m)
            MOBILE=true
            shift
            ;;
        *)
            if [ -z "$INPUT" ]; then
                INPUT="$1"
            elif [ -z "$OUTPUT" ]; then
                OUTPUT="$1"
            else
                CSS_FILE="$1"
            fi
            shift
            ;;
    esac
done

if [ -z "$INPUT" ] || [ -z "$OUTPUT" ]; then
    echo "Usage: $0 [--mobile|-m] <input.md> <output.pdf> [style.css]"
    exit 1
fi

if [ ! -f "$INPUT" ]; then
    echo "Error: Input file '$INPUT' not found"
    exit 1
fi

TMP_HTML=$(mktemp).html

# Use default CSS if none provided
if [ -z "$CSS_FILE" ]; then
    SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
    if [ "$MOBILE" = true ]; then
        CSS_FILE="$SCRIPT_DIR/../assets/style-mobile.css"
    else
        CSS_FILE="$SCRIPT_DIR/../assets/style.css"
    fi
fi

if [ -n "$CSS_FILE" ] && [ -f "$CSS_FILE" ]; then
    CSS_ABS=$(cd "$(dirname "$CSS_FILE")" && pwd)/$(basename "$CSS_FILE")
    pandoc "$INPUT" -t html -o "$TMP_HTML" --css="$CSS_ABS" --standalone
else
    pandoc "$INPUT" -t html -o "$TMP_HTML" --standalone
fi

weasyprint "$TMP_HTML" "$OUTPUT" 2>&1 | grep -v "WARNING: Ignored" || true
rm "$TMP_HTML"
