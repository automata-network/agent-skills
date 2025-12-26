/**
 * Basic browser commands
 */

const fs = require('fs');
const path = require('path');
const { OUTPUT_DIR, SCREENSHOTS_DIR } = require('../lib/config');
const { startBrowser, stopBrowser, ensureBrowser, takeScreenshot, getPage, getContext } = require('../lib/browser');
const { ParallelScheduler } = require('../lib/scheduler');
const { handleWalletPopup } = require('../lib/wallet-utils');

const commands = {
  async start(args, options) {
    await startBrowser(options);
  },

  async stop(args, options) {
    await stopBrowser();
  },

  async 'browser-open'(args, options) {
    options.headless = false;
    await startBrowser(options);
    console.log(JSON.stringify({
      success: true,
      message: 'Browser opened and will stay open.',
      hint: 'Use other commands with --keep-open to reuse this browser, or browser-close to close it.'
    }));
  },

  async 'browser-close'(args, options) {
    await stopBrowser();
    console.log(JSON.stringify({
      success: true,
      message: 'Browser closed.',
      note: 'Login state and extensions are preserved in the user data directory.'
    }));
  },

  async navigate(args, options) {
    await ensureBrowser(options);
    const page = getPage();
    const url = args[0];
    if (!url) throw new Error('URL required');

    // First attempt: 10 seconds timeout with 'load' (faster than networkidle)
    let loaded = false;
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 10000 });
      loaded = true;
    } catch (e) {
      if (e.name === 'TimeoutError' || e.message.includes('Timeout')) {
        // Page didn't load in 10s, wait additional 20s
        console.log(JSON.stringify({
          status: 'warning',
          message: 'Page not fully loaded in 10s, waiting additional 20s...'
        }));
        try {
          await page.waitForLoadState('networkidle', { timeout: 20000 });
          loaded = true;
        } catch (e2) {
          // Still not loaded after 30s total, fail
          console.log(JSON.stringify({
            success: false,
            error: `Page failed to load after 30 seconds: ${url}`,
            url: page.url()
          }));
          return;
        }
      } else {
        throw e;
      }
    }

    const title = await page.title();

    let screenshotPath = null;
    if (options.screenshot) {
      screenshotPath = await takeScreenshot(options.screenshot);
    }

    console.log(JSON.stringify({
      success: true,
      url: page.url(),
      title,
      screenshot: screenshotPath
    }));
  },

  async click(args, options) {
    await ensureBrowser(options);
    const page = getPage();
    const context = getContext();
    const selector = args[0];
    if (!selector) throw new Error('Selector required');

    await page.click(selector, { timeout: parseInt(options.timeout) });

    // Auto-detect wallet popup after click (if wallet mode and not ignored)
    let walletResult = null;
    if (options.wallet && options.walletAction !== 'ignore') {
      walletResult = await handleWalletPopup(
        context,
        options.walletAction || 'approve',
        3000
      );
    }

    if (options.wait) await page.waitForTimeout(parseInt(options.wait));

    let screenshotPath = null;
    if (options.screenshot) {
      screenshotPath = await takeScreenshot(options.screenshot);
    }

    const result = {
      success: true,
      action: 'click',
      selector,
      screenshot: screenshotPath
    };

    if (walletResult && walletResult.hasPopup) {
      result.walletPopup = walletResult;
    }

    console.log(JSON.stringify(result));
  },

  async fill(args, options) {
    await ensureBrowser(options);
    const page = getPage();
    const [selector, value] = args;
    if (!selector || value === undefined) throw new Error('Selector and value required');

    await page.fill(selector, value, { timeout: parseInt(options.timeout) });

    let screenshotPath = null;
    if (options.screenshot) {
      screenshotPath = await takeScreenshot(options.screenshot);
    }

    console.log(JSON.stringify({
      success: true,
      action: 'fill',
      selector,
      value: value.substring(0, 20) + (value.length > 20 ? '...' : ''),
      screenshot: screenshotPath
    }));
  },

  async select(args, options) {
    await ensureBrowser(options);
    const page = getPage();
    const [selector, value] = args;
    if (!selector || !value) throw new Error('Selector and value required');

    await page.selectOption(selector, value, { timeout: parseInt(options.timeout) });

    let screenshotPath = null;
    if (options.screenshot) {
      screenshotPath = await takeScreenshot(options.screenshot);
    }

    console.log(JSON.stringify({
      success: true,
      action: 'select',
      selector,
      value,
      screenshot: screenshotPath
    }));
  },

  async check(args, options) {
    await ensureBrowser(options);
    const page = getPage();
    const selector = args[0];
    if (!selector) throw new Error('Selector required');

    await page.check(selector, { timeout: parseInt(options.timeout) });

    let screenshotPath = null;
    if (options.screenshot) {
      screenshotPath = await takeScreenshot(options.screenshot);
    }

    console.log(JSON.stringify({
      success: true,
      action: 'check',
      selector,
      screenshot: screenshotPath
    }));
  },

  async uncheck(args, options) {
    await ensureBrowser(options);
    const page = getPage();
    const selector = args[0];
    if (!selector) throw new Error('Selector required');

    await page.uncheck(selector, { timeout: parseInt(options.timeout) });

    let screenshotPath = null;
    if (options.screenshot) {
      screenshotPath = await takeScreenshot(options.screenshot);
    }

    console.log(JSON.stringify({
      success: true,
      action: 'uncheck',
      selector,
      screenshot: screenshotPath
    }));
  },

  async hover(args, options) {
    await ensureBrowser(options);
    const page = getPage();
    const selector = args[0];
    if (!selector) throw new Error('Selector required');

    await page.hover(selector, { timeout: parseInt(options.timeout) });

    let screenshotPath = null;
    if (options.screenshot) {
      screenshotPath = await takeScreenshot(options.screenshot);
    }

    console.log(JSON.stringify({
      success: true,
      action: 'hover',
      selector,
      screenshot: screenshotPath
    }));
  },

  async press(args, options) {
    await ensureBrowser(options);
    const page = getPage();
    const [selector, key] = args;
    if (!selector || !key) throw new Error('Selector and key required');

    await page.press(selector, key, { timeout: parseInt(options.timeout) });

    let screenshotPath = null;
    if (options.screenshot) {
      screenshotPath = await takeScreenshot(options.screenshot);
    }

    console.log(JSON.stringify({
      success: true,
      action: 'press',
      selector,
      key,
      screenshot: screenshotPath
    }));
  },

  async screenshot(args, options) {
    await ensureBrowser(options);
    const name = args[0] || `screenshot-${Date.now()}`;
    const filepath = await takeScreenshot(name);

    console.log(JSON.stringify({
      success: true,
      screenshot: filepath
    }));
  },

  async content(args, options) {
    await ensureBrowser(options);
    const page = getPage();
    const content = await page.content();

    const contentFile = path.join(OUTPUT_DIR, 'page-content.html');
    fs.writeFileSync(contentFile, content);

    console.log(JSON.stringify({
      success: true,
      contentFile,
      contentLength: content.length,
      preview: content.substring(0, 500) + '...'
    }));
  },

  async text(args, options) {
    await ensureBrowser(options);
    const page = getPage();
    const selector = args[0];
    if (!selector) throw new Error('Selector required');

    const text = await page.textContent(selector, { timeout: parseInt(options.timeout) });

    console.log(JSON.stringify({
      success: true,
      selector,
      text
    }));
  },

  async evaluate(args, options) {
    await ensureBrowser(options);
    const page = getPage();
    const script = args.join(' ');
    if (!script) throw new Error('JavaScript code required');

    const result = await page.evaluate(script);

    console.log(JSON.stringify({
      success: true,
      result
    }));
  },

  async wait(args, options) {
    await ensureBrowser(options);
    const page = getPage();
    const ms = parseInt(args[0]) || 1000;
    await page.waitForTimeout(ms);

    console.log(JSON.stringify({
      success: true,
      waited: ms
    }));
  },

  async 'wait-for'(args, options) {
    await ensureBrowser(options);
    const page = getPage();
    const selector = args[0];
    if (!selector) throw new Error('Selector required');

    await page.waitForSelector(selector, { timeout: parseInt(options.timeout) });

    console.log(JSON.stringify({
      success: true,
      selector,
      found: true
    }));
  },

  async 'set-viewport'(args, options) {
    await ensureBrowser(options);
    const page = getPage();

    const width = parseInt(args[0]);
    const height = parseInt(args[1]);

    if (isNaN(width) || isNaN(height)) {
      console.log(JSON.stringify({
        success: false,
        error: 'Width and height required. Usage: set-viewport <width> <height> [--mobile]'
      }));
      return;
    }

    // Set viewport size
    await page.setViewportSize({ width, height });

    // If mobile mode, also emulate mobile device properties via CDP
    if (options.mobile) {
      const cdpSession = await page.context().newCDPSession(page);
      await cdpSession.send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 2,
        mobile: true,
        screenWidth: width,
        screenHeight: height,
      });
      await cdpSession.send('Emulation.setTouchEmulationEnabled', {
        enabled: true,
        maxTouchPoints: 5
      });
      await cdpSession.send('Emulation.setUserAgentOverride', {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
      });
    }

    // Reload page to apply changes (short timeout, viewport change is quick)
    try {
      await page.reload({ waitUntil: 'load', timeout: 3000 });
    } catch (e) {
      // Ignore reload errors
    }

    const actualViewport = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    }));

    console.log(JSON.stringify({
      success: true,
      action: 'set-viewport',
      requested: { width, height, mobile: !!options.mobile },
      actual: actualViewport
    }));
  },

  async 'list-elements'(args, options) {
    await ensureBrowser(options);
    const page = getPage();

    const elements = await page.evaluate(() => {
      const results = {
        buttons: [],
        links: [],
        inputs: [],
        selects: [],
        checkboxes: [],
        radios: [],
        textareas: [],
        forms: [],
      };

      const getSelector = (el) => {
        if (el.id) return `#${el.id}`;
        if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
        if (el.name) return `[name="${el.name}"]`;
        if (el.className && typeof el.className === 'string') {
          const classes = el.className.split(' ').filter(c => c.length > 0);
          if (classes.length > 0) return `.${classes[0]}`;
        }
        return null;
      };

      // Buttons
      document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]').forEach(el => {
        const selector = getSelector(el);
        if (selector) {
          results.buttons.push({
            selector,
            text: el.textContent?.trim().substring(0, 50) || el.value || '',
            disabled: el.disabled || false
          });
        }
      });

      // Links
      document.querySelectorAll('a[href]').forEach(el => {
        const selector = getSelector(el);
        results.links.push({
          selector: selector || `a[href="${el.getAttribute('href')}"]`,
          text: el.textContent?.trim().substring(0, 50) || '',
          href: el.getAttribute('href')
        });
      });

      // Inputs
      document.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]):not([type="hidden"])').forEach(el => {
        const selector = getSelector(el);
        if (selector) {
          results.inputs.push({
            selector,
            type: el.type || 'text',
            placeholder: el.placeholder || '',
            name: el.name || ''
          });
        }
      });

      // Selects
      document.querySelectorAll('select').forEach(el => {
        const selector = getSelector(el);
        if (selector) {
          results.selects.push({
            selector,
            name: el.name || '',
            options: Array.from(el.options).slice(0, 5).map(o => o.value)
          });
        }
      });

      // Checkboxes
      document.querySelectorAll('input[type="checkbox"]').forEach(el => {
        const selector = getSelector(el);
        if (selector) {
          results.checkboxes.push({
            selector,
            name: el.name || '',
            checked: el.checked
          });
        }
      });

      // Radios
      document.querySelectorAll('input[type="radio"]').forEach(el => {
        const selector = getSelector(el);
        if (selector) {
          results.radios.push({
            selector,
            name: el.name || '',
            value: el.value,
            checked: el.checked
          });
        }
      });

      // Textareas
      document.querySelectorAll('textarea').forEach(el => {
        const selector = getSelector(el);
        if (selector) {
          results.textareas.push({
            selector,
            name: el.name || '',
            placeholder: el.placeholder || ''
          });
        }
      });

      // Forms
      document.querySelectorAll('form').forEach((el, i) => {
        const selector = getSelector(el) || `form:nth-of-type(${i + 1})`;
        results.forms.push({
          selector,
          action: el.action || '',
          method: el.method || 'get'
        });
      });

      return results;
    });

    // Save to file
    const elementsFile = path.join(OUTPUT_DIR, 'elements.json');
    fs.writeFileSync(elementsFile, JSON.stringify(elements, null, 2));

    const summary = {
      buttons: elements.buttons.length,
      links: elements.links.length,
      inputs: elements.inputs.length,
      selects: elements.selects.length,
      checkboxes: elements.checkboxes.length,
      radios: elements.radios.length,
      textareas: elements.textareas.length,
      forms: elements.forms.length,
      total: Object.values(elements).reduce((sum, arr) => sum + arr.length, 0)
    };

    console.log(JSON.stringify({
      success: true,
      summary,
      elementsFile,
      elements
    }));
  },

  async 'run-test'(args, options) {
    const jsonFile = args[0];
    if (!jsonFile) throw new Error('JSON file required');

    const testConfig = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));

    await ensureBrowser(options);
    const page = getPage();
    const context = getContext();

    // Check if this is a parallel test configuration
    if (testConfig.parallel && testConfig.tasks) {
      console.log(JSON.stringify({
        status: 'info',
        message: `Running ${testConfig.tasks.length} tasks in parallel mode (max ${options.maxParallel || 5} concurrent)`
      }));

      const scheduler = new ParallelScheduler(context, testConfig.tasks, {
        maxParallel: parseInt(options.maxParallel) || 5,
        failFast: options.failFast === 'true' || options.failFast === true,
        screenshotsDir: SCREENSHOTS_DIR
      });

      const result = await scheduler.run();

      console.log(JSON.stringify({
        success: result.success,
        mode: 'parallel',
        summary: {
          total: result.total,
          completed: result.completed,
          failed: result.failed,
          aborted: result.aborted
        },
        results: result.results
      }));
    } else {
      // Sequential execution mode
      const results = [];

      for (const step of testConfig.steps || []) {
        try {
          const { action, ...params } = step;

          if (action === 'navigate') {
            await page.goto(params.url, { waitUntil: 'load', timeout: 15000 });
          } else if (action === 'click') {
            await page.click(params.selector);
          } else if (action === 'fill') {
            await page.fill(params.selector, params.value);
          } else if (action === 'select') {
            await page.selectOption(params.selector, params.value);
          } else if (action === 'check') {
            await page.check(params.selector);
          } else if (action === 'wait') {
            await page.waitForTimeout(params.ms || 1000);
          } else if (action === 'screenshot') {
            await takeScreenshot(params.name);
          }

          results.push({ step, success: true });

          if (step.screenshot) {
            await takeScreenshot(step.screenshot);
          }

        } catch (error) {
          results.push({ step, success: false, error: error.message });
        }
      }

      console.log(JSON.stringify({
        success: results.every(r => r.success),
        mode: 'sequential',
        results
      }));
    }
  },
};

module.exports = commands;
