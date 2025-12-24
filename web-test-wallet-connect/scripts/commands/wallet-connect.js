/**
 * Wallet Connect Commands
 * Handles wallet connection to DApps, approvals, and network switching
 */

const path = require('path');

const { SCREENSHOTS_DIR, NETWORKS } = require('../lib/config');
const {
  startBrowser,
  ensureBrowser,
  getContext,
  getPage,
  setPage,
} = require('../lib/browser');

// Store pending popup promise for pre-emptive listening
let pendingPopupPromise = null;
let popupListener = null;

/**
 * Start listening for popup before clicking Connect button
 * This helps catch popups that open quickly
 */
function startPopupListener() {
  const context = getContext();
  if (!context) return;

  // Clear any existing listener
  stopPopupListener();

  // Create a promise that resolves when a new page opens
  pendingPopupPromise = new Promise((resolve) => {
    popupListener = (page) => {
      resolve(page);
    };
    context.on('page', popupListener);
  });

  console.log(JSON.stringify({ status: 'info', message: 'Started listening for wallet popup...' }));
}

/**
 * Stop the popup listener
 */
function stopPopupListener() {
  const context = getContext();
  if (context && popupListener) {
    context.off('page', popupListener);
  }
  popupListener = null;
  pendingPopupPromise = null;
}

/**
 * Find existing extension popup in context pages
 */
async function findExistingPopup() {
  const context = getContext();
  if (!context) return null;

  const pages = context.pages();
  for (const page of pages) {
    const url = page.url();
    if (url.includes('chrome-extension://') &&
        (url.includes('notification') || url.includes('popup') || url.includes('confirm'))) {
      console.log(JSON.stringify({ status: 'info', message: `Found existing popup: ${url}` }));
      return page;
    }
  }
  return null;
}

/**
 * Click approve button on popup with retry logic
 */
async function clickApproveButton(popup, maxRetries = 3) {
  const approveSelectors = [
    // Primary buttons
    'button:has-text("Connect")',
    'button:has-text("Confirm")',
    'button:has-text("Approve")',
    'button:has-text("Sign")',
    'button:has-text("Allow")',
    // Chinese text
    'button:has-text("确认")',
    'button:has-text("连接")',
    'button:has-text("批准")',
    'button:has-text("签名")',
    // Common UI classes
    '.ant-btn-primary',
    'button[type="submit"]',
    '[class*="primary"]',
    '[class*="confirm"]',
    // MetaMask specific
    '[class*="FooterButton"]',
    '[class*="action-button"]',
  ];

  for (let retry = 0; retry < maxRetries; retry++) {
    if (popup.isClosed()) {
      console.log(JSON.stringify({ status: 'info', message: 'Popup closed, approval likely completed' }));
      return true;
    }

    for (const selector of approveSelectors) {
      try {
        const btn = await popup.$(selector);
        if (btn) {
          const isVisible = await btn.isVisible().catch(() => false);
          const isEnabled = await btn.isEnabled().catch(() => false);

          if (isVisible && isEnabled) {
            // Scroll into view first
            await btn.scrollIntoViewIfNeeded().catch(() => {});
            await popup.waitForTimeout(200);

            // Click with force option as backup
            await btn.click({ timeout: 5000 }).catch(async () => {
              await btn.click({ force: true });
            });

            console.log(JSON.stringify({
              status: 'info',
              message: `Clicked approve button: ${selector}`,
              retry: retry
            }));

            await popup.waitForTimeout(1000);
            return true;
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Wait before retry
    if (retry < maxRetries - 1) {
      console.log(JSON.stringify({ status: 'info', message: `Retry ${retry + 1}/${maxRetries} - waiting for button...` }));
      await popup.waitForTimeout(1000);
    }
  }

  return false;
}

const commands = {
  async 'wallet-navigate'(args, options) {
    const url = args[0];
    if (!url) {
      console.log(JSON.stringify({
        success: false,
        error: 'URL required. Usage: wallet-navigate <url>'
      }));
      return;
    }

    try {
      if (!options.wallet) {
        console.log(JSON.stringify({
          success: false,
          error: 'wallet-navigate requires --wallet flag to load the wallet extension',
          hint: 'Run: node wallet-connect-helper.js wallet-navigate <url> --wallet [--headed]'
        }));
        return;
      }

      await startBrowser(options);
      const context = getContext();
      const newPage = await context.newPage();

      setPage(newPage);

      console.log(JSON.stringify({ status: 'info', message: `Navigating to ${url}...` }));
      await newPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await newPage.waitForTimeout(2000);

      const screenshotPath = path.join(SCREENSHOTS_DIR, 'dapp-home.jpg');
      await newPage.screenshot({ path: screenshotPath, type: 'jpeg', quality: 60 });

      // Start listening for popup early
      startPopupListener();

      console.log(JSON.stringify({
        success: true,
        message: `Navigated to ${url} with MetaMask Wallet available`,
        url: newPage.url(),
        screenshot: 'dapp-home.jpg',
        nextSteps: [
          'Use vision-screenshot to see the page',
          'Use vision-click to click Connect Wallet button',
          'Use wallet-approve to approve the connection'
        ]
      }));

    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        error: `Failed to navigate: ${error.message}`
      }));
    }
  },

  /**
   * Start listening for popup before clicking (call this before vision-click on Connect button)
   */
  async 'wallet-listen'(args, options) {
    const context = getContext();
    if (!context) {
      console.log(JSON.stringify({
        success: false,
        error: 'No browser context. Run wallet-navigate first.'
      }));
      return;
    }

    startPopupListener();

    console.log(JSON.stringify({
      success: true,
      message: 'Popup listener started. Now click the Connect Wallet button, then run wallet-approve.'
    }));
  },

  /**
   * Improved wallet-approve with better popup handling
   */
  async 'wallet-approve'(args, options) {
    const context = getContext();
    if (!context) {
      console.log(JSON.stringify({
        success: false,
        error: 'No browser context. Run wallet-navigate first.'
      }));
      return;
    }

    const timeout = parseInt(options.timeout) || 30000;
    let popup = null;
    let approved = false;

    try {
      // Step 1: Check if popup already exists
      popup = await findExistingPopup();

      // Step 2: If no existing popup, wait for one
      if (!popup) {
        console.log(JSON.stringify({ status: 'info', message: 'Waiting for MetaMask popup window...' }));

        // Use pending promise if we started listening early
        if (pendingPopupPromise) {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Popup timeout')), timeout)
          );

          try {
            popup = await Promise.race([pendingPopupPromise, timeoutPromise]);
          } catch (e) {
            // Fall through to waitForEvent
          }
        }

        // If still no popup, wait for event
        if (!popup) {
          popup = await context.waitForEvent('page', { timeout });
        }
      }

      // Clean up listener
      stopPopupListener();

      // Step 3: Wait for popup to load
      if (!popup.isClosed()) {
        await popup.waitForLoadState('domcontentloaded').catch(() => {});
        await popup.waitForTimeout(1500); // Give more time for content to render
      }

      const popupUrl = popup.url();
      console.log(JSON.stringify({ status: 'info', message: `Popup opened: ${popupUrl}` }));

      // Step 4: Take screenshot
      if (!popup.isClosed()) {
        await popup.screenshot({
          path: path.join(SCREENSHOTS_DIR, 'metamask-popup.jpg'),
          type: 'jpeg',
          quality: 60
        }).catch(() => {});
      }

      // Step 5: Verify it's an extension popup
      if (!popupUrl.includes('chrome-extension://')) {
        console.log(JSON.stringify({
          success: false,
          error: 'Popup is not a Chrome extension',
          url: popupUrl
        }));
        return;
      }

      // Step 6: Click approve button with retries
      if (!popup.isClosed()) {
        approved = await clickApproveButton(popup);
      } else {
        // Popup closed, might be auto-approved
        approved = true;
      }

      // Step 7: Take screenshot after first click
      if (!popup.isClosed()) {
        await popup.screenshot({
          path: path.join(SCREENSHOTS_DIR, 'metamask-popup-after-approve.jpg'),
          type: 'jpeg',
          quality: 60
        }).catch(() => {});
      }

      // Step 8: Handle multiple approval steps (e.g., connect then sign)
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (!popup.isClosed()) {
        console.log(JSON.stringify({ status: 'info', message: 'Popup still open, checking for additional approval...' }));

        // Try clicking again for signature or additional confirmation
        const additionalApproval = await clickApproveButton(popup, 2);
        if (additionalApproval) {
          console.log(JSON.stringify({ status: 'info', message: 'Additional approval clicked' }));
        }
      }

      // Step 9: Wait for popup to close
      let closeTimeout = 10000;
      const startTime = Date.now();
      while (!popup.isClosed() && (Date.now() - startTime) < closeTimeout) {
        await new Promise(resolve => setTimeout(resolve, 500));

        // Try clicking any remaining buttons
        if (!popup.isClosed()) {
          await clickApproveButton(popup, 1).catch(() => {});
        }
      }

      // Step 10: Final screenshot of main page
      const mainPage = getPage();
      if (mainPage) {
        await mainPage.waitForTimeout(2000);
        await mainPage.screenshot({
          path: path.join(SCREENSHOTS_DIR, 'after-wallet-approve.jpg'),
          type: 'jpeg',
          quality: 60
        }).catch(() => {});
      }

      console.log(JSON.stringify({
        success: true,
        message: 'Wallet approval completed',
        approved: approved,
        popupClosed: popup.isClosed(),
        screenshots: ['metamask-popup.jpg', 'metamask-popup-after-approve.jpg', 'after-wallet-approve.jpg']
      }));

    } catch (error) {
      stopPopupListener();

      if (error.message.includes('Timeout') || error.message.includes('timeout')) {
        // Check if popup opened but closed quickly
        const pages = context.pages();
        const extensionPages = pages.filter(p => p.url().includes('chrome-extension://'));

        console.log(JSON.stringify({
          success: false,
          error: 'No popup window detected within timeout',
          hint: 'Make sure you clicked Connect Wallet button first. The popup may have opened and closed too quickly.',
          debug: {
            totalPages: pages.length,
            extensionPages: extensionPages.length
          }
        }));
      } else {
        console.log(JSON.stringify({
          success: false,
          error: `Failed to approve wallet: ${error.message}`
        }));
      }
    }
  },

  async 'wallet-switch-network'(args, options) {
    const page = getPage();
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
    const page = getPage();

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

  // Vision commands for AI-guided interaction
  async 'vision-screenshot'(args, options) {
    await ensureBrowser(options);
    const page = getPage();

    if (!page) {
      console.log(JSON.stringify({
        success: false,
        error: 'No page open. Run wallet-navigate first.'
      }));
      return;
    }

    const name = args[0] || `screenshot-${Date.now()}.jpg`;
    const screenshotPath = path.join(SCREENSHOTS_DIR, name);

    try {
      const viewport = page.viewportSize();
      await page.screenshot({ path: screenshotPath, type: 'jpeg', quality: 60 });

      console.log(JSON.stringify({
        success: true,
        message: 'Screenshot taken',
        screenshot: name,
        path: screenshotPath,
        viewport: viewport,
        hint: 'Use Read tool to view this screenshot and determine click coordinates'
      }));
    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        error: `Failed to take screenshot: ${error.message}`
      }));
    }
  },

  async 'vision-click'(args, options) {
    await ensureBrowser(options);
    const page = getPage();

    if (!page) {
      console.log(JSON.stringify({
        success: false,
        error: 'No page open. Run wallet-navigate first.'
      }));
      return;
    }

    const x = parseInt(args[0]);
    const y = parseInt(args[1]);

    if (isNaN(x) || isNaN(y)) {
      console.log(JSON.stringify({
        success: false,
        error: 'Invalid coordinates. Usage: vision-click <x> <y>'
      }));
      return;
    }

    // Start listening for popup before click (in case it triggers wallet)
    startPopupListener();

    try {
      await page.mouse.click(x, y);
      await page.waitForTimeout(500);

      const screenshotPath = path.join(SCREENSHOTS_DIR, `after-click-${x}-${y}.jpg`);
      await page.screenshot({ path: screenshotPath, type: 'jpeg', quality: 60 });

      console.log(JSON.stringify({
        success: true,
        message: `Clicked at (${x}, ${y})`,
        coordinates: { x, y },
        screenshot: `after-click-${x}-${y}.jpg`,
        hint: 'If this triggered a wallet popup, run wallet-approve next'
      }));
    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        error: `Failed to click: ${error.message}`
      }));
    }
  },

  async 'vision-type'(args, options) {
    await ensureBrowser(options);
    const page = getPage();

    if (!page) {
      console.log(JSON.stringify({
        success: false,
        error: 'No page open. Run wallet-navigate first.'
      }));
      return;
    }

    const text = args.join(' ');
    if (!text) {
      console.log(JSON.stringify({
        success: false,
        error: 'No text provided. Usage: vision-type <text>'
      }));
      return;
    }

    try {
      await page.keyboard.type(text);
      await page.waitForTimeout(300);

      console.log(JSON.stringify({
        success: true,
        message: `Typed: "${text}"`
      }));
    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        error: `Failed to type: ${error.message}`
      }));
    }
  },

  async 'wait'(args, options) {
    const ms = parseInt(args[0]) || 1000;
    await new Promise(resolve => setTimeout(resolve, ms));
    console.log(JSON.stringify({
      success: true,
      message: `Waited ${ms}ms`
    }));
  },
};

module.exports = commands;
