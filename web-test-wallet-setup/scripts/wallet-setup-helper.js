#!/usr/bin/env node
/**
 * Wallet Setup Helper - Setup and initialize Rabby wallet
 *
 * Commands:
 *   wallet-setup   - Download and install Rabby wallet extension
 *   wallet-init    - Initialize wallet with private key
 *
 * Usage:
 *   node wallet-setup-helper.js wallet-setup
 *   node wallet-setup-helper.js wallet-init --wallet --headed
 */

const { parseArgs } = require('./lib/utils');
const walletCommands = require('./commands/wallet-setup');

const commands = {
  ...walletCommands,

  async help() {
    console.log(`
Wallet Setup Helper - Setup and initialize Rabby wallet

Commands:
  wallet-setup              Download and install Rabby wallet extension
  wallet-init               Initialize wallet with private key (import/unlock)

Options:
  --wallet                  Required for wallet-init
  --headed                  Run with visible browser
  --headless                Run headless (default)
  --keep-open               Keep browser open after command

Usage:
  # 1. Download and install Rabby extension
  node wallet-setup-helper.js wallet-setup

  # 2. Initialize wallet (reads WALLET_PRIVATE_KEY from tests/.test-env)
  node wallet-setup-helper.js wallet-init --wallet --headed

Prerequisites:
  - tests/.test-env file must exist with WALLET_PRIVATE_KEY

Security:
  - Private key is read from tests/.test-env file only
  - Key is NEVER logged or transmitted to AI APIs
  - WALLET_PASSWORD is auto-generated and saved to .test-env
`);
  }
};

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    await commands.help();
    return;
  }

  const parsed = parseArgs(args);
  const command = commands[parsed.command];

  if (!command) {
    console.log(JSON.stringify({
      success: false,
      error: `Unknown command: ${parsed.command}. Use 'wallet-setup' or 'wallet-init'`
    }));
    process.exit(1);
  }

  try {
    await command(parsed.args, parsed.options);
  } catch (error) {
    console.log(JSON.stringify({
      success: false,
      error: error.message
    }));
    process.exit(1);
  }
}

main();
