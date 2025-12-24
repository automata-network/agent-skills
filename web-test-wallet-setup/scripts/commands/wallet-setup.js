/**
 * Wallet Setup Commands
 * Handles MetaMask extension download and initialization
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const crypto = require("crypto");
const bip39 = require("bip39");

const { EXTENSIONS_DIR, SCREENSHOTS_DIR } = require("../lib/config");

// Local MetaMask zip path in assets directory
const METAMASK_LOCAL_ZIP = path.join(__dirname, "../../assets/metamask-chrome-13.13.1.zip");

// .test-env file path - stored in tests/ directory (persistent, not cleaned before tests)
const TEST_ENV_FILE = path.join(process.cwd(), "tests", ".test-env");

/**
 * Read sensitive values from .test-env file
 * @returns {Object} Object with WALLET_MNEMONIC, WALLET_PRIVATE_KEY and WALLET_PASSWORD
 */
function readTestEnv() {
  const result = {
    WALLET_MNEMONIC: null,
    WALLET_PRIVATE_KEY: null,
    WALLET_PASSWORD: null,
  };

  if (!fs.existsSync(TEST_ENV_FILE)) {
    return result;
  }

  try {
    const content = fs.readFileSync(TEST_ENV_FILE, "utf8");
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;

      const key = trimmed.substring(0, eqIndex).trim();
      let value = trimmed.substring(eqIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (
        key === "WALLET_MNEMONIC" ||
        key === "WALLET_PRIVATE_KEY" ||
        key === "WALLET_PASSWORD"
      ) {
        result[key] = value;
      }
    }
  } catch (e) {
    console.log(
      JSON.stringify({
        status: "warning",
        message: `Failed to read .test-env: ${e.message}`,
      })
    );
  }

  return result;
}

/**
 * Write or update a value in .test-env file
 */
function writeTestEnv(key, value) {
  // Ensure tests directory exists
  const testsDir = path.dirname(TEST_ENV_FILE);
  if (!fs.existsSync(testsDir)) {
    fs.mkdirSync(testsDir, { recursive: true });
  }

  const entries = {};

  if (fs.existsSync(TEST_ENV_FILE)) {
    const content = fs.readFileSync(TEST_ENV_FILE, "utf8");
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;

      const k = trimmed.substring(0, eqIndex).trim();
      let v = trimmed.substring(eqIndex + 1).trim();

      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }

      entries[k] = v;
    }
  }

  entries[key] = value;

  const newContent =
    Object.entries(entries)
      .map(([k, v]) => `${k}="${v}"`)
      .join("\n") + "\n";

  fs.writeFileSync(TEST_ENV_FILE, newContent, "utf8");
}

const {
  startBrowser,
  getContext,
  getMetaMaskExtensionId,
} = require("../lib/browser");

// Wallet states
const WalletState = {
  ONBOARDING: "ONBOARDING",
  LOCKED: "LOCKED",
  UNLOCKED: "UNLOCKED",
  UNKNOWN: "UNKNOWN",
};

/**
 * Generate a secure random password
 */
function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  const randomBytes = crypto.randomBytes(16);
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  return password;
}

/**
 * Generate a random 12-word mnemonic using BIP39
 * @returns {string} 12-word mnemonic phrase
 */
function generateMnemonic() {
  // 128 bits of entropy = 12 words
  return bip39.generateMnemonic(128);
}

/**
 * Detect the current MetaMask state
 * Updated for MetaMask v13 new UI
 */
async function detectMetaMaskState(page) {
  const url = page.url();
  const content = await page.content();

  // Check for onboarding page (v13 new UI)
  // New UI shows "I have an existing wallet" or "Create a new wallet"
  const hasNewWelcome =
    content.includes("I have an existing wallet") ||
    content.includes("Create a new wallet");

  // Old UI shows "Welcome to MetaMask"
  const hasOldWelcome = content.includes("Welcome to MetaMask");

  if (url.includes("onboarding") || hasNewWelcome || hasOldWelcome) {
    return WalletState.ONBOARDING;
  }

  // Check for locked state (password input with unlock)
  const hasPasswordInput = await page
    .$('#password, [data-testid="unlock-password"]')
    .catch(() => null);
  const hasUnlockButton =
    content.includes("Unlock") || content.includes("unlock");

  if (hasPasswordInput && hasUnlockButton) {
    return WalletState.LOCKED;
  }

  // Check for unlocked state (has account info)
  const hasAccountMenu = await page
    .$('[data-testid="account-menu-icon"]')
    .catch(() => null);
  const hasBalance = content.includes("ETH") || content.includes("Balance");

  if (hasAccountMenu || hasBalance) {
    return WalletState.UNLOCKED;
  }

  return WalletState.UNKNOWN;
}

/**
 * Helper to click if element is visible
 */
async function clickIfVisible(page, selector, description) {
  try {
    const el = await page.$(selector);
    if (el && await el.isVisible()) {
      await el.click();
      console.log(JSON.stringify({ status: "info", message: `Clicked: ${description}` }));
      return true;
    }
  } catch (e) {
    // Ignore errors
  }
  return false;
}

/**
 * Handle MetaMask special pages (consent, wallet ready, etc.)
 * These pages appear during and after onboarding
 */
async function handleSpecialPages(page) {
  const content = await page.content();
  let handled = false;

  // Handle "Help improve MetaMask" consent page
  if (content.includes('Help improve MetaMask') || content.includes('Gather basic usage data')) {
    if (await clickIfVisible(page, 'button:has-text("Continue")', 'Continue (consent)')) {
      await page.waitForTimeout(2000);
      handled = true;
    }
  }

  // Handle "Your wallet is ready!" page
  if (content.includes('Your wallet is ready') || content.includes('Open wallet')) {
    if (await clickIfVisible(page, 'button:has-text("Open wallet")', 'Open wallet')) {
      await page.waitForTimeout(2000);
      handled = true;
    }
  }

  // Handle onboarding complete button (Done)
  if (await clickIfVisible(page, '[data-testid="onboarding-complete-done"]', 'Done (onboarding complete)')) {
    await page.waitForTimeout(2000);
    handled = true;
  }

  // Handle pin extension page
  if (await clickIfVisible(page, '[data-testid="pin-extension-next"]', 'Pin extension next')) {
    await page.waitForTimeout(1000);
    handled = true;
  }
  if (await clickIfVisible(page, '[data-testid="pin-extension-done"]', 'Pin extension done')) {
    await page.waitForTimeout(1000);
    handled = true;
  }

  return handled;
}

/**
 * Handle MetaMask onboarding - Import wallet with mnemonic
 * Updated for MetaMask v13 new UI
 */
async function handleOnboarding(page, mnemonic, password) {
  console.log(
    JSON.stringify({
      status: "info",
      message: "Starting MetaMask onboarding (v13 UI)...",
    })
  );

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "metamask-onboarding-start.jpg"),
    type: "jpeg",
    quality: 60,
  });

  // Step 1: Welcome Page - Click "I have an existing wallet"
  // New UI: No terms checkbox, just two buttons
  console.log(
    JSON.stringify({ status: "info", message: "Step 1: Welcome page" })
  );

  // Try new UI first
  let existingWalletBtn = await page.$(
    'button:has-text("I have an existing wallet")'
  );
  if (existingWalletBtn && (await existingWalletBtn.isVisible())) {
    await existingWalletBtn.click();
    console.log(
      JSON.stringify({
        status: "info",
        message: 'Clicked "I have an existing wallet" (new UI)',
      })
    );
    await page.waitForTimeout(3000);
  } else {
    // Fallback to old UI
    try {
      const termsCheckbox = await page.$(
        'input[data-testid="onboarding-terms-checkbox"]'
      );
      if (termsCheckbox) {
        await termsCheckbox.click();
        await page.waitForTimeout(500);
      }
    } catch (e) {
      // Terms checkbox not found
    }

    const importSelectors = [
      '[data-testid="onboarding-import-wallet"]',
      'button:has-text("Import an existing wallet")',
      'button:has-text("Import")',
    ];

    for (const selector of importSelectors) {
      try {
        const btn = await page.$(selector);
        if (btn && (await btn.isVisible())) {
          await btn.click();
          console.log(
            JSON.stringify({
              status: "info",
              message: "Clicked Import wallet button (old UI)",
            })
          );
          await page.waitForTimeout(2000);
          break;
        }
      } catch (e) {
        continue;
      }
    }
  }

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "metamask-after-welcome.jpg"),
    type: "jpeg",
    quality: 60,
  });

  // Step 2: Sign-in Options Page (NEW in v13)
  // Click "Import using Secret Recovery Phrase"
  console.log(
    JSON.stringify({ status: "info", message: "Step 2: Sign-in options page" })
  );

  const importSRPBtn = await page.$(
    'button:has-text("Import using Secret Recovery Phrase")'
  );
  if (importSRPBtn && (await importSRPBtn.isVisible())) {
    await importSRPBtn.click();
    console.log(
      JSON.stringify({
        status: "info",
        message: 'Clicked "Import using Secret Recovery Phrase"',
      })
    );
    await page.waitForTimeout(3000);
  } else {
    // Maybe old UI, try metrics consent
    try {
      const noThanksBtn = await page.$('[data-testid="metametrics-no-thanks"]');
      if (noThanksBtn && (await noThanksBtn.isVisible())) {
        await noThanksBtn.click();
        console.log(
          JSON.stringify({
            status: "info",
            message: "Declined metrics (old UI)",
          })
        );
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      // Metrics dialog not found
    }
  }

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "metamask-srp-page.jpg"),
    type: "jpeg",
    quality: 60,
  });

  // Step 3: SRP Input Page
  // New UI uses a single textarea instead of 12 separate inputs
  // IMPORTANT: Must use keyboard.type() not fill() for proper event triggering
  console.log(
    JSON.stringify({ status: "info", message: "Step 3: SRP input page" })
  );

  const wordCount = mnemonic.split(" ").length;
  console.log(
    JSON.stringify({
      status: "info",
      message: `Using ${wordCount}-word mnemonic`,
    })
  );

  // Try new UI (single textarea)
  const srpTextarea = await page.$("textarea");
  if (srpTextarea && (await srpTextarea.isVisible())) {
    console.log(
      JSON.stringify({
        status: "info",
        message: `Using new UI textarea for SRP (${wordCount} words)`,
      })
    );
    await srpTextarea.click();
    await page.waitForTimeout(500);

    // Use keyboard.type() for proper event triggering
    await page.keyboard.type(mnemonic, { delay: 20 });
    console.log(
      JSON.stringify({
        status: "info",
        message: "Mnemonic entered via keyboard",
      })
    );
    await page.waitForTimeout(2000);

    // Click Continue button
    const continueBtn = await page.$('button:has-text("Continue")');
    if (continueBtn) {
      const isEnabled = await continueBtn.isEnabled();
      if (isEnabled) {
        await continueBtn.click();
        console.log(
          JSON.stringify({ status: "info", message: "Clicked Continue" })
        );
        await page.waitForTimeout(3000);
      } else {
        // Try pressing Tab to trigger validation
        await page.keyboard.press("Tab");
        await page.waitForTimeout(1000);
        await continueBtn.click({ force: true });
        await page.waitForTimeout(3000);
      }
    }
  } else {
    // Fallback to old UI (separate word inputs)
    console.log(
      JSON.stringify({ status: "info", message: "Using old UI for SRP input" })
    );
    const srpInputs = await page.$$(
      'input[data-testid^="import-srp__srp-word-"]'
    );
    const words = mnemonic.split(" ");

    if (srpInputs.length > 0) {
      // Fill as many words as there are inputs (12 or 24)
      const wordCount = Math.min(srpInputs.length, words.length);
      for (let i = 0; i < wordCount; i++) {
        await srpInputs[i].fill(words[i]);
      }
      console.log(
        JSON.stringify({
          status: "info",
          message: `SRP entered (old UI, ${wordCount} words)`,
        })
      );
    }

    await page.waitForTimeout(1000);

    const confirmBtn = await page.$('[data-testid="import-srp-confirm"]');
    if (confirmBtn) {
      await confirmBtn.click();
      console.log(JSON.stringify({ status: "info", message: "Confirmed SRP" }));
      await page.waitForTimeout(2000);
    }
  }

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "metamask-password-page.jpg"),
    type: "jpeg",
    quality: 60,
  });

  // Step 4: Password Creation Page
  // New UI: "MetaMask password" page with "Create password" button
  console.log(
    JSON.stringify({
      status: "info",
      message: "Step 4: Password creation page",
    })
  );

  let passwordSet = false;

  // Try new UI first (generic password inputs)
  const passwordInputs = await page.$$('input[type="password"]');
  if (passwordInputs.length >= 2) {
    console.log(
      JSON.stringify({ status: "info", message: "Using password inputs" })
    );

    // Click first input and type password
    await passwordInputs[0].click();
    await page.keyboard.type(password, { delay: 10 });

    // Click second input and type password
    await passwordInputs[1].click();
    await page.keyboard.type(password, { delay: 10 });

    passwordSet = true;
  } else {
    // Try old UI with data-testid
    const newPasswordInput = await page.$(
      '[data-testid="create-password-new"]'
    );
    const confirmPasswordInput = await page.$(
      '[data-testid="create-password-confirm"]'
    );

    if (newPasswordInput && confirmPasswordInput) {
      await newPasswordInput.fill(password);
      await confirmPasswordInput.fill(password);
      passwordSet = true;
    }
  }

  if (passwordSet) {
    await page.waitForTimeout(500);

    // Click checkbox (try multiple selectors)
    const checkboxSelectors = [
      'input[type="checkbox"]',
      '[data-testid="create-password-terms"]',
    ];

    for (const selector of checkboxSelectors) {
      try {
        const checkbox = await page.$(selector);
        if (checkbox && (await checkbox.isVisible())) {
          await checkbox.click();
          break;
        }
      } catch (e) {
        continue;
      }
    }

    await page.waitForTimeout(500);
    console.log(JSON.stringify({ status: "info", message: "Password set" }));

    // Click create/import button
    const buttonSelectors = [
      'button:has-text("Create password")',
      'button:has-text("Import my wallet")',
      '[data-testid="create-password-import"]',
      'button[type="submit"]',
    ];

    for (const selector of buttonSelectors) {
      try {
        const btn = await page.$(selector);
        if (btn && (await btn.isVisible())) {
          await btn.click();
          console.log(
            JSON.stringify({ status: "info", message: `Clicked ${selector}` })
          );
          await page.waitForTimeout(5000);
          break;
        }
      } catch (e) {
        continue;
      }
    }
  }

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "metamask-after-password.jpg"),
    type: "jpeg",
    quality: 60,
  });

  // Step 5: Complete onboarding (click through any remaining dialogs)
  console.log(
    JSON.stringify({ status: "info", message: "Step 5: Completing onboarding" })
  );

  const completionSelectors = [
    '[data-testid="onboarding-complete-done"]',
    'button:has-text("Got it")',
    'button:has-text("Done")',
    '[data-testid="pin-extension-next"]',
    '[data-testid="pin-extension-done"]',
    'button:has-text("Next")',
  ];

  for (const selector of completionSelectors) {
    try {
      const btn = await page.$(selector);
      if (btn && await btn.isVisible()) {
        // Check if button is enabled before clicking
        const isEnabled = await btn.isEnabled().catch(() => false);
        if (isEnabled) {
          await btn.click({ timeout: 5000 });
          console.log(
            JSON.stringify({ status: "info", message: `Clicked ${selector}` })
          );
          await page.waitForTimeout(2000);
        }
      }
    } catch (e) {
      // Skip if click fails
      continue;
    }
  }

  // Close any popups
  const closeSelectors = [
    '[data-testid="popover-close"]',
    'button[aria-label="Close"]',
  ];

  for (const selector of closeSelectors) {
    try {
      const btn = await page.$(selector);
      if (btn && await btn.isVisible()) {
        const isEnabled = await btn.isEnabled().catch(() => false);
        if (isEnabled) {
          await btn.click({ timeout: 5000 });
          await page.waitForTimeout(500);
        }
      }
    } catch (e) {
      continue;
    }
  }

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "metamask-after-dialogs.jpg"),
    type: "jpeg",
    quality: 60,
  });

  // Handle special pages that appear after onboarding (consent, wallet ready, etc.)
  console.log(
    JSON.stringify({ status: "info", message: "Handling post-onboarding pages..." })
  );

  for (let i = 0; i < 10; i++) {
    const handled = await handleSpecialPages(page);
    if (!handled) break;
    await page.waitForTimeout(1000);
  }

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "metamask-wallet-ready.jpg"),
    type: "jpeg",
    quality: 60,
  });

  console.log(
    JSON.stringify({
      status: "info",
      message: "Onboarding complete - wallet imported with mnemonic",
    })
  );
}

/**
 * Unlock MetaMask with password
 * Works with MetaMask v13 UI
 */
async function unlockMetaMask(page, password) {
  console.log(
    JSON.stringify({ status: "info", message: "Unlocking MetaMask..." })
  );

  // Try multiple selectors for password input
  const passwordInput = await page.$('#password, [data-testid="unlock-password"]');
  if (passwordInput && await passwordInput.isVisible()) {
    await passwordInput.click();
    await page.waitForTimeout(200);
    await page.keyboard.type(password, { delay: 10 });
    await page.waitForTimeout(500);
  }

  const unlockBtn = await page.$('[data-testid="unlock-submit"]');
  if (unlockBtn && await unlockBtn.isVisible()) {
    await unlockBtn.click();
    console.log(JSON.stringify({ status: "info", message: "Clicked unlock button" }));
    await page.waitForTimeout(3000);
  }

  // Handle any special pages that might appear after unlock
  await handleSpecialPages(page);

  // Verify unlocked
  const state = await detectMetaMaskState(page);
  return state === WalletState.UNLOCKED;
}

/**
 * Check if wallet is locked and unlock if needed
 * Returns true if unlock was performed
 */
async function checkAndUnlockIfNeeded(page, password) {
  // Try multiple selectors for password input
  const passwordSelectors = [
    '#password',
    '[data-testid="unlock-password"]',
    'input[type="password"]',
    'input[placeholder*="password"]',
  ];

  let passwordInput = null;
  for (const selector of passwordSelectors) {
    const input = await page.$(selector);
    if (input && await input.isVisible().catch(() => false)) {
      passwordInput = input;
      break;
    }
  }

  if (passwordInput) {
    console.log(JSON.stringify({ status: "info", message: "Wallet is locked, unlocking..." }));
    await passwordInput.click();
    await page.waitForTimeout(200);
    await page.keyboard.type(password, { delay: 10 });
    await page.waitForTimeout(500);

    // Try to click unlock button
    const unlockSelectors = [
      '[data-testid="unlock-submit"]',
      'button:has-text("Unlock")',
      'button[type="submit"]',
    ];

    for (const selector of unlockSelectors) {
      if (await clickIfVisible(page, selector, 'Unlock')) {
        await page.waitForTimeout(3000);
        break;
      }
    }
    return true;
  }
  return false;
}

/**
 * Import a private key as an additional account in MetaMask
 * Updated for MetaMask v13 UI - uses "Add wallet" -> "Import an account" flow
 * @param {Page} page - Playwright page object
 * @param {string} privateKey - Private key (with or without 0x prefix)
 * @param {string} extensionId - MetaMask extension ID
 * @param {string} password - Wallet password (needed if wallet is locked)
 */
async function importPrivateKeyAccount(page, privateKey, extensionId, password) {
  console.log(
    JSON.stringify({
      status: "info",
      message: "Importing private key account (v13 UI)...",
    })
  );

  // Navigate to home page first
  const homeUrl = `chrome-extension://${extensionId}/home.html`;
  await page.goto(homeUrl, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForTimeout(3000);

  // Handle any special pages and unlock if needed
  await handleSpecialPages(page);
  await checkAndUnlockIfNeeded(page, password);
  await handleSpecialPages(page);

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "metamask-before-import.jpg"),
    type: "jpeg",
    quality: 60,
  });

  // Navigate to account list page
  const accountListUrl = `chrome-extension://${extensionId}/home.html#account-list`;
  await page.goto(accountListUrl, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForTimeout(3000);

  // Handle special pages and unlock again after navigation
  await handleSpecialPages(page);
  await checkAndUnlockIfNeeded(page, password);

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "metamask-account-list.jpg"),
    type: "jpeg",
    quality: 60,
  });

  // Step 1: Click "Add wallet" button at bottom of account list (MetaMask v13)
  console.log(JSON.stringify({ status: "info", message: "Looking for Add wallet button..." }));

  let addWalletClicked = false;
  const addWalletBtn = await page.$('button:has-text("Add wallet")');
  if (addWalletBtn && await addWalletBtn.isVisible()) {
    await addWalletBtn.click();
    console.log(JSON.stringify({ status: "info", message: "Clicked Add wallet button" }));
    addWalletClicked = true;
    await page.waitForTimeout(2000);
  }

  if (!addWalletClicked) {
    // Fallback: try old UI selectors
    const fallbackSelectors = [
      'button:has-text("Add account or hardware wallet")',
      '[data-testid="multichain-account-menu-popover-action-button"]',
    ];
    for (const selector of fallbackSelectors) {
      const btn = await page.$(selector);
      if (btn && await btn.isVisible()) {
        await btn.click();
        console.log(JSON.stringify({ status: "info", message: `Clicked fallback: ${selector}` }));
        addWalletClicked = true;
        await page.waitForTimeout(2000);
        break;
      }
    }
  }

  if (!addWalletClicked) {
    throw new Error("Could not find Add wallet button");
  }

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "metamask-add-wallet-menu.jpg"),
    type: "jpeg",
    quality: 60,
  });

  // Step 2: Click "Import an account" in the popup menu (MetaMask v13)
  // Note: The text is "Import an account" not "Import account"
  console.log(JSON.stringify({ status: "info", message: "Looking for Import an account option..." }));

  let importClicked = false;

  // Try v13 UI first: "Import an account"
  const importAnAccountBtn = await page.$('button:has-text("Import an account")');
  if (importAnAccountBtn && await importAnAccountBtn.isVisible()) {
    await importAnAccountBtn.click();
    console.log(JSON.stringify({ status: "info", message: "Clicked Import an account" }));
    importClicked = true;
    await page.waitForTimeout(2000);
  }

  if (!importClicked) {
    // Try text selector - this works reliably in v13
    const textSelector = await page.$('text=Import an account');
    if (textSelector && await textSelector.isVisible()) {
      await textSelector.click();
      console.log(JSON.stringify({ status: "info", message: "Clicked Import an account (text)" }));
      importClicked = true;
      await page.waitForTimeout(2000);
    }
  }

  if (!importClicked) {
    // Try finding any element containing the text
    const elements = await page.$$('button, div[role="button"], span');
    for (const el of elements) {
      const text = await el.textContent().catch(() => '');
      if (text.includes('Import an account')) {
        await el.click();
        console.log(JSON.stringify({ status: "info", message: "Clicked Import an account (by text content)" }));
        importClicked = true;
        await page.waitForTimeout(2000);
        break;
      }
    }
  }

  if (!importClicked) {
    // Fallback: try old UI "Import account"
    const fallbackSelectors = [
      'button:has-text("Import account")',
      '[data-testid="multichain-account-menu-popover-add-imported-account"]',
    ];
    for (const selector of fallbackSelectors) {
      const btn = await page.$(selector);
      if (btn && await btn.isVisible()) {
        await btn.click();
        console.log(JSON.stringify({ status: "info", message: `Clicked fallback: ${selector}` }));
        importClicked = true;
        await page.waitForTimeout(2000);
        break;
      }
    }
  }

  if (!importClicked) {
    throw new Error("Could not find Import account option");
  }

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "metamask-import-private-key.jpg"),
    type: "jpeg",
    quality: 60,
  });

  // Step 3: Enter private key
  // Remove 0x prefix if present for consistency
  const cleanKey = privateKey.startsWith("0x")
    ? privateKey.slice(2)
    : privateKey;

  console.log(JSON.stringify({ status: "info", message: "Looking for private key input..." }));

  // MetaMask v13 uses #private-key-box
  const pkInputSelectors = [
    "#private-key-box",
    'input[type="password"]',
    'input[placeholder*="rivate"]',
    'input[id*="private"]',
  ];

  let pkEntered = false;
  for (const selector of pkInputSelectors) {
    const input = await page.$(selector);
    if (input && await input.isVisible()) {
      await input.click();
      await page.waitForTimeout(200);
      await page.keyboard.type(cleanKey, { delay: 10 });
      console.log(JSON.stringify({ status: "info", message: `Private key entered via ${selector}` }));
      pkEntered = true;
      await page.waitForTimeout(1000);
      break;
    }
  }

  if (!pkEntered) {
    throw new Error("Could not find private key input");
  }

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "metamask-pk-entered.jpg"),
    type: "jpeg",
    quality: 60,
  });

  // Step 4: Click Import button
  console.log(JSON.stringify({ status: "info", message: "Clicking Import button..." }));

  const importBtnSelectors = [
    '[data-testid="import-account-confirm-button"]',
    'button:has-text("Import")',
    'button[type="submit"]',
  ];

  let importSuccess = false;
  for (const selector of importBtnSelectors) {
    const btn = await page.$(selector);
    if (btn && await btn.isVisible()) {
      await btn.click();
      console.log(JSON.stringify({ status: "info", message: `Clicked import button: ${selector}` }));
      importSuccess = true;
      await page.waitForTimeout(3000);
      break;
    }
  }

  if (!importSuccess) {
    throw new Error("Could not find Import button");
  }

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "metamask-import-complete.jpg"),
    type: "jpeg",
    quality: 60,
  });

  // Verify import by checking for imported account
  await page.goto(accountListUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2000);
  await checkAndUnlockIfNeeded(page, password);

  const content = await page.content();
  const hasImportedAccount = content.includes('Imported') || content.includes('Account 2');

  if (hasImportedAccount) {
    console.log(JSON.stringify({
      status: "info",
      message: "Private key account imported and verified successfully",
    }));
  } else {
    console.log(JSON.stringify({
      status: "warning",
      message: "Import completed but could not verify imported account",
    }));
  }

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "metamask-final-verification.jpg"),
    type: "jpeg",
    quality: 60,
  });

  return true;
}

// MetaMask version to download
const METAMASK_VERSION = "v13.13.1";

const commands = {
  async "wallet-setup"(args) {
    try {
      if (!fs.existsSync(EXTENSIONS_DIR)) {
        fs.mkdirSync(EXTENSIONS_DIR, { recursive: true });
      }

      const metamaskPath = path.join(EXTENSIONS_DIR, "metamask");
      const metamaskZipPath = path.join(EXTENSIONS_DIR, "metamask.zip");

      if (fs.existsSync(path.join(metamaskPath, "manifest.json"))) {
        const manifest = JSON.parse(
          fs.readFileSync(path.join(metamaskPath, "manifest.json"), "utf8")
        );
        console.log(
          JSON.stringify({
            success: true,
            message: `MetaMask v${manifest.version} is already installed`,
            extensionPath: metamaskPath,
            note: "Use --force to reinstall",
          })
        );

        if (!args.includes("--force")) {
          return;
        }
        console.log(
          JSON.stringify({ status: "info", message: "Force reinstalling..." })
        );
      }

      // Use local zip file instead of downloading
      if (!fs.existsSync(METAMASK_LOCAL_ZIP)) {
        throw new Error(`MetaMask zip not found at: ${METAMASK_LOCAL_ZIP}. Please place metamask-chrome-13.13.1.zip in assets/ directory.`);
      }

      console.log(
        JSON.stringify({
          status: "info",
          message: `Using local MetaMask zip: ${METAMASK_LOCAL_ZIP}`,
        })
      );

      // Copy local zip to extensions directory
      fs.copyFileSync(METAMASK_LOCAL_ZIP, metamaskZipPath);

      if (fs.existsSync(metamaskPath)) {
        fs.rmSync(metamaskPath, { recursive: true, force: true });
      }

      console.log(
        JSON.stringify({ status: "info", message: "Extracting extension..." })
      );
      try {
        execSync(`unzip -o "${metamaskZipPath}" -d "${metamaskPath}"`, {
          stdio: "pipe",
        });
      } catch (e) {
        throw new Error(`Failed to extract extension: ${e.message}`);
      }

      fs.unlinkSync(metamaskZipPath);

      if (!fs.existsSync(path.join(metamaskPath, "manifest.json"))) {
        throw new Error(
          "Extension extraction failed - manifest.json not found"
        );
      }

      const manifest = JSON.parse(
        fs.readFileSync(path.join(metamaskPath, "manifest.json"), "utf8")
      );

      console.log(
        JSON.stringify({
          success: true,
          message: `MetaMask v${manifest.version} installed successfully`,
          extensionPath: metamaskPath,
          nextStep: "Run wallet-init to initialize your wallet",
        })
      );
    } catch (error) {
      console.log(
        JSON.stringify({
          success: false,
          error: `Failed to setup wallet: ${error.message}`,
          hint: "Make sure you have curl and unzip installed",
        })
      );
    }
  },

  async "wallet-init"(args, options) {
    const testEnv = readTestEnv();

    // WALLET_PRIVATE_KEY is required
    const privateKey = testEnv.WALLET_PRIVATE_KEY;
    if (!privateKey) {
      console.log(
        JSON.stringify({
          success: false,
          error: "WALLET_PRIVATE_KEY not found in .test-env file",
          fix: "Create or update the .test-env file in tests/ directory:",
          file: TEST_ENV_FILE,
          example: 'WALLET_PRIVATE_KEY="0xYourPrivateKeyHere"',
        })
      );
      process.exit(1);
    }

    // Validate private key format
    if (!/^(0x)?[a-fA-F0-9]{64}$/.test(privateKey)) {
      console.log(
        JSON.stringify({
          success: false,
          error:
            "Invalid private key format. Must be 64 hex characters (with optional 0x prefix)",
        })
      );
      return;
    }

    // Generate mnemonic if not exists
    let mnemonic = testEnv.WALLET_MNEMONIC;
    if (!mnemonic) {
      mnemonic = generateMnemonic();
      writeTestEnv("WALLET_MNEMONIC", mnemonic);
      console.log(
        JSON.stringify({
          status: "info",
          message: "Generated new 12-word mnemonic (saved to .test-env file)",
        })
      );
    } else {
      // Validate existing mnemonic
      const words = mnemonic.trim().split(/\s+/);
      if (![12, 15, 18, 21, 24].includes(words.length)) {
        console.log(
          JSON.stringify({
            success: false,
            error: `Invalid mnemonic format. Must be 12, 15, 18, 21, or 24 words. Got ${words.length} words.`,
          })
        );
        return;
      }
    }

    // Generate password if not exists
    let walletPassword = testEnv.WALLET_PASSWORD;
    if (!walletPassword) {
      walletPassword = generatePassword();
      writeTestEnv("WALLET_PASSWORD", walletPassword);
      console.log(
        JSON.stringify({
          status: "info",
          message: "Generated new wallet password (saved to .test-env file)",
        })
      );
    }

    try {
      if (!options.wallet) {
        console.log(
          JSON.stringify({
            success: false,
            error: "wallet-init requires --wallet flag",
            hint: "Run: node wallet-setup-helper.js wallet-init --wallet --headed",
          })
        );
        return;
      }

      await startBrowser(options);
      const context = getContext();

      console.log(
        JSON.stringify({
          status: "info",
          message: "Opening MetaMask extension page...",
        })
      );
      const extensionPage = await context.newPage();
      const extensionId = getMetaMaskExtensionId();

      if (!extensionId) {
        throw new Error(
          "MetaMask extension ID not detected. Make sure wallet-setup was run first."
        );
      }

      const homeUrl = `chrome-extension://${extensionId}/home.html`;
      console.log(
        JSON.stringify({ status: "info", message: `Extension URL: ${homeUrl}` })
      );

      await extensionPage.goto(homeUrl, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await extensionPage.waitForTimeout(3000);

      await extensionPage.screenshot({
        path: path.join(SCREENSHOTS_DIR, "metamask-init-state.jpg"),
        type: "jpeg",
        quality: 60,
      });

      const state = await detectMetaMaskState(extensionPage);
      console.log(
        JSON.stringify({
          status: "info",
          message: `Detected MetaMask state: ${state}`,
        })
      );

      let initSuccess = false;
      let steps = [];

      switch (state) {
        case WalletState.ONBOARDING:
          steps.push("detected_onboarding");
          await handleOnboarding(extensionPage, mnemonic, walletPassword);
          steps.push("completed_onboarding");
          initSuccess = true;
          break;

        case WalletState.LOCKED:
          steps.push("detected_locked");
          const unlocked = await unlockMetaMask(extensionPage, walletPassword);
          if (unlocked) {
            steps.push("unlock_success");
            initSuccess = true;
          } else {
            steps.push("unlock_failed");
            console.log(
              JSON.stringify({
                status: "error",
                message:
                  "Failed to unlock MetaMask. Password may be incorrect.",
              })
            );
          }
          break;

        case WalletState.UNLOCKED:
          steps.push("already_unlocked");
          initSuccess = true;
          break;

        case WalletState.UNKNOWN:
          steps.push("unknown_state");
          console.log(
            JSON.stringify({
              status: "warning",
              message: "Unknown MetaMask state. Attempting onboarding...",
            })
          );
          try {
            await handleOnboarding(extensionPage, mnemonic, walletPassword);
            steps.push("onboarding_attempted");
            initSuccess = true;
          } catch (e) {
            steps.push("onboarding_failed");
            console.log(
              JSON.stringify({
                status: "error",
                message: `Onboarding failed: ${e.message}`,
              })
            );
          }
          break;
      }

      await extensionPage.screenshot({
        path: path.join(SCREENSHOTS_DIR, "metamask-init-final.jpg"),
        type: "jpeg",
        quality: 60,
      });

      // If wallet initialization was successful, import the private key account
      if (initSuccess) {
        steps.push("importing_private_key");
        try {
          await importPrivateKeyAccount(extensionPage, privateKey, extensionId, walletPassword);
          steps.push("private_key_imported");
          console.log(
            JSON.stringify({
              success: true,
              message: "MetaMask wallet setup completed successfully",
              initialState: state,
              steps: steps,
              accounts: [
                "Account 1 (from mnemonic)",
                "Account 2 (imported from private key - active)",
              ],
              nextStep: "Use web-test-wallet-connect to connect wallet to DApp",
            })
          );
        } catch (importError) {
          steps.push("private_key_import_failed");
          console.log(
            JSON.stringify({
              success: false,
              error: `Private key import failed: ${importError.message}`,
              initialState: state,
              steps: steps,
              hint: "Wallet was created but private key import failed. Check screenshots.",
            })
          );
        }
      } else {
        console.log(
          JSON.stringify({
            success: false,
            error: "MetaMask initialization failed",
            initialState: state,
            steps: steps,
            hint: "Check screenshots in test-output/screenshots/ for details",
          })
        );
      }
    } catch (error) {
      console.log(
        JSON.stringify({
          success: false,
          error: `Wallet initialization failed: ${error.message}`,
          hint: "Make sure you ran wallet-setup first and the extension is installed",
        })
      );
    }
  },
};

// Export commands and utility functions
module.exports = commands;
module.exports.readTestEnv = readTestEnv;
module.exports.writeTestEnv = writeTestEnv;
module.exports.TEST_ENV_FILE = TEST_ENV_FILE;
