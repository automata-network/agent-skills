---
name: intelligent-web-testing
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
- The `scripts/pw-helper.js` lives in this skill directory and is NEVER copied to the user's project
- Call it using absolute path: `node <skill-directory>/scripts/pw-helper.js <command> <args>`
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
node $SKILL_DIR/scripts/pw-helper.js navigate "http://localhost:3000" --screenshot home.png

# Interact with elements
node $SKILL_DIR/scripts/pw-helper.js click "button.submit" --screenshot after-click.png
node $SKILL_DIR/scripts/pw-helper.js fill "#email" "test@example.com"
node $SKILL_DIR/scripts/pw-helper.js select "#country" "US"
node $SKILL_DIR/scripts/pw-helper.js check "#agree-terms"

# Get page info
node $SKILL_DIR/scripts/pw-helper.js content
node $SKILL_DIR/scripts/pw-helper.js list-elements
```

### Phase 4: Result Validation
Validate results by:
- Analyzing screenshots visually
- Checking console output for errors
- Verifying expected UI states
- Reporting issues with specific details

## Instructions

When asked to test a web app, follow this workflow:

### Step 0: Detect and Start Project

1. Read `package.json` to find dev/start command
2. Check for framework config files to detect port
3. Install dependencies if needed: `npm install`
4. Start dev server in background: `npm run dev &`
5. Wait for server to be ready

### Step 1: Understand the Project

1. Find all source files (`*.tsx`, `*.jsx`, `*.vue`, `*.html`)
2. Identify the framework and project structure
3. Discover routes/pages from router config and page directories
4. Find interactive elements (buttons, forms, modals, etc.)

### Step 2: Create Test Plan

Generate a structured test plan covering:
- Pages to test
- Interactive elements
- User flows
- Edge cases

### Step 3: Execute Tests

For each test:
1. Navigate to the target page
2. Capture screenshot of initial state
3. Perform the action (click, fill, select, etc.)
4. Wait for UI to update
5. Capture screenshot of result state
6. Validate expected outcome

Example:
```bash
SKILL_DIR="<path-to-this-skill>"

node $SKILL_DIR/scripts/pw-helper.js navigate "http://localhost:3000/login" --screenshot login-before.png
node $SKILL_DIR/scripts/pw-helper.js fill "#email" "test@example.com"
node $SKILL_DIR/scripts/pw-helper.js fill "#password" "password123"
node $SKILL_DIR/scripts/pw-helper.js click "button[type='submit']" --screenshot login-after.png --wait 2000
```

### Step 4: Validate and Report

Analyze results and generate a report:
- Summary of passed/failed tests
- Details of failures with screenshots
- Suggestions for fixes

## Web3 DApp Testing

For Web3 DApps requiring wallet connection:

```bash
SKILL_DIR="<path-to-this-skill>"

# Set private key (REQUIRED - never logged or transmitted)
export WALLET_PRIVATE_KEY="your_private_key_here"

# Setup flow
node $SKILL_DIR/scripts/pw-helper.js wallet-setup      # Install Rabby Wallet
node $SKILL_DIR/scripts/pw-helper.js wallet-import     # Import wallet
node $SKILL_DIR/scripts/pw-helper.js wallet-navigate "https://app.example.com"
node $SKILL_DIR/scripts/pw-helper.js wallet-connect    # Connect to DApp
node $SKILL_DIR/scripts/pw-helper.js wallet-switch-network polygon
```

**Security:** Private key is read from environment variable ONLY, never logged or transmitted.

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

All artifacts saved to `./test-output/`:
- `screenshots/` - Captured screenshots
- `console-logs.txt` - Browser console output
- `elements.json` - Interactive elements discovered

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

**Options:** `--screenshot <name>`, `--wait <ms>`, `--mobile`, `--headed`, `--timeout <ms>`

For detailed reference including Web3 commands, supported networks, validation criteria, and templates, see `references/REFERENCE.md`.

## Notes

- Tests are dynamically generated based on your project
- I validate results by reading screenshots
- No pre-written test scripts required
- The pw-helper.js script is NEVER injected into your project
- Only test artifacts are created in your project's `./test-output/`
