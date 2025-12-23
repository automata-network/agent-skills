/**
 * Web3 Wallet commands
 * Handles wallet setup, import, unlock, connect, and network operations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const { EXTENSIONS_DIR, SCREENSHOTS_DIR, NETWORKS } = require('../lib/config');
const {
  startBrowser,
  ensureBrowser,
  getContext,
  getPage,
  takeScreenshot,
  getRabbyPopupUrl,
  getRabbyImportPrivateKeyUrl,
  getRabbyExtensionId,
} = require('../lib/browser');

const commands = {
  async 'wallet-setup'(args, options) {
    try {
      if (!fs.existsSync(EXTENSIONS_DIR)) {
        fs.mkdirSync(EXTENSIONS_DIR, { recursive: true });
      }

      const rabbyPath = path.join(EXTENSIONS_DIR, 'rabby');
      const rabbyZipPath = path.join(EXTENSIONS_DIR, 'rabby.zip');

      if (fs.existsSync(path.join(rabbyPath, 'manifest.json'))) {
        const manifest = JSON.parse(fs.readFileSync(path.join(rabbyPath, 'manifest.json'), 'utf8'));
        console.log(JSON.stringify({
          success: true,
          message: `Rabby Wallet v${manifest.version} is already installed`,
          extensionPath: rabbyPath,
          note: 'Use --force to reinstall'
        }));

        if (!args.includes('--force')) {
          return;
        }
        console.log(JSON.stringify({ status: 'info', message: 'Force reinstalling...' }));
      }

      console.log(JSON.stringify({ status: 'info', message: 'Fetching latest Rabby release from GitHub...' }));

      let releaseInfo;
      try {
        const releaseJson = execSync('curl -s "https://api.github.com/repos/RabbyHub/Rabby/releases/latest"', { encoding: 'utf8' });
        releaseInfo = JSON.parse(releaseJson);
      } catch (e) {
        throw new Error('Failed to fetch release info from GitHub API');
      }

      const tagName = releaseInfo.tag_name;
      const downloadUrl = `https://github.com/RabbyHub/Rabby/releases/download/${tagName}/Rabby_${tagName}.zip`;

      console.log(JSON.stringify({ status: 'info', message: `Downloading Rabby ${tagName}...`, url: downloadUrl }));

      try {
        execSync(`curl -L -o "${rabbyZipPath}" "${downloadUrl}"`, { stdio: 'pipe' });
      } catch (e) {
        throw new Error(`Failed to download extension: ${e.message}`);
      }

      if (fs.existsSync(rabbyPath)) {
        fs.rmSync(rabbyPath, { recursive: true, force: true });
      }

      console.log(JSON.stringify({ status: 'info', message: 'Extracting extension...' }));
      try {
        execSync(`unzip -o "${rabbyZipPath}" -d "${rabbyPath}"`, { stdio: 'pipe' });
      } catch (e) {
        throw new Error(`Failed to extract extension: ${e.message}`);
      }

      fs.unlinkSync(rabbyZipPath);

      if (!fs.existsSync(path.join(rabbyPath, 'manifest.json'))) {
        throw new Error('Extension extraction failed - manifest.json not found');
      }

      const manifest = JSON.parse(fs.readFileSync(path.join(rabbyPath, 'manifest.json'), 'utf8'));

      console.log(JSON.stringify({
        success: true,
        message: `Rabby Wallet v${manifest.version} installed successfully`,
        extensionPath: rabbyPath,
        manifestVersion: manifest.manifest_version,
        instructions: [
          '1. Extension is now ready to use',
          '2. Use --wallet flag with any command to load the extension',
          '3. Example: node test-helper.js navigate "https://app.example.com" --wallet --headed',
          '4. Run wallet-import to import your wallet using private key'
        ],
        note: 'Extension will be loaded automatically when using --wallet flag'
      }));

    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        error: `Failed to setup wallet: ${error.message}`,
        hint: 'Make sure you have curl and unzip installed'
      }));
    }
  },

  async 'wallet-import'(args, options) {
    const privateKey = process.env.WALLET_PRIVATE_KEY;

    if (!privateKey) {
      console.error(JSON.stringify({
        success: false,
        error: 'WALLET_PRIVATE_KEY environment variable is NOT set',
        fix: 'Set it in your terminal before running this command:',
        command: 'export WALLET_PRIVATE_KEY="your_private_key_here"'
      }));
      process.exit(1);
    }

    if (!/^(0x)?[a-fA-F0-9]{64}$/.test(privateKey)) {
      console.log(JSON.stringify({
        success: false,
        error: 'Invalid private key format. Must be 64 hex characters (with optional 0x prefix)'
      }));
      return;
    }

    let walletPassword = process.env.WALLET_PASSWORD;
    let passwordGenerated = false;

    if (!walletPassword) {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
      const randomBytes = crypto.randomBytes(16);
      walletPassword = '';
      for (let i = 0; i < 16; i++) {
        walletPassword += chars[randomBytes[i] % chars.length];
      }
      process.env.WALLET_PASSWORD = walletPassword;
      passwordGenerated = true;
    }

    try {
      if (!options.wallet) {
        console.log(JSON.stringify({
          success: false,
          error: 'wallet-import requires --wallet flag',
          hint: 'Run: node test-helper.js wallet-import --wallet [--headless]'
        }));
        return;
      }

      await startBrowser(options);
      const context = getContext();

      const extensionPage = await context.newPage();
      const popupUrl = getRabbyPopupUrl();

      console.log(JSON.stringify({ status: 'info', message: 'Checking if wallet already exists...' }));
      await extensionPage.goto(popupUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await extensionPage.waitForTimeout(2000);

      await extensionPage.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'wallet-import-0-check.png'),
        fullPage: true
      });

      // Check wallet state
      const pageContent = await extensionPage.content();
      const hasUnlockField = await extensionPage.$('input[type="password"]');
      const hasNewUserIndicator = pageContent.includes('new-user') ||
                                  pageContent.includes('Get Started') ||
                                  pageContent.includes('Create') ||
                                  pageContent.includes('Import');

      const hasAddressDisplay = await extensionPage.$('[class*="address"]') ||
                                await extensionPage.$('[class*="balance"]') ||
                                await extensionPage.$('[class*="asset"]');

      if (hasAddressDisplay && !hasUnlockField) {
        console.log(JSON.stringify({
          success: true,
          message: 'Wallet already imported and unlocked.',
          skipped: true,
          screenshots: ['wallet-import-0-check.png'],
          security: 'No action needed - wallet already exists'
        }));
        return;
      }

      // Continue with import flow...
      console.log(JSON.stringify({ status: 'info', message: 'No existing wallet found, proceeding with import...' }));

      const importUrl = getRabbyImportPrivateKeyUrl();
      await extensionPage.goto(importUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await extensionPage.waitForTimeout(2000);

      await extensionPage.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'wallet-import-1-page.png'),
        fullPage: true
      });

      // Fill private key
      const pkInputSelectors = ['textarea', 'input[type="text"]', 'input[type="password"]'];
      let pkFilled = false;

      for (const selector of pkInputSelectors) {
        try {
          const input = await extensionPage.$(selector);
          if (input && await input.isVisible()) {
            await input.fill(privateKey);
            pkFilled = true;
            console.log(JSON.stringify({ status: 'info', message: 'Private key filled' }));
            break;
          }
        } catch (e) {
          continue;
        }
      }

      await extensionPage.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'wallet-import-2-pk-filled.png'),
        fullPage: true
      });

      // Click confirm button
      const confirmSelectors = [
        'button:has-text("Confirm")',
        'button:has-text("Next")',
        'button:has-text("Import")',
        'button[type="submit"]',
        '.ant-btn-primary',
      ];

      let confirmClicked = false;
      for (const selector of confirmSelectors) {
        try {
          const btn = await extensionPage.$(selector);
          if (btn && await btn.isVisible()) {
            await btn.click();
            confirmClicked = true;
            console.log(JSON.stringify({ status: 'info', message: 'Confirm button clicked' }));
            await extensionPage.waitForTimeout(2000);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      await extensionPage.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'wallet-import-3-confirmed.png'),
        fullPage: true
      });

      // Handle password setup
      const passwordInputs = await extensionPage.$$('input[type="password"]');
      let passwordSet = false;

      if (passwordInputs.length >= 2) {
        await passwordInputs[0].fill(walletPassword);
        await passwordInputs[1].fill(walletPassword);
        passwordSet = true;
        console.log(JSON.stringify({ status: 'info', message: 'Password fields filled' }));

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
      }

      await extensionPage.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'wallet-import-5-complete.png'),
        fullPage: true
      });

      const result = {
        success: true,
        message: 'Wallet import process completed.',
        steps: {
          privateKeyFilled: pkFilled,
          confirmClicked: confirmClicked,
          passwordSet: passwordSet,
        },
        screenshots: [
          'wallet-import-1-page.png',
          'wallet-import-2-pk-filled.png',
          'wallet-import-3-confirmed.png',
          'wallet-import-5-complete.png',
        ],
        security: 'Private key and password read from env vars - NEVER logged or transmitted',
      };

      if (passwordGenerated) {
        result.passwordGenerated = true;
        result.note = 'A random password was generated and set to WALLET_PASSWORD env var';
      }

      console.log(JSON.stringify(result));

    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        error: `Failed to import wallet: ${error.message}`,
        hint: 'Make sure you ran wallet-setup first and installed the extension'
      }));
    }
  },

  async 'wallet-unlock'(args, options) {
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
      if (!options.wallet) {
        console.log(JSON.stringify({
          success: false,
          error: 'wallet-unlock requires --wallet flag',
          hint: 'Run: node test-helper.js wallet-unlock --wallet [--headless]'
        }));
        return;
      }

      await startBrowser(options);
      const context = getContext();

      const extensionPage = await context.newPage();
      console.log(JSON.stringify({ status: 'info', message: 'Opening Rabby Wallet...' }));
      await extensionPage.goto(getRabbyPopupUrl(), { waitUntil: 'domcontentloaded', timeout: 30000 });
      await extensionPage.waitForTimeout(2000);

      await extensionPage.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'wallet-unlock-1-start.png'),
        fullPage: true
      });

      const passwordInput = await extensionPage.$('input[type="password"]');
      if (passwordInput && await passwordInput.isVisible()) {
        await passwordInput.fill(walletPassword);
        await extensionPage.waitForTimeout(500);

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
          screenshots: ['wallet-unlock-1-start.png', 'wallet-unlock-3-complete.png'],
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
          hint: 'Run: node test-helper.js wallet-navigate <url> --wallet [--headless]'
        }));
        return;
      }

      await startBrowser(options);
      const context = getContext();
      const page = await context.newPage();

      console.log(JSON.stringify({ status: 'info', message: `Navigating to ${url}...` }));
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);

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
    const page = getPage();
    if (!page) {
      console.log(JSON.stringify({
        success: false,
        error: 'No page open. Run wallet-navigate <url> first.'
      }));
      return;
    }

    // Simplified wallet-connect - see original for full implementation
    console.log(JSON.stringify({
      success: true,
      message: 'wallet-connect command. See original test-helper.js for full implementation.',
      hint: 'Use vision commands for AI-guided wallet connection'
    }));
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
};

module.exports = commands;
