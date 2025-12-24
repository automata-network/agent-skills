#!/usr/bin/env node
/**
 * Complete MetaMask import flow analysis - Updated for new UI
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.resolve(process.cwd(), 'test-output');
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, 'screenshots');
const EXTENSIONS_DIR = path.join(OUTPUT_DIR, 'extensions');
const USER_DATA_DIR = path.join(OUTPUT_DIR, 'chrome-profile-test3');
const CDP_PORT = 9225;

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
    const filename = `mm-complete-${step}-${name}.png`;
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, filename), fullPage: true });
    console.log(`Step ${step}: Screenshot saved - ${filename}`);
    step++;
  };

  // Step 1: Initial welcome screen
  console.log('\n=== Step 1: Welcome Screen ===');
  await screenshot('welcome');

  // Click "I have an existing wallet"
  const existingWalletBtn = page.locator('button:has-text("I have an existing wallet")');
  if (await existingWalletBtn.count() > 0) {
    console.log('Clicking "I have an existing wallet"...');
    await existingWalletBtn.click();
    await sleep(3000);
  }

  // Step 2: Sign in options page
  console.log('\n=== Step 2: Sign In Options Page ===');
  await screenshot('signin-options');

  // Click "Import using Secret Recovery Phrase"
  const importSRPBtn = page.locator('button:has-text("Import using Secret Recovery Phrase")');
  if (await importSRPBtn.count() > 0) {
    console.log('Found "Import using Secret Recovery Phrase" button');
    console.log('Clicking...');
    await importSRPBtn.click();
    await sleep(3000);
  } else {
    // Try alternative selector
    const importBtn = page.locator('button:has-text("Import")');
    if (await importBtn.count() > 0) {
      await importBtn.click();
      await sleep(3000);
    }
  }

  // Step 3: Metrics consent page
  console.log('\n=== Step 3: Metrics Consent Page ===');
  await screenshot('metrics-page');

  // Check for metrics buttons
  const noThanksBtn = page.locator('button:has-text("No thanks")');
  const iAgreeBtn = page.locator('button:has-text("I agree")');
  const metametricsNoThanks = page.locator('[data-testid="metametrics-no-thanks"]');
  const metametricsAgree = page.locator('[data-testid="metametrics-i-agree"]');

  console.log('Button "No thanks":', await noThanksBtn.count() > 0);
  console.log('Button "I agree":', await iAgreeBtn.count() > 0);
  console.log('data-testid="metametrics-no-thanks":', await metametricsNoThanks.count() > 0);
  console.log('data-testid="metametrics-i-agree":', await metametricsAgree.count() > 0);

  // Click "No thanks" for metrics
  if (await metametricsNoThanks.count() > 0) {
    await metametricsNoThanks.click();
    await sleep(2000);
  } else if (await noThanksBtn.count() > 0) {
    await noThanksBtn.click();
    await sleep(2000);
  }

  // Step 4: SRP Input Page
  console.log('\n=== Step 4: SRP Input Page ===');
  await screenshot('srp-input');

  // Analyze SRP input elements
  const srpWord0 = page.locator('input[data-testid="import-srp__srp-word-0"]');
  const srpConfirm = page.locator('[data-testid="import-srp-confirm"]');

  console.log('SRP word input 0:', await srpWord0.count() > 0);
  console.log('SRP confirm button:', await srpConfirm.count() > 0);

  // Count word inputs
  let wordCount = 0;
  for (let i = 0; i < 24; i++) {
    const input = page.locator(`input[data-testid="import-srp__srp-word-${i}"]`);
    if (await input.count() > 0) wordCount++;
  }
  console.log('Total SRP word inputs:', wordCount);

  // Enter test SRP
  if (await srpWord0.count() > 0) {
    console.log('Entering test SRP...');
    const words = TEST_SRP.split(' ');
    for (let i = 0; i < words.length && i < wordCount; i++) {
      const input = page.locator(`input[data-testid="import-srp__srp-word-${i}"]`);
      if (await input.count() > 0) {
        await input.fill(words[i]);
      }
    }
    await sleep(1000);
    await screenshot('srp-entered');

    // Click confirm
    if (await srpConfirm.count() > 0) {
      console.log('Clicking SRP confirm...');
      await srpConfirm.click();
      await sleep(3000);
    }
  }

  // Step 5: Password Creation Page
  console.log('\n=== Step 5: Password Creation Page ===');
  await screenshot('password-page');

  const newPasswordInput = page.locator('[data-testid="create-password-new"]');
  const confirmPasswordInput = page.locator('[data-testid="create-password-confirm"]');
  const passwordTerms = page.locator('[data-testid="create-password-terms"]');
  const importWalletBtn = page.locator('[data-testid="create-password-import"]');

  console.log('New password input:', await newPasswordInput.count() > 0);
  console.log('Confirm password input:', await confirmPasswordInput.count() > 0);
  console.log('Password terms checkbox:', await passwordTerms.count() > 0);
  console.log('Import button:', await importWalletBtn.count() > 0);

  if (await newPasswordInput.count() > 0) {
    console.log('Entering password...');
    await newPasswordInput.fill(TEST_PASSWORD);
    await confirmPasswordInput.fill(TEST_PASSWORD);
    if (await passwordTerms.count() > 0) {
      await passwordTerms.click();
    }
    await sleep(500);
    await screenshot('password-entered');

    if (await importWalletBtn.count() > 0) {
      console.log('Clicking import wallet...');
      await importWalletBtn.click();
      await sleep(5000);
    }
  }

  // Step 6: Completion Flow
  console.log('\n=== Step 6: Completion Flow ===');
  await screenshot('completion');

  const completeDone = page.locator('[data-testid="onboarding-complete-done"]');
  if (await completeDone.count() > 0) {
    console.log('Clicking complete done...');
    await completeDone.click();
    await sleep(2000);
    await screenshot('after-complete');
  }

  const pinNext = page.locator('[data-testid="pin-extension-next"]');
  if (await pinNext.count() > 0) {
    console.log('Clicking pin extension next...');
    await pinNext.click();
    await sleep(2000);
    await screenshot('after-pin-next');
  }

  const pinDone = page.locator('[data-testid="pin-extension-done"]');
  if (await pinDone.count() > 0) {
    console.log('Clicking pin extension done...');
    await pinDone.click();
    await sleep(2000);
  }

  // Step 7: Main Wallet Page
  console.log('\n=== Step 7: Main Wallet Page ===');
  await screenshot('main-wallet');

  // Close any popups
  const popoverClose = page.locator('[data-testid="popover-close"]');
  if (await popoverClose.count() > 0) {
    await popoverClose.click();
    await sleep(1000);
  }

  // Step 8: Import Private Key Account Flow
  console.log('\n=== Step 8: Import Private Key Account Flow ===');

  const accountMenu = page.locator('[data-testid="account-menu-icon"]');
  console.log('Account menu icon:', await accountMenu.count() > 0);

  if (await accountMenu.count() > 0) {
    console.log('Opening account menu...');
    await accountMenu.click();
    await sleep(1500);
    await screenshot('account-menu-open');

    // Analyze account menu elements
    const addAccountBtn = page.locator('[data-testid="multichain-account-menu-popover-action-button"]');
    console.log('Add account button:', await addAccountBtn.count() > 0);

    if (await addAccountBtn.count() > 0) {
      console.log('Clicking add account...');
      await addAccountBtn.click();
      await sleep(1500);
      await screenshot('add-account-options');

      // Analyze add account options
      const importAccountBtn = page.locator('[data-testid="multichain-account-menu-popover-add-imported-account"]');
      console.log('Import account option:', await importAccountBtn.count() > 0);

      if (await importAccountBtn.count() > 0) {
        console.log('Clicking import account...');
        await importAccountBtn.click();
        await sleep(1500);
        await screenshot('import-account-page');

        // Analyze import account page
        const pkInput = page.locator('#private-key-box');
        const importConfirm = page.locator('[data-testid="import-account-confirm-button"]');

        console.log('Private key input #private-key-box:', await pkInput.count() > 0);
        console.log('Import confirm button:', await importConfirm.count() > 0);

        // Try to find any input on the page
        const allInputs = page.locator('input');
        const inputCount = await allInputs.count();
        console.log('Total inputs on page:', inputCount);

        for (let i = 0; i < inputCount; i++) {
          const input = allInputs.nth(i);
          const type = await input.getAttribute('type');
          const id = await input.getAttribute('id');
          const testId = await input.getAttribute('data-testid');
          const placeholder = await input.getAttribute('placeholder');
          console.log(`  Input ${i}: type="${type}" id="${id}" testId="${testId}" placeholder="${placeholder}"`);
        }
      }
    }
  }

  console.log('\n=== Analysis Complete ===');
  console.log('Screenshots saved to:', SCREENSHOTS_DIR);
  console.log('\nSummary of UI Flow for MetaMask v13:');
  console.log('1. Welcome: "I have an existing wallet" button');
  console.log('2. Sign-in options: "Import using Secret Recovery Phrase" button');
  console.log('3. Metrics consent: "No thanks" or data-testid="metametrics-no-thanks"');
  console.log('4. SRP input: data-testid="import-srp__srp-word-{0-11}", confirm: data-testid="import-srp-confirm"');
  console.log('5. Password: data-testid="create-password-new/confirm/terms/import"');
  console.log('6. Completion: data-testid="onboarding-complete-done", "pin-extension-next/done"');
  console.log('7. Import PK: account menu -> add account -> import account -> #private-key-box');

  console.log('\nBrowser will remain open for 30 seconds...');
  await sleep(30000);
  await context.close();
}

main().catch(console.error);
