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
5. **Detect if login is required** (see Login Detection below)
6. Capture screenshot of result state
7. Validate expected outcome

### Login Detection and Handling

Many features require user authentication. The agent should:

1. **Detect login triggers**: Before clicking buttons like "Connect", "Create", "Submit", "Search" (when searching user data), or navigating to internal pages, check if login might be required.

2. **Common login trigger patterns**:
   - Buttons with text: "Connect", "Connect Wallet", "Create", "Submit", "Post", "Save", "Profile", "Settings", "Dashboard"
   - Links to: `/dashboard`, `/profile`, `/settings`, `/account`, `/my-*`
   - Forms that submit user data
   - Any action that results in a login modal/popup appearing

3. **Login detection workflow**:
   ```bash
   SKILL_DIR="<path-to-this-skill>"

   # Before performing account-related actions, check if login is needed
   node $SKILL_DIR/scripts/pw-helper.js detect-login-required --screenshot before-action.png

   # If login is required, handle it first
   node $SKILL_DIR/scripts/pw-helper.js wallet-connect  # For Web3 DApps
   # OR
   node $SKILL_DIR/scripts/pw-helper.js wait-for-login  # For manual login by tester
   ```

4. **After action login detection**:
   - After clicking a button, if a login modal/popup appears, the agent should:
     a. Detect the modal presence
     b. Use `wallet-connect` for automated wallet login (if WALLET_PRIVATE_KEY is set)
     c. OR use `wait-for-login` for manual login (tester completes login in headed browser)
     d. After login completes, continue with the original test

5. **wait-for-login command**:
   ```bash
   # Opens headed browser and waits for tester to complete login manually
   # Polls every 2 seconds for login completion (up to 5 minutes)
   # Handles OAuth redirects gracefully (tracks URL changes, catches navigation errors)
   node $SKILL_DIR/scripts/pw-helper.js wait-for-login --headed --timeout 300000
   ```

   The command detects login completion by checking:
   - Presence of wallet address (0x...)
   - Presence of user avatar/profile picture
   - Absence of login modal
   - Presence of "Disconnect" or "Logout" button

**Example workflow for account-related testing:**
```bash
SKILL_DIR="<path-to-this-skill>"

# 1. Navigate to the app
node $SKILL_DIR/scripts/pw-helper.js navigate "http://localhost:3000" --screenshot home.png

# 2. Before clicking "Create" button, detect if login needed
node $SKILL_DIR/scripts/pw-helper.js detect-login-required

# 3. Click the button that may trigger login
node $SKILL_DIR/scripts/pw-helper.js click "button:has-text('Create')" --screenshot after-create-click.png

# 4. Check if login modal appeared
node $SKILL_DIR/scripts/pw-helper.js detect-login-required

# 5. If login modal detected, complete login first
node $SKILL_DIR/scripts/pw-helper.js wait-for-login  # Wait for manual login
# OR
node $SKILL_DIR/scripts/pw-helper.js wallet-connect  # Automated wallet login

# 6. Continue with the original test flow after login
node $SKILL_DIR/scripts/pw-helper.js screenshot after-login.png
```

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

For Web3 DApps requiring wallet connection, a complete wallet setup flow must be performed.

### Wallet Setup Flow (Required Steps)

The wallet testing requires three main phases:

#### Phase 1: Install Rabby Wallet Extension

The `wallet-setup` command opens Chrome Web Store to install Rabby Wallet extension:

```bash
SKILL_DIR="<path-to-this-skill>"

# Step 1: Open Chrome Web Store Rabby Wallet page
node $SKILL_DIR/scripts/pw-helper.js wallet-setup --headed --keep-open
```

This will:
1. Open Chrome browser with persistent profile
2. Navigate to Chrome Web Store Rabby Wallet page
3. Take screenshot of the page

**IMPORTANT: You must manually click "Add to Chrome" button to install the extension!**

After the page loads, use vision-based testing to click the install button:
```bash
# Take screenshot to identify the "Add to Chrome" button position
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot webstore.png --headed --keep-open

# Click "Add to Chrome" button (coordinates determined from screenshot analysis)
node $SKILL_DIR/scripts/pw-helper.js vision-click <x> <y> --headed --keep-open

# Confirm installation dialog if appears
node $SKILL_DIR/scripts/pw-helper.js vision-click <confirm-x> <confirm-y> --headed --keep-open
```

#### Phase 2: Import Wallet with Private Key

After extension is installed, import your wallet:

```bash
# Set private key in environment (REQUIRED - never logged or transmitted)
export WALLET_PRIVATE_KEY="your_private_key_here"

# Step 2: Import wallet using private key
node $SKILL_DIR/scripts/pw-helper.js wallet-import --headed --keep-open
```

This will:
1. Open Rabby Wallet extension page
2. Navigate through the import flow using vision-based clicks
3. Input the private key securely
4. Set up wallet password (auto-generated)

**Manual steps may be required:** If automatic import fails, use vision-based commands to:
1. Click "Add Address" or "Import" button
2. Select "Private Key" option
3. Paste private key into input field
4. Confirm and create password

#### Phase 3: Connect Wallet to DApp

Once wallet is imported and unlocked:

```bash
# Step 3: Navigate to DApp with wallet loaded
node $SKILL_DIR/scripts/pw-helper.js wallet-navigate "https://app.example.com" --headed --keep-open

# Step 4: Click "Connect Wallet" on DApp
node $SKILL_DIR/scripts/pw-helper.js click "button:has-text('Connect Wallet')" --headed --keep-open

# Step 5: Handle Rabby wallet connection popup
node $SKILL_DIR/scripts/pw-helper.js wallet-connect --headed --keep-open
```

### Complete Example Workflow

```bash
SKILL_DIR="<path-to-this-skill>"

# ============================================
# Step 1: Install Rabby Wallet Extension
# ============================================
node $SKILL_DIR/scripts/pw-helper.js wallet-setup --headed --keep-open
# Wait and manually click "Add to Chrome" OR use vision-click

# ============================================
# Step 2: Import Wallet
# ============================================
export WALLET_PRIVATE_KEY="0x..."  # Your private key
node $SKILL_DIR/scripts/pw-helper.js wallet-import --headed --keep-open

# ============================================
# Step 3: Connect to DApp
# ============================================
node $SKILL_DIR/scripts/pw-helper.js wallet-navigate "http://staging.carrier.so/" --headed --keep-open
node $SKILL_DIR/scripts/pw-helper.js click "button:has-text('Connect Wallet')" --screenshot wallet-modal.png --headed --keep-open
node $SKILL_DIR/scripts/pw-helper.js wallet-connect --headed --keep-open

# ============================================
# Step 4: Switch Network if needed
# ============================================
node $SKILL_DIR/scripts/pw-helper.js wallet-switch-network polygon --headed --keep-open
```

### Wallet Commands Reference

| Command | Description |
|---------|-------------|
| `wallet-setup` | Open Chrome Web Store to install Rabby Wallet extension |
| `wallet-import` | Import wallet using WALLET_PRIVATE_KEY env var |
| `wallet-unlock` | Unlock wallet using WALLET_PASSWORD env var |
| `wallet-navigate <url>` | Navigate to DApp with Rabby Wallet loaded |
| `wallet-connect` | Connect wallet to current DApp |
| `wallet-switch-network <name>` | Switch to specified network |
| `wallet-get-address` | Get current wallet address |

**Security:**
- `WALLET_PRIVATE_KEY`: Your wallet private key (required, never logged or transmitted)
- `WALLET_PASSWORD`: Auto-generated during wallet-import (16-char random password)
- Both values are stored in environment variables ONLY, never logged, transmitted to APIs, or stored in files
- All sensitive operations happen locally in the browser

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
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot page-state.png --headed

# Click at specific coordinates (determined by AI from screenshot)
node $SKILL_DIR/scripts/pw-helper.js vision-click 500 300 --headed

# Type text at current cursor position (after clicking an input)
node $SKILL_DIR/scripts/pw-helper.js vision-type "hello@example.com" --headed

# Press keyboard keys
node $SKILL_DIR/scripts/pw-helper.js vision-press-key Enter --headed

# Scroll the page
node $SKILL_DIR/scripts/pw-helper.js vision-scroll down 500 --headed

# Hover to trigger effects
node $SKILL_DIR/scripts/pw-helper.js vision-hover 500 300 --headed

# Wait for page to stabilize, then screenshot
node $SKILL_DIR/scripts/pw-helper.js vision-wait-stable --headed

# Get page info and screenshot
node $SKILL_DIR/scripts/pw-helper.js vision-get-page-info --headed
```

### Vision-Based Workflow Example

```bash
SKILL_DIR="<path-to-this-skill>"

# 1. Navigate and get initial screenshot
node $SKILL_DIR/scripts/pw-helper.js navigate "https://example.com" --headed --keep-open

# 2. Take screenshot for AI to analyze
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot initial.png --headed --keep-open
# AI agent uses Read tool to view ./test-output/screenshots/initial.png
# AI analyzes: "I see a login button at approximately x=800, y=50"

# 3. Click based on AI's visual analysis
node $SKILL_DIR/scripts/pw-helper.js vision-click 800 50 --headed --keep-open
# Returns screenshot showing result of click

# 4. If login modal appeared, AI analyzes and determines email input position
node $SKILL_DIR/scripts/pw-helper.js vision-click 500 200 --headed --keep-open
node $SKILL_DIR/scripts/pw-helper.js vision-type "user@example.com" --headed --keep-open

# 5. Click submit button
node $SKILL_DIR/scripts/pw-helper.js vision-click 500 350 --headed --keep-open
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
- The pw-helper.js script is NEVER injected into your project
- Only test artifacts are created in your project's `./test-output/`
- Browser data (cookies, localStorage) is preserved in `./test-output/chrome-profile/`
- Vision-based commands always return screenshots for AI verification
