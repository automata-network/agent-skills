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

#### Phase 1: Install Rabby Wallet Extension (Automated)

Use vision-based automation to install Rabby Wallet from Chrome Web Store:

```bash
SKILL_DIR="<path-to-this-skill>"

# Step 1: Navigate to Chrome Web Store Rabby Wallet page
node $SKILL_DIR/scripts/pw-helper.js navigate "https://chromewebstore.google.com/detail/rabby-wallet/acmacodkjbdgmoleebolmdjonilkdbch" --headed --keep-open --screenshot webstore-1.png

# Step 2: Take screenshot and analyze to find "Add to Chrome" button
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot webstore-2.png --headed --keep-open
# AI agent analyzes screenshot: Look for blue "Add to Chrome" button (typically at top-right of page)
# Common coordinates: x=1050-1150, y=180-220 (varies by screen resolution)

# Step 3: Click "Add to Chrome" button using coordinates from visual analysis
node $SKILL_DIR/scripts/pw-helper.js vision-click <x> <y> --headed --keep-open --screenshot webstore-3-clicked.png
# Example: node $SKILL_DIR/scripts/pw-helper.js vision-click 1100 200 --headed --keep-open

# Step 4: Wait for installation dialog and take screenshot
node $SKILL_DIR/scripts/pw-helper.js wait 2000 --headed --keep-open
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot webstore-4-dialog.png --headed --keep-open
# AI agent analyzes: Look for "Add extension" confirmation button in dialog

# Step 5: Click "Add extension" in the confirmation dialog
node $SKILL_DIR/scripts/pw-helper.js vision-click <dialog-x> <dialog-y> --headed --keep-open --screenshot webstore-5-confirmed.png
# The dialog typically appears at center of screen

# Step 6: Wait for installation to complete
node $SKILL_DIR/scripts/pw-helper.js wait 3000 --headed --keep-open
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot webstore-6-installed.png --headed --keep-open
# Verify: Look for "Remove from Chrome" button or extension icon in toolbar
```

**Automated Installation Workflow:**
1. Navigate to Chrome Web Store Rabby Wallet page
2. AI visually identifies "Add to Chrome" button position from screenshot
3. Click the button using vision-click with analyzed coordinates
4. AI identifies confirmation dialog and "Add extension" button
5. Click to confirm installation
6. Verify installation by checking for "Remove from Chrome" button or extension icon

**Troubleshooting:**
- If button positions are different, re-analyze the screenshot
- The dialog appears after clicking "Add to Chrome" - wait 1-2 seconds
- Extension icon appears in browser toolbar after successful installation

#### Phase 2: Import Wallet with Private Key (Automated)

After extension is installed, use vision-based automation to import wallet:

```bash
SKILL_DIR="<path-to-this-skill>"

# Set private key in environment (REQUIRED - never logged or transmitted)
export WALLET_PRIVATE_KEY="your_private_key_here"

# Step 1: Open Rabby Wallet extension page
node $SKILL_DIR/scripts/pw-helper.js navigate "chrome-extension://acmacodkjbdgmoleebolmdjonilkdbch/popup.html" --headed --keep-open --screenshot wallet-import-1.png

# Step 2: Take screenshot and analyze the wallet UI
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot wallet-import-2.png --headed --keep-open
# AI analyzes: Look for "Add Address" or "Import" button

# Step 3: Click "Add Address" button
node $SKILL_DIR/scripts/pw-helper.js vision-click <x> <y> --headed --keep-open --screenshot wallet-import-3.png

# Step 4: Analyze import options and find "Private Key" option
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot wallet-import-4.png --headed --keep-open
# AI analyzes: Look for "Private Key" option in the list

# Step 5: Click "Private Key" option
node $SKILL_DIR/scripts/pw-helper.js vision-click <x> <y> --headed --keep-open --screenshot wallet-import-5.png

# Step 6: Find the private key input field and enter the key
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot wallet-import-6.png --headed --keep-open
# AI analyzes: Look for textarea or input field for private key
node $SKILL_DIR/scripts/pw-helper.js vision-click <input-x> <input-y> --headed --keep-open
node $SKILL_DIR/scripts/pw-helper.js vision-type "$WALLET_PRIVATE_KEY" --headed --keep-open

# Step 7: Click "Confirm" or "Next" button
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot wallet-import-7.png --headed --keep-open
node $SKILL_DIR/scripts/pw-helper.js vision-click <confirm-x> <confirm-y> --headed --keep-open

# Step 8: Set wallet password (if prompted)
node $SKILL_DIR/scripts/pw-helper.js wait 1000 --headed --keep-open
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot wallet-import-8.png --headed --keep-open
# AI analyzes: Look for password input fields
# Enter password in both fields (use same password)
node $SKILL_DIR/scripts/pw-helper.js vision-click <password1-x> <password1-y> --headed --keep-open
node $SKILL_DIR/scripts/pw-helper.js vision-type "YourSecurePassword123!" --headed --keep-open
node $SKILL_DIR/scripts/pw-helper.js vision-click <password2-x> <password2-y> --headed --keep-open
node $SKILL_DIR/scripts/pw-helper.js vision-type "YourSecurePassword123!" --headed --keep-open

# Step 9: Click final confirm button
node $SKILL_DIR/scripts/pw-helper.js vision-click <final-confirm-x> <final-confirm-y> --headed --keep-open --screenshot wallet-import-9-complete.png

# Step 10: Verify wallet is imported
node $SKILL_DIR/scripts/pw-helper.js wait 2000 --headed --keep-open
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot wallet-import-complete.png --headed --keep-open
# AI verifies: Wallet address should be visible in the UI
```

**Automated Import Workflow:**
1. Navigate to Rabby Wallet extension popup page
2. AI visually identifies "Add Address" button and clicks it
3. AI identifies "Private Key" option and selects it
4. AI finds the private key input field and enters the key
5. AI clicks confirm buttons through the flow
6. AI sets wallet password when prompted
7. AI verifies wallet import success by checking for wallet address

**Alternative: Use wallet-import command (semi-automated):**
```bash
export WALLET_PRIVATE_KEY="your_private_key_here"
node $SKILL_DIR/scripts/pw-helper.js wallet-import --headed --keep-open
```

#### Phase 3: Connect Wallet to DApp (Automated)

Once wallet is imported and unlocked:

```bash
SKILL_DIR="<path-to-this-skill>"

# Step 1: Navigate to DApp with wallet extension loaded
node $SKILL_DIR/scripts/pw-helper.js navigate "https://app.example.com" --headed --keep-open --screenshot dapp-1.png

# Step 2: Take screenshot and find "Connect Wallet" button
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot dapp-2.png --headed --keep-open
# AI analyzes: Look for "Connect Wallet" or similar button

# Step 3: Click "Connect Wallet" button
node $SKILL_DIR/scripts/pw-helper.js vision-click <x> <y> --headed --keep-open --screenshot dapp-3-wallet-modal.png

# Step 4: Wallet selection modal appears - find and click "Rabby" option
node $SKILL_DIR/scripts/pw-helper.js wait 1000 --headed --keep-open
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot dapp-4-select-wallet.png --headed --keep-open
# AI analyzes: Look for "Rabby" option in the wallet list
node $SKILL_DIR/scripts/pw-helper.js vision-click <rabby-x> <rabby-y> --headed --keep-open

# Step 5: Rabby popup appears - click "Connect" to approve connection
node $SKILL_DIR/scripts/pw-helper.js wait 2000 --headed --keep-open
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot dapp-5-rabby-popup.png --headed --keep-open
# AI analyzes: Look for "Connect" or "Approve" button in Rabby popup
node $SKILL_DIR/scripts/pw-helper.js vision-click <connect-x> <connect-y> --headed --keep-open --screenshot dapp-6-connected.png

# Step 6: Verify wallet is connected
node $SKILL_DIR/scripts/pw-helper.js wait 2000 --headed --keep-open
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot dapp-7-verify.png --headed --keep-open
# AI verifies: Wallet address should be visible on the DApp, "Connect Wallet" button should be gone
```

**Automated Connection Workflow:**
1. Navigate to the target DApp
2. AI identifies and clicks "Connect Wallet" button
3. AI selects "Rabby" from wallet options if modal appears
4. AI approves connection in Rabby popup
5. AI verifies successful connection by checking for wallet address display

### Complete Example Workflow

```bash
SKILL_DIR="<path-to-this-skill>"

# ============================================
# Phase 1: Install Rabby Wallet Extension
# ============================================
# Navigate to Chrome Web Store
node $SKILL_DIR/scripts/pw-helper.js navigate "https://chromewebstore.google.com/detail/rabby-wallet/acmacodkjbdgmoleebolmdjonilkdbch" --headed --keep-open --screenshot install-1.png

# Take screenshot and analyze
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot install-2.png --headed --keep-open
# AI: Find "Add to Chrome" button coordinates

# Click "Add to Chrome"
node $SKILL_DIR/scripts/pw-helper.js vision-click <x> <y> --headed --keep-open --screenshot install-3.png

# Wait for dialog and confirm
node $SKILL_DIR/scripts/pw-helper.js wait 2000 --headed --keep-open
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot install-4.png --headed --keep-open
# AI: Find "Add extension" button in dialog
node $SKILL_DIR/scripts/pw-helper.js vision-click <dialog-x> <dialog-y> --headed --keep-open

# Wait for installation
node $SKILL_DIR/scripts/pw-helper.js wait 3000 --headed --keep-open
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot install-5-complete.png --headed --keep-open

# ============================================
# Phase 2: Import Wallet
# ============================================
export WALLET_PRIVATE_KEY="0x..."  # Your private key (REQUIRED)

# Open Rabby extension popup
node $SKILL_DIR/scripts/pw-helper.js navigate "chrome-extension://acmacodkjbdgmoleebolmdjonilkdbch/popup.html" --headed --keep-open --screenshot import-1.png

# Take screenshot and find "Add Address" button
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot import-2.png --headed --keep-open
# AI: Find "Add Address" button coordinates
node $SKILL_DIR/scripts/pw-helper.js vision-click <x> <y> --headed --keep-open

# Find and click "Private Key" option
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot import-3.png --headed --keep-open
# AI: Find "Private Key" option
node $SKILL_DIR/scripts/pw-helper.js vision-click <x> <y> --headed --keep-open

# Enter private key
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot import-4.png --headed --keep-open
# AI: Find input field
node $SKILL_DIR/scripts/pw-helper.js vision-click <input-x> <input-y> --headed --keep-open
node $SKILL_DIR/scripts/pw-helper.js vision-type "$WALLET_PRIVATE_KEY" --headed --keep-open

# Confirm and set password
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot import-5.png --headed --keep-open
# AI: Find Confirm button
node $SKILL_DIR/scripts/pw-helper.js vision-click <confirm-x> <confirm-y> --headed --keep-open

# Set password if prompted
node $SKILL_DIR/scripts/pw-helper.js wait 1000 --headed --keep-open
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot import-6.png --headed --keep-open
# Enter password in both fields
export WALLET_PASSWORD="YourSecurePassword123!"
node $SKILL_DIR/scripts/pw-helper.js vision-click <pwd1-x> <pwd1-y> --headed --keep-open
node $SKILL_DIR/scripts/pw-helper.js vision-type "$WALLET_PASSWORD" --headed --keep-open
node $SKILL_DIR/scripts/pw-helper.js vision-click <pwd2-x> <pwd2-y> --headed --keep-open
node $SKILL_DIR/scripts/pw-helper.js vision-type "$WALLET_PASSWORD" --headed --keep-open
node $SKILL_DIR/scripts/pw-helper.js vision-click <final-confirm-x> <final-confirm-y> --headed --keep-open

# Verify import success
node $SKILL_DIR/scripts/pw-helper.js wait 2000 --headed --keep-open
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot import-7-complete.png --headed --keep-open
# AI: Verify wallet address is visible

# ============================================
# Phase 3: Connect to DApp
# ============================================
# Navigate to target DApp
node $SKILL_DIR/scripts/pw-helper.js navigate "http://staging.carrier.so/" --headed --keep-open --screenshot connect-1.png

# Find and click "Connect Wallet" button
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot connect-2.png --headed --keep-open
# AI: Find "Connect Wallet" button
node $SKILL_DIR/scripts/pw-helper.js vision-click <x> <y> --headed --keep-open --screenshot connect-3.png

# Select Rabby wallet from modal
node $SKILL_DIR/scripts/pw-helper.js wait 1000 --headed --keep-open
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot connect-4.png --headed --keep-open
# AI: Find "Rabby" option in wallet list
node $SKILL_DIR/scripts/pw-helper.js vision-click <rabby-x> <rabby-y> --headed --keep-open

# Approve connection in Rabby popup
node $SKILL_DIR/scripts/pw-helper.js wait 2000 --headed --keep-open
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot connect-5.png --headed --keep-open
# AI: Find "Connect" button in Rabby popup
node $SKILL_DIR/scripts/pw-helper.js vision-click <connect-x> <connect-y> --headed --keep-open

# Verify connection success
node $SKILL_DIR/scripts/pw-helper.js wait 2000 --headed --keep-open
node $SKILL_DIR/scripts/pw-helper.js vision-screenshot connect-6-complete.png --headed --keep-open
# AI: Verify wallet address is displayed on DApp

# ============================================
# Phase 4: Switch Network if needed
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
