/**
 * Test MetaMask unlock flow
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const EXTENSIONS_DIR = path.join(__dirname, 'test-output/extensions');
const SCREENSHOTS_DIR = path.join(__dirname, 'test-output/screenshots');
const USER_DATA_DIR = path.join(__dirname, 'test-output/chrome-profile');

// Load password from tests/.test-env
function loadTestEnv() {
  const testEnvPath = path.join(__dirname, 'tests', '.test-env');
  const config = {};
  if (fs.existsSync(testEnvPath)) {
    const content = fs.readFileSync(testEnvPath, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.trim().match(/^([A-Z_]+)=["']?(.+?)["']?$/);
      if (match) config[match[1]] = match[2];
    }
  }
  return config;
}

async function main() {
  const testEnv = loadTestEnv();
  const password = testEnv.WALLET_PASSWORD;

  if (!password) {
    console.log('ERROR: WALLET_PASSWORD not found in tests/.test-env');
    process.exit(1);
  }
  console.log('Password loaded from tests/.test-env');

  const metamaskPath = path.join(EXTENSIONS_DIR, 'metamask');

  // Launch browser with MetaMask
  console.log('Starting browser with MetaMask extension...');
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
    args: [
      '--no-first-run',
      `--disable-extensions-except=${metamaskPath}`,
      `--load-extension=${metamaskPath}`,
    ],
    ignoreDefaultArgs: ['--disable-extensions', '--enable-automation'],
  });

  // Wait for extension to load
  let extensionId = null;
  try {
    let sw = context.serviceWorkers()[0];
    if (!sw) sw = await context.waitForEvent('serviceworker', { timeout: 10000 });
    extensionId = sw.url().split('/')[2];
    console.log('Extension ID:', extensionId);
  } catch (e) {
    console.log('ERROR: Could not get extension ID');
    await context.close();
    process.exit(1);
  }

  // Open MetaMask home page
  const metamaskUrl = `chrome-extension://${extensionId}/home.html`;
  const page = await context.newPage();
  console.log('Navigating to MetaMask:', metamaskUrl);
  await page.goto(metamaskUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Take initial screenshot
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'unlock-step1-initial.jpg'), type: 'jpeg', quality: 80 });

  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);

  // Check if it's unlock page
  const isUnlockPage = currentUrl.includes('unlock');
  console.log('Is unlock page:', isUnlockPage);

  if (!isUnlockPage) {
    if (currentUrl.includes('onboarding') || currentUrl.includes('welcome')) {
      console.log('MetaMask not initialized. Need to run wallet-setup first.');
    } else {
      console.log('MetaMask is already unlocked!');
    }
    await context.close();
    return;
  }

  console.log('\n=== Starting unlock process ===');

  // Step 1: Find password input using placeholder
  console.log('Step 1: Finding password input...');
  const passwordInput = await page.$('input[type="password"]');

  if (!passwordInput) {
    console.log('ERROR: Password input not found');
    await context.close();
    process.exit(1);
  }
  console.log('Password input found');

  // Step 2: Fill password using keyboard (more reliable)
  console.log('Step 2: Filling password...');
  await passwordInput.click();
  await page.waitForTimeout(200);
  await page.keyboard.type(password, { delay: 50 });
  await page.waitForTimeout(500);

  // Take screenshot after password entry
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'unlock-step2-password-entered.jpg'), type: 'jpeg', quality: 80 });
  console.log('Password entered');

  // Step 3: Find and click Unlock button
  console.log('Step 3: Finding Unlock button...');

  // Try multiple selectors for the unlock button
  const unlockSelectors = [
    'button[data-testid="unlock-submit"]',
    'button:has-text("Unlock")',
    'button.unlock-btn',
    'button[type="submit"]'
  ];

  let unlockBtn = null;
  for (const selector of unlockSelectors) {
    unlockBtn = await page.$(selector);
    if (unlockBtn) {
      const isVisible = await unlockBtn.isVisible().catch(() => false);
      const isEnabled = await unlockBtn.isEnabled().catch(() => false);
      console.log(`Found button with selector "${selector}" - visible: ${isVisible}, enabled: ${isEnabled}`);
      if (isVisible && isEnabled) {
        break;
      }
      unlockBtn = null;
    }
  }

  if (!unlockBtn) {
    console.log('ERROR: Unlock button not found or not clickable');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'unlock-error-no-button.jpg'), type: 'jpeg', quality: 80 });
    await context.close();
    process.exit(1);
  }

  console.log('Step 4: Clicking Unlock button...');
  await unlockBtn.click();
  await page.waitForTimeout(3000);

  // Take screenshot after clicking
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'unlock-step3-after-click.jpg'), type: 'jpeg', quality: 80 });

  // Step 5: Verify unlock success
  console.log('Step 5: Verifying unlock...');
  const newUrl = page.url();
  console.log('URL after unlock:', newUrl);

  // Check if still has password input
  const stillLocked = await page.$('input[type="password"]');

  if (stillLocked && newUrl.includes('unlock')) {
    console.log('FAILED: MetaMask still locked!');
    // Check for error message
    const errorMsg = await page.$('.mm-form-text-field__error-wrapper');
    if (errorMsg) {
      const errorText = await errorMsg.textContent().catch(() => '');
      console.log('Error message:', errorText);
    }
    await context.close();
    process.exit(1);
  }

  console.log('\n=== SUCCESS: MetaMask unlocked! ===');

  // Take final screenshot
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'unlock-step4-success.jpg'), type: 'jpeg', quality: 80 });

  await context.close();
  console.log('Test completed successfully');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
