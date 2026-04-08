#!/usr/bin/env bash
# Launch Chrome with remote debugging for live page capture.
# Maintains a dedicated profile so sessions (logins, cookies) persist between launches.
#
# Usage:
#   ./launch-chrome.sh          — launch Chrome, open new tab
#   ./launch-chrome.sh <url>    — launch Chrome and navigate to URL

set -euo pipefail

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT=9222
USER_DATA_DIR="$HOME/.cursor-chrome-debug"
URL="${1:-}"

if ! [ -f "$CHROME" ]; then
  echo "Chrome not found at: $CHROME"
  exit 1
fi

# Already running with debug port — just open URL if given
if curl -sf "http://localhost:$PORT/json/version" > /dev/null 2>&1; then
  echo "Chrome already running with debug port $PORT."
  if [ -n "$URL" ]; then
    "$CHROME" --remote-debugging-port=$PORT --user-data-dir="$USER_DATA_DIR" "$URL" > /dev/null 2>&1 &
    echo "Opening: $URL"
  fi
  exit 0
fi

mkdir -p "$USER_DATA_DIR"

"$CHROME" \
  --remote-debugging-port=$PORT \
  --user-data-dir="$USER_DATA_DIR" \
  ${URL:+"$URL"} \
  > /dev/null 2>&1 &

echo "Chrome launched (debug port $PORT, profile: $USER_DATA_DIR)"
if [ -n "$URL" ]; then
  echo "Navigating to: $URL"
fi
echo "Note: first run uses a fresh profile — log in to any sites you need."
