#!/usr/bin/env node
/**
 * Wallet Setup Helper - Setup and initialize MetaMask wallet
 *
 * Commands:
 *   wallet-setup   - Download and install MetaMask wallet extension
 *   wallet-init    - Initialize wallet and import private key account
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
Wallet Setup Helper - Setup and initialize MetaMask wallet

Commands:
  wallet-setup              Download and install MetaMask extension
  wallet-init               Initialize wallet and import private key account

Options:
  --wallet                  Required for wallet-init
  --headed                  Run with visible browser
  --headless                Run headless (default)
  --keep-open               Keep browser open after command

Usage:
  # 1. Download and install MetaMask extension
  node wallet-setup-helper.js wallet-setup

  # 2. Initialize wallet (reads WALLET_PRIVATE_KEY from tests/.test-env)
  node wallet-setup-helper.js wallet-init --wallet --headed

Prerequisites:
  - tests/.test-env file must exist with WALLET_PRIVATE_KEY

Flow:
  1. Generate random 12-word mnemonic (saved to WALLET_MNEMONIC)
  2. Create MetaMask wallet using the mnemonic
  3. Import WALLET_PRIVATE_KEY as additional account
  4. Switch to the imported account (active for testing)

Security:
  - Private key is read from tests/.test-env file only
  - Keys are NEVER logged or transmitted to AI APIs
  - WALLET_MNEMONIC and WALLET_PASSWORD are auto-generated
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
