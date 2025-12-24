#!/usr/bin/env node
/**
 * Complete MetaMask v13 import flow - FINAL VERSION
 * Uses keyboard.type() instead of fill() for proper event triggering
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.resolve(process.cwd(), 'test-output');
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, 'screenshots');
const EXTENSIONS_DIR = path.join(OUTPUT_DIR, 'extensions');
const USER_DATA_DIR = path.join(OUTPUT_DIR, 'chrome-profile-test5');
const CDP_PORT = 9227;

// Test SRP for exploration only
const TEST_SRP = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const TEST_PASSWORD = 'TestPassword123!';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  // Clean previous test profile
  if (fs.existsSync(USER_DATA_DIR)) {
    fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
  }

  const metamaskPath = path.join(EXTENSIONS_DIR, 'metamask');

  console.log('Starting browser with MetaMask...');

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
    args: [
      '--no-first-run',
      '--disable-blink-features=AutomationControlled',
      `--disable-extensions-except=${path.resolve(metamaskPath)}`,
      `--load-extension=${path.resolve(metamaskPath)}`,
      `--remote-debugging-port=${CDP_PORT}`,
      '--disable-popup-blocking',
    ],
    ignoreDefaultArgs: ['--disable-extensions', '--enable-automation'],
    viewport: { width: 1920, height: 1080 },
  });

  // Get extension ID
  let extensionId = null;
  try {
    let sw = context.serviceWorkers()[0];
    if (!sw) {
      sw = await context.waitForEvent('serviceworker', { timeout: 15000 });
    }
    extensionId = sw.url().split('/')[2];
    console.log('Extension ID:', extensionId);
  } catch (e) {
    await sleep(3000);
    for (const p of context.pages()) {
      const url = p.url();
      if (url.startsWith('chrome-extension://')) {
        extensionId = url.split('/')[2];
        break;
      }
    }
  }

  if (!extensionId) {
    console.log('Failed to detect extension ID');
    await context.close();
    return;
  }

  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/home.html`, { waitUntil: 'load', timeout: 30000 });
  await sleep(3000);

  let step = 1;
  const screenshot = async (name) => {
    const filename = `mm-final-${step}-${name}.png`;
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, filename), fullPage: true });
    console.log(`Step ${step}: Screenshot saved - ${filename}`);
    step++;
  };

  // Step 1: Welcome Screen
  console.log('\n=== Step 1: Welcome Screen ===');
  await screenshot('welcome');

  const existingWalletBtn = page.locator('button:has-text("I have an existing wallet")');
  if (await existingWalletBtn.count() > 0) {
    console.log('Clicking "I have an existing wallet"...');
    await existingWalletBtn.click();
    await sleep(3000);
  }

  // Step 2: Sign-in Options
  console.log('\n=== Step 2: Sign-in Options ===');
  await screenshot('signin-options');

  const importSRPBtn = page.locator('button:has-text("Import using Secret Recovery Phrase")');
  if (await importSRPBtn.count() > 0) {
    console.log('Clicking "Import using Secret Recovery Phrase"...');
    await importSRPBtn.click();
    await sleep(3000);
  }

  // Step 3: SRP Input Page
  console.log('\n=== Step 3: SRP Input Page ===');
  await screenshot('srp-input');

  // Use keyboard.type() for proper event triggering
  const srpTextarea = page.locator('textarea');
  if (await srpTextarea.count() > 0) {
    console.log('Found textarea, clicking to focus...');
    await srpTextarea.click();
    await sleep(500);

    // Clear any existing content
    await page.keyboard.press('Control+a');
    await sleep(100);

    // Type SRP using keyboard
    console.log('Typing SRP...');
    await page.keyboard.type(TEST_SRP, { delay: 20 });
    await sleep(2000);

    await screenshot('srp-typed');

    // Check if Continue button is enabled
    const continueBtn = page.locator('button:has-text("Continue")');
    const isEnabled = await continueBtn.isEnabled();
    console.log('Continue button enabled:', isEnabled);

    if (isEnabled) {
      console.log('Clicking Continue...');
      await continueBtn.click();
      await sleep(3000);
    } else {
      // Try pressing Tab to trigger validation
      console.log('Continue not enabled, trying Tab to trigger validation...');
      await page.keyboard.press('Tab');
      await sleep(2000);

      const stillEnabled = await continueBtn.isEnabled();
      console.log('Continue button after Tab:', stillEnabled);

      if (stillEnabled) {
        await continueBtn.click();
        await sleep(3000);
      } else {
        // Try clicking the button anyway - sometimes disabled attribute is visual only
        console.log('Trying to click Continue anyway...');
        try {
          await continueBtn.click({ force: true });
          await sleep(3000);
        } catch (e) {
          console.log('Click failed:', e.message);
        }
      }
    }
  }

  // Step 4: Password Creation
  console.log('\n=== Step 4: Password Creation Page ===');
  await screenshot('password-page');

  // Try multiple selectors for password inputs
  let passwordFilled = false;

  // Option 1: data-testid selectors
  const newPasswordInput = page.locator('[data-testid="create-password-new"]');
  const confirmPasswordInput = page.locator('[data-testid="create-password-confirm"]');

  if (await newPasswordInput.count() > 0) {
    console.log('Using data-testid password inputs...');
    await newPasswordInput.click();
    await page.keyboard.type(TEST_PASSWORD, { delay: 10 });
    await confirmPasswordInput.click();
    await page.keyboard.type(TEST_PASSWORD, { delay: 10 });
    passwordFilled = true;
  }

  // Option 2: Generic password inputs
  if (!passwordFilled) {
    const passwordInputs = page.locator('input[type="password"]');
    const count = await passwordInputs.count();
    console.log('Password inputs found:', count);

    if (count >= 2) {
      console.log('Using generic password inputs...');
      await passwordInputs.nth(0).click();
      await page.keyboard.type(TEST_PASSWORD, { delay: 10 });
      await passwordInputs.nth(1).click();
      await page.keyboard.type(TEST_PASSWORD, { delay: 10 });
      passwordFilled = true;
    }
  }

  if (passwordFilled) {
    await sleep(500);

    // Check for terms checkbox
    const passwordTerms = page.locator('[data-testid="create-password-terms"]');
    const checkbox = page.locator('input[type="checkbox"]');

    if (await passwordTerms.count() > 0) {
      await passwordTerms.click();
    } else if (await checkbox.count() > 0) {
      await checkbox.first().click();
    }

    await sleep(500);
    await screenshot('password-filled');

    // Click import button
    const importBtn = page.locator('[data-testid="create-password-import"]');
    const submitBtn = page.locator('button[type="submit"]');
    const importTextBtn = page.locator('button:has-text("Import my wallet")');

    if (await importBtn.count() > 0) {
      console.log('Clicking import button (data-testid)...');
      await importBtn.click();
    } else if (await importTextBtn.count() > 0) {
      console.log('Clicking "Import my wallet"...');
      await importTextBtn.click();
    } else if (await submitBtn.count() > 0) {
      console.log('Clicking submit button...');
      await submitBtn.click();
    }

    await sleep(5000);
  }

  // Step 5: Completion Flow
  console.log('\n=== Step 5: Completion Flow ===');
  await screenshot('completion');

  // Handle completion dialogs with various selectors
  const completionSelectors = [
    '[data-testid="onboarding-complete-done"]',
    'button:has-text("Got it")',
    'button:has-text("Done")',
    '[data-testid="pin-extension-next"]',
    '[data-testid="pin-extension-done"]',
    'button:has-text("Next")',
  ];

  for (const selector of completionSelectors) {
    const btn = page.locator(selector);
    if (await btn.count() > 0 && await btn.isVisible()) {
      console.log(`Clicking ${selector}...`);
      await btn.click();
      await sleep(2000);
      await screenshot('after-click');
    }
  }

  // Step 6: Main Wallet Page
  console.log('\n=== Step 6: Main Wallet Page ===');
  await screenshot('main-wallet');

  // Close any popups
  const closeSelectors = [
    '[data-testid="popover-close"]',
    'button[aria-label="Close"]',
    '[data-testid="whats-new-popup-close"]',
  ];

  for (const selector of closeSelectors) {
    const btn = page.locator(selector);
    if (await btn.count() > 0) {
      await btn.click();
      await sleep(500);
    }
  }

  await screenshot('wallet-clean');

  // Step 7: Import Private Key Flow
  console.log('\n=== Step 7: Import Private Key Flow ===');

  const accountMenu = page.locator('[data-testid="account-menu-icon"]');
  if (await accountMenu.count() > 0) {
    console.log('Opening account menu...');
    await accountMenu.click();
    await sleep(1500);
    await screenshot('account-menu');

    // Add account
    const addAccountBtn = page.locator('[data-testid="multichain-account-menu-popover-action-button"]');
    if (await addAccountBtn.count() > 0) {
      console.log('Clicking add account...');
      await addAccountBtn.click();
      await sleep(1500);
      await screenshot('add-account-options');

      // Import account
      const importAccountBtn = page.locator('[data-testid="multichain-account-menu-popover-add-imported-account"]');
      if (await importAccountBtn.count() > 0) {
        console.log('Clicking import account...');
        await importAccountBtn.click();
        await sleep(1500);
        await screenshot('import-account-dialog');

        // Analyze the import dialog
        const pkInput = page.locator('#private-key-box');
        const pkInputAlt = page.locator('input[type="password"]');
        const importConfirm = page.locator('[data-testid="import-account-confirm-button"]');

        console.log('\n=== Import Account Dialog Analysis ===');
        console.log('#private-key-box found:', await pkInput.count() > 0);
        console.log('Password inputs:', await pkInputAlt.count());
        console.log('Import confirm button:', await importConfirm.count() > 0);
      }
    }
  }

  // Print final summary
  console.log('\n' + '='.repeat(70));
  console.log('METAMASK v13 UI SELECTOR SUMMARY');
  console.log('='.repeat(70));
  console.log(`
ONBOARDING FLOW:

1. WELCOME PAGE
   Selector: button:has-text("I have an existing wallet")

2. SIGN-IN OPTIONS PAGE
   Selector: button:has-text("Import using Secret Recovery Phrase")

3. SRP INPUT PAGE (NEW UI - IMPORTANT!)
   - Uses single TEXTAREA (not 12 separate inputs!)
   - Selector: textarea
   - Use keyboard.type() NOT fill() for proper event handling
   - After typing, Continue button should become enabled
   - Continue button selector: button:has-text("Continue")

4. PASSWORD CREATION PAGE
   - New password: [data-testid="create-password-new"] OR input[type="password"]:nth(0)
   - Confirm password: [data-testid="create-password-confirm"] OR input[type="password"]:nth(1)
   - Terms checkbox: [data-testid="create-password-terms"]
   - Import button: [data-testid="create-password-import"]

5. COMPLETION DIALOGS
   - Complete: [data-testid="onboarding-complete-done"]
   - Pin extension: [data-testid="pin-extension-next"], [data-testid="pin-extension-done"]

IMPORT PRIVATE KEY (after wallet setup):

1. Open account menu: [data-testid="account-menu-icon"]
2. Add account: [data-testid="multichain-account-menu-popover-action-button"]
3. Import account: [data-testid="multichain-account-menu-popover-add-imported-account"]
4. Private key input: #private-key-box
5. Confirm import: [data-testid="import-account-confirm-button"]
`);
  console.log('='.repeat(70));

  console.log('\nScreenshots saved to:', SCREENSHOTS_DIR);
  console.log('Browser will remain open for 60 seconds for manual inspection...');
  await sleep(60000);
  await context.close();
}

main().catch(console.error);
