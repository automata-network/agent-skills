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

  # 2. Set private key (REQUIRED)
  export WALLET_PRIVATE_KEY="your_private_key_here"

  # 3. Initialize wallet
  node wallet-setup-helper.js wallet-init --wallet --headed

SECURITY:
  - Private key MUST be set via: export WALLET_PRIVATE_KEY="..."
  - Key is NEVER logged, transmitted, or stored
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
