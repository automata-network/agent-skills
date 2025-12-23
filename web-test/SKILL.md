---
name: web-test
description: AI-driven web app testing. Agent reads code, understands functionality, plans tests, executes Playwright commands directly, and validates results autonomously. No pre-written scripts required.
license: MIT
compatibility: Node.js 18+, Playwright (global)
metadata:
  author: AI Agent
  version: 1.0.0
allowed-tools: Bash Read Write Glob Grep Task
---

# Intelligent Web Testing

An AI-driven testing skill where the agent autonomously:
1. **Reads and understands** project source code
2. **Plans tests** based on discovered functionality
3. **Executes tests** using Playwright directly
4. **Validates results** by analyzing screenshots and outputs

## Prerequisites

```bash
# Install Playwright globally
npm install -g playwright
npx playwright install chromium
```

## Quick Start

Ask me to test your web app:
- "Test my web app" (I'll auto-detect running localhost services)
- "Analyze my project and run comprehensive UI tests"
- "Test all interactive elements and validate they work correctly"

## Key Principles

**Script Independence:**
- The `scripts/test-helper.js` lives in this skill directory and is NEVER copied to the user's project
- Call it using absolute path: `node <skill-directory>/scripts/test-helper.js <command> <args>`
- Test URLs are passed as command line arguments
- Do NOT inject any test scripts into the user's project directory
- Only test artifacts (screenshots, logs) go to `./test-output/` in the current working directory

## How It Works

### Phase 1: Code Analysis
Read the project's source code to understand:
- Project structure and framework (React, Vue, Next.js, etc.)
- Available pages and routes
- Interactive components (buttons, forms, modals, etc.)
- Expected behaviors and user flows

### Phase 2: Test Planning
Create a test plan covering:
- All discoverable pages/routes
- Interactive elements (buttons, links, inputs, dropdowns, etc.)
- Form submissions and validations
- Navigation flows and edge cases

### Phase 3: Test Execution
Execute tests using Playwright via the helper script:

```bash
SKILL_DIR="<path-to-this-skill>"

# Navigate and screenshot
node $SKILL_DIR/scripts/test-helper.js navigate "http://localhost:3000" --screenshot home.png

# Interact with elements
node $SKILL_DIR/scripts/test-helper.js click "button.submit" --screenshot after-click.png
node $SKILL_DIR/scripts/test-helper.js fill "#email" "test@example.com"
node $SKILL_DIR/scripts/test-helper.js select "#country" "US"
node $SKILL_DIR/scripts/test-helper.js check "#agree-terms"

# Get page info
node $SKILL_DIR/scripts/test-helper.js content
node $SKILL_DIR/scripts/test-helper.js list-elements
```

### Phase 4: Result Validation
Validate results by:
- Analyzing screenshots visually
- Checking console output for errors
- Verifying expected UI states
- Reporting issues with specific details

## Instructions

When asked to test a web app, follow this workflow:

### Step 0: Clean Up Previous Test Session

Before starting any new test, run the cleanup script:

```bash
SKILL_DIR="<path-to-this-skill>"

# Run cleanup script (kills browsers, dev servers, cleans test-output)
$SKILL_DIR/scripts/cleanup.sh

# OR keep test data (wallet, extensions) but kill processes:
$SKILL_DIR/scripts/cleanup.sh --keep-data
```

**Note:** All test data (`test-output/`) is stored in the **project's root directory**, not in the skill directory. Each project has independent test configuration.

The cleanup script:
- Closes all test browser processes
- Kills dev server processes
- Frees common dev ports (3000, 5173, 8080, 4200)
- Removes `test-output/` folder (unless `--keep-data` is specified)

### Step 1: Detect and Start Project

1. Read `package.json` to find dev/start command
2. Check for framework config files to detect port
3. Install dependencies if needed: `npm install`
4. Start dev server in background: `npm run dev &`
5. Wait for server to be ready

### Step 2: Understand the Project

1. Find all source files (`*.tsx`, `*.jsx`, `*.vue`, `*.html`)
2. Identify the framework and project structure
3. Discover routes/pages from router config and page directories
4. Find interactive elements (buttons, forms, modals, etc.)

### Step 3: Create Test Plan

Generate a structured test plan covering:
- Pages to test
- Interactive elements
- User flows
- Edge cases

### Step 4: Wallet Setup (if Web3 DApp)

**If NOT Web3 DApp → Skip Step 4 and Step 5, go directly to Step 6.**

```bash
SKILL_DIR="<path-to-this-skill>"

# Install extension and import wallet (auto-fails if WALLET_PRIVATE_KEY not set)
node $SKILL_DIR/scripts/test-helper.js wallet-setup
node $SKILL_DIR/scripts/test-helper.js wallet-init --wallet --headed
```

Script auto-fails if `WALLET_PRIVATE_KEY` not set. After success → proceed to Step 5.

### Step 5: Wallet Connect (if Web3 DApp)

**If NOT Web3 DApp → Skip to Step 6.**

## ⚠️ Wallet MUST be connected BEFORE any other tests! Without connection, all tests FAIL.

```bash
SKILL_DIR="<path-to-this-skill>"

# 1. Navigate to DApp with wallet extension
node $SKILL_DIR/scripts/test-helper.js wallet-navigate "<dapp-url>" --wallet --headed --keep-open

# 2. Take screenshot, find and click "Connect Wallet" button
node $SKILL_DIR/scripts/test-helper.js vision-screenshot before-connect.jpg --wallet --headed --keep-open
# Use vision-click to click the Connect Wallet button

# 3. In Rainbow/Privy modal, click "Installed" wallet option (use vision-click)

# 4. Auto-approve Rabby popup (handles new window automatically)
node $SKILL_DIR/scripts/test-helper.js wallet-approve --wallet --headed --keep-open

# 5. Verify connection
node $SKILL_DIR/scripts/test-helper.js vision-screenshot after-connect.jpg --wallet --headed --keep-open
```

The `wallet-approve` command automatically:
- Waits for Rabby popup window to open
- Clicks Connect/Confirm/Sign button
- Handles signature requests if needed
- Takes screenshots at each step

**Verification:**
- ✅ SUCCESS: Wallet address (0x...) visible → proceed to Step 6
- ❌ FAILURE: "Connect Wallet" still visible → RETRY (max 3 times)
- ❌ FAIL: After 3 retries → STOP, do not continue

### Step 6: Execute Tests

For each test:
1. Navigate to the target page
2. Capture screenshot of initial state
3. Perform the action (click, fill, select, etc.)
4. Wait for UI to update
5. Capture screenshot of result state
6. Validate expected outcome

### Step 7: Validate and Report

Analyze results and generate test report to `./test-output/test-report.md`:

```bash
# Create test report file
cat > ./test-output/test-report.md << 'EOF'
# Test Report

**Date:** $(date)
**URL:** <tested-url>
**Is Web3 DApp:** YES/NO

## Summary
- Total Tests: X
- Passed: X
- Failed: X

## Test Results

### 1. [Test Name]
- **Status:** ✅ PASS / ❌ FAIL
- **Screenshot:** screenshots/test-name.jpg
- **Notes:** ...

### 2. [Test Name]
...

## Failed Tests Details
(If any failures, describe what went wrong and include screenshot references)

## Recommendations
(Suggestions for fixes)
EOF
```

**Report must include:**
- Summary of passed/failed tests
- Each test with status, screenshot reference, and notes
- Details of failures with screenshots
- Suggestions for fixes

**Output location:** `./test-output/test-report.md`

### Step 8: Cleanup After Test Completion

**IMPORTANT:** After ALL tests are completed, you MUST run the cleanup script:

```bash
SKILL_DIR="<path-to-this-skill>"

# Run cleanup script (keeps test data for review)
$SKILL_DIR/scripts/cleanup.sh --keep-data
```

The cleanup script handles:
- Closing all browser processes (Chromium, Chrome)
- Stopping dev server processes (npm, vite, next, webpack)
- Freeing common dev ports (3000, 5173, 8080, 4200, 4321)

**DO NOT skip this step!** Leaving processes running can:
- Consume system resources unnecessarily
- Block ports for future test runs
- Cause confusion with stale browser windows

## Web3 DApp Testing

See **Step 4** (Wallet Setup) and **Step 5** (Wallet Connect) above. Both must complete BEFORE Step 6 (Execute Tests).

### Data Storage

All test data is stored in the **project directory** (NOT skill directory):
```
<project-root>/test-output/
├── screenshots/      # Test screenshots
├── chrome-profile/   # Browser state, cookies, wallet data
├── extensions/       # Downloaded wallet extensions
└── console-logs.txt  # Browser console output
```

Each project has independent wallet configuration. To reset: `rm -rf ./test-output/`

## Auto Port Detection

| Framework | Default Port |
|-----------|--------------|
| Vite | 5173 |
| Next.js | 3000 |
| Create React App | 3000 |
| Vue CLI | 8080 |
| Angular | 4200 |
| Astro | 4321 |

## Test Output

All artifacts are saved to `./test-output/` in the project directory (see "Data Storage" section above).

## Command Reference

| Command | Description |
|---------|-------------|
| `navigate <url>` | Navigate to URL |
| `click <selector>` | Click element |
| `fill <selector> <value>` | Fill input field |
| `select <selector> <value>` | Select dropdown option |
| `check/uncheck <selector>` | Check/uncheck checkbox |
| `hover <selector>` | Hover over element |
| `press <selector> <key>` | Press key on element |
| `screenshot [name]` | Take screenshot |
| `content` | Get page HTML |
| `list-elements` | List interactive elements |
| `wait <ms>` | Wait milliseconds |
| `wait-for <selector>` | Wait for element |
| `detect-login-required` | Detect if login/auth is needed |
| `wait-for-login` | Wait for manual login completion |
| `browser-open` | Open browser and keep running |
| `browser-close` | Close browser explicitly |

**Options:** `--screenshot <name>`, `--wait <ms>`, `--mobile`, `--headed`, `--headless`, `--keep-open`, `--timeout <ms>`

## Headless vs Headed Mode

**Default: Headless mode** - All commands run in headless mode by default, enabling CI/container compatibility.

**Automatic headed mode**: The `wait-for-login` command automatically switches to headed mode since manual login requires a visible browser window.

**CI/Container behavior**: If `wait-for-login` fails to open a browser window (no display available), the test will fail immediately with error `HEADED_MODE_FAILED`. In CI environments, use automated login methods (`wallet-connect`) instead of manual login.

For detailed reference including Web3 commands, supported networks, validation criteria, and templates, see `references/REFERENCE.md`.

## Browser Persistence and OAuth

The skill uses a **persistent browser context** that:
- Preserves cookies and localStorage between test sessions
- Saves browser data to `./test-output/chrome-profile/`
- Allows login state to persist after OAuth redirects complete

**OAuth/Social Login Handling:**
- The `wait-for-login` command handles OAuth redirects gracefully
- URL changes are tracked during OAuth flow
- Page navigation errors during redirect are caught and handled
- The browser stays open during the entire OAuth process

**Important:** OAuth login (Google, GitHub, Twitter, etc.) involves redirects to external domains.
The browser will navigate away from the app, complete authentication, and return. The script
tracks these URL changes and waits for the user to complete the flow manually.

## Vision-Based Testing (AI Visual Analysis)

The skill supports vision-based testing where the AI agent:
1. Takes screenshots of the page
2. Analyzes the screenshots visually using AI vision capabilities
3. Determines click coordinates from visual analysis
4. Interacts using coordinate-based commands

This approach is more reliable than selector-based testing because:
- No dependency on DOM structure or CSS selectors
- Works with any UI framework or custom components
- Handles dynamic content and animations naturally
- Same approach humans use when testing

### Vision Commands

```bash
SKILL_DIR="<path-to-this-skill>"

# Take screenshot for AI to analyze
node $SKILL_DIR/scripts/test-helper.js vision-screenshot page-state.png --headed

# Click at specific coordinates (determined by AI from screenshot)
node $SKILL_DIR/scripts/test-helper.js vision-click 500 300 --headed

# Type text at current cursor position (after clicking an input)
node $SKILL_DIR/scripts/test-helper.js vision-type "hello@example.com" --headed

# Press keyboard keys
node $SKILL_DIR/scripts/test-helper.js vision-press-key Enter --headed

# Scroll the page
node $SKILL_DIR/scripts/test-helper.js vision-scroll down 500 --headed

# Hover to trigger effects
node $SKILL_DIR/scripts/test-helper.js vision-hover 500 300 --headed

# Wait for page to stabilize, then screenshot
node $SKILL_DIR/scripts/test-helper.js vision-wait-stable --headed

# Get page info and screenshot
node $SKILL_DIR/scripts/test-helper.js vision-get-page-info --headed
```

### Vision-Based Workflow Example

```bash
SKILL_DIR="<path-to-this-skill>"

# 1. Navigate and get initial screenshot
node $SKILL_DIR/scripts/test-helper.js navigate "https://example.com" --headed --keep-open

# 2. Take screenshot for AI to analyze
node $SKILL_DIR/scripts/test-helper.js vision-screenshot initial.png --headed --keep-open
# AI agent uses Read tool to view ./test-output/screenshots/initial.png
# AI analyzes: "I see a login button at approximately x=800, y=50"

# 3. Click based on AI's visual analysis
node $SKILL_DIR/scripts/test-helper.js vision-click 800 50 --headed --keep-open
# Returns screenshot showing result of click

# 4. If login modal appeared, AI analyzes and determines email input position
node $SKILL_DIR/scripts/test-helper.js vision-click 500 200 --headed --keep-open
node $SKILL_DIR/scripts/test-helper.js vision-type "user@example.com" --headed --keep-open

# 5. Click submit button
node $SKILL_DIR/scripts/test-helper.js vision-click 500 350 --headed --keep-open
```

### Key Differences from Selector-Based Testing

| Selector-Based | Vision-Based |
|----------------|--------------|
| `click "button:has-text('Login')"` | `vision-click 800 50` |
| `fill "#email" "test@example.com"` | `vision-click 500 200` then `vision-type "test@example.com"` |
| Fails if selector changes | Works as long as element is visible |
| Requires DOM knowledge | Requires visual analysis |

## Notes

- Tests are dynamically generated based on your project
- I validate results by reading screenshots
- No pre-written test scripts required
- The test-helper.js script is NEVER injected into your project
- Only test artifacts are created in your project's `./test-output/`
- Browser data (cookies, localStorage) is preserved in `./test-output/chrome-profile/`
- Vision-based commands always return screenshots for AI verification
