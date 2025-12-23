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

      console.log(JSON.stringify({
        success: true,
        message: `Navigated to ${url} with Rabby Wallet available`,
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
    console.log(JSON.stringify({ status: 'info', message: 'Waiting for Rabby popup window...' }));

    try {
      const popupPromise = context.waitForEvent('page', { timeout });

      const popup = await popupPromise;
      await popup.waitForLoadState('domcontentloaded');
      await popup.waitForTimeout(1000);

      const popupUrl = popup.url();
      console.log(JSON.stringify({ status: 'info', message: `Popup opened: ${popupUrl}` }));

      await popup.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'rabby-popup.jpg'),
        type: 'jpeg',
        quality: 60
      });

      if (!popupUrl.includes('chrome-extension://')) {
        console.log(JSON.stringify({
          success: false,
          error: 'Popup is not a Chrome extension',
          url: popupUrl
        }));
        return;
      }

      const approveSelectors = [
        'button:has-text("Connect")',
        'button:has-text("Confirm")',
        'button:has-text("Approve")',
        'button:has-text("Sign")',
        'button:has-text("确认")',
        'button:has-text("连接")',
        '.ant-btn-primary',
        'button[type="submit"]',
      ];

      let approved = false;
      for (const selector of approveSelectors) {
        try {
          const btn = await popup.$(selector);
          if (btn && await btn.isVisible()) {
            await btn.click();
            approved = true;
            console.log(JSON.stringify({ status: 'info', message: `Clicked approve button: ${selector}` }));
            await popup.waitForTimeout(1000);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      await popup.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'rabby-popup-after-approve.jpg'),
        type: 'jpeg',
        quality: 60
      }).catch(() => {});

      await popup.waitForTimeout(2000);

      if (!popup.isClosed()) {
        console.log(JSON.stringify({ status: 'info', message: 'Popup still open, checking for signature request...' }));

        for (const selector of approveSelectors) {
          try {
            const btn = await popup.$(selector);
            if (btn && await btn.isVisible()) {
              await btn.click();
              console.log(JSON.stringify({ status: 'info', message: `Clicked signature button: ${selector}` }));
              await popup.waitForTimeout(1000);
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }

      const mainPage = getPage();
      if (mainPage) {
        await mainPage.waitForTimeout(2000);
        await mainPage.screenshot({
          path: path.join(SCREENSHOTS_DIR, 'after-wallet-approve.jpg'),
          type: 'jpeg',
          quality: 60
        });
      }

      console.log(JSON.stringify({
        success: true,
        message: 'Wallet approval completed',
        approved: approved,
        screenshots: ['rabby-popup.jpg', 'rabby-popup-after-approve.jpg', 'after-wallet-approve.jpg']
      }));

    } catch (error) {
      if (error.message.includes('Timeout')) {
        console.log(JSON.stringify({
          success: false,
          error: 'No popup window detected within timeout',
          hint: 'Make sure you clicked Connect Wallet button first'
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

    try {
      await page.mouse.click(x, y);
      await page.waitForTimeout(500);

      const screenshotPath = path.join(SCREENSHOTS_DIR, `after-click-${x}-${y}.jpg`);
      await page.screenshot({ path: screenshotPath, type: 'jpeg', quality: 60 });

      console.log(JSON.stringify({
        success: true,
        message: `Clicked at (${x}, ${y})`,
        coordinates: { x, y },
        screenshot: `after-click-${x}-${y}.jpg`
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
