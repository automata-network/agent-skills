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

1. **`tests/.test-env`** file with `WALLET_PRIVATE_KEY` already exists
2. Project research completed (web-test-research)
3. Confirmed this is a Web3 DApp

## Quick Start

```bash
SKILL_DIR="<path-to-this-skill>"

# Step 1: Download wallet extension
node $SKILL_DIR/scripts/wallet-setup-helper.js wallet-setup

# Step 2: Initialize wallet (reads WALLET_PRIVATE_KEY from .test-env, writes WALLET_PASSWORD)
node $SKILL_DIR/scripts/wallet-setup-helper.js wallet-init --wallet --headed
```

## How It Works

- **Reads** `WALLET_PRIVATE_KEY` from `tests/.test-env`
- **Writes** `WALLET_PASSWORD` to `tests/.test-env` (auto-generated if not set)
- Private key is only used locally in Playwright browser, never exposed to AI APIs

## Instructions

### Step 1: Download Wallet Extension

```bash
SKILL_DIR="<path-to-this-skill>"

# Download and install Rabby wallet extension
node $SKILL_DIR/scripts/wallet-setup-helper.js wallet-setup
```

**What this does:**
- Downloads Rabby wallet from GitHub releases
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

### Step 2: Initialize Wallet

```bash
SKILL_DIR="<path-to-this-skill>"

# Initialize wallet (reads from .test-env automatically)
node $SKILL_DIR/scripts/wallet-setup-helper.js wallet-init --wallet --headed
```

**What this does:**
- Reads `WALLET_PRIVATE_KEY` from `tests/.test-env`
- Launches browser with wallet extension
- Imports wallet using private key
- Generates and saves `WALLET_PASSWORD` to `.test-env`
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

### "WALLET_PRIVATE_KEY not found in .test-env file"

The `.test-env` file does not exist or does not contain the private key. Ensure `tests/.test-env` exists with `WALLET_PRIVATE_KEY` before running this skill.

### "Extension download failed"

Check network connection. The script downloads from GitHub releases.

### "Wallet initialization failed"

1. Check if headed mode is working (display available)
2. Verify private key format (should start with 0x)
3. Check `./test-output/screenshots/` for error screenshots

### "Wallet already initialized"

If wallet was previously set up, it will be unlocked automatically using the password from `.test-env`.

To reset:
```bash
rm -rf ./test-output/chrome-profile/
node $SKILL_DIR/scripts/wallet-setup-helper.js wallet-setup
node $SKILL_DIR/scripts/wallet-setup-helper.js wallet-init --wallet --headed
```

## Data Storage

```
<project-root>/
├── tests/
│   └── .test-env        # Reads WALLET_PRIVATE_KEY, writes WALLET_PASSWORD
└── test-output/
    ├── extensions/
    │   └── rabby/       # Wallet extension files
    ├── chrome-profile/  # Browser profile with wallet state
    └── screenshots/     # Setup screenshots for debugging
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
