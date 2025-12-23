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
let rabbyExtensionId = null;

// Helper functions to get extension URLs
function getRabbyProfileUrl() {
  if (!rabbyExtensionId) throw new Error('Rabby extension not loaded. Run wallet-import or wallet-unlock first with --wallet flag.');
  return `chrome-extension://${rabbyExtensionId}/desktop.html#/desktop/profile`;
}

function getRabbyPopupUrl() {
  if (!rabbyExtensionId) throw new Error('Rabby extension not loaded. Run wallet-import or wallet-unlock first with --wallet flag.');
  return `chrome-extension://${rabbyExtensionId}/popup.html`;
}

function getRabbyImportPrivateKeyUrl() {
  if (!rabbyExtensionId) throw new Error('Rabby extension not loaded. Run wallet-import or wallet-unlock first with --wallet flag.');
  return `chrome-extension://${rabbyExtensionId}/index.html#/new-user/import/private-key`;
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
            if (!rabbyExtensionId) {
              rabbyExtensionId = url.split('/')[2];
            }
          } else if (!selectedPage && url !== 'about:blank') {
            // Prefer non-extension, non-blank pages
            selectedPage = p;
          }
        }

        // If no non-extension page found, use first page or create new
        page = selectedPage || (pages.length > 0 ? pages[0] : await context.newPage());

        // If not found from pages, use fallback
        if (!rabbyExtensionId) {
          rabbyExtensionId = 'dedbkciaajbkfglbaikbmmhdhelboppf';
        }

        console.log(JSON.stringify({
          status: 'info',
          message: 'Connected to existing browser via CDP',
          extensionId: rabbyExtensionId,
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
    const rabbyPath = path.join(EXTENSIONS_DIR, 'rabby');

    if (!fs.existsSync(path.join(rabbyPath, 'manifest.json'))) {
      console.log(JSON.stringify({
        success: false,
        error: 'Rabby wallet extension not found. Run wallet-setup first.',
        hint: 'node test-helper.js wallet-setup'
      }));
      process.exit(1);
    }

    const launchOptions = {
      headless: options.headless,
      channel: 'chromium',
      args: [
        '--no-first-run',
        '--disable-blink-features=AutomationControlled',
        `--disable-extensions-except=${path.resolve(rabbyPath)}`,
        `--load-extension=${path.resolve(rabbyPath)}`,
        `--remote-debugging-port=${CDP_PORT}`,
      ],
      ignoreDefaultArgs: ['--disable-extensions'],
      ...contextOptions,
    };

    console.log(JSON.stringify({ status: 'info', message: 'Starting Chromium with Rabby wallet extension...' }));

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
      rabbyExtensionId = swUrl.split('/')[2];
      console.log(JSON.stringify({ status: 'info', message: 'Rabby wallet extension loaded successfully', extensionId: rabbyExtensionId }));
    } catch (e) {
      console.log(JSON.stringify({ status: 'warning', message: 'Extension service worker not detected, trying fallback detection...' }));

      try {
        const allPages = context.pages();
        for (const p of allPages) {
          const url = p.url();
          if (url.startsWith('chrome-extension://')) {
            rabbyExtensionId = url.split('/')[2];
            console.log(JSON.stringify({ status: 'info', message: 'Extension ID detected from page', extensionId: rabbyExtensionId }));
            break;
          }
        }

        if (!rabbyExtensionId) {
          const testPage = await context.newPage();
          await testPage.goto('chrome://extensions/', { timeout: 5000 }).catch(() => {});
          await testPage.waitForTimeout(1000);

          const extensionIds = await testPage.evaluate(() => {
            const items = document.querySelectorAll('extensions-item');
            return Array.from(items).map(item => item.id).filter(id => id);
          }).catch(() => []);

          if (extensionIds.length > 0) {
            rabbyExtensionId = extensionIds[0];
            console.log(JSON.stringify({ status: 'info', message: 'Extension ID detected from chrome://extensions', extensionId: rabbyExtensionId }));
          }

          await testPage.close().catch(() => {});
        }

        if (!rabbyExtensionId) {
          rabbyExtensionId = 'dedbkciaajbkfglbaikbmmhdhelboppf';
          console.log(JSON.stringify({ status: 'warning', message: 'Using fallback extension ID', extensionId: rabbyExtensionId }));
        }
      } catch (fallbackError) {
        rabbyExtensionId = 'dedbkciaajbkfglbaikbmmhdhelboppf';
        console.log(JSON.stringify({ status: 'warning', message: 'Using fallback extension ID', extensionId: rabbyExtensionId }));
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
  const baseName = name ? name.replace(/\.(png|jpg|jpeg)$/i, '') : `screenshot-${Date.now()}`;
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
function getRabbyExtensionId() { return rabbyExtensionId; }
function setRabbyExtensionId(id) { rabbyExtensionId = id; }

module.exports = {
  startBrowser,
  stopBrowser,
  ensureBrowser,
  takeScreenshot,
  tryConnectExistingBrowser,
  saveCDPInfo,
  clearCDPInfo,
  getRabbyProfileUrl,
  getRabbyPopupUrl,
  getRabbyImportPrivateKeyUrl,
  getBrowser,
  getContext,
  getPage,
  setPage,
  getPersistentContext,
  getRabbyExtensionId,
  setRabbyExtensionId,
};
