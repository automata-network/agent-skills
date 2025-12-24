/**
 * Login detection commands
 */

const path = require('path');
const { SCREENSHOTS_DIR } = require('../lib/config');
const { ensureBrowser, takeScreenshot, getPage } = require('../lib/browser');

const commands = {
  async 'detect-login-required'(args, options) {
    await ensureBrowser(options);
    const page = getPage();

    try {
      const detection = await page.evaluate(() => {
        const body = document.body;
        const bodyText = body.textContent?.toLowerCase() || '';
        const bodyHtml = body.innerHTML?.toLowerCase() || '';

        // Check for login modal indicators
        const modalSelectors = [
          '[role="dialog"]',
          '.modal',
          '[class*="Modal"]',
          '[class*="modal"]',
          '[class*="popup"]',
          '[class*="overlay"]',
        ];

        let hasModal = false;
        let modalContent = '';
        for (const selector of modalSelectors) {
          const modal = document.querySelector(selector);
          if (modal && modal.offsetParent !== null) {
            hasModal = true;
            modalContent = modal.textContent?.toLowerCase() || '';
            break;
          }
        }

        // Check for login-related keywords
        const loginKeywords = [
          'sign in', 'signin', 'log in', 'login', 'connect wallet',
          'connect your wallet', 'authentication', 'authenticate',
          'create account', 'sign up', 'signup', 'register',
          'enter your email', 'enter email', 'email address',
          'password', 'continue with google', 'continue with github',
        ];

        const textToCheck = hasModal ? modalContent : bodyText;
        const hasLoginKeywords = loginKeywords.some(keyword => textToCheck.includes(keyword));

        // Check for email/password inputs
        const hasEmailInput = !!document.querySelector('input[type="email"], input[placeholder*="email"]');
        const hasPasswordInput = !!document.querySelector('input[type="password"]');

        // Check if user is already logged in
        const findButtonByText = (texts) => {
          const buttons = document.querySelectorAll('button');
          for (const btn of buttons) {
            const btnText = btn.textContent?.toLowerCase() || '';
            for (const text of texts) {
              if (btnText.includes(text.toLowerCase())) return btn;
            }
          }
          return null;
        };

        const loggedInIndicators = [
          /0x[a-fA-F0-9]{4}[.…][a-fA-F0-9]{4}/.test(bodyText),
          !!document.querySelector('[data-testid="account-button"]'),
          !!document.querySelector('[data-testid="user-menu"]'),
          !!findButtonByText(['disconnect', 'logout', 'log out', 'sign out']),
          !!document.querySelector('[class*="avatar"]'),
        ];

        const isLoggedIn = loggedInIndicators.some(v => v === true);

        // Determine login type
        let loginType = null;
        if (hasModal && hasLoginKeywords) {
          if (bodyHtml.includes('wallet') || bodyHtml.includes('0x')) {
            loginType = 'wallet';
          } else if (hasEmailInput || hasPasswordInput) {
            loginType = 'email';
          } else {
            loginType = 'social';
          }
        }

        // Get available login options
        const availableOptions = [];
        if (bodyHtml.includes('google')) availableOptions.push('google');
        if (bodyHtml.includes('github')) availableOptions.push('github');
        if (bodyHtml.includes('twitter')) availableOptions.push('twitter');
        if (hasEmailInput) availableOptions.push('email');
        if (bodyHtml.includes('metamask')) availableOptions.push('metamask');

        return {
          loginRequired: hasModal && hasLoginKeywords && !isLoggedIn,
          hasModal,
          hasLoginKeywords,
          isLoggedIn,
          loginType,
          availableOptions,
          hasEmailInput,
          hasPasswordInput,
          modalContent: modalContent.substring(0, 200),
        };
      });

      const screenshotPath = path.join(SCREENSHOTS_DIR, 'login-detection.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });

      console.log(JSON.stringify({
        success: true,
        ...detection,
        screenshot: 'login-detection.png',
        recommendation: detection.loginRequired
          ? (detection.loginType === 'wallet'
            ? 'Use wallet-connect for automated login or wait-for-login for manual'
            : 'Use wait-for-login for manual login completion')
          : (detection.isLoggedIn ? 'Already logged in, proceed with testing' : 'No login required'),
      }));

    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        error: `Failed to detect login: ${error.message}`
      }));
    }
  },

  async 'wait-for-login'(args, options) {
    // Force headed mode for manual login
    if (options.headless) {
      options.headless = false;
      console.log(JSON.stringify({
        status: 'info',
        message: 'Switching to headed mode for manual login'
      }));
    }

    try {
      await ensureBrowser(options);
    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        error: 'HEADED_MODE_FAILED',
        message: 'Cannot open browser window for manual login. This command requires a display.',
        details: error.message,
        suggestion: 'If running in CI/container, use automated login methods or skip manual login tests.'
      }));
      process.exit(1);
    }

    const page = getPage();
    const maxWaitTime = parseInt(options.timeout) || 300000; // 5 minutes default
    const pollInterval = 2000;
    let elapsed = 0;
    let lastUrl = '';

    try {
      try {
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'wait-login-start.png'), fullPage: true });
      } catch (e) {}

      console.log(JSON.stringify({
        status: 'waiting',
        message: 'Waiting for manual login...',
        instructions: [
          'Please complete login in the browser window',
          'OAuth redirects are handled automatically',
          `Timeout: ${maxWaitTime / 1000} seconds`
        ],
        screenshot: 'wait-login-start.png'
      }));

      while (elapsed < maxWaitTime) {
        await page.waitForTimeout(pollInterval);
        elapsed += pollInterval;

        let currentUrl = '';
        try {
          currentUrl = page.url();
          if (currentUrl !== lastUrl) {
            console.log(JSON.stringify({
              status: 'url_changed',
              from: lastUrl.substring(0, 50),
              to: currentUrl.substring(0, 50)
            }));
            lastUrl = currentUrl;
          }
        } catch (e) {
          continue;
        }

        let loginState = null;
        try {
          loginState = await page.evaluate(() => {
            if (!document.body) return { navigating: true };

            const body = document.body.textContent || '';

            const findButtonByText = (texts) => {
              const buttons = document.querySelectorAll('button');
              for (const btn of buttons) {
                const btnText = btn.textContent?.toLowerCase() || '';
                for (const text of texts) {
                  if (btnText.includes(text.toLowerCase())) return btn;
                }
              }
              return null;
            };

            const loggedInIndicators = [
              /0x[a-fA-F0-9]{4}[.…][a-fA-F0-9]{4}/.test(body),
              !!document.querySelector('[data-testid="account-button"]'),
              !!document.querySelector('[data-testid="user-menu"]'),
              !!findButtonByText(['disconnect', 'logout', 'log out', 'sign out']),
              !!document.querySelector('[class*="avatar"]'),
            ];

            const modalGone = !document.querySelector('[role="dialog"]') &&
                            !document.querySelector('.modal:not(.hidden)');
            const noLoginForm = !document.querySelector('input[type="password"]');
            const addressMatch = body.match(/0x[a-fA-F0-9]{4,}[.…][a-fA-F0-9]{4,}/);

            return {
              navigating: false,
              isLoggedIn: loggedInIndicators.some(v => v === true),
              modalGone,
              noLoginForm,
              userAddress: addressMatch ? addressMatch[0] : null,
              hasAvatar: !!document.querySelector('[class*="avatar"]'),
            };
          });
        } catch (e) {
          console.log(JSON.stringify({
            status: 'page_navigating',
            elapsed: `${elapsed / 1000}s`,
            message: 'OAuth redirect in progress...'
          }));
          continue;
        }

        if (!loginState || loginState.navigating) continue;

        if (elapsed % 10000 === 0) {
          try {
            await page.screenshot({
              path: path.join(SCREENSHOTS_DIR, `wait-login-${elapsed/1000}s.png`),
              fullPage: true
            });
          } catch (e) {}
        }

        if (loginState.isLoggedIn || (loginState.modalGone && loginState.noLoginForm && elapsed > 10000)) {
          try {
            await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'wait-login-success.png'), fullPage: true });
          } catch (e) {}

          console.log(JSON.stringify({
            success: true,
            status: 'logged_in',
            message: 'Login completed successfully!',
            elapsed: `${elapsed / 1000}s`,
            userAddress: loginState.userAddress,
            hasAvatar: loginState.hasAvatar,
            screenshot: 'wait-login-success.png',
            finalUrl: currentUrl
          }));
          return;
        }

        if (elapsed % 30000 === 0) {
          console.log(JSON.stringify({
            status: 'still_waiting',
            elapsed: `${elapsed / 1000}s`,
            remaining: `${(maxWaitTime - elapsed) / 1000}s`
          }));
        }
      }

      try {
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'wait-login-timeout.png'), fullPage: true });
      } catch (e) {}

      console.log(JSON.stringify({
        success: false,
        status: 'timeout',
        message: `Login not completed within ${maxWaitTime / 1000} seconds`,
        screenshot: 'wait-login-timeout.png'
      }));

    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        error: `Wait for login failed: ${error.message}`
      }));
    }
  },
};

module.exports = commands;
