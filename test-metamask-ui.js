#!/usr/bin/env node
/**
 * Test script to analyze MetaMask UI and determine selectors
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.resolve(process.cwd(), 'test-output');
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, 'screenshots');
const EXTENSIONS_DIR = path.join(OUTPUT_DIR, 'extensions');
const USER_DATA_DIR = path.join(OUTPUT_DIR, 'chrome-profile-test');
const CDP_PORT = 9223; // Use different port to avoid conflicts

async function main() {
  // Ensure directories exist
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  // Clean previous test profile
  if (fs.existsSync(USER_DATA_DIR)) {
    fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
  }

  const metamaskPath = path.join(EXTENSIONS_DIR, 'metamask');

  if (!fs.existsSync(path.join(metamaskPath, 'manifest.json'))) {
    console.log('MetaMask extension not found!');
    process.exit(1);
  }

  console.log('Starting browser with MetaMask extension...');

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
    args: [
      '--no-first-run',
      '--disable-blink-features=AutomationControlled',
      `--disable-extensions-except=${path.resolve(metamaskPath)}`,
      `--load-extension=${path.resolve(metamaskPath)}`,
      `--remote-debugging-port=${CDP_PORT}`,
      '--disable-popup-blocking',
      '--disable-background-timer-throttling',
    ],
    ignoreDefaultArgs: ['--disable-extensions', '--enable-automation'],
    viewport: { width: 1920, height: 1080 },
  });

  console.log('Browser started, waiting for MetaMask extension...');

  // Wait for extension service worker
  let extensionId = null;
  try {
    let serviceWorker = context.serviceWorkers()[0];
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker', { timeout: 15000 });
    }
    const swUrl = serviceWorker.url();
    extensionId = swUrl.split('/')[2];
    console.log('MetaMask extension ID:', extensionId);
  } catch (e) {
    console.log('Service worker detection failed, trying fallback...');

    // Fallback: check pages
    await new Promise(r => setTimeout(r, 3000));
    const pages = context.pages();
    for (const p of pages) {
      const url = p.url();
      if (url.startsWith('chrome-extension://')) {
        extensionId = url.split('/')[2];
        console.log('Extension ID from page:', extensionId);
        break;
      }
    }
  }

  if (!extensionId) {
    console.log('Could not detect MetaMask extension ID');
    await context.close();
    process.exit(1);
  }

  // Open MetaMask home page in a new tab
  const metamaskPage = await context.newPage();
  const homeUrl = `chrome-extension://${extensionId}/home.html`;

  console.log('Opening MetaMask at:', homeUrl);
  await metamaskPage.goto(homeUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for page to fully load
  await metamaskPage.waitForTimeout(3000);

  // Take screenshot of initial state
  const screenshot1 = path.join(SCREENSHOTS_DIR, 'metamask-ui-1-initial.png');
  await metamaskPage.screenshot({ path: screenshot1, fullPage: true });
  console.log('Screenshot saved:', screenshot1);

  // Get page content for analysis
  const pageContent = await metamaskPage.content();
  const pageUrl = metamaskPage.url();

  console.log('\n=== Page URL ===');
  console.log(pageUrl);

  console.log('\n=== Looking for buttons and interactive elements ===');

  // Find all buttons
  const buttons = await metamaskPage.$$eval('button', elements =>
    elements.map(el => ({
      text: el.innerText.trim().substring(0, 100),
      testId: el.getAttribute('data-testid'),
      className: el.className,
      id: el.id,
      visible: el.offsetParent !== null
    }))
  );

  console.log('\nButtons found:');
  buttons.forEach((btn, i) => {
    if (btn.text || btn.testId) {
      console.log(`  ${i + 1}. text="${btn.text}" testId="${btn.testId}" visible=${btn.visible}`);
    }
  });

  // Find all inputs
  const inputs = await metamaskPage.$$eval('input', elements =>
    elements.map(el => ({
      type: el.type,
      testId: el.getAttribute('data-testid'),
      placeholder: el.placeholder,
      name: el.name,
      id: el.id,
      visible: el.offsetParent !== null
    }))
  );

  console.log('\nInputs found:');
  inputs.forEach((inp, i) => {
    console.log(`  ${i + 1}. type="${inp.type}" testId="${inp.testId}" placeholder="${inp.placeholder}" id="${inp.id}" visible=${inp.visible}`);
  });

  // Find checkboxes
  const checkboxes = await metamaskPage.$$eval('input[type="checkbox"]', elements =>
    elements.map(el => ({
      testId: el.getAttribute('data-testid'),
      name: el.name,
      id: el.id,
      checked: el.checked,
      visible: el.offsetParent !== null
    }))
  );

  console.log('\nCheckboxes found:');
  checkboxes.forEach((cb, i) => {
    console.log(`  ${i + 1}. testId="${cb.testId}" name="${cb.name}" id="${cb.id}" checked=${cb.checked} visible=${cb.visible}`);
  });

  // Find all links
  const links = await metamaskPage.$$eval('a', elements =>
    elements.map(el => ({
      text: el.innerText.trim().substring(0, 50),
      href: el.href,
      testId: el.getAttribute('data-testid'),
      visible: el.offsetParent !== null
    }))
  );

  console.log('\nLinks found:');
  links.forEach((link, i) => {
    if (link.text || link.testId) {
      console.log(`  ${i + 1}. text="${link.text}" testId="${link.testId}" visible=${link.visible}`);
    }
  });

  // Find elements with data-testid
  const testIdElements = await metamaskPage.$$eval('[data-testid]', elements =>
    elements.map(el => ({
      tag: el.tagName.toLowerCase(),
      testId: el.getAttribute('data-testid'),
      text: el.innerText?.trim().substring(0, 50) || '',
      visible: el.offsetParent !== null
    }))
  );

  console.log('\nElements with data-testid:');
  testIdElements.forEach((el, i) => {
    console.log(`  ${i + 1}. <${el.tag}> testId="${el.testId}" text="${el.text}" visible=${el.visible}`);
  });

  // Try clicking the terms checkbox if visible
  console.log('\n=== Attempting to interact with onboarding flow ===');

  try {
    const termsCheckbox = await metamaskPage.$('input[data-testid="onboarding-terms-checkbox"]');
    if (termsCheckbox) {
      const isVisible = await termsCheckbox.isVisible();
      console.log('Terms checkbox found, visible:', isVisible);
      if (isVisible) {
        await termsCheckbox.click();
        await metamaskPage.waitForTimeout(500);
        console.log('Clicked terms checkbox');

        // Take another screenshot
        const screenshot2 = path.join(SCREENSHOTS_DIR, 'metamask-ui-2-after-terms.png');
        await metamaskPage.screenshot({ path: screenshot2, fullPage: true });
        console.log('Screenshot saved:', screenshot2);
      }
    }
  } catch (e) {
    console.log('Terms checkbox interaction failed:', e.message);
  }

  // Try to find and click "Import an existing wallet" button
  try {
    const importBtn = await metamaskPage.$('[data-testid="onboarding-import-wallet"]');
    if (importBtn) {
      const isVisible = await importBtn.isVisible();
      console.log('Import wallet button found, visible:', isVisible);
      if (isVisible) {
        await importBtn.click();
        await metamaskPage.waitForTimeout(2000);
        console.log('Clicked import wallet button');

        // Take screenshot of next page
        const screenshot3 = path.join(SCREENSHOTS_DIR, 'metamask-ui-3-after-import-click.png');
        await metamaskPage.screenshot({ path: screenshot3, fullPage: true });
        console.log('Screenshot saved:', screenshot3);

        // Analyze new page
        const newTestIdElements = await metamaskPage.$$eval('[data-testid]', elements =>
          elements.map(el => ({
            tag: el.tagName.toLowerCase(),
            testId: el.getAttribute('data-testid'),
            text: el.innerText?.trim().substring(0, 50) || '',
            visible: el.offsetParent !== null
          }))
        );

        console.log('\nElements with data-testid on new page:');
        newTestIdElements.forEach((el, i) => {
          console.log(`  ${i + 1}. <${el.tag}> testId="${el.testId}" text="${el.text}" visible=${el.visible}`);
        });
      }
    }
  } catch (e) {
    console.log('Import button interaction failed:', e.message);
  }

  // Try clicking metrics decline button
  try {
    const noThanksBtn = await metamaskPage.$('[data-testid="metametrics-no-thanks"]');
    if (noThanksBtn) {
      const isVisible = await noThanksBtn.isVisible();
      console.log('No thanks button found, visible:', isVisible);
      if (isVisible) {
        await noThanksBtn.click();
        await metamaskPage.waitForTimeout(2000);
        console.log('Clicked no thanks button');

        // Take screenshot of SRP page
        const screenshot4 = path.join(SCREENSHOTS_DIR, 'metamask-ui-4-srp-page.png');
        await metamaskPage.screenshot({ path: screenshot4, fullPage: true });
        console.log('Screenshot saved:', screenshot4);

        // Analyze SRP input page
        const srpInputs = await metamaskPage.$$eval('input', elements =>
          elements.map(el => ({
            type: el.type,
            testId: el.getAttribute('data-testid'),
            placeholder: el.placeholder,
            name: el.name,
            id: el.id,
            visible: el.offsetParent !== null
          }))
        );

        console.log('\nInputs on SRP page:');
        srpInputs.forEach((inp, i) => {
          console.log(`  ${i + 1}. type="${inp.type}" testId="${inp.testId}" placeholder="${inp.placeholder}" visible=${inp.visible}`);
        });

        const srpButtons = await metamaskPage.$$eval('button', elements =>
          elements.map(el => ({
            text: el.innerText.trim().substring(0, 100),
            testId: el.getAttribute('data-testid'),
            visible: el.offsetParent !== null
          }))
        );

        console.log('\nButtons on SRP page:');
        srpButtons.forEach((btn, i) => {
          if (btn.text || btn.testId) {
            console.log(`  ${i + 1}. text="${btn.text}" testId="${btn.testId}" visible=${btn.visible}`);
          }
        });
      }
    }
  } catch (e) {
    console.log('No thanks button interaction failed:', e.message);
  }

  console.log('\n=== Test Complete ===');
  console.log('Screenshots saved to:', SCREENSHOTS_DIR);
  console.log('Browser will remain open for manual inspection.');
  console.log('Press Ctrl+C to exit.');

  // Keep browser open for inspection
  await new Promise(() => {}); // Wait forever
}

main().catch(console.error);
