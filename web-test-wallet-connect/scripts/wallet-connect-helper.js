#!/usr/bin/env node
/**
 * Wallet Connect Helper - Connect Rabby wallet to DApps
 *
 * Commands:
 *   wallet-navigate <url>    - Navigate to DApp with wallet extension
 *   wallet-approve           - Approve wallet popup (connect/sign/confirm)
 *   wallet-switch-network    - Switch to specified network
 *   wallet-get-address       - Get current wallet address
 *   vision-screenshot        - Take screenshot for AI analysis
 *   vision-click             - Click at coordinates
 *
 * Usage:
 *   node wallet-connect-helper.js wallet-navigate "http://localhost:3000" --wallet --headed --keep-open
 *   node wallet-connect-helper.js wallet-approve --wallet --headed --keep-open
 */

const { parseArgs } = require('./lib/utils');
const walletConnectCommands = require('./commands/wallet-connect');

const commands = {
  ...walletConnectCommands,

  async help() {
    console.log(`
Wallet Connect Helper - Connect Rabby wallet to DApps

Commands:
  wallet-navigate <url>     Navigate to DApp with wallet extension loaded
  wallet-listen             Start listening for popup (call before clicking Connect)
  wallet-approve            Approve wallet popup (connect/sign/confirm)
  wallet-switch-network <n> Switch network (ethereum, polygon, arbitrum, etc.)
  wallet-get-address        Get current wallet address
  vision-screenshot [name]  Take screenshot for AI analysis
  vision-click <x> <y>      Click at coordinates
  vision-type <text>        Type text at cursor
  wait <ms>                 Wait milliseconds

Options:
  --wallet                  Required - loads wallet extension
  --headed                  Run with visible browser
  --keep-open               Keep browser open after command
  --timeout <ms>            Action timeout (default: 30000)

Usage:
  # 1. Navigate to DApp with wallet
  node wallet-connect-helper.js wallet-navigate "http://localhost:3000" --wallet --headed --keep-open

  # 2. Take screenshot to find Connect button
  node wallet-connect-helper.js vision-screenshot before-connect.jpg --wallet --headed --keep-open

  # 3. Click Connect Wallet button (AI determines coordinates)
  node wallet-connect-helper.js vision-click 500 50 --wallet --headed --keep-open

  # 4. Approve Rabby popup (auto-detects and clicks approve button)
  node wallet-connect-helper.js wallet-approve --wallet --headed --keep-open

  # 5. Verify connection
  node wallet-connect-helper.js vision-screenshot after-connect.jpg --wallet --headed --keep-open

Note: wallet-navigate and vision-click automatically start popup listeners.
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
