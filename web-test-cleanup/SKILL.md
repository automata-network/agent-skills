---
name: web-test-cleanup
description: Clean up test sessions - kill browsers, stop dev servers, free ports, and optionally remove test data. Use this BEFORE starting new tests or AFTER completing tests.
license: MIT
compatibility: Node.js 18+
metadata:
  author: AI Agent
  version: 1.0.0
allowed-tools: Bash Read
---

# Test Cleanup

Clean up test sessions by closing browsers, stopping dev servers, freeing ports, and optionally removing test data.

## When to Use This Skill

- **BEFORE starting new tests** - Run without `--keep-data` to get a clean slate
- **AFTER completing tests** - Run with `--keep-data` to preserve test artifacts for review
- **When tests are stuck** - Kill hanging browser or server processes
- **When ports are blocked** - Free common dev ports (3000, 5173, 8080, 4200, 4321)

## Quick Start

```bash
SKILL_DIR="<path-to-this-skill>"

# Full cleanup (removes test-output folder)
$SKILL_DIR/scripts/cleanup.sh

# Keep test data (screenshots, wallet config, etc.)
$SKILL_DIR/scripts/cleanup.sh --keep-data
```

## What Gets Cleaned Up

### Processes Killed
- Test browser processes (Chromium using test-output profile)
- Browsers using remote-debugging-port 9222
- Dev server processes (npm, vite, next, webpack, node)

### Ports Freed
- 3000 (Next.js, CRA)
- 5173 (Vite)
- 8080 (Vue CLI, Webpack)
- 4200 (Angular)
- 4321 (Astro)

### Files Removed (unless `--keep-data`)
```
<project-root>/test-output/
├── screenshots/      # Test screenshots
├── chrome-profile/   # Browser state, wallet data
├── extensions/       # Downloaded wallet extensions
├── console-logs.txt  # Browser console output
└── test-report.md    # Generated test report
```

## Instructions

### Pre-Test Cleanup (Fresh Start)

Before starting a new test session, run full cleanup:

```bash
SKILL_DIR="<path-to-this-skill>"

# Kill all processes and remove test data
$SKILL_DIR/scripts/cleanup.sh
```

This ensures:
- No stale browser windows interfering with tests
- No blocked ports preventing server startup
- Clean test-output folder for new artifacts

### Post-Test Cleanup (Preserve Data)

After completing tests, run cleanup with `--keep-data`:

```bash
SKILL_DIR="<path-to-this-skill>"

# Kill processes but keep test artifacts
$SKILL_DIR/scripts/cleanup.sh --keep-data
```

This:
- Closes all browser windows
- Stops dev servers
- Preserves screenshots and reports for review
- Keeps wallet configuration for future tests

## Manual Cleanup Commands

If the cleanup script is not available, you can run these commands manually:

```bash
# Kill browser processes
pkill -f "chromium.*test-output"
pkill -f "remote-debugging-port=9222"

# Kill dev servers
pkill -f "npm run dev"
pkill -f "vite"
pkill -f "next dev"

# Free specific port
lsof -ti:3000 | xargs kill -9

# Remove test data
rm -rf ./test-output/
```

## Exit Codes

- `0` - Cleanup completed successfully
- `1` - Cleanup failed (check error message)

## Notes

- Always run cleanup before starting new test sessions
- Use `--keep-data` when you need to review test results
- The cleanup script is in this skill's `scripts/` directory
- Test data is stored in the project directory, not the skill directory
