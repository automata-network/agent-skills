#!/bin/bash
# Cleanup script for web-test skill
# Only kills TEST-RELATED browser processes, NOT dev servers or other processes
#
# Usage:
#   ./cleanup.sh              # Clean up browser processes and test-output
#   ./cleanup.sh --keep-data  # Clean up browsers but keep test-output folder

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KEEP_DATA=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --keep-data)
      KEEP_DATA=true
      shift
      ;;
  esac
done

echo "=== Web Test Cleanup ==="

# 1. Close persistent browser via test-helper (safe - only closes our browser)
echo "[1/3] Closing test browser..."
node "$SCRIPT_DIR/test-helper.js" browser-close 2>/dev/null || true

# 2. Kill ONLY Chromium processes that use test-output directory
# This is specific enough to not kill other browsers or processes
echo "[2/3] Killing test Chromium processes..."
pkill -f "chromium.*--user-data-dir=.*test-output" 2>/dev/null || true
pkill -f "chrome.*--user-data-dir=.*test-output" 2>/dev/null || true

# 3. Clean up test-output folder (optional)
if [ "$KEEP_DATA" = false ]; then
  echo "[3/3] Removing test-output folder..."
  rm -rf ./test-output 2>/dev/null || true
else
  echo "[3/3] Keeping test-output folder (--keep-data specified)"
fi

echo "=== Cleanup Complete ==="
echo ""
echo "NOTE: Dev server processes are NOT killed by this script."
echo "To stop dev server manually: pkill -f 'npm run dev' or Ctrl+C"
