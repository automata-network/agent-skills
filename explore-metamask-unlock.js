/**
 * Explore MetaMask unlock UI
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
  console.log('Password loaded:', password ? 'Yes' : 'No');

  const metamaskPath = path.join(EXTENSIONS_DIR, 'metamask');

  // Launch browser with MetaMask
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
    console.log('Could not get extension ID from service worker');
  }

  // Open MetaMask home page
  const metamaskUrl = `chrome-extension://${extensionId}/home.html`;
  const page = await context.newPage();
  await page.goto(metamaskUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Take screenshot of current state
  const screenshotPath = path.join(SCREENSHOTS_DIR, 'metamask-state-1.jpg');
  await page.screenshot({ path: screenshotPath, type: 'jpeg', quality: 80 });
  console.log('Screenshot saved:', screenshotPath);

  // Check current URL
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);

  // Analyze page elements
  console.log('\n--- Analyzing page elements ---');

  // Check for password input
  const passwordInputs = await page.$$('input[type="password"]');
  console.log('Password inputs found:', passwordInputs.length);

  // Get all input elements
  const inputs = await page.$$eval('input', els => els.map(el => ({
    type: el.type,
    id: el.id,
    name: el.name,
    placeholder: el.placeholder,
    'data-testid': el.getAttribute('data-testid'),
    className: el.className
  })));
  console.log('All inputs:', JSON.stringify(inputs, null, 2));

  // Get all buttons
  const buttons = await page.$$eval('button', els => els.map(el => ({
    text: el.textContent?.trim().substring(0, 50),
    id: el.id,
    'data-testid': el.getAttribute('data-testid'),
    className: el.className?.substring(0, 100),
    disabled: el.disabled
  })));
  console.log('All buttons:', JSON.stringify(buttons, null, 2));

  // Check if it's unlock page
  const isUnlockPage = currentUrl.includes('unlock');
  console.log('\nIs unlock page:', isUnlockPage);

  if (isUnlockPage && password) {
    console.log('\n--- Attempting to unlock ---');

    // Try to find and fill password input
    const pwInput = await page.$('input[type="password"]');
    if (pwInput) {
      console.log('Found password input, filling...');
      await pwInput.fill(password);
      await page.waitForTimeout(500);

      // Take screenshot after filling password
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'metamask-state-2-password-filled.jpg'),
        type: 'jpeg',
        quality: 80
      });

      // Find and click unlock button
      const unlockBtn = await page.$('button[data-testid="unlock-submit"]');
      if (unlockBtn) {
        console.log('Found unlock button with data-testid="unlock-submit"');
        await unlockBtn.click();
      } else {
        // Try by text
        const btnByText = await page.$('button:has-text("Unlock")');
        if (btnByText) {
          console.log('Found unlock button by text');
          await btnByText.click();
        }
      }

      await page.waitForTimeout(3000);

      // Take screenshot after clicking unlock
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'metamask-state-3-after-unlock.jpg'),
        type: 'jpeg',
        quality: 80
      });

      // Check new URL
      const newUrl = page.url();
      console.log('URL after unlock:', newUrl);

      // Check if still has password input (unlock failed)
      const stillHasPassword = await page.$('input[type="password"]');
      console.log('Still has password input:', !!stillHasPassword);

      if (!stillHasPassword) {
        console.log('SUCCESS: MetaMask unlocked!');
      } else {
        console.log('FAILED: MetaMask still locked');
      }
    }
  }

  // Close after analysis
  console.log('\nAnalysis complete. Closing browser...');
  await context.close();
}

main().catch(console.error);
