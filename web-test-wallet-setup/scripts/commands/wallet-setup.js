/**
 * Wallet Setup Commands
 * Handles wallet extension download and initialization
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const { EXTENSIONS_DIR, SCREENSHOTS_DIR } = require('../lib/config');

// .test-env file path - stored in tests/ directory (persistent, not cleaned before tests)
const TEST_ENV_FILE = path.join(process.cwd(), 'tests', '.test-env');

/**
 * Read sensitive values from .test-env file
 * This file should NOT be committed to git or exposed to external APIs
 * @returns {Object} Object with WALLET_PRIVATE_KEY and WALLET_PASSWORD
 */
function readTestEnv() {
  const result = {
    WALLET_PRIVATE_KEY: null,
    WALLET_PASSWORD: null,
  };

  if (!fs.existsSync(TEST_ENV_FILE)) {
    return result;
  }

  try {
    const content = fs.readFileSync(TEST_ENV_FILE, 'utf8');
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;

      const key = trimmed.substring(0, eqIndex).trim();
      let value = trimmed.substring(eqIndex + 1).trim();

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (key === 'WALLET_PRIVATE_KEY' || key === 'WALLET_PASSWORD') {
        result[key] = value;
      }
    }
  } catch (e) {
    console.log(JSON.stringify({
      status: 'warning',
      message: `Failed to read .test-env: ${e.message}`
    }));
  }

  return result;
}

/**
 * Write or update a value in .test-env file
 * @param {string} key - The key to write
 * @param {string} value - The value to write
 */
function writeTestEnv(key, value) {
  let content = '';
  const entries = {};

  // Read existing content
  if (fs.existsSync(TEST_ENV_FILE)) {
    content = fs.readFileSync(TEST_ENV_FILE, 'utf8');
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;

      const k = trimmed.substring(0, eqIndex).trim();
      let v = trimmed.substring(eqIndex + 1).trim();

      if ((v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }

      entries[k] = v;
    }
  }

  // Update the value
  entries[key] = value;

  // Write back
  const newContent = Object.entries(entries)
    .map(([k, v]) => `${k}="${v}"`)
    .join('\n') + '\n';

  fs.writeFileSync(TEST_ENV_FILE, newContent, 'utf8');
}
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
  // New user import private key URL
  return `chrome-extension://${extensionId}/index.html#/new-user/import/private-key`;
}

function getRabbyNoAddressUrl() {
  const extensionId = getRabbyExtensionId();
  if (!extensionId) throw new Error('Rabby extension not loaded');
  return `chrome-extension://${extensionId}/index.html#/no-address`;
}

/**
 * Handle Rabby welcome flow (Access All Dapps → Next → Get Started)
 */
async function handleWelcomeFlow(extensionPage) {
  const currentUrl = extensionPage.url();
  console.log(JSON.stringify({ status: 'info', message: `Checking welcome flow, current URL: ${currentUrl}` }));

  // Take screenshot to see current state
  await extensionPage.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'wallet-welcome-check.jpg'),
    type: 'jpeg',
    quality: 60
  });

  const content = await extensionPage.content();

  // Check if on "Access All Dapps" welcome page
  if (content.includes('Access All Dapps') || content.includes('Access all Dapps')) {
    console.log(JSON.stringify({ status: 'info', message: 'On "Access All Dapps" page, clicking Next...' }));

    const nextSelectors = [
      'button:has-text("Next")',
      'button:has-text("next")',
      'button:has-text("下一步")',
      '.ant-btn-primary',
      'button[type="button"]',
    ];

    for (const selector of nextSelectors) {
      try {
        const btn = await extensionPage.$(selector);
        if (btn && await btn.isVisible()) {
          await btn.click();
          console.log(JSON.stringify({ status: 'info', message: 'Clicked Next button' }));
          await extensionPage.waitForTimeout(2000);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    await extensionPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'wallet-welcome-after-next.jpg'),
      type: 'jpeg',
      quality: 60
    });
  }

  // Check for "Get Started" button (second page of welcome flow)
  const contentAfterNext = await extensionPage.content();
  if (contentAfterNext.includes('Get Started') || contentAfterNext.includes('Get started')) {
    console.log(JSON.stringify({ status: 'info', message: 'Found "Get Started" button, clicking...' }));

    const getStartedSelectors = [
      'button:has-text("Get Started")',
      'button:has-text("Get started")',
      'button:has-text("开始使用")',
      '.ant-btn-primary',
    ];

    for (const selector of getStartedSelectors) {
      try {
        const btn = await extensionPage.$(selector);
        if (btn && await btn.isVisible()) {
          await btn.click();
          console.log(JSON.stringify({ status: 'info', message: 'Clicked Get Started button' }));
          await extensionPage.waitForTimeout(2000);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    await extensionPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'wallet-welcome-after-getstarted.jpg'),
      type: 'jpeg',
      quality: 60
    });
  }

  // Check if landed on no-address page (no wallet imported)
  const urlAfterWelcome = extensionPage.url();
  const noAddressUrl = getRabbyNoAddressUrl();

  if (urlAfterWelcome.includes('#/no-address')) {
    console.log(JSON.stringify({
      status: 'info',
      message: 'On no-address page - no wallet imported yet, will redirect to import page'
    }));
    return 'NO_ADDRESS';
  }

  return 'CONTINUE';
}

/**
 * Import wallet using private key
 */
async function importWallet(extensionPage, privateKey, walletPassword) {
  console.log(JSON.stringify({ status: 'info', message: 'Starting wallet import flow...' }));

  // First, handle welcome flow if present
  const welcomeResult = await handleWelcomeFlow(extensionPage);
  console.log(JSON.stringify({ status: 'info', message: `Welcome flow result: ${welcomeResult}` }));

  // Get current URL after welcome flow
  let currentUrl = extensionPage.url();
  console.log(JSON.stringify({ status: 'info', message: `Current URL after welcome: ${currentUrl}` }));

  // If on no-address page, navigate directly to import private key page
  if (currentUrl.includes('#/no-address') || welcomeResult === 'NO_ADDRESS') {
    const importUrl = getRabbyImportPrivateKeyUrl();
    console.log(JSON.stringify({ status: 'info', message: `Navigating to import page: ${importUrl}` }));
    await extensionPage.goto(importUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await extensionPage.waitForTimeout(3000);
  } else {
    // Try to navigate to import page directly
    const importUrl = getRabbyImportPrivateKeyUrl();
    console.log(JSON.stringify({ status: 'info', message: `Navigating to import page: ${importUrl}` }));
    await extensionPage.goto(importUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await extensionPage.waitForTimeout(3000);
  }

  await extensionPage.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'wallet-init-import-page.jpg'),
    type: 'jpeg',
    quality: 60
  });

  currentUrl = extensionPage.url();
  console.log(JSON.stringify({ status: 'info', message: `Current URL: ${currentUrl}` }));

  // Handle old guide page flow (fallback for older versions)
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

    const importUrl = getRabbyImportPrivateKeyUrl();
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
    // Read sensitive values from .test-env file (NOT from environment variables)
    // This ensures secrets are not exposed to AI agent APIs or external processes
    const testEnv = readTestEnv();
    const privateKey = testEnv.WALLET_PRIVATE_KEY;

    if (!privateKey) {
      console.log(JSON.stringify({
        success: false,
        error: 'WALLET_PRIVATE_KEY not found in .test-env file',
        fix: 'Create or update the .test-env file in test-output directory:',
        file: TEST_ENV_FILE,
        example: 'WALLET_PRIVATE_KEY="0xYourPrivateKeyHere"'
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

    let walletPassword = testEnv.WALLET_PASSWORD;
    let passwordGenerated = false;

    if (!walletPassword) {
      walletPassword = generatePassword();
      // Save generated password to .test-env file for persistence across sessions
      writeTestEnv('WALLET_PASSWORD', walletPassword);
      passwordGenerated = true;
      console.log(JSON.stringify({
        status: 'info',
        message: 'Generated new wallet password (saved to .test-env file)'
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

      // Handle welcome flow first (Access All Dapps → Next → Get Started)
      const welcomeResult = await handleWelcomeFlow(extensionPage);
      console.log(JSON.stringify({ status: 'info', message: `Welcome flow result: ${welcomeResult}` }));

      // Re-check URL after welcome flow
      const urlAfterWelcome = extensionPage.url();
      console.log(JSON.stringify({ status: 'info', message: `URL after welcome flow: ${urlAfterWelcome}` }));

      // If on no-address page, treat as NEW_USER
      let state;
      if (urlAfterWelcome.includes('#/no-address') || welcomeResult === 'NO_ADDRESS') {
        state = WalletState.NEW_USER;
        console.log(JSON.stringify({ status: 'info', message: 'No wallet address found, treating as NEW_USER' }));
      } else {
        state = await detectWalletState(extensionPage);
      }
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

          if (!testEnv.WALLET_PASSWORD || passwordGenerated) {
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

// Export commands and utility functions
module.exports = commands;

// Also export test-env utilities for other skills that may need WALLET_PASSWORD
module.exports.readTestEnv = readTestEnv;
module.exports.writeTestEnv = writeTestEnv;
module.exports.TEST_ENV_FILE = TEST_ENV_FILE;
