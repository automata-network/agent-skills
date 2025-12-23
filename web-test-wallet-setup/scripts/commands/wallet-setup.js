/**
 * Wallet Setup Commands
 * Handles wallet extension download and initialization
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const { EXTENSIONS_DIR, SCREENSHOTS_DIR } = require('../lib/config');
const {
  startBrowser,
  getContext,
  getRabbyExtensionId,
} = require('../lib/browser');

// Wallet states
const WalletState = {
  NEW_USER: 'NEW_USER',
  LOCKED: 'LOCKED',
  UNLOCKED: 'UNLOCKED',
  UNKNOWN: 'UNKNOWN',
};

/**
 * Detect the current wallet state from the extension page
 */
async function detectWalletState(page) {
  const content = await page.content();

  const hasPasswordInput = await page.$('input[type="password"]').catch(() => null);

  const isNewUser = content.includes('new-user') ||
                    content.includes('Get Started') ||
                    content.includes('Create a new address') ||
                    content.includes('Import') && content.includes('Create');

  const hasAddressDisplay = await page.$('[class*="address"]').catch(() => null) ||
                            await page.$('[class*="balance"]').catch(() => null) ||
                            await page.$('[class*="asset"]').catch(() => null) ||
                            await page.$('[class*="CurrentAccount"]').catch(() => null);

  const hasForgotPassword = content.includes('Forgot Password') ||
                            content.includes('forgot-password') ||
                            content.includes('Forgot password');

  if (isNewUser && !hasPasswordInput) {
    return WalletState.NEW_USER;
  }

  if (hasPasswordInput && !hasAddressDisplay) {
    return WalletState.LOCKED;
  }

  if (hasAddressDisplay && !hasPasswordInput) {
    return WalletState.UNLOCKED;
  }

  if (hasForgotPassword) {
    return WalletState.LOCKED;
  }

  return WalletState.UNKNOWN;
}

function getRabbyIndexUrl() {
  const extensionId = getRabbyExtensionId();
  if (!extensionId) throw new Error('Rabby extension not loaded');
  return `chrome-extension://${extensionId}/index.html`;
}

function getRabbyImportPrivateKeyUrl() {
  const extensionId = getRabbyExtensionId();
  if (!extensionId) throw new Error('Rabby extension not loaded');
  return `chrome-extension://${extensionId}/index.html#/import/key`;
}

/**
 * Import wallet using private key
 */
async function importWallet(extensionPage, privateKey, walletPassword) {
  console.log(JSON.stringify({ status: 'info', message: 'Starting wallet import flow...' }));

  const importUrl = getRabbyImportPrivateKeyUrl();
  console.log(JSON.stringify({ status: 'info', message: `Navigating to import page: ${importUrl}` }));

  await extensionPage.goto(importUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await extensionPage.waitForTimeout(3000);

  await extensionPage.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'wallet-init-import-page.jpg'),
    type: 'jpeg',
    quality: 60
  });

  const currentUrl = extensionPage.url();
  console.log(JSON.stringify({ status: 'info', message: `Current URL: ${currentUrl}` }));

  if (currentUrl.includes('/new-user/guide')) {
    console.log(JSON.stringify({ status: 'info', message: 'On guide page, looking for Import option...' }));

    const importButtonSelectors = [
      'text=Import an address',
      'text=Import',
      '[class*="import"]',
      'button:has-text("Import")',
    ];

    for (const selector of importButtonSelectors) {
      try {
        const btn = await extensionPage.$(selector);
        if (btn && await btn.isVisible()) {
          await btn.click();
          console.log(JSON.stringify({ status: 'info', message: 'Clicked Import option' }));
          await extensionPage.waitForTimeout(2000);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    await extensionPage.goto(importUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await extensionPage.waitForTimeout(2000);
  }

  await extensionPage.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'wallet-init-pk-input-page.jpg'),
    type: 'jpeg',
    quality: 60
  });

  const pkInputSelectors = [
    'textarea[placeholder*="private"]',
    'textarea[placeholder*="Private"]',
    'textarea',
    'input[type="text"][placeholder*="private"]',
    'input[type="password"]',
  ];
  let pkFilled = false;

  for (const selector of pkInputSelectors) {
    try {
      const inputs = await extensionPage.$$(selector);
      for (const input of inputs) {
        if (await input.isVisible()) {
          await input.fill(privateKey);
          pkFilled = true;
          console.log(JSON.stringify({ status: 'info', message: `Private key filled using selector: ${selector}` }));
          break;
        }
      }
      if (pkFilled) break;
    } catch (e) {
      continue;
    }
  }

  if (!pkFilled) {
    await extensionPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'wallet-init-pk-input-failed.jpg'),
      type: 'jpeg',
      quality: 60
    });
    throw new Error('Failed to find private key input field');
  }

  await extensionPage.waitForTimeout(1000);

  await extensionPage.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'wallet-init-pk-filled.jpg'),
    type: 'jpeg',
    quality: 60
  });

  const confirmSelectors = [
    'button:has-text("Confirm")',
    'button:has-text("Next")',
    'button:has-text("Import")',
    'button[type="submit"]',
    '.ant-btn-primary',
  ];

  for (const selector of confirmSelectors) {
    try {
      const btn = await extensionPage.$(selector);
      if (btn && await btn.isVisible()) {
        await btn.click();
        console.log(JSON.stringify({ status: 'info', message: 'Confirm button clicked' }));
        await extensionPage.waitForTimeout(3000);
        break;
      }
    } catch (e) {
      continue;
    }
  }

  await extensionPage.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'wallet-init-after-confirm.jpg'),
    type: 'jpeg',
    quality: 60
  });

  const passwordInputs = await extensionPage.$$('input[type="password"]');
  console.log(JSON.stringify({ status: 'info', message: `Found ${passwordInputs.length} password inputs` }));

  if (passwordInputs.length >= 2) {
    await passwordInputs[0].fill(walletPassword);
    await passwordInputs[1].fill(walletPassword);
    console.log(JSON.stringify({ status: 'info', message: 'Password fields filled' }));

    await extensionPage.waitForTimeout(500);

    await extensionPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'wallet-init-password-filled.jpg'),
      type: 'jpeg',
      quality: 60
    });

    for (const selector of confirmSelectors) {
      try {
        const btn = await extensionPage.$(selector);
        if (btn && await btn.isVisible()) {
          await btn.click();
          console.log(JSON.stringify({ status: 'info', message: 'Password confirm clicked' }));
          await extensionPage.waitForTimeout(3000);
          break;
        }
      } catch (e) {
        continue;
      }
    }
  }

  await extensionPage.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'wallet-init-import-complete.jpg'),
    type: 'jpeg',
    quality: 60
  });

  console.log(JSON.stringify({ status: 'info', message: 'Verifying wallet import...' }));
  const indexUrl = getRabbyIndexUrl();
  await extensionPage.goto(indexUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await extensionPage.waitForTimeout(2000);

  await extensionPage.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'wallet-init-verify.jpg'),
    type: 'jpeg',
    quality: 60
  });

  const verifyUrl = extensionPage.url();
  const isStillNewUser = verifyUrl.includes('/new-user');

  if (isStillNewUser) {
    console.log(JSON.stringify({ status: 'warning', message: 'Still on new-user page after import, wallet may not be imported correctly' }));
    return false;
  }

  console.log(JSON.stringify({ status: 'info', message: 'Wallet import verified successfully' }));
  return true;
}

async function unlockWallet(extensionPage, walletPassword) {
  console.log(JSON.stringify({ status: 'info', message: 'Attempting to unlock wallet...' }));

  const passwordInput = await extensionPage.$('input[type="password"]');
  if (!passwordInput || !(await passwordInput.isVisible())) {
    throw new Error('Password input not found');
  }

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
    path: path.join(SCREENSHOTS_DIR, 'wallet-init-after-unlock.jpg'),
    type: 'jpeg',
    quality: 60
  });

  const newState = await detectWalletState(extensionPage);
  return newState === WalletState.UNLOCKED;
}

async function resetWallet(extensionPage) {
  console.log(JSON.stringify({ status: 'info', message: 'Starting wallet reset (Forgot Password) flow...' }));

  const forgotPasswordSelectors = [
    'text=Forgot Password',
    'text=Forgot password',
    'a:has-text("Forgot")',
    '[class*="forgot"]',
  ];

  let clicked = false;
  for (const selector of forgotPasswordSelectors) {
    try {
      const link = await extensionPage.$(selector);
      if (link && await link.isVisible()) {
        await link.click();
        clicked = true;
        console.log(JSON.stringify({ status: 'info', message: 'Clicked Forgot Password' }));
        await extensionPage.waitForTimeout(2000);
        break;
      }
    } catch (e) {
      continue;
    }
  }

  if (!clicked) {
    throw new Error('Could not find Forgot Password link');
  }

  await extensionPage.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'wallet-init-reset-page.jpg'),
    type: 'jpeg',
    quality: 60
  });

  const resetSelectors = [
    'button:has-text("Reset")',
    'button:has-text("Confirm")',
    'button:has-text("I understand")',
    'button:has-text("Continue")',
    '.ant-btn-primary',
    '.ant-btn-danger',
  ];

  for (const selector of resetSelectors) {
    try {
      const btn = await extensionPage.$(selector);
      if (btn && await btn.isVisible()) {
        await btn.click();
        console.log(JSON.stringify({ status: 'info', message: 'Clicked reset confirm button' }));
        await extensionPage.waitForTimeout(2000);
        break;
      }
    } catch (e) {
      continue;
    }
  }

  await extensionPage.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'wallet-init-reset-complete.jpg'),
    type: 'jpeg',
    quality: 60
  });

  return true;
}

function generatePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const randomBytes = crypto.randomBytes(16);
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  return password;
}

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
        nextStep: 'Run wallet-init to initialize your wallet'
      }));

    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        error: `Failed to setup wallet: ${error.message}`,
        hint: 'Make sure you have curl and unzip installed'
      }));
    }
  },

  async 'wallet-init'(args, options) {
    const privateKey = process.env.WALLET_PRIVATE_KEY;

    if (!privateKey) {
      console.log(JSON.stringify({
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
      walletPassword = generatePassword();
      process.env.WALLET_PASSWORD = walletPassword;
      passwordGenerated = true;
      console.log(JSON.stringify({
        status: 'info',
        message: 'Generated new wallet password (saved to WALLET_PASSWORD env var)'
      }));
    }

    try {
      if (!options.wallet) {
        console.log(JSON.stringify({
          success: false,
          error: 'wallet-init requires --wallet flag',
          hint: 'Run: node wallet-setup-helper.js wallet-init --wallet [--headed]'
        }));
        return;
      }

      await startBrowser(options);
      const context = getContext();

      console.log(JSON.stringify({ status: 'info', message: 'Opening Rabby extension page...' }));
      const extensionPage = await context.newPage();
      const extensionId = getRabbyExtensionId();
      const indexUrl = `chrome-extension://${extensionId}/index.html`;
      console.log(JSON.stringify({ status: 'info', message: `Extension URL: ${indexUrl}` }));

      await extensionPage.goto(indexUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await extensionPage.waitForTimeout(3000);

      await extensionPage.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'wallet-init-state-check.jpg'),
        type: 'jpeg',
        quality: 60
      });

      let state = await detectWalletState(extensionPage);
      console.log(JSON.stringify({ status: 'info', message: `Detected wallet state: ${state}` }));

      let initSuccess = false;
      let steps = [];

      switch (state) {
        case WalletState.NEW_USER:
          steps.push('detected_new_user');
          await importWallet(extensionPage, privateKey, walletPassword);
          steps.push('imported_wallet');
          initSuccess = true;
          break;

        case WalletState.LOCKED:
          steps.push('detected_locked');

          if (!process.env.WALLET_PASSWORD || passwordGenerated) {
            console.log(JSON.stringify({
              status: 'info',
              message: 'No existing password, will reset wallet...'
            }));
            steps.push('no_password_resetting');
            await resetWallet(extensionPage);
            steps.push('wallet_reset');

            await extensionPage.waitForTimeout(1000);
            await extensionPage.goto(indexUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await extensionPage.waitForTimeout(2000);

            await importWallet(extensionPage, privateKey, walletPassword);
            steps.push('imported_wallet_after_reset');
            initSuccess = true;
          } else {
            const unlocked = await unlockWallet(extensionPage, walletPassword);

            if (unlocked) {
              steps.push('unlock_success');
              initSuccess = true;
            } else {
              console.log(JSON.stringify({
                status: 'info',
                message: 'Unlock failed, resetting wallet...'
              }));
              steps.push('unlock_failed_resetting');

              await extensionPage.goto(indexUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
              await extensionPage.waitForTimeout(2000);

              await resetWallet(extensionPage);
              steps.push('wallet_reset');

              await extensionPage.waitForTimeout(1000);
              await extensionPage.goto(indexUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
              await extensionPage.waitForTimeout(2000);

              await importWallet(extensionPage, privateKey, walletPassword);
              steps.push('imported_wallet_after_reset');
              initSuccess = true;
            }
          }
          break;

        case WalletState.UNLOCKED:
          steps.push('already_unlocked');
          initSuccess = true;
          break;

        case WalletState.UNKNOWN:
          console.log(JSON.stringify({
            status: 'warning',
            message: 'Unknown wallet state, attempting import flow...'
          }));
          steps.push('unknown_state_trying_import');

          try {
            await importWallet(extensionPage, privateKey, walletPassword);
            steps.push('import_attempted');
            initSuccess = true;
          } catch (e) {
            steps.push('import_failed');
            console.log(JSON.stringify({
              status: 'error',
              message: `Import attempt failed: ${e.message}`
            }));
          }
          break;
      }

      await extensionPage.goto(indexUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await extensionPage.waitForTimeout(2000);
      const finalState = await detectWalletState(extensionPage);

      await extensionPage.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'wallet-init-final.jpg'),
        type: 'jpeg',
        quality: 60
      });

      if (finalState === WalletState.UNLOCKED || initSuccess) {
        console.log(JSON.stringify({
          success: true,
          message: 'Wallet initialization completed successfully',
          initialState: state,
          finalState: finalState,
          steps: steps,
          nextStep: 'Use web-test-wallet-connect to connect wallet to DApp'
        }));
      } else {
        console.log(JSON.stringify({
          success: false,
          error: 'Wallet initialization failed',
          initialState: state,
          finalState: finalState,
          steps: steps,
          hint: 'Check screenshots for details'
        }));
      }

    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        error: `Wallet initialization failed: ${error.message}`,
        hint: 'Make sure you ran wallet-setup first and the extension is installed'
      }));
    }
  },
};

module.exports = commands;
