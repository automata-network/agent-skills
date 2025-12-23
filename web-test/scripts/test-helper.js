#!/usr/bin/env node
/**
 * Playwright Helper - Lightweight CLI for AI Agent
 * With Web3 DApp & Wallet Extension Support
 *
 * Allows AI agents to execute Playwright commands directly from bash.
 * Supports loading wallet extensions (Rabby, MetaMask) for Web3 testing.
 *
 * SECURITY: Private keys are read from environment variables only.
 * They are NEVER logged, transmitted to APIs, or stored in files.
 *
 * Usage:
 *   node test-helper.js <command> [args...] [options]
 *
 * Commands:
 *   start                    - Start browser session
 *   stop                     - Stop browser session
 *   navigate <url>           - Navigate to URL
 *   click <selector>         - Click element
 *   fill <selector> <value>  - Fill input field
 *   select <selector> <value> - Select dropdown option
 *   check <selector>         - Check checkbox
 *   uncheck <selector>       - Uncheck checkbox
 *   hover <selector>         - Hover over element
 *   press <selector> <key>   - Press key on element
 *   screenshot [name]        - Take screenshot
 *   content                  - Get page HTML content
 *   text <selector>          - Get element text
 *   evaluate <js>            - Evaluate JavaScript
 *   wait <ms>                - Wait milliseconds
 *   wait-for <selector>      - Wait for element
 *   list-elements            - List all interactive elements
 *   run-test <json>          - Run test from JSON
 *
 * Web3 Commands:
 *   wallet-setup             - Download and setup Rabby wallet extension
 *   wallet-import            - Import wallet (uses WALLET_PRIVATE_KEY, generates WALLET_PASSWORD)
 *   wallet-unlock            - Unlock wallet using WALLET_PASSWORD env var
 *   wallet-connect           - Connect wallet to current DApp
 *   wallet-switch-network    - Switch to specified network
 *   wallet-get-address       - Get current wallet address
 *
 * Login Detection Commands:
 *   detect-login-required    - Detect if login/auth is required on current page
 *   wait-for-login           - Wait for manual login (auto-switches to headed mode, fails if no display)
 *
 * Options:
 *   --screenshot <name>      - Take screenshot after action
 *   --wait <ms>              - Wait after action
 *   --mobile                 - Use mobile viewport
 *   --headless               - Run headless (default: true)
 *   --headed                 - Run with visible browser
 *   --timeout <ms>           - Action timeout (default: 10000)
 *   --wallet                 - Load with wallet extension
 *   --network <name>         - Specify network (ethereum, polygon, arbitrum, etc.)
 */

// Import utilities
const { parseArgs } = require('./lib/utils');

// Import all commands from modules
const basicCommands = require('./commands/basic');
const devServerCommands = require('./commands/dev-server');
const walletCommands = require('./commands/wallet');
const loginCommands = require('./commands/login');
const visionCommands = require('./commands/vision');

// Merge all commands
const commands = {
  ...basicCommands,
  ...devServerCommands,
  ...walletCommands,
  ...loginCommands,
  ...visionCommands,

  async help() {
    console.log(`
Playwright Helper - CLI for AI Agent (with Web3 Support)

Commands:
  start                     Start browser session
  stop                      Stop browser session
  navigate <url>            Navigate to URL
  click <selector>          Click element
  fill <selector> <value>   Fill input field
  select <selector> <value> Select dropdown option
  check <selector>          Check checkbox
  uncheck <selector>        Uncheck checkbox
  hover <selector>          Hover over element
  press <selector> <key>    Press key on element
  screenshot [name]         Take screenshot
  content                   Get page HTML content
  text <selector>           Get element text
  evaluate <js>             Evaluate JavaScript
  wait <ms>                 Wait milliseconds
  wait-for <selector>       Wait for element
  list-elements             List all interactive elements
  run-test <json>           Run test from JSON file

Web3 Wallet Commands:
  wallet-setup              Open Chrome Web Store to install Rabby Wallet
  wallet-import             Import wallet (uses WALLET_PRIVATE_KEY, generates WALLET_PASSWORD)
  wallet-unlock             Unlock wallet (uses WALLET_PASSWORD env var)
  wallet-navigate <url>     Navigate to DApp with Rabby Wallet available
  wallet-connect            Connect wallet to current DApp
  wallet-switch-network <n> Switch network (ethereum, polygon, arbitrum, etc.)
  wallet-get-address        Get current wallet address

Login Detection Commands:
  detect-login-required     Detect if login/auth is required (checks for modals, forms)
  wait-for-login            Wait for manual login (auto-switches to headed mode, fails if no display)

Vision-Based Commands (AI Agent Visual Analysis):
  vision-screenshot [name]  Take screenshot for AI to analyze (use Read tool to view)
  vision-click <x> <y>      Click at coordinates (AI determines from screenshot)
  vision-double-click <x> <y>  Double-click at coordinates
  vision-type <text>        Type text at current cursor position
  vision-press-key <key>    Press keyboard key (Enter, Tab, Escape, etc.)
  vision-scroll <dir> [amt] Scroll page (dir: up/down/left/right, amt: pixels)
  vision-hover <x> <y>      Move mouse to coordinates (for hover effects)
  vision-drag <x1> <y1> <x2> <y2>  Drag from one point to another
  vision-wait-stable [ms]   Wait for page to stabilize, then screenshot
  vision-get-page-info      Get page info and screenshot for AI analysis

Browser Lifecycle Commands:
  browser-open              Open browser and keep it running
  browser-close             Close the browser explicitly

Dev Server Commands:
  dev-server-start [dir] [port]  Start dev server for project
  dev-server-stop               Stop the running dev server
  dev-server-status             Check dev server status

Options:
  --screenshot <name>       Take screenshot after action
  --wait <ms>               Wait after action
  --mobile                  Use mobile viewport
  --headed                  Run with visible browser
  --headless                Run headless (default)
  --keep-open               Keep browser open after command completes
  --timeout <ms>            Action timeout (default: 10000)
  --wallet                  Load with Rabby wallet extension
  --network <name>          Specify network for Web3 operations

Examples:
  node test-helper.js navigate "http://localhost:3000" --screenshot home.png
  node test-helper.js click "#submit-btn" --wait 1000 --screenshot after-submit.png
  node test-helper.js fill "#email" "test@example.com"
  node test-helper.js list-elements

Web3 DApp Testing:
  # 1. Install Rabby Wallet (one-time, opens Chrome Web Store)
  node test-helper.js wallet-setup
  # Click "Add to Chrome" to install, then close browser

  # 2. Set private key in terminal (REQUIRED, no .env support!)
  export WALLET_PRIVATE_KEY="your_private_key_here"

  # 3. Import wallet into Rabby (one-time)
  node test-helper.js wallet-import

  # 4. Navigate to DApp with Rabby available
  node test-helper.js wallet-navigate <url>

  # 5. Connect wallet to DApp
  node test-helper.js wallet-connect

  # 6. Switch network if needed
  node test-helper.js wallet-switch-network polygon

SECURITY:
  - Private key MUST be set via: export WALLET_PRIVATE_KEY="..."
  - NO .env file support (intentionally disabled for security)
  - Key is NEVER logged, transmitted, or stored
  - If WALLET_PRIVATE_KEY is not set, command will exit with error
  - All wallet operations happen locally in the browser
`);
  }
};

// Main execution
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
