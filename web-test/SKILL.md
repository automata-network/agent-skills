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

Before starting any new test, clean up artifacts from previous test sessions.

**Note:** All test data (`test-output/`) is stored in the **project's root directory**, not in the skill directory. Each project has independent test configuration.

```bash
SKILL_DIR="<path-to-this-skill>"

# 1. Close any running test browsers (Chromium processes from previous tests)
pkill -f "chromium.*--user-data-dir=.*test-output" || true
pkill -f "chrome.*--user-data-dir=.*test-output" || true

# 2. Close the persistent browser process if running
node $SKILL_DIR/scripts/test-helper.js browser-close 2>/dev/null || true

# 3. Remove previous test output folder to start fresh (in project root)
rm -rf ./test-output
```

This ensures:
- No leftover browser processes interfere with new tests
- Previous screenshots and logs don't mix with new test results
- Clean slate for accurate test reporting

**Note:** The `test-output/` directory contains `chrome-profile/` and `extensions/`. Removing it means wallet will need to be re-imported if testing Web3 DApps.

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

### Step 4: Execute Tests

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
   node $SKILL_DIR/scripts/test-helper.js detect-login-required --screenshot before-action.png

   # If login is required, handle it first
   node $SKILL_DIR/scripts/test-helper.js wallet-connect  # For Web3 DApps
   # OR
   node $SKILL_DIR/scripts/test-helper.js wait-for-login  # For manual login by tester
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
   node $SKILL_DIR/scripts/test-helper.js wait-for-login --headed --timeout 300000
   ```

   The command detects login completion by checking:
   - Presence of wallet address (0x...)
   - Presence of user avatar/profile picture
   - Absence of login modal
   - Presence of "Disconnect" or "Logout" button

6. **Rainbow/Privy Wallet Connection (Important!)**:

   Many Web3 DApps use Rainbow Kit or Privy for wallet connection. When their modal appears:

   **DO NOT skip the login flow!** The agent MUST complete these steps:

   a. **Detect the wallet selector modal** - Look for Rainbow/Privy modal with wallet options
   b. **Click "Installed" or "Installed wallet"** - This selects the already-imported Rabby wallet
   c. **Wait for wallet popup** - Rabby extension will show a connection approval popup
   d. **Approve the connection** - Click "Connect" or "Approve" in the Rabby popup
   e. **Handle signature request** - If a sign message popup appears, MUST wait and approve it
   f. **Verify connection success** - Check for wallet address display on the page

   **Rainbow/Privy detection patterns:**
   - Modal with text: "Connect a Wallet", "Connect Wallet", "Sign in"
   - Wallet options list showing: "Rainbow", "MetaMask", "Coinbase", "WalletConnect", "Installed"
   - Privy modal with email/social login options AND wallet options

   **Complete workflow for Rainbow/Privy:**
   ```bash
   SKILL_DIR="<path-to-this-skill>"

   # 1. Click Connect Wallet button on DApp
   node $SKILL_DIR/scripts/test-helper.js vision-click <x> <y> --wallet --headed --keep-open
   # Take screenshot to see the modal
   node $SKILL_DIR/scripts/test-helper.js vision-screenshot wallet-modal.png --wallet --headed --keep-open

   # 2. Look for "Installed" or "Installed wallet" option in the modal and click it
   # AI analyzes screenshot to find the "Installed" button coordinates
   node $SKILL_DIR/scripts/test-helper.js vision-click <installed-btn-x> <installed-btn-y> --wallet --headed --keep-open

   # 3. Wait for Rabby popup and take screenshot
   node $SKILL_DIR/scripts/test-helper.js wait 2000 --wallet --headed --keep-open
   node $SKILL_DIR/scripts/test-helper.js vision-screenshot rabby-popup.png --wallet --headed --keep-open

   # 4. Find and click "Connect" in Rabby popup (usually a new window/popup)
   # The Rabby popup shows the DApp requesting connection - click Confirm/Connect
   node $SKILL_DIR/scripts/test-helper.js vision-click <confirm-x> <confirm-y> --wallet --headed --keep-open

   # 5. IMPORTANT: Wait for signature request if it appears
   node $SKILL_DIR/scripts/test-helper.js wait 2000 --wallet --headed --keep-open
   node $SKILL_DIR/scripts/test-helper.js vision-screenshot check-signature.png --wallet --headed --keep-open

   # 6. If signature modal appears, approve it (Sign/Confirm button)
   # Many DApps require signing a message to verify wallet ownership
   node $SKILL_DIR/scripts/test-helper.js vision-click <sign-x> <sign-y> --wallet --headed --keep-open

   # 7. Verify wallet connected - should see wallet address on page
   node $SKILL_DIR/scripts/test-helper.js wait 2000 --wallet --headed --keep-open
   node $SKILL_DIR/scripts/test-helper.js vision-screenshot connected.png --wallet --headed --keep-open
   ```

   **Common mistakes to avoid:**
   - ❌ Closing the modal without selecting a wallet
   - ❌ Skipping the signature approval step
   - ❌ Not waiting for Rabby popup to appear
   - ❌ Clicking wrong wallet option (must click "Installed" to use Rabby)

**Example workflow for account-related testing:**
```bash
SKILL_DIR="<path-to-this-skill>"

# 1. Navigate to the app
node $SKILL_DIR/scripts/test-helper.js navigate "http://localhost:3000" --screenshot home.png

# 2. Before clicking "Create" button, detect if login needed
node $SKILL_DIR/scripts/test-helper.js detect-login-required

# 3. Click the button that may trigger login
node $SKILL_DIR/scripts/test-helper.js click "button:has-text('Create')" --screenshot after-create-click.png

# 4. Check if login modal appeared
node $SKILL_DIR/scripts/test-helper.js detect-login-required

# 5. If login modal detected, complete login first
node $SKILL_DIR/scripts/test-helper.js wait-for-login  # Wait for manual login
# OR
node $SKILL_DIR/scripts/test-helper.js wallet-connect  # Automated wallet login

# 6. Continue with the original test flow after login
node $SKILL_DIR/scripts/test-helper.js screenshot after-login.png
```

Example:
```bash
SKILL_DIR="<path-to-this-skill>"

node $SKILL_DIR/scripts/test-helper.js navigate "http://localhost:3000/login" --screenshot login-before.png
node $SKILL_DIR/scripts/test-helper.js fill "#email" "test@example.com"
node $SKILL_DIR/scripts/test-helper.js fill "#password" "password123"
node $SKILL_DIR/scripts/test-helper.js click "button[type='submit']" --screenshot login-after.png --wait 2000
```

### Step 5: Validate and Report

Analyze results and generate a report:
- Summary of passed/failed tests
- Details of failures with screenshots
- Suggestions for fixes

### Step 6: Cleanup After Test Completion

**IMPORTANT:** After ALL tests are completed, you MUST clean up resources:

```bash
SKILL_DIR="<path-to-this-skill>"

# 1. Close the persistent browser process
node $SKILL_DIR/scripts/test-helper.js browser-close 2>/dev/null || true

# 2. Kill any remaining Chromium processes from tests
pkill -f "chromium.*--user-data-dir=.*test-output" || true
pkill -f "chrome.*--user-data-dir=.*test-output" || true

# 3. Stop the dev server if it was started by the test
# Find and kill the dev server process (adjust based on how it was started)
pkill -f "npm run dev" || true
pkill -f "next dev" || true
pkill -f "vite" || true
# Or kill by port (e.g., port 3000)
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
```

This ensures:
- No browser processes are left running after tests
- Dev server is stopped to free up the port
- System resources are properly released
- Clean state for the next test session

**DO NOT skip this step!** Leaving processes running can:
- Consume system resources unnecessarily
- Block ports for future test runs
- Cause confusion with stale browser windows

## Web3 DApp Testing

For Web3 DApps requiring wallet connection, a complete wallet setup flow must be performed.

### Important: Extension Requirements

**Extensions ONLY work in Playwright's bundled Chromium**, NOT in Chrome or Edge (they removed extension CLI flags).
All wallet commands MUST use the `--wallet` flag to load the extension properly.

### Wallet Setup Flow (3 Steps)

#### Step 1: Download Rabby Wallet Extension

```bash
SKILL_DIR="<path-to-this-skill>"

# Download and install Rabby Wallet extension (one-time setup)
node $SKILL_DIR/scripts/test-helper.js wallet-setup
```

This downloads the latest Rabby Wallet to `test-output/extensions/rabby/`.

#### Step 2: Import Wallet with Private Key

```bash
SKILL_DIR="<path-to-this-skill>"

# Set private key in environment (REQUIRED - never logged or transmitted)
export WALLET_PRIVATE_KEY="0x..."

# Import wallet - this opens the extension and fills in the private key
# Use --wallet flag to load the extension, --headless for background execution
node $SKILL_DIR/scripts/test-helper.js wallet-import --wallet --headless
# OR use --headed to see the browser
node $SKILL_DIR/scripts/test-helper.js wallet-import --wallet --headed
```

**Internal Flow:**
1. Opens Chromium with `--load-extension` flag pointing to Rabby
2. Waits for extension service worker to load
3. Extracts dynamic extension ID from service worker URL
4. Navigates directly to: `chrome-extension://{extensionId}/index.html#/new-user/import/private-key`
5. Fills private key from `WALLET_PRIVATE_KEY` env var
6. Clicks confirm button
7. Sets up wallet password (auto-generated, stored in `WALLET_PASSWORD` env var)
8. Takes screenshots at each step for debugging

**Extension URLs (dynamic ID):**
- Import page: `chrome-extension://{id}/index.html#/new-user/import/private-key`
- Profile page: `chrome-extension://{id}/desktop.html#/desktop/profile`
- Popup: `chrome-extension://{id}/popup.html`

#### Step 3: Navigate to DApp and Connect Wallet

```bash
SKILL_DIR="<path-to-this-skill>"

# Navigate to DApp with wallet extension loaded
node $SKILL_DIR/scripts/test-helper.js navigate "https://app.example.com" --wallet --headless --screenshot dapp-home.png

# Connect wallet to DApp (clicks "Connect" button in wallet popup)
node $SKILL_DIR/scripts/test-helper.js wallet-connect --wallet --headless
```

### Complete Example Workflow

```bash
SKILL_DIR="<path-to-this-skill>"

# ============================================
# Step 1: Install Rabby Wallet Extension (one-time)
# ============================================
node $SKILL_DIR/scripts/test-helper.js wallet-setup

# ============================================
# Step 2: Import Wallet (first time or after profile reset)
# ============================================
export WALLET_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

# Import wallet in headless mode
node $SKILL_DIR/scripts/test-helper.js wallet-import --wallet --headless

# ============================================
# Step 3: Test DApp
# ============================================
# Navigate to DApp with wallet loaded
node $SKILL_DIR/scripts/test-helper.js navigate "https://staging.carrier.so/" --wallet --headless --screenshot dapp-1.png

# Connect wallet
node $SKILL_DIR/scripts/test-helper.js wallet-connect --wallet --headless --screenshot dapp-2-connected.png

# Switch network if needed
node $SKILL_DIR/scripts/test-helper.js wallet-switch-network polygon --wallet --headless

# Continue with normal testing
node $SKILL_DIR/scripts/test-helper.js click "button:has-text('Bridge')" --wallet --headless --screenshot dapp-3.png
```

### Session Persistence

Browser state (cookies, localStorage, extension data) is persisted in the **project directory**:
```
<project-root>/test-output/chrome-profile/
```

Wallet extensions are downloaded to:
```
<project-root>/test-output/extensions/
```

**Each project maintains its own independent wallet and browser state.** This allows different projects to have different wallet configurations without interference.

After importing wallet once, subsequent tests can reuse the wallet:
```bash
# Wallet already imported - just use --wallet flag to load extension
node $SKILL_DIR/scripts/test-helper.js navigate "https://dapp.example.com" --wallet --headless
```

To reset wallet state for a project, delete the chrome-profile directory:
```bash
rm -rf ./test-output/chrome-profile/
```

To completely reset all test data for a project:
```bash
rm -rf ./test-output/
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

**IMPORTANT: All test data is stored in the user's project directory, NOT in the skill directory.**

All artifacts are saved to `./test-output/` in the **current working directory** (the project being tested):
- `screenshots/` - Captured screenshots
- `console-logs.txt` - Browser console output
- `elements.json` - Interactive elements discovered
- `chrome-profile/` - Chromium user data (cookies, localStorage, extension data)
- `extensions/` - Downloaded wallet extensions (e.g., Rabby)

This design ensures:
- **Each project has independent test configuration** - Different projects can have different wallet setups
- **No global state pollution** - Test data stays with the project
- **Easy cleanup** - Just delete `test-output/` in the project root
- **Portable** - Move project folder and test config moves with it

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
