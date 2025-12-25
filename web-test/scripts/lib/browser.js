/**
 * Browser management functions
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const {
  OUTPUT_DIR,
  SCREENSHOTS_DIR,
  EXTENSIONS_DIR,
  CDP_FILE,
  USER_DATA_DIR,
  CDP_PORT,
  SCREENSHOT_FORMAT,
  SCREENSHOT_QUALITY,
} = require('./config');

// Browser session state
let browser = null;
let context = null;
let page = null;
let walletExtensionPage = null;
let persistentContext = null;
let metamaskExtensionId = null;

// Helper functions to get extension URLs
function getMetaMaskHomeUrl() {
  if (!metamaskExtensionId) throw new Error('MetaMask extension not loaded. Run wallet-setup first with --wallet flag.');
  return `chrome-extension://${metamaskExtensionId}/home.html`;
}

function getMetaMaskPopupUrl() {
  if (!metamaskExtensionId) throw new Error('MetaMask extension not loaded. Run wallet-setup first with --wallet flag.');
  return `chrome-extension://${metamaskExtensionId}/popup.html`;
}

function getMetaMaskOnboardingUrl() {
  if (!metamaskExtensionId) throw new Error('MetaMask extension not loaded. Run wallet-setup first with --wallet flag.');
  return `chrome-extension://${metamaskExtensionId}/home.html#onboarding/welcome`;
}

// Try to connect to existing browser via CDP
async function tryConnectExistingBrowser() {
  const checkAlive = () => new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${CDP_PORT}/json/version`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
  });

  try {
    if (await checkAlive()) {
      browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
      const contexts = browser.contexts();
      if (contexts.length > 0) {
        context = contexts[0];
        const pages = context.pages();

        // Find a non-extension page first, or use the first page
        let selectedPage = null;
        for (const p of pages) {
          const url = p.url();
          if (url.startsWith('chrome-extension://')) {
            // Detect extension ID
            if (!metamaskExtensionId) {
              metamaskExtensionId = url.split('/')[2];
            }
          } else if (!selectedPage && url !== 'about:blank') {
            // Prefer non-extension, non-blank pages
            selectedPage = p;
          }
        }

        // If no non-extension page found, use first page or create new
        page = selectedPage || (pages.length > 0 ? pages[0] : await context.newPage());

        // If not found from pages, extension ID will be detected later
        if (!metamaskExtensionId) {
          // MetaMask extension ID is dynamic, will be detected from service worker
        }

        console.log(JSON.stringify({
          status: 'info',
          message: 'Connected to existing browser via CDP',
          extensionId: metamaskExtensionId,
          currentPage: page.url()
        }));
        return true;
      }
    }
  } catch (e) {
    // Connection failed, will launch new browser
  }

  // Clean up stale CDP file if exists
  if (fs.existsSync(CDP_FILE)) {
    fs.unlinkSync(CDP_FILE);
  }
  return false;
}

// Set the active page (used when navigating to a new page)
function setPage(newPage) {
  page = newPage;
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
    return;
  }

  // Use persistent context for all operations
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

  const useWalletMode = options.wallet;
  const useIndependentChrome = !options.headless && !useWalletMode;

  if (useWalletMode) {
    // Wallet mode: Use Playwright's Chromium with extension loading
    const metamaskPath = path.join(EXTENSIONS_DIR, 'metamask');

    if (!fs.existsSync(path.join(metamaskPath, 'manifest.json'))) {
      console.log(JSON.stringify({
        success: false,
        error: 'MetaMask wallet extension not found. Run wallet-setup first.',
        hint: 'node wallet-setup-helper.js wallet-setup'
      }));
      process.exit(1);
    }

    const launchOptions = {
      headless: false, // Extensions require headed mode
      channel: 'chromium',
      args: [
        '--no-first-run',
        '--disable-blink-features=AutomationControlled',
        `--disable-extensions-except=${path.resolve(metamaskPath)}`,
        `--load-extension=${path.resolve(metamaskPath)}`,
        `--remote-debugging-port=${CDP_PORT}`,
        // Critical for extension popups
        '--disable-popup-blocking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-component-update',
        // Prevent extension context from being garbage collected
        '--disable-features=ExtensionsToolbarMenu',
        // Allow popups to stay open
        '--auto-open-devtools-for-tabs=false',
      ],
      ignoreDefaultArgs: ['--disable-extensions', '--enable-automation'],
      ...contextOptions,
    };

    console.log(JSON.stringify({ status: 'info', message: 'Starting Chromium with MetaMask wallet extension...' }));

    persistentContext = await chromium.launchPersistentContext(USER_DATA_DIR, launchOptions);
    context = persistentContext;

    const pages = context.pages();
    page = pages.length > 0 ? pages[0] : await context.newPage();

    // Wait for extension service worker and extract extension ID
    try {
      let serviceWorker = persistentContext.serviceWorkers()[0];
      if (!serviceWorker) {
        serviceWorker = await persistentContext.waitForEvent('serviceworker', { timeout: 10000 });
      }
      const swUrl = serviceWorker.url();
      metamaskExtensionId = swUrl.split('/')[2];
      console.log(JSON.stringify({ status: 'info', message: 'MetaMask wallet extension loaded successfully', extensionId: metamaskExtensionId }));
    } catch (e) {
      console.log(JSON.stringify({ status: 'warning', message: 'Extension service worker not detected, trying fallback detection...' }));

      try {
        const allPages = context.pages();
        for (const p of allPages) {
          const url = p.url();
          if (url.startsWith('chrome-extension://')) {
            metamaskExtensionId = url.split('/')[2];
            console.log(JSON.stringify({ status: 'info', message: 'Extension ID detected from page', extensionId: metamaskExtensionId }));
            break;
          }
        }

        if (!metamaskExtensionId) {
          const testPage = await context.newPage();
          await testPage.goto('chrome://extensions/', { timeout: 5000 }).catch(() => {});
          await testPage.waitForTimeout(1000);

          const extensionIds = await testPage.evaluate(() => {
            const items = document.querySelectorAll('extensions-item');
            return Array.from(items).map(item => item.id).filter(id => id);
          }).catch(() => []);

          if (extensionIds.length > 0) {
            metamaskExtensionId = extensionIds[0];
            console.log(JSON.stringify({ status: 'info', message: 'Extension ID detected from chrome://extensions', extensionId: metamaskExtensionId }));
          }

          await testPage.close().catch(() => {});
        }

        if (!metamaskExtensionId) {
          console.log(JSON.stringify({ status: 'warning', message: 'MetaMask extension ID could not be detected' }));
        }
      } catch (fallbackError) {
        console.log(JSON.stringify({ status: 'warning', message: 'MetaMask extension ID detection failed' }));
      }
    }

  } else if (useIndependentChrome) {
    // Launch Chrome independently with CDP port
    const chromeArgs = [
      '--no-first-run',
      '--disable-blink-features=AutomationControlled',
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${path.resolve(USER_DATA_DIR)}`,
    ];

    const { spawn } = require('child_process');
    const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

    const chromeProcess = spawn(chromePath, chromeArgs, {
      detached: true,
      stdio: 'ignore'
    });
    chromeProcess.unref();

    // Wait for CDP to be available
    let connected = false;
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      try {
        const alive = await new Promise((resolve) => {
          const req = http.get(`http://127.0.0.1:${CDP_PORT}/json/version`, (res) => {
            resolve(res.statusCode === 200);
          });
          req.on('error', () => resolve(false));
          req.setTimeout(1000, () => { req.destroy(); resolve(false); });
        });
        if (alive) {
          connected = true;
          break;
        }
      } catch (e) {}
    }

    if (!connected) {
      throw new Error('Failed to connect to Chrome CDP after 15 seconds');
    }

    browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
    const contexts = browser.contexts();
    context = contexts.length > 0 ? contexts[0] : await browser.newContext(contextOptions);
    const pages = context.pages();
    page = pages.length > 0 ? pages[0] : await context.newPage();

    saveCDPInfo(CDP_PORT);
  } else {
    // Headless mode without wallet
    const launchOptions = {
      headless: options.headless,
      args: [
        '--no-first-run',
        '--disable-blink-features=AutomationControlled',
      ],
      ...contextOptions,
    };

    persistentContext = await chromium.launchPersistentContext(USER_DATA_DIR, launchOptions);
    context = persistentContext;

    const pages = context.pages();
    page = pages.length > 0 ? pages[0] : await context.newPage();
  }

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
  const isJpeg = SCREENSHOT_FORMAT === 'jpeg';
  const ext = isJpeg ? '.jpg' : '.png';

  // Extract just the filename if a full path was passed (prevents duplicate paths like test-output/screenshots/test-output/screenshots/)
  let cleanName = name || `screenshot-${Date.now()}`;
  if (cleanName.includes('/') || cleanName.includes('\\')) {
    cleanName = path.basename(cleanName);
  }

  const baseName = cleanName.replace(/\.(png|jpg|jpeg)$/i, '');
  const filename = baseName + ext;
  const filepath = path.join(SCREENSHOTS_DIR, filename);

  const screenshotOptions = {
    path: filepath,
    fullPage: true,
    type: isJpeg ? 'jpeg' : 'png'
  };

  if (isJpeg) {
    screenshotOptions.quality = SCREENSHOT_QUALITY;
  }

  await page.screenshot(screenshotOptions);
  return filepath;
}

// Getters for browser state
function getBrowser() { return browser; }
function getContext() { return context; }
function getPage() { return page; }
function getPersistentContext() { return persistentContext; }
function getMetaMaskExtensionId() { return metamaskExtensionId; }
function setMetaMaskExtensionId(id) { metamaskExtensionId = id; }

module.exports = {
  startBrowser,
  stopBrowser,
  ensureBrowser,
  takeScreenshot,
  tryConnectExistingBrowser,
  saveCDPInfo,
  clearCDPInfo,
  getMetaMaskHomeUrl,
  getMetaMaskPopupUrl,
  getMetaMaskOnboardingUrl,
  getBrowser,
  getContext,
  getPage,
  setPage,
  getPersistentContext,
  getMetaMaskExtensionId,
  setMetaMaskExtensionId,
};
