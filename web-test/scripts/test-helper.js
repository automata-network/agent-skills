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

// Merge all commands
const commands = {
  ...basicCommands,
  ...devServerCommands,
  ...loginCommands,
  ...visionCommands,

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

Vision-Based Commands (AI Agent Visual Analysis):
  vision-screenshot [name]  Take screenshot for AI to analyze
  vision-click <x> <y>      Click at coordinates
  vision-double-click <x> <y>  Double-click at coordinates
  vision-type <text>        Type text at current cursor position
  vision-press-key <key>    Press keyboard key (Enter, Tab, Escape, etc.)
  vision-scroll <dir> [amt] Scroll page (dir: up/down/left/right, amt: pixels)
  vision-hover <x> <y>      Move mouse to coordinates
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

Examples:
  node test-helper.js navigate "http://localhost:3000" --screenshot home.png
  node test-helper.js click "#submit-btn" --wait 1000 --screenshot after-submit.png
  node test-helper.js fill "#email" "test@example.com"
  node test-helper.js list-elements

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
