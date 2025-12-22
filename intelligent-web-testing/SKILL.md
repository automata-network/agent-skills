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

## Prerequisites

Playwright must be installed globally (not as a project dependency):

```bash
# Install Playwright globally
npm install -g playwright

# Install browser (Chrome)
npx playwright install chromium
```

An AI-driven testing skill where the agent autonomously:
1. **Reads and understands** project source code
2. **Plans tests** based on discovered functionality
3. **Executes tests** using Playwright directly
4. **Validates results** by analyzing screenshots and outputs

## Quick Start

Ask me to test your web app:
- "Test my web app" (I'll auto-detect the port)
- "Analyze my project and run comprehensive UI tests"
- "Test all interactive elements and validate they work correctly"

## Web3 DApp Testing Support

For Web3 DApps that require wallet connection, I support:

### Wallet Integration
- **Rabby Wallet** - Chrome extension for multi-chain support
- **MetaMask** - Popular Ethereum wallet (coming soon)

### Security Principles
- Private key is read from `WALLET_PRIVATE_KEY` environment variable
- Private key is **NEVER** uploaded to AI APIs or logged
- Private key is only used locally in Playwright browser context
- All wallet operations happen in local browser instance

### Web3 Test Flow
```
1. wallet-setup    → Open Chrome Web Store, install Rabby Wallet extension
2. wallet-import   → Open Rabby settings, import wallet using private key
3. wallet-navigate → Navigate to DApp with Rabby available
4. wallet-connect  → Connect wallet to DApp
5. wallet-switch-network → Switch to required network (polygon, arbitrum, etc.)
6. Interact with DApp using click/fill commands
7. Validate results with screenshots
```

### Environment Setup
```bash
# Set wallet private key in terminal (REQUIRED!)
export WALLET_PRIVATE_KEY="your_private_key_here"

# IMPORTANT:
# - MUST be set via environment variable (no .env file support)
# - If not set, wallet-import will exit with error
# - Key is used locally in Chrome browser only
# - Key is NEVER logged, transmitted to APIs, or stored in files
```

### Web3 Commands
```bash
# Step 1: Install Rabby Wallet (one-time)
node pw-helper.js wallet-setup

# Step 2: Import wallet (one-time)
node pw-helper.js wallet-import

# Step 3: Navigate to DApp with wallet
node pw-helper.js wallet-navigate "https://staging.carrier.so"

# Step 4: Connect wallet
node pw-helper.js wallet-connect

# Step 5: Switch network
node pw-helper.js wallet-switch-network polygon

# Step 6: Interact with DApp
node pw-helper.js click "button.swap"
node pw-helper.js fill "#amount" "100"
```

### Supported Networks
- Ethereum Mainnet
- Polygon
- Arbitrum
- Optimism
- Base
- BSC
- Avalanche
- And more...

## Auto Port Detection

I automatically detect the dev server port from your project configuration:

| Framework | Config File | Default Port |
|-----------|-------------|--------------|
| **Vite** | `vite.config.js/ts` → `server.port` | 5173 |
| **Next.js** | `package.json` scripts or `-p` flag | 3000 |
| **Remix** | `remix.config.js` or package.json | 3000 |
| **Webpack** | `webpack.config.js` → `devServer.port` | 8080 |
| **Create React App** | `PORT` env or package.json | 3000 |
| **Vue CLI** | `vue.config.js` → `devServer.port` | 8080 |
| **Angular** | `angular.json` → `serve.options.port` | 4200 |
| **Nuxt** | `nuxt.config.js` → `server.port` | 3000 |
| **Astro** | `astro.config.mjs` → `server.port` | 4321 |
| **SvelteKit** | `vite.config.js` (uses Vite) | 5173 |

## How It Works

### Phase 1: Code Analysis
I will read your project's source code to understand:
- Project structure and framework (React, Vue, Next.js, etc.)
- Available pages and routes
- Interactive components (buttons, forms, modals, etc.)
- Expected behaviors and user flows

### Phase 2: Test Planning
Based on code analysis, I will create a test plan covering:
- All discoverable pages/routes
- Interactive elements (buttons, links, inputs, dropdowns, etc.)
- Form submissions and validations
- Modal/dialog interactions
- Navigation flows
- Error states and edge cases

### Phase 3: Test Execution
I will execute tests using Playwright directly via the helper script:

```bash
# Navigate and screenshot (using detected port, e.g., 5173 for Vite)
node pw-helper.js navigate "http://localhost:5173" --screenshot home.png

# Click element
node pw-helper.js click "button.submit" --screenshot after-click.png

# Fill form
node pw-helper.js fill "#email" "test@example.com"

# Select option
node pw-helper.js select "#country" "US"

# Check/uncheck
node pw-helper.js check "#agree-terms"

# Get page content for validation
node pw-helper.js content

# Run multiple actions in sequence
node pw-helper.js run-sequence actions.json --screenshots
```

### Phase 4: Result Validation
I will validate results by:
- Analyzing screenshots visually
- Checking console output for errors
- Verifying expected UI states
- Comparing before/after states
- Reporting issues with specific details

## Instructions

When you ask me to test your web app, I will follow this workflow:

### Step 0: Detect Framework, Port, and Start Project

First, I'll identify the framework, find the dev server command, and start the project:

```
1. Read package.json to find:
   - Project name and dependencies
   - scripts field to find dev/start command:
     - "dev": "vite" / "next dev" / "remix dev" / etc.
     - "start": "react-scripts start" / "webpack serve" / etc.
   - Custom port in scripts: PORT=xxxx, --port xxxx, -p xxxx

2. Check for framework config files:
   - vite.config.js/ts → Vite project (default: 5173)
   - next.config.js/mjs → Next.js project (default: 3000)
   - remix.config.js → Remix project (default: 3000)
   - webpack.config.js → Webpack project (default: 8080)
   - vue.config.js → Vue CLI project (default: 8080)
   - angular.json → Angular project (default: 4200)
   - nuxt.config.js/ts → Nuxt project (default: 3000)
   - astro.config.mjs → Astro project (default: 4321)
   - svelte.config.js → SvelteKit project (default: 5173)

3. Read config file to find custom port if specified

4. Install dependencies if needed:
   npm install (if node_modules doesn't exist)

5. Start the dev server in background:
   npm run dev &  (or npm run start, depending on scripts)

6. Wait for server to be ready:
   - Poll http://localhost:<port> until it responds
   - Or watch for "ready" / "started" in console output

7. Construct base URL: http://localhost:<detected_port>
```

**Common start commands by framework:**

| Framework | Typical Script | Command |
|-----------|---------------|---------|
| Vite | `"dev": "vite"` | `npm run dev` |
| Next.js | `"dev": "next dev"` | `npm run dev` |
| Remix | `"dev": "remix dev"` | `npm run dev` |
| Create React App | `"start": "react-scripts start"` | `npm run start` |
| Vue CLI | `"serve": "vue-cli-service serve"` | `npm run serve` |
| Angular | `"start": "ng serve"` | `npm run start` |
| Nuxt | `"dev": "nuxt dev"` | `npm run dev` |
| Astro | `"dev": "astro dev"` | `npm run dev` |

### Step 1: Understand the Project

Next, I'll analyze your codebase:

```
1. Find all source files (*.tsx, *.jsx, *.vue, *.html, *.js, *.ts)
2. Identify the framework and project structure
3. Discover routes/pages from:
   - Router configuration files
   - Page/route directories
   - Navigation components
4. Find interactive elements:
   - Button components and click handlers
   - Form inputs and submissions
   - Modal/dialog triggers
   - Dropdown menus and selects
   - Tabs, accordions, toggles
5. Understand expected behaviors from:
   - Component props and state
   - Event handlers
   - API calls and responses
```

### Step 2: Create Test Plan

I'll generate a structured test plan:

```markdown
## Test Plan for [Project Name]

### Pages to Test
1. / (Home) - Main landing page
2. /login - User authentication
3. /dashboard - User dashboard
...

### Interactive Elements
1. Navigation menu - Click each link, verify navigation
2. Login form - Fill credentials, submit, verify redirect
3. Settings modal - Open, modify, save, verify changes
...

### User Flows
1. Registration flow: Home → Sign Up → Fill Form → Verify Email
2. Purchase flow: Product → Add to Cart → Checkout → Confirm
...

### Edge Cases
1. Invalid form inputs - Verify error messages
2. Network errors - Verify error handling
3. Empty states - Verify placeholder content
...
```

### Step 3: Execute Tests

For each test, I'll:

1. **Setup**: Ensure Playwright helper is available
2. **Navigate**: Go to the target page
3. **Capture Before**: Take screenshot of initial state
4. **Interact**: Perform the action (click, fill, select, etc.)
5. **Wait**: Allow UI to update
6. **Capture After**: Take screenshot of result state
7. **Validate**: Check expected outcome

Example test execution:

```bash
# Test: Login form submission (port auto-detected from project config)
node pw-helper.js navigate "http://localhost:${PORT}/login" --screenshot login-before.png
node pw-helper.js fill "#email" "test@example.com"
node pw-helper.js fill "#password" "password123"
node pw-helper.js click "button[type='submit']" --screenshot login-after.png --wait 2000
```

### Step 4: Validate and Report

After each test, I'll analyze:

1. **Visual Check**: Read the screenshot to verify UI state
2. **Console Check**: Look for JavaScript errors
3. **Network Check**: Verify API calls succeeded
4. **State Check**: Confirm expected changes occurred

Final report format:

```markdown
## Test Results

### Summary
- Total Tests: 15
- Passed: 13
- Failed: 2
- Warnings: 3

### Passed Tests
- [x] Home page loads correctly
- [x] Navigation works
- [x] Login form accepts input
...

### Failed Tests
- [ ] Submit button unresponsive on mobile viewport
  - Expected: Form submits on click
  - Actual: No response to click event
  - Screenshot: submit-fail.png
  - Suggestion: Check click handler binding

### Warnings
- Loading spinner persists for 5+ seconds on /dashboard
- Console warning: "React key prop missing"
...
```

## Helper Script Setup

Before testing, I'll ensure the Playwright helper is installed:

```bash
# Check if helper exists, create if not
if [ ! -f pw-helper.js ]; then
  # I will create the helper script
fi

# Install Playwright if needed
npm list playwright || npm install playwright
npx playwright install chromium
```

## Test Output Directory

All test artifacts are saved to `./test-output/`:
- `screenshots/` - All captured screenshots
- `test-plan.md` - Generated test plan
- `test-results.md` - Final test report
- `console-logs.txt` - Browser console output

## Validation Criteria

I validate tests using these criteria:

### Visual Validation
- Page renders without blank sections
- Elements are visible and properly aligned
- Colors and fonts match expected design
- No overlapping or cut-off content

### Functional Validation
- Clicks trigger expected actions
- Forms accept and validate input
- Navigation leads to correct pages
- Modals open and close properly
- Data displays correctly

### Error Validation
- No JavaScript errors in console
- No network request failures (except expected 4xx)
- No accessibility violations
- No broken images or resources

## Supported Interactions

| Action | Command | Example |
|--------|---------|---------|
| Navigate | `navigate <url>` | `navigate "http://localhost:3000"` |
| Click | `click <selector>` | `click "button.submit"` |
| Fill | `fill <selector> <value>` | `fill "#email" "test@test.com"` |
| Select | `select <selector> <value>` | `select "#country" "US"` |
| Check | `check <selector>` | `check "#agree"` |
| Uncheck | `uncheck <selector>` | `uncheck "#subscribe"` |
| Hover | `hover <selector>` | `hover ".dropdown-trigger"` |
| Press | `press <selector> <key>` | `press "#search" "Enter"` |
| Wait | `wait <ms>` | `wait 2000` |
| Screenshot | `screenshot <name>` | `screenshot "result.png"` |
| Content | `content` | Get page HTML |
| Evaluate | `evaluate <js>` | `evaluate "document.title"` |

## Example Session

User: "Test my web app at /path/to/my-project"

Agent:

### Step 0: Setup & Start Project
```bash
# Read package.json
cat /path/to/my-project/package.json
# Found: "dev": "vite", dependencies include "vite", "react"

# Check for node_modules
ls /path/to/my-project/node_modules  # Not found

# Install dependencies
cd /path/to/my-project && npm install

# Detect port from vite.config.ts
# Found: server.port = 5173

# Start dev server in background
npm run dev &

# Wait for server to be ready
curl http://localhost:5173  # Poll until success
```

### Step 1-2: Analyze & Plan
1. **Detect Framework**: Found `vite.config.ts` → Vite + React project
2. **Detect Port**: `server: { port: 5173 }` → http://localhost:5173
3. **Analyze Code**: Reads `src/` directory
   - Found `App.tsx`, `pages/`, `components/`
   - Identified routes: `/`, `/about`, `/contact`, `/login`
   - Discovered: Navbar, LoginForm, ContactForm, Modal
4. **Create Test Plan**: 12 tests covering all pages and interactions

### Step 3: Execute Tests
```bash
node pw-helper.js navigate "http://localhost:5173" --screenshot home.png
node pw-helper.js click "nav a[href='/login']" --screenshot nav-to-login.png
node pw-helper.js fill "#email" "test@example.com"
node pw-helper.js click "button[type='submit']" --screenshot after-login.png
# ... more tests
```

### Step 4: Validate & Report
5. **Validate Results**: Analyze screenshots, check console logs
6. **Report**: 11 passed, 1 failed (contact form submit error)
7. **Suggest Fix**: "ContactForm.tsx:42 - onClick handler missing await"

### Cleanup
```bash
# Stop dev server when done
kill %1  # or find and kill the process
```

### Port Detection Examples

```
# Vite project - reads vite.config.ts
Found: server.port = 5173 → http://localhost:5173

# Next.js project - reads package.json
Found: "dev": "next dev -p 3001" → http://localhost:3001

# Custom webpack - reads webpack.config.js
Found: devServer.port = 9000 → http://localhost:9000

# No config specified - uses framework default
Vite default → http://localhost:5173
Next.js default → http://localhost:3000
Vue CLI default → http://localhost:8080
Angular default → http://localhost:4200
```

## Notes

- I analyze your actual code to understand expected behavior
- Tests are dynamically generated based on your project
- I validate results myself by reading screenshots
- No pre-written test scripts required
- I adapt to any frontend framework
