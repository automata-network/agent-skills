---
name: web-test-wallet-connect
description: Connect wallet to Web3 DApp - navigate to DApp, click Connect Wallet, approve in MetaMask popup, verify connection. Use AFTER wallet-setup, BEFORE running tests.
license: MIT
compatibility: Node.js 18+, Playwright
metadata:
  author: AI Agent
  version: 2.0.0
allowed-tools: Bash Read
---

# Wallet Connect

Connect MetaMask wallet to a Web3 DApp.

## When to Use This Skill

- **After web-test-wallet-setup** - Wallet must be set up first
- **Before running Web3 tests** - Connection required for DApp features
- **When wallet gets disconnected** - Re-establish connection

## Prerequisites

1. **web-test-wallet-setup** completed successfully
2. DApp is running and accessible
3. Wallet extension is initialized with funds (if needed)

## Quick Start

```bash
SKILL_DIR="<path-to-this-skill>"

# Navigate to DApp with wallet
node $SKILL_DIR/scripts/wallet-connect-helper.js wallet-navigate "http://localhost:3000" --wallet --headed --keep-open

# Take screenshot to identify Connect button
node $SKILL_DIR/scripts/wallet-connect-helper.js vision-screenshot before-connect.jpg --wallet --headed --keep-open

# Click Connect Wallet button (coordinates from screenshot analysis)
node $SKILL_DIR/scripts/wallet-connect-helper.js vision-click <x> <y> --wallet --headed --keep-open

# Approve connection in MetaMask popup
node $SKILL_DIR/scripts/wallet-connect-helper.js wallet-approve --wallet --headed --keep-open

# Verify connection
node $SKILL_DIR/scripts/wallet-connect-helper.js vision-screenshot after-connect.jpg --wallet --headed --keep-open
```

## Instructions

### Step 1: Navigate to DApp

```bash
SKILL_DIR="<path-to-this-skill>"
DAPP_URL="http://localhost:3000"  # Your DApp URL

# Navigate to DApp with wallet extension loaded
node $SKILL_DIR/scripts/wallet-connect-helper.js wallet-navigate "$DAPP_URL" --wallet --headed --keep-open
```

**Expected Output:**
```json
{
  "success": true,
  "url": "http://localhost:3000",
  "screenshot": "dapp-home.jpg"
}
```

### Step 2: Find Connect Wallet Button

Take a screenshot and analyze to find the Connect button:

```bash
SKILL_DIR="<path-to-this-skill>"

# Take screenshot for AI analysis
node $SKILL_DIR/scripts/wallet-connect-helper.js vision-screenshot before-connect.jpg --wallet --headed --keep-open
```

**Common Connect Button Labels:**
- "Connect Wallet"
- "Connect"
- "Sign In"
- Wallet icon button

**AI Analysis:** Read the screenshot to identify button coordinates.

### Step 3: Click Connect Wallet

```bash
SKILL_DIR="<path-to-this-skill>"

# Click the Connect Wallet button using coordinates from AI analysis
node $SKILL_DIR/scripts/wallet-connect-helper.js vision-click <x> <y> --wallet --headed --keep-open
```

### Step 4: Handle Wallet Selection Modal

Many DApps show a wallet selection modal (Rainbow Kit, Privy, etc.):

```bash
SKILL_DIR="<path-to-this-skill>"

# Take screenshot of modal
node $SKILL_DIR/scripts/wallet-connect-helper.js vision-screenshot wallet-modal.jpg --wallet --headed --keep-open

# Click "Injected" or "Browser Wallet" or "MetaMask" option
node $SKILL_DIR/scripts/wallet-connect-helper.js vision-click <x> <y> --wallet --headed --keep-open
```

**Common Modal Options:**
- "MetaMask"
- "Injected Wallet"
- "Browser Wallet"

### Step 5: Approve Connection in MetaMask

```bash
SKILL_DIR="<path-to-this-skill>"

# Auto-approve the MetaMask connection popup
node $SKILL_DIR/scripts/wallet-connect-helper.js wallet-approve --wallet --headed --keep-open
```

**What this does:**
- Detects MetaMask popup window
- Takes screenshot of popup
- Clicks "Connect" or "Confirm" button
- Waits for popup to close

### Step 6: Verify Connection

```bash
SKILL_DIR="<path-to-this-skill>"

# Take screenshot to verify wallet is connected
node $SKILL_DIR/scripts/wallet-connect-helper.js vision-screenshot after-connect.jpg --wallet --headed --keep-open
```

**Verification Criteria:**
- Wallet address (0x...) visible on page
- "Connect Wallet" button replaced with address/avatar
- Account menu or profile icon appears

### Step 7: Handle Failures

If connection fails, retry up to 3 times:

```bash
# Attempt 1 failed? Try again
node $SKILL_DIR/scripts/wallet-connect-helper.js wallet-navigate "$DAPP_URL" --wallet --headed --keep-open
# ... repeat steps 2-6

# After 3 failures, STOP and report error
```

## Complete Flow Example

```bash
SKILL_DIR="<path-to-this-skill>"
DAPP_URL="http://localhost:3000"

# 1. Navigate to DApp
node $SKILL_DIR/scripts/wallet-connect-helper.js wallet-navigate "$DAPP_URL" --wallet --headed --keep-open

# 2. Screenshot and find Connect button
node $SKILL_DIR/scripts/wallet-connect-helper.js vision-screenshot step1-before.jpg --wallet --headed --keep-open
# AI analyzes: "Connect Wallet button at x=900, y=50"

# 3. Click Connect Wallet
node $SKILL_DIR/scripts/wallet-connect-helper.js vision-click 900 50 --wallet --headed --keep-open

# 4. Wait for modal, screenshot
node $SKILL_DIR/scripts/wallet-connect-helper.js wait 1000 --wallet --headed --keep-open
node $SKILL_DIR/scripts/wallet-connect-helper.js vision-screenshot step2-modal.jpg --wallet --headed --keep-open
# AI analyzes: "Wallet selection modal, 'Browser Wallet' at x=400, y=300"

# 5. Click Browser Wallet option
node $SKILL_DIR/scripts/wallet-connect-helper.js vision-click 400 300 --wallet --headed --keep-open

# 6. Approve in MetaMask
node $SKILL_DIR/scripts/wallet-connect-helper.js wallet-approve --wallet --headed --keep-open

# 7. Verify connection
node $SKILL_DIR/scripts/wallet-connect-helper.js vision-screenshot step3-connected.jpg --wallet --headed --keep-open
# AI verifies: "Wallet address 0x1234...abcd visible - SUCCESS"
```

## Command Reference

| Command | Description |
|---------|-------------|
| `wallet-navigate <url>` | Navigate to DApp with wallet extension |
| `wallet-approve` | Auto-approve MetaMask popup |
| `wallet-switch-network <name>` | Switch network |
| `wallet-get-address` | Get connected address |
| `vision-screenshot [name]` | Take screenshot for AI |
| `vision-click <x> <y>` | Click at coordinates |
| `vision-type <text>` | Type text |
| `wait <ms>` | Wait milliseconds |

## Troubleshooting

### "Connect button not found"
- Page may not be fully loaded - add wait time
- Button may be in different location on mobile/small screens

### "Wallet modal doesn't appear"
- Click may have missed the button - verify coordinates

### "MetaMask popup not detected"
- Extension may not be properly loaded
- Check `./test-output/extensions/metamask/` exists

### "Connection rejected"
- Check if DApp requires specific network
- Switch network before connecting

## Related Skills

- **web-test-wallet-setup** - Must complete before wallet-connect
- **web-test** - Run tests after wallet is connected
- **web-test-report** - Generate report after testing
- **web-test-cleanup** - Clean up after testing

## Next Steps

After wallet connection is verified:
1. Proceed to **web-test** skill to execute test cases
2. Handle wallet transaction popups during tests with `wallet-approve`

## Notes

- Keep browser open (`--keep-open`) for subsequent test steps
- Always use `--wallet --headed` flags for wallet operations
- Max 3 retry attempts for connection
- If all retries fail, stop testing and report error
