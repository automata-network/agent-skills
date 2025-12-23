#!/bin/bash
# Cleanup script for web-test skill
# Closes test browser (Chrome or Chromium) and cleans up test data
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
echo "[1/3] Closing test browser via test-helper..."
node "$SCRIPT_DIR/test-helper.js" browser-close 2>/dev/null || true

# 2. Kill browser processes that use test-output directory
# Playwright uses Chrome if available, otherwise Chromium
echo "[2/3] Killing test browser processes..."

# Check which browsers are running with test-output profile
CHROME_PROCS=$(pgrep -f "Google Chrome.*--user-data-dir=.*test-output" 2>/dev/null | wc -l | tr -d ' ')
CHROMIUM_PROCS=$(pgrep -f "Chromium.*--user-data-dir=.*test-output" 2>/dev/null | wc -l | tr -d ' ')

if [ "$CHROME_PROCS" -gt 0 ]; then
  echo "  Found $CHROME_PROCS Chrome process(es) with test-output profile, killing..."
  pkill -f "Google Chrome.*--user-data-dir=.*test-output" 2>/dev/null || true
fi

if [ "$CHROMIUM_PROCS" -gt 0 ]; then
  echo "  Found $CHROMIUM_PROCS Chromium process(es) with test-output profile, killing..."
  pkill -f "Chromium.*--user-data-dir=.*test-output" 2>/dev/null || true
fi

# Also check for lowercase patterns (Linux)
pkill -f "chrome.*--user-data-dir=.*test-output" 2>/dev/null || true
pkill -f "chromium.*--user-data-dir=.*test-output" 2>/dev/null || true

# Kill by remote-debugging-port if CDP was used
pkill -f "Google Chrome.*--remote-debugging-port=9222" 2>/dev/null || true
pkill -f "Chromium.*--remote-debugging-port=9222" 2>/dev/null || true

if [ "$CHROME_PROCS" -eq 0 ] && [ "$CHROMIUM_PROCS" -eq 0 ]; then
  echo "  No test browser processes found"
fi

# 3. Clean up test-output folder (optional)
if [ "$KEEP_DATA" = false ]; then
  echo "[3/3] Removing test-output folder..."
  rm -rf ./test-output 2>/dev/null || true
else
  echo "[3/3] Keeping test-output folder (--keep-data specified)"
fi

echo "=== Cleanup Complete ==="
