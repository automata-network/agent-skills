#!/bin/bash
# Cleanup script for web-test skill
# Closes test browser (Chrome or Chromium), stops dev servers, and cleans up test data
#
# Usage:
#   ./cleanup.sh              # Clean up browser, dev server, and test-output
#   ./cleanup.sh --keep-data  # Clean up browser and dev server, but keep test-output folder

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

# 1. Stop dev server if running
echo "[1/4] Stopping dev server..."
DEV_SERVER_FILE="./test-output/.dev-server.json"
if [ -f "$DEV_SERVER_FILE" ]; then
  DEV_PID=$(node -e "try { console.log(require('$DEV_SERVER_FILE').pid) } catch(e) {}" 2>/dev/null)
  if [ -n "$DEV_PID" ]; then
    echo "  Found dev server (PID: $DEV_PID), stopping..."
    # Try to kill process group first, then the process itself
    kill -TERM -$DEV_PID 2>/dev/null || kill -TERM $DEV_PID 2>/dev/null || true
    sleep 1
    # Force kill if still running
    kill -9 -$DEV_PID 2>/dev/null || kill -9 $DEV_PID 2>/dev/null || true
    rm -f "$DEV_SERVER_FILE"
    echo "  Dev server stopped"
  else
    echo "  Dev server file exists but no valid PID found"
    rm -f "$DEV_SERVER_FILE"
  fi
else
  echo "  No dev server state file found"
fi

# Also kill common dev server processes on common ports
echo "  Checking common dev server ports..."
for PORT in 3000 5173 8080 4200 4321; do
  PID=$(lsof -ti:$PORT 2>/dev/null)
  if [ -n "$PID" ]; then
    echo "  Killing process on port $PORT (PID: $PID)"
    kill -9 $PID 2>/dev/null || true
  fi
done

# 2. Close persistent browser via Playwright CDP
echo "[2/4] Closing test browser..."

# Kill browser processes that use test-output directory
# Playwright uses Chrome if available, otherwise Chromium
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

# 3. Clean up state files
echo "[3/4] Cleaning up state files..."
rm -f ./test-output/.browser-cdp.json 2>/dev/null || true
rm -f ./test-output/.browser-state.json 2>/dev/null || true
echo "  State files cleaned"

# 4. Clean up test-output folder (optional)
if [ "$KEEP_DATA" = false ]; then
  echo "[4/4] Removing test-output folder..."
  rm -rf ./test-output 2>/dev/null || true
else
  echo "[4/4] Keeping test-output folder (--keep-data specified)"
fi

echo "=== Cleanup Complete ==="
