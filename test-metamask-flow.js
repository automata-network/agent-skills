#!/usr/bin/env node
/**
 * Step-by-step MetaMask import flow analysis
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.resolve(process.cwd(), 'test-output');
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, 'screenshots');
const EXTENSIONS_DIR = path.join(OUTPUT_DIR, 'extensions');
const USER_DATA_DIR = path.join(OUTPUT_DIR, 'chrome-profile-test2');
const CDP_PORT = 9224;

// Test SRP for exploration only
const TEST_SRP = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

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
  await sleep(2000);

  let step = 1;
  const screenshot = async (name) => {
    const filename = `mm-flow-${step}-${name}.png`;
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, filename), fullPage: true });
    console.log(`Step ${step}: Screenshot saved - ${filename}`);
    step++;
  };

  // Step 1: Initial welcome screen
  await screenshot('welcome');

  // Analyze using Playwright locators (avoid $$eval due to LavaMoat)
  console.log('\n=== Step 1: Welcome Screen Analysis ===');

  // Check for "I have an existing wallet" button (new UI)
  const existingWalletBtn = page.locator('button:has-text("I have an existing wallet")');
  let hasNewUI = await existingWalletBtn.count() > 0;
  console.log('Has new UI "I have an existing wallet":', hasNewUI);

  // Check for old UI "Import an existing wallet"
  const oldImportBtn = page.locator('[data-testid="onboarding-import-wallet"]');
  const hasOldUI = await oldImportBtn.count() > 0;
  console.log('Has old UI "[data-testid=onboarding-import-wallet]":', hasOldUI);

  // Check for terms checkbox
  const termsCheckbox = page.locator('input[data-testid="onboarding-terms-checkbox"]');
  const hasTermsCheckbox = await termsCheckbox.count() > 0;
  console.log('Has terms checkbox:', hasTermsCheckbox);

  // Click on "I have an existing wallet" (new UI)
  if (hasNewUI) {
    console.log('\n=== Clicking "I have an existing wallet" ===');
    await existingWalletBtn.click();
    await sleep(2000);
    await screenshot('after-existing-wallet-click');

    // Check for terms/metrics page
    console.log('\n=== Step 2: After "I have an existing wallet" ===');

    // Look for various buttons
    const agreeBtn = page.locator('button:has-text("I agree")');
    const noThanksBtn = page.locator('button:has-text("No thanks")');
    const metametricsNoThanks = page.locator('[data-testid="metametrics-no-thanks"]');
    const metametricsAgree = page.locator('[data-testid="metametrics-i-agree"]');

    console.log('Button "I agree":', await agreeBtn.count() > 0);
    console.log('Button "No thanks":', await noThanksBtn.count() > 0);
    console.log('data-testid="metametrics-no-thanks":', await metametricsNoThanks.count() > 0);
    console.log('data-testid="metametrics-i-agree":', await metametricsAgree.count() > 0);

    // Try to click "No thanks" for metrics
    if (await metametricsNoThanks.count() > 0) {
      await metametricsNoThanks.click();
      await sleep(2000);
      await screenshot('after-no-thanks');
    } else if (await noThanksBtn.count() > 0) {
      await noThanksBtn.click();
      await sleep(2000);
      await screenshot('after-no-thanks');
    }
  } else if (hasOldUI) {
    // Handle old UI flow
    if (hasTermsCheckbox) {
      await termsCheckbox.click();
      await sleep(500);
    }
    await oldImportBtn.click();
    await sleep(2000);
    await screenshot('after-import-click');
  }

  // Now we should be on SRP input page
  console.log('\n=== Step 3: SRP Input Page ===');
  await screenshot('srp-input-page');

  // Check for SRP inputs
  const srpWord0 = page.locator('input[data-testid="import-srp__srp-word-0"]');
  const srpPaste = page.locator('[data-testid="import-srp__srp-paste"]');
  const hasWord0 = await srpWord0.count() > 0;
  const hasPaste = await srpPaste.count() > 0;

  console.log('SRP word input 0:', hasWord0);
  console.log('SRP paste toggle:', hasPaste);

  // Count all SRP word inputs
  let wordInputCount = 0;
  for (let i = 0; i < 24; i++) {
    const input = page.locator(`input[data-testid="import-srp__srp-word-${i}"]`);
    if (await input.count() > 0) wordInputCount++;
  }
  console.log('Total SRP word inputs found:', wordInputCount);

  // Check for confirm button
  const srpConfirm = page.locator('[data-testid="import-srp-confirm"]');
  console.log('SRP confirm button:', await srpConfirm.count() > 0);

  // Enter test SRP
  if (hasWord0) {
    console.log('\n=== Entering test SRP ===');
    const words = TEST_SRP.split(' ');
    for (let i = 0; i < words.length; i++) {
      const input = page.locator(`input[data-testid="import-srp__srp-word-${i}"]`);
      if (await input.count() > 0) {
        await input.fill(words[i]);
      }
    }
    await sleep(1000);
    await screenshot('srp-entered');

    // Click confirm
    if (await srpConfirm.count() > 0) {
      await srpConfirm.click();
      await sleep(2000);
      await screenshot('after-srp-confirm');
    }
  }

  // Password creation page
  console.log('\n=== Step 4: Password Creation Page ===');

  const newPasswordInput = page.locator('[data-testid="create-password-new"]');
  const confirmPasswordInput = page.locator('[data-testid="create-password-confirm"]');
  const passwordTerms = page.locator('[data-testid="create-password-terms"]');
  const importBtn = page.locator('[data-testid="create-password-import"]');

  console.log('New password input:', await newPasswordInput.count() > 0);
  console.log('Confirm password input:', await confirmPasswordInput.count() > 0);
  console.log('Password terms checkbox:', await passwordTerms.count() > 0);
  console.log('Import button:', await importBtn.count() > 0);

  if (await newPasswordInput.count() > 0) {
    const testPassword = 'TestPassword123!';
    await newPasswordInput.fill(testPassword);
    await confirmPasswordInput.fill(testPassword);
    if (await passwordTerms.count() > 0) {
      await passwordTerms.click();
    }
    await sleep(500);
    await screenshot('password-entered');

    if (await importBtn.count() > 0) {
      await importBtn.click();
      await sleep(4000);
      await screenshot('after-import');
    }
  }

  // Completion flow
  console.log('\n=== Step 5: Completion Flow ===');

  const completeDone = page.locator('[data-testid="onboarding-complete-done"]');
  const pinNext = page.locator('[data-testid="pin-extension-next"]');
  const pinDone = page.locator('[data-testid="pin-extension-done"]');

  console.log('Complete done button:', await completeDone.count() > 0);
  console.log('Pin extension next:', await pinNext.count() > 0);
  console.log('Pin extension done:', await pinDone.count() > 0);

  if (await completeDone.count() > 0) {
    await completeDone.click();
    await sleep(1000);
    await screenshot('after-complete-done');
  }

  if (await pinNext.count() > 0) {
    await pinNext.click();
    await sleep(1000);
    await screenshot('after-pin-next');
  }

  if (await pinDone.count() > 0) {
    await pinDone.click();
    await sleep(1000);
    await screenshot('after-pin-done');
  }

  // Main wallet page
  console.log('\n=== Step 6: Main Wallet Page ===');
  await screenshot('main-wallet');

  // Check for account menu (indicates wallet is ready)
  const accountMenu = page.locator('[data-testid="account-menu-icon"]');
  console.log('Account menu visible:', await accountMenu.count() > 0);

  // Check for "What\'s new" or other popups
  const whatsNewClose = page.locator('[data-testid="popover-close"]');
  if (await whatsNewClose.count() > 0) {
    await whatsNewClose.click();
    await sleep(500);
    await screenshot('after-close-popup');
  }

  // Now explore private key import flow
  console.log('\n=== Step 7: Import Private Key Account Flow ===');

  if (await accountMenu.count() > 0) {
    await accountMenu.click();
    await sleep(1000);
    await screenshot('account-menu-open');

    // Look for add account button
    const addAccountBtn = page.locator('[data-testid="multichain-account-menu-popover-action-button"]');
    console.log('Add account button:', await addAccountBtn.count() > 0);

    if (await addAccountBtn.count() > 0) {
      await addAccountBtn.click();
      await sleep(1000);
      await screenshot('add-account-menu');

      // Look for import account option
      const importAccountBtn = page.locator('[data-testid="multichain-account-menu-popover-add-imported-account"]');
      console.log('Import account button:', await importAccountBtn.count() > 0);

      if (await importAccountBtn.count() > 0) {
        await importAccountBtn.click();
        await sleep(1000);
        await screenshot('import-account-page');

        // Look for private key input
        const pkInput = page.locator('#private-key-box');
        const pkInput2 = page.locator('input[type="password"]');
        console.log('Private key input #private-key-box:', await pkInput.count() > 0);
        console.log('Password type inputs:', await pkInput2.count());

        // Look for import confirm button
        const importConfirm = page.locator('[data-testid="import-account-confirm-button"]');
        console.log('Import confirm button:', await importConfirm.count() > 0);
      }
    }
  }

  console.log('\n=== Analysis Complete ===');
  console.log('Screenshots saved to:', SCREENSHOTS_DIR);
  console.log('Browser will remain open for 30 seconds...');

  await sleep(30000);
  await context.close();
}

main().catch(console.error);
