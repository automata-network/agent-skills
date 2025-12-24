/**
 * Wallet Setup Commands
 * Handles MetaMask extension download and initialization
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const crypto = require("crypto");

const { EXTENSIONS_DIR, SCREENSHOTS_DIR } = require("../lib/config");

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
    .$('input[type="password"]')
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
      if (btn && (await btn.isVisible())) {
        await btn.click();
        console.log(
          JSON.stringify({ status: "info", message: `Clicked ${selector}` })
        );
        await page.waitForTimeout(2000);
      }
    } catch (e) {
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
      if (btn && (await btn.isVisible())) {
        await btn.click();
        await page.waitForTimeout(500);
      }
    } catch (e) {
      continue;
    }
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
 */
async function unlockMetaMask(page, password) {
  console.log(
    JSON.stringify({ status: "info", message: "Unlocking MetaMask..." })
  );

  const passwordInput = await page.$('input[data-testid="unlock-password"]');
  if (passwordInput) {
    await passwordInput.fill(password);
  }

  const unlockBtn = await page.$('[data-testid="unlock-submit"]');
  if (unlockBtn) {
    await unlockBtn.click();
    await page.waitForTimeout(2000);
  }

  // Verify unlocked
  const state = await detectMetaMaskState(page);
  return state === WalletState.UNLOCKED;
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

      const version = METAMASK_VERSION;
      const versionNum = version.replace("v", "");
      const downloadUrl = `https://github.com/MetaMask/metamask-extension/releases/download/${version}/metamask-chrome-${versionNum}.zip`;

      console.log(
        JSON.stringify({
          status: "info",
          message: `Downloading MetaMask ${version}...`,
          url: downloadUrl,
        })
      );

      try {
        execSync(`curl -L -o "${metamaskZipPath}" "${downloadUrl}"`, {
          stdio: "pipe",
        });
      } catch (e) {
        throw new Error(`Failed to download extension: ${e.message}`);
      }

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
    const mnemonic = testEnv.WALLET_MNEMONIC;

    if (!mnemonic) {
      console.log(
        JSON.stringify({
          success: false,
          error: "WALLET_MNEMONIC not found in .test-env file",
          fix: "Create or update the .test-env file in tests/ directory:",
          file: TEST_ENV_FILE,
          example: 'WALLET_MNEMONIC="word1 word2 word3 ... word12"',
        })
      );
      process.exit(1);
    }

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

    let walletPassword = testEnv.WALLET_PASSWORD;
    let passwordGenerated = false;

    if (!walletPassword) {
      walletPassword = generatePassword();
      writeTestEnv("WALLET_PASSWORD", walletPassword);
      passwordGenerated = true;
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

      if (initSuccess) {
        console.log(
          JSON.stringify({
            success: true,
            message: "MetaMask initialization completed successfully",
            initialState: state,
            steps: steps,
            nextStep: "Use web-test-wallet-connect to connect wallet to DApp",
          })
        );
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
