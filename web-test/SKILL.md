---
name: web-test
description: AI-driven web app testing - execute tests using Playwright with vision-based interactions. This is the CORE testing skill. Use related skills for setup, research, and cleanup.
license: MIT
compatibility: Node.js 18+, Playwright (global)
metadata:
  author: AI Agent
  version: 2.0.0
allowed-tools: Bash Read Write Glob Grep Task
---

# Intelligent Web Testing

Execute AI-driven tests using Playwright with vision-based interactions.

## Related Skills (Use These!)

| Skill | When to Use |
|-------|-------------|
| **web-test-cleanup** | BEFORE starting tests (clean slate) and AFTER tests (cleanup) |
| **web-test-research** | BEFORE testing to understand the project |
| **web-test-plan** | AFTER research to create test plan |
| **web-test-wallet-setup** | If Web3 DApp - set up wallet BEFORE connect |
| **web-test-wallet-connect** | If Web3 DApp - connect wallet BEFORE tests |
| **web-test-report** | AFTER tests to generate report |

## Complete Testing Workflow

```
1. web-test-cleanup          → Clean previous session
2. web-test-research         → Understand the project
3. web-test-plan             → Create test plan
4. web-test-wallet-setup     → (Web3 only) Set up wallet
5. web-test-wallet-connect   → (Web3 only) Connect wallet
6. web-test                  → Execute tests (THIS SKILL)
7. web-test-report           → Generate report
8. web-test-cleanup          → Final cleanup (--keep-data)
```

## Quick Start

Ask me to test your web app:
- "Test my web app"
- "Run the test plan"
- "Execute UI tests"

## Prerequisites

Before using this skill, ensure:
1. **web-test-cleanup** has been run (clean slate)
2. **web-test-research** completed (understand project)
3. **web-test-plan** created (know what to test)
4. **If Web3 DApp:** wallet-setup and wallet-connect completed

```bash
# Install Playwright globally (one-time setup)
npm install -g playwright
npx playwright install chromium
```

## Key Principles

**Script Independence:**
- The `scripts/test-helper.js` lives in this skill directory
- Call it using absolute path: `node <skill-directory>/scripts/test-helper.js <command>`
- Test artifacts go to `./test-output/` in the project directory
- Do NOT inject scripts into the user's project

## Test Execution

### Starting a Test Session

```bash
SKILL_DIR="<path-to-this-skill>"

# Start browser (headless by default)
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
# AI analyzes screenshot to find element coordinates

# Click at coordinates
node $SKILL_DIR/scripts/test-helper.js vision-click 500 300 --headed --keep-open

# Type text
node $SKILL_DIR/scripts/test-helper.js vision-type "hello@example.com" --headed --keep-open

# Press keys
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
SKILL_DIR="<path-to-this-skill>"

node $SKILL_DIR/scripts/test-helper.js navigate "http://localhost:3000/page" --headed --keep-open
```

### Step 2: Capture Initial State

```bash
node $SKILL_DIR/scripts/test-helper.js vision-screenshot test-001-before.jpg --headed --keep-open
```

### Step 3: Perform Action

Based on AI analysis of screenshot:

```bash
# Click button at identified coordinates
node $SKILL_DIR/scripts/test-helper.js vision-click 450 320 --headed --keep-open
```

### Step 4: Wait for UI Update

```bash
node $SKILL_DIR/scripts/test-helper.js wait 1000 --headed --keep-open
# OR wait for stability
node $SKILL_DIR/scripts/test-helper.js vision-wait-stable --headed --keep-open
```

### Step 5: Handle Wallet Popups (Web3 Only)

If testing Web3 DApp and action triggers blockchain interaction:

```bash
# Auto-approve Rabby popup
node $SKILL_DIR/scripts/test-helper.js wallet-approve --wallet --headed --keep-open
```

### Step 6: Capture Result State

```bash
node $SKILL_DIR/scripts/test-helper.js vision-screenshot test-001-after.jpg --headed --keep-open
```

### Step 7: Validate Outcome

AI analyzes screenshot to verify:
- Expected UI changes occurred
- No error messages
- Correct state displayed

## Web3 DApp Testing

**IMPORTANT:** For Web3 DApps, use these flags: `--wallet --headed --keep-open`

### Handling Transaction Popups

When DApp actions trigger wallet popups:

```bash
SKILL_DIR="<path-to-this-skill>"

# 1. Click DApp button (e.g., Swap, Mint, Send)
node $SKILL_DIR/scripts/test-helper.js vision-click <x> <y> --wallet --headed --keep-open

# 2. Auto-approve Rabby popup
node $SKILL_DIR/scripts/test-helper.js wallet-approve --wallet --headed --keep-open

# 3. Wait for transaction
node $SKILL_DIR/scripts/test-helper.js wait 3000 --wallet --headed --keep-open

# 4. Verify result
node $SKILL_DIR/scripts/test-helper.js vision-screenshot after-tx.jpg --wallet --headed --keep-open
```

### Common Web3 Actions

| Action | Triggers Popup |
|--------|---------------|
| Connect Wallet | Yes (approval) |
| Sign Message | Yes (signature) |
| Approve Token | Yes (transaction) |
| Swap Tokens | Yes (transaction) |
| Mint NFT | Yes (transaction) |
| Send/Transfer | Yes (transaction) |

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
| `vision-type <text>` | Type text at cursor |
| `vision-press-key <key>` | Press keyboard key |
| `vision-scroll <dir> [px]` | Scroll page |
| `vision-hover <x> <y>` | Hover at coordinates |

### Selector Interactions
| Command | Description |
|---------|-------------|
| `click <selector>` | Click element |
| `fill <selector> <value>` | Fill input |
| `select <selector> <value>` | Select dropdown |
| `check/uncheck <selector>` | Toggle checkbox |
| `hover <selector>` | Hover element |

### Utility Commands
| Command | Description |
|---------|-------------|
| `wait <ms>` | Wait milliseconds |
| `wait-for <selector>` | Wait for element |
| `content` | Get page HTML |
| `list-elements` | List interactive elements |

### Web3 Commands
| Command | Description |
|---------|-------------|
| `wallet-approve` | Auto-approve Rabby popup |
| `wallet-navigate <url>` | Navigate with wallet |
| `wallet-get-address` | Get connected address |
| `wallet-switch-network <name>` | Switch network |

## Common Options

| Option | Description |
|--------|-------------|
| `--headed` | Show browser window |
| `--headless` | Hide browser (default) |
| `--keep-open` | Keep browser open after command |
| `--wallet` | Enable wallet extension |
| `--screenshot <name>` | Auto-screenshot after action |
| `--wait <ms>` | Wait after action |
| `--mobile` | Use mobile viewport |
| `--timeout <ms>` | Command timeout |

## Data Storage

All test artifacts in project directory:

```
<project-root>/test-output/
├── screenshots/      # Test screenshots
├── chrome-profile/   # Browser state, wallet data
├── extensions/       # Wallet extensions
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
- For Web3, always include `--wallet --headed`
- Take screenshots before AND after each action
- AI validates results by analyzing screenshots
- See `references/REFERENCE.md` for detailed documentation
