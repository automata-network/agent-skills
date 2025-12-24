---
name: web-test-wallet-setup
description: Set up Rabby wallet extension for Web3 DApp testing - download extension, import wallet from private key. REQUIRED for Web3 DApp testing before wallet-connect.
license: MIT
compatibility: Node.js 18+, Playwright
metadata:
  author: AI Agent
  version: 1.0.0
allowed-tools: Bash Read
---

# Wallet Setup

Set up Rabby wallet extension for Web3 DApp testing.

## When to Use This Skill

- **When testing a Web3 DApp** - Required before connecting wallet
- **After project research confirms Web3 DApp** - Part of Web3 test setup
- **Before web-test-wallet-connect** - Wallet must be set up first

## Prerequisites

1. **WALLET_PRIVATE_KEY environment variable** must be set
2. Project research completed (web-test-research)
3. Confirmed this is a Web3 DApp

## Quick Start

```bash
SKILL_DIR="<path-to-this-skill>"

# Pass private key INLINE with each command (REQUIRED)
WALLET_PRIVATE_KEY="0x..." node $SKILL_DIR/scripts/wallet-setup-helper.js wallet-setup
WALLET_PRIVATE_KEY="0x..." node $SKILL_DIR/scripts/wallet-setup-helper.js wallet-init --wallet --headed
```

**Note:** You MUST pass `WALLET_PRIVATE_KEY` inline with each command. Using `export` separately will NOT work because each command runs in a new shell.

## Environment Setup

### Setting the Private Key

**CRITICAL:** The private key must be passed to each command.

```
┌────────────────────────────────────────────────────────────────┐
│  ⚠️  IMPORTANT: How to Pass Private Key                       │
│                                                                │
│  Claude Code runs each command in a NEW shell process.        │
│  Environment variables DO NOT persist between commands!       │
│                                                                │
│  ❌ WRONG (variable lost between commands):                   │
│     export WALLET_PRIVATE_KEY="0x..."                         │
│     node wallet-setup-helper.js wallet-setup  ← KEY IS LOST!  │
│                                                                │
│  ✅ CORRECT (pass inline with EACH command):                  │
│     WALLET_PRIVATE_KEY="0x..." node wallet-setup-helper.js    │
└────────────────────────────────────────────────────────────────┘
```

**Always use inline environment variable:**
```bash
# Pass WALLET_PRIVATE_KEY inline with the command
WALLET_PRIVATE_KEY="0x..." node $SKILL_DIR/scripts/wallet-setup-helper.js wallet-setup
WALLET_PRIVATE_KEY="0x..." node $SKILL_DIR/scripts/wallet-setup-helper.js wallet-init --wallet --headed
```

**How to get the private key:**
1. Ask user: "Please provide your test wallet private key"
2. User provides: `0xabc123...`
3. Use inline: `WALLET_PRIVATE_KEY="0xabc123..." node ...`

**Security Notes:**
- NEVER commit private keys to version control
- Use a TEST wallet with minimal funds
- Private key is ONLY read from environment variable
- The script will fail if private key is not set

## Instructions

### Step 1: Get Private Key from User

**Ask the user for their test wallet private key:**

```
"Please provide your test wallet private key (starts with 0x)"
```

Once user provides the key (e.g., `0xabc123...`), use it inline with commands in the following steps.

### Step 2: Download Wallet Extension

```bash
SKILL_DIR="<path-to-this-skill>"

# Download and install Rabby wallet extension (no private key needed for this step)
node $SKILL_DIR/scripts/wallet-setup-helper.js wallet-setup
```

**What this does:**
- Downloads Rabby wallet CRX file from GitHub
- Extracts to `./test-output/extensions/rabby/`
- Prepares extension for browser loading

**Expected Output:**
```json
{
  "success": true,
  "message": "Rabby Wallet vX.X.X installed successfully",
  "extensionPath": "./test-output/extensions/rabby"
}
```

### Step 3: Initialize Wallet

```bash
SKILL_DIR="<path-to-this-skill>"

# Initialize wallet with private key import
# ⚠️ MUST pass WALLET_PRIVATE_KEY inline!
WALLET_PRIVATE_KEY="0xUserProvidedKey" node $SKILL_DIR/scripts/wallet-setup-helper.js wallet-init --wallet --headed
```

**What this does:**
- Launches browser with wallet extension
- Navigates to Rabby setup page
- Imports wallet using private key from environment
- Sets up wallet password
- Verifies wallet is ready

**Expected Output:**
```json
{
  "success": true,
  "message": "Wallet initialization completed successfully",
  "nextStep": "Use web-test-wallet-connect to connect wallet to DApp"
}
```

## Troubleshooting

### "WALLET_PRIVATE_KEY not set"

**Cause:** Using `export` separately doesn't work because each command runs in a new shell.

**Solution:** Pass the key inline with the command:
```bash
# ✅ CORRECT - pass inline
WALLET_PRIVATE_KEY="0xYourKey" node $SKILL_DIR/scripts/wallet-setup-helper.js wallet-init --wallet --headed

# ❌ WRONG - export is lost
export WALLET_PRIVATE_KEY="0xYourKey"
node $SKILL_DIR/scripts/wallet-setup-helper.js wallet-init --wallet --headed
```

### "Extension download failed"

Check network connection. The script downloads from GitHub releases.

### "Wallet initialization failed"

1. Check if headed mode is working (display available)
2. Verify private key format (should start with 0x)
3. Check `./test-output/screenshots/` for error screenshots

### "Wallet already initialized"

If wallet was previously set up, it will be unlocked automatically.

To reset:
```bash
rm -rf ./test-output/chrome-profile/
node $SKILL_DIR/scripts/wallet-setup-helper.js wallet-setup
node $SKILL_DIR/scripts/wallet-setup-helper.js wallet-init --wallet --headed
```

## Data Storage

Wallet data is stored in the project directory:

```
<project-root>/test-output/
├── extensions/
│   └── rabby/           # Wallet extension files
├── chrome-profile/      # Browser profile with wallet state
└── screenshots/         # Setup screenshots for debugging
```

## Related Skills

- **web-test-research** - Complete first to confirm Web3 DApp
- **web-test-wallet-connect** - Use AFTER wallet setup to connect to DApp
- **web-test** - Execute tests after wallet is connected
- **web-test-cleanup** - Clean up wallet data when done

## Next Steps

After wallet setup is complete:
1. Use **web-test-wallet-connect** to connect wallet to the DApp
2. Then proceed with **web-test** for actual testing

## Notes

- Wallet setup only needs to run once per test-output directory
- Wallet state persists in chrome-profile between test runs
- Use `web-test-cleanup` without `--keep-data` to reset wallet
- Always use a test wallet with minimal funds for testing
