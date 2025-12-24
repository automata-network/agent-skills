/**
 * Vision-based commands for AI agent visual analysis
 * These commands take screenshots for AI to analyze and accept coordinates for interactions
 */

const path = require('path');
const { SCREENSHOTS_DIR } = require('../lib/config');
const { ensureBrowser, takeScreenshot, getPage, getContext } = require('../lib/browser');
const { handleWalletPopup } = require('../lib/wallet-utils');

const commands = {
  async 'vision-screenshot'(args, options) {
    await ensureBrowser(options);
    const page = getPage();

    const name = args[0] || `vision-${Date.now()}`;
    const filepath = await takeScreenshot(name);

    const viewport = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      fullWidth: document.documentElement.scrollWidth,
      fullHeight: document.documentElement.scrollHeight,
    }));

    console.log(JSON.stringify({
      success: true,
      screenshot: filepath,
      viewport,
      url: page.url(),
      title: await page.title(),
      instruction: 'Use the Read tool to view this screenshot and analyze the page content visually. Then use vision-click with x,y coordinates to interact.'
    }));
  },

  async 'vision-click'(args, options) {
    await ensureBrowser(options);
    const page = getPage();
    const context = getContext();

    const x = parseInt(args[0]);
    const y = parseInt(args[1]);

    if (isNaN(x) || isNaN(y)) {
      console.log(JSON.stringify({
        success: false,
        error: 'X and Y coordinates required. Usage: vision-click <x> <y>'
      }));
      return;
    }

    await page.mouse.click(x, y);

    // Auto-detect wallet popup after click (if wallet mode and not ignored)
    let walletResult = null;
    if (options.wallet && options.walletAction !== 'ignore') {
      walletResult = await handleWalletPopup(
        context,
        options.walletAction || 'approve',
        3000
      );
    }

    if (options.wait) {
      await page.waitForTimeout(parseInt(options.wait));
    } else {
      await page.waitForTimeout(500);
    }

    let screenshotPath = null;
    if (options.screenshot) {
      screenshotPath = await takeScreenshot(options.screenshot);
    } else {
      screenshotPath = await takeScreenshot(`after-click-${x}-${y}`);
    }

    const result = {
      success: true,
      action: 'vision-click',
      coordinates: { x, y },
      screenshot: screenshotPath,
      url: page.url(),
      instruction: 'Click performed. Use the Read tool to view the screenshot and verify the result.'
    };

    if (walletResult && walletResult.hasPopup) {
      result.walletPopup = walletResult;
    }

    console.log(JSON.stringify(result));
  },

  async 'vision-double-click'(args, options) {
    await ensureBrowser(options);
    const page = getPage();

    const x = parseInt(args[0]);
    const y = parseInt(args[1]);

    if (isNaN(x) || isNaN(y)) {
      console.log(JSON.stringify({
        success: false,
        error: 'X and Y coordinates required. Usage: vision-double-click <x> <y>'
      }));
      return;
    }

    await page.mouse.dblclick(x, y);

    if (options.wait) {
      await page.waitForTimeout(parseInt(options.wait));
    } else {
      await page.waitForTimeout(500);
    }

    const screenshotPath = await takeScreenshot(options.screenshot || `after-dblclick-${x}-${y}`);

    console.log(JSON.stringify({
      success: true,
      action: 'vision-double-click',
      coordinates: { x, y },
      screenshot: screenshotPath,
      url: page.url()
    }));
  },

  async 'vision-type'(args, options) {
    await ensureBrowser(options);
    const page = getPage();

    const text = args.join(' ');
    if (!text) {
      console.log(JSON.stringify({
        success: false,
        error: 'Text required. Usage: vision-type <text>'
      }));
      return;
    }

    await page.keyboard.type(text, { delay: 50 });

    if (options.wait) {
      await page.waitForTimeout(parseInt(options.wait));
    }

    const screenshotPath = await takeScreenshot(options.screenshot || `after-type-${Date.now()}`);

    console.log(JSON.stringify({
      success: true,
      action: 'vision-type',
      text: text.substring(0, 20) + (text.length > 20 ? '...' : ''),
      screenshot: screenshotPath
    }));
  },

  async 'vision-press-key'(args, options) {
    await ensureBrowser(options);
    const page = getPage();

    const key = args[0];
    if (!key) {
      console.log(JSON.stringify({
        success: false,
        error: 'Key required. Usage: vision-press-key <key> (e.g., Enter, Tab, Escape, ArrowDown)'
      }));
      return;
    }

    await page.keyboard.press(key);

    if (options.wait) {
      await page.waitForTimeout(parseInt(options.wait));
    } else {
      await page.waitForTimeout(300);
    }

    const screenshotPath = await takeScreenshot(options.screenshot || `after-key-${key}`);

    console.log(JSON.stringify({
      success: true,
      action: 'vision-press-key',
      key,
      screenshot: screenshotPath
    }));
  },

  async 'vision-scroll'(args, options) {
    await ensureBrowser(options);
    const page = getPage();

    const direction = args[0] || 'down';
    const amount = parseInt(args[1]) || 500;

    let deltaX = 0;
    let deltaY = 0;

    switch (direction.toLowerCase()) {
      case 'down':
        deltaY = amount;
        break;
      case 'up':
        deltaY = -amount;
        break;
      case 'right':
        deltaX = amount;
        break;
      case 'left':
        deltaX = -amount;
        break;
      default:
        deltaY = amount;
    }

    await page.mouse.wheel(deltaX, deltaY);
    await page.waitForTimeout(500);

    const screenshotPath = await takeScreenshot(options.screenshot || `after-scroll-${direction}`);

    console.log(JSON.stringify({
      success: true,
      action: 'vision-scroll',
      direction,
      amount,
      screenshot: screenshotPath,
      instruction: 'Page scrolled. Use the Read tool to view the new screenshot.'
    }));
  },

  async 'vision-hover'(args, options) {
    await ensureBrowser(options);
    const page = getPage();

    const x = parseInt(args[0]);
    const y = parseInt(args[1]);

    if (isNaN(x) || isNaN(y)) {
      console.log(JSON.stringify({
        success: false,
        error: 'X and Y coordinates required. Usage: vision-hover <x> <y>'
      }));
      return;
    }

    await page.mouse.move(x, y);

    if (options.wait) {
      await page.waitForTimeout(parseInt(options.wait));
    } else {
      await page.waitForTimeout(500);
    }

    const screenshotPath = await takeScreenshot(options.screenshot || `after-hover-${x}-${y}`);

    console.log(JSON.stringify({
      success: true,
      action: 'vision-hover',
      coordinates: { x, y },
      screenshot: screenshotPath,
      instruction: 'Mouse moved to coordinates. Any hover effects should be visible in the screenshot.'
    }));
  },

  async 'vision-drag'(args, options) {
    await ensureBrowser(options);
    const page = getPage();

    const x1 = parseInt(args[0]);
    const y1 = parseInt(args[1]);
    const x2 = parseInt(args[2]);
    const y2 = parseInt(args[3]);

    if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
      console.log(JSON.stringify({
        success: false,
        error: 'Start and end coordinates required. Usage: vision-drag <x1> <y1> <x2> <y2>'
      }));
      return;
    }

    await page.mouse.move(x1, y1);
    await page.mouse.down();
    await page.mouse.move(x2, y2, { steps: 10 });
    await page.mouse.up();

    await page.waitForTimeout(500);

    const screenshotPath = await takeScreenshot(options.screenshot || `after-drag`);

    console.log(JSON.stringify({
      success: true,
      action: 'vision-drag',
      from: { x: x1, y: y1 },
      to: { x: x2, y: y2 },
      screenshot: screenshotPath
    }));
  },

  async 'vision-wait-stable'(args, options) {
    await ensureBrowser(options);
    const page = getPage();

    const maxWait = parseInt(args[0]) || 5000;

    try {
      await page.waitForLoadState('networkidle', { timeout: maxWait });
    } catch (e) {
      // Timeout is ok, just continue
    }

    await page.waitForTimeout(500);

    const screenshotPath = await takeScreenshot(options.screenshot || `stable-${Date.now()}`);

    console.log(JSON.stringify({
      success: true,
      screenshot: screenshotPath,
      url: page.url(),
      instruction: 'Page stabilized. Use the Read tool to analyze the screenshot.'
    }));
  },

  async 'vision-get-page-info'(args, options) {
    await ensureBrowser(options);
    const page = getPage();

    const screenshotPath = await takeScreenshot(options.screenshot || `page-info-${Date.now()}`);

    const pageInfo = await page.evaluate(() => ({
      url: window.location.href,
      title: document.title,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      scroll: {
        x: window.scrollX,
        y: window.scrollY,
        maxX: document.documentElement.scrollWidth - window.innerWidth,
        maxY: document.documentElement.scrollHeight - window.innerHeight,
      },
    }));

    console.log(JSON.stringify({
      success: true,
      screenshot: screenshotPath,
      pageInfo,
      instruction: 'Use the Read tool to view the screenshot. Analyze visually to determine: 1) What is on the page 2) What actions are available 3) If login is required 4) Where to click next'
    }));
  },
};

module.exports = commands;
