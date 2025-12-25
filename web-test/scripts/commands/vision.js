/**
 * Additional utility commands for AI agent
 * Note: Use click, fill, hover, press commands with selectors for element interactions
 */

const path = require('path');
const { SCREENSHOTS_DIR } = require('../lib/config');
const { ensureBrowser, takeScreenshot, getPage } = require('../lib/browser');

const commands = {
  /**
   * Press a keyboard key globally (without targeting an element)
   * Usage: press-key <key> (e.g., Enter, Tab, Escape, ArrowDown)
   */
  async 'press-key'(args, options) {
    await ensureBrowser(options);
    const page = getPage();

    const key = args[0];
    if (!key) {
      console.log(JSON.stringify({
        success: false,
        error: 'Key required. Usage: press-key <key> (e.g., Enter, Tab, Escape, ArrowDown)'
      }));
      return;
    }

    await page.keyboard.press(key);

    if (options.wait) {
      await page.waitForTimeout(parseInt(options.wait));
    } else {
      await page.waitForTimeout(300);
    }

    let screenshotPath = null;
    if (options.screenshot) {
      screenshotPath = await takeScreenshot(options.screenshot);
    }

    console.log(JSON.stringify({
      success: true,
      action: 'press-key',
      key,
      screenshot: screenshotPath
    }));
  },

  /**
   * Scroll the page
   * Usage: scroll <direction> [amount] (direction: up/down/left/right, amount: pixels)
   */
  async scroll(args, options) {
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

    let screenshotPath = null;
    if (options.screenshot) {
      screenshotPath = await takeScreenshot(options.screenshot);
    }

    console.log(JSON.stringify({
      success: true,
      action: 'scroll',
      direction,
      amount,
      screenshot: screenshotPath
    }));
  },

  /**
   * Wait for the page to become stable (network idle)
   * Usage: wait-stable [maxWaitMs]
   */
  async 'wait-stable'(args, options) {
    await ensureBrowser(options);
    const page = getPage();

    const maxWait = parseInt(args[0]) || 5000;

    try {
      await page.waitForLoadState('networkidle', { timeout: maxWait });
    } catch (e) {
      // Timeout is ok, just continue
    }

    await page.waitForTimeout(500);

    let screenshotPath = null;
    if (options.screenshot) {
      screenshotPath = await takeScreenshot(options.screenshot);
    }

    console.log(JSON.stringify({
      success: true,
      action: 'wait-stable',
      screenshot: screenshotPath,
      url: page.url()
    }));
  },

  /**
   * Get page info including viewport, scroll position, and screenshot
   * Usage: get-page-info
   */
  async 'get-page-info'(args, options) {
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
      instruction: 'Use the Read tool to view the screenshot. Use click/fill/hover commands with selectors to interact with elements.'
    }));
  },
};

module.exports = commands;
