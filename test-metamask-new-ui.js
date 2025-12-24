#!/usr/bin/env node
/**
 * Complete MetaMask v13 import flow with NEW UI
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.resolve(process.cwd(), 'test-output');
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, 'screenshots');
const EXTENSIONS_DIR = path.join(OUTPUT_DIR, 'extensions');
const USER_DATA_DIR = path.join(OUTPUT_DIR, 'chrome-profile-test4');
const CDP_PORT = 9226;

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
    const filename = `mm-newui-${step}-${name}.png`;
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, filename), fullPage: true });
    console.log(`Step ${step}: Screenshot saved - ${filename}`);
    step++;
  };

  // Step 1: Welcome Screen - Click "I have an existing wallet"
  console.log('\n=== Step 1: Welcome Screen ===');
  await screenshot('welcome');

  const existingWalletBtn = page.locator('button:has-text("I have an existing wallet")');
  if (await existingWalletBtn.count() > 0) {
    console.log('Clicking "I have an existing wallet"...');
    await existingWalletBtn.click();
    await sleep(3000);
  }

  // Step 2: Sign-in Options - Click "Import using Secret Recovery Phrase"
  console.log('\n=== Step 2: Sign-in Options ===');
  await screenshot('signin-options');

  const importSRPBtn = page.locator('button:has-text("Import using Secret Recovery Phrase")');
  if (await importSRPBtn.count() > 0) {
    console.log('Clicking "Import using Secret Recovery Phrase"...');
    await importSRPBtn.click();
    await sleep(3000);
  }

  // Step 3: SRP Input Page (NEW UI - single textarea)
  console.log('\n=== Step 3: SRP Input Page (NEW UI) ===');
  await screenshot('srp-input-new');

  // Look for the textarea - it's a new UI element
  // The textarea has placeholder: "Add a space between each word and make sure no one is watching."
  const srpTextarea = page.locator('textarea');
  const srpTextareaCount = await srpTextarea.count();
  console.log('Textarea count:', srpTextareaCount);

  // Also try to find input with the placeholder
  const srpInput = page.locator('input[placeholder*="space between each word"]');
  const srpInputCount = await srpInput.count();
  console.log('SRP input with placeholder:', srpInputCount);

  // Try contenteditable div
  const contentEditable = page.locator('[contenteditable="true"]');
  const contentEditableCount = await contentEditable.count();
  console.log('ContentEditable div count:', contentEditableCount);

  // Find the text input area - it might be a custom component
  // Let's try clicking in the area and typing
  const srpContainer = page.locator('text="Add a space between each word"').locator('..');
  console.log('SRP container found:', await srpContainer.count() > 0);

  // Try different selectors for the SRP input
  let srpElement = null;

  // Option 1: textarea
  if (srpTextareaCount > 0) {
    srpElement = srpTextarea.first();
    console.log('Using textarea');
  }

  // Option 2: input
  if (!srpElement && srpInputCount > 0) {
    srpElement = srpInput.first();
    console.log('Using input');
  }

  // Option 3: contenteditable
  if (!srpElement && contentEditableCount > 0) {
    srpElement = contentEditable.first();
    console.log('Using contenteditable');
  }

  // Option 4: Find by class or role
  if (!srpElement) {
    const textbox = page.locator('[role="textbox"]');
    if (await textbox.count() > 0) {
      srpElement = textbox.first();
      console.log('Using role=textbox');
    }
  }

  // Option 5: Find input in the form area
  if (!srpElement) {
    const formInput = page.locator('form input, form textarea');
    if (await formInput.count() > 0) {
      srpElement = formInput.first();
      console.log('Using form input');
    }
  }

  // Option 6: Click in the gray area and type
  if (!srpElement) {
    // Try to click on the placeholder text area
    const placeholderArea = page.locator('text="Add a space between each word and make sure no one is watching."');
    if (await placeholderArea.count() > 0) {
      console.log('Clicking on placeholder text area...');
      await placeholderArea.click();
      await sleep(500);

      // Now try to type directly
      await page.keyboard.type(TEST_SRP);
      await sleep(1000);
      await screenshot('srp-after-type');
    }
  }

  if (srpElement) {
    console.log('Entering SRP...');
    await srpElement.click();
    await srpElement.fill(TEST_SRP);
    await sleep(1000);
    await screenshot('srp-entered');
  }

  // Find and click Continue button
  const continueBtn = page.locator('button:has-text("Continue")');
  if (await continueBtn.count() > 0) {
    const isEnabled = await continueBtn.isEnabled();
    console.log('Continue button enabled:', isEnabled);
    if (isEnabled) {
      console.log('Clicking Continue...');
      await continueBtn.click();
      await sleep(3000);
    }
  }

  // Also check for old-style confirm button
  const srpConfirm = page.locator('[data-testid="import-srp-confirm"]');
  if (await srpConfirm.count() > 0) {
    console.log('Found old-style SRP confirm button');
    await srpConfirm.click();
    await sleep(3000);
  }

  // Step 4: Password Creation Page
  console.log('\n=== Step 4: Password Creation Page ===');
  await screenshot('password-page');

  // Check for password inputs
  const passwordInputs = page.locator('input[type="password"]');
  const passwordCount = await passwordInputs.count();
  console.log('Password inputs found:', passwordCount);

  // New UI might have different structure
  const newPasswordInput = page.locator('[data-testid="create-password-new"]');
  const confirmPasswordInput = page.locator('[data-testid="create-password-confirm"]');
  const passwordTerms = page.locator('[data-testid="create-password-terms"]');
  const importWalletBtn = page.locator('[data-testid="create-password-import"]');

  console.log('data-testid="create-password-new":', await newPasswordInput.count() > 0);
  console.log('data-testid="create-password-confirm":', await confirmPasswordInput.count() > 0);

  // Try new-style password inputs
  if (await newPasswordInput.count() > 0) {
    console.log('Using data-testid password inputs...');
    await newPasswordInput.fill(TEST_PASSWORD);
    await confirmPasswordInput.fill(TEST_PASSWORD);
    if (await passwordTerms.count() > 0) {
      await passwordTerms.click();
    }
    await sleep(500);
    await screenshot('password-entered');

    if (await importWalletBtn.count() > 0) {
      await importWalletBtn.click();
      await sleep(5000);
    }
  } else if (passwordCount >= 2) {
    // Fallback: use password inputs by index
    console.log('Using password inputs by index...');
    const pw1 = passwordInputs.nth(0);
    const pw2 = passwordInputs.nth(1);
    await pw1.fill(TEST_PASSWORD);
    await pw2.fill(TEST_PASSWORD);
    await sleep(500);
    await screenshot('password-entered');

    // Find checkbox
    const checkbox = page.locator('input[type="checkbox"]');
    if (await checkbox.count() > 0) {
      await checkbox.first().click();
    }

    // Find submit button
    const submitBtn = page.locator('button[type="submit"], button:has-text("Import")');
    if (await submitBtn.count() > 0) {
      await submitBtn.first().click();
      await sleep(5000);
    }
  }

  // Step 5: Completion Flow
  console.log('\n=== Step 5: Completion Flow ===');
  await screenshot('completion');

  // Handle various completion dialogs
  const completeDone = page.locator('[data-testid="onboarding-complete-done"]');
  const gotItBtn = page.locator('button:has-text("Got it")');
  const nextBtn = page.locator('button:has-text("Next")');
  const doneBtn = page.locator('button:has-text("Done")');

  if (await completeDone.count() > 0) {
    console.log('Clicking complete done...');
    await completeDone.click();
    await sleep(2000);
  }

  if (await gotItBtn.count() > 0) {
    console.log('Clicking Got it...');
    await gotItBtn.click();
    await sleep(2000);
  }

  await screenshot('after-complete');

  // Pin extension dialogs
  const pinNext = page.locator('[data-testid="pin-extension-next"]');
  const pinDone = page.locator('[data-testid="pin-extension-done"]');

  if (await pinNext.count() > 0) {
    await pinNext.click();
    await sleep(1000);
  }

  if (await pinDone.count() > 0) {
    await pinDone.click();
    await sleep(1000);
  }

  // Also try generic Next/Done buttons
  if (await nextBtn.count() > 0) {
    await nextBtn.first().click();
    await sleep(1000);
  }

  if (await doneBtn.count() > 0) {
    await doneBtn.first().click();
    await sleep(1000);
  }

  // Step 6: Main Wallet Page
  console.log('\n=== Step 6: Main Wallet Page ===');
  await screenshot('main-wallet');

  // Close any popups
  const popoverClose = page.locator('[data-testid="popover-close"]');
  const closeBtn = page.locator('button[aria-label="Close"]');

  if (await popoverClose.count() > 0) {
    await popoverClose.click();
    await sleep(500);
  }

  if (await closeBtn.count() > 0) {
    await closeBtn.first().click();
    await sleep(500);
  }

  await screenshot('wallet-ready');

  // Step 7: Explore Import Private Key flow
  console.log('\n=== Step 7: Import Private Key Flow ===');

  const accountMenu = page.locator('[data-testid="account-menu-icon"]');
  console.log('Account menu icon:', await accountMenu.count() > 0);

  if (await accountMenu.count() > 0) {
    await accountMenu.click();
    await sleep(1500);
    await screenshot('account-menu-open');

    // Look for Add account option
    const addAccountBtn = page.locator('[data-testid="multichain-account-menu-popover-action-button"]');
    const addAccountText = page.locator('button:has-text("Add account")');

    if (await addAccountBtn.count() > 0) {
      await addAccountBtn.click();
      await sleep(1500);
      await screenshot('add-account-menu');

      // Look for Import account
      const importAccountBtn = page.locator('[data-testid="multichain-account-menu-popover-add-imported-account"]');
      const importAccountText = page.locator('button:has-text("Import account")');

      if (await importAccountBtn.count() > 0) {
        await importAccountBtn.click();
        await sleep(1500);
        await screenshot('import-account-dialog');

        // Analyze import account page
        console.log('Analyzing import account dialog...');

        const pkInput = page.locator('#private-key-box');
        const pkInputAlt = page.locator('input[type="password"]');
        const importConfirm = page.locator('[data-testid="import-account-confirm-button"]');

        console.log('#private-key-box:', await pkInput.count() > 0);
        console.log('password inputs:', await pkInputAlt.count());
        console.log('import confirm button:', await importConfirm.count() > 0);
      } else if (await importAccountText.count() > 0) {
        await importAccountText.click();
        await sleep(1500);
        await screenshot('import-account-dialog');
      }
    } else if (await addAccountText.count() > 0) {
      await addAccountText.click();
      await sleep(1500);
      await screenshot('add-account-menu');
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('METAMASK v13 NEW UI FLOW SUMMARY');
  console.log('='.repeat(60));
  console.log(`
1. WELCOME SCREEN
   - Button: "I have an existing wallet" (text selector)
   - Button: "Create a new wallet" (text selector)

2. SIGN-IN OPTIONS
   - Button: "Sign in with Google" (text selector)
   - Button: "Sign in with Apple" (text selector)
   - Button: "Import using Secret Recovery Phrase" (text selector) <-- CLICK THIS

3. SRP INPUT PAGE (NEW UI)
   - Title: "Import a wallet"
   - Single textarea for SRP (NOT 12 separate inputs)
   - Placeholder: "Add a space between each word and make sure no one is watching."
   - "Paste" link
   - Button: "Continue" (enabled after valid SRP entered)

4. PASSWORD CREATION
   - data-testid="create-password-new"
   - data-testid="create-password-confirm"
   - data-testid="create-password-terms" (checkbox)
   - data-testid="create-password-import" (submit button)

5. COMPLETION DIALOGS
   - data-testid="onboarding-complete-done"
   - data-testid="pin-extension-next"
   - data-testid="pin-extension-done"
   - "Got it" / "Next" / "Done" buttons

6. IMPORT PRIVATE KEY (after wallet setup)
   - data-testid="account-menu-icon" (open menu)
   - data-testid="multichain-account-menu-popover-action-button" (add account)
   - data-testid="multichain-account-menu-popover-add-imported-account" (import)
   - #private-key-box (private key input)
   - data-testid="import-account-confirm-button" (confirm)
`);
  console.log('='.repeat(60));

  console.log('\nBrowser will remain open for 30 seconds...');
  await sleep(30000);
  await context.close();
}

main().catch(console.error);
