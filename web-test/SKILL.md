---
name: web-test
description: AI-driven web app testing - execute tests using Playwright with vision-based interactions. This is the CORE testing skill. Use related skills for cleanup, research, wallet, and reporting.
license: MIT
compatibility: Node.js 18+, Playwright (global)
metadata:
  author: AI Agent
  version: 2.0.0
allowed-tools: Bash Read Write Glob Grep Task Skill
---

# Intelligent Web Testing

Execute AI-driven tests using Playwright with vision-based interactions.

## IMPORTANT: Use Related Skills

This skill is part of a modular testing system. **You MUST use the appropriate skill for each task:**

| Task | Skill to Use | Description |
|------|--------------|-------------|
| Clean up before/after tests | **web-test-cleanup** | Kill browsers, stop servers, free ports |
| Understand the project | **web-test-research** | Detect framework, routes, Web3 status |
| Create test plan | **web-test-plan** | Define test cases and priorities |
| Set up wallet (Web3) | **web-test-wallet-setup** | Download and initialize Rabby wallet |
| Connect wallet (Web3) | **web-test-wallet-connect** | Connect wallet to DApp, handle popups |
| Execute tests | **web-test** (this skill) | Run vision-based browser tests |
| Generate report | **web-test-report** | Create test report with results |

## Complete Testing Workflow

**FOLLOW THIS ORDER:**

```
Step 1: Use skill "web-test-cleanup"         → Clean previous session
Step 2: Use skill "web-test-research"        → Understand the project
Step 3: Use skill "web-test-plan"            → Create test plan
Step 4: Use skill "web-test-wallet-setup"    → (Web3 only) Set up wallet
Step 5: Use skill "web-test-wallet-connect"  → (Web3 only) Connect wallet
Step 6: Use skill "web-test"                 → Execute tests (THIS SKILL)
Step 7: Use skill "web-test-report"          → Generate report
Step 8: Use skill "web-test-cleanup"         → Final cleanup (--keep-data)
```

## Prerequisites

Before using this skill:
1. Run **web-test-cleanup** skill (clean slate)
2. Run **web-test-research** skill (understand project)
3. Run **web-test-plan** skill (know what to test)
4. If Web3 DApp: Run **web-test-wallet-setup** and **web-test-wallet-connect** skills

```bash
# Install Playwright globally (one-time setup)
npm install -g playwright
npx playwright install chromium
```

## Test Execution

### Starting a Test Session

```bash
SKILL_DIR="<path-to-this-skill>"

# Navigate to page
node $SKILL_DIR/scripts/test-helper.js navigate "http://localhost:3000" --headed --keep-open

# Take initial screenshot
node $SKILL_DIR/scripts/test-helper.js vision-screenshot initial.jpg --headed --keep-open
```

### Vision-Based Testing (Recommended)

Use vision commands for reliable cross-framework testing:

```bash
SKILL_DIR="<path-to-this-skill>"

# Take screenshot for AI analysis
node $SKILL_DIR/scripts/test-helper.js vision-screenshot page.jpg --headed --keep-open

# Click at coordinates (AI determines from screenshot)
node $SKILL_DIR/scripts/test-helper.js vision-click 500 300 --headed --keep-open

# Type text at cursor
node $SKILL_DIR/scripts/test-helper.js vision-type "hello@example.com" --headed --keep-open

# Press keyboard key
node $SKILL_DIR/scripts/test-helper.js vision-press-key Enter --headed --keep-open

# Scroll page
node $SKILL_DIR/scripts/test-helper.js vision-scroll down 500 --headed --keep-open

# Wait for page to stabilize
node $SKILL_DIR/scripts/test-helper.js vision-wait-stable --headed --keep-open
```

### Selector-Based Testing (Alternative)

For simple cases with known selectors:

```bash
SKILL_DIR="<path-to-this-skill>"

# Click element
node $SKILL_DIR/scripts/test-helper.js click "button.submit" --screenshot after-click.jpg

# Fill input
node $SKILL_DIR/scripts/test-helper.js fill "#email" "test@example.com"

# Select dropdown
node $SKILL_DIR/scripts/test-helper.js select "#country" "US"

# Check checkbox
node $SKILL_DIR/scripts/test-helper.js check "#agree-terms"
```

## Test Execution Steps

For each test case:

### Step 1: Navigate to Target Page

```bash
node $SKILL_DIR/scripts/test-helper.js navigate "http://localhost:3000/page" --headed --keep-open
```

### Step 2: Capture Initial State

```bash
node $SKILL_DIR/scripts/test-helper.js vision-screenshot test-001-before.jpg --headed --keep-open
```

### Step 3: Perform Action

Based on AI analysis of screenshot:

```bash
node $SKILL_DIR/scripts/test-helper.js vision-click 450 320 --headed --keep-open
```

### Step 4: Wait for UI Update

```bash
node $SKILL_DIR/scripts/test-helper.js wait 1000 --headed --keep-open
# OR wait for stability
node $SKILL_DIR/scripts/test-helper.js vision-wait-stable --headed --keep-open
```

### Step 5: Capture Result State

```bash
node $SKILL_DIR/scripts/test-helper.js vision-screenshot test-001-after.jpg --headed --keep-open
```

### Step 6: Validate Outcome

AI analyzes screenshot to verify:
- Expected UI changes occurred
- No error messages
- Correct state displayed

## Web3 DApp Testing

**IMPORTANT:** For Web3 DApp testing, you MUST use the wallet skills:

1. **Before testing:** Use **web-test-wallet-setup** skill to set up wallet
2. **Before testing:** Use **web-test-wallet-connect** skill to connect wallet
3. **During testing:** Use **web-test-wallet-connect** skill's `wallet-approve` command for popups

### Handling Wallet Popups During Tests

When a test action triggers a wallet popup (swap, mint, sign, etc.):

```bash
# Use the wallet-connect skill's helper, NOT this skill's test-helper.js
WALLET_SKILL_DIR="<path-to-web-test-wallet-connect>"

node $WALLET_SKILL_DIR/scripts/wallet-connect-helper.js wallet-approve --wallet --headed --keep-open
```

**DO NOT use this skill for:**
- Wallet setup → Use **web-test-wallet-setup**
- Wallet connection → Use **web-test-wallet-connect**
- Wallet popup approval → Use **web-test-wallet-connect**

## Command Reference

### Navigation & Screenshots
| Command | Description |
|---------|-------------|
| `navigate <url>` | Navigate to URL |
| `vision-screenshot [name]` | Take screenshot for AI |
| `screenshot [name]` | Take simple screenshot |
| `vision-wait-stable` | Wait for page stability |

### Vision Interactions
| Command | Description |
|---------|-------------|
| `vision-click <x> <y>` | Click at coordinates |
| `vision-double-click <x> <y>` | Double-click at coordinates |
| `vision-type <text>` | Type text at cursor |
| `vision-press-key <key>` | Press keyboard key |
| `vision-scroll <dir> [px]` | Scroll page |
| `vision-hover <x> <y>` | Hover at coordinates |
| `vision-drag <x1> <y1> <x2> <y2>` | Drag from point to point |

### Selector Interactions
| Command | Description |
|---------|-------------|
| `click <selector>` | Click element |
| `fill <selector> <value>` | Fill input |
| `select <selector> <value>` | Select dropdown |
| `check/uncheck <selector>` | Toggle checkbox |
| `hover <selector>` | Hover element |
| `press <selector> <key>` | Press key on element |

### Utility Commands
| Command | Description |
|---------|-------------|
| `wait <ms>` | Wait milliseconds |
| `wait-for <selector>` | Wait for element |
| `content` | Get page HTML |
| `text <selector>` | Get element text |
| `list-elements` | List interactive elements |

### Browser Lifecycle
| Command | Description |
|---------|-------------|
| `start` | Start browser session |
| `stop` | Stop browser session |
| `browser-open` | Open browser and keep running |
| `browser-close` | Close browser explicitly |

### Dev Server Commands
| Command | Description |
|---------|-------------|
| `dev-server-start [dir] [port]` | Start dev server |
| `dev-server-stop` | Stop dev server |
| `dev-server-status` | Check dev server status |

## Common Options

| Option | Description |
|--------|-------------|
| `--headed` | Show browser window |
| `--headless` | Hide browser (default) |
| `--keep-open` | Keep browser open after command |
| `--screenshot <name>` | Auto-screenshot after action |
| `--wait <ms>` | Wait after action |
| `--mobile` | Use mobile viewport |
| `--timeout <ms>` | Command timeout |

## Data Storage

All test artifacts in project directory:

```
<project-root>/test-output/
├── screenshots/      # Test screenshots
├── chrome-profile/   # Browser state
├── console-logs.txt  # Browser console
└── test-report.md    # Generated report
```

## After Testing

When all tests are complete:

1. **Generate Report:** Use **web-test-report** skill
2. **Cleanup:** Use **web-test-cleanup** skill with `--keep-data`

## Notes

- Always use vision-based testing for reliability
- Keep browser open between tests (`--keep-open`)
- Take screenshots before AND after each action
- AI validates results by analyzing screenshots
- For Web3 testing, ALWAYS use the wallet skills first
- See `references/REFERENCE.md` for detailed documentation
