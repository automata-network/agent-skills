#!/bin/bash
# Cleanup script for web-test skill
# Kills all test-related processes: browsers, dev servers, etc.
#
# Usage:
#   ./cleanup.sh              # Clean up all processes
#   ./cleanup.sh --keep-data  # Clean up processes but keep test-output folder

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

# 1. Close persistent browser via test-helper
echo "[1/5] Closing persistent browser..."
node "$SCRIPT_DIR/test-helper.js" browser-close 2>/dev/null || true

# 2. Kill Chromium processes from tests
echo "[2/5] Killing Chromium test processes..."
pkill -f "chromium.*--user-data-dir=.*test-output" 2>/dev/null || true
pkill -f "chrome.*--user-data-dir=.*test-output" 2>/dev/null || true
pkill -f "Chromium.*--remote-debugging-port" 2>/dev/null || true

# 3. Kill dev server processes
echo "[3/5] Killing dev server processes..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "webpack-dev-server" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true

# 4. Kill processes on common dev ports
echo "[4/5] Freeing common dev ports (3000, 5173, 8080, 4200)..."
for port in 3000 5173 8080 4200 4321; do
  lsof -ti:$port 2>/dev/null | xargs kill -9 2>/dev/null || true
done

# 5. Clean up test-output folder (optional)
if [ "$KEEP_DATA" = false ]; then
  echo "[5/5] Removing test-output folder..."
  rm -rf ./test-output 2>/dev/null || true
else
  echo "[5/5] Keeping test-output folder (--keep-data specified)"
fi

echo "=== Cleanup Complete ==="
