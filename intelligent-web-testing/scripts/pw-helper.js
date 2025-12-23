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
 *   node pw-helper.js <command> [args...] [options]
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
 *   wait-for-login           - Wait for manual login completion (polls for login state)
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

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Configuration
const OUTPUT_DIR = './test-output';
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, 'screenshots');
const EXTENSIONS_DIR = path.join(OUTPUT_DIR, 'extensions');
const STATE_FILE = path.join(OUTPUT_DIR, '.browser-state.json');
const CDP_FILE = path.join(OUTPUT_DIR, '.browser-cdp.json'); // For persistent browser connection

// Wallet extension configuration
const RABBY_EXTENSION_ID = 'acmacodkjbdgmoleebolmdjonilkdbch';
const RABBY_WEBSTORE_URL = 'https://chromewebstore.google.com/detail/rabby-wallet/acmacodkjbdgmoleebolmdjonilkdbch';
const RABBY_PROFILE_URL = `chrome-extension://${RABBY_EXTENSION_ID}/desktop.html#/desktop/profile`;
const RABBY_POPUP_URL = `chrome-extension://${RABBY_EXTENSION_ID}/popup.html`;

// User data directory for persistent browser profile
const USER_DATA_DIR = path.join(OUTPUT_DIR, 'chrome-profile');

// Network configurations for Web3
const NETWORKS = {
  ethereum: { chainId: '0x1', name: 'Ethereum Mainnet' },
  polygon: { chainId: '0x89', name: 'Polygon' },
  arbitrum: { chainId: '0xa4b1', name: 'Arbitrum One' },
  optimism: { chainId: '0xa', name: 'Optimism' },
  base: { chainId: '0x2105', name: 'Base' },
  bsc: { chainId: '0x38', name: 'BNB Smart Chain' },
  avalanche: { chainId: '0xa86a', name: 'Avalanche C-Chain' },
  goerli: { chainId: '0x5', name: 'Goerli Testnet' },
  sepolia: { chainId: '0xaa36a7', name: 'Sepolia Testnet' },
};

// Ensure output directories exist
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
if (!fs.existsSync(EXTENSIONS_DIR)) fs.mkdirSync(EXTENSIONS_DIR, { recursive: true });

// Helper to download file
async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        https.get(response.headers.location, (res) => {
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }
    }).on('error', reject);
  });
}

// Helper to extract CRX extension
async function extractCrx(crxPath, destDir) {
  // CRX files are ZIP files with a header, we can use unzip
  try {
    execSync(`unzip -o "${crxPath}" -d "${destDir}" 2>/dev/null || true`);
    return true;
  } catch (e) {
    // Try alternative: remove CRX header and unzip
    const buffer = fs.readFileSync(crxPath);
    // Find ZIP signature (PK)
    let zipStart = 0;
    for (let i = 0; i < Math.min(buffer.length, 1000); i++) {
      if (buffer[i] === 0x50 && buffer[i + 1] === 0x4B) {
        zipStart = i;
        break;
      }
    }
    const zipBuffer = buffer.slice(zipStart);
    const zipPath = crxPath.replace('.crx', '.zip');
    fs.writeFileSync(zipPath, zipBuffer);
    execSync(`unzip -o "${zipPath}" -d "${destDir}"`);
    return true;
  }
}

// Parse command line arguments
function parseArgs(args) {
  const result = {
    command: args[0],
    args: [],
    options: {
      screenshot: null,
      wait: 0,
      mobile: false,
      headless: true,
      timeout: 10000,
      wallet: false,
      network: 'ethereum',
      keepOpen: false, // Keep browser open after command
    }
  };

  let i = 1;
  while (i < args.length) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const option = arg.slice(2);
      if (option === 'mobile' || option === 'headed' || option === 'wallet' || option === 'keep-open') {
        if (option === 'headed') {
          result.options.headless = false;
        } else if (option === 'wallet') {
          result.options.wallet = true;
        } else if (option === 'keep-open') {
          result.options.keepOpen = true;
        } else {
          result.options[option] = true;
        }
      } else if (option === 'headless') {
        result.options.headless = true;
      } else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        result.options[option] = args[++i];
      }
    } else {
      result.args.push(arg);
    }
    i++;
  }

  return result;
}

// Browser session management
let browser = null;
let context = null;
let page = null;
let walletExtensionPage = null;
let persistentContext = null; // For launchPersistentContext

// Try to connect to existing browser via CDP
async function tryConnectExistingBrowser() {
  if (fs.existsSync(CDP_FILE)) {
    try {
      const cdpInfo = JSON.parse(fs.readFileSync(CDP_FILE, 'utf-8'));
      // Check if browser is still alive
      const http = require('http');
      const checkAlive = () => new Promise((resolve) => {
        const req = http.get(`http://127.0.0.1:${cdpInfo.port}/json/version`, (res) => {
          resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(1000, () => { req.destroy(); resolve(false); });
      });

      if (await checkAlive()) {
        browser = await chromium.connectOverCDP(`http://127.0.0.1:${cdpInfo.port}`);
        const contexts = browser.contexts();
        if (contexts.length > 0) {
          context = contexts[0];
          const pages = context.pages();
          page = pages.length > 0 ? pages[0] : await context.newPage();
          return true;
        }
      }
    } catch (e) {
      // Connection failed, will launch new browser
    }
    // Clean up stale CDP file
    fs.unlinkSync(CDP_FILE);
  }
  return false;
}

// Save browser CDP info for reconnection
function saveCDPInfo(port) {
  fs.writeFileSync(CDP_FILE, JSON.stringify({ port, timestamp: Date.now() }));
}

// Clear CDP info
function clearCDPInfo() {
  if (fs.existsSync(CDP_FILE)) {
    fs.unlinkSync(CDP_FILE);
  }
}

async function startBrowser(options) {
  if (browser) return;

  // Try to connect to existing browser first
  if (await tryConnectExistingBrowser()) {
    console.log(JSON.stringify({ success: true, message: 'Connected to existing browser' }));
    return;
  }

  // Use persistent context for all operations to preserve login state and extensions
  const contextOptions = {
    viewport: options.mobile
      ? { width: 390, height: 844 }
      : { width: 1920, height: 1080 },
  };

  if (options.mobile) {
    contextOptions.isMobile = true;
    contextOptions.hasTouch = true;
    contextOptions.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15';
  }

  // Always use persistent context with Chrome for login persistence
  const launchOptions = {
    headless: options.headless,
    channel: 'chrome', // Use real Chrome for better compatibility
    args: [
      '--no-first-run',
      '--disable-blink-features=AutomationControlled',
    ],
    ...contextOptions,
  };

  // If wallet extension is needed, add extension loading
  if (options.wallet) {
    const rabbyPath = path.join(EXTENSIONS_DIR, 'rabby');
    if (!fs.existsSync(path.join(rabbyPath, 'manifest.json'))) {
      console.log(JSON.stringify({ status: 'info', message: 'Rabby wallet extension not found. Run wallet-setup first.' }));
    }
    launchOptions.headless = false;
    launchOptions.args.push(`--disable-extensions-except=${rabbyPath}`);
    launchOptions.args.push(`--load-extension=${rabbyPath}`);
  }

  // Launch persistent context (preserves cookies, localStorage, extensions)
  persistentContext = await chromium.launchPersistentContext(USER_DATA_DIR, launchOptions);
  context = persistentContext;

  const pages = context.pages();
  page = pages.length > 0 ? pages[0] : await context.newPage();

  // Capture console logs
  page.on('console', msg => {
    const logFile = path.join(OUTPUT_DIR, 'console-logs.txt');
    const logLine = `[${new Date().toISOString()}] [${msg.type()}] ${msg.text()}\n`;
    fs.appendFileSync(logFile, logLine);
  });

  // Capture errors
  page.on('pageerror', error => {
    const logFile = path.join(OUTPUT_DIR, 'console-logs.txt');
    const logLine = `[${new Date().toISOString()}] [ERROR] ${error.message}\n`;
    fs.appendFileSync(logFile, logLine);
  });

  console.log(JSON.stringify({ success: true, message: 'Browser started (persistent context)' }));
}

async function stopBrowser() {
  if (persistentContext) {
    await persistentContext.close();
    persistentContext = null;
  }
  if (browser) {
    await browser.close();
    browser = null;
  }
  context = null;
  page = null;
  clearCDPInfo();
  console.log(JSON.stringify({ success: true, message: 'Browser stopped' }));
}

async function ensureBrowser(options) {
  if (!context && !browser) {
    await startBrowser(options);
  }
}

// Take screenshot helper
async function takeScreenshot(name) {
  const filename = name || `screenshot-${Date.now()}.png`;
  const filepath = path.join(SCREENSHOTS_DIR, filename.endsWith('.png') ? filename : `${filename}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  return filepath;
}

// Commands
const commands = {
  async start(args, options) {
    await startBrowser(options);
  },

  async stop(args, options) {
    await stopBrowser();
  },

  // Explicit browser control commands
  async 'browser-open'(args, options) {
    // Open browser and keep it running for subsequent commands
    // Use --keep-open with other commands, or browser-close to close
    options.headless = false; // Always headed for manual interaction
    await startBrowser(options);
    console.log(JSON.stringify({
      success: true,
      message: 'Browser opened and will stay open.',
      hint: 'Use other commands with --keep-open to reuse this browser, or browser-close to close it.',
      userDataDir: USER_DATA_DIR
    }));
  },

  async 'browser-close'(args, options) {
    // Explicitly close the browser
    await stopBrowser();
    console.log(JSON.stringify({
      success: true,
      message: 'Browser closed.',
      note: 'Login state and extensions are preserved in the user data directory.'
    }));
  },

  async navigate(args, options) {
    await ensureBrowser(options);
    const url = args[0];
    if (!url) throw new Error('URL required');

    await page.goto(url, { waitUntil: 'networkidle', timeout: parseInt(options.timeout) });
    const title = await page.title();

    let screenshotPath = null;
    if (options.screenshot) {
      screenshotPath = await takeScreenshot(options.screenshot);
    }

    console.log(JSON.stringify({
      success: true,
      url: page.url(),
      title,
      screenshot: screenshotPath
    }));
  },

  async click(args, options) {
    await ensureBrowser(options);
    const selector = args[0];
    if (!selector) throw new Error('Selector required');

    await page.click(selector, { timeout: parseInt(options.timeout) });

    if (options.wait) await page.waitForTimeout(parseInt(options.wait));

    let screenshotPath = null;
    if (options.screenshot) {
      screenshotPath = await takeScreenshot(options.screenshot);
    }

    console.log(JSON.stringify({
      success: true,
      action: 'click',
      selector,
      screenshot: screenshotPath
    }));
  },

  async fill(args, options) {
    await ensureBrowser(options);
    const [selector, value] = args;
    if (!selector || value === undefined) throw new Error('Selector and value required');

    await page.fill(selector, value, { timeout: parseInt(options.timeout) });

    let screenshotPath = null;
    if (options.screenshot) {
      screenshotPath = await takeScreenshot(options.screenshot);
    }

    console.log(JSON.stringify({
      success: true,
      action: 'fill',
      selector,
      value: value.substring(0, 20) + (value.length > 20 ? '...' : ''),
      screenshot: screenshotPath
    }));
  },

  async select(args, options) {
    await ensureBrowser(options);
    const [selector, value] = args;
    if (!selector || !value) throw new Error('Selector and value required');

    await page.selectOption(selector, value, { timeout: parseInt(options.timeout) });

    let screenshotPath = null;
    if (options.screenshot) {
      screenshotPath = await takeScreenshot(options.screenshot);
    }

    console.log(JSON.stringify({
      success: true,
      action: 'select',
      selector,
      value,
      screenshot: screenshotPath
    }));
  },

  async check(args, options) {
    await ensureBrowser(options);
    const selector = args[0];
    if (!selector) throw new Error('Selector required');

    await page.check(selector, { timeout: parseInt(options.timeout) });

    let screenshotPath = null;
    if (options.screenshot) {
      screenshotPath = await takeScreenshot(options.screenshot);
    }

    console.log(JSON.stringify({
      success: true,
      action: 'check',
      selector,
      screenshot: screenshotPath
    }));
  },

  async uncheck(args, options) {
    await ensureBrowser(options);
    const selector = args[0];
    if (!selector) throw new Error('Selector required');

    await page.uncheck(selector, { timeout: parseInt(options.timeout) });

    let screenshotPath = null;
    if (options.screenshot) {
      screenshotPath = await takeScreenshot(options.screenshot);
    }

    console.log(JSON.stringify({
      success: true,
      action: 'uncheck',
      selector,
      screenshot: screenshotPath
    }));
  },

  async hover(args, options) {
    await ensureBrowser(options);
    const selector = args[0];
    if (!selector) throw new Error('Selector required');

    await page.hover(selector, { timeout: parseInt(options.timeout) });

    let screenshotPath = null;
    if (options.screenshot) {
      screenshotPath = await takeScreenshot(options.screenshot);
    }

    console.log(JSON.stringify({
      success: true,
      action: 'hover',
      selector,
      screenshot: screenshotPath
    }));
  },

  async press(args, options) {
    await ensureBrowser(options);
    const [selector, key] = args;
    if (!selector || !key) throw new Error('Selector and key required');

    await page.press(selector, key, { timeout: parseInt(options.timeout) });

    let screenshotPath = null;
    if (options.screenshot) {
      screenshotPath = await takeScreenshot(options.screenshot);
    }

    console.log(JSON.stringify({
      success: true,
      action: 'press',
      selector,
      key,
      screenshot: screenshotPath
    }));
  },

  async screenshot(args, options) {
    await ensureBrowser(options);
    const name = args[0] || `screenshot-${Date.now()}`;
    const filepath = await takeScreenshot(name);

    console.log(JSON.stringify({
      success: true,
      screenshot: filepath
    }));
  },

  async content(args, options) {
    await ensureBrowser(options);
    const content = await page.content();

    // Save to file for large content
    const contentFile = path.join(OUTPUT_DIR, 'page-content.html');
    fs.writeFileSync(contentFile, content);

    console.log(JSON.stringify({
      success: true,
      contentFile,
      contentLength: content.length,
      preview: content.substring(0, 500) + '...'
    }));
  },

  async text(args, options) {
    await ensureBrowser(options);
    const selector = args[0];
    if (!selector) throw new Error('Selector required');

    const text = await page.textContent(selector, { timeout: parseInt(options.timeout) });

    console.log(JSON.stringify({
      success: true,
      selector,
      text
    }));
  },

  async evaluate(args, options) {
    await ensureBrowser(options);
    const script = args.join(' ');
    if (!script) throw new Error('JavaScript code required');

    const result = await page.evaluate(script);

    console.log(JSON.stringify({
      success: true,
      result
    }));
  },

  async wait(args, options) {
    await ensureBrowser(options);
    const ms = parseInt(args[0]) || 1000;
    await page.waitForTimeout(ms);

    console.log(JSON.stringify({
      success: true,
      waited: ms
    }));
  },

  async 'wait-for'(args, options) {
    await ensureBrowser(options);
    const selector = args[0];
    if (!selector) throw new Error('Selector required');

    await page.waitForSelector(selector, { timeout: parseInt(options.timeout) });

    console.log(JSON.stringify({
      success: true,
      selector,
      found: true
    }));
  },

  async 'list-elements'(args, options) {
    await ensureBrowser(options);

    const elements = await page.evaluate(() => {
      const results = {
        buttons: [],
        links: [],
        inputs: [],
        selects: [],
        checkboxes: [],
        radios: [],
        textareas: [],
        forms: [],
      };

      // Helper to get selector
      const getSelector = (el) => {
        if (el.id) return `#${el.id}`;
        if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
        if (el.name) return `[name="${el.name}"]`;
        if (el.className && typeof el.className === 'string') {
          const classes = el.className.split(' ').filter(c => c.length > 0);
          if (classes.length > 0) return `.${classes[0]}`;
        }
        return null;
      };

      // Buttons
      document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]').forEach(el => {
        const selector = getSelector(el);
        if (selector) {
          results.buttons.push({
            selector,
            text: el.textContent?.trim().substring(0, 50) || el.value || '',
            disabled: el.disabled || false
          });
        }
      });

      // Links
      document.querySelectorAll('a[href]').forEach(el => {
        const selector = getSelector(el);
        results.links.push({
          selector: selector || `a[href="${el.getAttribute('href')}"]`,
          text: el.textContent?.trim().substring(0, 50) || '',
          href: el.getAttribute('href')
        });
      });

      // Inputs
      document.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]):not([type="hidden"])').forEach(el => {
        const selector = getSelector(el);
        if (selector) {
          results.inputs.push({
            selector,
            type: el.type || 'text',
            placeholder: el.placeholder || '',
            name: el.name || ''
          });
        }
      });

      // Selects
      document.querySelectorAll('select').forEach(el => {
        const selector = getSelector(el);
        if (selector) {
          results.selects.push({
            selector,
            name: el.name || '',
            options: Array.from(el.options).slice(0, 5).map(o => o.value)
          });
        }
      });

      // Checkboxes
      document.querySelectorAll('input[type="checkbox"]').forEach(el => {
        const selector = getSelector(el);
        if (selector) {
          results.checkboxes.push({
            selector,
            name: el.name || '',
            checked: el.checked
          });
        }
      });

      // Radios
      document.querySelectorAll('input[type="radio"]').forEach(el => {
        const selector = getSelector(el);
        if (selector) {
          results.radios.push({
            selector,
            name: el.name || '',
            value: el.value,
            checked: el.checked
          });
        }
      });

      // Textareas
      document.querySelectorAll('textarea').forEach(el => {
        const selector = getSelector(el);
        if (selector) {
          results.textareas.push({
            selector,
            name: el.name || '',
            placeholder: el.placeholder || ''
          });
        }
      });

      // Forms
      document.querySelectorAll('form').forEach((el, i) => {
        const selector = getSelector(el) || `form:nth-of-type(${i + 1})`;
        results.forms.push({
          selector,
          action: el.action || '',
          method: el.method || 'get'
        });
      });

      return results;
    });

    // Save to file
    const elementsFile = path.join(OUTPUT_DIR, 'elements.json');
    fs.writeFileSync(elementsFile, JSON.stringify(elements, null, 2));

    const summary = {
      buttons: elements.buttons.length,
      links: elements.links.length,
      inputs: elements.inputs.length,
      selects: elements.selects.length,
      checkboxes: elements.checkboxes.length,
      radios: elements.radios.length,
      textareas: elements.textareas.length,
      forms: elements.forms.length,
      total: Object.values(elements).reduce((sum, arr) => sum + arr.length, 0)
    };

    console.log(JSON.stringify({
      success: true,
      summary,
      elementsFile,
      elements
    }));
  },

  async 'run-test'(args, options) {
    const jsonFile = args[0];
    if (!jsonFile) throw new Error('JSON file required');

    const testConfig = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
    const results = [];

    await ensureBrowser(options);

    for (const step of testConfig.steps || []) {
      try {
        const { action, ...params } = step;

        if (action === 'navigate') {
          await page.goto(params.url, { waitUntil: 'networkidle' });
        } else if (action === 'click') {
          await page.click(params.selector);
        } else if (action === 'fill') {
          await page.fill(params.selector, params.value);
        } else if (action === 'select') {
          await page.selectOption(params.selector, params.value);
        } else if (action === 'check') {
          await page.check(params.selector);
        } else if (action === 'wait') {
          await page.waitForTimeout(params.ms || 1000);
        } else if (action === 'screenshot') {
          await takeScreenshot(params.name);
        }

        results.push({ step, success: true });

        // Take screenshot if requested
        if (step.screenshot) {
          await takeScreenshot(step.screenshot);
        }

      } catch (error) {
        results.push({ step, success: false, error: error.message });
      }
    }

    console.log(JSON.stringify({
      success: results.every(r => r.success),
      results
    }));
  },

  // ==================== Web3 Wallet Commands ====================

  async 'wallet-setup'(args, options) {
    // Open Chrome Web Store to install Rabby Wallet extension
    // This uses a persistent browser profile so the extension stays installed

    try {
      // Ensure user data directory exists
      if (!fs.existsSync(USER_DATA_DIR)) {
        fs.mkdirSync(USER_DATA_DIR, { recursive: true });
      }

      // Launch Chrome with persistent profile (must use headed mode)
      // Note: We use channel: 'chrome' to use the real Chrome browser
      const browserContext = await chromium.launchPersistentContext(USER_DATA_DIR, {
        headless: false,
        channel: 'chrome', // Use real Chrome instead of Chromium
        args: [
          '--no-first-run',
          '--disable-blink-features=AutomationControlled',
        ],
        viewport: { width: 1280, height: 800 },
      });

      const page = await browserContext.newPage();

      // Navigate to Chrome Web Store - Rabby Wallet page
      console.log(JSON.stringify({ status: 'info', message: 'Opening Chrome Web Store...' }));
      await page.goto(RABBY_WEBSTORE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Take screenshot
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'wallet-webstore.png'),
        fullPage: true
      });

      console.log(JSON.stringify({
        success: true,
        message: 'Chrome Web Store opened. Please click "Add to Chrome" to install Rabby Wallet.',
        instructions: [
          '1. Click "Add to Chrome" button on the page',
          '2. Confirm the installation in the popup',
          '3. Wait for installation to complete',
          '4. Run wallet-import to setup your wallet'
        ],
        webstoreUrl: RABBY_WEBSTORE_URL,
        screenshot: 'wallet-webstore.png',
        note: 'Browser will stay open. Close it manually after installation.'
      }));

      // Keep browser open for user to install
      // Don't close the browser - let user install manually

    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        error: `Failed to open Chrome Web Store: ${error.message}`,
        hint: 'Make sure Google Chrome is installed on your system'
      }));
    }
  },

  async 'wallet-import'(args, options) {
    // Open Rabby Wallet and import wallet using private key
    // SECURITY:
    // - Private key is read from WALLET_PRIVATE_KEY env var ONLY
    // - Wallet password is generated randomly and stored in WALLET_PASSWORD env var
    // - Neither are EVER logged, transmitted to APIs, or stored in files
    // - All sensitive data stays LOCAL ONLY

    const privateKey = process.env.WALLET_PRIVATE_KEY;

    if (!privateKey) {
      console.error(JSON.stringify({
        success: false,
        error: 'WALLET_PRIVATE_KEY environment variable is NOT set',
        fix: 'Set it in your terminal before running this command:',
        command: 'export WALLET_PRIVATE_KEY="your_private_key_here"'
      }));
      process.exit(1); // Exit with error
    }

    // Validate private key format (basic check) - don't log the actual key
    if (!/^(0x)?[a-fA-F0-9]{64}$/.test(privateKey)) {
      console.log(JSON.stringify({
        success: false,
        error: 'Invalid private key format. Must be 64 hex characters (with optional 0x prefix)'
      }));
      return;
    }

    // Generate or use existing wallet password
    // SECURITY: Password is stored in environment variable only, NEVER logged or transmitted
    let walletPassword = process.env.WALLET_PASSWORD;
    let passwordGenerated = false;

    if (!walletPassword) {
      // Generate a strong random password (16 chars: letters, numbers, special chars)
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
      const crypto = require('crypto');
      const randomBytes = crypto.randomBytes(16);
      walletPassword = '';
      for (let i = 0; i < 16; i++) {
        walletPassword += chars[randomBytes[i] % chars.length];
      }
      // Set the password in environment variable for this process and child processes
      process.env.WALLET_PASSWORD = walletPassword;
      passwordGenerated = true;
    }

    try {
      // Launch Chrome with the persistent profile where Rabby is installed
      const browserContext = await chromium.launchPersistentContext(USER_DATA_DIR, {
        headless: false,
        channel: 'chrome',
        args: [
          '--no-first-run',
          '--disable-blink-features=AutomationControlled',
        ],
        viewport: { width: 1280, height: 800 },
      });

      const extensionPage = await browserContext.newPage();

      // Navigate to Rabby Wallet profile/import page
      console.log(JSON.stringify({ status: 'info', message: 'Opening Rabby Wallet...' }));
      await extensionPage.goto(RABBY_PROFILE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await extensionPage.waitForTimeout(2000);

      // Take screenshot
      await extensionPage.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'wallet-import-1-start.png'),
        fullPage: true
      });

      // Try to find and click "Add Address" or "Import" button
      const addAddressSelectors = [
        'button:has-text("Add Address")',
        'button:has-text("Import")',
        'button:has-text("Add address")',
        'div:has-text("Add Address")',
        '[class*="add-address"]',
        '[class*="import"]',
      ];

      let addClicked = false;
      for (const selector of addAddressSelectors) {
        try {
          const btn = await extensionPage.$(selector);
          if (btn && await btn.isVisible()) {
            await btn.click();
            addClicked = true;
            await extensionPage.waitForTimeout(1000);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      await extensionPage.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'wallet-import-2-add-clicked.png'),
        fullPage: true
      });

      // Try to find and click "Import Private Key" option
      const privateKeySelectors = [
        'div:has-text("Private Key")',
        'button:has-text("Private Key")',
        'span:has-text("Private Key")',
        '[class*="private-key"]',
        'text=Private Key',
      ];

      let pkOptionClicked = false;
      await extensionPage.waitForTimeout(500);
      for (const selector of privateKeySelectors) {
        try {
          const el = await extensionPage.$(selector);
          if (el && await el.isVisible()) {
            await el.click();
            pkOptionClicked = true;
            await extensionPage.waitForTimeout(1000);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      await extensionPage.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'wallet-import-3-pk-selected.png'),
        fullPage: true
      });

      // Try to find private key input and fill it
      // SECURITY: privateKey comes from env var, is used only in browser, never logged
      const pkInputSelectors = [
        'textarea',
        'input[type="password"]',
        'input[placeholder*="private key"]',
        'input[placeholder*="Private Key"]',
        '[class*="private-key"] input',
        '[class*="private-key"] textarea',
      ];

      let pkFilled = false;
      for (const selector of pkInputSelectors) {
        try {
          const input = await extensionPage.$(selector);
          if (input && await input.isVisible()) {
            await input.fill(privateKey);
            pkFilled = true;
            await extensionPage.waitForTimeout(500);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      await extensionPage.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'wallet-import-4-pk-filled.png'),
        fullPage: true
      });

      // Try to click confirm/next button
      const confirmSelectors = [
        'button:has-text("Confirm")',
        'button:has-text("Next")',
        'button:has-text("Import")',
        'button:has-text("Continue")',
        'button[type="submit"]',
        '.ant-btn-primary',
      ];

      for (const selector of confirmSelectors) {
        try {
          const btn = await extensionPage.$(selector);
          if (btn && await btn.isVisible()) {
            await btn.click();
            await extensionPage.waitForTimeout(1500);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      await extensionPage.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'wallet-import-5-confirmed.png'),
        fullPage: true
      });

      // Try to find password inputs and fill them
      // SECURITY: walletPassword comes from env var, used only in browser, never logged
      const passwordInputs = await extensionPage.$$('input[type="password"]');
      if (passwordInputs.length >= 2) {
        // First password input and confirm password input
        await passwordInputs[0].fill(walletPassword);
        await passwordInputs[1].fill(walletPassword);

        await extensionPage.screenshot({
          path: path.join(SCREENSHOTS_DIR, 'wallet-import-6-password-filled.png'),
          fullPage: true
        });

        // Click final confirm button
        await extensionPage.waitForTimeout(500);
        for (const selector of confirmSelectors) {
          try {
            const btn = await extensionPage.$(selector);
            if (btn && await btn.isVisible()) {
              await btn.click();
              await extensionPage.waitForTimeout(2000);
              break;
            }
          } catch (e) {
            continue;
          }
        }
      } else if (passwordInputs.length === 1) {
        // Single password input (might be unlock screen)
        await passwordInputs[0].fill(walletPassword);
        await extensionPage.waitForTimeout(500);
        for (const selector of confirmSelectors) {
          try {
            const btn = await extensionPage.$(selector);
            if (btn && await btn.isVisible()) {
              await btn.click();
              await extensionPage.waitForTimeout(1500);
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }

      await extensionPage.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'wallet-import-7-complete.png'),
        fullPage: true
      });

      // Output result with password export command (password value NOT included in output)
      const result = {
        success: true,
        message: 'Wallet import process completed.',
        steps: {
          addAddressClicked: addClicked,
          privateKeyOptionClicked: pkOptionClicked,
          privateKeyFilled: pkFilled,
          passwordFieldsFound: passwordInputs.length,
        },
        screenshots: [
          'wallet-import-1-start.png',
          'wallet-import-2-add-clicked.png',
          'wallet-import-3-pk-selected.png',
          'wallet-import-4-pk-filled.png',
          'wallet-import-5-confirmed.png',
          'wallet-import-6-password-filled.png',
          'wallet-import-7-complete.png',
        ],
        security: 'Private key and password read from env vars - NEVER logged or transmitted',
      };

      if (passwordGenerated) {
        result.passwordGenerated = true;
        result.note = 'A random password was generated and set to WALLET_PASSWORD env var';
        result.exportCommand = 'Password is in process.env.WALLET_PASSWORD (not shown for security)';
      }

      console.log(JSON.stringify(result));

      // Keep browser open for verification

    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        error: `Failed to import wallet: ${error.message}`,
        hint: 'Make sure you ran wallet-setup first and installed the extension'
      }));
    }
  },

  async 'wallet-unlock'(args, options) {
    // Unlock Rabby Wallet using WALLET_PASSWORD env var
    // SECURITY: Password is read from environment variable only, NEVER logged or transmitted

    const walletPassword = process.env.WALLET_PASSWORD;

    if (!walletPassword) {
      console.log(JSON.stringify({
        success: false,
        error: 'WALLET_PASSWORD environment variable is NOT set',
        fix: 'Run wallet-import first to generate and set the password, or set it manually:',
        command: 'export WALLET_PASSWORD="your_wallet_password"'
      }));
      return;
    }

    try {
      // Launch Chrome with the persistent profile where Rabby is installed
      const browserContext = await chromium.launchPersistentContext(USER_DATA_DIR, {
        headless: false,
        channel: 'chrome',
        args: [
          '--no-first-run',
          '--disable-blink-features=AutomationControlled',
        ],
        viewport: { width: 1280, height: 800 },
      });

      const extensionPage = await browserContext.newPage();

      // Navigate to Rabby Wallet popup
      console.log(JSON.stringify({ status: 'info', message: 'Opening Rabby Wallet...' }));
      await extensionPage.goto(RABBY_POPUP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await extensionPage.waitForTimeout(2000);

      await extensionPage.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'wallet-unlock-1-start.png'),
        fullPage: true
      });

      // Find password input and fill it
      const passwordInput = await extensionPage.$('input[type="password"]');
      if (passwordInput && await passwordInput.isVisible()) {
        await passwordInput.fill(walletPassword);
        await extensionPage.waitForTimeout(500);

        await extensionPage.screenshot({
          path: path.join(SCREENSHOTS_DIR, 'wallet-unlock-2-password-filled.png'),
          fullPage: true
        });

        // Click unlock button
        const unlockSelectors = [
          'button:has-text("Unlock")',
          'button:has-text("解锁")',
          'button[type="submit"]',
          '.ant-btn-primary',
        ];

        for (const selector of unlockSelectors) {
          try {
            const btn = await extensionPage.$(selector);
            if (btn && await btn.isVisible()) {
              await btn.click();
              await extensionPage.waitForTimeout(2000);
              break;
            }
          } catch (e) {
            continue;
          }
        }

        await extensionPage.screenshot({
          path: path.join(SCREENSHOTS_DIR, 'wallet-unlock-3-complete.png'),
          fullPage: true
        });

        console.log(JSON.stringify({
          success: true,
          message: 'Wallet unlock attempted.',
          screenshots: [
            'wallet-unlock-1-start.png',
            'wallet-unlock-2-password-filled.png',
            'wallet-unlock-3-complete.png',
          ],
          security: 'Password read from WALLET_PASSWORD env var - NEVER logged or transmitted'
        }));
      } else {
        console.log(JSON.stringify({
          success: true,
          message: 'Wallet appears to be already unlocked (no password input found).',
          screenshot: 'wallet-unlock-1-start.png'
        }));
      }

    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        error: `Failed to unlock wallet: ${error.message}`
      }));
    }
  },

  async 'wallet-navigate'(args, options) {
    // Navigate to a DApp using the persistent Chrome profile with Rabby installed
    const url = args[0];
    if (!url) {
      console.log(JSON.stringify({
        success: false,
        error: 'URL required. Usage: wallet-navigate <url>'
      }));
      return;
    }

    try {
      // Launch Chrome with the persistent profile where Rabby is installed
      const browserContext = await chromium.launchPersistentContext(USER_DATA_DIR, {
        headless: false,
        channel: 'chrome',
        args: [
          '--no-first-run',
          '--disable-blink-features=AutomationControlled',
        ],
        viewport: { width: 1920, height: 1080 },
      });

      // Store context and page globally for subsequent commands
      context = browserContext;
      page = await browserContext.newPage();

      // Navigate to DApp
      console.log(JSON.stringify({ status: 'info', message: `Navigating to ${url}...` }));
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);

      // Take screenshot
      const screenshotPath = path.join(SCREENSHOTS_DIR, 'dapp-home.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });

      console.log(JSON.stringify({
        success: true,
        message: `Navigated to ${url} with Rabby Wallet available`,
        url: page.url(),
        screenshot: 'dapp-home.png',
        nextSteps: [
          'Use wallet-connect to connect wallet to DApp',
          'Use wallet-switch-network <network> to change network',
          'Use click/fill commands to interact with DApp'
        ]
      }));

    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        error: `Failed to navigate: ${error.message}`
      }));
    }
  },

  async 'wallet-connect'(args, options) {
    // Connect wallet to current DApp
    // Handles: Privy, RainbowKit, and other wallet connect modals
    //
    // Two modes:
    // 1. If WALLET_PRIVATE_KEY is set: Use Rabby Wallet (automated)
    // 2. If not set: Use Privy social/email login (manual - opens headed browser)
    //
    // Flow with Rabby: Click Connect -> Select Rabby -> Confirm -> Sign if needed
    // Flow with Privy: Click Connect -> Select social/email -> User logs in manually -> Continue

    if (!page) {
      console.log(JSON.stringify({
        success: false,
        error: 'No page open. Run wallet-navigate <url> first.'
      }));
      return;
    }

    const steps = [];
    const hasPrivateKey = !!process.env.WALLET_PRIVATE_KEY;

    try {
      // Step 1: Click the Connect Wallet button
      const connectSelectors = [
        'button:has-text("Connect Wallet")',
        'button:has-text("Connect wallet")',
        'button:has-text("Connect")',
        'button:has-text("Sign in")',
        'button:has-text("Sign In")',
        'button:has-text("Login")',
        'button:has-text("Log in")',
        'button:has-text("登录")',
        'button:has-text("连接钱包")',
        'button:has-text("Launch App")',
        '[data-testid="connect-wallet"]',
        '[data-testid="navbar-connect-wallet"]',
        '[data-testid="rk-connect-button"]', // RainbowKit
        '[data-testid="login-button"]',
        '.connect-wallet-btn',
        '.connect-wallet',
        '#connect-wallet',
        '[class*="connect"][class*="wallet"]',
        '[class*="Connect"][class*="Wallet"]',
      ];

      let connectClicked = false;

      for (const selector of connectSelectors) {
        try {
          const btn = await page.$(selector);
          if (btn) {
            const isVisible = await btn.isVisible();
            if (isVisible) {
              await btn.click();
              connectClicked = true;
              steps.push({ action: 'click_connect', selector, success: true });
              await page.waitForTimeout(1500);
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }

      if (!connectClicked) {
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'wallet-connect-fail.png'), fullPage: true });

        const buttons = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('button')).slice(0, 15).map(b => ({
            text: b.textContent?.trim().substring(0, 50),
            class: b.className?.substring(0, 50)
          }));
        });

        console.log(JSON.stringify({
          success: false,
          error: 'Could not find wallet connect button.',
          screenshot: 'wallet-connect-fail.png',
          availableButtons: buttons,
          hint: 'Try clicking manually with: click "button:has-text(\'Your Button Text\')"'
        }));
        return;
      }

      // Take screenshot after clicking connect
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'wallet-modal.png'), fullPage: true });
      await page.waitForTimeout(1000);

      // Detect if this is a Privy modal (has social login options)
      const loginOptions = await page.evaluate(() => {
        const body = document.body.innerHTML.toLowerCase();
        const hasPrivy = body.includes('privy') ||
                         document.querySelector('[data-privy]') !== null ||
                         document.querySelector('iframe[src*="privy"]') !== null;

        const hasSocialLogin = {
          google: body.includes('google') || !!document.querySelector('button:has-text("Google"), [aria-label*="Google"]'),
          github: body.includes('github') || !!document.querySelector('button:has-text("GitHub"), [aria-label*="GitHub"]'),
          twitter: body.includes('twitter') || body.includes('x.com') || !!document.querySelector('button:has-text("Twitter"), button:has-text("X"), [aria-label*="Twitter"]'),
          email: body.includes('email') || !!document.querySelector('input[type="email"], input[placeholder*="email"]'),
          discord: body.includes('discord') || !!document.querySelector('button:has-text("Discord"), [aria-label*="Discord"]'),
        };

        const hasRabby = body.includes('rabby');
        const hasMetamask = body.includes('metamask');
        const hasWalletConnect = body.includes('walletconnect');

        return {
          isPrivy: hasPrivy,
          socialLogin: hasSocialLogin,
          hasSocialOptions: Object.values(hasSocialLogin).some(v => v),
          hasWalletOptions: hasRabby || hasMetamask || hasWalletConnect,
          hasRabby,
        };
      });

      steps.push({ action: 'detect_login_options', options: loginOptions });

      // Decision: Use Rabby if private key is set and Rabby is available
      // Otherwise, use social/email login if available
      if (hasPrivateKey && loginOptions.hasRabby) {
        // ==================== RABBY WALLET FLOW ====================
        steps.push({ action: 'using_rabby_wallet', reason: 'WALLET_PRIVATE_KEY is set' });

        const rabbySelectors = [
          'button:has-text("Rabby")',
          'button:has-text("Rabby Wallet")',
          '[data-testid="rk-wallet-option-rabby"]',
          '[data-wallet-id="rabby"]',
          '[data-connector-id="rabby"]',
          'div:has-text("Rabby"):not(:has(div:has-text("Rabby")))',
          'li:has-text("Rabby")',
          '[class*="wallet"]:has-text("Rabby")',
        ];

        let rabbySelected = false;

        for (const selector of rabbySelectors) {
          try {
            const rabbyBtn = await page.$(selector);
            if (rabbyBtn && await rabbyBtn.isVisible()) {
              await rabbyBtn.click();
              rabbySelected = true;
              steps.push({ action: 'select_rabby', selector, success: true });
              await page.waitForTimeout(2000);
              break;
            }
          } catch (e) {
            continue;
          }
        }

        if (!rabbySelected) {
          // Fallback: search for Rabby text
          try {
            await page.click('text=Rabby');
            rabbySelected = true;
            steps.push({ action: 'select_rabby_fallback', success: true });
            await page.waitForTimeout(2000);
          } catch (e) {
            steps.push({ action: 'select_rabby_fallback', success: false, error: e.message });
          }
        }

        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'wallet-rabby-selected.png'), fullPage: true });

        // Handle Rabby popup
        await page.waitForTimeout(2000);
        const pages = context.pages();

        for (const p of pages) {
          const url = p.url();
          if (url.includes('chrome-extension://')) {
            try {
              await p.screenshot({ path: path.join(SCREENSHOTS_DIR, 'rabby-popup.png'), fullPage: true });

              const confirmSelectors = [
                'button:has-text("Connect")',
                'button:has-text("Confirm")',
                'button:has-text("Sign")',
                'button:has-text("确认")',
                'button:has-text("连接")',
                'button:has-text("签名")',
                'button:has-text("Approve")',
                '.primary-button',
              ];

              for (const selector of confirmSelectors) {
                try {
                  const btn = await p.$(selector);
                  if (btn && await btn.isVisible()) {
                    await btn.click();
                    steps.push({ action: 'click_rabby_confirm', selector, success: true });
                    await p.waitForTimeout(1500);
                    break;
                  }
                } catch (e) {
                  continue;
                }
              }
            } catch (e) {
              steps.push({ action: 'rabby_popup_error', error: e.message });
            }
          }
        }

        // Check for signature request
        await page.waitForTimeout(2000);
        const pagesAfterConnect = context.pages();

        for (const p of pagesAfterConnect) {
          const url = p.url();
          if (url.includes('chrome-extension://')) {
            try {
              const signSelectors = [
                'button:has-text("Sign")',
                'button:has-text("签名")',
                'button:has-text("Confirm")',
                'button:has-text("确认")',
                'button:has-text("Approve")',
              ];

              for (const selector of signSelectors) {
                try {
                  const btn = await p.$(selector);
                  if (btn && await btn.isVisible()) {
                    await p.screenshot({ path: path.join(SCREENSHOTS_DIR, 'rabby-sign.png'), fullPage: true });
                    await btn.click();
                    steps.push({ action: 'click_sign', selector, success: true });
                    await p.waitForTimeout(1500);
                    break;
                  }
                } catch (e) {
                  continue;
                }
              }
            } catch (e) {
              // Ignore
            }
          }
        }

      } else if (loginOptions.hasSocialOptions) {
        // ==================== PRIVY / SOCIAL LOGIN FLOW ====================
        // No private key or Rabby not available, use social/email login
        steps.push({
          action: 'using_social_login',
          reason: hasPrivateKey ? 'Rabby not available in modal' : 'WALLET_PRIVATE_KEY not set',
          availableOptions: loginOptions.socialLogin
        });

        // Find available social login buttons
        const socialSelectors = {
          google: [
            'button:has-text("Google")',
            'button:has-text("Continue with Google")',
            '[aria-label*="Google"]',
            '[data-testid="social-google"]',
            'img[alt*="Google"]',
          ],
          github: [
            'button:has-text("GitHub")',
            'button:has-text("Continue with GitHub")',
            '[aria-label*="GitHub"]',
            '[data-testid="social-github"]',
          ],
          twitter: [
            'button:has-text("Twitter")',
            'button:has-text("X")',
            'button:has-text("Continue with Twitter")',
            '[aria-label*="Twitter"]',
            '[data-testid="social-twitter"]',
          ],
          discord: [
            'button:has-text("Discord")',
            'button:has-text("Continue with Discord")',
            '[aria-label*="Discord"]',
            '[data-testid="social-discord"]',
          ],
          email: [
            'input[type="email"]',
            'input[placeholder*="email"]',
            'input[placeholder*="Email"]',
            'button:has-text("Email")',
            'button:has-text("Continue with email")',
          ],
        };

        // Find which social login options are actually available
        const availableSocial = [];
        for (const [provider, selectors] of Object.entries(socialSelectors)) {
          for (const selector of selectors) {
            try {
              const el = await page.$(selector);
              if (el && await el.isVisible()) {
                availableSocial.push({ provider, selector });
                break;
              }
            } catch (e) {
              continue;
            }
          }
        }

        if (availableSocial.length === 0) {
          // No social login AND no private key - exit with error
          await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'no-login-options.png'), fullPage: true });
          console.log(JSON.stringify({
            success: false,
            error: 'No login options available. WALLET_PRIVATE_KEY not set and no social/email login found.',
            screenshot: 'no-login-options.png',
            hint: 'Set WALLET_PRIVATE_KEY environment variable, or ensure the DApp supports social/email login',
            steps
          }));
          return;
        }

        steps.push({ action: 'found_social_options', options: availableSocial });

        // Show message to user that they need to complete login manually
        console.log(JSON.stringify({
          success: true,
          status: 'waiting_for_manual_login',
          message: '🔐 Manual login required - Browser window is open',
          instructions: [
            'A browser window is open with the login modal',
            'Please complete the login process manually:',
            `  Available options: ${availableSocial.map(s => s.provider).join(', ')}`,
            'After logging in, the test will continue automatically',
            '',
            'Waiting for login to complete...'
          ],
          availableLoginOptions: availableSocial.map(s => s.provider),
          screenshot: 'wallet-modal.png',
          steps
        }));

        // Wait for login to complete (check for wallet address or logged-in state)
        // Poll every 2 seconds for up to 5 minutes
        const maxWaitTime = 5 * 60 * 1000; // 5 minutes
        const pollInterval = 2000;
        let elapsed = 0;
        let loggedIn = false;

        while (elapsed < maxWaitTime && !loggedIn) {
          await page.waitForTimeout(pollInterval);
          elapsed += pollInterval;

          // Check if user is logged in
          loggedIn = await page.evaluate(() => {
            const body = document.body.textContent || '';
            const indicators = [
              // Wallet address pattern
              /0x[a-fA-F0-9]{4}[.…][a-fA-F0-9]{4}/,
              // Common logged-in indicators
              document.querySelector('[data-testid="account-button"]'),
              document.querySelector('[data-testid="user-menu"]'),
              document.querySelector('button:has-text("Disconnect")'),
              document.querySelector('[class*="avatar"]'),
              document.querySelector('[class*="profile"]'),
            ];

            // Check if modal is closed (login completed)
            const modalGone = !document.querySelector('[role="dialog"]') &&
                            !document.querySelector('.modal') &&
                            !document.querySelector('[class*="Modal"]');

            return indicators.some(i => {
              if (i instanceof RegExp) return i.test(body);
              return !!i;
            }) || (modalGone && elapsed > 10000);
          });

          // Take periodic screenshots
          if (elapsed % 10000 === 0) {
            await page.screenshot({
              path: path.join(SCREENSHOTS_DIR, `login-progress-${elapsed/1000}s.png`),
              fullPage: true
            });
          }
        }

        if (loggedIn) {
          steps.push({ action: 'social_login_completed', elapsed: `${elapsed/1000}s` });
        } else {
          steps.push({ action: 'social_login_timeout', elapsed: `${elapsed/1000}s` });
          console.log(JSON.stringify({
            success: false,
            error: 'Login timeout - user did not complete login within 5 minutes',
            steps
          }));
          return;
        }

      } else if (hasPrivateKey) {
        // Has private key but no wallet options in modal
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'no-wallet-options.png'), fullPage: true });
        console.log(JSON.stringify({
          success: false,
          error: 'WALLET_PRIVATE_KEY is set but no wallet connection options (Rabby) found in modal.',
          screenshot: 'no-wallet-options.png',
          hint: 'Make sure Rabby Wallet extension is installed and the DApp supports it',
          steps
        }));
        return;

      } else {
        // No private key AND no social login options
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'no-login-options.png'), fullPage: true });
        console.log(JSON.stringify({
          success: false,
          error: 'No login method available. WALLET_PRIVATE_KEY not set and no social/email login options found.',
          screenshot: 'no-login-options.png',
          detectedOptions: loginOptions,
          hint: 'Set WALLET_PRIVATE_KEY for wallet login, or ensure DApp supports Google/GitHub/Twitter/Email login',
          steps
        }));
        return;
      }

      // Final verification
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'wallet-connected.png'), fullPage: true });

      const connectionStatus = await page.evaluate(() => {
        const body = document.body.textContent || '';
        const addressMatch = body.match(/0x[a-fA-F0-9]{4}[.…][a-fA-F0-9]{4}/);
        return {
          hasAddress: !!addressMatch,
          address: addressMatch ? addressMatch[0] : null,
          hasDisconnect: !!document.querySelector('button:has-text("Disconnect")'),
          modalClosed: !document.querySelector('[role="dialog"]'),
        };
      });

      steps.push({ action: 'verify_connection', status: connectionStatus });

      console.log(JSON.stringify({
        success: true,
        message: connectionStatus.hasAddress ?
          `Wallet connected successfully! Address: ${connectionStatus.address}` :
          'Login flow completed (verify connection manually)',
        connected: connectionStatus.hasAddress || connectionStatus.hasDisconnect,
        connectionStatus,
        steps,
        screenshots: [
          'wallet-modal.png',
          'wallet-connected.png'
        ]
      }));

    } catch (error) {
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'wallet-connect-error.png'), fullPage: true });
      console.log(JSON.stringify({
        success: false,
        error: `Failed to connect wallet: ${error.message}`,
        steps,
        screenshot: 'wallet-connect-error.png'
      }));
    }
  },

  async 'wallet-switch-network'(args, options) {
    const networkName = args[0]?.toLowerCase() || options.network;
    const network = NETWORKS[networkName];

    if (!network) {
      console.log(JSON.stringify({
        success: false,
        error: `Unknown network: ${networkName}. Available: ${Object.keys(NETWORKS).join(', ')}`
      }));
      return;
    }

    await ensureBrowser(options);

    try {
      // Try to switch network using ethereum provider
      const result = await page.evaluate(async (chainId) => {
        if (typeof window.ethereum !== 'undefined') {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId }],
            });
            return { success: true };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
        return { success: false, error: 'No ethereum provider found' };
      }, network.chainId);

      if (result.success) {
        console.log(JSON.stringify({
          success: true,
          message: `Switched to ${network.name}`,
          chainId: network.chainId
        }));
      } else {
        console.log(JSON.stringify({
          success: false,
          error: result.error
        }));
      }
    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        error: `Failed to switch network: ${error.message}`
      }));
    }
  },

  async 'wallet-get-address'(args, options) {
    await ensureBrowser(options);

    try {
      const result = await page.evaluate(async () => {
        if (typeof window.ethereum !== 'undefined') {
          try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
              return { success: true, address: accounts[0] };
            }
            return { success: false, error: 'No accounts connected' };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
        return { success: false, error: 'No ethereum provider found' };
      });

      console.log(JSON.stringify(result));
    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        error: `Failed to get address: ${error.message}`
      }));
    }
  },

  // ==================== End Web3 Commands ====================

  // ==================== Login Detection Commands ====================

  async 'detect-login-required'(args, options) {
    // Detect if login/authentication is required
    // Checks for login modals, login buttons, and authentication prompts
    await ensureBrowser(options);

    try {
      const detection = await page.evaluate(() => {
        const body = document.body;
        const bodyText = body.textContent?.toLowerCase() || '';
        const bodyHtml = body.innerHTML?.toLowerCase() || '';

        // Check for login modal indicators
        const modalSelectors = [
          '[role="dialog"]',
          '.modal',
          '[class*="Modal"]',
          '[class*="modal"]',
          '[class*="popup"]',
          '[class*="Popup"]',
          '[class*="overlay"]',
          '[class*="Overlay"]',
          '[data-testid*="modal"]',
          '[data-testid*="dialog"]',
        ];

        let hasModal = false;
        let modalContent = '';
        for (const selector of modalSelectors) {
          const modal = document.querySelector(selector);
          if (modal && modal.offsetParent !== null) {
            hasModal = true;
            modalContent = modal.textContent?.toLowerCase() || '';
            break;
          }
        }

        // Check for login-related keywords in modal or page
        const loginKeywords = [
          'sign in', 'signin', 'log in', 'login', 'connect wallet',
          'connect your wallet', 'authentication', 'authenticate',
          'create account', 'sign up', 'signup', 'register',
          'enter your email', 'enter email', 'email address',
          'password', 'continue with google', 'continue with github',
          'continue with twitter', 'continue with email',
          '登录', '注册', '连接钱包', '输入邮箱',
        ];

        const textToCheck = hasModal ? modalContent : bodyText;
        const hasLoginKeywords = loginKeywords.some(keyword => textToCheck.includes(keyword));

        // Check for login buttons
        const loginButtonSelectors = [
          'button:has-text("Sign In")',
          'button:has-text("Sign in")',
          'button:has-text("Log In")',
          'button:has-text("Log in")',
          'button:has-text("Login")',
          'button:has-text("Connect Wallet")',
          'button:has-text("Connect wallet")',
          'button:has-text("Connect")',
          '[data-testid="login-button"]',
          '[data-testid="signin-button"]',
          '[data-testid="connect-wallet"]',
        ];

        // Check for social login options
        const socialLoginSelectors = [
          'button:has-text("Google")',
          'button:has-text("GitHub")',
          'button:has-text("Twitter")',
          'button:has-text("Discord")',
          'button:has-text("Email")',
          '[aria-label*="Google"]',
          '[aria-label*="GitHub"]',
        ];

        // Check for wallet options
        const walletSelectors = [
          'button:has-text("Rabby")',
          'button:has-text("MetaMask")',
          'button:has-text("WalletConnect")',
          'button:has-text("Coinbase")',
          '[data-wallet-id]',
          '[data-connector-id]',
        ];

        // Check for email input
        const hasEmailInput = !!document.querySelector('input[type="email"], input[placeholder*="email"], input[placeholder*="Email"]');

        // Check for password input
        const hasPasswordInput = !!document.querySelector('input[type="password"]');

        // Check if user is already logged in
        // Helper to find button by text content
        const findButtonByText = (texts) => {
          const buttons = document.querySelectorAll('button');
          for (const btn of buttons) {
            const btnText = btn.textContent?.toLowerCase() || '';
            for (const text of texts) {
              if (btnText.includes(text.toLowerCase())) return btn;
            }
          }
          return null;
        };

        const loggedInIndicators = [
          /0x[a-fA-F0-9]{4}[.…][a-fA-F0-9]{4}/.test(bodyText), // Wallet address pattern
          !!document.querySelector('[data-testid="account-button"]'),
          !!document.querySelector('[data-testid="user-menu"]'),
          !!document.querySelector('[data-testid="profile-button"]'),
          !!findButtonByText(['disconnect', 'logout', 'log out', 'sign out']),
          !!document.querySelector('[class*="avatar"]'),
          !!document.querySelector('[class*="Avatar"]'),
        ];

        const isLoggedIn = loggedInIndicators.some(v => v === true);

        // Determine login type
        let loginType = null;
        if (hasModal && hasLoginKeywords) {
          if (bodyHtml.includes('wallet') || bodyHtml.includes('0x')) {
            loginType = 'wallet';
          } else if (hasEmailInput || hasPasswordInput) {
            loginType = 'email';
          } else {
            loginType = 'social';
          }
        }

        // Get available login options
        const availableOptions = [];
        if (bodyHtml.includes('google')) availableOptions.push('google');
        if (bodyHtml.includes('github')) availableOptions.push('github');
        if (bodyHtml.includes('twitter') || bodyHtml.includes('x.com')) availableOptions.push('twitter');
        if (bodyHtml.includes('discord')) availableOptions.push('discord');
        if (hasEmailInput) availableOptions.push('email');
        if (bodyHtml.includes('rabby')) availableOptions.push('rabby');
        if (bodyHtml.includes('metamask')) availableOptions.push('metamask');
        if (bodyHtml.includes('walletconnect')) availableOptions.push('walletconnect');

        return {
          loginRequired: hasModal && hasLoginKeywords && !isLoggedIn,
          hasModal,
          hasLoginKeywords,
          isLoggedIn,
          loginType,
          availableOptions,
          hasEmailInput,
          hasPasswordInput,
          modalContent: modalContent.substring(0, 200),
        };
      });

      // Take screenshot
      const screenshotPath = path.join(SCREENSHOTS_DIR, 'login-detection.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });

      console.log(JSON.stringify({
        success: true,
        ...detection,
        screenshot: 'login-detection.png',
        recommendation: detection.loginRequired
          ? (detection.loginType === 'wallet'
            ? 'Use wallet-connect for automated login or wait-for-login for manual'
            : 'Use wait-for-login for manual login completion')
          : (detection.isLoggedIn ? 'Already logged in, proceed with testing' : 'No login required'),
      }));

    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        error: `Failed to detect login: ${error.message}`
      }));
    }
  },

  async 'wait-for-login'(args, options) {
    // Wait for manual login completion
    // Opens headed browser and polls for login state change
    // Handles OAuth redirects gracefully by catching page navigation errors
    await ensureBrowser(options);

    const maxWaitTime = parseInt(options.timeout) || 300000; // 5 minutes default
    const pollInterval = 2000;
    let elapsed = 0;
    let lastUrl = '';

    try {
      // Take initial screenshot
      try {
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'wait-login-start.png'), fullPage: true });
      } catch (e) {
        // Page might be navigating
      }

      console.log(JSON.stringify({
        status: 'waiting',
        message: '🔐 Waiting for manual login...',
        instructions: [
          'Please complete login in the browser window',
          'OAuth redirects are handled automatically',
          'The test will continue after login is detected',
          `Timeout: ${maxWaitTime / 1000} seconds`
        ],
        screenshot: 'wait-login-start.png'
      }));

      // Poll for login completion
      while (elapsed < maxWaitTime) {
        await page.waitForTimeout(pollInterval);
        elapsed += pollInterval;

        // Track URL changes for OAuth redirects
        let currentUrl = '';
        try {
          currentUrl = page.url();
          if (currentUrl !== lastUrl) {
            console.log(JSON.stringify({
              status: 'url_changed',
              from: lastUrl.substring(0, 50),
              to: currentUrl.substring(0, 50)
            }));
            lastUrl = currentUrl;
          }
        } catch (e) {
          // Page navigating, continue polling
          continue;
        }

        // Safely evaluate login state - handle navigation errors
        let loginState = null;
        try {
          loginState = await page.evaluate(() => {
            // Guard against null body during navigation
            if (!document.body) {
              return { navigating: true };
            }

            const body = document.body.textContent || '';

            // Helper to find button by text content
            const findButtonByText = (texts) => {
              const buttons = document.querySelectorAll('button');
              for (const btn of buttons) {
                const btnText = btn.textContent?.toLowerCase() || '';
                for (const text of texts) {
                  if (btnText.includes(text.toLowerCase())) return btn;
                }
              }
              return null;
            };

            // Check for logged-in indicators
            const loggedInIndicators = [
              /0x[a-fA-F0-9]{4}[.…][a-fA-F0-9]{4}/.test(body), // Wallet address
              !!document.querySelector('[data-testid="account-button"]'),
              !!document.querySelector('[data-testid="user-menu"]'),
              !!document.querySelector('[data-testid="profile-button"]'),
              !!findButtonByText(['disconnect', 'logout', 'log out', 'sign out']),
              !!document.querySelector('[class*="avatar"]'),
              !!document.querySelector('img[alt*="avatar"]'),
              !!document.querySelector('img[alt*="profile"]'),
            ];

            // Check if modal is closed
            const modalGone = !document.querySelector('[role="dialog"]') &&
                            !document.querySelector('.modal:not(.hidden)') &&
                            !document.querySelector('[class*="Modal"]:not([class*="hidden"])');

            // Check for login form absence
            const noLoginForm = !document.querySelector('input[type="password"]');

            // Get visible user info
            const addressMatch = body.match(/0x[a-fA-F0-9]{4,}[.…][a-fA-F0-9]{4,}/);

            return {
              navigating: false,
              isLoggedIn: loggedInIndicators.some(v => v === true),
              modalGone,
              noLoginForm,
              userAddress: addressMatch ? addressMatch[0] : null,
              hasAvatar: !!document.querySelector('[class*="avatar"], img[alt*="avatar"], img[alt*="profile"]'),
            };
          });
        } catch (e) {
          // Page is navigating (OAuth redirect), continue polling
          console.log(JSON.stringify({
            status: 'page_navigating',
            elapsed: `${elapsed / 1000}s`,
            message: 'OAuth redirect in progress...'
          }));
          continue;
        }

        // Skip if page is navigating
        if (!loginState || loginState.navigating) {
          continue;
        }

        // Take periodic screenshots (safely)
        if (elapsed % 10000 === 0) {
          try {
            await page.screenshot({
              path: path.join(SCREENSHOTS_DIR, `wait-login-${elapsed/1000}s.png`),
              fullPage: true
            });
          } catch (e) {
            // Page navigating, skip screenshot
          }
        }

        // Check if logged in
        if (loginState.isLoggedIn || (loginState.modalGone && loginState.noLoginForm && elapsed > 10000)) {
          // Confirmed logged in - take final screenshot
          try {
            await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'wait-login-success.png'), fullPage: true });
          } catch (e) {
            // Ignore screenshot errors
          }

          console.log(JSON.stringify({
            success: true,
            status: 'logged_in',
            message: '✅ Login completed successfully!',
            elapsed: `${elapsed / 1000}s`,
            userAddress: loginState.userAddress,
            hasAvatar: loginState.hasAvatar,
            screenshot: 'wait-login-success.png',
            finalUrl: currentUrl
          }));
          return;
        }

        // Log progress every 30 seconds
        if (elapsed % 30000 === 0) {
          console.log(JSON.stringify({
            status: 'still_waiting',
            elapsed: `${elapsed / 1000}s`,
            remaining: `${(maxWaitTime - elapsed) / 1000}s`,
            currentUrl: currentUrl.substring(0, 50)
          }));
        }
      }

      // Timeout reached
      try {
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'wait-login-timeout.png'), fullPage: true });
      } catch (e) {
        // Ignore screenshot errors
      }

      console.log(JSON.stringify({
        success: false,
        status: 'timeout',
        message: `Login not completed within ${maxWaitTime / 1000} seconds`,
        screenshot: 'wait-login-timeout.png'
      }));

    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        error: `Wait for login failed: ${error.message}`
      }));
    }
  },

  // ==================== End Login Detection Commands ====================

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
  wait-for-login            Wait for manual login completion (polls for login state)

Browser Lifecycle Commands:
  browser-open              Open browser and keep it running
  browser-close             Close the browser explicitly

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
  node pw-helper.js navigate "http://localhost:3000" --screenshot home.png
  node pw-helper.js click "#submit-btn" --wait 1000 --screenshot after-submit.png
  node pw-helper.js fill "#email" "test@example.com"
  node pw-helper.js list-elements

Web3 DApp Testing:
  # 1. Install Rabby Wallet (one-time, opens Chrome Web Store)
  node pw-helper.js wallet-setup
  # Click "Add to Chrome" to install, then close browser

  # 2. Set private key in terminal (REQUIRED, no .env support!)
  export WALLET_PRIVATE_KEY="your_private_key_here"

  # 3. Import wallet into Rabby (one-time)
  node pw-helper.js wallet-import
  # Follow prompts to import your private key

  # 4. Navigate to DApp with Rabby available
  node pw-helper.js wallet-navigate <url>

  # 5. Connect wallet to DApp
  node pw-helper.js wallet-connect

  # 6. Switch network if needed
  node pw-helper.js wallet-switch-network polygon

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
  } finally {
    // Only close browser if --keep-open is NOT set and command is not 'start' or 'browser-open'
    const keepOpenCommands = ['start', 'browser-open', 'wait-for-login'];
    if (!parsed.options.keepOpen && !keepOpenCommands.includes(parsed.command)) {
      if (persistentContext) {
        await persistentContext.close();
        persistentContext = null;
      }
      if (browser) {
        await browser.close();
        browser = null;
      }
    }
  }
}

main().catch(error => {
  console.log(JSON.stringify({
    success: false,
    error: error.message
  }));
  process.exit(1);
});
