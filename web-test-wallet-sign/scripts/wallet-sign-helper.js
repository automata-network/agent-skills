#!/usr/bin/env node
/**
 * Wallet Sign Helper - Handle MetaMask signature and transaction popups
 *
 * Commands:
 *   wallet-sign    - Auto-detect popup type and handle (approve signatures, check gas for tx)
 *   wallet-reject  - Reject any pending popup
 *   wallet-check   - Check popup status without acting
 *
 * Usage:
 *   node wallet-sign-helper.js wallet-sign --wallet --headed --keep-open
 *   node wallet-sign-helper.js wallet-reject --wallet --headed --keep-open
 */

const { parseArgs } = require('./lib/utils');
const walletSignCommands = require('./commands/wallet-sign');

const commands = {
  ...walletSignCommands,

  async help() {
    console.log(`
Wallet Sign Helper - Handle MetaMask signature and transaction popups

Commands:
  wallet-sign     Auto-detect popup type and handle appropriately
                  - Signatures (personal_sign, signTypedData): always approve
                  - Transactions: check gas, approve if sufficient, fail if not
  wallet-reject   Reject any pending popup
  wallet-check    Check if popup exists and its type

Options:
  --wallet        Required - connects to wallet extension
  --headed        Run with visible browser
  --keep-open     Keep browser open after command
  --timeout <ms>  Action timeout (default: 30000)

Usage:
  # Handle MetaMask popup (auto-detect type)
  node wallet-sign-helper.js wallet-sign --wallet --headed --keep-open

  # Reject popup
  node wallet-sign-helper.js wallet-reject --wallet --headed --keep-open

  # Check popup status
  node wallet-sign-helper.js wallet-check --wallet --headed --keep-open

Popup Types Handled:
  - personal_sign: Approve immediately (no gas cost)
  - signTypedData_v4: Approve immediately (no gas cost)
  - eth_sendTransaction: Check gas, fail test if insufficient
  - Contract call: Check gas, fail test if insufficient
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
      error: `Unknown command: ${parsed.command}`
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
