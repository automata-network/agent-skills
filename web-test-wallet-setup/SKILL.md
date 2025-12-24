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

# Step 1: Check if WALLET_PRIVATE_KEY is set in environment
echo $WALLET_PRIVATE_KEY | head -c 10

# Step 2: Download wallet extension (no key needed)
node $SKILL_DIR/scripts/wallet-setup-helper.js wallet-setup

# Step 3: Initialize wallet - pass $WALLET_PRIVATE_KEY to child process
WALLET_PRIVATE_KEY="$WALLET_PRIVATE_KEY" node $SKILL_DIR/scripts/wallet-setup-helper.js wallet-init --wallet --headed
```

**Note:** Use `$WALLET_PRIVATE_KEY` (with $) to pass the environment variable to the child process.

## Environment Setup

### Setting the Private Key

**CRITICAL:** The private key must be passed to child processes.

```
┌────────────────────────────────────────────────────────────────┐
│  ⚠️  IMPORTANT: Pass Environment Variable to Child Process     │
│                                                                │
│  Step 1: Check if WALLET_PRIVATE_KEY exists in environment    │
│                                                                │
│     echo $WALLET_PRIVATE_KEY | head -c 10                      │
│                                                                │
│  Step 2: If exists, pass it to child process using $VAR       │
│                                                                │
│     WALLET_PRIVATE_KEY="$WALLET_PRIVATE_KEY" node ...          │
│                                                                │
│  Step 3: If NOT exists, ask user to set it first              │
│                                                                │
│     "Please set WALLET_PRIVATE_KEY before running tests"       │
└────────────────────────────────────────────────────────────────┘
```

**How to check and use:**
```bash
# Step 1: Check if variable exists in environment
echo $WALLET_PRIVATE_KEY | head -c 10

# Step 2: If it shows the key prefix, pass it to child process
WALLET_PRIVATE_KEY="$WALLET_PRIVATE_KEY" node $SKILL_DIR/scripts/wallet-setup-helper.js wallet-init --wallet --headed
```

**If variable is not set:**
```
Ask user: "WALLET_PRIVATE_KEY is not set in your environment.
Please run this command in your terminal and restart Claude Code:

export WALLET_PRIVATE_KEY=\"0xYourPrivateKey\"
"
```

**Security Notes:**
- NEVER commit private keys to version control
- Use a TEST wallet with minimal funds
- Private key is ONLY read from environment variable
- The script will fail if private key is not set

## Instructions

### Step 1: Check Environment Variable

**First, check if WALLET_PRIVATE_KEY is set:**

```bash
echo $WALLET_PRIVATE_KEY | head -c 10
```

- If output shows `0x...` prefix → Variable is set, continue to Step 2
- If output is empty → Ask user to set it:

```
"WALLET_PRIVATE_KEY is not set. Please run this in your terminal and restart Claude Code:

export WALLET_PRIVATE_KEY=\"0xYourPrivateKey\"
"
```

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

# Initialize wallet - pass $WALLET_PRIVATE_KEY to child process
# ⚠️ Use $WALLET_PRIVATE_KEY (with $) to reference the environment variable!
WALLET_PRIVATE_KEY="$WALLET_PRIVATE_KEY" node $SKILL_DIR/scripts/wallet-setup-helper.js wallet-init --wallet --headed
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

**Cause:** The environment variable is not set, or not passed to the child process.

**Solution:**

1. First check if the variable exists:
```bash
echo $WALLET_PRIVATE_KEY | head -c 10
```

2. If empty, ask user to set it in their terminal and restart Claude Code:
```bash
export WALLET_PRIVATE_KEY="0xYourKey"
```

3. If set, pass it to child process using `$WALLET_PRIVATE_KEY`:
```bash
# ✅ CORRECT - use $WALLET_PRIVATE_KEY to reference the variable
WALLET_PRIVATE_KEY="$WALLET_PRIVATE_KEY" node $SKILL_DIR/scripts/wallet-setup-helper.js wallet-init --wallet --headed
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
