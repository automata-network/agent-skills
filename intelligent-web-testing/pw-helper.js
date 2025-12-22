#!/usr/bin/env node
/**
 * Playwright Helper - Lightweight CLI for AI Agent
 *
 * Allows AI agents to execute Playwright commands directly from bash.
 * Maintains browser state across commands using a simple state file.
 *
 * Usage:
 *   node pw-helper.js <command> [args...] [options]
 *
 * Commands:
 *   start                    - Start browser session
 *   stop                     - Stop browser session
 *   navigate <url>           - Navigate to URL
 *   click <selector>         - Click element
 *   fill <selector> <value>  - Fill input field
 *   select <selector> <value> - Select dropdown option
 *   check <selector>         - Check checkbox
 *   uncheck <selector>       - Uncheck checkbox
 *   hover <selector>         - Hover over element
 *   press <selector> <key>   - Press key on element
 *   screenshot [name]        - Take screenshot
 *   content                  - Get page HTML content
 *   text <selector>          - Get element text
 *   evaluate <js>            - Evaluate JavaScript
 *   wait <ms>                - Wait milliseconds
 *   wait-for <selector>      - Wait for element
 *   list-elements            - List all interactive elements
 *   run-test <json>          - Run test from JSON
 *
 * Options:
 *   --screenshot <name>      - Take screenshot after action
 *   --wait <ms>              - Wait after action
 *   --mobile                 - Use mobile viewport
 *   --headless               - Run headless (default: true)
 *   --headed                 - Run with visible browser
 *   --timeout <ms>           - Action timeout (default: 10000)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const OUTPUT_DIR = './test-output';
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, 'screenshots');
const STATE_FILE = path.join(OUTPUT_DIR, '.browser-state.json');

// Ensure output directories exist
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

// Parse command line arguments
function parseArgs(args) {
  const result = {
    command: args[0],
    args: [],
    options: {
      screenshot: null,
      wait: 0,
      mobile: false,
      headless: true,
      timeout: 10000,
    }
  };

  let i = 1;
  while (i < args.length) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const option = arg.slice(2);
      if (option === 'mobile' || option === 'headed') {
        result.options[option === 'headed' ? 'headless' : option] = option !== 'headed';
      } else if (option === 'headless') {
        result.options.headless = true;
      } else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        result.options[option] = args[++i];
      }
    } else {
      result.args.push(arg);
    }
    i++;
  }

  return result;
}

// Browser session management
let browser = null;
let context = null;
let page = null;

async function startBrowser(options) {
  if (browser) return;

  browser = await chromium.launch({
    headless: options.headless
  });

  const contextOptions = {
    viewport: options.mobile
      ? { width: 390, height: 844 }
      : { width: 1920, height: 1080 },
  };

  if (options.mobile) {
    contextOptions.isMobile = true;
    contextOptions.hasTouch = true;
    contextOptions.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15';
  }

  context = await browser.newContext(contextOptions);
  page = await context.newPage();

  // Capture console logs
  page.on('console', msg => {
    const logFile = path.join(OUTPUT_DIR, 'console-logs.txt');
    const logLine = `[${new Date().toISOString()}] [${msg.type()}] ${msg.text()}\n`;
    fs.appendFileSync(logFile, logLine);
  });

  // Capture errors
  page.on('pageerror', error => {
    const logFile = path.join(OUTPUT_DIR, 'console-logs.txt');
    const logLine = `[${new Date().toISOString()}] [ERROR] ${error.message}\n`;
    fs.appendFileSync(logFile, logLine);
  });

  console.log(JSON.stringify({ success: true, message: 'Browser started' }));
}

async function stopBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
    context = null;
    page = null;
  }
  console.log(JSON.stringify({ success: true, message: 'Browser stopped' }));
}

async function ensureBrowser(options) {
  if (!browser) {
    await startBrowser(options);
  }
}

// Take screenshot helper
async function takeScreenshot(name) {
  const filename = name || `screenshot-${Date.now()}.png`;
  const filepath = path.join(SCREENSHOTS_DIR, filename.endsWith('.png') ? filename : `${filename}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  return filepath;
}

// Commands
const commands = {
  async start(args, options) {
    await startBrowser(options);
  },

  async stop(args, options) {
    await stopBrowser();
  },

  async navigate(args, options) {
    await ensureBrowser(options);
    const url = args[0];
    if (!url) throw new Error('URL required');

    await page.goto(url, { waitUntil: 'networkidle', timeout: parseInt(options.timeout) });
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
    const selector = args[0];
    if (!selector) throw new Error('Selector required');

    await page.click(selector, { timeout: parseInt(options.timeout) });

    if (options.wait) await page.waitForTimeout(parseInt(options.wait));

    let screenshotPath = null;
    if (options.screenshot) {
      screenshotPath = await takeScreenshot(options.screenshot);
    }

    console.log(JSON.stringify({
      success: true,
      action: 'click',
      selector,
      screenshot: screenshotPath
    }));
  },

  async fill(args, options) {
    await ensureBrowser(options);
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
    const content = await page.content();

    // Save to file for large content
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
    const ms = parseInt(args[0]) || 1000;
    await page.waitForTimeout(ms);

    console.log(JSON.stringify({
      success: true,
      waited: ms
    }));
  },

  async 'wait-for'(args, options) {
    await ensureBrowser(options);
    const selector = args[0];
    if (!selector) throw new Error('Selector required');

    await page.waitForSelector(selector, { timeout: parseInt(options.timeout) });

    console.log(JSON.stringify({
      success: true,
      selector,
      found: true
    }));
  },

  async 'list-elements'(args, options) {
    await ensureBrowser(options);

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

      // Helper to get selector
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
    const results = [];

    await ensureBrowser(options);

    for (const step of testConfig.steps || []) {
      try {
        const { action, ...params } = step;

        if (action === 'navigate') {
          await page.goto(params.url, { waitUntil: 'networkidle' });
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

        // Take screenshot if requested
        if (step.screenshot) {
          await takeScreenshot(step.screenshot);
        }

      } catch (error) {
        results.push({ step, success: false, error: error.message });
      }
    }

    console.log(JSON.stringify({
      success: results.every(r => r.success),
      results
    }));
  },

  async help() {
    console.log(`
Playwright Helper - CLI for AI Agent

Commands:
  start                     Start browser session
  stop                      Stop browser session
  navigate <url>            Navigate to URL
  click <selector>          Click element
  fill <selector> <value>   Fill input field
  select <selector> <value> Select dropdown option
  check <selector>          Check checkbox
  uncheck <selector>        Uncheck checkbox
  hover <selector>          Hover over element
  press <selector> <key>    Press key on element
  screenshot [name]         Take screenshot
  content                   Get page HTML content
  text <selector>           Get element text
  evaluate <js>             Evaluate JavaScript
  wait <ms>                 Wait milliseconds
  wait-for <selector>       Wait for element
  list-elements             List all interactive elements
  run-test <json>           Run test from JSON file

Options:
  --screenshot <name>       Take screenshot after action
  --wait <ms>               Wait after action
  --mobile                  Use mobile viewport
  --headed                  Run with visible browser
  --timeout <ms>            Action timeout (default: 10000)

Examples:
  node pw-helper.js navigate "http://localhost:3000" --screenshot home.png
  node pw-helper.js click "#submit-btn" --wait 1000 --screenshot after-submit.png
  node pw-helper.js fill "#email" "test@example.com"
  node pw-helper.js list-elements
`);
  }
};

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    await commands.help();
    return;
  }

  const parsed = parseArgs(args);
  const command = commands[parsed.command];

  if (!command) {
    console.log(JSON.stringify({
      success: false,
      error: `Unknown command: ${parsed.command}`
    }));
    process.exit(1);
  }

  try {
    await command(parsed.args, parsed.options);
  } catch (error) {
    console.log(JSON.stringify({
      success: false,
      error: error.message
    }));
    process.exit(1);
  } finally {
    // Auto-close browser after command (except for 'start')
    if (parsed.command !== 'start' && browser) {
      await browser.close();
    }
  }
}

main().catch(error => {
  console.log(JSON.stringify({
    success: false,
    error: error.message
  }));
  process.exit(1);
});
