#!/usr/bin/env node
/**
 * Playwright Helper - Lightweight CLI for AI Agent
 * Core testing commands for web applications.
 *
 * For Web3/Wallet commands, use the web-test-wallet-setup and web-test-wallet-connect skills.
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
 *
 * Network Emulation Commands:
 *   set-network              - Set network conditions (--latency, --offline, --online)
 *   mock-route <pattern>     - Mock API response (--status, --body, --delay)
 *   mock-api-error <pattern> - Mock API error (--status, --message)
 *   mock-timeout <pattern>   - Make request timeout
 *   clear-network            - Clear all network mocks
 *   network-status           - Show current network emulation status
 *   throttle-network <preset> - Throttle network (slow-3g, fast-3g, offline, none)
 *
 * Options:
 *   --screenshot <name>      - Take screenshot after action
 *   --wait <ms>              - Wait after action
 *   --mobile                 - Use mobile viewport
 *   --headless               - Run headless (default: true)
 *   --headed                 - Run with visible browser
 *   --timeout <ms>           - Action timeout (default: 10000)
 *   --keep-open              - Keep browser open after command
 */

// Import utilities
const { parseArgs } = require('./lib/utils');

// Import all commands from modules
const basicCommands = require('./commands/basic');
const devServerCommands = require('./commands/dev-server');
const loginCommands = require('./commands/login');
const visionCommands = require('./commands/vision');
const networkCommands = require('./commands/network');

// Merge all commands
const commands = {
  ...basicCommands,
  ...devServerCommands,
  ...loginCommands,
  ...visionCommands,
  ...networkCommands,

  async help() {
    console.log(`
Playwright Helper - CLI for AI Agent

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

Login Detection Commands:
  detect-login-required     Detect if login/auth is required (checks for modals, forms)
  wait-for-login            Wait for manual login (auto-switches to headed mode)

Utility Commands:
  press-key <key>           Press keyboard key globally (Enter, Tab, Escape, etc.)
  scroll <dir> [amount]     Scroll page (dir: up/down/left/right, amount: pixels)
  wait-stable [ms]          Wait for page to stabilize (network idle)
  get-page-info             Get page info and screenshot for AI analysis

Browser Lifecycle Commands:
  browser-open              Open browser and keep it running
  browser-close             Close the browser explicitly

Dev Server Commands:
  dev-server-start [dir] [port]  Start dev server for project
  dev-server-stop               Stop the running dev server
  dev-server-status             Check dev server status

Network Emulation Commands:
  set-network --latency <ms>    Add delay to all requests
  set-network --offline         Simulate offline mode
  set-network --online          Restore online mode
  mock-route <pattern> --status <code> [--body <text>] [--delay <ms>]
                                Mock API response
  mock-api-error <pattern> --status <code> [--message <text>]
                                Mock API error response
  mock-timeout <pattern>        Make request never complete
  clear-network [pattern]       Clear all or specific mocks
  network-status                Show current network emulation status
  throttle-network <preset>     Throttle network (slow-3g, fast-3g, offline, none)

Options:
  --screenshot <name>       Take screenshot after action
  --wait <ms>               Wait after action
  --mobile                  Use mobile viewport
  --headed                  Run with visible browser
  --headless                Run headless (default)
  --keep-open               Keep browser open after command completes
  --timeout <ms>            Action timeout (default: 10000)

Examples:
  node test-helper.js navigate "http://localhost:3000" --screenshot home.png
  node test-helper.js click "#submit-btn" --wait 1000 --screenshot after-submit.png
  node test-helper.js fill "#email" "test@example.com"
  node test-helper.js list-elements

Network Examples:
  node test-helper.js set-network --latency 3000 --headed --keep-open
  node test-helper.js mock-api-error "/api/data" --status 500 --headed --keep-open
  node test-helper.js throttle-network slow-3g --headed --keep-open
  node test-helper.js clear-network --headed --keep-open

For Web3/Wallet testing, use:
  - web-test-wallet-setup skill
  - web-test-wallet-connect skill
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
